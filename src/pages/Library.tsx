import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../stores/data";
import { toFrontTrack } from "../lib/api";
import { TrackRow } from "../components/TrackRow";
import { Cover } from "../components/Cover";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/ui";
import { IconLibrary, IconHeart, IconClock, IconPlaylist, IconPlay } from "../components/Icons";
import { usePlayer } from "../stores/player";

type Tab = "playlists" | "favorites" | "history";

export function LibraryPage() {
  const [tab, setTab] = useState<Tab>("playlists");
  const loaded = useData((s) => s.loaded);
  const loadAll = useData((s) => s.loadAll);
  const playlists = useData((s) => s.playlists);
  const favorites = useData((s) => s.favorites);
  const history = useData((s) => s.history);
  const playTrack = usePlayer((s) => s.playTrack);

  useEffect(() => {
    if (!loaded) void loadAll();
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return <Spinner />;

  const favTracks = favorites.map(toFrontTrack);
  const histTracks = history.map((h) => toFrontTrack(h.track));

  const TABS: { id: Tab; label: string; icon: typeof IconLibrary; count: number }[] = [
    { id: "playlists", label: "Плейлисты", icon: IconPlaylist, count: playlists.length },
    { id: "favorites", label: "Избранное", icon: IconHeart, count: favTracks.length },
    { id: "history", label: "История", icon: IconClock, count: histTracks.length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="section-title flex items-center gap-2 text-2xl">
        <IconLibrary size={22} className="text-accent" /> Моя библиотека
      </h1>

      <div className="flex gap-2">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`chip ${tab === id ? "bg-accent text-accent-contrast" : "bg-elevated text-muted hover:text-fg"}`}
          >
            <Icon size={14} /> {label}
            <span className="tabular-nums opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {tab === "playlists" && (
        playlists.length === 0 ? (
          <EmptyState
            icon={<IconPlaylist size={22} />}
            title="Пока нет плейлистов"
            hint="Создайте плейлист — он сохранится на сервере и будет доступен с любого устройства."
            action={<Link to="/playlists" className="btn-secondary">Создать плейлист</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {playlists.map((pl) => (
              <Link key={pl.id} to={`/playlists/${pl.id}`} className="card p-3 hover:bg-elevated">
                <Cover seed={(pl.title.charCodeAt(0) * 7919 + pl.title.length) % 100000} size={200} rounded="md" alt={pl.title} className="w-full h-auto !rounded-md" />
                <p className="mt-2.5 truncate text-sm font-semibold">{pl.title}</p>
                <p className="truncate text-xs text-muted">{pl._count?.tracks ?? pl.tracks?.length ?? 0} треков</p>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === "favorites" && (
        favTracks.length === 0 ? (
          <EmptyState icon={<IconHeart size={22} />} title="В избранном пусто" hint="Нажимайте ♥ у треков — они появятся здесь." action={<Link to="/search" className="btn-secondary">Найти музыку</Link>} />
        ) : (
          <>
            <button className="btn-primary" onClick={() => playTrack(favTracks[0], favTracks, "Избранное")}>
              <IconPlay size={15} /> Играть всё
            </button>
            <div className="card divide-y divide-line p-1.5">
              {favTracks.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} queue={favTracks} contextLabel="Избранное" />
              ))}
            </div>
          </>
        )
      )}

      {tab === "history" && (
        histTracks.length === 0 ? (
          <EmptyState icon={<IconClock size={22} />} title="История пуста" hint="Начните слушать — прослушивания сохраняются на сервере." />
        ) : (
          <div className="card divide-y divide-line p-1.5">
            {histTracks.map((t, i) => (
              <div key={`${t.id}-${history[i]?.playedAt ?? i}`} className="min-w-0">
                <TrackRow track={t} index={i} queue={histTracks} contextLabel="История" />
                {history[i]?.playedAt && (
                  <p className="-mt-6 ml-14 text-[11px] text-faint">
                    {new Date(history[i].playedAt).toLocaleString("ru-RU")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
