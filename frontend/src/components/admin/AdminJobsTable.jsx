import React from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import JobCard from "@/components/recruiter/JobCard";
import EmptyState from "@/components/recruiter/EmptyState";
import { SkeletonJobCard } from "@/components/recruiter/Skeleton";

export default function AdminJobsTable({ onDataChange }) {
  const { allAdminJobs = [], searchJobByText = "" } = useSelector((store) => store.job || {});
  const navigate = useNavigate();

  const filteredJobs = React.useMemo(() => {
    const text = searchJobByText.toLowerCase();
    return allAdminJobs.filter((job) => {
      if (!text) return true;
      return (
        job.company?.name?.toLowerCase().includes(text) ||
        job.title?.toLowerCase().includes(text) ||
        job.location?.toLowerCase().includes(text)
      );
    });
  }, [allAdminJobs, searchJobByText]);

  const loading = allAdminJobs.length === 0 && !searchJobByText;

  return (
    <div>
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonJobCard key={i} />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <EmptyState
            variant="job"
            title={searchJobByText ? "No jobs match your search" : "No Jobs Yet"}
            description={
              searchJobByText
                ? "Try adjusting your search filters to find what you're looking for."
                : "Create your first job posting to start receiving applicants."
            }
            action={
              <Button
                onClick={() => navigate("/admin/jobs/create")}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-blue-700"
              >
                Create Your First Job
              </Button>
            }
          />
        </motion.div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job, i) => (
            <JobCard key={job._id} job={job} index={i} onDataChange={onDataChange} />
          ))}
        </div>
      )}
    </div>
  );
}
