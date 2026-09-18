import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Globe,
  Linkedin,
  MapPin,
  Users,
  Calendar,
  Briefcase,
  ArrowRight,
  BadgeCheck,
  Star,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { sanitizeCompanyLogoUrl } from "@/lib/utils";
import {
  getCompanySize,
  getCompanyRating,
  getCompanyWebsite,
  isVerified,
} from "./format";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

function InfoChip({ icon: Icon, label, value, href }) {
  const content = (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-800/50">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
}

export default function CompanyCard({ job, openPositions = 0 }) {
  const navigate = useNavigate();
  const company = job.company || {};
  const verified = isVerified(job);
  const rating = getCompanyRating(company.name);
  const website = getCompanyWebsite(job);
  const foundedYear = company.createdAt
    ? new Date(company.createdAt).getFullYear()
    : null;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl hover:border-indigo-200/80 transition-colors duration-300 sm:p-8 dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:border-indigo-500/30"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
              <Avatar className="h-full w-full rounded-2xl">
                <AvatarImage src={sanitizeCompanyLogoUrl(company.logo)} alt={company.name} />
                <AvatarFallback className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-xl font-bold text-white">
                  {(company.name || "C")[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                {company.name || "Company"}
              </h2>
              {verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-600 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/30">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {rating.toFixed(1)}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {company.industry || job.industry || "Technology"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/company/${job.company?._id || job.companyId}`)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/35 active:scale-95"
        >
          View Company Profile
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {company.description && (
        <p className="mt-5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
          {company.description}
        </p>
      )}

      <motion.div
        variants={staggerContainer(0.06)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <InfoChip
          icon={Building2}
          label="Industry"
          value={company.industry || job.industry || "Technology"}
        />
        {foundedYear && (
          <InfoChip icon={Calendar} label="Founded" value={String(foundedYear)} />
        )}
        <InfoChip icon={Users} label="Company size" value={getCompanySize(company.name)} />
        <InfoChip icon={MapPin} label="Headquarters" value={company.location || job.location || "—"} />
        {website && (
          <InfoChip
            icon={Globe}
            label="Website"
            value={new URL(website).hostname.replace("www.", "")}
            href={website}
          />
        )}
        <InfoChip
          icon={Linkedin}
          label="LinkedIn"
          value="Company page"
          href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(
            company.name || ""
          )}`}
        />
        <InfoChip
          icon={Briefcase}
          label="Open positions"
          value={String(openPositions)}
        />
      </motion.div>
    </motion.section>
  );
}
