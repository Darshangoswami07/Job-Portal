import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, useReducedMotion } from "framer-motion";
import CountUp from "react-countup";
import {
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  Loader2,
  RefreshCw,
  Briefcase,
  Search as SearchIcon,
  MapPin,
} from "lucide-react";

import Navbar from "@/components/shared/Navbar";
import SearchHero from "@/components/job/SearchHero";
import AiMatchCard from "@/components/job/AiMatchCard";
import RecommendedStrip from "@/components/job/RecommendedStrip";
import TopOpportunities from "@/components/job/TopOpportunities";
import HiringCompanies from "@/components/job/HiringCompanies";
import TrendingSearches from "@/components/job/TrendingSearches";
import JobCard from "@/components/job/JobCard";
import JobResultSkeleton from "@/components/job/JobResultSkeleton";
import JobPreviewDrawer from "@/components/job/JobPreviewDrawer";
import FilterPanel from "@/components/filters/FilterPanel";
import FilterDrawer from "@/components/filters/FilterDrawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setSearchQuery } from "@/store/slices/jobSlice";
import useJobSearch from "@/hooks/useJobSearch";
import useSavedJobs from "@/hooks/useSavedJobs";
import { EXPERIENCE_RANGES, SALARY_SLIDER, WORK_MODE_OPTIONS } from "@/utils/jobFilters";

const FILTER_CATEGORIES = ["jobType", "workType", "experience", "location", "source", "skills"];
const createEmptySelected = () =>
  FILTER_CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: new Set() }), {});
const DEFAULT_SALARY = { min: SALARY_SLIDER.min, max: SALARY_SLIDER.max };

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "newest", label: "Newest" },
  { value: "salary_desc", label: "Salary: High to Low" },
  { value: "salary_asc", label: "Salary: Low to High" },
];
const VALID_SORTS = new Set([...SORT_OPTIONS.map((o) => o.value), "recommended"]);
const WORK_MODE_VALUES = new Set(WORK_MODE_OPTIONS.map((o) => o.value));

const isDefaultSalary = (s) => s.min === DEFAULT_SALARY.min && s.max === DEFAULT_SALARY.max;

/** Translate the local filter state into flat server params. */
function buildServerFilters({ selected, salary, company, locationText }) {
  const f = {};
  const toArr = (s) => [...(s || [])];

  const loc = [...toArr(selected.location), ...(locationText ? [locationText] : [])];
  if (loc.length) f.location = loc.join(",");

  const modes = toArr(selected.workType);
  if (modes.length) f.remoteType = modes.join(",");

  const jt = toArr(selected.jobType);
  if (jt.length) f.jobType = jt.join(",");

  const src = toArr(selected.source);
  if (src.length) f.source = src.join(",");

  const skills = toArr(selected.skills);
  if (skills.length) f.skills = skills.join(",");

  if (company) f.company = company;

  const expLabels = toArr(selected.experience);
  if (expLabels.length) {
    const ranges = EXPERIENCE_RANGES.filter((r) => expLabels.includes(r.label));
    f.experienceMin = Math.min(...ranges.map((r) => r.min));
    if (!ranges.some((r) => r.max === null)) f.experienceMax = Math.max(...ranges.map((r) => r.max));
  }

  if (!isDefaultSalary(salary)) {
    if (salary.min > SALARY_SLIDER.min) f.salaryMin = salary.min;
    if (salary.max < SALARY_SLIDER.max) f.salaryMax = salary.max;
  }

  return f;
}

