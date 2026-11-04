import { create } from "zustand";
import type { RepeatMode, Track } from "../types";

/**
 * Player state store. The actual <audio> element lives in AudioEngine
 * (src/audio/engine.ts) — this store only holds UI state and is written
 * back to by engine events. Kept free of DOM so other clients could reuse it.
 */
interface PlayerState {
  current: Track | null;
  queue: Track[];
  queueIndex: number;
  contextLabel: string; // e.g. playlist name the queue came from
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  repeat: RepeatMode;
  shuffle: boolean;
  playTrack: (track: Track, queue?: Track[], label?: string) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  setRepeat: (r: RepeatMode) => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  jumpTo: (index: number) => void;
  clearQueue: () => void;
  // internal, driven by the audio engine:
  _sync: (patch: Partial<PlayerState>) => void;
}

export const usePlayer = create<PlayerState>()((set, get) => ({
  current: null,
  queue: [],
  queueIndex: -1,
  contextLabel: "",
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  repeat: "off",
  shuffle: false,

  playTrack: (track, queue, label) => {
    const q = queue ?? [track];
    const idx = Math.max(0, q.findIndex((t) => t.id === track.id));
    set({
      current: track,
      queue: q,
      queueIndex: idx,
      contextLabel: label ?? "",
      isPlaying: true,
      currentTime: 0,
      duration: track.durationSec,
    });
  },

  togglePlay: () => {
    const { current } = get();
    if (!current) return;
    set((s) => ({ isPlaying: !s.isPlaying }));
  },

  next: () => {
    const { queue, queueIndex, shuffle, repeat } = get();
    if (queue.length === 0) return;
    if (repeat === "one") {
      set({ currentTime: 0 });
      return;
    }
    let idx: number;
    if (shuffle && queue.length > 1) {
      do {
        idx = Math.floor(Math.random() * queue.length);
      } while (idx === queueIndex);
    } else {
      idx = queueIndex + 1;
      if (idx >= queue.length) idx = repeat === "all" ? 0 : -1;
    }
    if (idx === -1) {
      set({ isPlaying: false, currentTime: 0 });
      return;
    }
    set({ queueIndex: idx, current: queue[idx], currentTime: 0, isPlaying: true });
  },

  prev: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const idx = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
    set({ queueIndex: idx, current: queue[idx], currentTime: 0, isPlaying: true });
  },

  seek: (sec) => set({ currentTime: Math.max(0, sec) }),

  setRepeat: (repeat) => set({ repeat }),
  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
    })),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  addToQueue: (track) =>
    set((s) => {
      const queue = [...s.queue, track];
      const first = s.current === null;
      // keep queueIndex consistent with the real position of `current`,
      // otherwise next/prev jump to wrong items after "add to queue"
      let idx = first ? 0 : s.queueIndex;
      if (!first && idx >= 0) {
        const pos = queue.findIndex((t) => t.id === s.current!.id);
        if (pos >= 0) idx = pos;
      }
      return {
        queue,
        current: first ? track : s.current,
        queueIndex: idx,
        isPlaying: first ? true : s.isPlaying,
      };
    }),

  removeFromQueue: (index) =>
    set((s) => {
      const queue = s.queue.filter((_, i) => i !== index);
      let queueIndex = s.queueIndex;
      let current = s.current;
      let isPlaying = s.isPlaying;
      if (index < queueIndex) queueIndex -= 1;
      else if (index === queueIndex) {
        if (queue.length === 0) {
          current = null;
          queueIndex = -1;
          isPlaying = false;
        } else {
          queueIndex = Math.min(queueIndex, queue.length - 1);
          current = queue[queueIndex];
        }
      }
      return { queue, queueIndex, current, isPlaying };
    }),

  jumpTo: (index) =>
    set((s) => {
      const t = s.queue[index];
      if (!t) return s;
      return { queueIndex: index, current: t, currentTime: 0, isPlaying: true };
    }),

  clearQueue: () => set({ queue: [], queueIndex: -1, current: null, isPlaying: false }),

  _sync: (patch) => set(patch),
}));
