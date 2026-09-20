import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Bookmark, BookmarkCheck, MapPin, ArrowUpRight } from "lucide-react";
import { useSelector } from "react-redux";
import useRecommendations from "@/hooks/useRecommendations";
import useSavedJobs from "@/hooks/useSavedJobs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ListCardSkeleton } from "./SidebarCardSkeleton";

function money(n) {
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function JobRow({ job, saved, onToggleSaved }) {
  const navigate = useNavigate();
  const jobId = String(job._id || job.id);
  const salary = money(job.salaryMin);
  const salaryMax = money(job.salaryMax);

  return (
    <div className="rounded-xl border border-border/60 p-3 transition hover:border-[#0A66C2]/40 hover:bg-muted/40">
      <div className="flex items-start gap-2.5">
        <Avatar className="size-9 rounded-lg">
          <AvatarImage src={job.company?.logo} alt={job.companyName} />
          <AvatarFallback className="rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]">
            {(job.companyName || "J").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <button
            onClick={() => navigate(`/description/${jobId}`)}
            className="line-clamp-2 text-left text-[13px] font-bold leading-snug text-foreground hover:text-[#0A66C2]"
          >
            {job.title}
          </button>
          <p className="truncate text-[11px] text-muted-foreground">{job.companyName || "Company"}</p>
        </div>
        {Number.isFinite(job.matchPercent) && (
          <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {job.matchPercent}% match
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        {job.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" /> {job.location}
          </span>
        )}
        {job.remoteType && job.remoteType !== "onsite" && <span>· {job.remoteType}</span>}
        {salary && <span>· {salary}{salaryMax ? `–${salaryMax}` : "+"}</span>}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <button
          onClick={() => navigate(`/description/${jobId}`)}
          className="flex-1 rounded-lg bg-[#0A66C2]/10 py-1.5 text-[11px] font-bold text-[#0A66C2] transition hover:bg-[#0A66C2]/20"
        >
          View Job
        </button>
        <button
          onClick={() => onToggleSaved(jobId, saved)}
          aria-label={saved ? "Unsave job" : "Save job"}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg border transition",
            saved
              ? "border-amber-300 text-amber-500 dark:border-amber-500/30"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {saved ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function FeedJobRecs() {
  const user = useSelector((s) => s.auth.user);
  const { jobs, loading, error } = useRecommendations({ limit: 4, enabled: Boolean(user) });
  const { savedJobIds, handleToggleSaved } = useSavedJobs();

  if (!user) return null;
  if (loading && jobs.length === 0) return <ListCardSkeleton rows={3} />;
  if (error || jobs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-[#0A66C2]" />
          <h3 className="text-sm font-bold text-foreground">Recommended for You</h3>
        </div>
        <Link to="/recommended-jobs" className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#0A66C2] hover:underline">
          All <ArrowUpRight className="size-3" />
        </Link>
      </div>
      <div className="space-y-2.5 p-3">
        {jobs.slice(0, 4).map((job) => (
          <JobRow
            key={String(job.groupId || job._id)}
            job={job}
            saved={savedJobIds.has(String(job._id || job.id))}
            onToggleSaved={handleToggleSaved}
          />
        ))}
      </div>
    </motion.div>
  );
}
