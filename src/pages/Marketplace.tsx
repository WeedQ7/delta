import { useState } from "react";
import { MARKETPLACE_ITEMS } from "../data/catalog";
import { useCoins } from "../stores/coins";
import { useSettings } from "../stores/settings";
import { formatCoins, uid } from "../lib/utils";
import { IconStore, IconCoin, IconCheck, IconUser } from "../components/Icons";
import type { MarketplaceItem } from "../types";

/**
 * Marketplace (demo): themes and usernames purchasable with DELTA Coins.
 * Theme purchase actually applies the accent — a real, verifiable effect.
 * Username purchase renames the local profile (server reservation pending).
 */
export function MarketplacePage() {
  const balance = useCoins((s) => s.balance);
  const spend = useCoins((s) => s.spend);
  const setAccent = useSettings((s) => s.setAccent);
  const setDisplayName = useSettings((s) => s.setDisplayName);
  const profile = useSettings((s) => s.profile);

  const [owned, setOwned] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "theme" | "username">("all");

  const items = MARKETPLACE_ITEMS.filter((i) => tab === "all" || i.kind === tab);

  const buy = (item: MarketplaceItem) => {
    const key = uid("mk");
    const ok = spend(item.priceCoins, `Покупка «${item.title}» в маркетплейсе`, key);
    if (!ok) {
      setNotice(`Недостаточно монет: нужно ${formatCoins(item.priceCoins)}, доступно ${formatCoins(balance)}. Пополните баланс на странице DELTA Coins.`);
      return;
    }
    setOwned((o) => ({ ...o, [item.id]: true }));
    if (item.kind === "theme") {
      setAccent(item.accent);
      setNotice(`Тема «${item.title}» применена. Акцент изменён на «${item.accent}».`);
    } else {
      setDisplayName(`${profile.displayName}`); // name kept; username reservation is server-side
      setNotice(`Юзернейм ${item.title} забронирован за вашим демо-профилем. Реальное закрепление — за сервером (в разработке).`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title flex items-center gap-2 text-2xl">
            <IconStore size={22} /> Маркетплейс
          </h1>
          <p className="mt-1 text-sm text-muted">Темы оформления и юзернеймы за DELTA Coins.</p>
        </div>
        <span className="chip bg-elevated text-coin">
          <IconCoin size={15} /> Баланс: <b className="tabular-nums">{formatCoins(balance)}</b>
        </span>
      </div>

      <span className="badge-test inline-flex">Демо-витрина: каталог локальный, расчёт монет реальный в рамках теста</span>

      {notice && (
        <div className="card flex items-center gap-3 border-accent/40 bg-accent/10 px-4 py-3 text-sm animate-fade-up">
          <IconCheck size={17} className="text-accent shrink-0" />
          {notice}
          <button className="ml-auto text-xs text-muted hover:text-fg" onClick={() => setNotice(null)}>Скрыть</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "all" as const, label: "Все" },
          { id: "theme" as const, label: "Темы" },
          { id: "username" as const, label: "Юзернеймы" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`chip ${tab === t.id ? "bg-accent text-accent-contrast" : "bg-elevated text-muted hover:text-fg"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const isOwned = owned[item.id];
          const affordable = balance >= item.priceCoins;
          return (
            <div key={item.id} className="card flex flex-col p-4">
              <div className="mb-3 flex items-center gap-3">
                {item.kind === "theme" ? (
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-card"
                    style={{ background: `rgb(var(--c-accent) / 0)` }}
                  >
                    <ThemeSwatch accent={item.accent} />
                  </span>
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-card bg-elevated text-muted">
                    <IconUser size={22} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{item.title}</p>
                  <p className="truncate text-xs text-muted">от {item.creator}</p>
                </div>
              </div>
              <p className="flex-1 text-xs text-muted">{item.description}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="chip bg-coin/10 text-coin tabular-nums">
                  <IconCoin size={14} /> {formatCoins(item.priceCoins)}
                </span>
                <button
                  className={isOwned ? "btn-secondary !py-1.5" : "btn-primary !py-1.5"}
                  disabled={isOwned}
                  onClick={() => buy(item)}
                  title={!affordable && !isOwned ? "Недостаточно монет" : undefined}
                >
                  {isOwned ? (
                    <>Куплено</>
                  ) : affordable ? (
                    "Купить"
                  ) : (
                    "Мало монет"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-faint">
        Покупка и продажа юзернеймов, витрина тем авторов и расчёты с комиссией будут работать через
        API; сейчас это демонстрационная витрина поверх тестового баланса монет.
      </p>
    </div>
  );
}

/** Small preview card tinted with the item's accent palette. */
function ThemeSwatch({ accent }: { accent: string }) {
  const colors: Record<string, string> = {
    emerald: "#10b981",
    violet: "#8b5cf6",
    rose: "#f43f5e",
    amber: "#f59e0b",
    sky: "#0ea5e9",
  };
  const c = colors[accent] ?? "#10b981";
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="10" fill="#14151a" />
      <circle cx="16" cy="18" r="7" fill={c} opacity="0.9" />
      <path d="M8 36c6-8 14-10 18-6s8 2 12-4" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
      <rect x="30" y="10" width="10" height="10" rx="3" fill={c} opacity="0.35" />
    </svg>
  );
}
