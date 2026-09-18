import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  APPLICATION_API_END_POINT,
  JOB_API_END_POINT,
} from "@/utils/constant.js";
import { setSingleJob } from "@/store/slices/jobSlice";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Bookmark, Send, Check, Loader2, MessageSquare } from "lucide-react";
import { createConversation } from "@/api/chatApi";
import { getExternalApplyUrl } from "@/api/jobsApi";
import Navbar from "@/components/shared/Navbar";
import useSavedJobs from "@/hooks/useSavedJobs";
import { copyToClipboard } from "@/utils/clipboard";
import { cn } from "@/lib/utils";
import JobSkeleton from "./description/JobSkeleton";
import JobHero from "./description/JobHero";
import JobSidebar from "./description/JobSidebar";
import MatchExplanation from "./MatchExplanation";
import JobSections from "./description/JobSections";
import SalaryCard from "./description/SalaryCard";
import HiringTimeline from "./description/HiringTimeline";
import CompanyCard from "./description/CompanyCard";
import JobInsights from "./description/JobInsights";
import SimilarJobs from "./description/SimilarJobs";
import ReportDialog from "./description/ReportDialog";
import JobNotFound from "./description/JobNotFound";

const BURST_COLORS = ["#4F46E5", "#0A66C2", "#10B981", "#F59E0B", "#EC4899"];

function ShareBurst({ show }) {
  if (!show) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[130] overflow-hidden"
    >
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ top: "22%", left: `${30 + (i % 40)}%`, opacity: 1, scale: 0.5, rotate: 0 }}
          animate={{
            top: "38%",
            left: `${30 + (i % 40) + ((i % 3) - 1) * 7}%`,
            opacity: [1, 1, 0],
            scale: [0.5, 1, 0.6],
            rotate: (i % 2 === 0 ? 1 : -1) * 360,
          }}
          transition={{ duration: 1.5, delay: (i % 7) * 0.04, ease: "easeOut" }}
          className="absolute block h-2 w-2 rounded-sm"
          style={{ backgroundColor: BURST_COLORS[i % BURST_COLORS.length] }}
        />
      ))}
    </div>
  );
}

function MobileApplyBar({ isApplied, applying, onApply, onSave, isSaved, onShare, applicationId, onMessage }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden dark:border-slate-800/80 dark:bg-slate-900/90"
        >
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              aria-label="Save job"
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors",
                isSaved
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300"
              )}
            >
              <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
            </button>
            {applicationId && (
              <button
                type="button"
                onClick={onMessage}
                aria-label="Message recruiter"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onShare}
              aria-label="Share job"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={isApplied || applying}
              className={cn(
                "flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all",
                isApplied
                  ? "bg-emerald-500 shadow-emerald-500/30"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 shadow-emerald-500/40 active:scale-[0.98]"
              )}
            >
              {isApplied ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={3} />
                  Applied
                </>
              ) : applying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Apply Now
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-600/10" />
      <div className="absolute top-1/3 -left-40 h-[380px] w-[380px] rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-600/10" />
      <div className="absolute bottom-0 right-1/4 h-[320px] w-[320px] rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-600/10" />
    </div>
  );
}

