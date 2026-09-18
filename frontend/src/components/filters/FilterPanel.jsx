import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  Clock,
  Laptop,
  TrendingUp,
  DollarSign,
  MapPin,
  Building2,
  Wrench,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  JOB_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
  EXPERIENCE_RANGES,
  SKILL_OPTIONS,
  SALARY_SLIDER,
} from "@/utils/jobFilters";
import SalaryRangeSlider from "./SalaryRangeSlider";

const WORK_MODE_LABEL = Object.fromEntries(WORK_MODE_OPTIONS.map((o) => [o.value, o.label]));

const isDefaultSalary = (s) =>
  !s || ((s.min ?? SALARY_SLIDER.min) === SALARY_SLIDER.min && (s.max ?? SALARY_SLIDER.max) === SALARY_SLIDER.max);

function Section({ icon: Icon, title, count, defaultOpen, children }) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/60"
      >
        <span className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {count > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 text-[11px] font-bold text-primary">{count}</span>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="max-h-64 space-y-1 overflow-y-auto px-4 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({ label, hint, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
        checked ? "border-primary/30 bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
        )}
      >
        {checked && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="truncate">{label}</span>
      {hint != null && <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{hint}</span>}
    </button>
  );
}

/**
 * Find Jobs filter sidebar. Options are driven by the live `facets` returned
 * from the grouped search (counts included) with static fallbacks.
 *
 * `selected` is `{ jobType:Set, workType:Set, experience:Set, location:Set,
 * source:Set, skills:Set }`; `salary` is `{ min, max }` (LPA).
 */
export default function FilterPanel({
  facets = {},
  selected,
  salary,
  onToggle,
  onSalaryChange,
  onClearAll,
}) {
  const reduceMotion = useReducedMotion();

  const jobTypeOpts = useMemo(() => {
    const f = facets.jobType?.length ? facets.jobType.map((x) => ({ value: x.value, count: x.count })) : null;
    return f || JOB_TYPE_OPTIONS.map((v) => ({ value: v, count: null }));
  }, [facets.jobType]);

  const workModeOpts = useMemo(() => {
    const counts = Object.fromEntries((facets.remoteType || []).map((x) => [x.value, x.count]));
    return WORK_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label, count: counts[o.value] ?? null }));
  }, [facets.remoteType]);

  const locationOpts = useMemo(
    () => (facets.location || []).map((x) => ({ value: x.value, count: x.count })).slice(0, 12),
    [facets.location]
  );
  const sourceOpts = useMemo(
    () => (facets.source || []).map((x) => ({ value: x.value, count: x.count })),
    [facets.source]
  );

  const activeCount = useMemo(() => {
    const setSum = Object.values(selected).reduce((n, s) => n + (s?.size || 0), 0);
    return setSum + (isDefaultSalary(salary) ? 0 : 1);
  }, [selected, salary]);

  const chips = useMemo(() => {
    const out = [];
    for (const [cat, set] of Object.entries(selected)) {
      for (const v of set || []) {
        out.push({ cat, value: v, label: cat === "workType" ? WORK_MODE_LABEL[v] || v : v });
      }
    }
    if (!isDefaultSalary(salary)) {
      out.push({
        cat: "salary",
        value: "salary",
        label: `₹${salary.min ?? SALARY_SLIDER.min}L – ${(salary.max ?? SALARY_SLIDER.max) >= SALARY_SLIDER.max ? `${SALARY_SLIDER.max}L+` : `₹${salary.max}L`}`,
      });
    }
    return out;
  }, [selected, salary]);

  const has = (cat, v) => !!selected[cat]?.has(v);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Filters</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">{activeCount}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClearAll}
          disabled={!activeCount}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-semibold transition-colors",
            activeCount ? "text-primary hover:bg-primary/10" : "cursor-not-allowed text-muted-foreground/40"
          )}
        >
          Clear all filters
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-3">
          <AnimatePresence initial={false}>
            {chips.map((c) => (
              <motion.span
                key={`${c.cat}-${c.value}`}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-primary"
              >
                <span className="max-w-[9rem] truncate">{c.label}</span>
                <button
                  type="button"
                  onClick={() => (c.cat === "salary" ? onSalaryChange({ min: SALARY_SLIDER.min, max: SALARY_SLIDER.max }) : onToggle(c.cat, c.value))}
                  className="rounded-full p-0.5 hover:bg-primary/20"
                  aria-label={`Remove ${c.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="divide-y divide-border">
        <Section icon={Clock} title="Job Type" count={selected.jobType.size} defaultOpen>
          {jobTypeOpts.map((o) => (
            <CheckRow key={o.value} label={o.value} hint={o.count} checked={has("jobType", o.value)} onToggle={() => onToggle("jobType", o.value)} />
          ))}
        </Section>

        <Section icon={Laptop} title="Work Mode" count={selected.workType.size} defaultOpen>
          {workModeOpts.map((o) => (
            <CheckRow key={o.value} label={o.label} hint={o.count} checked={has("workType", o.value)} onToggle={() => onToggle("workType", o.value)} />
          ))}
        </Section>

        <Section icon={TrendingUp} title="Experience" count={selected.experience.size}>
          {EXPERIENCE_RANGES.map((r) => (
            <CheckRow key={r.label} label={r.label} checked={has("experience", r.label)} onToggle={() => onToggle("experience", r.label)} />
          ))}
        </Section>

        <Section icon={DollarSign} title="Salary Range" count={isDefaultSalary(salary) ? 0 : 1}>
          <SalaryRangeSlider value={salary} onChange={onSalaryChange} />
        </Section>

        {locationOpts.length > 0 && (
          <Section icon={MapPin} title="Location" count={selected.location.size}>
            {locationOpts.map((o) => (
              <CheckRow key={o.value} label={o.value} hint={o.count} checked={has("location", o.value)} onToggle={() => onToggle("location", o.value)} />
            ))}
          </Section>
        )}

        {sourceOpts.length > 0 && (
          <Section icon={Building2} title="Source" count={selected.source.size} defaultOpen>
            {sourceOpts.map((o) => (
              <CheckRow key={o.value} label={o.value} hint={o.count} checked={has("source", o.value)} onToggle={() => onToggle("source", o.value)} />
            ))}
          </Section>
        )}

        <Section icon={Wrench} title="Skills" count={selected.skills.size}>
          {SKILL_OPTIONS.map((s) => (
            <CheckRow key={s} label={s} checked={has("skills", s)} onToggle={() => onToggle("skills", s)} />
          ))}
        </Section>
      </div>
    </div>
  );
}
