import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, MapPin, X, Loader2, Building2, Briefcase, Wrench, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { WORK_MODE_OPTIONS, POPULAR_SEARCHES } from "@/utils/jobFilters";
import useSearchSuggestions from "@/hooks/useSearchSuggestions";

const TYPE_ICON = { company: Building2, location: MapPin, skill: Wrench, title: Briefcase };

/**
 * Premium search header for the Find Jobs page. Owns its own input state and
 * reports a committed search (Enter / button / suggestion / popular chip) via
 * `onSearch({ q, location, remote })`.
 */
export default function SearchHero({ initial = {}, onSearch }) {
  const reduceMotion = useReducedMotion();
  const listId = useId();
  const [q, setQ] = useState(initial.q || "");
  const [location, setLocation] = useState(initial.location || "");
  const [remote, setRemote] = useState(initial.remote || "");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef(null);

  const { suggestions, loading } = useSearchSuggestions(q, focused);
  const showList = focused && q.trim().length >= 2 && (suggestions.length > 0 || loading);
  const activeOption = activeIdx >= 0 && activeIdx < suggestions.length ? activeIdx : -1;

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const commit = (next = {}) => {
    setFocused(false);
    onSearch({
      q: (next.q ?? q).trim(),
      location: (next.location ?? location).trim(),
      remote: next.remote ?? remote,
    });
  };

  const pickSuggestion = (s) => {
    if (s.type === "location") {
      setLocation(s.value);
      commit({ location: s.value });
    } else if (s.type === "company") {
      setQ(s.value);
      commit({ q: s.value });
    } else {
      setQ(s.value);
      commit({ q: s.value });
    }
  };

  const onKeyDown = (e) => {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeOption >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[activeOption]);
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/[0.07] via-card to-card p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/10"
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          AI-powered job discovery
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Find Your Next Opportunity
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Search thousands of jobs from trusted sources and discover opportunities matched to your career.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            commit();
          }}
          className="mt-5"
        >
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
            <div ref={boxRef} className="relative flex-[2]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={q}
                onChange={(e) => { setQ(e.target.value); setActiveIdx(-1); }}
                onFocus={() => setFocused(true)}
                onKeyDown={onKeyDown}
                placeholder="Job title, skill, or company"
                aria-label="Job title, skill, or company"
                aria-autocomplete="list"
                aria-expanded={showList}
                aria-controls={listId}
                aria-activedescendant={activeOption >= 0 ? `${listId}-opt-${activeOption}` : undefined}
                role="combobox"
                className={cn(
                  "h-12 w-full rounded-xl border border-border bg-background pl-11 pr-9 text-sm text-foreground",
                  "placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                )}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <AnimatePresence>
                {showList && (
                  <motion.ul
                    id={listId}
                    role="listbox"
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
                  >
                    {loading && suggestions.length === 0 ? (
                      <li className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                      </li>
                    ) : (
                      suggestions.map((s, i) => {
                        const Icon = TYPE_ICON[s.type] || Search;
                        return (
                          <li
                            key={`${s.type}-${s.value}`}
                            id={`${listId}-opt-${i}`}
                            role="option"
                            aria-selected={i === activeOption}
                            onMouseEnter={() => setActiveIdx(i)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              pickSuggestion(s);
                            }}
                            className={cn(
                              "flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm",
                              i === activeOption ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{s.value}</span>
                            <span className="ml-auto shrink-0 text-[11px] capitalize text-muted-foreground">{s.type}</span>
                          </li>
                        );
                      })
                    )}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                aria-label="Location"
                className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              />
            </div>

            <div className="flex rounded-xl border border-border bg-background p-1" role="group" aria-label="Work mode">
              {[{ label: "Any", value: "" }, ...WORK_MODE_OPTIONS].map((opt) => (
                <button
                  key={opt.value || "any"}
                  type="button"
                  onClick={() => {
                    setRemote(opt.value);
                    commit({ remote: opt.value });
                  }}
                  aria-pressed={remote === opt.value}
                  className={cn(
                    "rounded-lg px-3 text-xs font-semibold transition-colors",
                    remote === opt.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Popular:</span>
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQ(term);
                commit({ q: term });
              }}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {term}
            </button>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
