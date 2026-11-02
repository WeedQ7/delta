import { useEffect, useRef } from "react";

/**
 * Range slider styled with the delta-range class.
 * Sets --fill CSS var so the track shows progress color.
 */
interface SliderProps {
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
  ariaLabel: string;
}

export function Slider({ value, min = 0, max, step = 1, onChange, className, ariaLabel }: SliderProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
    el.style.setProperty("--fill", `${Math.min(100, Math.max(0, pct))}%`);
  }, [value, min, max]);

  return (
    <input
      ref={ref}
      type="range"
      className={`delta-range ${className ?? ""}`}
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
