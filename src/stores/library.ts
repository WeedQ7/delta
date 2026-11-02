import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Playlist } from "../types";
import { SEED_PLAYLISTS } from "../data/playlists";
import { uid } from "../lib/utils";

interface LibraryState {
  favorites: string[]; // track ids
  playlists: Playlist[];
  recentlyPlayed: string[]; // track ids, most recent first
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
  markPlayed: (trackId: string) => void;
  createPlaylist: (title: string) => string;
  renamePlaylist: (id: string, title: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      playlists: SEED_PLAYLISTS,
      recentlyPlayed: [],

      toggleFavorite: (trackId) =>
        set((s) => ({
          favorites: s.favorites.includes(trackId)
            ? s.favorites.filter((id) => id !== trackId)
            : [trackId, ...s.favorites],
        })),

      isFavorite: (trackId) => get().favorites.includes(trackId),

      markPlayed: (trackId) =>
        set((s) => ({
          recentlyPlayed: [trackId, ...s.recentlyPlayed.filter((id) => id !== trackId)].slice(0, 20),
        })),

      createPlaylist: (title) => {
        const id = uid("pl");
        set((s) => ({
          playlists: [
            ...s.playlists,
            {
              id,
              title,
              description: "",
              trackIds: [],
              coverSeed: Math.floor(Math.random() * 1000),
              editable: true,
            },
          ],
        }));
        return id;
      },

      renamePlaylist: (id, title) =>
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, title } : p)),
        })),

      deletePlaylist: (id) =>
        set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

      addToPlaylist: (playlistId, trackId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.trackIds.includes(trackId)
              ? { ...p, trackIds: [...p.trackIds, trackId] }
              : p
          ),
        })),

      removeFromPlaylist: (playlistId, trackId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) }
              : p
          ),
        })),
    }),
    {
      name: "delta-library",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
