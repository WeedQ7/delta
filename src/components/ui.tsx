import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../stores/auth";
import { musicApi, profileApi, socialApi, toFrontTrack, type ApiComment, type ApiPost, type ApiPlaylist, type ApiUser } from "../lib/api";
import { IconHeart, IconPlay } from "./Icons";
import { usePlayer } from "../stores/player";
import type { Track } from "../types";

/**
 * Shared UI helpers for DELTA pages: loading / error / empty states,
 * toast notifications and small primitives used across the app.
 */

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted" role="status">
      <span className="inline-block h-5 w-5 animate-spin rounded-pill border-2 border-line border-t-accent" />
      {label ?? "Загрузка…"}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 border-danger/40 bg-danger/5 p-4 text-sm">
      <span className="text-fg">{message}</span>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ toasts */
type Toast = { id: number; text: string; kind: "ok" | "err" };
let toastSeq = 1;
let listeners: ((t: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(text: string, kind: "ok" | "err" = "ok") {
  const t = { id: toastSeq++, text, kind };
  toasts = [...toasts, t];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, 3200);
}

export function Toaster() {
  const [list, setList] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.push(setList);
    return () => {
      listeners = listeners.filter((l) => l !== setList);
    };
  }, []);
  return (
    <div className="fixed bottom-24 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={`animate-fade-up rounded-pill px-4 py-2 text-sm font-medium shadow-pop ${
            t.kind === "ok" ? "bg-accent text-accent-contrast" : "bg-danger text-white"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- avatar */
export function Avatar({ user, size = 40 }: { user?: ApiUser | null; size?: number }) {
  const name = user?.profile?.displayName || user?.username || "?";
  if (user?.profile?.avatarUrl) {
    return (
      <img
        src={user.profile.avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-pill object-cover"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className="flex shrink-0 items-center justify-center rounded-pill bg-accent font-extrabold text-accent-contrast"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/* ------------------------------------------------------- playlist picker */
interface PickerProps {
  trackId: string | null;
  onClose: () => void;
}

/** Modal: pick (or create) a server-backed playlist and add the track there. */
export function PlaylistPicker({ trackId, onClose }: PickerProps) {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<ApiPlaylist[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    let alive = true;
    musicApi
      .playlists()
      .then((p) => alive && setPlaylists(p))
      .catch(() => alive && setPlaylists([]));
    return () => {
      alive = false;
    };
  }, [trackId]);

  if (!trackId) return null;

  const add = async (plId: string) => {
    setBusy(true);
    try {
      await musicApi.addTrack(plId, trackId);
      toast("Трек добавлен в плейлист");
      onClose();
    } catch (e: any) {
      toast(e.message || "Не удалось добавить трек", "err");
    } finally {
      setBusy(false);
    }
  };

  const createAndAdd = async () => {
    const title = newName.trim();
    if (!title) return;
    setBusy(true);
    try {
      const pl = await musicApi.createPlaylist(title, "PUBLIC");
      await musicApi.addTrack(pl.id, trackId);
      toast("Плейлист создан, трек добавлен");
      onClose();
      navigate(`/u/${useAuth.getState().user?.username ?? ""}/playlist/${pl.id}`);
    } catch (e: any) {
      toast(e.message || "Ошибка", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-sm space-y-3 p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold">Добавить в плейлист</h3>
        {playlists === null ? (
          <Spinner />
        ) : playlists.length === 0 ? (
          <p className="text-sm text-muted">У вас пока нет плейлистов — создайте первый.</p>
        ) : (
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {playlists.map((pl) => (
              <li key={pl.id}>
                <button
                  disabled={busy}
                  onClick={() => add(pl.id)}
                  className="flex w-full items-center justify-between rounded-card px-3 py-2 text-left text-sm hover:bg-elevated disabled:opacity-50"
                >
                  <span className="truncate">{pl.title}</span>
                  <span className="ml-2 shrink-0 text-xs text-faint">
                    {pl._count?.tracks ?? pl.tracks?.length ?? 0} · {pl.visibility === "PRIVATE" ? "приватный" : "публичный"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); createAndAdd(); }}>
          <input
            className="input flex-1"
            placeholder="Новый плейлист…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={60}
          />
          <button className="btn-primary" disabled={busy || !newName.trim()}>
            Создать
          </button>
        </form>
        <button className="btn-ghost w-full text-xs text-muted" onClick={onClose}>
          Отмена
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------- public playlist view */
export function PublicPlaylistView({ username, playlistId }: { username: string; playlistId: string }) {
  const me = useAuth((s) => s.user);
  const [pl, setPl] = useState<ApiPlaylist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setPl(null);
    setError(null);
    musicApi
      .playlist(playlistId)
      .then(setPl)
      .catch((e) => setError(e.status === 403 || e.status === 404 ? "Плейлист недоступен" : e.message));
  }, [playlistId]);

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorBox message={error} />
        <Link to={`/u/${username}`} className="btn-secondary">← К профилю</Link>
      </div>
    );
  }
  if (!pl) return <Spinner />;

  const tracks = (pl.tracks ?? []).map((pt) => toFrontTrack(pt.track));

  return (
    <div className="space-y-6">
      <div className="card space-y-1 p-5">
        <p className="text-xs uppercase tracking-wide text-muted">Плейлист @{pl.owner?.username ?? username}</p>
        <h1 className="text-2xl font-extrabold">{pl.title}</h1>
        {pl.description && <p className="text-sm text-muted">{pl.description}</p>}
        <p className="text-xs text-faint">{tracks.length} треков · {pl.visibility === "PRIVATE" ? "приватный" : "публичный"}</p>
        {tracks.length > 0 && (
          <button
            className="btn-primary mt-3"
            onClick={() => {
              // play via shared player using transient queue built here
              import("../stores/player").then(({ usePlayer }) => {
                usePlayer.getState().playTrack(tracks[0], tracks, pl.title);
              });
            }}
          >
            Играть
          </button>
        )}
      </div>
      <div className="card divide-y divide-line p-1.5">
        {tracks.map((t: Track, i: number) => (
          <MiniTrackRow key={t.id} track={t} index={i} canEdit={me?.username === username} plId={pl.id} onChanged={() => musicApi.playlist(pl.id).then(setPl)} />
        ))}
        {tracks.length === 0 && <p className="p-4 text-sm text-muted">В плейлисте пока нет треков.</p>}
      </div>
      <button className="btn-ghost text-sm text-muted" onClick={() => navigate(-1)}>← Назад</button>
    </div>
  );
}

function MiniTrackRow({ track, index, canEdit, plId, onChanged }: { track: Track; index: number; canEdit: boolean; plId: string; onChanged: () => void }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <span className="w-6 text-xs tabular-nums text-faint">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.title}</p>
        <p className="truncate text-xs text-muted">{track.artist}</p>
      </div>
      {canEdit && (
        <button
          className="icon-btn !h-8 !w-8 text-muted"
          title="Удалить из плейлиста"
          onClick={async () => {
            try {
              await musicApi.removeTrack(plId, track.id);
              onChanged();
            } catch (e: any) {
              toast(e.message || "Ошибка", "err");
            }
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ follow btn */
export function FollowButton({ target, onChanged }: { target: ApiUser; onChanged?: () => void }) {
  const me = useAuth((s) => s.user);
  const [busy, setBusy] = useState(false);
  if (!me || me.id === target.id) return null;
  const following = !!target.isFollowing;
  return (
    <button
      className={following ? "btn-secondary" : "btn-primary"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await profileApi.toggleFollow(target.username);
          onChanged?.();
        } catch (e: any) {
          toast(e.message || "Не удалось", "err");
        } finally {
          setBusy(false);
        }
      }}
    >
      {following ? "Вы подписаны" : "Подписаться"}
    </button>
  );
}

/* ------------------------------------------------------------- post card */
interface PostCardProps {
  post: ApiPost;
  onChanged?: () => void;
  showComments?: boolean;
}

/** Publication card: author, text, attached track (playable), like toggle, comments. */
export function PostCard({ post, onChanged, showComments }: PostCardProps) {
  const me = useAuth((s) => s.user);
  const [liked, setLiked] = useState(!!post.likedByMe);
  const [likes, setLikes] = useState(post.likesCount ?? 0);
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState<ApiComment[] | null>(null);
  const [cText, setCText] = useState("");
  const [sending, setSending] = useState(false);
  const [showC, setShowC] = useState(false);

  useEffect(() => {
    setLiked(!!post.likedByMe);
    setLikes(post.likesCount ?? 0);
  }, [post.id, post.likedByMe, post.likesCount]);

  const loadComments = useCallback(async () => {
    setShowC(true);
    if (comments !== null) return;
    try {
      setComments(await socialApi.comments(post.id));
    } catch {
      setComments([]);
    }
  }, [comments, post.id]);

  const toggleLike = async () => {
    if (!me || busy) return;
    setBusy(true);
    try {
      const r = await socialApi.like(post.id);
      setLiked(r.liked);
      setLikes((n) => Math.max(0, n + (r.liked ? 1 : -1)));
      onChanged?.();
    } catch (e: any) {
      toast(e.message || "Не удалось оценить", "err");
    } finally {
      setBusy(false);
    }
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = cText.trim();
    if (!text || !me || sending) return;
    setSending(true);
    try {
      const c = await socialApi.comment(post.id, text);
      setComments((prev) => [...(prev ?? []), c]);
      setCText("");
      onChanged?.();
    } catch (err: any) {
      toast(err.message || "Комментарий не отправлен", "err");
    } finally {
      setSending(false);
    }
  };

  const del = async () => {
    if (!me || me.id !== post.authorId) return;
    try {
      await socialApi.deletePost(post.id);
      toast("Публикация удалена");
      onChanged?.();
    } catch (e: any) {
      toast(e.message || "Ошибка", "err");
    }
  };

  const track = post.track ? toFrontTrack(post.track) : null;

  return (
    <article className="card space-y-3 p-4">
      <header className="flex items-center gap-3">
        <Link to={`/u/${post.author?.username ?? ""}`} className="shrink-0">
          <Avatar user={{ ...(post.author as ApiUser) } as ApiUser} size={38} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/u/${post.author?.username ?? ""}`}
            className="block truncate text-sm font-semibold hover:text-accent"
          >
            {post.author?.profile?.displayName || post.author?.username}
          </Link>
          <p className="truncate text-xs text-muted">
            @{post.author?.username} · {new Date(post.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {me?.id === post.authorId && (
          <button className="icon-btn !h-8 !w-8 text-muted" title="Удалить" onClick={del}>
            ✕
          </button>
        )}
      </header>

      {post.text && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{post.text}</p>}

      {track && (
        <button
          className="flex w-full items-center gap-3 rounded-card bg-elevated p-3 text-left transition-colors hover:bg-line/60"
          onClick={() => usePlayer.getState().playTrack(track)}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-accent text-accent-contrast">
            <IconPlay size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{track.title}</span>
            <span className="block truncate text-xs text-muted">{track.artist}</span>
          </span>
        </button>
      )}

      <footer className="flex items-center gap-4 text-sm">
        <button
          onClick={toggleLike}
          disabled={!me || busy}
          className={`flex items-center gap-1.5 transition-colors disabled:opacity-40 ${liked ? "text-accent" : "text-muted hover:text-fg"}`}
          aria-pressed={liked}
        >
          <IconHeart size={17} filled={liked} /> {likes}
        </button>
        <button
          onClick={loadComments}
          className="flex items-center gap-1.5 text-muted hover:text-fg"
        >
          💬 {post.commentsCount ?? comments?.length ?? 0}
        </button>
      </footer>

      {showComments && showC && (
        <div className="space-y-3 border-t border-line pt-3">
          {comments === null ? (
            <Spinner label="Загрузка комментариев…" />
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted">Комментариев пока нет.</p>
          ) : (
            <ul className="space-y-2.5">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start gap-2.5 text-sm">
                  <Avatar user={c.author as ApiUser} size={28} />
                  <div className="min-w-0">
                    <Link to={`/u/${c.author?.username ?? ""}`} className="text-xs font-semibold hover:text-accent">
                      @{c.author?.username}
                    </Link>
                    <p className="break-words">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {me && (
            <form onSubmit={sendComment} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Написать комментарий…"
                value={cText}
                onChange={(e) => setCText(e.target.value)}
                maxLength={500}
              />
              <button className="btn-primary" disabled={sending || !cText.trim()}>
                Отправить
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
