import { create } from "zustand";
import { authApi, hasSession, setTokens, type ApiUser } from "../lib/api";

interface AuthState {
  user: ApiUser | null;
  status: "unknown" | "anonymous" | "authenticating" | "authenticated";
  error: string | null;
  busy: boolean;
  /** Try to restore the session on app start (silent refresh via /auth/me). */
  bootstrap: () => Promise<void>;
  login: (login: string, password: string) => Promise<boolean>;
  register: (data: { email: string; username: string; password: string; displayName?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (u: ApiUser) => void;
}

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  status: "unknown",
  error: null,
  busy: false,

  bootstrap: async () => {
    if (!hasSession()) {
      set({ status: "anonymous", user: null });
      return;
    }
    try {
      const me = await authApi.me(); // triggers refresh-on-401 inside api client
      set({ user: me, status: "authenticated" });
    } catch {
      setTokens(null, null);
      set({ user: null, status: "anonymous" });
    }
  },

  login: async (login, password) => {
    set({ busy: true, error: null });
    try {
      const r = await authApi.login(login, password);
      setTokens(r.accessToken, r.refreshToken);
      // Backend returns only tokens — fetch the full user via /auth/me.
      let me = r.user ?? null;
      if (!me) { try { me = await authApi.me(); } catch { /* bootstrap will retry */ } }
      set({ user: me, status: "authenticated", busy: false });
      return true;
    } catch (e: any) {
      set({ busy: false, error: e.message || "Не удалось войти" });
      return false;
    }
  },

  register: async (data) => {
    set({ busy: true, error: null });
    try {
      const r = await authApi.register(data);
      setTokens(r.accessToken, r.refreshToken);
      // Backend returns only tokens — fetch the full user via /auth/me.
      let me = r.user ?? null;
      if (!me) { try { me = await authApi.me(); } catch { /* bootstrap will retry */ } }
      set({ user: me, status: "authenticated", busy: false });
      return true;
    } catch (e: any) {
      set({ busy: false, error: e.message || "Не удалось зарегистрироваться" });
      return false;
    }
  },

  logout: async () => {
    await authApi.logout();
    setTokens(null, null);
    set({ user: null, status: "anonymous", error: null });
  },

  setUser: (u) => set({ user: get().user ? { ...get().user!, ...u } : u }),
}));

export const useIsAuthed = () => useAuth((s) => s.status === "authenticated");
