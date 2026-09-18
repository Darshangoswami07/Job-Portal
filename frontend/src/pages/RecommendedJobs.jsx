import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Loader2, Briefcase, UserCog, X } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Job from "@/components/job/Job";
import JobSkeleton from "@/components/job/JobSkeleton";
import { Button } from "@/components/ui/button";
import useRecommendations from "@/hooks/useRecommendations";
import useSavedJobs from "@/hooks/useSavedJobs";
import { dismissJob, recordRecoEvent } from "@/api/recommendationsApi";

const MISSING_LABELS = {
  skills: "Add your skills",
  preferredRole: "Add a preferred role",
  location: "Add your location",
  remotePreference: "Set a remote preference",
  experience: "Add work experience",
};

export default function RecommendedJobs() {
  const { user } = useSelector((s) => s.auth);
  const { jobs, pagination, meta, loading, error, hasMore, loadMore } = useRecommendations({
    limit: 12,
    enabled: Boolean(user),
  });
  const { handleToggleSaved, savedJobIds } = useSavedJobs();
  const [hidden, setHidden] = useState(() => new Set());

  const initialLoading = loading && jobs.length === 0;
  const personalized = meta?.personalized;

  const handleDismiss = async (groupId) => {
    setHidden((prev) => new Set(prev).add(groupId));
    try {
      await dismissJob(groupId);
    } catch {
      setHidden((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      toast.error("Couldn't update — try again");
    }
  };

  const visibleJobs = jobs.filter((j) => !hidden.has(String(j.groupId)));

  // one impression beacon per page of results (best-effort)
  useEffect(() => {
    if (personalized && visibleJobs.length) {
      recordRecoEvent("recommendation_impression", null, {
        position: visibleJobs.length,
        strategy: meta?.strategy || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalized, pagination.page]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F3F2EF]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white card-shadow p-5 sm:p-6">
          <div className="flex items-center gap-2 text-blue-700">
            <Sparkles className="h-5 w-5" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Recommended for you</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {personalized
              ? "Based on your skills, experience, preferences and recent activity."
              : meta?.hint || "Complete your profile to get personalized job matches."}
          </p>
          {!user && (
            <p className="mt-3 text-sm text-gray-600">
              <Link to="/login" className="font-semibold text-blue-600 hover:underline">Log in</Link> to see jobs matched to your profile.
            </p>
          )}
          {user && personalized === false && (
            <div className="mt-3">
              {Array.isArray(meta?.missing) && meta.missing.length > 0 && (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {meta.missing.map((m) => (
                    <li key={m} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                      {MISSING_LABELS[m] || m}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <UserCog className="h-4 w-4" /> Complete your profile
              </Link>
            </div>
          )}
        </div>

        {initialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <JobSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-gray-100 bg-white card-shadow p-12 text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Couldn't load recommendations</h2>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        ) : visibleJobs.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white card-shadow p-12 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No recommendations yet</h2>
            <p className="text-gray-500 text-sm">Browse and save a few jobs to help us learn what you're looking for.</p>
            <Link to="/jobs" className="mt-4 inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Browse all jobs
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">{pagination.total} matches</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {visibleJobs.map((job) => (
                <div
                  key={job.groupId || job._id}
                  className="relative"
                  onClickCapture={() => recordRecoEvent("recommendation_clicked", job.groupId, { strategy: meta?.strategy || "" })}
                >
                  <Job
                    job={job}
                    isSaved={savedJobIds.has(String(job._id))}
                    onToggleSaved={handleToggleSaved}
                  />
                  {job.groupId && (
                    <button
                      type="button"
                      onClick={() => handleDismiss(String(job.groupId))}
                      title="Not interested — hide this and improve future matches"
                      className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1 text-gray-400 shadow-sm ring-1 ring-gray-200 hover:text-gray-700"
                      aria-label="Not interested"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button onClick={loadMore} disabled={loading} className="btn-primary rounded-xl px-8 py-5 font-semibold">
                  {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</span> : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
