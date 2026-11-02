import { trackById } from "../data/tracks";
import { useLibrary } from "../stores/library";
import { usePlayer } from "../stores/player";
import { TrackRow } from "../components/TrackRow";
import { EmptyState } from "../components/EmptyState";
import { IconHeart, IconPlay } from "../components/Icons";

export function FavoritesPage() {
  const favorites = useLibrary((s) => s.favorites);
  const playTrack = usePlayer((s) => s.playTrack);
  const tracks = favorites.map(trackById).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title flex items-center gap-2 text-2xl">
          <IconHeart size={22} className="text-accent" filled />
          Избранное
        </h1>
        {tracks.length > 0 && (
          <button className="btn-primary" onClick={() => playTrack(tracks[0], tracks, "Избранное")}>
            <IconPlay size={15} /> Играть
          </button>
        )}
      </div>

      {tracks.length === 0 ? (
        <EmptyState
          icon={<IconHeart size={22} />}
          title="Пока нет избранных треков"
          hint="Нажмите на сердце в любом списке — трек появится здесь и сохранится в браузере."
        />
      ) : (
        <div className="card divide-y divide-line p-1.5">
          {tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} queue={tracks} contextLabel="Избранное" />
          ))}
        </div>
      )}
    </div>
  );
}
