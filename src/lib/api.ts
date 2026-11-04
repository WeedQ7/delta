/**
 * DELTA centralized API client.
 * All business data flows through the NestJS backend (server/) —
 * no demo data is used when the user is logged in.
 * Tokens are kept in localStorage; secrets never live in code.
 */

const BASE = "/api";

export interface ApiTrack {
  id: string;
  coverUrl?: string;
  title: string;
  durationSec: number;
  audioUrl: string;
  genre: string;
  license?: string;
  playCount?: number;
  coverSeed?: string;
  artist?: { id: string; name: string };
  album?: { id: string; title: string; year?: number | null; releaseYear?: number | null; coverSeed?: string };
}

export interface ApiUser {
  id: string;
  username: string;
  email?: string;
  createdAt?: string;
  profile?: { displayName?: string | null; bio?: string | null; avatarUrl?: string | null; visibility?: string } | null;
  settings?: { privateProfile?: boolean; showHistory?: boolean } | null;
  _count?: { followers?: number; following?: number; posts?: number };
  // relation flags injected by frontend after loading:
  isFollowing?: boolean;
  isFriend?: boolean;
  isBlocked?: boolean;
  isBlocking?: boolean;
}

export interface ApiPlaylist {
  id: string;
  title: string;
  description?: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  ownerId: string;
  owner?: { username: string };
  tracks?: { track: ApiTrack }[];
  _count?: { tracks?: number };
  createdAt?: string;
}

export interface ApiPost {
  id: string;
  text: string;
  authorId: string;
  trackId?: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  author: { id: string; username: string; profile?: { displayName?: string | null; avatarUrl?: string | null } | null };
  track?: ApiTrack | null;
  likedByMe?: boolean;
}

export interface ApiComment {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; username: string; profile?: { displayName?: string | null; avatarUrl?: string | null } | null };
}

