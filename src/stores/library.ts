import { create } from "zustand";
import { useData } from "./data";

/**
 * Compatibility facade over the server-backed data store.
 * Pages/components that still reference useLibrary keep working,
 * but ALL data now comes from the real API (src/lib/api.ts) —
 * nothing is persisted locally except UI state.
 */
interface LibraryState {
  favorites: string[]; // track ids (derived from server favorites)
  recentlyPlayed: string[]; // derived from server history
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
  markPlayed: (trackId: string) => void;
}

export const useLibrary = create<LibraryState>()((set, get) => {
  // Keep derived id-lists in sync with the server store.
  useData.subscribe((d) => {
    set({
      favorites: d.favorites.map((t) => t.id),
      recentlyPlayed: d.history.map((h) => h.track.id),
    });
  });
  return {
    favorites: [],
    recentlyPlayed: [],
    toggleFavorite: (trackId) => {
      void useData.getState().toggleFavorite(trackId);
    },
    isFavorite: (trackId) => get().favorites.includes(trackId),
    markPlayed: (trackId) => {
      useData.getState().reportPlay(trackId);
    },
  };
});
