import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../stores/settings";
import { useCoins } from "../stores/coins";
import { useLibrary } from "../stores/library";
import { PLANS } from "../data/catalog";
import { trackById } from "../data/tracks";
import { Cover } from "../components/Cover";
import { formatDate } from "../lib/utils";
import { IconCoin, IconCrown, IconHeart, IconClock, IconCheck } from "../components/Icons";

export function ProfilePage() {
  const profile = useSettings((s) => s.profile);
  const setDisplayName = useSettings((s) => s.setDisplayName);
  const balance = useCoins((s) => s.balance);
  const favorites = useLibrary((s) => s.favorites);
  const recentlyPlayed = useLibrary((s) => s.recentlyPlayed);
  const playlists = useLibrary((s) => s.playlists);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.displayName);

  const plan = PLANS.find((p) => p.tier === profile.plan) ?? PLANS[0];
  const topFav = favorites.slice(0, 4).map(trackById).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const lastPlayed = recentlyPlayed.slice(0, 1).map(trackById).filter((t): t is NonNullable<typeof t> => Boolean(t))[0];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-accent text-2xl font-extrabold text-accent-contrast">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            {editing ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = draft.trim();
                  if (!n) return;
                  setDisplayName(n);
                  setEditing(false);
                }}
              >
                <input
                  className="input max-w-xs"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-label="Отображаемое имя"
                  autoFocus
                />
                <button className="btn-primary shrink-0">
                  <IconCheck size={15} /> Сохранить
                </button>
              </form>
            ) : (
              <>
                <h1 className="text-xl font-extrabold">{profile.displayName}</h1>
                <p className="text-sm text-muted">{profile.username}</p>
                <p className="mt-1 text-xs text-faint">На DELTA с {formatDate(profile.joinedAt)}</p>
                <button className="btn-ghost mt-2 !px-2 !py-1 text-xs" onClick={() => { setDraft(profile.displayName); setEditing(true); }}>
                  Изменить имя
                </button>
              </>
            )}
          </div>

          <Link to="/subscriptions" className={`chip ${plan.tier === "FREE" ? "bg-elevated text-muted" : "bg-accent/10 text-accent"} !px-3.5 !py-1.5`}>
            <IconCrown size={15} />
            {plan.name}
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<IconHeart size={16} />} label="Избранных треков" value={favorites.length} />
          <Stat icon={<IconClock size={16} />} label="Прослушано недавно" value={recentlyPlayed.length} />
          <Stat icon={<IconCrown size={16} />} label="Плейлистов" value={playlists.length} />
          <Stat icon={<IconCoin size={16} />} label="DELTA Coins" value={balance} link="/coins" />
        </div>
      </section>

      {/* Activity snapshot */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-bold">Любимое звучание</h2>
          {topFav.length === 0 ? (
            <p className="text-sm text-muted">
              Избранного пока нет.{" "}
              <Link to="/search" className="text-accent hover:underline">Найти музыку</Link>
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {topFav.map((t) => (
                <Cover key={t.id} seed={t.coverSeed} size={64} alt={t.title} className="w-full h-auto !rounded-md" />
              ))}
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-bold">Последний трек</h2>
          {lastPlayed ? (
            <div className="flex items-center gap-3">
              <Cover seed={lastPlayed.coverSeed} size={48} alt={lastPlayed.album} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{lastPlayed.title}</p>
                <p className="truncate text-xs text-muted">{lastPlayed.artist}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              История пуста.{" "}
              <Link to="/" className="text-accent hover:underline">Начать слушать</Link>
            </p>
          )}
        </div>
      </section>

      <p className="text-xs text-faint">
        Статистика прослушиваний и социальные профили появятся после подключения серверной части (API).
      </p>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  link,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  link?: string;
}) {
  const inner = (
    <div className="card flex items-center gap-3 p-4 transition hover:bg-elevated">
      <span className="text-accent">{icon}</span>
      <div>
        <p className="text-lg font-extrabold tabular-nums leading-tight">{value.toLocaleString("ru-RU")}</p>
        <p className="text-[11px] text-muted">{label}</p>
      </div>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}
