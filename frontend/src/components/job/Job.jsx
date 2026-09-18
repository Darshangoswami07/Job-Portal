import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, MapPin, Laptop2, Building, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { stripHtmlToText } from "@/utils/sanitize";
import SourceBadge from "@/components/job/SourceBadge";

const daysAgo = (date) => {
  if (!date) return "";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (Number.isNaN(days)) return "";
  return days <= 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
};

const REMOTE_LABEL = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };

export default function Job({ job, isSaved = false, onToggleSaved = () => {} }) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [saved, setSaved] = useState(isSaved);

  if (!job) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
        Job data not available
      </div>
    );
  }

  const open = () => navigate(`/description/${job._id}`);
  const handleBookmark = (e) => {
    e.stopPropagation();
    setSaved((s) => !s);
    onToggleSaved(job._id, saved);
  };

  const company = job.company?.name || job.companyName || "Company";
  const location = job.location || job.company?.location || "Remote";
  const remote = REMOTE_LABEL[job.remoteType] || "";
  const freshness = job.freshness || daysAgo(job.postedAt || job.createdAt);
  const description = stripHtmlToText(job.description);
  const salary =
    Number.isFinite(job.salaryMin) && job.salaryMin > 0
      ? `${job.salaryMin.toLocaleString()}${job.salaryMax ? `–${job.salaryMax.toLocaleString()}` : ""} ${job.salaryCurrency || ""}`.trim()
      : Number.isFinite(job.salary) && job.salary > 0
        ? `${job.salary} LPA`
        : "";
  const matchPercent = Number.isFinite(job.matchPercent) ? job.matchPercent : null;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={open}
      className={cn(
        "group flex h-full cursor-pointer flex-col rounded-xl border border-border bg-card",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_10px_28px_-8px_rgba(10,102,194,0.22)]",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      )}
    >
      <div className="flex flex-1 flex-col p-5">
        {/* header: company + freshness / source */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11 shrink-0 rounded-lg border border-border">
              <AvatarImage src={job.company?.logo} alt={company} />
              <AvatarFallback className="rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {company[0]?.toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            <p className="truncate text-sm font-semibold text-foreground">{company}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {freshness && (
              <span
                className={cn(
                  "whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  /just posted|today/i.test(freshness)
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "text-muted-foreground"
                )}
              >
                {freshness}
              </span>
            )}
            <SourceBadge source={job.sourceName || job.source} />
          </div>
        </div>

        {/* title + match */}
        <div className="mt-3.5 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-[15px] font-bold leading-snug text-foreground">
            {job.title}
          </h3>
          {matchPercent !== null && matchPercent >= 40 && (
            <span
              title={(job.matchReasons || []).join(" · ") || `${matchPercent}% match with your profile`}
              className={cn(
                "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                matchPercent >= 75
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border border-primary/25 bg-primary/10 text-primary"
              )}
            >
              {matchPercent}% match
            </span>
          )}
        </div>

        {/* location + remote mode */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </span>
          {remote && (
            <span className="inline-flex items-center gap-1">
              {job.remoteType === "onsite" ? (
                <Building className="h-3.5 w-3.5" />
              ) : (
                <Laptop2 className="h-3.5 w-3.5" />
              )}
              {remote}
            </span>
          )}
          {job.sourceCount > 1 && (
            <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              on {job.sourceCount} sources
            </span>
          )}
        </div>

        {/* description */}
        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-muted-foreground">
          {description || "No description provided for this role."}
        </p>

        {/* meta badges */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          {job.jobType && (
            <span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary">
              {job.jobType}
            </span>
          )}
          {job.seniority && (
            <span className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-medium capitalize text-muted-foreground">
              {job.seniority}
            </span>
          )}
          {salary && (
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
              {salary}
            </span>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          size="sm"
          className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          View Details
          <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </Button>
        <button
          onClick={handleBookmark}
          aria-label={saved ? "Remove from saved jobs" : "Save job"}
          aria-pressed={saved}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            saved ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <motion.span
            whileTap={reduceMotion ? undefined : { scale: 0.8 }}
            className="block"
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </motion.span>
        </button>
      </div>
    </motion.article>
  );
}
