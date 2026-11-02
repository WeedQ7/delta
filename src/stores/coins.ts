import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CoinPack, CoinTransaction } from "../types";
import { uid } from "../lib/utils";

/**
 * DELTA Coins — DEMO ledger running fully in the browser.
 *
 * IMPORTANT (honest status): this is NOT a real payment system. No money is
 * charged. In production every mutation below must move to the server:
 *  - balance changes inside a DB transaction (SELECT ... FOR UPDATE)
 *  - idempotency keys on purchase requests (duplicate protection)
 *  - refunds as separate ledger entries (never edit history)
 *  - platform fee configured by admins
 * The local implementation intentionally mirrors that contract:
 * operations are atomic per call, carry an idempotencyKey, and append
 * immutable journal rows with balanceAfter snapshots.
 */
interface CoinsState {
  balance: number;
  transactions: CoinTransaction[];
  /** demo top-up: instantly credits coins, clearly marked as test */
  demoTopUp: (coins: number, description: string) => void;
  /** simulated purchase of a pack (test mode, no real charge) */
  purchasePack: (pack: CoinPack, idempotencyKey: string) => boolean;
  /** spend coins (e.g. marketplace). Returns false when funds are missing. */
  spend: (amount: number, description: string, idempotencyKey?: string) => boolean;
  refund: (transactionId: string) => void;
}

const MAX_LOG = 100;

export const useCoins = create<CoinsState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],

      demoTopUp: (coins, description) =>
        set((s) => {
          const balance = s.balance + coins;
          const tx: CoinTransaction = {
            id: uid("tx"),
            createdAt: new Date().toISOString(),
            type: "topup_demo",
            amount: coins,
            balanceAfter: balance,
            description,
          };
          return { balance, transactions: [tx, ...s.transactions].slice(0, MAX_LOG) };
        }),

      purchasePack: (pack, idempotencyKey) => {
        const s = get();
        // duplicate-request protection
        if (s.transactions.some((t) => t.idempotencyKey === idempotencyKey)) {
          return true; // already processed
        }
        const credited = pack.coins + pack.bonusCoins;
        const balance = s.balance + credited;
        const tx: CoinTransaction = {
          id: uid("tx"),
          createdAt: new Date().toISOString(),
          type: "purchase",
          amount: credited,
          balanceAfter: balance,
          description: `Покупка пакета «${pack.label}» (${credited} монет) — ТЕСТ`,
          idempotencyKey,
        };
        set({ balance, transactions: [tx, ...s.transactions].slice(0, MAX_LOG) });
        return true;
      },

      spend: (amount, description, idempotencyKey) => {
        const s = get();
        if (idempotencyKey && s.transactions.some((t) => t.idempotencyKey === idempotencyKey)) {
          return true;
        }
        if (amount <= 0 || s.balance < amount) return false;
        const balance = s.balance - amount;
        const tx: CoinTransaction = {
          id: uid("tx"),
          createdAt: new Date().toISOString(),
          type: "spend",
          amount: -amount,
          balanceAfter: balance,
          description,
          idempotencyKey,
        };
        set({ balance, transactions: [tx, ...s.transactions].slice(0, MAX_LOG) });
        return true;
      },

      refund: (transactionId) =>
        set((s) => {
          const original = s.transactions.find((t) => t.id === transactionId);
          if (!original || original.amount >= 0) return s;
          // Refunds never rewrite history — they add a compensating entry.
          const alreadyRefunded = s.transactions.some(
            (t) => t.type === "refund" && t.description.includes(original.id)
          );
          if (alreadyRefunded) return s;
          const amount = -original.amount;
          const balance = s.balance + amount;
          const tx: CoinTransaction = {
            id: uid("tx"),
            createdAt: new Date().toISOString(),
            type: "refund",
            amount,
            balanceAfter: balance,
            description: `Возврат по операции ${original.id}: ${original.description}`,
          };
          return { balance, transactions: [tx, ...s.transactions].slice(0, MAX_LOG) };
        }),
    }),
    {
      name: "delta-coins",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
