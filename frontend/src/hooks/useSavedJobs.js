import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SAVED_JOB_API_END_POINT } from "@/utils/constant";

export default function useSavedJobs() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(false);

  const loadSavedJobs = useCallback(async () => {
    const userKey = user?._id || user?.id || null;

    if (!userKey) {
      setSavedJobIds(new Set());
      return;
    }

    try {
      setLoadingSavedJobs(true);
      const res = await axios.get(`${SAVED_JOB_API_END_POINT}/me`);
      const saved = res.data.savedJobs || [];
      const ids = saved
        .map((item) => item.jobId?._id || item.jobId || item.job?._id || item._id)
        .filter(Boolean)
        .map((id) => String(id));

      setSavedJobIds(new Set(ids));
    } catch (error) {
      if (error.response?.status === 401) {
        setSavedJobIds(new Set());
        return;
      }

      console.error("Error fetching saved jobs:", error);
      setSavedJobIds(new Set());
    } finally {
      setLoadingSavedJobs(false);
    }
  }, [user]);

  useEffect(() => {
    loadSavedJobs();
  }, [loadSavedJobs]);

  const handleToggleSaved = useCallback(
    async (jobId, currentlySaved) => {
      if (!user) {
        toast.error("Please login to save jobs");
        navigate("/login");
        return;
      }

      if (!jobId) {
        toast.error("Job id is missing");
        return;
      }

      const normalizedJobId = String(jobId);

      setSavedJobIds((prev) => {
        const next = new Set(prev);
        currentlySaved ? next.delete(normalizedJobId) : next.add(normalizedJobId);
        return next;
      });

      try {
        if (currentlySaved) {
          await axios.delete(`${SAVED_JOB_API_END_POINT}/${normalizedJobId}`);
          toast.success("Job removed from saved jobs");
        } else {
          await axios.post(`${SAVED_JOB_API_END_POINT}/post`, {
            jobId: normalizedJobId,
          });
          toast.success("Job saved successfully");
        }
      } catch (error) {
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          currentlySaved ? next.add(normalizedJobId) : next.delete(normalizedJobId);
          return next;
        });

        if (error.response?.status === 401) {
          toast.error("Please login to save jobs");
          navigate("/login");
          return;
        }

        console.error("Saved job request failed:", error);
        toast.error(error.response?.data?.message || "Unable to update saved job");
      }
    },
    [navigate, user]
  );

  return {
    handleToggleSaved,
    loadingSavedJobs,
    loadSavedJobs,
    savedJobIds,
  };
}
