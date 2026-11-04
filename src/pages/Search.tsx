import { useEffect, useState } from "react";
import { useData } from "../stores/data";
import { musicApi, toFrontTrack, type ApiTrack } from "../lib/api";
import type { Track } from "../types";
import { usePlayer } from "../stores/player";
import { TrackRow } from "../components/TrackRow";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox, PlaylistPicker, Spinner } from "../components/ui";
import { IconSearch, IconClose, IconPlay } from "../components/Icons";

export function SearchPage() {
  const genres = useData((s) => s.genres);
  const loaded = useData((s) => s.loaded);
  const loadAll = useData((s) => s.loadAll);

  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<Track[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const playTrack = usePlayer((s) => s.playTrack);

  useEffect(() => {
    if (!loaded) void loadAll();
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Real server search (with client-side genre filter on the returned page).
  useEffect(() => {
    let alive = true;
    setError(null);
    if (!debounced && !genre) {
      // empty query: show full catalog via trending endpoint (backend rejects empty q with 400)
      musicApi
        .trending()
        .then((r) => alive && setResults(r.map(toFrontTrack)))
        .catch((e) => alive && setError(e.message));
      return;
    }
    musicApi
      .search(debounced)
      .then((r: ApiTrack[]) => {
        if (!alive) return;
        const list = r.map(toFrontTrack);
        setResults(genre ? list.filter((t) => t.genre === genre) : list);
      })
      .catch((e) => alive && setError(e.message || "Ошибка поиска"));
    return () => {
      alive = false;
    };
  }, [debounced, genre]);

  return (
    <div className="space-y-6">
      <h1 className="section-title text-2xl">Поиск музыки</h1>

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

      <div className="flex flex-wrap gap-2">
        <button
          className={`chip ${!genre ? "bg-accent text-accent-contrast" : "bg-elevated text-muted hover:text-fg"}`}
          onClick={() => setGenre(null)}
        >
          Все
        </button>
        {genres.map((g) => (
          <button
            key={g}
            className={`chip ${genre === g ? "bg-accent text-accent-contrast" : "bg-elevated text-muted hover:text-fg"}`}
            onClick={() => setGenre(genre === g ? null : g)}
          >
            {g}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorBox message={error} onRetry={() => setDebounced((d) => d + "")} />
      ) : results === null ? (
        <Spinner />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<IconSearch size={22} />}
          title="Ничего не найдено"
          hint={debounced ? `По запросу «${debounced}» совпадений нет. Попробуйте другое слово или снимите фильтр жанра.` : "Введите запрос, чтобы найти треки."}
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

      <PlaylistPicker trackId={pickerFor} onClose={() => setPickerFor(null)} />
    </div>
  );
}
