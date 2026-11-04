import { useState } from "react";
import { COIN_PACKS, PLATFORM_FEE_PERCENT } from "../data/catalog";
import { useCoins } from "../stores/coins";
import { formatCoins, formatDate, formatMoney, uid } from "../lib/utils";
import { IconCoin, IconCheck, IconClock } from "../components/Icons";
import { EmptyState } from "../components/EmptyState";
import type { CoinPack } from "../types";

/**
 * DELTA Coins — TEST MODE.
 * No real money is charged anywhere on this page. The ledger contract
 * (journal, idempotency, refunds) mirrors the future server implementation;
 * see comments in src/stores/coins.ts.
 */
export function CoinsPage() {
  const balance = useCoins((s) => s.balance);
  const transactions = useCoins((s) => s.transactions);
  const purchasePack = useCoins((s) => s.purchasePack);
  const demoTopUp = useCoins((s) => s.demoTopUp);
  const refund = useCoins((s) => s.refund);

  const [justBought, setJustBought] = useState<string | null>(null);

  const buy = (pack: CoinPack) => {
    // Idempotency key per click — duplicate submissions are no-ops.
    const key = uid("buy");
    purchasePack(pack, key);
    setJustBought(pack.id);
    setTimeout(() => setJustBought(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title flex items-center gap-2 text-2xl">
            <IconCoin size={22} className="text-coin" />
            DELTA Coins
          </h1>
          <p className="mt-1 text-sm text-muted">
            Внутренняя валюта платформы: темы и юзернеймы в маркетплейсе.
          </p>
        </div>
        <span className="badge-test">Тестовый режим — деньги не списываются</span>
      </div>

      {/* Balance card */}
      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Текущий баланс</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-coin">
            {formatCoins(balance)} <span className="text-base font-semibold">монет</span>
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => demoTopUp(100, "Демонстрационное начисление для тестов")}
        >
          +100 тестовых монет
        </button>
      </section>

      {/* Packs */}
      <section>
        <h2 className="section-title mb-3">Пакеты валюты</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COIN_PACKS.map((pack) => (
            <div key={pack.id} className={`card relative flex flex-col p-4 ${pack.popular ? "border-accent" : ""}`}>
              {pack.popular && (
                <span className="chip absolute -top-2 right-3 bg-accent text-accent-contrast">Популярный</span>
              )}
              <p className="text-sm font-bold">{pack.label}</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums">
                {formatCoins(pack.coins)}
                {pack.bonusCoins > 0 && (
                  <span className="ml-1 text-sm font-semibold text-accent">+{pack.bonusCoins}</span>
                )}
              </p>
              <p className="text-xs text-muted">монет</p>
              <p className="mt-3 text-lg font-bold tabular-nums">{formatMoney(pack.priceRub)}</p>
              <p className="text-[11px] text-faint">
                Комиссия платформы {PLATFORM_FEE_PERCENT}% учитывается сервером при продаже
              </p>
              <button
                className={`mt-4 w-full ${justBought === pack.id ? "btn-secondary" : "btn-primary"}`}
                onClick={() => buy(pack)}
              >
                {justBought === pack.id ? (
                  <>
                    <IconCheck size={15} /> Зачтено (тест)
                  </>
                ) : (
                  "Купить"
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Transaction journal */}
      <section>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <IconClock size={18} /> История операций
        </h2>
        {transactions.length === 0 ? (
          <EmptyState
            icon={<IconCoin size={22} />}
            title="Операций пока нет"
            hint="Купите пакет (тестовый режим) или нажмите «+100 тестовых монет», чтобы увидеть журнал."
          />
        ) : (
          <div className="card divide-y divide-line">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span
                  className={`w-16 shrink-0 text-right font-bold tabular-nums ${
                    tx.amount >= 0 ? "text-accent" : "text-danger"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {formatCoins(tx.amount)}
                </span>
                <span className="min-w-0 flex-1 truncate" title={tx.description}>
                  {tx.description}
                </span>
                <span className="text-xs text-faint tabular-nums">{formatDate(tx.createdAt)}</span>
                <span className="text-xs text-muted tabular-nums">
                  → {formatCoins(tx.balanceAfter)}
                </span>
                {tx.amount < 0 && tx.type !== "refund" && (
                  <button
                    className="text-xs text-muted hover:text-fg underline-offset-2 hover:underline"
                    onClick={() => refund(tx.id)}
                  >
                    Возврат
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-faint">
        Журнал неизменяемый: возвраты добавляются отдельной записью, баланс меняется атомарно,
        повторные запросы с тем же ключом идемпотентности игнорируются. В продакшене эти проверки
        выполняет сервер (NestJS + PostgreSQL), а не браузер.
      </p>
    </div>
  );
}
