import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../stores/data";
import { musicApi, toFrontTrack, type ApiTrack } from "../lib/api";
import { Shelf } from "../components/Shelf";
import { TrackCard } from "../components/TrackCard";
import { TrackRow } from "../components/TrackRow";
import { Cover } from "../components/Cover";
import { EmptyState, SkeletonList } from "../components/EmptyState";
import { ErrorBox, Spinner } from "../components/ui";
import { IconClock, IconSparkle, IconPlay } from "../components/Icons";
import { usePlayer } from "../stores/player";

export function HomePage() {
  const loaded = useData((s) => s.loaded);
  const loading = useData((s) => s.loading);
  const error = useData((s) => s.error);
  const recent = useData((s) => s.recent);
  const recommendations = useData((s) => s.recommendations);
  const trending = useData((s) => s.trending);
  const playlists = useData((s) => s.playlists);
  const loadAll = useData((s) => s.loadAll);
  const playTrack = usePlayer((s) => s.playTrack);
  const [catalog, setCatalog] = useState<ApiTrack[] | null>(null);

  // Load real server data on mount.
  useEffect(() => {
    if (!loaded && !loading) void loadAll();
    musicApi.search("").then(setCatalog).catch(() => setCatalog([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded && loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-28 w-full !rounded-card" />
        <SkeletonList rows={4} />
      </div>
    );
  }
  if (error && !loaded) return <ErrorBox message={error} onRetry={() => loadAll()} />;

  const forYou = recommendations.length ? recommendations : trending;
  const catalogTracks = (catalog ?? []).map(toFrontTrack);
  const fullCatalog = catalogTracks.length ? catalogTracks : trending;

  return (
    <div className="space-y-8">
      <section className="card flex items-center justify-between gap-4 bg-elevated/50 px-5 py-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Слушайте музыку</h1>
          <p className="mt-1 text-sm text-muted">DELTA — ваша музыка, плейлисты и находки. Всё в одном месте.</p>
        </div>
        {forYou.length > 0 && (
          <button className="btn-primary hidden sm:inline-flex" onClick={() => playTrack(forYou[0], forYou, "Для вас")}>
            <IconPlay size={16} />
            Играть подборку
          </button>
        )}
      </section>

      {recent.length > 0 && (
        <Shelf title="Недавно прослушанное">
          {recent.slice(0, 6).map((t) => (
            <button
              key={t.id}
              onClick={() => playTrack(t, recent, "Недавнее")}
              className="card group flex w-56 shrink-0 items-center gap-3 p-2.5 text-left hover:bg-elevated"
            >
              <Cover seed={t.coverSeed} size={48} alt={t.album} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{t.title}</span>
                <span className="block truncate text-xs text-muted">{t.artist}</span>
              </span>
            </button>
          ))}
        </Shelf>
      )}

      {forYou.length > 0 && (
        <Shelf title="Рекомендации для вас" action={<Link to="/search" className="text-xs font-medium text-muted hover:text-fg">Больше поиска →</Link>}>
          {forYou.map((t) => (
            <TrackCard key={t.id} track={t} queue={forYou} label="Для вас" />
          ))}
        </Shelf>
      )}

      {playlists.length > 0 && (
        <Shelf title="Ваши плейлисты" action={<Link to="/playlists" className="text-xs font-medium text-muted hover:text-fg">Все плейлисты →</Link>}>
          {playlists.map((pl) => {
            const tracks = (pl.tracks ?? []).map((pt) => toFrontTrack(pt.track));
            return (
              <button
                key={pl.id}
                onClick={() => tracks.length && playTrack(tracks[0], tracks, pl.title)}
                className="card group w-40 shrink-0 p-3 text-left hover:bg-elevated"
              >
                <Cover seed={(pl.title.charCodeAt(0) * 7919 + pl.title.length) % 100000} size={136} rounded="md" alt={pl.title} className="w-full h-auto !rounded-md" />
                <p className="mt-2.5 truncate text-sm font-semibold">{pl.title}</p>
                <p className="truncate text-xs text-muted">
                  {pl._count?.tracks ?? tracks.length} треков · {pl.visibility === "PRIVATE" ? "приватный" : "публичный"}
                </p>
              </button>
            );
          })}
        </Shelf>
      )}

      <section>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <IconSparkle size={18} className="text-accent" />
          Каталог DELTA
        </h2>
        {!catalog ? (
          <Spinner />
        ) : fullCatalog.length === 0 ? (
          <EmptyState icon={<IconSparkle size={22} />} title="Каталог пуст" hint="Сервер пока не вернул треки." />
        ) : (
          <div className="card divide-y divide-line p-1.5">
            {fullCatalog.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} queue={fullCatalog} contextLabel="Каталог DELTA" />
            ))}
          </div>
        )}
        {recent.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={<IconClock size={22} />}
              title="Здесь появится недавно прослушанное"
              hint="Включите любой трек из каталога — история сохранится на сервере."
            />
          </div>
        )}
      </section>
    </div>
  );
}
