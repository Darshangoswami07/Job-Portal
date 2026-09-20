import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Clock,
  Briefcase,
  Building2,
  CalendarDays,
  ExternalLink,
  CircleDollarSign,
} from "lucide-react";
import { getStatusMeta } from "@/utils/chat";
import { cn } from "@/lib/utils";

const salaryLabel = (job) => {
  if (!job) return "";
  if (job.salaryMin || job.salaryMax) {
    const min = job.salaryMin ? Number(job.salaryMin).toLocaleString() : "—";
    const max = job.salaryMax ? Number(job.salaryMax).toLocaleString() : "—";
    return `₹${min} – ₹${max} LPA`;
  }
  if (job.salary) return `₹${Number(job.salary).toLocaleString()} ${job.salaryCurrency || "INR"}`;
  return "";
};

function Row({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

export default function ApplicationInfoCard({ conversation, onClose, onViewJob }) {
  const job = conversation?.job;
  const company = conversation?.company;
  const statusMeta = getStatusMeta(conversation?.application?.status);

  return (
    <AnimatePresence>
      {conversation?.infoOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div className="relative p-4 sm:p-5">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Close application details"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                {company?.logo ? (
                  <img src={company.logo} alt={company.name || "Company"} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-5 w-5 text-indigo-500" />
                )}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                  {job?.title || "Job details"}
                </h3>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{company?.name || "Company"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Row icon={MapPin} label="Location" value={job?.location} />
              <Row icon={Briefcase} label="Type" value={job?.jobType} />
              <Row icon={Clock} label="Work mode" value={job?.workType} />
              <Row icon={CircleDollarSign} label="Salary" value={salaryLabel(job)} />
              <Row icon={CalendarDays} label="Posted" value={job?.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : ""} />
              <Row icon={Building2} label="Industry" value={job?.industry} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Application status</p>
                <span className={cn("mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", statusMeta.bg, statusMeta.text)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot)} />
                  {statusMeta.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onViewJob?.(job?._id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View job
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
