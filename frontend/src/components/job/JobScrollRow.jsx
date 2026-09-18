import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import JobCard from "@/components/job/JobCard";
import JobResultSkeleton from "@/components/job/JobResultSkeleton";

/**
 * Titled responsive grid of JobCards for discovery strips ("Recommended for
 * You", "Top Opportunities"). Renders nothing when it has no jobs and is not
 * loading — never pads the page with empty space. No horizontal scrolling:
 * cards flow in a 1 → 2 → 3 → 4 column grid and stay fully visible.
 */
export default function JobScrollRow({
  title,
  icon: Icon,
  subtitle,
  action,
  jobs = [],
  loading = false,
  limit = 4,
  savedJobIds,
  onToggleSaved,
  onOpenPreview,
  headerExtra,
}) {
  const reduceMotion = useReducedMotion();
  if (!loading && jobs.length === 0) return null;

  const shown = jobs.slice(0, limit);

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            {Icon && <Icon className="h-4.5 w-4.5 shrink-0 text-primary" />}
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          {headerExtra}
        </div>
        {action && (
          <Link to={action.to} className="shrink-0 whitespace-nowrap text-sm font-semibold text-primary hover:underline">
            {action.label}
          </Link>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {loading && jobs.length === 0
          ? Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="min-w-0">
                <JobResultSkeleton />
              </div>
            ))
          : shown.map((job) => (
              <div key={job.groupId || job._id} className="min-w-0">
                <JobCard
                  job={job}
                  isSaved={savedJobIds?.has(String(job._id))}
                  onToggleSaved={onToggleSaved}
                  onOpenPreview={onOpenPreview}
                />
              </div>
            ))}
      </div>
    </motion.section>
  );
}
