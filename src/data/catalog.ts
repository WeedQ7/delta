import type { CoinPack, MarketplaceItem, SubscriptionPlan } from "../types";

/**
 * Subscription plans. NOTE: in production these values must be served by the
 * API (admin-configurable). This file is only the demo fallback so the UI
 * renders real data before the backend exists.
 */
export const PLANS: SubscriptionPlan[] = [
  {
    tier: "FREE",
    name: "DELTA Free",
    priceMonthlyRub: 0,
    seats: 1,
    tagline: "Слушать музыку с рекламой",
    features: {
      losslessAudio: false,
      offlineDownloads: false,
      maxDevices: 2,
      adFree: false,
      earlyAccess: false,
    },
    configurableByAdmin: true,
  },
  {
    tier: "PLUS",
    name: "DELTA Plus",
    priceMonthlyRub: 299,
    seats: 1,
    tagline: "Персональный тариф без рекламы",
    features: {
      losslessAudio: true,
      offlineDownloads: true,
      maxDevices: 3,
      adFree: true,
      earlyAccess: false,
    },
    configurableByAdmin: true,
  },
  {
    tier: "DUO",
    name: "DELTA Duo",
    priceMonthlyRub: 449,
    seats: 2,
    tagline: "Для двоих, живущих вместе",
    features: {
      losslessAudio: true,
      offlineDownloads: true,
      maxDevices: 6,
      adFree: true,
      earlyAccess: false,
    },
    configurableByAdmin: true,
  },
  {
    tier: "FAMILY",
    name: "DELTA Family",
    priceMonthlyRub: 599,
    seats: 6,
    tagline: "До шести аккаунтов",
    features: {
      losslessAudio: true,
      offlineDownloads: true,
      maxDevices: 18,
      adFree: true,
      earlyAccess: false,
    },
    configurableByAdmin: true,
  },
  {
    tier: "INFINITY",
    name: "DELTA Infinity",
    priceMonthlyRub: 999,
    seats: 6,
    tagline: "Максимум качества и ранний доступ",
    features: {
      losslessAudio: true,
      offlineDownloads: true,
      maxDevices: 24,
      adFree: true,
      earlyAccess: true,
    },
    configurableByAdmin: true,
  },
];

/** DELTA Coins packs (demo prices). Platform fee shown transparently. */
export const COIN_PACKS: CoinPack[] = [
  { id: "p100", coins: 100, bonusCoins: 0, priceRub: 99, label: "Старт" },
  { id: "p500", coins: 500, bonusCoins: 25, priceRub: 459, label: "Обычный", popular: true },
  { id: "p1200", coins: 1200, bonusCoins: 100, priceRub: 999, label: "Большой" },
  { id: "p3000", coins: 3000, bonusCoins: 400, priceRub: 2290, label: "Максимум" },
];

/** Demo platform commission — will live in admin settings on the server. */
export const PLATFORM_FEE_PERCENT = 15;

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: "mk-1",
    kind: "theme",
    title: "Северное сияние",
    creator: "delta.studio",
    priceCoins: 250,
    accent: "sky",
    description: "Холодная палитра с мягким голубым акцентом.",
    owned: false,
  },
  {
    id: "mk-2",
    kind: "theme",
    title: "Аметист",
    creator: "lumen",
    priceCoins: 180,
    accent: "violet",
    description: "Глубокий фиолетовый акцент для ночных сессий.",
    owned: false,
  },
  {
    id: "mk-3",
    kind: "theme",
    title: "Закат в Токио",
    creator: "neon.kit",
    priceCoins: 320,
    accent: "rose",
    description: "Тёплые розовые тона с высоким контрастом.",
    owned: false,
  },
  {
    id: "mk-4",
    kind: "theme",
    title: "Медь",
    creator: "analog.hearts",
    priceCoins: 150,
    accent: "amber",
    description: "Янтарный акцент в духе винтажных студий.",
    owned: false,
  },
  {
    id: "mk-5",
    kind: "username",
    title: "@aurora",
    creator: "system",
    priceCoins: 1500,
    accent: "emerald",
    description: "Короткий юзернейм из пяти букв. Доступен к выкупу.",
    owned: false,
  },
  {
    id: "mk-6",
    kind: "username",
    title: "@bassline",
    creator: "system",
    priceCoins: 900,
    accent: "emerald",
    description: "Музыкальный юзернейм для продюсеров.",
    owned: false,
  },
];
