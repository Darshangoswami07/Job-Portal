import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Globe, Users, ArrowUpRight, Pencil, Building2 } from "lucide-react";
import EmptyState from "@/components/recruiter/EmptyState";
import { SkeletonCard } from "@/components/recruiter/Skeleton";
import { cn, sanitizeCompanyLogoUrl } from "@/lib/utils";

const GRADIENTS = [
  "from-indigo-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-cyan-600",
];

export default function CompanyTable({ view = "grid" }) {
  const { companies = [], searchCompanyByText = "" } = useSelector((store) => store.company || {});
  const { allAdminJobs = [] } = useSelector((store) => store.job || {});
  const navigate = useNavigate();

  const filteredCompanies = useMemo(() => {
    if (!searchCompanyByText) return companies;
    const q = searchCompanyByText.toLowerCase();
    return companies.filter((company) =>
      company?.name?.toLowerCase().includes(q) ||
      company?.location?.toLowerCase().includes(q) ||
      company?.description?.toLowerCase().includes(q)
    );
  }, [companies, searchCompanyByText]);

  const loading = companies.length === 0 && !searchCompanyByText;

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (filteredCompanies.length === 0) {
    return (
      <EmptyState
        variant="company"
        title={searchCompanyByText ? "No companies match your search" : "No Companies Yet"}
        description={
          searchCompanyByText
            ? "Try a different search term."
            : "Register your first company to start posting jobs."
        }
        action={
          <Button
            onClick={() => navigate("/admin/companies/create")}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-blue-700"
          >
            Register a Company
          </Button>
        }
      />
    );
  }

  if (view === "list") {
    return (
      <div className="premium-card divide-y divide-border/70 overflow-hidden">
        {filteredCompanies.map((company, i) => (
          <CompanyListRow key={company._id} company={company} index={i} navigate={navigate} jobs={allAdminJobs} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {filteredCompanies.map((company, i) => (
          <CompanyCard key={company._id} company={company} index={i} navigate={navigate} jobs={allAdminJobs} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function useCompanyStats(jobs, company) {
  const list = jobs.filter((j) => j.company?._id === company._id || j.company === company._id);
  const jobCount = list.length;
  const applications = list.reduce((s, j) => s + (j.applicantsCount ?? j.applications?.length ?? 0), 0);
  return { jobCount, applications };
}

function CompanyCard({ company, index, navigate, jobs }) {
  const { jobCount, applications } = useCompanyStats(jobs, company);
  const grad = GRADIENTS[index % GRADIENTS.length];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-[0_28px_64px_-32px_rgba(79,70,229,0.35)]"
    >
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100", grad)} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className={cn("flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg", grad)}>
            {company.logo ? (
              <img
                src={sanitizeCompanyLogoUrl(company.logo)}
                alt={company.name}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className="size-14 rounded-2xl object-cover"
              />
            ) : (
              <Building2 className="size-7 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {company.name}
            </h3>
            {company.location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {company.location}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/companies/${company._id}`)}
          className="flex size-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
          aria-label={`Edit ${company.name}`}
        >
          <Pencil className="size-4" />
        </button>
      </div>

      <p className="mt-4 line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {company.description || "No description yet. Add one to help candidates learn more about your company."}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatTile icon={Briefcase} value={jobCount} label="Jobs" />
        <StatTile icon={Users} value={applications} label="Applicants" />
        <StatTile icon={Globe} value={company.website ? "Visit" : "—"} label="Website" isLink={company.website} href={company.website} />
      </div>

      <div className="mt-4 border-t border-border/70 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/admin/companies/${company._id}`)}
          className="w-full rounded-xl"
        >
          Manage Company <ArrowUpRight className="size-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

function CompanyListRow({ company, index, navigate, jobs }) {
  const { jobCount, applications } = useCompanyStats(jobs, company);
  const grad = GRADIENTS[index % GRADIENTS.length];
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => navigate(`/admin/companies/${company._id}`)}
      className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
    >
      <Avatar className="size-11 rounded-xl">
        <AvatarImage src={company.logo} alt={company.name} />
        <AvatarFallback className={cn("rounded-xl bg-gradient-to-br text-white font-bold", grad)}>
          {(company.name || "C")[0]}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-foreground">{company.name}</p>
        <p className="text-xs text-muted-foreground">{company.location || company.description || "Company"}</p>
      </div>
      <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:flex">
        <Briefcase className="size-3.5" /> {jobCount} jobs
      </span>
      <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:flex">
        <Users className="size-3.5" /> {applications}
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
    </motion.div>
  );
}

function StatTile({ icon: Icon, value, label, isLink, href }) {
  if (isLink && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center rounded-xl bg-muted/40 px-2 py-2.5 text-center transition hover:bg-muted/70"
      >
        <Icon className="size-3.5 text-primary" />
        <span className="mt-0.5 truncate text-[11px] font-bold text-foreground">{value}</span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </a>
    );
  }
  return (
    <div className="flex flex-col items-center rounded-xl bg-muted/40 px-2 py-2.5 text-center">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="mt-0.5 text-sm font-bold text-foreground">{value}</span>
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}
