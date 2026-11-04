import type { Track } from "../types";

/**
 * Demo catalog. Audio files are locally generated test tones
 * (public/audio/*.mp3) — honest placeholders until real music
 * integrations are connected via the API.
 */
export const TRACKS: Track[] = [
  {
    id: "t1",
    title: "Neon Currents",
    artist: "Astra Wave",
    album: "Signal Drift",
    durationSec: 26,
    url: "/audio/track1.mp3",
    coverSeed: 11,
    genre: "Электроника",
    year: 2025,
  },
  {
    id: "t2",
    title: "Morning Frame",
    artist: "Kito Lune",
    album: "Quiet Architecture",
    durationSec: 24,
    url: "/audio/track2.mp3",
    coverSeed: 27,
    genre: "Lo-Fi",
    year: 2024,
  },
  {
    id: "t3",
    title: "Deep Field",
    artist: "Nova Meridian",
    album: "Parallax",
    durationSec: 28,
    url: "/audio/track3.mp3",
    coverSeed: 42,
    genre: "Ambient",
    year: 2025,
  },
  {
    id: "t4",
    title: "Static Bloom",
    artist: "The Paper Suns",
    album: "Analog Hearts",
    durationSec: 22,
    url: "/audio/track4.mp3",
    coverSeed: 58,
    genre: "Инди",
    year: 2023,
  },
  {
    id: "t5",
    title: "Gravity Well",
    artist: "Monolake FM",
    album: "Orbital Decay",
    durationSec: 25,
    url: "/audio/track5.mp3",
    coverSeed: 73,
    genre: "Техно",
    year: 2026,
  },
  {
    id: "t6",
    title: "Glass Harbour",
    artist: "Yuna Reyes",
    album: "Tidewater",
    durationSec: 23,
    url: "/audio/track6.mp3",
    coverSeed: 84,
    genre: "Поп",
    year: 2025,
  },
  {
    id: "t7",
    title: "Low Orbit",
    artist: "Astra Wave",
    album: "Signal Drift",
    durationSec: 27,
    url: "/audio/track7.mp3",
    coverSeed: 96,
    genre: "Электроника",
    year: 2025,
  },
  {
    id: "t8",
    title: "Sunday Signal",
    artist: "Kito Lune",
    album: "Quiet Architecture",
    durationSec: 21,
    url: "/audio/track8.mp3",
    coverSeed: 5,
    genre: "Lo-Fi",
    year: 2024,
  },
];

export const trackById = (id: string): Track | undefined =>
  TRACKS.find((t) => t.id === id);

export const GENRES = [...new Set(TRACKS.map((t) => t.genre))];
