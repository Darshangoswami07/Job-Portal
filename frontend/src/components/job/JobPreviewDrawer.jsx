import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  MapPin,
  Laptop2,
  Building2,
  Briefcase,
  DollarSign,
  Clock3,
  Bookmark,
  Share2,
  ExternalLink,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, sanitizeCompanyLogoUrl } from "@/lib/utils";
import { stripHtmlToText } from "@/utils/sanitize";
import { copyToClipboard } from "@/utils/clipboard";
import { getExternalApplyUrl } from "@/api/jobsApi";
import SourceBadge from "@/components/job/SourceBadge";

const REMOTE_LABEL = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-right text-sm font-semibold capitalize text-foreground">{value}</span>
    </div>
  );
}

export default function JobPreviewDrawer({ job, open, onClose, isSaved = false, onToggleSaved = () => {} }) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef(null);
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  useEffect(() => setSaved(isSaved), [isSaved, job?._id]);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => panelRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const goToDetails = useCallback(() => {
    if (!job?._id) return;
    onClose();
    navigate(`/description/${job._id}`);
  }, [job, navigate, onClose]);

  const handleApply = useCallback(async () => {
    if (!job?._id) return;
    if (job.applyType !== "external") {
      goToDetails();
      return;
    }
    setApplying(true);
    try {
      const res = await getExternalApplyUrl(job._id);
      if (res.data?.success && res.data.url) {
        window.open(res.data.url, "_blank", "noopener,noreferrer");
        toast.success(`Opening application${res.data.sourceName ? ` on ${res.data.sourceName}` : ""}`);
      } else {
        toast.error(res.data?.message || "Could not open the application page");
      }
    } catch (err) {
      if (err.response?.data?.applyType === "internal") goToDetails();
      else toast.error(err.response?.data?.message || "Could not open the application page");
    } finally {
      setApplying(false);
    }
  }, [job, goToDetails]);

  const handleSave = () => {
    if (!job?._id) return;
    setSaved((s) => !s);
    onToggleSaved(job._id, saved);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/description/${job?._id}`;
    const ok = await copyToClipboard(url);
    toast[ok ? "success" : "error"](ok ? "Link copied to clipboard" : "Couldn't copy link");
  };

  const company = job?.company?.name || job?.companyName || "Company";
  const skills = (job?.skills || []).filter(Boolean);
  const description = stripHtmlToText(job?.description);
  const isExternal = job?.applyType === "external";

  return (
    <AnimatePresence>
      {open && job && (
        <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-label={`${job.title} at ${company}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.32 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl outline-none sm:max-w-lg"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-12 w-12 shrink-0 rounded-xl border border-border">
                  <AvatarImage src={sanitizeCompanyLogoUrl(job.company?.logo)} alt={company} />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {company[0]?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-semibold text-foreground">{company}</p>
                    {job.company?.domain && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </div>
                  <SourceBadge source={job.sourceName} className="mt-1" />
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <h2 className="text-lg font-bold leading-snug text-foreground">{job.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location || "Remote"}
                </span>
                {REMOTE_LABEL[job.remoteType] && (
                  <span className="inline-flex items-center gap-1">
                    {job.remoteType === "onsite" ? <Building2 className="h-3.5 w-3.5" /> : <Laptop2 className="h-3.5 w-3.5" />}
                    {REMOTE_LABEL[job.remoteType]}
                  </span>
                )}
                {job.freshness && (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {job.freshness}
                  </span>
                )}
              </div>

              <div className="mt-4 divide-y divide-border rounded-xl border border-border px-4">
                <DetailRow
                  icon={DollarSign}
                  label="Salary"
                  value={
                    Number.isFinite(job.salaryMin) && job.salaryMin > 0
                      ? `${job.salaryCurrency === "USD" ? "$" : "₹"}${job.salaryMin}${job.salaryMax ? ` – ${job.salaryMax}` : "+"}${job.salaryCurrency === "USD" ? "" : "L"}`
                      : ""
                  }
                />
                <DetailRow icon={Briefcase} label="Job type" value={job.jobType} />
                <DetailRow icon={Briefcase} label="Experience" value={job.seniority} />
                <DetailRow icon={Building2} label="Source" value={job.sourceName || "JobPilot"} />
              </div>

              {skills.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span key={s} className="rounded-lg border border-primary/15 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">About the role</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {description || "No description provided for this role."}
                </p>
              </div>

              <button
                type="button"
                onClick={goToDetails}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                View full details
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="border-t border-border p-4">
              {isExternal && (
                <p className="mb-2 text-center text-[11px] text-muted-foreground">
                  Applying opens {job.sourceName || "the original job provider"} in a new tab.
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {isExternal ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  {applying ? "Opening…" : isExternal ? "Apply Now" : "View & Apply"}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  aria-pressed={saved}
                  aria-label={saved ? "Remove from saved jobs" : "Save job"}
                  className={cn(
                    "shrink-0 rounded-xl border p-3 transition-colors",
                    saved ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share job"
                  className="shrink-0 rounded-xl border border-border p-3 text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
