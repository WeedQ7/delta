import { memo, useMemo } from "react";
import { mulberry32 } from "../lib/utils";

/**
 * Generative cover art — deterministic SVG derived from a numeric seed.
 * No random stock images: every track/playlist gets a stable, unique artwork.
 */

const PALETTES = [
  ["#0ea5e9", "#22d3ee", "#0f172a"],
  ["#8b5cf6", "#d946ef", "#1e1b4b"],
  ["#f43f5e", "#fb923c", "#1c1017"],
  ["#10b981", "#a3e635", "#052e16"],
  ["#f59e0b", "#ef4444", "#451a03"],
  ["#6366f1", "#22d3ee", "#111827"],
  ["#ec4899", "#8b5cf6", "#18040e"],
  ["#14b8a6", "#84cc16", "#042f2e"],
];

type Shape =
  | { k: "circle"; cx: number; cy: number; r: number; c: string; o: number }
  | { k: "wave"; y: number; amp: number; freq: number; phase: number; c: string; o: number };

function buildShapes(seed: number): Shape[] {
  const rnd = mulberry32(seed);
  const shapes: Shape[] = [];
  const circles = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < circles; i++) {
    shapes.push({
      k: "circle",
      cx: rnd() * 100,
      cy: rnd() * 100,
      r: 12 + rnd() * 34,
      c: `hsl(${Math.floor(rnd() * 360)} 80% 60%)`,
      o: 0.25 + rnd() * 0.45,
    });
  }
  const waves = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < waves; i++) {
    shapes.push({
      k: "wave",
      y: 30 + rnd() * 60,
      amp: 6 + rnd() * 14,
      freq: 1 + rnd() * 2.5,
      phase: rnd() * Math.PI * 2,
      c: `hsl(${Math.floor(rnd() * 360)} 85% 65%)`,
      o: 0.3 + rnd() * 0.4,
    });
  }
  return shapes;
}

function wavePath(y: number, amp: number, freq: number, phase: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= 100; x += 4) {
    const yy = y + Math.sin((x / 100) * Math.PI * 2 * freq + phase) * amp;
    pts.push(`${x === 0 ? "M" : "L"}${x} ${yy.toFixed(1)}`);
  }
  return pts.join(" ");
}

interface CoverProps {
  seed: number;
  size?: number; // px, square
  rounded?: "sm" | "md" | "card" | "pill";
  className?: string;
  alt?: string;
}

const radiusMap = { sm: 4, md: 8, card: 14, pill: 999 } as const;

export const Cover = memo(function Cover({
  seed,
  size = 48,
  rounded = "md",
  className,
  alt = "",
}: CoverProps) {
  const palette = useMemo(() => PALETTES[seed % PALETTES.length], [seed]);
  const shapes = useMemo(() => buildShapes(seed * 7919), [seed]);
  const gid = `cg-${seed}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={alt}
      className={className}
      style={{ borderRadius: radiusMap[rounded], flexShrink: 0, display: "block" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette[0]} />
          <stop offset="55%" stopColor={palette[1]} />
          <stop offset="100%" stopColor={palette[2]} />
        </linearGradient>
        <clipPath id={`${gid}-clip`}>
          <rect width="100" height="100" rx={radiusMap[rounded] === 999 ? 50 : radiusMap[rounded]} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${gid}-clip)`}>
        <rect width="100" height="100" fill={`url(#${gid})`} />
        {shapes.map((s, i) =>
          s.k === "circle" ? (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.c} opacity={s.o} />
          ) : (
            <path
              key={i}
              d={wavePath(s.y, s.amp, s.freq, s.phase)}
              fill="none"
              stroke={s.c}
              strokeWidth={2.5}
              opacity={s.o}
              strokeLinecap="round"
            />
          )
        )}
      </g>
    </svg>
  );
});
