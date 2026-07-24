import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Job from "@/components/job/Job";
import { SAVED_JOB_API_END_POINT } from "@/utils/constant";
import { useSelector } from "react-redux";
import { Bookmark, Search, Briefcase } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white card-shadow">
      <div className="border-b border-gray-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-200" />
          </div>
        </div>
      </div>
      <div className="space-y-3 px-5 py-5">
        <div className="h-5 w-48 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="flex gap-2 pt-1">
          <div className="h-7 w-20 rounded-full bg-gray-200" />
          <div className="h-7 w-20 rounded-full bg-gray-200" />
          <div className="h-7 w-16 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="flex gap-3 border-t border-gray-100 px-5 py-5">
        <div className="h-9 flex-1 rounded-xl bg-gray-200" />
        <div className="h-9 flex-1 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 15 },
  },
};

export default function SavedJobs() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const loadSavedJobs = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setSavedJobs([]);
      setSavedJobIds(new Set());
      setLoading(false);
      navigate("/login");
      return;
    }
    try {
      const url = `${SAVED_JOB_API_END_POINT}/me`;
      const res = await axios.get(url, { withCredentials: true });
      if (!res.data?.success) {
        setSavedJobs([]);
        setSavedJobIds(new Set());
        return;
      }
      const saved = res.data.savedJobs || res.data?.data || [];
      const jobs = saved.map((item) => item.jobId || item.job || item).filter(Boolean);
      setSavedJobs(jobs);
      setSavedJobIds(
        new Set(jobs.map((job) => job?._id || job?.id).filter(Boolean).map(String))
      );
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }
      setSavedJobs([]);
      setSavedJobIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [navigate, user]);

  useEffect(() => {
    loadSavedJobs();
  }, [loadSavedJobs]);

  const handleToggleSaved = async (jobId, currentlySaved) => {
    const normalizedJobId = String(jobId);
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      currentlySaved ? next.delete(normalizedJobId) : next.add(normalizedJobId);
      return next;
    });
    setSavedJobs((prev) => prev.filter((job) => String(job._id) !== normalizedJobId));

    try {
      await axios.delete(`${SAVED_JOB_API_END_POINT}/${normalizedJobId}`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Unable to remove saved job:", error);
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }
      loadSavedJobs();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#F3F2EF]"
    >
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Saved Jobs
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Jobs you have bookmarked for later review
              </p>
            </div>
            {!loading && savedJobs.length > 0 && (
              <div className="flex items-center gap-2 self-start rounded-xl bg-blue-50 border border-blue-200 px-4 py-2">
                <Bookmark className="h-4 w-4 text-[#0A66C2]" />
                <span className="text-sm font-semibold text-blue-700">
                  {savedJobs.length} saved
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : savedJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-auto mt-8 max-w-lg rounded-2xl bg-white card-shadow p-12 text-center border border-gray-100"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Bookmark className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">No saved jobs yet</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              When you find a job you like, click the bookmark icon to save it here for later.
            </p>
            <button
              onClick={() => navigate("/jobs")}
              className="btn-primary mx-auto mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold"
            >
              <Search className="h-4 w-4" />
              Browse Jobs
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {savedJobs.map((job, index) => (
              <motion.div key={job?._id} variants={cardVariants}>
                <Job
                  job={job}
                  isSaved={savedJobIds.has(String(job?._id))}
                  onToggleSaved={handleToggleSaved}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
