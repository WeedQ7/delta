import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { trackById } from "../data/tracks";
import { useLibrary } from "../stores/library";
import { usePlayer } from "../stores/player";
import { TrackRow } from "../components/TrackRow";
import { Cover } from "../components/Cover";
import { EmptyState } from "../components/EmptyState";
import { IconPlay, IconTrash, IconPlus, IconPlaylist } from "../components/Icons";

export function PlaylistsPage() {
  const playlists = useLibrary((s) => s.playlists);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="section-title text-2xl">Плейлисты</h1>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = name.trim();
          if (!n) return;
          const id = createPlaylist(n);
          setName("");
          navigate(`/playlists/${id}`);
        }}
      >
        <input
          className="input max-w-xs"
          placeholder="Новый плейлист…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Название нового плейлиста"
        />
        <button className="btn-primary shrink-0" disabled={!name.trim()}>
          <IconPlus size={16} /> Создать
        </button>
      </form>

      {playlists.length === 0 ? (
        <EmptyState
          icon={<IconPlaylist size={22} />}
          title="Плейлистов пока нет"
          hint="Создайте первый плейлист выше."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.map((pl) => (
            <Link key={pl.id} to={`/playlists/${pl.id}`} className="card p-3 hover:bg-elevated">
              <Cover seed={pl.coverSeed} size={160} rounded="md" alt={pl.title} className="w-full h-auto !rounded-md" />
              <p className="mt-2.5 truncate text-sm font-semibold">{pl.title}</p>
              <p className="truncate text-xs text-muted">{pl.trackIds.length} треков</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const playlists = useLibrary((s) => s.playlists);
  const removeFromPlaylist = useLibrary((s) => s.removeFromPlaylist);
  const deletePlaylist = useLibrary((s) => s.deletePlaylist);
  const playTrack = usePlayer((s) => s.playTrack);
  const navigate = useNavigate();

  const pl = playlists.find((p) => p.id === id);
  if (!pl) {
    return (
      <EmptyState
        icon={<IconPlaylist size={22} />}
        title="Плейлист не найден"
        hint="Возможно, он был удалён."
        action={<Link to="/playlists" className="btn-secondary">К списку плейлистов</Link>}
      />
    );
  }

  const tracks = pl.trackIds.map(trackById).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card flex items-center gap-5 p-5">
        <Cover seed={pl.coverSeed} size={120} rounded="card" alt={pl.title} className="hidden sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted">
            Плейлист {!pl.editable && "· редакторский"}
          </p>
          <h1 className="mt-1 truncate text-2xl font-extrabold">{pl.title}</h1>
          {pl.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{pl.description}</p>}
          <p className="mt-2 text-xs text-faint">{tracks.length} треков</p>
          <div className="mt-4 flex gap-2">
            <button
              className="btn-primary"
              disabled={tracks.length === 0}
              onClick={() => playTrack(tracks[0], tracks, pl.title)}
            >
              <IconPlay size={15} /> Играть
            </button>
            {pl.editable && (
              <button
                className="btn-ghost text-danger"
                onClick={() => {
                  deletePlaylist(pl.id);
                  navigate("/playlists");
                }}
              >
                <IconTrash size={16} /> Удалить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tracks */}
      {tracks.length === 0 ? (
        <EmptyState
          icon={<IconPlaylist size={22} />}
          title="В плейлисте пусто"
          hint="Добавляйте треки кнопкой «+» в результатах поиска или на главной."
          action={<Link to="/search" className="btn-secondary">Найти музыку</Link>}
        />
      ) : (
        <div className="card divide-y divide-line p-1.5">
          {tracks.map((t, i) => (
            <div key={t.id} className="group/row relative">
              <TrackRow track={t} index={i} queue={tracks} contextLabel={pl.title} />
              {pl.editable && (
                <button
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-xs font-medium text-danger opacity-0 group-hover/row:opacity-100 hover:underline"
                  onClick={() => removeFromPlaylist(pl.id, t.id)}
                  aria-label={`Убрать ${t.title} из плейлиста`}
                >
                  Убрать
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
