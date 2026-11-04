import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useData } from "../stores/data";
import { musicApi, toFrontTrack, type ApiPlaylist } from "../lib/api";
import { Cover } from "../components/Cover";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox, Spinner, toast } from "../components/ui";
import { IconPlaylist, IconPlay, IconPlus } from "../components/Icons";
import { usePlayer } from "../stores/player";

export function PlaylistsPage() {
  const playlists = useData((s) => s.playlists);
  const loaded = useData((s) => s.loaded);
  const loadAll = useData((s) => s.loadAll);
  const createPlaylist = useData((s) => s.createPlaylist);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded) void loadAll();
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    const pl = await createPlaylist(title);
    setBusy(false);
    if (pl) {
      setNewTitle("");
      toast("Плейлист создан");
      navigate(`/playlists/${pl.id}`);
    } else toast("Не удалось создать плейлист", "err");
  };

  if (!loaded) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="section-title text-2xl">Плейлисты</h1>

      <form onSubmit={submit} className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Название нового плейлиста…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={60}
        />
        <button className="btn-primary" disabled={busy || !newTitle.trim()}>
          <IconPlus size={15} /> Создать
        </button>
      </form>

      {playlists.length === 0 ? (
        <EmptyState
          icon={<IconPlaylist size={22} />}
          title="У вас ещё нет плейлистов"
          hint="Создайте первый плейлист — он сохранится на сервере."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.map((pl) => (
            <Link key={pl.id} to={`/playlists/${pl.id}`} className="card group p-3 hover:bg-elevated">
              <Cover seed={(pl.title.charCodeAt(0) * 7919 + pl.title.length) % 100000} size={200} rounded="md" alt={pl.title} className="w-full h-auto !rounded-md" />
              <p className="mt-2.5 truncate text-sm font-semibold">{pl.title}</p>
              <p className="truncate text-xs text-muted">
                {pl._count?.tracks ?? pl.tracks?.length ?? 0} треков ·{" "}
                {pl.visibility === "PRIVATE" ? "приватный" : "публичный"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const playlists = useData((s) => s.playlists);
  const loaded = useData((s) => s.loaded);
  const loadAll = useData((s) => s.loadAll);
  const removeFromPlaylist = useData((s) => s.removeFromPlaylist);
  const deletePlaylist = useData((s) => s.deletePlaylist);
  const playTrack = usePlayer((s) => s.playTrack);
  const [pl, setPl] = useState<ApiPlaylist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded) void loadAll();
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!id) return;
    // prefer store copy, then fetch fresh from server
    const fromStore = playlists.find((p) => p.id === id);
    setPl(fromStore ?? null);
    musicApi.playlist(id).then(setPl).catch((e) => setError(e.message));
  }, [id, playlists]);

  if (error) return <ErrorBox message={error} onRetry={() => id && musicApi.playlist(id).then(setPl).catch((e) => setError(e.message))} />;
  if (!pl) return <Spinner />;

  const tracks = (pl.tracks ?? []).map((pt) => toFrontTrack(pt.track));

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
        <Cover seed={(pl.title.charCodeAt(0) * 7919 + pl.title.length) % 100000} size={140} rounded="md" alt={pl.title} className="!rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted">
            Плейлист {pl.visibility === "PRIVATE" ? "· приватный" : "· публичный"}
          </p>
          <h1 className="mt-1 break-words text-2xl font-extrabold">{pl.title}</h1>
          <p className="mt-1 text-sm text-muted">{tracks.length} треков</p>
          {tracks.length > 0 && (
            <button className="btn-primary mt-3" onClick={() => playTrack(tracks[0], tracks, pl.title)}>
              <IconPlay size={15} /> Играть
            </button>
          )}
        </div>
      </div>

      <div className="card divide-y divide-line p-1.5">
        {tracks.length === 0 ? (
          <p className="p-4 text-sm text-muted">
            В плейлисте пока нет треков. Добавляйте их через <Link to="/search" className="text-accent">поиск</Link> — кнопка «+» у любого трека.
          </p>
        ) : (
          tracks.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <TrackRowLite track={t} index={i} queue={tracks} label={pl.title} />
              </div>
              <button
                className="icon-btn !h-8 !w-8 shrink-0 text-muted hover:text-danger"
                title="Удалить из плейлиста"
                aria-label={`Удалить ${t.title} из плейлиста`}
                onClick={async () => {
                  try {
                    await removeFromPlaylist(pl.id, t.id);
                    const fresh = await musicApi.playlist(pl.id);
                    setPl(fresh);
                    toast("Трек удалён из плейлиста");
                  } catch (e: any) {
                    toast(e.message || "Ошибка", "err");
                  }
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <button className="btn-ghost text-sm text-muted" onClick={() => navigate("/playlists")}>← Все плейлисты</button>
        <button
          className="btn-ghost ml-auto text-sm text-danger"
          onClick={async () => {
            if (!confirm(`Удалить плейлист «${pl.title}»?`)) return;
            try {
              await deletePlaylist(pl.id);
              toast("Плейлист удалён");
              navigate("/playlists");
            } catch (e: any) {
              toast(e.message || "Ошибка", "err");
            }
          }}
        >
          Удалить плейлист
        </button>
      </div>
    </div>
  );
}

/* Track row wrapper kept separate so the list markup stays simple. */
import { TrackRow } from "../components/TrackRow";
import type { Track } from "../types";
function TrackRowLite({ track, index, queue, label }: { track: Track; index: number; queue: Track[]; label: string }) {
  return <TrackRow track={track} index={index} queue={queue} contextLabel={label} />;
}
