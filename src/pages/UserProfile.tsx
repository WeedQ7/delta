import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { profileApi, socialApi, toFrontTrack, type ApiPost, type ApiUser } from "../lib/api";
import { useAuth } from "../stores/auth";
import { Avatar, ErrorBox, FollowButton, Spinner, PostCard, toast } from "../components/ui";
import { EmptyState } from "../components/EmptyState";
import { TrackRow } from "../components/TrackRow";

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const me = useAuth((s) => s.user);
  const [u, setU] = useState<ApiUser | null | "notfound" | "private" | "blocked">(null);
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [tab, setTab] = useState<"posts" | "followers" | "following">("posts");
  const [people, setPeople] = useState<ApiUser[] | null>(null);

  const load = useCallback(() => {
    if (!username) return;
    setU(null);
    profileApi
      .byUsername(username)
      .then((res) => {
        setU(res);
        socialApi.userPosts(username).then(setPosts).catch(() => setPosts([]));
      })
      .catch((e) => {
        if (e.status === 404) setU("notfound");
        else if (e.status === 403) setU("private");
        else setU("blocked");
      });
  }, [username]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!username || tab === "posts") return;
    setPeople(null);
    const p = tab === "followers" ? profileApi.followers(username) : profileApi.following(username);
    p.then(setPeople).catch(() => setPeople([]));
  }, [username, tab]);

  if (u === null) return <Spinner />;
  if (u === "notfound") return <ErrorBox message={`Пользователь @${username} не найден`} />;
  if (u === "private") return <ErrorBox message="Это приватный профиль. Подпишитесь, чтобы увидеть публикации." />;
  if (u === "blocked") return <ErrorBox message="Профиль недоступен." />;

  const reloadFlags = () => username && profileApi.byUsername(username).then(setU).catch(() => undefined);

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Avatar user={u} size={84} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold">{u.profile?.displayName || u.username}</h1>
          <p className="truncate text-sm text-muted">@{u.username}</p>
          {u.profile?.bio && <p className="mt-1 break-words text-sm">{u.profile.bio}</p>}
          <p className="mt-1 text-xs text-faint">
            {u._count?.followers ?? 0} подписчиков · {u._count?.following ?? 0} подписок · {u._count?.posts ?? 0} публикаций
          </p>
        </div>
        <div className="flex items-center gap-2">
          {me?.id === u.id ? (
            <Link to="/profile" className="btn-secondary">Редактировать профиль</Link>
          ) : (
            <>
              <FollowButton target={u} onChanged={reloadFlags} />
              <button
                className="icon-btn text-faint hover:text-danger"
                title="Пожаловаться"
                onClick={async () => {
                  const reason = prompt("Причина жалобы:");
                  if (!reason?.trim()) return;
                  try { await profileApi.report({ targetType: "USER", targetId: u.id, reason: reason.trim() }); toast("Жалоба отправлена"); }
                  catch (e: any) { toast(e.message || "Ошибка", "err"); }
                }}
              >⚑</button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {(["posts", "followers", "following"] as const).map((t) => (
          <button key={t} className={`chip ${tab === t ? "bg-accent text-accent-contrast" : "bg-elevated text-muted hover:text-fg"}`} onClick={() => setTab(t)}>
            {t === "posts" ? "Публикации" : t === "followers" ? "Подписчики" : "Подписки"}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        posts === null ? <Spinner /> : posts.length === 0 ? (
          <EmptyState title="Публикаций пока нет" hint="Здесь появятся посты пользователя." />
        ) : (
          <div className="space-y-4">{posts.map((p) => <PostCard key={p.id} post={p} onChanged={() => socialApi.userPosts(u.username).then(setPosts)} />)}</div>
        )
      )}

      {tab !== "posts" && (
        people === null ? <Spinner /> : people.length === 0 ? (
          <EmptyState title={tab === "followers" ? "Пока нет подписчиков" : "Нет активных подписок"} />
        ) : (
          <ul className="card divide-y divide-line">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar user={p} size={36} />
                <Link to={`/u/${p.username}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-accent">
                  {p.profile?.displayName || p.username} <span className="text-muted">@{p.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
