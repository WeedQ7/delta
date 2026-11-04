import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { PlayerBar } from "./components/PlayerBar";
import { Toaster } from "./components/ui";
import { useAudioEngine } from "./audio/engine";
import { useSettings, applyAppearance } from "./stores/settings";
import { useAuth } from "./stores/auth";
import { useData } from "./stores/data";
import { Spinner } from "./components/ui";
import { HomePage } from "./pages/Home";
import { SearchPage } from "./pages/Search";
import { LibraryPage } from "./pages/Library";
import { FavoritesPage } from "./pages/Favorites";
import { PlaylistsPage, PlaylistDetailPage } from "./pages/Playlists";
import { ProfilePage } from "./pages/Profile";
import { SettingsPage } from "./pages/Settings";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { FeedPage } from "./pages/Feed";
import { NotificationsPage } from "./pages/Notifications";
import { UserProfilePage } from "./pages/UserProfile";
import { NotFoundPage } from "./pages/NotFound";

/** Protected route: remembers where the user came from and returns after login. */
function RequireAuth({ children }: { children: JSX.Element }) {
  const status = useAuth((s) => s.status);
  const location = useLocation();
  if (status === "unknown" || status === "authenticating") return <Spinner />;
  if (status !== "authenticated") return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export default function App() {
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  const bootstrap = useAuth((s) => s.bootstrap);
  const status = useAuth((s) => s.status);
  const loadAll = useData((s) => s.loadAll);
  const reset = useData((s) => s.reset);

  // Apply design tokens on load/change (also handles persisted rehydration).
  useEffect(() => {
    applyAppearance(theme, accent);
  }, [theme, accent]);

  // Restore session once on startup (silent refresh handled by the API client).
  useEffect(() => {
    void bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load server data when authenticated; drop it on logout.
  useEffect(() => {
    if (status === "authenticated") void loadAll();
    if (status === "anonymous") reset();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wire the <audio> element to the player store. Mounted once —
  // playback continues across page/route navigation.
  useAudioEngine();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<RequireAuth><HomePage /></RequireAuth>} />
          <Route path="search" element={<SearchPage />} />
          <Route path="library" element={<RequireAuth><LibraryPage /></RequireAuth>} />
          <Route path="favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="playlists" element={<RequireAuth><PlaylistsPage /></RequireAuth>} />
          <Route path="playlists/:id" element={<RequireAuth><PlaylistDetailPage /></RequireAuth>} />
          <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="feed" element={<RequireAuth><FeedPage /></RequireAuth>} />
          <Route path="notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
          <Route path="u/:username" element={<UserProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <PlayerBar />
      <Toaster />
    </>
  );
}
