import { useMemo, useState } from "react";
import {
  ChevronDown,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  SlidersHorizontal,
  Building2,
  Laptop,
  Wrench,
  TrendingUp,
  CalendarDays,
  Layers,
  Tag,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { countActiveFilters } from "@/utils/jobFilters";

const FIELD_LABELS = {
  source: "Source",
  location: "Location",
  jobType: "Job Type",
  workType: "Work Mode",
  department: "Department",
  industry: "Industry",
  salary: "Salary Range",
  experience: "Experience",
  postedDate: "Posted",
  company: "Company",
  skills: "Skills",
  tags: "Tags",
};

const FIELD_ICONS = {
  location: MapPin,
  company: Building2,
  industry: Briefcase,
  department: Layers,
  jobType: Clock,
  workType: Laptop,
  source: Building2,
  skills: Wrench,
  tags: Tag,
  salary: DollarSign,
  experience: TrendingUp,
  postedDate: CalendarDays,
};

const DEFAULT_OPEN = new Set(["source", "location"]);

export default function FilterCard({ selectedFilters, onToggle, onClearAll, options = {} }) {
  const reduceMotion = useReducedMotion();
  const activeCount = useMemo(() => countActiveFilters(selectedFilters), [selectedFilters]);

  const chipList = useMemo(
    () =>
      Object.entries(selectedFilters).flatMap(([category, values]) =>
        values && values.size ? [...values].map((value) => ({ category, value })) : []
      ),
    [selectedFilters]
  );

  const categories = useMemo(
    () => Object.keys(FIELD_LABELS).filter((c) => options[c]?.length > 0),
    [options]
  );

  const [openSections, setOpenSections] = useState(() => ({ ...Object.fromEntries([...DEFAULT_OPEN].map((k) => [k, true])) }));
  const toggleSection = (category) =>
    setOpenSections((prev) => ({ ...prev, [category]: !prev[category] }));

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Filters</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={onClearAll}
          disabled={!activeCount}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-semibold transition-colors",
            activeCount
              ? "text-primary hover:bg-primary/10"
              : "cursor-not-allowed text-muted-foreground/40"
          )}
        >
          Clear all
        </button>
      </div>

      {chipList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-3">
          <AnimatePresence initial={false}>
            {chipList.map(({ category, value }) => (
              <motion.span
                key={`${category}-${value}`}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-primary"
              >
                <span className="max-w-[9rem] truncate">{value}</span>
                <button
                  onClick={() => onToggle(category, value, false)}
                  className="rounded-full p-0.5 hover:bg-primary/20"
                  aria-label={`Remove ${value} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="divide-y divide-border">
        {categories.map((category) => {
          const Icon = FIELD_ICONS[category] || Briefcase;
          const selectedCount = selectedFilters[category]?.size || 0;
          const isOpen = !!openSections[category];
          const values = options[category] || [];

          return (
            <div key={category}>
              <button
                type="button"
                onClick={() => toggleSection(category)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/60"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg",
                      selectedCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{FIELD_LABELS[category]}</span>
                  {selectedCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-1.5 text-[11px] font-bold text-primary">
                      {selectedCount}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-64 space-y-1 overflow-y-auto px-4 pb-3 pt-0.5">
                      {values.map((value) => {
                        const checked = !!selectedFilters[category]?.has(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onToggle(category, value, !checked)}
                            aria-pressed={checked}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
                              checked
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-transparent text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                              )}
                            >
                              {checked && (
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                            <span className="truncate">{value}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
