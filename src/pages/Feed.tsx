import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { socialApi, musicApi, toFrontTrack, type ApiPost, type ApiTrack } from "../lib/api";
import { useAuth } from "../stores/auth";
import { Avatar, ErrorBox, Spinner, PostCard, toast } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { IconPlay } from "../components/Icons";
import { usePlayer } from "../stores/player";

export function FeedPage() {
  const status = useAuth((s) => s.status);
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [trackId, setTrackId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<ApiTrack[] | null>(null);
  const [posting, setPosting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(() => {
    setError(null);
    setPosts(null);
    socialApi
      .feed()
      .then((r) => {
        setPosts(r.items);
        setNextCursor(r.nextCursor ?? null);
      })
      .catch((e) => setError(e.message || "Не удалось загрузить ленту"));
  }, []);

  useEffect(load, [load]);

  const more = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const r = await socialApi.feed(nextCursor);
      setPosts((p) => [...(p ?? []), ...r.items]);
      setNextCursor(r.nextCursor ?? null);
    } catch (e: any) {
      toast(e.message || "Ошибка", "err");
    } finally {
      setLoadingMore(false);
    }
  };

  const openPicker = () => {
    setTracks([]);
    musicApi.search("").then(setTracks).catch(() => setTracks([]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !trackId) return;
    setPosting(true);
    try {
      const p = await socialApi.createPost(text.trim(), trackId);
      setPosts((prev) => [p, ...(prev ?? [])]);
      setText("");
      setTrackId(null);
      toast("Публикация размещена");
    } catch (err: any) {
      toast(err.message || "Не удалось опубликовать", "err");
    } finally {
      setPosting(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <EmptyState
        title="Лента доступна после входа"
        hint="Войдите или зарегистрируйтесь, чтобы видеть публикации друзей."
        action={<Link to="/login" className="btn-primary">Войти</Link>}
      />
    );
  }

  const attached = trackId ? toFrontTrack(tracks?.find((t) => t.id === trackId) ?? ({ id: trackId } as ApiTrack)) : null;

  return (
    <div className="space-y-6">
      <h1 className="section-title text-2xl">Лента DELTA</h1>

      {/* composer */}
      <form onSubmit={submit} className="card space-y-3 p-4">
        <textarea
          className="input min-h-[70px]"
          placeholder="Поделитесь мыслью или треком…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-ghost text-sm" onClick={openPicker}>
            <IconPlay size={14} /> Прикрепить трек
          </button>
          {attached?.title && <span className="chip bg-elevated text-xs">{attached.title}</span>}
          <button className="btn-primary ml-auto" disabled={posting || (!text.trim() && !trackId)}>
            {posting ? "Публикация…" : "Опубликовать"}
          </button>
        </div>
      </form>

      {error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : posts === null ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <EmptyState
          title="Лента пуста"
          hint="Подпишитесь на других пользователей через поиск — их публикации появятся здесь."
          action={<Link to="/search" className="btn-secondary">Найти людей</Link>}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onChanged={load} showComments />
          ))}
          {nextCursor && (
            <button className="btn-secondary w-full" onClick={more} disabled={loadingMore}>
              {loadingMore ? "Загрузка…" : "Показать ещё"}
            </button>
          )}
        </div>
      )}

      {/* track picker modal */}
      {tracks !== null && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={() => setTracks(null)}>
          <div className="card max-h-[70vh] w-full max-w-md overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-bold">Прикрепить трек</p>
            {tracks.length === 0 ? (
              <p className="text-sm text-muted">Каталог пуст.</p>
            ) : (
              <ul className="space-y-1">
                {tracks.map((t) => (
                  <li key={t.id}>
                    <button
                      className={`flex w-full items-center justify-between rounded-card px-3 py-2 text-left text-sm hover:bg-elevated ${trackId === t.id ? "bg-accent/10" : ""}`}
                      onClick={() => { setTrackId(t.id); setTracks(null); }}
                    >
                      <span className="truncate">{t.title}</span>
                      <span className="ml-2 shrink-0 text-xs text-muted">{t.artist?.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button className="btn-ghost mt-3 w-full text-xs text-muted" onClick={() => setTracks(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
