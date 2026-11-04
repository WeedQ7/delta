import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useData } from "../stores/data";
import { toFrontTrack } from "../lib/api";
import { TrackRow } from "../components/TrackRow";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox, Spinner } from "../components/ui";
import { IconHeart, IconPlay } from "../components/Icons";
import { usePlayer } from "../stores/player";

export function FavoritesPage() {
  const favorites = useData((s) => s.favorites);
  const loaded = useData((s) => s.loaded);
  const loadAll = useData((s) => s.loadAll);
  const playTrack = usePlayer((s) => s.playTrack);

  useEffect(() => {
    if (!loaded) void loadAll();
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return <Spinner />;

  const tracks = favorites.map(toFrontTrack);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title flex items-center gap-2 text-2xl">
          <IconHeart size={22} className="text-accent" /> Избранное
        </h1>
        {tracks.length > 0 && (
          <button className="btn-primary" onClick={() => playTrack(tracks[0], tracks, "Избранное")}>
            <IconPlay size={15} /> Играть все
          </button>
        )}
      </div>

      {tracks.length === 0 ? (
        <EmptyState
          icon={<IconHeart size={22} />}
          title="В избранном пока пусто"
          hint="Нажмите на сердце у любого трека — он сохранится на сервере и будет доступен с любого устройства."
          action={<Link to="/search" className="btn-secondary">Найти музыку</Link>}
        />
      ) : (
        <>
          <p className="text-xs text-muted">{tracks.length} треков · синхронизировано с сервером</p>
          <ErrorIfAny />
          <div className="card divide-y divide-line p-1.5">
            {tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} queue={tracks} contextLabel="Избранное" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ErrorIfAny() {
  const error = useData((s) => s.error);
  return error ? <ErrorBox message={error} /> : null;
}
