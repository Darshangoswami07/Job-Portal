import { useCallback } from "react";
import { SALARY_SLIDER } from "@/utils/jobFilters";

/**
 * Dual-thumb salary range (LPA). Built from two overlapping native range
 * inputs so keyboard + screen-reader support come for free. Emits `{min,max}`
 * where max === SALARY_SLIDER.max means "no upper bound".
 */
export default function SalaryRangeSlider({ value, onChange }) {
  const { min: MIN, max: MAX, step } = SALARY_SLIDER;
  const min = Number.isFinite(value?.min) ? value.min : MIN;
  const max = Number.isFinite(value?.max) ? value.max : MAX;

  const pct = (n) => ((n - MIN) / (MAX - MIN)) * 100;

  const setMin = useCallback(
    (v) => onChange({ min: Math.min(Number(v), max - step), max }),
    [max, step, onChange]
  );
  const setMax = useCallback(
    (v) => onChange({ min, max: Math.max(Number(v), min + step) }),
    [min, step, onChange]
  );

  const label = (n, upper) =>
    upper && n >= MAX ? `${MAX}L+` : `₹${n}L`;

  return (
    <div className="px-1 pb-1 pt-2">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold text-foreground">
        <span>{label(min)}</span>
        <span>{label(max, true)}</span>
      </div>

      <div className="relative h-1.5">
        <div className="absolute inset-0 rounded-full bg-muted" />
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={step}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          aria-label="Minimum salary (LPA)"
          aria-valuetext={`${min} LPA`}
          className="pointer-events-none absolute -top-2 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background"
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={step}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          aria-label="Maximum salary (LPA)"
          aria-valuetext={max >= MAX ? "No upper limit" : `${max} LPA`}
          className="pointer-events-none absolute -top-2 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background"
        />
      </div>
    </div>
  );
}
