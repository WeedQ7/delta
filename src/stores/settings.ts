import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AccentName, ThemeMode, UserProfile } from "../types";
import { PLANS } from "../data/catalog";
import type { PlanTier } from "../types";

interface SettingsState {
  theme: ThemeMode;
  accent: AccentName;
  volume: number; // 0..1
  profile: UserProfile;
  setTheme: (t: ThemeMode) => void;
  setAccent: (a: AccentName) => void;
  setVolume: (v: number) => void;
  setDisplayName: (name: string) => void;
  setPlan: (tier: PlanTier) => void;
}

export function resolveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return mode;
}

/** Applies tokens to <html>. Called on every settings change. */
export function applyAppearance(theme: ThemeMode, accent: AccentName) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(theme);
  root.dataset.accent = accent;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      accent: "emerald",
      volume: 0.8,
      profile: {
        displayName: "Алекс Демо",
        username: "@alex",
        plan: "FREE",
        joinedAt: new Date().toISOString(),
      },
      setTheme: (theme) =>
        set((s) => {
          applyAppearance(theme, s.accent);
          return { theme };
        }),
      setAccent: (accent) =>
        set((s) => {
          applyAppearance(s.theme, accent);
          return { accent };
        }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
      setDisplayName: (displayName) =>
        set((s) => ({ profile: { ...s.profile, displayName } })),
      setPlan: (plan) =>
        set((s) => {
          // Guard: only tiers that exist in the (future admin-configurable) catalog.
          if (!PLANS.some((p) => p.tier === plan)) return s;
          return { profile: { ...s.profile, plan } };
        }),
    }),
    {
      name: "delta-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        theme: s.theme,
        accent: s.accent,
        volume: s.volume,
        profile: s.profile,
      }),
    }
  )
);
