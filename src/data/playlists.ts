import type { Playlist } from "../types";

/** Seed playlists for the demo library. User edits persist locally. */
export const SEED_PLAYLISTS: Playlist[] = [
  {
    id: "pl-focus",
    title: "Фокус и работа",
    description: "Спокойные инструментальные треки для глубокой концентрации.",
    trackIds: ["t2", "t3", "t8", "t6"],
    coverSeed: 101,
    editable: true,
  },
  {
    id: "pl-electro",
    title: "Электронная ночь",
    description: "Плотный бас и неоновые синты.",
    trackIds: ["t1", "t5", "t7"],
    coverSeed: 202,
    editable: true,
  },
  {
    id: "pl-discover",
    title: "Находки недели",
    description: "Персональная подборка обновлений. Обновляется каждую пятницу.",
    trackIds: ["t4", "t6", "t2", "t1", "t3"],
    coverSeed: 303,
    editable: false,
  },
];
