import { useState } from "react";
import type { Track } from "../types";
import { usePlayer } from "../stores/player";
import { useLibrary } from "../stores/library";
import { formatTime } from "../lib/utils";
import { Cover } from "./Cover";
import { IconHeart, IconPlay, IconPause, IconPlus, IconQueue } from "./Icons";

interface TrackRowProps {
  track: Track;
  index?: number;
  /** queue this track belongs to (played as context) */
  queue?: Track[];
  contextLabel?: string;
  onAddToPlaylist?: (trackId: string) => void;
}

export function TrackRow({ track, index, queue, contextLabel, onAddToPlaylist }: TrackRowProps) {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playTrack = usePlayer((s) => s.playTrack);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const addToQueue = usePlayer((s) => s.addToQueue);
  const favorites = useLibrary((s) => s.favorites);
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);

  const isCurrent = current?.id === track.id;
  const isFav = favorites.includes(track.id);
  const [hover, setHover] = useState(false);

  const handlePlay = () => {
    if (isCurrent) togglePlay();
    else playTrack(track, queue ?? [track], contextLabel);
  };

  return (
    <div
      className={`group flex items-center gap-3 rounded-card px-2 py-2 transition-colors ${
        isCurrent ? "bg-accent/10" : "hover:bg-elevated"
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* index / play button */}
      <button
        onClick={handlePlay}
        className="relative w-8 h-8 shrink-0 flex items-center justify-center text-sm tabular-nums text-muted hover:text-fg"
        aria-label={isCurrent && isPlaying ? `Пауза: ${track.title}` : `Играть: ${track.title}`}
      >
        {hover || isCurrent ? (
          isCurrent && isPlaying ? (
            <IconPause size={16} className="text-accent" />
          ) : (
            <IconPlay size={16} className={isCurrent ? "text-accent" : ""} />
          )
        ) : index !== undefined ? (
          <span>{index + 1}</span>
        ) : (
          <IconPlay size={16} />
        )}
      </button>

      <Cover seed={track.coverSeed} size={40} alt={track.album} />

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${isCurrent ? "text-accent" : "text-fg"}`}>
          {track.title}
        </p>
        <p className="truncate text-xs text-muted">{track.artist}</p>
      </div>

      <span className="hidden sm:block text-xs text-faint w-24 truncate">{track.album}</span>

      <div className="flex items-center gap-0.5">
        {onAddToPlaylist && (
          <button
            className="icon-btn !w-8 !h-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            title="Добавить в плейлист"
            aria-label="Добавить в плейлист"
            onClick={() => onAddToPlaylist(track.id)}
          >
            <IconPlus size={16} />
          </button>
        )}
        <button
          className="icon-btn !w-8 !h-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          title="В очередь"
          aria-label="Добавить в очередь"
          onClick={() => addToQueue(track)}
        >
          <IconQueue size={16} />
        </button>
        <button
          className={`icon-btn !w-8 !h-8 ${isFav ? "text-accent opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
          title={isFav ? "Убрать из избранного" : "В избранное"}
          aria-label={isFav ? "Убрать из избранного" : "Добавить в избранное"}
          aria-pressed={isFav}
          onClick={() => toggleFavorite(track.id)}
        >
          <IconHeart size={16} filled={isFav} />
        </button>
      </div>

      <span className="w-10 text-right text-xs tabular-nums text-faint">
        {formatTime(track.durationSec)}
      </span>
    </div>
  );
}
