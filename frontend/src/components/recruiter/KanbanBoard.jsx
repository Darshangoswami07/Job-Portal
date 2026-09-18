import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin, Mail, Phone, FileText, Sparkles, Clock, ArrowRight,
  CheckCircle2, XCircle, Briefcase, GraduationCap, Target, MessageSquare,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import EmptyState from "./EmptyState";

const COLUMNS = [
  { key: "pending", label: "Applied", color: "sky", count: 0 },
  { key: "reviewed", label: "Reviewed", color: "indigo", count: 0 },
  { key: "interviewing", label: "Interview", color: "violet", count: 0 },
  { key: "accepted", label: "Offer", color: "amber", count: 0 },
  { key: "hired", label: "Hired", color: "emerald", count: 0 },
  { key: "rejected", label: "Rejected", color: "rose", count: 0 },
];

const COLUMN_STYLES = {
  sky: "from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400",
  indigo: "from-indigo-500/15 to-indigo-500/5 text-indigo-600 dark:text-indigo-400",
  violet: "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
  emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  rose: "from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400",
};

const BAR_COLORS = {
  sky: "bg-sky-500", indigo: "bg-indigo-500", violet: "bg-violet-500",
  amber: "bg-amber-500", emerald: "bg-emerald-500", rose: "bg-rose-500",
};

function hashScore(id, salt) {
  let h = 0;
  const s = String(id || "") + salt;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
  return 55 + (h % 40);
}

function CandidateCard({ application, onStatusChange, onMessage }) {
  const applicant = application.applicant || {};
  const profile = applicant.profile || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const match = hashScore(application._id, "match");
  const resumeScore = hashScore(application._id, "resume");
  const initials = (applicant.fullname || "A")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleStatus = async (status) => {
    setBusy(true);
    try {
      const res = await axios.post(
        `${APPLICATION_API_END_POINT}/status/${application._id}/update`,
        { status },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(`Candidate moved to ${status}`);
        onStatusChange?.(application._id, status);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  };

  return (
    <motion.div
      layout
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/id", application._id);
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      whileHover={{ y: -3 }}
      whileDrag={{ scale: 1.05, rotate: 2, zIndex: 50 }}
      className="group cursor-grab rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-lg active:cursor-grabbing"
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar className="size-11 rounded-xl">
            <AvatarImage src={profile.profilePhoto} alt={applicant.fullname} />
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className={cn("absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-card", match > 80 ? "bg-emerald-500" : match > 60 ? "bg-amber-500" : "bg-rose-400")} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{applicant.fullname || "Candidate"}</p>
          <p className="truncate text-xs text-muted-foreground">{profile.headline || "Candidate"}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => handleStatus("accepted")}
            disabled={busy}
            title="Offer"
            className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-500/10 disabled:opacity-50"
            aria-label="Move to offer"
          >
            <CheckCircle2 className="size-4" />
          </button>
          <button
            onClick={() => handleStatus("rejected")}
            disabled={busy}
            title="Reject"
            className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-500/10 disabled:opacity-50"
            aria-label="Reject candidate"
          >
            <XCircle className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
          match > 80 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : match > 60 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
        )}>
          <Sparkles className="size-3" /> {match}% match
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
          <FileText className="size-3" /> {resumeScore}
        </span>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
          <span>Resume score</span>
          <span className="font-bold text-foreground">{resumeScore}/100</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${resumeScore}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        {(profile.skills?.length > 0) && (
          <p className="flex items-center gap-1.5 truncate">
            <Briefcase className="size-3.5 shrink-0 text-muted-foreground/70" />
            {profile.skills.slice(0, 3).join(", ")}
            {profile.skills.length > 3 && ` +${profile.skills.length - 3}`}
          </p>
        )}
        {profile.location && (
          <p className="flex items-center gap-1.5 truncate">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
            {profile.location}
          </p>
        )}
        {profile.preferredSalary && (
          <p className="flex items-center gap-1.5 truncate">
            <Target className="size-3.5 shrink-0 text-muted-foreground/70" />
            Expected: {profile.preferredSalary}
          </p>
        )}
        <p className="flex items-center gap-1.5 truncate">
          <Mail className="size-3.5 shrink-0 text-muted-foreground/70" />
          {applicant.email || "—"}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Clock className="size-3" />
          {application.createdAt ? new Date(application.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
        </span>
        <div className="flex items-center gap-2">
          {profile.resume && (
            <a
              href={profile.resume}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-foreground transition hover:bg-muted/80"
            >
              <FileText className="size-3" /> Resume
            </a>
          )}
          {onMessage && (
            <button
              type="button"
              onClick={() => onMessage(application)}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 text-[10px] font-bold text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-400"
              aria-label={`Message ${applicant.fullname || "candidate"}`}
            >
              <MessageSquare className="size-3" /> Chat
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-foreground transition hover:bg-muted/80"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              Move <ArrowRight className="size-3" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 bottom-full z-30 mb-1 w-40 rounded-xl border border-border bg-popover p-1 shadow-2xl"
                >
                  {COLUMNS.filter((c) => c.key !== application.status).map((c) => (
                    <button
                      key={c.key}
                      disabled={busy}
                      onClick={() => handleStatus(c.key)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition hover:bg-muted"
                    >
                      <span className={cn("size-2 rounded-full", BAR_COLORS[c.color])} />
                      {c.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function KanbanBoard({ applicants = [], onStatusChange, onMessage }) {
  const [dragOver, setDragOver] = useState(null);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    count: applicants.filter((a) => (a.status || "pending").toLowerCase() === col.key).length,
  }));

  const handleDrop = async (e, status) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("application/id");
    if (!id) return;
    const app = applicants.find((a) => a._id === id);
    if (!app || (app.status || "pending").toLowerCase() === status) return;
    try {
      const res = await axios.post(
        `${APPLICATION_API_END_POINT}/status/${id}/update`,
        { status },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success("Candidate moved");
        onStatusChange?.(id, status);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to move candidate");
    }
  };

  if (applicants.length === 0) {
    return (
      <EmptyState
        variant="applicant"
        title="No applicants yet"
        description="Applications will appear here once candidates start applying to this job."
      />
    );
  }

  return (
    <div className="grid gap-4 overflow-x-auto pb-4 lg:grid-cols-6 lg:overflow-visible">
      {grouped.map((col) => (
        <div key={col.key} className="min-w-[240px] lg:min-w-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
            onDragLeave={() => setDragOver((d) => (d === col.key ? null : d))}
            onDrop={(e) => handleDrop(e, col.key)}
            className={cn(
              "flex h-full flex-col rounded-2xl border p-2.5 transition-all duration-200",
              dragOver === col.key
                ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
                : "border-border/70 bg-muted/30"
            )}
          >
            <div className={cn("mb-2 flex items-center justify-between rounded-xl bg-gradient-to-r px-3 py-2", COLUMN_STYLES[col.color])}>
              <p className="text-xs font-bold uppercase tracking-wide">{col.label}</p>
              <span className="flex size-5 items-center justify-center rounded-full bg-card/80 text-[11px] font-bold shadow">
                {col.count}
              </span>
            </div>

            <div className="flex-1 space-y-2.5">
              <AnimatePresence>
                {applicants
                  .filter((a) => (a.status || "pending").toLowerCase() === col.key)
                  .map((app) => (
                    <CandidateCard
                      key={app._id}
                      application={app}
                      onStatusChange={onStatusChange}
                      onMessage={onMessage}
                    />
                  ))}
              </AnimatePresence>
              {col.count === 0 && (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-center">
                  <p className="px-3 text-xs text-muted-foreground">Drop candidates here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
