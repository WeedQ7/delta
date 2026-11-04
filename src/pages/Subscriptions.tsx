import { useState } from "react";
import { PLANS, PLATFORM_FEE_PERCENT } from "../data/catalog";
import { useSettings } from "../stores/settings";
import { formatMoney } from "../lib/utils";
import { IconCheck, IconCrown } from "../components/Icons";
import type { PlanFeatures } from "../types";

const FEATURE_LABELS: Array<{ key: keyof PlanFeatures; label: string; bool?: boolean }> = [
  { key: "adFree", label: "Без рекламы", bool: true },
  { key: "losslessAudio", label: "Lossless-звук", bool: true },
  { key: "offlineDownloads", label: "Офлайн-прослушивание", bool: true },
  { key: "earlyAccess", label: "Ранний доступ к новинкам", bool: true },
  { key: "maxDevices", label: "Устройств" },
];

/**
 * DELTA subscriptions.
 * Honest status: payment provider is NOT connected yet — switching a plan
 * here only changes the local demo profile so the whole flow can be tested.
 * Plans/prices are read from a catalog structure that the future admin
 * backend will serve (see src/data/catalog.ts).
 */
export function SubscriptionsPage() {
  const plan = useSettings((s) => s.profile.plan);
  const setPlan = useSettings((s) => s.setPlan);
  const [notice, setNotice] = useState<string | null>(null);

  const choose = (tier: (typeof PLANS)[number]["tier"]) => {
    // In production this starts a server-side checkout session.
    setPlan(tier);
    const name = PLANS.find((p) => p.tier === tier)?.name ?? tier;
    setNotice(`Тариф «${name}» активирован в демо-режиме. Платёжная система ещё не подключена.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2 text-2xl">
          <IconCrown size={22} className="text-coin" />
          Подписки DELTA
        </h1>
        <p className="mt-1 text-sm text-muted">
          Тарифы настраиваются через админ-панель сервера; ниже — актуальный каталог.
        </p>
      </div>

      <span className="badge-test inline-flex">
        Демо-режим: оплата не списывается, смена тарифа локальна
      </span>

      {notice && (
        <div className="card flex items-center gap-3 border-accent/40 bg-accent/10 px-4 py-3 text-sm animate-fade-up">
          <IconCheck size={17} className="text-accent shrink-0" />
          {notice}
          <button className="ml-auto text-xs text-muted hover:text-fg" onClick={() => setNotice(null)}>
            Скрыть
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLANS.map((p) => {
          const active = p.tier === plan;
          return (
            <div
              key={p.tier}
              className={`card relative flex flex-col p-5 transition ${active ? "border-accent shadow-pop" : ""}`}
            >
              {active && (
                <span className="chip absolute -top-2.5 right-4 bg-accent text-accent-contrast">
                  Текущий тариф
                </span>
              )}
              <p className="text-[11px] font-bold uppercase tracking-widest text-faint">{p.tier}</p>
              <h2 className="mt-1 text-lg font-extrabold">{p.name}</h2>
              <p className="mt-0.5 text-xs text-muted">{p.tagline}</p>
              <p className="mt-3">
                <span className="text-2xl font-extrabold tabular-nums">
                  {p.priceMonthlyRub === 0 ? "0 ₽" : formatMoney(p.priceMonthlyRub)}
                </span>
                <span className="text-xs text-muted"> / мес</span>
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {FEATURE_LABELS.map(({ key, label, bool }) => {
                  const v = p.features[key];
                  const on = bool ? Boolean(v) : true;
                  return (
                    <li key={key} className={`flex items-center gap-2 text-sm ${on ? "text-fg" : "text-faint line-through"}`}>
                      {on ? (
                        <IconCheck size={15} className="text-accent shrink-0" />
                      ) : (
                        <span className="w-[15px] shrink-0 text-center">·</span>
                      )}
                      {bool ? label : `${label}: ${v}`}
                    </li>
                  );
                })}
                {p.seats > 1 && (
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck size={15} className="text-accent shrink-0" />
                    До {p.seats} участников
                  </li>
                )}
              </ul>

              <button
                className={`mt-5 w-full ${active ? "btn-secondary" : p.tier === "INFINITY" ? "btn-primary" : "btn-primary"}`}
                disabled={active}
                onClick={() => choose(p.tier)}
              >
                {active ? "Используется" : p.priceMonthlyRub === 0 ? "Вернуться на Free" : "Выбрать тариф"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Family note + fee transparency */}
      <div className="card p-5 text-sm text-muted">
        <p>
          Комиссия платформы при операциях с DELTA Coins:{" "}
          <b className="text-fg tabular-nums">{PLATFORM_FEE_PERCENT}%</b> — значение берётся из
          конфигурации (в продакшене задаётся администратором через API).
        </p>
        <p className="mt-2">
          Структура подключения платежей уже подготовлена: выбор тарифа формирует запрос на смену
          подписки, который после запуска NestJS-API будет проходить через серверную проверку и
          платёжный провайдер.
        </p>
      </div>
    </div>
  );
}
