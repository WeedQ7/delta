import { useEffect } from "react";
import { usePlayer } from "../stores/player";
import { useLibrary } from "../stores/library";
import { useSettings } from "../stores/settings";

/**
 * AudioEngine — the only place that touches the DOM <audio> element.
 * Subscribes to player-store state and drives playback; writes time/duration
 * events back into the store via _sync. Business logic stays in the store,
 * so other clients (desktop/mobile) can reuse it with their own engines.
 */
let audioEl: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "metadata";
  }
  return audioEl;
}

/** Imperative helpers used by components (seek needs real element access). */
export const audioApi = {
  seekTo(sec: number) {
    const a = getAudio();
    if (a.readyState >= 1 || Number.isFinite(a.duration)) {
      a.currentTime = sec;
    }
    usePlayer.getState()._sync({ currentTime: sec });
  },
};

/** Mount once in App. Returns nothing; purely wires store <-> element. */
export function useAudioEngine() {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const currentTime = usePlayer((s) => s.currentTime);
  const volume = useSettings((s) => s.volume);
  const repeat = usePlayer((s) => s.repeat);

  // Load source when track changes
  useEffect(() => {
    const a = getAudio();
    if (!current) {
      a.pause();
      a.removeAttribute("src");
      return;
    }
    if (a.src !== new URL(current.url, location.origin).href) {
      a.src = current.url;
      a.load();
    }
    useLibrary.getState().markPlayed(current.id);
  }, [current]);

  // Play / pause
  useEffect(() => {
    const a = getAudio();
    if (!current) return;
    if (isPlaying) {
      a.play().catch(() => {
        // Autoplay blocked or load error — reflect reality, don't hide it.
        usePlayer.getState()._sync({ isPlaying: false });
      });
    } else {
      a.pause();
    }
  }, [isPlaying, current]);

  // Volume
  useEffect(() => {
    getAudio().volume = volume;
  }, [volume]);

  // Seek when store time jumps far from element time (prev/restart/seek)
  useEffect(() => {
    const a = getAudio();
    if (Math.abs(a.currentTime - currentTime) > 1.5) {
      audioApi.seekTo(currentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime]);

  // Element events -> store
  useEffect(() => {
    const a = getAudio();
    const onTime = () =>
      usePlayer.getState()._sync({ currentTime: a.currentTime });
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        usePlayer.getState()._sync({ duration: a.duration });
      }
    };
    const onEnded = () => {
      const st = usePlayer.getState();
      if (st.repeat === "one") {
        a.currentTime = 0;
        void a.play();
      } else {
        st.next();
      }
    };
    const onPause = () => {
      // Only mirror user-driven pauses; store controls are authoritative otherwise.
      if (usePlayer.getState().isPlaying && !a.ended) {
        usePlayer.getState()._sync({ isPlaying: false });
      }
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  // keep repeat referenced to avoid unused-var lint noise in strict builds
  void repeat;
}
