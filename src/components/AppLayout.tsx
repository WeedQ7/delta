import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSettings } from "../stores/settings";
import { useCoins } from "../stores/coins";
import { formatCoins } from "../lib/utils";
import {
  IconHome,
  IconSearch,
  IconLibrary,
  IconPlaylist,
  IconHeart,
  IconUser,
  IconSettings,
  IconCrown,
  IconCoin,
  IconStore,
  IconBell,
  IconGlobe,
} from "./Icons";

const NAV = [
  { to: "/", label: "Главная", icon: IconHome, end: true },
  { to: "/search", label: "Поиск", icon: IconSearch },
  { to: "/library", label: "Моя библиотека", icon: IconLibrary },
  { to: "/playlists", label: "Плейлисты", icon: IconPlaylist },
  { to: "/favorites", label: "Избранное", icon: IconHeart },
  { to: "/feed", label: "Лента", icon: IconGlobe },
  { to: "/notifications", label: "Уведомления", icon: IconBell },
];

const NAV_BOTTOM = [
  { to: "/profile", label: "Профиль", icon: IconUser },
  { to: "/settings", label: "Настройки", icon: IconSettings },
  { to: "/subscriptions", label: "Подписки DELTA", icon: IconCrown },
  { to: "/coins", label: "DELTA Coins", icon: IconCoin },
  { to: "/marketplace", label: "Маркетплейс", icon: IconStore },
];

/** DELTA wordmark logo (original design, no third-party assets). */
export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="9" fill="rgb(var(--c-accent))" />
        {/* Greek capital delta as a clean triangle cut-out */}
        <path d="M16 8.5 24.5 24h-17L16 8.5Z" fill="rgb(var(--c-accent-contrast))" opacity="0.95" />
        <path d="M16 14.5l4 7h-8l4-7Z" fill="rgb(var(--c-accent))" />
      </svg>
      {!compact && (
        <span className="text-lg font-extrabold tracking-widest">DELTA</span>
      )}
    </div>
  );
}

function navClass(active: boolean) {
  return `flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-colors ${
    active ? "bg-elevated text-fg" : "text-muted hover:text-fg hover:bg-elevated/60"
  }`;
}

export function AppLayout() {
  const navigate = useNavigate();
  const balance = useCoins((s) => s.balance);
  const plan = useSettings((s) => s.profile.plan);

  return (
    <div className="flex h-full">
      {/* Sidebar — desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="px-5 py-5">
          <button onClick={() => navigate("/")} aria-label="DELTA — на главную">
            <Logo />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => navClass(isActive)}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}

          <div className="my-4 border-t border-line" />

          {NAV_BOTTOM.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => navClass(isActive)}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Balance + plan widget */}
        <div className="border-t border-line p-3 space-y-2">
          <button
            onClick={() => navigate("/coins")}
            className="flex w-full items-center justify-between rounded-card bg-elevated px-3 py-2.5 text-sm transition hover:brightness-105"
          >
            <span className="flex items-center gap-2 text-muted">
              <IconCoin size={17} className="text-coin" />
              Баланс
            </span>
            <span className="font-bold tabular-nums text-coin">{formatCoins(balance)}</span>
          </button>
          <button
            onClick={() => navigate("/subscriptions")}
            className="chip w-full justify-center bg-accent/10 text-accent hover:bg-accent/15"
          >
            Тариф: {plan}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-y-auto pb-20 md:pb-16">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
          <button onClick={() => navigate("/")} aria-label="DELTA — на главную">
            <Logo />
          </button>
          <button
            onClick={() => navigate("/coins")}
            className="chip bg-elevated text-coin"
            aria-label={`Баланс DELTA Coins: ${balance}`}
          >
            <IconCoin size={15} />
            <span className="tabular-nums font-semibold">{formatCoins(balance)}</span>
          </button>
        </header>

        <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-surface/95 py-1.5 backdrop-blur md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-card px-2 py-1.5 text-[10px] font-medium ${
                isActive ? "text-accent" : "text-muted"
              }`
            }
          >
            <Icon size={20} />
            {label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