export interface ApiNotification {
  id: string;
  type: string;
  actor?: { username: string; profile?: { displayName?: string | null } | null };
  post?: { id: string } | null;
  read: boolean;
  createdAt: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------------ tokens */
let access: string | null = localStorage.getItem("delta_access");
let refresh: string | null = localStorage.getItem("delta_refresh");

export function setTokens(a: string | null, r: string | null) {
  access = a;
  refresh = r;
  if (a) localStorage.setItem("delta_access", a);
  else localStorage.removeItem("delta_access");
  if (r) localStorage.setItem("delta_refresh", r);
  else localStorage.removeItem("delta_refresh");
}

export const hasSession = () => Boolean(access || refresh);

async function rawFetch(path: string, method: string, body: unknown, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

async function doRefresh(): Promise<boolean> {
  if (!refresh) return false;
  try {
    const res = await rawFetch("/auth/refresh", "POST", { refreshToken: refresh }, null);
    if (!res.ok) return false;
    const d = await res.json();
    setTokens(d.accessToken, d.refreshToken ?? refresh);
    return true;
  } catch {
    return false;
  }
}

export async function api<T = any>(path: string, method = "GET", body?: unknown): Promise<T> {
  let res = await rawFetch(path, method, body, access);
  if (res.status === 401 && refresh) {
    if (await doRefresh()) res = await rawFetch(path, method, body, access);
    else setTokens(null, null);
  }
  if (!res.ok) {
    let msg = `Ошибка ${res.status}`;
    try {
      const e = await res.json();
      msg = Array.isArray(e.message) ? e.message.join("; ") : e.message || msg;
    } catch {
      /* non-json error */
    }
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/* ------------------------------------------------------------------- auth */
export const authApi = {
  register: (data: { email: string; username: string; password: string; displayName?: string }) =>
    api<{ accessToken: string; refreshToken: string; user: ApiUser }>("/auth/register", "POST", data),
  login: (login: string, password: string) =>
    api<{ accessToken: string; refreshToken: string; user: ApiUser }>("/auth/login", "POST", { login, password }),
  logout: () => api("/auth/logout", "POST", { refreshToken: refresh ?? "" }).catch(() => undefined),
  me: () => api<ApiUser>("/auth/me"),
};

/* ------------------------------------------------------------------ music */
export const musicApi = {
  search: (q: string) => api<ApiTrack[]>(`/tracks/search?q=${encodeURIComponent(q)}`),
  trending: () => api<ApiTrack[]>("/tracks/trending"),
  genres: () => api<string[]>("/tracks/genres"),
  reportPlay: (trackId: string) => api(`/tracks/${trackId}/play`, "POST", {}),
  recent: () => api<ApiTrack[]>("/me/recent"),
  recommendations: () => api<ApiTrack[]>("/me/recommendations"),
  favorites: () => api<ApiTrack[]>("/me/favorites"),
  toggleFavorite: (trackId: string) => api<{ favorite: boolean }>(`/me/favorites/${trackId}`, "POST", {}),
  history: () => api<{ playedAt: string; track: ApiTrack }[]>("/me/history"),
  playlists: () => api<ApiPlaylist[]>("/playlists"),
  playlist: (id: string) => api<ApiPlaylist>(`/playlists/${id}`),
  createPlaylist: (title: string, visibility: "PUBLIC" | "PRIVATE" = "PUBLIC") =>
    api<ApiPlaylist>("/playlists", "POST", { title, visibility }),
  deletePlaylist: (id: string) => api(`/playlists/${id}`, "DELETE"),
  addTrack: (playlistId: string, trackId: string) =>
    api(`/playlists/${playlistId}/tracks`, "POST", { trackId }),
  removeTrack: (playlistId: string, trackId: string) =>
    api(`/playlists/${playlistId}/tracks/${trackId}`, "DELETE"),
};

/* ---------------------------------------------------------------- profile */
export const profileApi = {
  update: (data: { displayName?: string; bio?: string; visibility?: string }) =>
    api<ApiUser>("/me/profile", "PATCH", data),
  updateSettings: (data: Record<string, boolean>) => api("/me/settings", "PATCH", data),
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(BASE + "/me/avatar", {
      method: "POST",
      headers: access ? { Authorization: `Bearer ${access}` } : {},
      body: fd,
    });
    if (!res.ok) throw new ApiError(res.status, "Не удалось загрузить аватар");
    return res.json();
  },
  byUsername: (username: string) => api<ApiUser>(`/users/${username}`),
  searchUsers: (q: string) => api<ApiUser[]>(`/users/search?q=${encodeURIComponent(q)}`),
  followers: (username: string) => api<ApiUser[]>(`/users/${username}/followers`),
  following: (username: string) => api<ApiUser[]>(`/users/${username}/following`),
  friends: () => api<ApiUser[]>("/me/friends"),
  toggleFollow: (username: string) =>
    api<{ following: boolean }>(`/users/${username}/follow`, "POST", {}),
  toggleBlock: (username: string) =>
    api<{ blocked: boolean }>(`/users/${username}/block`, "POST", {}),
  report: (data: { targetType: "USER" | "POST"; targetId: string; reason: string }) =>
    api("/reports", "POST", data),
};

/* ----------------------------------------------------------------- social */
export const socialApi = {
  feed: (cursor?: string) =>
    api<{ items: ApiPost[]; nextCursor?: string | null }>(`/feed${cursor ? `?cursor=${cursor}` : ""}`),
  userPosts: (username: string) => api<ApiPost[]>(`/users/${username}/posts`),
  createPost: (text: string, trackId?: string | null) =>
    api<ApiPost>("/posts", "POST", { text, trackId: trackId || undefined }),
  deletePost: (id: string) => api(`/posts/${id}`, "DELETE"),
  like: (id: string) => api<{ liked: boolean }>(`/posts/${id}/like`, "POST", {}),
  comment: (id: string, text: string) => api<ApiComment>(`/posts/${id}/comments`, "POST", { text }),
  comments: (id: string) => api<ApiComment[]>(`/posts/${id}/comments`),
  notifications: () => api<ApiNotification[]>("/notifications"),
  unreadCount: () => api<{ count: number }>("/notifications/unread"),
  markRead: () => api("/notifications/read", "POST", {}),
};

/* ------------------------------------------------------- mapping helpers */
import type { Track } from "../types";

/** Map an API track to the frontend Track shape used by the player. */
export function toFrontTrack(t: ApiTrack): Track {
  let seed = 7;
  for (const ch of t.coverSeed || t.title) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    id: t.id,
    title: t.title,
    artist: t.artist?.name ?? "—",
    album: t.album?.title ?? "Single",
    durationSec: t.durationSec,
    url: t.audioUrl.startsWith("http") || t.audioUrl.startsWith("/") ? t.audioUrl : `/audio/${t.audioUrl}`,
    coverSeed: seed % 100000,
    coverUrl: (t as any).coverUrl ?? (t.album as any)?.coverUrl,
    genre: t.genre,
    year: t.album?.releaseYear ?? t.album?.year ?? new Date().getFullYear(),
  };
}
