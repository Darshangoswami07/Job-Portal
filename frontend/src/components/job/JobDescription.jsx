import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { APPLICATION_API_END_POINT, JOB_API_END_POINT } from "@/utils/constant.js";
import { setSingleJob } from "@/store/slices/jobSlice";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Building2, MapPin, Briefcase, Clock, DollarSign,
  Share2, Bookmark, CheckCircle, ArrowLeft
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className }) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-gray-200", className)}>
      <div className="absolute inset-0 shimmer" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <SkeletonBlock className="h-8 w-64" />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-4/6" />
          <SkeletonBlock className="h-32 w-full" />
        </div>
        <div className="space-y-6">
          <SkeletonBlock className="h-48 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

function daysAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
}

export default function JobDescription() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { singleJob } = useSelector((store) => store.job);
  const { user } = useSelector((store) => store.auth);
  const { allJobs = [] } = useSelector((store) => store.job);

  const isInitiallyApplied = useMemo(
    () =>
      singleJob?.applications?.some(
        (app) => String(app.applicant?._id || app.applicant) === String(user?._id)
      ) || false,
    [singleJob, user]
  );

  const [isApplied, setIsApplied] = useState(isInitiallyApplied);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  const relatedJobs = useMemo(() => {
    if (!singleJob) return [];
    return allJobs
      .filter((j) => j._id !== singleJob._id && j.title === singleJob.title)
      .slice(0, 3);
  }, [allJobs, singleJob]);

  const applyJobHandler = async () => {
    try {
      const res = await axios.get(
        `${APPLICATION_API_END_POINT}/apply/${jobId}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        setIsApplied(true);
        const updatedJob = {
          ...singleJob,
          applications: [...(singleJob?.applications || []), { applicant: user?._id }],
        };
        dispatch(setSingleJob(updatedJob));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!singleJob) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Job not found</h2>
          <p className="text-gray-500 mt-2">This job may have been removed or doesn't exist.</p>
          <Button onClick={() => navigate("/jobs")} className="mt-6 btn-primary rounded-lg">
            Browse Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gray-200 rounded-lg card-shadow p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg overflow-hidden">
                  <CompanyLogo name={singleJob.company?.name} logo={singleJob.company?.logo} className="h-16 w-16 rounded-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {singleJob.title}
                      </h1>
                      <p className="text-base text-gray-500 mt-1 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {singleJob.company?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        className={cn(
                          "p-2 rounded-lg border transition-colors",
                          isBookmarked
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "border-gray-200 text-gray-400 hover:text-gray-600"
                        )}
                      >
                        <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-blue-600")} />
                      </button>
                      <button
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Link copied to clipboard");
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 font-medium">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {singleJob.position} {singleJob.position === 1 ? "position" : "positions"}
                </Badge>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                  <Clock className="h-3 w-3 mr-1" />
                  {singleJob.jobType}
                </Badge>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 font-medium">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {singleJob.salary} LPA
                </Badge>
                <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200 font-medium">
                  <MapPin className="h-3 w-3 mr-1" />
                  {singleJob.location || "Remote"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Posted {daysAgo(singleJob.createdAt)}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{singleJob.applications?.length || 0} applicant{(singleJob.applications?.length || 0) !== 1 ? "s" : ""}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-lg card-shadow p-6 sm:p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                {singleJob.description}
              </div>
            </motion.div>

            {singleJob.requirements?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="bg-white border border-gray-200 rounded-lg card-shadow p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                <ul className="space-y-3">
                  {singleJob.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      {req}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {singleJob.responsibilities?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-lg card-shadow p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Responsibilities</h2>
                <ul className="space-y-3">
                  {singleJob.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                      <CheckCircle className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                      {resp}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-lg card-shadow p-6 sticky top-24"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Apply for this position</h3>
              {singleJob.sourceUrl && singleJob.source && singleJob.source !== "JobHub" ? (
                <a
                  href={singleJob.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full rounded-lg font-semibold text-sm py-3 flex items-center justify-center gap-2"
                >
                  Apply on {singleJob.source}
                </a>
              ) : (
                <Button
                  onClick={isApplied ? undefined : applyJobHandler}
                  disabled={isApplied}
                  className={cn(
                    "w-full rounded-lg font-semibold text-sm py-5",
                    isApplied
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : "btn-primary"
                  )}
                >
                  {isApplied ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Applied
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Apply Now
                    </span>
                  )}
                </Button>
              )}
              {singleJob.sourceUrl && singleJob.source && singleJob.source !== "JobHub" && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  This listing is sourced from {singleJob.source}. You'll apply on their site.
                </p>
              )}

              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Job Details</h3>
                <div className="divide-y divide-gray-100">
                  <div className="flex items-center justify-between py-3">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <DollarSign className="h-4 w-4" />
                      Salary
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{singleJob.salary} LPA</span>
                  </div>
                  {singleJob.experienceLevel && (
                    <div className="flex items-center justify-between py-3">
                      <span className="flex items-center gap-2 text-sm text-gray-500">
                        <Briefcase className="h-4 w-4" />
                        Experience
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{singleJob.experienceLevel}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-3">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      Job Type
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{singleJob.jobType}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      Location
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{singleJob.location || "Remote"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Share this job</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-gray-200 flex-1 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied");
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5 mr-1" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="bg-white border border-gray-200 rounded-lg card-shadow p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden">
                  <CompanyLogo name={singleJob.company?.name} logo={singleJob.company?.logo} className="h-12 w-12 rounded-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{singleJob.company?.name}</h3>
                  <p className="text-xs text-gray-500">{singleJob.company?.industry || "Industry"}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 line-clamp-3">
                {singleJob.company?.description || "No company description available."}
              </p>
            </motion.div>
          </div>
        </div>

        {relatedJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Jobs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedJobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg card-shadow hover:card-shadow-hover transition-all duration-200 p-5 cursor-pointer"
      style={{ transform: "translateY(0px)" }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0px)"}
      onClick={() => navigate(`/description/${job._id}`)}
    >
      <div className="flex items-center gap-3 mb-3">
        <CompanyLogo name={job.company?.name} logo={job.company?.logo} className="h-10 w-10 rounded-md" />
        <div>
          <h3 className="font-medium text-sm text-gray-900">{job.company?.name}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.location || "Remote"}
          </p>
        </div>
      </div>
      <h4 className="font-semibold text-base text-gray-900 mb-2">{job.title}</h4>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs font-medium">
          {job.position} {job.position === 1 ? "position" : "positions"}
        </Badge>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs font-medium">
          {job.jobType}
        </Badge>
        <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs font-medium">
          {job.salary} LPA
        </Badge>
      </div>
    </motion.div>
  );
}
