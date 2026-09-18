import React, { useState } from "react";
import axios from "axios";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { FileText, CheckCircle2, XCircle, ChevronDown, Loader2, Mail, Phone, Sparkles, MessageSquare } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/recruiter/EmptyState";
import { AnimatePresence, motion } from "framer-motion";

const statusStyles = {
  pending: { label: "Applied", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  reviewed: { label: "Reviewed", cls: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  interviewing: { label: "Interviewing", cls: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  accepted: { label: "Accepted", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  hired: { label: "Hired", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  rejected: { label: "Rejected", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
};

const STATUS_ORDER = ["pending", "reviewed", "interviewing", "accepted", "hired", "rejected"];

function ApplicantsTable({ applicants = [], onStatusChange, onMessage }) {
  const [busyId, setBusyId] = useState(null);

  const statusHandler = async (status, id) => {
    setBusyId(id);
    try {
      const res = await axios.post(
        `${APPLICATION_API_END_POINT}/status/${id}/update`,
        { status },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(`Applicant moved to ${status}`);
        onStatusChange?.(id, status);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  if (applicants.length === 0) {
    return (
      <EmptyState
        variant="applicant"
        title="No applicants found"
        description="Applications will appear here once candidates start applying."
      />
    );
  }

  return (
    <div className="premium-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">All candidates</h3>
          <p className="text-xs text-muted-foreground">{applicants.length} total applications</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="size-3.5" /> ATS View
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Candidate", "Contact", "Resume", "Applied", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {applicants.map((applicantRow, index) => {
                const applicant = applicantRow.applicant || {};
                const profile = applicant.profile || {};
                const currentStatus = (applicantRow.status || "pending").toLowerCase();
                const spec = statusStyles[currentStatus] || statusStyles.pending;
                const initials = (applicant.fullname || "A").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

                return (
                  <motion.tr
                    key={applicantRow._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 rounded-xl">
                          <AvatarImage src={profile.profilePhoto} alt={applicant.fullname} />
                          <AvatarFallback className="rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-xs font-bold text-white">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground">{applicant.fullname || "-"}</p>
                          {profile.headline && <p className="text-xs text-muted-foreground">{profile.headline}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="size-3.5" /> {applicant.email || "-"}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="size-3" /> {applicant.phoneNumber || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      {profile.resumeOriginalName ? (
                        <a
                          href={profile.resume}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted/70"
                        >
                          <FileText className="size-3.5" /> {profile.resumeOriginalName}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(applicantRow.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {onMessage && (
                          <button
                            type="button"
                            onClick={() => onMessage(applicantRow)}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                            aria-label={`Message ${applicant.fullname || "applicant"}`}
                          >
                            <MessageSquare className="size-3" /> Message
                          </button>
                        )}
                        {currentStatus === "pending" && (
                          <>
                            <button
                              onClick={() => statusHandler("accepted", applicantRow._id)}
                              disabled={busyId === applicantRow._id}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <CheckCircle2 className="size-3" /> Accept
                            </button>
                            <button
                              onClick={() => statusHandler("rejected", applicantRow._id)}
                              disabled={busyId === applicantRow._id}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              <XCircle className="size-3" /> Reject
                            </button>
                          </>
                        )}
                        <div className="relative">
                          <select
                            value={currentStatus}
                            onChange={(e) => statusHandler(e.target.value, applicantRow._id)}
                            disabled={busyId === applicantRow._id}
                            className={cn(
                              "cursor-pointer appearance-none rounded-lg border-0 py-1.5 pl-3 pr-8 text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                              spec.cls
                            )}
                            aria-label="Update status"
                          >
                            {STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>{statusStyles[s].label}</option>
                            ))}
                          </select>
                          {busyId === applicantRow._id ? (
                            <Loader2 className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin" />
                          ) : (
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 opacity-60" />
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ApplicantsTable;
