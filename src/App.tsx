import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { PlayerBar } from "./components/PlayerBar";
import { useAudioEngine } from "./audio/engine";
import { useSettings, applyAppearance } from "./stores/settings";
import { HomePage } from "./pages/Home";
import { SearchPage } from "./pages/Search";
import { LibraryPage } from "./pages/Library";
import { FavoritesPage } from "./pages/Favorites";
import { PlaylistsPage, PlaylistDetailPage } from "./pages/Playlists";
import { ProfilePage } from "./pages/Profile";
import { SettingsPage } from "./pages/Settings";
import { SubscriptionsPage } from "./pages/Subscriptions";
import { CoinsPage } from "./pages/Coins";
import { MarketplacePage } from "./pages/Marketplace";
import { NotFoundPage } from "./pages/NotFound";

export default function App() {
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);

  // Apply design tokens on load/change (also handles persisted rehydration).
  useEffect(() => {
    applyAppearance(theme, accent);
  }, [theme, accent]);

  // Wire the <audio> element to the player store. Mounted once.
  useAudioEngine();

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="playlists" element={<PlaylistsPage />} />
          <Route path="playlists/:id" element={<PlaylistDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="coins" element={<CoinsPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <PlayerBar />
    </>
  );
}