export default function Jobs() {
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const { user } = useSelector((s) => s.auth);
  const { searchedQuery = "" } = useSelector((s) => s.job);
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef(null);

  const [selected, setSelected] = useState(() => {
    const base = createEmptySelected();
    const remote = searchParams.get("remote");
    if (remote) {
      remote.split(",").filter((v) => WORK_MODE_VALUES.has(v)).forEach((v) => base.workType.add(v));
    }
    return base;
  });
  const [salary, setSalary] = useState(DEFAULT_SALARY);
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [locationText, setLocationText] = useState(() => searchParams.get("location") || "");
  const [company, setCompany] = useState(() => searchParams.get("company") || "");
  const [sortKey, setSortKey] = useState(() => {
    const s = searchParams.get("sort");
    return s && VALID_SORTS.has(s) ? s : "relevance";
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [previewJob, setPreviewJob] = useState(null);
  const [searchMs, setSearchMs] = useState(null);

  const { handleToggleSaved, savedJobIds } = useSavedJobs();

  // The navbar/home writes into redux; consume it once so a stale query
  // doesn't leak into this page's local state.
  useEffect(() => {
    if (searchedQuery) {
      setQuery(searchedQuery);
      dispatch(setSearchQuery(""));
    }
  }, [dispatch, searchedQuery]);

  const serverFilters = useMemo(
    () => buildServerFilters({ selected, salary, company, locationText }),
    [selected, salary, company, locationText]
  );

  const { jobs, pagination, meta, loading, error, hasMore, loadMore, refetch } = useJobSearch({
    query,
    filters: serverFilters,
    sort: sortKey,
  });

  // keep the URL shareable (no PII)
  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (locationText) next.set("location", locationText);
    if (company) next.set("company", company);
    if (selected.workType.size) next.set("remote", [...selected.workType].join(","));
    if (sortKey !== "relevance") next.set("sort", sortKey);
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, locationText, company, sortKey, selected.workType]);

  // rough client-side timing for the results header
  const timerRef = useRef(0);
  useEffect(() => {
    if (loading) timerRef.current = performance.now();
    else if (timerRef.current) setSearchMs(Math.max(1, Math.round(performance.now() - timerRef.current)));
  }, [loading]);

  const facets = meta.facets || {};

  const activeFilterCount = useMemo(() => {
    let n = Object.values(selected).reduce((sum, s) => sum + s.size, 0);
    if (!isDefaultSalary(salary)) n += 1;
    if (company) n += 1;
    return n;
  }, [selected, salary, company]);

  const handleToggle = useCallback((category, value) => {
    setSelected((prev) => {
      const nextSet = new Set(prev[category]);
      nextSet.has(value) ? nextSet.delete(value) : nextSet.add(value);
      return { ...prev, [category]: nextSet };
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelected(createEmptySelected());
    setSalary(DEFAULT_SALARY);
    setCompany("");
  }, []);

  const handleHeroSearch = useCallback(({ q, location, remote }) => {
    setQuery(q);
    setLocationText(location);
    setCompany("");
    setSelected((prev) => ({
      ...prev,
      workType: remote ? new Set([remote]) : new Set(),
    }));
    if (sortKey === "recommended") setSortKey("relevance");
  }, [sortKey]);

  const runKeywordSearch = useCallback((term) => {
    setQuery(term);
    setCompany("");
    if (sortKey === "recommended") setSortKey("relevance");
    resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [sortKey, reduceMotion]);

  const handleSelectCompany = useCallback((name) => {
    setCompany(name);
    setQuery("");
    resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [reduceMotion]);

  const handleFindMatches = useCallback(() => {
    setSortKey("recommended");
    resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [reduceMotion]);

  const isInitialLoading = loading && jobs.length === 0;
  const total = pagination.total || 0;
  const recommendedMode = sortKey === "recommended";

  const headerTitle = recommendedMode
    ? "Recommended Jobs"
    : company
      ? `Jobs at ${company}`
      : query
        ? <>Results for <span className="text-primary">“{query}”</span></>
        : "All Jobs";

  const fade = (delay = 0) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1 } }
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.4, ease: "easeOut" } };

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Navbar />

      <div className="mx-auto w-full max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <motion.div {...fade(0)} className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <SearchHero
            key={`${query}|${locationText}`}
            initial={{ q: query, location: locationText, remote: [...selected.workType][0] || "" }}
            onSearch={handleHeroSearch}
          />
          <AiMatchCard user={user} onFindMatches={handleFindMatches} />
        </motion.div>

        <RecommendedStrip
          user={user}
          savedJobIds={savedJobIds}
          onToggleSaved={handleToggleSaved}
          onOpenPreview={setPreviewJob}
        />
        <TopOpportunities
          savedJobIds={savedJobIds}
          onToggleSaved={handleToggleSaved}
          onOpenPreview={setPreviewJob}
        />
        <HiringCompanies onSelectCompany={handleSelectCompany} />
        <TrendingSearches onSearch={runKeywordSearch} />

        <div ref={resultsRef} className="grid scroll-mt-24 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <FilterPanel
              facets={facets}
              selected={selected}
              salary={salary}
              onToggle={handleToggle}
              onSalaryChange={setSalary}
              onClearAll={handleClearAll}
            />
          </aside>

          <main className="min-w-0 space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-foreground sm:text-xl">{headerTitle}</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {isInitialLoading ? (
                      "Searching…"
                    ) : (
                      <>
                        <span className="font-semibold text-foreground">
                          <CountUp end={total} duration={0.6} separator="," preserveValue />
                        </span>{" "}
                        {total === 1 ? "opportunity" : "opportunities"}
                        {searchMs != null && !loading && <span className="text-muted-foreground/70"> · {searchMs} ms</span>}
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMobileFilters(true)}
                    className={cn("relative h-10 rounded-xl border-border px-3 lg:hidden", activeFilterCount > 0 && "border-primary/40 text-primary")}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="ml-1.5 text-sm font-medium">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>

                  <div className="relative">
                    <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={SORT_OPTIONS.some((o) => o.value === sortKey) ? sortKey : "relevance"}
                      onChange={(e) => setSortKey(e.target.value)}
                      aria-label="Sort jobs"
                      className="h-10 appearance-none rounded-xl border border-border bg-background pl-9 pr-9 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                    >
                      {recommendedMode && <option value="recommended">Best match for you</option>}
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {(query || locationText || company || activeFilterCount > 0) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  {query && (
                    <span className="inline-flex items-center gap-1">
                      <SearchIcon className="h-3 w-3" /> {query}
                    </span>
                  )}
                  {locationText && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {locationText}
                    </span>
                  )}
                  {activeFilterCount > 0 && (
                    <span>{activeFilterCount} active filter{activeFilterCount !== 1 ? "s" : ""}</span>
                  )}
                  {meta.personalized && recommendedMode && <span className="text-primary">Personalized to your profile</span>}
                </div>
              )}
            </div>

            {isInitialLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => <JobResultSkeleton key={i} />)}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <RefreshCw className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Some job sources are temporarily unavailable</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
                <Button onClick={refetch} className="mt-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                  <RefreshCw className="mr-2 h-4 w-4" /> Retry
                </Button>
              </div>
            ) : jobs.length === 0 ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-border bg-card p-12 text-center"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Briefcase className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-bold text-foreground">No jobs found</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Try changing your keywords, location, or filters.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {activeFilterCount > 0 && (
                    <Button onClick={handleClearAll} variant="outline" className="rounded-xl border-border">
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    onClick={() => { setQuery(""); setLocationText(""); setCompany(""); handleClearAll(); }}
                    className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Browse All Jobs
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.04 } } }}
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                >
                  {jobs.map((job) => (
                    <motion.div
                      key={job.groupId || job._id}
                      className="h-full"
                      variants={{
                        hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
                      }}
                    >
                      <JobCard
                        job={job}
                        isSaved={savedJobIds.has(String(job._id))}
                        onToggleSaved={handleToggleSaved}
                        onOpenPreview={setPreviewJob}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      variant="outline"
                      className="rounded-xl border-border px-8 font-semibold"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                        </span>
                      ) : (
                        `Load more (${(total - jobs.length).toLocaleString()} remaining)`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <FilterDrawer
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        resultCount={total}
        onClearAll={handleClearAll}
      >
        <FilterPanel
          facets={facets}
          selected={selected}
          salary={salary}
          onToggle={handleToggle}
          onSalaryChange={setSalary}
          onClearAll={handleClearAll}
        />
      </FilterDrawer>

      <JobPreviewDrawer
        job={previewJob}
        open={Boolean(previewJob)}
        onClose={() => setPreviewJob(null)}
        isSaved={previewJob ? savedJobIds.has(String(previewJob._id)) : false}
        onToggleSaved={handleToggleSaved}
      />
    </div>
  );
}
