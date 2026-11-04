import { useState } from "react";
import { usePlayer } from "../stores/player";
import { useSettings } from "../stores/settings";
import { useLibrary } from "../stores/library";
import { audioApi } from "../audio/engine";
import { formatTime } from "../lib/utils";
import { Cover } from "./Cover";
import { Slider } from "./Slider";
import {
  IconPlay,
  IconPause,
  IconPrev,
  IconNext,
  IconShuffle,
  IconRepeat,
  IconVolume,
  IconQueue,
  IconClose,
  IconHeart,
} from "./Icons";

export function PlayerBar() {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const contextLabel = usePlayer((s) => s.contextLabel);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);

  const volume = useSettings((s) => s.volume);
  const setVolume = useSettings((s) => s.setVolume);
  const favorites = useLibrary((s) => s.favorites);
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);

  const [queueOpen, setQueueOpen] = useState(false);

  if (!current) return null;
  const isFav = favorites.includes(current.id);
  const dur = duration > 0 ? duration : current.durationSec;

  return (
    <>
      {queueOpen && <QueuePanel onClose={() => setQueueOpen(false)} />}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur shadow-player">
        {/* mobile progress line */}
        <div className="h-0.5 w-full bg-line md:hidden">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${dur > 0 ? (currentTime / dur) * 100 : 0}%` }}
          />
        </div>

        <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-3 sm:px-4">
          {/* Track info */}
          <div className="flex min-w-0 flex-1 items-center gap-3 md:w-64 md:flex-none">
            <Cover seed={current.coverSeed} size={44} alt={current.album} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{current.title}</p>
              <p className="truncate text-xs text-muted">
                {current.artist}
                {contextLabel && <span className="hidden sm:inline"> · {contextLabel}</span>}
              </p>
            </div>
            <button
              className={`icon-btn !w-8 !h-8 shrink-0 ${isFav ? "text-accent" : ""}`}
              onClick={() => toggleFavorite(current.id)}
              aria-label={isFav ? "Убрать из избранного" : "В избранное"}
            >
              <IconHeart size={16} filled={isFav} />
            </button>
          </div>

          {/* Center controls */}
          <div className="flex flex-[2] flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <button
                className={`icon-btn hidden sm:inline-flex ${shuffle ? "text-accent" : ""}`}
                onClick={toggleShuffle}
                aria-label="Перемешивание"
                aria-pressed={shuffle}
              >
                <IconShuffle size={17} />
              </button>
              <button className="icon-btn" onClick={prev} aria-label="Предыдущий трек">
                <IconPrev size={18} />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent text-accent-contrast transition hover:brightness-110 active:brightness-95"
                onClick={togglePlay}
                aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
              >
                {isPlaying ? <IconPause size={18} /> : <IconPlay size={18} />}
              </button>
              <button className="icon-btn" onClick={next} aria-label="Следующий трек">
                <IconNext size={18} />
              </button>
              <button
                className={`icon-btn hidden sm:inline-flex relative ${repeat !== "off" ? "text-accent" : ""}`}
                onClick={cycleRepeat}
                aria-label={`Повтор: ${repeat === "off" ? "выключен" : repeat === "all" ? "весь список" : "один трек"}`}
              >
                <IconRepeat size={17} mode={repeat === "one" ? "one" : undefined} />
              </button>
            </div>
            <div className="hidden md:flex w-full max-w-xl items-center gap-2">
              <span className="w-9 text-right text-[11px] tabular-nums text-faint">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={currentTime}
                max={dur || 1}
                step={0.5}
                onChange={(v) => {
                  seek(v);
                  audioApi.seekTo(v);
                }}
                ariaLabel="Перемотка"
                className="flex-1"
              />
              <span className="w-9 text-[11px] tabular-nums text-faint">{formatTime(dur)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex flex-1 items-center justify-end gap-1 md:w-64 md:flex-none">
            <button
              className={`icon-btn ${queueOpen ? "text-accent" : ""}`}
              onClick={() => setQueueOpen((v) => !v)}
              aria-label="Очередь воспроизведения"
              aria-expanded={queueOpen}
            >
              <IconQueue size={18} />
            </button>
            <button
              className="icon-btn hidden md:inline-flex"
              onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
              aria-label={volume === 0 ? "Включить звук" : "Выключить звук"}
            >
              <IconVolume size={18} muted={volume === 0} />
            </button>
            <Slider
              value={Math.round(volume * 100)}
              max={100}
              onChange={(v) => setVolume(v / 100)}
              ariaLabel="Громкость"
              className="hidden md:block w-24"
            />
          </div>
        </div>
      </div>

      {/* Mobile mini player sits above nothing — the bar itself is compact on mobile */}
    </>
  );
}

function QueuePanel({ onClose }: { onClose: () => void }) {
  const queue = usePlayer((s) => s.queue);
  const queueIndex = usePlayer((s) => s.queueIndex);
  const contextLabel = usePlayer((s) => s.contextLabel);
  const jumpTo = usePlayer((s) => s.jumpTo);
  const removeFromQueue = usePlayer((s) => s.removeFromQueue);
  const clearQueue = usePlayer((s) => s.clearQueue);

  return (
    <aside
      className="fixed bottom-16 right-0 top-0 z-50 w-full max-w-sm animate-fade-up border-l border-line bg-surface p-4 shadow-pop overflow-y-auto"
      role="dialog"
      aria-label="Очередь воспроизведения"
    >
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-base font-bold">Очередь</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Закрыть очередь">
          <IconClose size={18} />
        </button>
      </div>
      {contextLabel && <p className="mb-3 text-xs text-muted">{contextLabel}</p>}
      {queue.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">Очередь пуста.</p>
      ) : (
        <>
          <ul className="space-y-1">
            {queue.map((t, i) => (
              <li
                key={`${t.id}-${i}`}
                className={`group flex items-center gap-3 rounded-card px-2 py-1.5 ${
                  i === queueIndex ? "bg-accent/10" : "hover:bg-elevated"
                }`}
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => jumpTo(i)}
                >
                  <Cover seed={t.coverSeed} size={32} alt={t.album} />
                  <span className="min-w-0">
                    <span className={`block truncate text-sm ${i === queueIndex ? "text-accent font-semibold" : "font-medium"}`}>
                      {t.title}
                    </span>
                    <span className="block truncate text-xs text-muted">{t.artist}</span>
                  </span>
                </button>
                <button
                  className="icon-btn !w-7 !h-7 opacity-0 group-hover:opacity-100"
                  onClick={() => removeFromQueue(i)}
                  aria-label={`Убрать ${t.title} из очереди`}
                >
                  <IconClose size={14} />
                </button>
              </li>
            ))}
          </ul>
          <button className="btn-ghost mt-4 w-full" onClick={clearQueue}>
            Очистить очередь
          </button>
        </>
      )}
    </aside>
  );
}
