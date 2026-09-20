import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bookmark,
  MapPin,
  Laptop2,
  Building2,
  BadgeCheck,
  ArrowUpRight,
  Clock3,
} from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, sanitizeCompanyLogoUrl } from "@/lib/utils";
import { stripHtmlToText } from "@/utils/sanitize";
import SourceBadge from "@/components/job/SourceBadge";

const REMOTE_LABEL = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };

const relativeTime = (date) => {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
};

function formatSalary(job) {
  const cur = job.salaryCurrency === "USD" ? "$" : "₹";
  const unit = job.salaryCurrency === "USD" ? "/yr" : "L";
  const fmt = (n) => (job.salaryCurrency === "USD" ? `${cur}${(n / 1000).toFixed(0)}k` : `${cur}${n}${unit}`);
  const min = Number.isFinite(job.salaryMin) && job.salaryMin > 0 ? job.salaryMin : null;
  const max = Number.isFinite(job.salaryMax) && job.salaryMax > 0 ? job.salaryMax : null;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return "";
}

/**
 * Premium job card for the Find Jobs results grid. Body click opens the
 * quick-preview drawer; only real, present fields are rendered.
 */
export default function JobCard({ job, isSaved = false, onToggleSaved = () => {}, onOpenPreview = () => {} }) {
  const reduceMotion = useReducedMotion();
  const [saved, setSaved] = useState(isSaved);

  if (!job) return null;

  const company = job.company?.name || job.companyName || "Company";
  const location = job.location || "Remote";
  const remote = REMOTE_LABEL[job.remoteType] || "";
  const posted = job.freshness || relativeTime(job.postedAt || job.createdAt);
  const description = stripHtmlToText(job.description);
  const salary = formatSalary(job);
  const skills = (job.skills || []).filter(Boolean).slice(0, 4);
  const extraSkills = Math.max(0, (job.skills || []).length - skills.length);
  const verified = Boolean(job.company?.domain);
  const matchPercent = Number.isFinite(job.matchPercent) ? job.matchPercent : null;

  const toggle = (e) => {
    e.stopPropagation();
    setSaved((s) => !s);
    onToggleSaved(job._id, saved);
  };

  return (
    <motion.article
      layout={!reduceMotion}
      onClick={() => onOpenPreview(job)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenPreview(job);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${job.title} at ${company} — open preview`}
      className={cn(
        "group relative flex h-full cursor-pointer flex-col rounded-2xl border border-border bg-card p-5",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-16px_rgba(10,102,194,0.28)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0 rounded-xl border border-border">
            <AvatarImage src={sanitizeCompanyLogoUrl(job.company?.logo)} alt={company} />
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-sm font-bold text-primary">
              {company[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-semibold text-foreground">{company}</p>
              {verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Verified company" />}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location}</span>
              </span>
              {remote && (
                <span className="inline-flex shrink-0 items-center gap-1">
                  {job.remoteType === "onsite" ? <Building2 className="h-3 w-3" /> : <Laptop2 className="h-3 w-3" />}
                  {remote}
                </span>
              )}
            </div>
          </div>
        </div>
        {matchPercent !== null && matchPercent >= 40 && (
          <span
            title={(job.matchReasons || []).join(" · ") || `${matchPercent}% match with your profile`}
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
              matchPercent >= 75
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-primary/10 text-primary"
            )}
          >
            {matchPercent}% match
          </span>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-foreground group-hover:text-primary">
        {job.title}
      </h3>

      <p className="mt-2 line-clamp-2 min-h-[2.4rem] text-[13px] leading-relaxed text-muted-foreground">
        {description || "No description provided for this role."}
      </p>

      {(skills.length > 0 || salary) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {salary && (
            <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {salary}
            </span>
          )}
          {job.jobType && (
            <span className="rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
              {job.jobType}
            </span>
          )}
          {job.seniority && (
            <span className="rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-medium capitalize text-muted-foreground">
              {job.seniority}
            </span>
          )}
          {skills.map((s) => (
            <span key={s} className="rounded-lg border border-primary/15 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary">
              {s}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="rounded-lg px-1.5 py-1 text-[11px] font-medium text-muted-foreground">+{extraSkills}</span>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <SourceBadge source={job.sourceName} />
            {posted && (
              <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
                <Clock3 className="h-3 w-3 shrink-0" />
                <span className="truncate">{posted}</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={saved ? "Remove from saved jobs" : "Save job"}
            aria-pressed={saved}
            className={cn(
              "shrink-0 rounded-lg p-1.5 transition-colors",
              saved ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <motion.span whileTap={reduceMotion ? undefined : { scale: 0.8 }} className="block">
              <Bookmark className={cn("h-[18px] w-[18px]", saved && "fill-current")} />
            </motion.span>
          </button>
        </div>
        <span className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
          View &amp; Apply
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.article>
  );
}
