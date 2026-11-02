import { useEffect, useMemo, useState } from "react";
import { TRACKS, GENRES, trackById } from "../data/tracks";
import { useLibrary } from "../stores/library";
import { usePlayer } from "../stores/player";
import { TrackRow } from "../components/TrackRow";
import { EmptyState } from "../components/EmptyState";
import { Cover } from "../components/Cover";
import { IconSearch, IconClose, IconPlay } from "../components/Icons";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [debounced, setDebounced] = useState("");
  const playlists = useLibrary((s) => s.playlists);
  const addToPlaylist = useLibrary((s) => s.addToPlaylist);
  const playTrack = usePlayer((s) => s.playTrack);
  const [pickerFor, setPickerFor] = useState<string | null>(null); // trackId

  // light debounce to keep typing snappy
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    let list = TRACKS;
    if (genre) list = list.filter((t) => t.genre === genre);
    if (!debounced) return list;
    return list.filter((t) =>
      [t.title, t.artist, t.album, t.genre].some((f) => f.toLowerCase().includes(debounced))
    );
  }, [debounced, genre]);

  return (
    <div className="space-y-6">
      <h1 className="section-title text-2xl">Поиск музыки</h1>

      {/* Search field */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">
          <IconSearch size={18} />
        </span>
        <input
          className="input !pl-10"
          placeholder="Треки, исполнители, альбомы…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Поиск музыки"
          autoFocus
        />
        {query && (
          <button
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-fg"
            onClick={() => setQuery("")}
            aria-label="Очистить поиск"
          >
            <IconClose size={16} />
          </button>
        )}
      </div>

      {/* Genre chips */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`chip ${!genre ? "bg-accent text-accent-contrast" : "bg-elevated text-muted hover:text-fg"}`}
          onClick={() => setGenre(null)}
        >
          Все
        </button>
        {GENRES.map((g) => (
          <button
            key={g}
            className={`chip ${genre === g ? "bg-accent text-accent-contrast" : "bg-elevated text-muted hover:text-fg"}`}
            onClick={() => setGenre(genre === g ? null : g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <EmptyState
          icon={<IconSearch size={22} />}
          title="Ничего не найдено"
          hint={`По запросу «${query}» в демо-каталоге совпадений нет. Попробуйте другое слово или снимите фильтр жанра.`}
          action={
            <button className="btn-secondary" onClick={() => { setQuery(""); setGenre(null); }}>
              Сбросить фильтры
            </button>
          }
        />
      ) : (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-muted">{results.length} совпадений</p>
            <button className="btn-ghost !py-1 text-xs" onClick={() => playTrack(results[0], results, "Поиск")}>
              <IconPlay size={14} /> Играть все
            </button>
          </div>
          <div className="card divide-y divide-line p-1.5">
            {results.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                index={i}
                queue={results}
                contextLabel="Поиск"
                onAddToPlaylist={(id) => setPickerFor(id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Add-to-playlist picker modal */}
      {pickerFor && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setPickerFor(null)}
          role="dialog"
          aria-label="Выберите плейлист"
        >
          <div
            className="card w-full max-w-sm animate-fade-up bg-surface p-4 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-sm font-semibold">
              Добавить «{trackById(pickerFor)?.title}» в плейлист
            </p>
            <ul className="space-y-1">
              {playlists.map((pl) => (
                <li key={pl.id}>
                  <button
                    className="flex w-full items-center gap-3 rounded-card px-2 py-2 text-left text-sm hover:bg-elevated"
                    onClick={() => {
                      addToPlaylist(pl.id, pickerFor);
                      setPickerFor(null);
                    }}
                  >
                    <Cover seed={pl.coverSeed} size={32} alt={pl.title} />
                    {pl.title}
                  </button>
                </li>
              ))}
            </ul>
            <button className="btn-ghost mt-3 w-full" onClick={() => setPickerFor(null)}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
