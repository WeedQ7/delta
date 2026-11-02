import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TRACKS, trackById } from "../data/tracks";
import { useLibrary } from "../stores/library";
import { usePlayer } from "../stores/player";
import { Shelf } from "../components/Shelf";
import { TrackCard } from "../components/TrackCard";
import { TrackRow } from "../components/TrackRow";
import { Cover } from "../components/Cover";
import { EmptyState, SkeletonList } from "../components/EmptyState";
import { IconClock, IconSparkle, IconPlay, IconPlaylist } from "../components/Icons";

/** Simulated short fetch so loading states are real, not decorative. */
function useFakeLoading(ms = 350) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

export function HomePage() {
  const loading = useFakeLoading();
  const playlists = useLibrary((s) => s.playlists);
  const recentlyPlayed = useLibrary((s) => s.recentlyPlayed);
  const playTrack = usePlayer((s) => s.playTrack);

  const recentTracks = recentlyPlayed
    .map(trackById)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  // Deterministic "for you" picks: rotate the catalog by day-of-year.
  const dayIdx = Math.floor((Date.now() / 86_400_000) % TRACKS.length);
  const forYou = [...TRACKS.slice(dayIdx), ...TRACKS.slice(0, dayIdx)].slice(0, 8);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-28 w-full !rounded-card" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting hero */}
      <section className="card flex items-center justify-between gap-4 bg-elevated/50 px-5 py-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Слушайте музыку</h1>
          <p className="mt-1 text-sm text-muted">
            DELTA — ваша музыка, плейлисты и находки. Всё в одном месте.
          </p>
        </div>
        <button
          className="btn-primary hidden sm:inline-flex"
          onClick={() => playTrack(forYou[0], forYou, "Для вас")}
        >
          <IconPlay size={16} />
          Играть подборку
        </button>
      </section>

      {/* Recently played — quick tiles */}
      {recentTracks.length > 0 && (
        <Shelf title="Недавно прослушанное">
          {recentTracks.slice(0, 6).map((t) => (
            <button
              key={t.id}
              onClick={() => playTrack(t, recentTracks, "Недавнее")}
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

      {/* Recommendations */}
      <Shelf title="Рекомендации для вас" action={<Link to="/search" className="text-xs font-medium text-muted hover:text-fg">Больше поиска →</Link>}>
        {forYou.map((t) => (
          <TrackCard key={t.id} track={t} queue={forYou} label="Для вас" />
        ))}
      </Shelf>

      {/* Playlists */}
      <Shelf
        title="Ваши плейлисты"
        action={<Link to="/playlists" className="text-xs font-medium text-muted hover:text-fg">Все плейлисты →</Link>}
      >
        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => {
              const tracks = pl.trackIds.map(trackById).filter((t): t is NonNullable<typeof t> => Boolean(t));
              if (tracks.length) playTrack(tracks[0], tracks, pl.title);
            }}
            className="card group w-40 shrink-0 p-3 text-left hover:bg-elevated"
          >
            <Cover seed={pl.coverSeed} size={136} rounded="md" alt={pl.title} className="w-full h-auto !rounded-md" />
            <p className="mt-2.5 truncate text-sm font-semibold">{pl.title}</p>
            <p className="truncate text-xs text-muted">
              {pl.trackIds.length} треков
              {!pl.editable && " · редакторский"}
            </p>
          </button>
        ))}
      </Shelf>

      {/* Full catalog list */}
      <section>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <IconSparkle size={18} className="text-accent" />
          Демо-каталог
        </h2>
        <div className="card divide-y divide-line p-1.5">
          {TRACKS.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} queue={TRACKS} contextLabel="Каталог DELTA" />
          ))}
        </div>
        {recentTracks.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={<IconClock size={22} />}
              title="Здесь появится недавно прослушанное"
              hint="Включите любой трек из каталога ниже — и он сохранится в истории."
            />
          </div>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-faint">
        <IconPlaylist size={14} />
        Демонстрационный каталог: тестовые аудиофайлы. Реальные музыкальные интеграции подключаются через API (в разработке).
      </p>
    </div>
  );
}
