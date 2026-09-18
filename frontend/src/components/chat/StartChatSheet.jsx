import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Building2, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { getStatusMeta } from "@/utils/chat";
import { cn } from "@/lib/utils";

export default function StartChatSheet({ open, onClose, onStart }) {
  const user = useSelector((s) => s.auth.user);
  const isRecruiter = user?.currentRole === "recruiter";
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState(null);

  useEffect(() => {
    if (!open || isRecruiter) return;
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${APPLICATION_API_END_POINT}/get`, { withCredentials: true })
      .then((res) => {
        if (!cancelled) setApplications(res.data?.application || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isRecruiter]);

  const handleStart = async (application) => {
    setCreatingId(String(application._id));
    try {
      await onStart?.(application);
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[150] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Start a new chat"
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Start a new chat</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {isRecruiter ? "Message applicants from your job posts" : "Message recruiters after applying"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {isRecruiter ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
                  <Building2 className="mx-auto mb-3 h-8 w-8 text-indigo-500" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Message your applicants</p>
                  <p className="mx-auto mt-1 max-w-[260px] text-xs text-slate-400 dark:text-slate-500">
                    Open any job in <strong>My Jobs</strong> and tap <strong>Message</strong> next to an applicant.
                  </p>
                  <Link
                    to="/admin/jobs"
                    onClick={onClose}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
                  >
                    Go to My Jobs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : applications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
                  <MessageSquare className="mx-auto mb-3 h-8 w-8 text-indigo-500" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No applications yet</p>
                  <p className="mx-auto mt-1 max-w-[260px] text-xs text-slate-400 dark:text-slate-500">
                    Apply to a job first — you can message the recruiter once your application is submitted.
                  </p>
                  <Link
                    to="/jobs"
                    onClick={onClose}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
                  >
                    Browse jobs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {applications.map((app) => {
                    const job = app.job;
                    const meta = getStatusMeta(app.status);
                    return (
                      <li key={String(app._id)}>
                        <button
                          type="button"
                          onClick={() => handleStart(app)}
                          disabled={creatingId === String(app._id)}
                          className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left transition-all hover:border-indigo-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-500/30"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700">
                            {job?.company?.logo ? (
                              <img src={job.company.logo} alt={job.company.name} className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-5 w-5 text-slate-400" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {job?.title || "Job"}
                            </span>
                            <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                              {job?.company?.name}
                            </span>
                          </span>
                          <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", meta.bg, meta.text)}>
                            <span className={cn("h-1 w-1 rounded-full", meta.dot)} />
                            {meta.label}
                          </span>
                          {creatingId === String(app._id) ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-500" />
                          ) : (
                            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
