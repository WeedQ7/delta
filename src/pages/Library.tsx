import { useState } from "react";
import { Link } from "react-router-dom";
import { trackById } from "../data/tracks";
import { useLibrary } from "../stores/library";
import { TrackRow } from "../components/TrackRow";
import { EmptyState } from "../components/EmptyState";
import { Cover } from "../components/Cover";
import { IconLibrary, IconHeart, IconClock, IconPlus } from "../components/Icons";

export function LibraryPage() {
  const favorites = useLibrary((s) => s.favorites);
  const recentlyPlayed = useLibrary((s) => s.recentlyPlayed);
  const playlists = useLibrary((s) => s.playlists);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const [tab, setTab] = useState<"playlists" | "favorites" | "history">("playlists");
  const [newName, setNewName] = useState("");

  const favTracks = favorites.map(trackById).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const histTracks = recentlyPlayed.map(trackById).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const tabs = [
    { id: "playlists" as const, label: "Плейлисты", icon: IconLibrary, count: playlists.length },
    { id: "favorites" as const, label: "Избранное", icon: IconHeart, count: favTracks.length },
    { id: "history" as const, label: "История", icon: IconClock, count: histTracks.length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="section-title text-2xl">Моя библиотека</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-pill bg-elevated p-1">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-pill px-3 py-2 text-sm font-medium transition-colors ${
              tab === id ? "bg-surface text-fg shadow-pop" : "text-muted hover:text-fg"
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
            <span className="tabular-nums text-xs opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {tab === "playlists" && (
        <>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = newName.trim();
              if (!name) return;
              createPlaylist(name);
              setNewName("");
            }}
          >
            <input
              className="input max-w-xs"
              placeholder="Название нового плейлиста"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              aria-label="Название нового плейлиста"
            />
            <button className="btn-primary shrink-0" disabled={!newName.trim()}>
              <IconPlus size={16} /> Создать
            </button>
          </form>

          {playlists.length === 0 ? (
            <EmptyState
              icon={<IconLibrary size={22} />}
              title="Плейлистов пока нет"
              hint="Создайте первый плейлист — и добавляйте в него треки из поиска или главной."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {playlists.map((pl) => (
                <Link key={pl.id} to={`/playlists/${pl.id}`} className="card group p-3 hover:bg-elevated">
                  <Cover seed={pl.coverSeed} size={160} rounded="md" alt={pl.title} className="w-full h-auto !rounded-md" />
                  <p className="mt-2.5 truncate text-sm font-semibold">{pl.title}</p>
                  <p className="truncate text-xs text-muted">
                    Плейлист · {pl.trackIds.length} треков
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "favorites" &&
        (favTracks.length === 0 ? (
          <EmptyState
            icon={<IconHeart size={22} />}
            title="В избранном пусто"
            hint="Нажимайте на сердце рядом с треком — любимая музыка соберётся здесь."
            action={<Link to="/search" className="btn-secondary">Найти музыку</Link>}
          />
        ) : (
          <div className="card divide-y divide-line p-1.5">
            {favTracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} queue={favTracks} contextLabel="Избранное" />
            ))}
          </div>
        ))}

      {tab === "history" &&
        (histTracks.length === 0 ? (
          <EmptyState
            icon={<IconClock size={22} />}
            title="История прослушиваний пуста"
            hint="Здесь появятся треки, которые вы включали последними."
            action={<Link to="/" className="btn-secondary">К главной</Link>}
          />
        ) : (
          <div className="card divide-y divide-line p-1.5">
            {histTracks.map((t, i) => (
              <TrackRow key={`${t.id}-${i}`} track={t} index={i} queue={histTracks} contextLabel="История" />
            ))}
          </div>
        ))}
    </div>
  );
}
