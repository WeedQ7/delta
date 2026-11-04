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
  // Defensive defaults: if an API response shape is unexpected (e.g. a single
  // object instead of an array, or history entries without `track`), never let
  // the exception escape — it used to break every subscriber ("undefined is
  // not iterable" / "is not a function") across the whole app.
  useData.subscribe((d) => {
    try {
      const favs = Array.isArray(d.favorites) ? d.favorites : [];
      const hist = Array.isArray(d.history) ? d.history : [];
      set({
        favorites: favs.filter((t: any) => t && typeof t.id === "string").map((t: any) => t.id),
        recentlyPlayed: hist.filter((h: any) => h && h.track && typeof h.track.id === "string").map((h: any) => h.track.id),
      });
    } catch (e) {
      console.warn("[library] sync skipped:", e);
    }
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
