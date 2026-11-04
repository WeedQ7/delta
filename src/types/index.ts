/**
 * DELTA shared data types.
 * These types are designed to be reusable by future clients
 * (Windows / macOS / Linux / Android / iOS) and the future API layer.
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
  url: string;
  /** deterministic seed used to render a generative cover */
  coverSeed: number;
  /** real cover image URL from the backend, if available */
  coverUrl?: string;
  genre: string;
  year: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
  coverSeed: number;
  editable: boolean;
}

export type PlanTier = "FREE" | "PLUS" | "DUO" | "FAMILY" | "INFINITY";

export interface PlanFeatures {
  losslessAudio: boolean;
  offlineDownloads: boolean;
  maxDevices: number;
  adFree: boolean;
  earlyAccess: boolean;
}

export interface SubscriptionPlan {
  tier: PlanTier;
  name: string;
  priceMonthlyRub: number;
  seats: number;
  tagline: string;
  features: PlanFeatures;
  /** In production these come from the admin-configurable backend, not code. */
  configurableByAdmin: true;
}

export type CoinTxType = "purchase" | "spend" | "refund" | "topup_demo" | "reward";

export interface CoinTransaction {
  id: string;
  createdAt: string; // ISO
  type: CoinTxType;
  amount: number; // signed: + credit, - debit
  balanceAfter: number;
  description: string;
  idempotencyKey?: string;
}

export interface CoinPack {
  id: string;
  coins: number;
  bonusCoins: number;
  priceRub: number;
  label: string;
  popular?: boolean;
}

export interface MarketplaceItem {
  id: string;
  kind: "theme" | "username";
  title: string;
  creator: string;
  priceCoins: number;
  accent: AccentName;
  description: string;
  owned: boolean;
}

export type ThemeMode = "dark" | "light" | "system";

export type AccentName = "emerald" | "violet" | "rose" | "amber" | "sky";

export type RepeatMode = "off" | "all" | "one";

export interface UserProfile {
  displayName: string;
  username: string;
  plan: PlanTier;
  joinedAt: string;
}
