import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Users, Eye, Banknote, Briefcase, Copy, Archive, Trash2,
  BarChart3, Pencil, MoreHorizontal, CalendarDays, ArrowUpRight,
  Check, Loader2, Hourglass, Zap, CheckCircle2, XCircle,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { JOB_API_END_POINT } from "@/utils/constant";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_MAP = {
  active: { label: "Active", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", icon: CheckCircle2 },
  draft: { label: "Draft", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-400", dot: "bg-slate-500", icon: Hourglass },
  archived: { label: "Archived", cls: "bg-slate-500/15 text-slate-500", dot: "bg-slate-400", icon: Archive },
  filled: { label: "Filled", cls: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500", icon: Check },
};

function jobStatus(job) {
  if (job.isActive === false) return "archived";
  if (job.applicantsCount >= job.position && job.position > 0) return "filled";
  return "active";
}

export default function JobCard({ job, index = 0, onDataChange }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = jobStatus(job);
  const statusSpec = STATUS_MAP[status];
  const company = job.company || {};
  const applicants = job.applicantsCount ?? job.applications?.length ?? 0;
  const applyRate = job.views > 0 ? Math.round((applicants / job.views) * 100) : 0;

  const runAction = async (type) => {
    setAction(type);
    try {
      if (type === "duplicate") {
        const payload = {
          title: job.title, description: job.description,
          requirements: job.requirements || [], location: job.location,
          jobType: job.jobType, salary: job.salary, experience: job.experienceLevel,
          position: job.position, companyId: job.company?._id,
        };
        const res = await axios.post(`${JOB_API_END_POINT}/post`, payload, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        });
        if (res.data.success) {
          toast.success("Job duplicated");
          onDataChange?.();
        }
      } else if (type === "archive") {
        const res = await axios.put(
          `${JOB_API_END_POINT}/update/${job._id}`,
          { isActive: false },
          { withCredentials: true }
        );
        if (res.data.success) {
          toast.success("Job archived");
          onDataChange?.();
        }
      } else if (type === "delete") {
        const res = await axios.delete(`${JOB_API_END_POINT}/delete/${job._id}`, { withCredentials: true });
        if (res.data.success) {
          toast.success("Job deleted");
          onDataChange?.();
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${type} job`);
    } finally {
      setAction(null);
      setMenuOpen(false);
      setConfirmDelete(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-[0_28px_64px_-32px_rgba(79,70,229,0.35)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar className="size-14 rounded-2xl">
              <AvatarImage src={company.logo} alt={company.name} />
              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-lg font-bold text-white">
                {(company.name || "C")[0]}
              </AvatarFallback>
            </Avatar>
            <span className={cn("absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-card", statusSpec.dot)} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                  {job.title}
                </h3>
                <p className="truncate text-sm text-muted-foreground">{company.name || "Company"}</p>
              </div>
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Job actions"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal className="size-5" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 z-30 mt-1 w-52 rounded-2xl border border-border bg-popover p-1.5 shadow-2xl"
                    >
                      <MenuAction icon={Pencil} label="Edit Job" onClick={() => navigate(`/admin/jobs/${job._id}`)} />
                      <MenuAction icon={Copy} label="Duplicate" loading={action === "duplicate"} onClick={() => runAction("duplicate")} />
                      <MenuAction icon={BarChart3} label="Analytics & Applicants" onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)} />
                      <MenuAction icon={ArrowUpRight} label="Preview" onClick={() => navigate(`/description/${job._id}`)} />
                      <div className="my-1.5 border-t border-border" />
                      {!confirmDelete ? (
                        <MenuAction icon={Archive} label="Archive" loading={action === "archive"} onClick={() => runAction("archive")} />
                      ) : (
                        <div className="rounded-xl bg-destructive/10 p-2">
                          <p className="px-1 pb-1.5 text-xs font-semibold text-destructive">Delete this job?</p>
                          <div className="flex gap-1.5">
                            <Button size="xs" className="bg-destructive text-white" onClick={() => runAction("delete")} disabled={action === "delete"}>
                              {action === "delete" ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />} Delete
                            </Button>
                            <Button size="xs" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                      <MenuAction icon={Trash2} label="Delete" destructive onClick={() => setConfirmDelete(true)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", statusSpec.cls)}>
                <statusSpec.icon className="size-3" />
                {statusSpec.label}
              </span>
              {job.jobType && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {job.jobType}
                </span>
              )}
              {job.urgent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  <Zap className="size-3" /> Urgent
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Meta icon={MapPin} label="Location" value={job.location || "—"} />
          <Meta icon={Users} label="Applicants" value={String(applicants)} />
          <Meta icon={Eye} label="Views" value={String(job.views ?? 0)} />
          <Meta
            icon={Banknote}
            label="Salary"
            value={job.salary ? `${job.salaryCurrency || "INR"} ${job.salary}${job.salaryMin ? "+" : ""}` : "—"}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="size-3.5" />
              {job.experienceLevel ? `${job.experienceLevel}+ yrs` : "Fresher"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <TrendPill rate={applyRate} />
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/jobs/${job._id}`)}
              className="rounded-xl"
            >
              <Pencil className="size-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow shadow-indigo-500/25 hover:from-indigo-600 hover:to-blue-700"
            >
              <Users className="size-3.5" /> View Applicants
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MenuAction({ icon: Icon, label, onClick, destructive, loading }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition disabled:opacity-50",
        destructive ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-muted"
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      {label}
    </button>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5 transition-colors group-hover:bg-muted/60">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3" /> {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function TrendPill({ rate }) {
  const color = rate >= 10 ? "text-emerald-600 dark:text-emerald-400" : rate >= 4 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
  return <span className={color}>{rate}% apply rate</span>;
}
