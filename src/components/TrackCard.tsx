import type { Track } from "../types";
import { usePlayer } from "../stores/player";
import { Cover } from "./Cover";

/** Card used in shelves (Home/Search): cover + title + artist, plays whole list. */
export function TrackCard({ track, queue, label }: { track: Track; queue: Track[]; label: string }) {
  const playTrack = usePlayer((s) => s.playTrack);
  return (
    <button
      onClick={() => playTrack(track, queue, label)}
      className="card group w-40 shrink-0 p-3 text-left transition-colors hover:bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="relative">
        <Cover seed={track.coverSeed} size={136} rounded="md" alt={track.album} className="w-full h-auto !rounded-md" />
        <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-pill bg-accent text-accent-contrast opacity-0 shadow-pop translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 4.8v14.4c0 .8.9 1.3 1.6.9l11.2-7.2c.6-.4.6-1.3 0-1.7L8.6 3.9c-.7-.4-1.6.1-1.6.9Z" />
          </svg>
        </span>
      </div>
      <p className="mt-2.5 truncate text-sm font-semibold">{track.title}</p>
      <p className="truncate text-xs text-muted">{track.artist}</p>
    </button>
  );
}
