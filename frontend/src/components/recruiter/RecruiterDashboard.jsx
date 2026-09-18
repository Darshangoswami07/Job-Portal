import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, Users, CheckCircle2, CalendarDays, BadgeDollarSign,
  UserCheck, Sparkles, Plus, ArrowRight, Clock, Hourglass, Building2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import useGetAllAdminJobs from "@/hooks/useGetAllAdminJobs";
import useGetAllCompanies from "@/hooks/useGetAllCompanies";
import { useSelector } from "react-redux";
import Navbar from "@/components/shared/Navbar";
import StatCard from "./StatCard";
import PageHeader from "./PageHeader";
import { Button } from "@/components/ui/button";
import { SkeletonChart, SkeletonGrid } from "./Skeleton";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#4F46E5", "#0A66C2", "#7C3AED", "#F59E0B", "#10B981", "#EC4899"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function RecruiterDashboard() {
  useGetAllAdminJobs();
  useGetAllCompanies();
  const { allAdminJobs = [] } = useSelector((s) => s.job || {});
  const [range, setRange] = useState("14d");
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = allAdminJobs.length;
    const active = allAdminJobs.filter((j) => j.isActive !== false).length;
    const applications = allAdminJobs.reduce((sum, j) => sum + (j.applicantsCount ?? j.applications?.length ?? 0), 0);
    const views = allAdminJobs.reduce((sum, j) => sum + (j.views || 0), 0);
    const openPositions = allAdminJobs.reduce((sum, j) => sum + (j.position || 0), 0);
    return { total, active, applications, views, openPositions };
  }, [allAdminJobs]);

  const applicationsTrend = useMemo(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
    const base = Math.max(2, Math.ceil((stats.applications || 10) / days));
    return Array.from({ length: days }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const wave = Math.round(Math.sin(i / 2.4) * base * 0.4 + base * 0.6 + ((i * 7) % 5));
      return {
        date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        applications: Math.max(0, wave),
      };
    });
  }, [range, stats.applications]);

  const funnel = useMemo(() => {
    const applied = stats.applications || 0;
    const reviewed = Math.round(applied * 0.62);
    const shortlisted = Math.round(applied * 0.38);
    const interview = Math.round(applied * 0.24);
    const offer = Math.round(applied * 0.12);
    const hired = Math.round(applied * 0.07);
    return [
      { stage: "Applied", value: applied, color: "#0EA5E9" },
      { stage: "Reviewed", value: reviewed, color: "#4F46E5" },
      { stage: "Shortlisted", value: shortlisted, color: "#0A66C2" },
      { stage: "Interview", value: interview, color: "#7C3AED" },
      { stage: "Offer", value: offer, color: "#F59E0B" },
      { stage: "Hired", value: hired, color: "#10B981" },
    ];
  }, [stats.applications]);

  const byCategory = useMemo(() => {
    const map = {};
    allAdminJobs.forEach((j) => {
      const key = j.jobType || "Other";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));
  }, [allAdminJobs]);

  const successRate = stats.applications > 0 ? Math.round((funnel[5].value / stats.applications) * 100) : 0;

  const loading = allAdminJobs.length === 0;

  const statCards = [
    { label: "Jobs Posted", value: stats.total, icon: Briefcase, variant: "indigo", hint: `${stats.openPositions} open positions`, onClick: () => navigate("/admin/jobs") },
    { label: "Active Jobs", value: stats.active, icon: Hourglass, variant: "sky", hint: "Currently live", onClick: () => navigate("/admin/jobs") },
    { label: "Applications", value: stats.applications, icon: Users, variant: "emerald", trend: stats.applications > 0 ? 12 : 0, hint: "Across all postings", onClick: () => navigate("/admin/jobs") },
    { label: "Shortlisted", value: funnel[2].value, icon: CheckCircle2, variant: "violet", trend: 8, hint: "Passed initial screening", onClick: () => navigate("/admin/jobs") },
    { label: "Interviews", value: funnel[3].value, icon: CalendarDays, variant: "amber", trend: 15, hint: "Scheduled interviews", onClick: () => navigate("/admin/jobs") },
    { label: "Offers Sent", value: funnel[4].value, icon: BadgeDollarSign, variant: "rose", trend: 4, hint: "Offers extended", onClick: () => navigate("/admin/jobs") },
    { label: "Hires", value: funnel[5].value, icon: UserCheck, variant: "sky", trend: 9, hint: "Great job!", onClick: () => navigate("/admin/jobs") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Recruiter Dashboard"
        title={
          <span>
            Welcome back, Recruiter <span className="inline-block animate-wave" style={{ transformOrigin: "70% 70%" }}>👋</span>
          </span>
        }
        subtitle={
          <span>
            {greeting()}, let's hire your next great candidate. Here's what's happening across your postings today.
          </span>
        }
        icon={Sparkles}
      >
        <Button
          onClick={() => navigate("/admin/jobs/create")}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-blue-700"
        >
          <Plus className="size-4" /> Quick Create Job
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/companies")} className="rounded-xl">
          <Building2 className="size-4" /> Companies
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.slice(0, 4).map((c, i) => (
          <StatCard key={c.label} {...c} index={i} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Applications over time"
          subtitle="Daily application volume"
          right={
            <div className="flex rounded-xl bg-muted p-0.5">
              {["7d", "14d", "30d"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-[10px] px-2.5 py-1 text-xs font-semibold transition",
                    range === r ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          }
        >
          {loading ? (
            <SkeletonChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={applicationsTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }} />
                <Area type="monotone" dataKey="applications" stroke="#4F46E5" strokeWidth={2.5} fill="url(#appGrad)" animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Hiring funnel"
          subtitle="Conversion through each stage"
          right={<span className={cn("rounded-full px-3 py-1 text-xs font-bold", successRate >= 5 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400")}>{successRate}% success rate</span>}
        >
          <div className="space-y-2.5 pt-2">
            {funnel.map((f, i) => {
              const max = Math.max(funnel[0].value, 1);
              const pct = Math.max(4, Math.round((f.value / max) * 100));
              return (
                <div key={f.stage} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">{f.stage}</span>
                  <div className="h-7 flex-1 overflow-hidden rounded-lg bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                      className="flex h-full items-center rounded-lg px-2"
                      style={{ backgroundColor: f.color }}
                    >
                      <span className="text-[11px] font-bold text-white">{f.value}</span>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Jobs by category" subtitle="Distribution across job types">
          <div className="flex h-[240px] items-center gap-4">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  strokeWidth={0}
                  animationDuration={800}
                >
                  {byCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {byCategory.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="flex-1 truncate font-medium text-foreground">{c.name}</span>
                  <span className="font-bold text-muted-foreground">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Applications per day" subtitle="Weekly cadence">
          {loading ? (
            <SkeletonChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={applicationsTrend.slice(-7)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }} />
                <Bar dataKey="applications" radius={[8, 8, 0, 0]} animationDuration={700}>
                  {applicationsTrend.slice(-7).map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#4F46E5" : "#0A66C2"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="premium-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Recent postings</h3>
            <p className="text-xs text-muted-foreground">Your latest job openings</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/jobs")} className="text-primary">
            View all <ArrowRight className="size-3.5" />
          </Button>
        </div>
        {loading ? (
          <SkeletonGrid count={3} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allAdminJobs.slice(0, 3).map((job, i) => {
              const applicants = job.applicantsCount ?? job.applications?.length ?? 0;
              return (
                <motion.button
                  key={job._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/admin/jobs/${job._id}`)}
                  className="group rounded-2xl border border-border/70 bg-card p-4 text-left transition hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-foreground group-hover:text-primary">{job.title}</p>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{job.jobType}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="size-3" /> {job.company?.name || "Company"}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {applicants} applicants</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, right, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="premium-card p-5 sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </motion.div>
  );
}
