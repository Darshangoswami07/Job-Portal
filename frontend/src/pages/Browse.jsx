import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Search, X, Briefcase, ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import Job from "@/components/job/Job";
import JobSkeleton from "@/components/job/JobSkeleton";
import { setSearchQuery } from "@/store/slices/jobSlice";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import useSavedJobs from "@/hooks/useSavedJobs";
import { Button } from "@/components/ui/button";

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

export default function Browse() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryFromUrl = searchParams.get("query") || "";

  useGetAllJobs();
  const { allJobs = [] } = useSelector((store) => store.job);
  const { handleToggleSaved, savedJobIds } = useSavedJobs();
  const [searchInput, setSearchInput] = useState(queryFromUrl);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (queryFromUrl) {
      dispatch(setSearchQuery(queryFromUrl));
      setSearchInput(queryFromUrl);
    }
    return () => {
      dispatch(setSearchQuery(""));
    };
  }, [dispatch, queryFromUrl]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [allJobs]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      dispatch(setSearchQuery(searchInput.trim()));
      navigate(`/browse?query=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!queryFromUrl) return allJobs;
    const q = queryFromUrl.toLowerCase();
    return allJobs.filter(
      (job) =>
        job?.title?.toLowerCase().includes(q) ||
        job?.description?.toLowerCase().includes(q) ||
        job?.location?.toLowerCase().includes(q) ||
        job?.company?.name?.toLowerCase().includes(q)
    );
  }, [allJobs, queryFromUrl]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#F3F2EF]"
    >
      <Navbar />

      <div className="relative bg-gradient-to-br from-[#0A66C2]/5 via-white to-[#0A66C2]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-gray-100 rounded-2xl card-shadow p-4 sm:p-6 mb-8"
          >
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search jobs, skills, companies..."
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                className="h-12 px-6 rounded-xl btn-primary font-semibold"
              >
                Search
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="bg-white border border-gray-100 rounded-2xl card-shadow p-5 sm:p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {queryFromUrl ? (
                    <>
                      Search results for "<span className="text-blue-600">{queryFromUrl}</span>"
                    </>
                  ) : (
                    "Browse All Jobs"
                  )}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 shrink-0 border border-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                {filteredJobs.length} results
              </span>
            </div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <JobSkeleton key={i} />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-100 rounded-2xl card-shadow p-12 text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Briefcase className="h-10 w-10 text-gray-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">No results found</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                We couldn't find any jobs matching "{queryFromUrl}". Try different keywords.
              </p>
              <Button
                onClick={() => navigate("/jobs")}
                variant="outline"
                className="rounded-xl border-gray-300"
              >
                Browse all jobs
              </Button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredJobs.map((job, index) => (
                <motion.div key={job._id} variants={cardVariants}>
                  <Job
                    job={job}
                    isSaved={savedJobIds.has(String(job._id))}
                    onToggleSaved={handleToggleSaved}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
