import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Job from "@/components/job/Job";
import { SAVED_JOB_API_END_POINT } from "@/utils/constant";
import { useSelector } from "react-redux";

const MotionGrid = motion.div;
const MotionCard = motion.div;

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
      const res = await axios.get(url, {
        withCredentials: true,
      });
      if (!res.data?.success) {
        setSavedJobs([]);
        setSavedJobIds(new Set());
        return;
      }
      const saved = res.data.savedJobs || res.data?.data || [];
      const jobs = saved
        .map((item) => item.jobId || item.job || item)
        .filter(Boolean);
      setSavedJobs(jobs);
      setSavedJobIds(
        new Set(
          jobs
            .map((job) => job?._id || job?.id)
            .filter(Boolean)
            .map((id) => String(id))
        )
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
    <div className="bg-slate-50 min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Saved Jobs</h1>
            <p className="text-sm text-slate-500">
              Your saved jobs are listed below.
            </p>
          </div>
          <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
            {savedJobs.length} results
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading saved jobs…</div>
        ) : savedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">💾</div>
            <h2 className="text-lg font-semibold text-slate-700">No saved jobs</h2>
            <p className="text-sm text-slate-500 mt-1">
              Save jobs from the main listing and come back later.
            </p>
          </div>
        ) : (
          <MotionGrid
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {savedJobs.map((job) => (
              <MotionCard
                key={job?._id}
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
              >
                <Job
                  job={job}
                  isSaved={savedJobIds.has(String(job?._id))}
                  onToggleSaved={handleToggleSaved}
                />
              </MotionCard>
            ))}
          </MotionGrid>
        )}
      </div>
    </div>
  );
}
