import type { ReactNode } from "react";

/** Inline SVG icon set — stroke-based, 24x24 grid, currentColor. */
type P = { className?: string; size?: number };

function S({ children, className, size = 20 }: P & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => (
  <S {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></S>
);
export const IconSearch = (p: P) => (
  <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></S>
);
export const IconLibrary = (p: P) => (
  <S {...p}><path d="M4 4v16" /><path d="M9 4v16" /><path d="m14 5 5 15" /></S>
);
export const IconPlaylist = (p: P) => (
  <S {...p}><path d="M4 6h10M4 12h10M4 18h6" /><path d="M17 10v8" /><circle cx="15.5" cy="18" r="1.8" /><path d="M17 10l4-1.5V13" /></S>
);
export const IconHeart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <S {...p}>
    <path
      d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.4 5 6.4 5c1.9 0 3.3 1 4.1 2.3h.1C11.4 6 12.8 5 14.7 5c3 0 5 2.9 3.7 6.3C16.6 15.9 12 20.5 12 20.5Z"
      fill={filled ? "currentColor" : "none"}
    />
  </S>
);
export const IconUser = (p: P) => (
  <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></S>
);
export const IconSettings = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.3 1a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-1-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a7 7 0 0 0 2-1.2l2.3 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z" />
  </S>
);
export const IconCrown = (p: P) => (
  <S {...p}><path d="M4 18h16" /><path d="M4 8 8 12l4-6 4 6 4-4-2 10H6L4 8Z" /></S>
);
export const IconCoin = (p: P) => (
  <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M14.5 9.5c-.6-.9-1.6-1.4-2.7-1.4-1.8 0-2.8 1-2.8 2.2 0 2.8 5.8 1.4 5.8 4 0 1.3-1.2 2.3-3 2.3-1.3 0-2.4-.6-3-1.5" /><path d="M12 6.5v11" /></S>
);
export const IconStore = (p: P) => (
  <S {...p}><path d="M4 10v10h16V10" /><path d="M3 6l1-3h16l1 3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" /><path d="M9 20v-6h6v6" /></S>
);
export const IconPlay = ({ size = 20, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M7 4.8v14.4c0 .8.9 1.3 1.6.9l11.2-7.2c.6-.4.6-1.3 0-1.7L8.6 3.9c-.7-.4-1.6.1-1.6.9Z" />
  </svg>
);
export const IconPause = ({ size = 20, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1.2" />
    <rect x="14" y="4" width="4" height="16" rx="1.2" />
  </svg>
);
export const IconPrev = ({ size = 20, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M7 5a1 1 0 0 1 2 0v14a1 1 0 0 1-2 0V5Z" />
    <path d="M19 5.9v12.2c0 .8-.9 1.3-1.6.9l-8-6.1a1 1 0 0 1 0-1.7l8-6.1c.7-.5 1.6 0 1.6.8Z" />
  </svg>
);
export const IconNext = ({ size = 20, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M15 5a1 1 0 0 1 2 0v14a1 1 0 0 1-2 0V5Z" />
    <path d="M5 5.9v12.2c0 .8.9 1.3 1.6.9l8-6.1a1 1 0 0 0 0-1.7l-8-6.1C5.9 5.1 5 5.6 5 5.9Z" transform="translate(0,-0.4)" />
  </svg>
);
export const IconShuffle = (p: P) => (
  <S {...p}><path d="M3 6h4l10 12h4" /><path d="M3 18h4L17 6h4" /><path d="m18 3 3 3-3 3M18 15l3 3-3 3" /></S>
);
export const IconRepeat = ({ mode, ...p }: P & { mode?: "all" | "one" }) => (
  <S {...p}>
    <path d="M6 4h11a4 4 0 0 1 4 4v1" /><path d="m4 7-2-3 3-2" transform="translate(1,3)" />
    <path d="M18 20H7a4 4 0 0 1-4-4v-1" /><path d="m20 17 2 3-3 2" transform="translate(-1,-3)" />
    {mode === "one" && <text x="12" y="15" fontSize="8" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="bold">1</text>}
  </S>
);
export const IconQueue = (p: P) => (
  <S {...p}><path d="M4 6h12M4 12h12M4 18h7" /><path d="M18 14v6" /><path d="m21 17-3 3-3-3" transform="rotate(180 18 18.5) translate(0,-1)" /></S>
);
export const IconVolume = ({ muted, ...p }: P & { muted?: boolean }) => (
  <S {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" stroke="none" />
    {muted ? <path d="m17 9 4 6M21 9l-4 6" /> : <><path d="M16 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a8 8 0 0 1 0 11" /></>}
  </S>
);
export const IconClose = (p: P) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>;
export const IconPlus = (p: P) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const IconTrash = (p: P) => (
  <S {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></S>
);
export const IconCheck = (p: P) => <S {...p}><path d="m5 12.5 4.5 4.5L19 7" /></S>;
export const IconChevronDown = (p: P) => <S {...p}><path d="m6 9 6 6 6-6" /></S>;
export const IconMoon = (p: P) => <S {...p}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" /></S>;
export const IconSun = (p: P) => (
  <S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></S>
);
export const IconMonitor = (p: P) => (
  <S {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M9 20h6M12 16v4" /></S>
);
export const IconMore = (p: P) => (
  <S {...p}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></S>
);
export const IconClock = (p: P) => (
  <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></S>
);
export const IconGlobe = (p: P) => (
  <S {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" /></S>
);

export const IconBell = (p: P) => (
  <S {...p}><path d="M6 9.5a6 6 0 1 1 12 0c0 4.5 2 5.5 2 5.5H4s2-1 2-5.5Z" /><path d="M10 19.5a2 2 0 0 0 4 0" /></S>
);
export const IconSparkle = (p: P) => (
  <S {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></S>
);
