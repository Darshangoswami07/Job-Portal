import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  DollarSign,
  MapPin,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, sanitizeCompanyLogoUrl } from "@/lib/utils";
import { formatSalary, getApplicantCount } from "./format";
import { fadeUp, viewportOnce } from "./motion";

function SimilarJobCard({ job, index, onApply }) {
  const navigate = useNavigate();
  const company = job.company || {};
  const salary = formatSalary(job);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      onClick={() => navigate(`/description/${job._id}`)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-200/80 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:border-indigo-500/30"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <Avatar className="h-full w-full rounded-xl">
            <AvatarImage src={sanitizeCompanyLogoUrl(company.logo)} alt={company.name} />
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-base font-bold text-white">
              {(company.name || "C")[0]}
            </AvatarFallback>
          </Avatar>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <DollarSign className="h-3 w-3" />
          {salary.currency}
          {salary.value}
          {salary.lpa ? " LPA" : ""}
        </span>
      </div>

      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-white dark:group-hover:text-indigo-300">
        {job.title}
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
        <Building2 className="h-3.5 w-3.5" />
        {company.name}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <MapPin className="h-3 w-3" />
          {job.location || "Remote"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Briefcase className="h-3 w-3" />
          {job.jobType}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {getApplicantCount(job)} applicants
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onApply(job);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/40 active:scale-95"
        >
          Quick Apply
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function SimilarJobs({ jobs, onApply }) {
  if (!jobs?.length) return null;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="mt-12"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Similar Jobs
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Roles you might also be interested in
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job, idx) => (
          <SimilarJobCard key={job._id} job={job} index={idx} onApply={onApply} />
        ))}
      </div>
    </motion.section>
  );
}

export function SimilarJobCardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-5 dark:border-slate-800/70 dark:bg-slate-900/70",
            "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
            "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent dark:before:via-white/10"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-4 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-3 w-1/2 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
