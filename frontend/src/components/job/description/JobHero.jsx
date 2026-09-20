import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Clock,
  DollarSign,
  Globe,
  Layers,
  MapPin,
  Briefcase,
  Star,
  Users,
  Share2,
  Bookmark,
  Flag,
  Calendar,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, sanitizeCompanyLogoUrl } from "@/lib/utils";
import {
  daysAgo,
  formatSalary,
  formatExperience,
  getWorkType,
  getHiringStatus,
  getCompanyRating,
  getCompanySize,
  getApplicantCount,
  getCompanyWebsite,
  isVerified,
} from "./format";
import ActionButton from "./ActionButton";
import { fadeUp, viewportOnce } from "./motion";

const TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  red: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800/70 dark:text-slate-300",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300",
};

function HeroBadge({ icon: Icon, tone = "slate", children, pulse = false }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset",
        TONES[tone]
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

function Rating({ rating }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
      <span className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
            )}
          />
        ))}
      </span>
      <span className="ml-1 text-slate-700 dark:text-slate-300">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function JobHero({
  job,
  isSaved,
  onSave,
  onShare,
  onReport,
  onBack,
}) {
  const company = job.company || {};
  const logo = sanitizeCompanyLogoUrl(company.logo);
  const salary = formatSalary(job);
  const hiring = getHiringStatus(job);
  const verified = isVerified(job);
  const rating = getCompanyRating(company.name);
  const size = getCompanySize(company.name);
  const workType = getWorkType(job);
  const applicants = getApplicantCount(job);
  const website = getCompanyWebsite(job);
  const workTypeIcon =
    workType === "Remote"
      ? { icon: Globe, tone: "green" }
      : workType === "Hybrid"
        ? { icon: Layers, tone: "indigo" }
        : { icon: Building2, tone: "blue" };

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      viewport={viewportOnce}
      className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white via-indigo-50/50 to-blue-50/70 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-10 dark:border-slate-700/60 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-300/30 to-sky-300/30 blur-3xl dark:from-indigo-600/20 dark:to-sky-600/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-200/30 to-teal-200/20 blur-3xl dark:from-emerald-600/10 dark:to-teal-600/10"
      />

      <div className="relative">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition-all hover:-translate-x-0.5 hover:text-slate-900 dark:border-slate-700/70 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              className="relative shrink-0"
            >
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 ring-4 ring-white/60 sm:h-24 sm:w-24 dark:border-slate-700 dark:bg-slate-800 dark:ring-slate-900/60">
                <Avatar className="h-full w-full rounded-2xl">
                  <AvatarImage src={logo} alt={company.name} />
                  <AvatarFallback className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-2xl font-bold text-white sm:text-3xl">
                    {(company.name || "C")[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              {verified && (
                <span className="absolute -right-2 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                  <BadgeCheck className="h-4.5 w-4.5 fill-sky-500 text-white" />
                </span>
              )}
            </motion.div>

            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                {job.title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{company.name}</span>
                {verified && (
                  <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                  </span>
                )}
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <Rating rating={rating} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                {company.industry || job.industry ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {company.industry || job.industry}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  {size}
                </span>
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
                  >
                    <Globe className="h-4 w-4" />
                    {new URL(website).hostname.replace("www.", "")}
                  </a>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <HeroBadge icon={DollarSign} tone="green">
                  {salary.currency}
                  {salary.value}
                  {salary.lpa ? " LPA" : ""}
                </HeroBadge>
                <HeroBadge icon={workTypeIcon.icon} tone={workTypeIcon.tone}>
                  {workType}
                </HeroBadge>
                <HeroBadge icon={Briefcase} tone="indigo">
                  {formatExperience(job)}
                </HeroBadge>
                <HeroBadge icon={Clock} tone="blue">
                  {job.jobType}
                </HeroBadge>
                <HeroBadge icon={MapPin} tone="slate">
                  {job.location || "Remote"}
                </HeroBadge>
                <HeroBadge icon={Users} tone="amber">
                  {applicants} {applicants === 1 ? "applicant" : "applicants"}
                </HeroBadge>
                <HeroBadge tone={hiring.tone} pulse>
                  {hiring.label}
                </HeroBadge>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Posted {daysAgo(job.createdAt || job.publishedAt)}
                </span>
                {job.updatedAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {daysAgo(job.updatedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 lg:flex-col lg:items-end">
            <div className="flex items-center gap-3">
              <ActionButton
                icon={Bookmark}
                label={isSaved ? "Remove from saved" : "Save job"}
                onClick={onSave}
                active={isSaved}
                activeClass="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30"
              />
              <ActionButton icon={Share2} label="Share job" onClick={onShare} />
              <ActionButton
                icon={Flag}
                label="Report job"
                onClick={onReport}
                className="hover:border-rose-300 hover:text-rose-500 dark:hover:border-rose-500/40 dark:hover:text-rose-400"
              />
            </div>
            {job.position ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {job.position} open {job.position === 1 ? "position" : "positions"}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
