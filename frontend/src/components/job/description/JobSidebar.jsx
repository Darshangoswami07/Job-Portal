import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Briefcase,
  Clock,
  MapPin,
  Building2,
  Share2,
  Bookmark,
  Flag,
  Check,
  Loader2,
  Send,
  Sparkles,
  MessageSquare,
  LockKeyhole,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SourceOptions from "@/components/job/SourceOptions";
import { cn, sanitizeCompanyLogoUrl } from "@/lib/utils";
import { formatSalary, formatExperience } from "./format";
import { slideRight, viewportOnce } from "./motion";

function DetailRow({ icon: Icon, label, value, valueClass }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="inline-flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </span>
      <span className={cn("text-right text-sm font-semibold text-slate-900 dark:text-white", valueClass)}>
        {value}
      </span>
    </div>
  );
}

function ApplyButton({ isApplied, applying, onApply, external, sourceLabel }) {
  const [ripples, setRipples] = useState([]);
  const ref = useRef(null);
  const idRef = useRef(0);

  const handleClick = (e) => {
    if (isApplied || applying) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const size = Math.max(rect.width, rect.height) * 2.2;
    const id = ++idRef.current;
    setRipples((prev) => [
      ...prev,
      {
        id,
        x: e.clientX - rect.left - size / 2,
        y: e.clientY - rect.top - size / 2,
        size,
      },
    ]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 900);
    onApply();
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={handleClick}
      disabled={isApplied || applying}
      whileHover={!isApplied && !applying ? { scale: 1.02, y: -1 } : {}}
      whileTap={!isApplied && !applying ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 380, damping: 20 }}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl py-4 text-base font-semibold shadow-lg transition-colors duration-300",
        isApplied
          ? "cursor-default bg-emerald-500 text-white shadow-emerald-500/30"
          : applying
            ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/40"
            : "bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600 text-white shadow-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/50"
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isApplied ? "applied" : applying ? "applying" : "apply"}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 inline-flex items-center justify-center gap-2"
        >
          {isApplied ? (
            <>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.35, 1] }}
                transition={{ type: "spring", stiffness: 420, damping: 15 }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25"
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </motion.span>
              Applied
            </>
          ) : applying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {external ? "Opening..." : "Applying..."}
            </>
          ) : external ? (
            <>
              <ExternalLink className="h-5 w-5" />
              {sourceLabel ? `Apply on ${sourceLabel}` : "Apply externally"}
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Apply Now
            </>
          )}
        </motion.span>
      </AnimatePresence>

      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="pointer-events-none absolute rounded-full bg-white/40"
          style={{ width: r.size, height: r.size, left: r.x, top: r.y }}
        />
      ))}
    </motion.button>
  );
}

export default function JobSidebar({
  job,
  group,
  isApplied,
  applying,
  onApply,
  onApplyExternal,
  isSaved,
  onSave,
  onShare,
  onReport,
  applicationId,
  onMessage,
  messageLoading = false,
}) {
  const company = job.company || {};
  const salary = formatSalary(job);
  const isExternal = job.applyType === "external";
  const primarySourceLabel = job.sourceName || job.source || "";
  const allSources = group?.sources || [];

  return (
    <motion.aside
      variants={slideRight}
      initial="hidden"
      animate="visible"
      viewport={viewportOnce}
      className="space-y-6 lg:sticky lg:top-24"
    >
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <Sparkles className="h-3.5 w-3.5" />
          Apply for this position
        </div>

        <ApplyButton
          isApplied={isApplied}
          applying={applying}
          onApply={onApply}
          external={isExternal}
          sourceLabel={isExternal ? primarySourceLabel : ""}
        />

        <SourceOptions
          className="mt-3"
          sources={allSources}
          currentJobId={job._id}
          onApplyInternal={onApply}
          onApplyExternal={onApplyExternal}
          heading={allSources.length > 1 ? `Available on ${allSources.length} sources` : undefined}
        />

        {isApplied && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-3 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            You have applied to this job
          </motion.p>
        )}

        {applicationId ? (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            type="button"
            onClick={onMessage}
            disabled={messageLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 py-3 text-sm font-semibold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
          >
            {messageLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            Message recruiter
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-2.5 text-xs font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-500"
            title="Apply to this job to unlock messaging with the recruiter"
          >
            <LockKeyhole className="h-3.5 w-3.5" />
            Messaging unlocks after you apply
          </motion.div>
        )}

        <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
          <DetailRow
            icon={DollarSign}
            label="Salary"
            value={`${salary.currency}${salary.value}${salary.lpa ? " LPA" : ""}`}
          />
          <DetailRow icon={Briefcase} label="Experience" value={formatExperience(job)} />
          <DetailRow icon={Clock} label="Job Type" value={job.jobType} />
          <DetailRow icon={MapPin} label="Location" value={job.location || "Remote"} />
        </div>

        <div className="mt-4 border-t border-slate-100 pt-5 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <Avatar className="h-full w-full rounded-xl">
                <AvatarImage src={sanitizeCompanyLogoUrl(company.logo)} alt={company.name} />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white">
                  {(company.name || "C")[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{company.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{company.industry || job.industry || "Company"}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onSave}
            className={cn(
              "inline-flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-colors",
              isSaved
                ? "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
                : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
            Save
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex flex-col items-center gap-1 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            type="button"
            onClick={onReport}
            className="inline-flex flex-col items-center gap-1 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <Flag className="h-4 w-4" />
            Report
          </button>
        </div>
      </div>

      <div className="hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:block dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Building2 className="h-4.5 w-4.5" />
          </span>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {company.description || "No company description available."}
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