export default function JobDescription() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { singleJob } = useSelector((store) => store.job);
  const { user } = useSelector((store) => store.auth);
  const { allJobs = [] } = useSelector((store) => store.job);

  const { savedJobIds, handleToggleSaved } = useSavedJobs();

  const isInitiallyApplied = useMemo(
    () =>
      singleJob?.applications?.some(
        (app) => String(app.applicant?._id || app.applicant) === String(user?._id)
      ) || false,
    [singleJob, user]
  );

  const [isApplied, setIsApplied] = useState(isInitiallyApplied);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [appliedApplicationId, setAppliedApplicationId] = useState(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const copiedTimer = useRef(null);

  const myApplication = useMemo(
    () =>
      singleJob?.applications?.find(
        (app) => String(app.applicant?._id || app.applicant) === String(user?._id)
      ) || null,
    [singleJob, user]
  );

  const applicationId = myApplication?._id || appliedApplicationId || null;

  const isSaved = useMemo(
    () => savedJobIds.has(String(singleJob?._id)),
    [savedJobIds, singleJob]
  );

  const fallbackRelated = useMemo(() => {
    if (!singleJob) return [];
    return allJobs
      .filter((j) => j._id !== singleJob._id && j.title === singleJob.title)
      .slice(0, 3);
  }, [allJobs, singleJob]);

  const displayRelated = useMemo(
    () => (relatedJobs.length ? relatedJobs : fallbackRelated),
    [relatedJobs, fallbackRelated]
  );

  const openPositions = useMemo(
    () =>
      allJobs.filter(
        (j) =>
          String(j.company?._id || j.company) === String(singleJob?.company?._id)
      ).length,
    [allJobs, singleJob]
  );

  // Open the official external application page for a specific source's job.
  const applyExternal = useCallback(async (targetJobId, sourceName) => {
    setApplying(true);
    try {
      const res = await getExternalApplyUrl(targetJobId || jobId);
      if (res.data?.success && res.data.url) {
        window.open(res.data.url, "_blank", "noopener,noreferrer");
        toast.success(`Opening application${sourceName ? ` on ${sourceName}` : ""}`);
      } else {
        toast.error(res.data?.message || "Could not open the application page");
      }
    } catch (error) {
      if (error.response?.data?.applyType === "internal") {
        toast.error("This job uses the in-platform application");
      } else {
        toast.error(error.response?.data?.message || "Could not open the application page");
      }
    } finally {
      setApplying(false);
    }
  }, [jobId]);

  const applyInternal = useCallback(async () => {
    if (!user) {
      toast.error("Please login to apply for jobs");
      navigate("/login");
      return;
    }
    setApplying(true);
    try {
      const [res] = await Promise.all([
        axios.get(`${APPLICATION_API_END_POINT}/apply/${jobId}`, {
          withCredentials: true,
        }),
        new Promise((resolve) => setTimeout(resolve, 750)),
      ]);
      if (res.data.success) {
        setIsApplied(true);
        if (res.data.application?._id) {
          setAppliedApplicationId(res.data.application._id);
        }
        const updatedJob = {
          ...singleJob,
          applications: [...(singleJob?.applications || []), { applicant: user?._id }],
        };
        dispatch(setSingleJob(updatedJob));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setApplying(false);
    }
  }, [user, jobId, singleJob, dispatch, navigate]);

  // Primary Apply button: branch on the job's applyType.
  const applyJobHandler = useCallback(() => {
    if (singleJob?.applyType === "external") {
      return applyExternal(singleJob._id, singleJob.sourceName || singleJob.source);
    }
    return applyInternal();
  }, [singleJob, applyExternal, applyInternal]);

  const handleSave = useCallback(() => {
    if (!singleJob?._id) return;
    handleToggleSaved(singleJob._id, isSaved);
  }, [singleJob, isSaved, handleToggleSaved]);

  const handleShare = useCallback(async () => {
    await copyToClipboard(window.location.href);
    toast.success("Link copied to clipboard");
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2200);
  }, []);

  const handleMessage = useCallback(async () => {
    if (!applicationId) {
      toast.error("Apply to this job first to message the recruiter");
      return;
    }
    setMessageLoading(true);
    try {
      const res = await createConversation(applicationId);
      if (res.data?.success) {
        navigate(`/chat/${res.data.conversation._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not open chat");
    } finally {
      setMessageLoading(false);
    }
  }, [applicationId, navigate]);

  const handleQuickApply = useCallback(
    async (job) => {
      if (!user) {
        toast.error("Please login to apply for jobs");
        navigate("/login");
        return;
      }
      const alreadyApplied = job.applications?.some(
        (app) => String(app.applicant?._id || app.applicant) === String(user._id)
      );
      if (alreadyApplied) {
        toast.info("You have already applied to this job");
        return;
      }
      try {
        const res = await axios.get(`${APPLICATION_API_END_POINT}/apply/${job._id}`, {
          withCredentials: true,
        });
        if (res.data.success) toast.success(res.data.message);
      } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    },
    [user, navigate]
  );

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
          withCredentials: true,
        });
        if (res.data.success) {
          dispatch(setSingleJob(res.data.job));
          setGroup(res.data.group || null);
          setRelatedJobs(res.data.related || []);
          setIsApplied(
            res.data.job.applications?.some(
              (app) =>
                String(app.applicant?._id || app.applicant) === String(user?._id)
            ) || false
          );
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load job");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, dispatch, user?._id]);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <BackgroundDecor />
        <Navbar />
        <div className="relative z-10">
          <JobSkeleton />
        </div>
      </div>
    );
  }

  if (!singleJob) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <BackgroundDecor />
        <Navbar />
        <div className="relative z-10 flex min-h-[70vh] items-center justify-center px-4 py-20">
          <JobNotFound onBrowse={() => navigate("/jobs")} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <BackgroundDecor />
      <Navbar />
      <ShareBurst show={copied} />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <JobHero
          job={singleJob}
          isSaved={isSaved}
          onSave={handleSave}
          onShare={handleShare}
          onReport={() => setReportOpen(true)}
          onBack={() => navigate(-1)}
        />

        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            <JobSections job={singleJob} />
            <SalaryCard job={singleJob} />
            <HiringTimeline applied={isApplied} />
            <CompanyCard job={singleJob} openPositions={openPositions} />
            <JobInsights job={singleJob} relatedCount={displayRelated.length} />
          </div>

          <div className="min-w-0 space-y-6">
            <JobSidebar
              job={singleJob}
              group={group}
              isApplied={isApplied}
              applying={applying}
              onApply={applyJobHandler}
              onApplyExternal={applyExternal}
              isSaved={isSaved}
              onSave={handleSave}
              onShare={handleShare}
              onReport={() => setReportOpen(true)}
              applicationId={applicationId}
              onMessage={handleMessage}
              messageLoading={messageLoading}
            />
            <MatchExplanation key={group?.id || "none"} groupId={group?.id} />
          </div>
        </div>

        <SimilarJobs jobs={displayRelated} onApply={handleQuickApply} />
      </main>

      <MobileApplyBar
        isApplied={isApplied}
        applying={applying}
        onApply={applyJobHandler}
        isSaved={isSaved}
        onSave={handleSave}
        onShare={handleShare}
        applicationId={applicationId}
        onMessage={handleMessage}
      />

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        job={singleJob}
        user={user}
      />
    </div>
  );
}
