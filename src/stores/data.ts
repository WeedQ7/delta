import { create } from "zustand";
import { musicApi, toFrontTrack, type ApiPlaylist, type ApiTrack } from "../lib/api";
import type { Track } from "../types";

/**
 * Server-backed data store: catalog, favorites, playlists, history.
 * All actions go through the real API — no local demo fallbacks here.
 */
interface DataState {
  loaded: boolean;
  loading: boolean;
  error: string | null;
  trending: Track[];
  genres: string[];
  recent: Track[];
  recommendations: Track[];
  favorites: ApiTrack[]; // keep raw for id lookups + mapping
  playlists: ApiPlaylist[];
  history: { playedAt: string; track: ApiTrack }[];

  loadAll: () => Promise<void>;
  toggleFavorite: (trackId: string) => Promise<boolean>;
  isFavorite: (trackId: string) => boolean;
  createPlaylist: (title: string, visibility?: "PUBLIC" | "PRIVATE") => Promise<ApiPlaylist | null>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  reportPlay: (trackId: string) => void;
  findTrack: (id: string) => Track | undefined;
  reset: () => void;
}

const mapT = (t: ApiTrack) => toFrontTrack(t);

export const useData = create<DataState>()((set, get) => ({
  loaded: false,
  loading: false,
  error: null,
  trending: [],
  genres: [],
  recent: [],
  recommendations: [],
  favorites: [],
  playlists: [],
  history: [],

  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      // Every endpoint must resolve to an array; a non-array payload (or a
      // thrown error) used to crash subscribers with "undefined is not iterable".
      const asArray = <T,>(p: Promise<T[]>): Promise<T[]> =>
        p.then((r) => (Array.isArray(r) ? r : [])).catch(() => [] as T[]);
      const [trending, genres, favorites, playlists] = await Promise.all([
        musicApi.trending().then((r) => (Array.isArray(r) ? r : [])),
        musicApi.genres().catch(() => [] as string[]),
        asArray(musicApi.favorites()),
        asArray(musicApi.playlists()),
      ]);
      const [recent, recommendations, historyRaw] = await Promise.all([
        asArray(musicApi.recent()),
        asArray(musicApi.recommendations()),
        asArray(musicApi.history()),
      ]);
      const history = historyRaw.filter((h: any) => h && h.track && typeof h.track.id === "string");
      set({
        trending: trending.map(mapT),
        genres,
        favorites,
        playlists,
        recent: recent.map(mapT),
        recommendations: (recommendations.length ? recommendations : trending).map(mapT),
        history,
        loaded: true,
        loading: false,
      });
    } catch (e: any) {
      set({ loading: false, error: e.message || "Не удалось загрузить данные" });
    }
  },

  toggleFavorite: async (trackId) => {
    try {
      const r = await musicApi.toggleFavorite(trackId);
      if (r.favorite) {
        const all = await musicApi.favorites();
        set({ favorites: Array.isArray(all) ? all : get().favorites });
      } else {
        set({ favorites: get().favorites.filter((t) => t.id !== trackId) });
      }
      return r.favorite;
    } catch {
      return get().isFavorite(trackId);
    }
  },

  isFavorite: (trackId) => get().favorites.some((t) => t.id === trackId),

  createPlaylist: async (title, visibility = "PUBLIC") => {
    try {
      const pl = await musicApi.createPlaylist(title, visibility);
      set({ playlists: [pl, ...get().playlists] });
      return pl;
    } catch {
      return null;
    }
  },

  deletePlaylist: async (id) => {
    await musicApi.deletePlaylist(id);
    set({ playlists: get().playlists.filter((p) => p.id !== id) });
  },

  addToPlaylist: async (playlistId, trackId) => {
    await musicApi.addTrack(playlistId, trackId);
    await get().refreshPlaylists();
  },

  removeFromPlaylist: async (playlistId, trackId) => {
    await musicApi.removeTrack(playlistId, trackId);
    await get().refreshPlaylists();
  },

  refreshPlaylists: async () => {
    const playlists = await musicApi.playlists().catch(() => [] as ApiPlaylist[]);
    if (!Array.isArray(playlists)) return;
    // re-fetch details so tracks are fresh; guarantee `tracks` is always an array
    const detailed = await Promise.all(
      playlists.map(async (p) => {
        const full = await musicApi.playlist(p.id).catch(() => p);
        return { ...full, tracks: Array.isArray(full.tracks) ? full.tracks : [] };
      })
    );
    set({ playlists: detailed });
  },

  reportPlay: (trackId) => {
    musicApi.reportPlay(trackId).catch(() => undefined); // fire & forget, server records history
    const hist = get().history;
    const existing = hist.find((h) => h.track.id === trackId);
    const entry = existing ?? { playedAt: new Date().toISOString(), track: { id: trackId } as unknown as ApiTrack };
    set({
      history: [entry, ...hist.filter((h) => h.track.id !== trackId)].slice(0, 50),
    });
  },

  findTrack: (id) => {
    const pool = [...get().trending, ...get().recent, ...get().recommendations, ...get().favorites.map(mapT)];
    for (const pl of get().playlists) for (const pt of pl.tracks ?? []) pool.push(mapT(pt.track));
    return pool.find((t) => t.id === id);
  },

  reset: () =>
    set({
      loaded: false,
      loading: false,
      error: null,
      trending: [],
      genres: [],
      recent: [],
      recommendations: [],
      favorites: [],
      playlists: [],
      history: [],
    }),
}));
