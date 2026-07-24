import { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, X, Briefcase, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import FilterCard from "@/components/filters/FilterCard";
import Job from "@/components/job/Job";
import JobSkeleton from "@/components/job/JobSkeleton";
import { setSearchQuery } from "@/store/slices/jobSlice";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import useSavedJobs from "@/hooks/useSavedJobs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SALARY_RANGES = [
  { label: "0-3 LPA", min: 0, max: 3 },
  { label: "3-6 LPA", min: 3, max: 6 },
  { label: "6-12 LPA", min: 6, max: 12 },
  { label: "12-20 LPA", min: 12, max: 20 },
  { label: "20+ LPA", min: 20, max: null },
];

const createEmptyFilters = () => ({
  location: new Set(),
  industry: new Set(),
  salary: new Set(),
  experience: new Set(),
});

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

export default function Jobs() {
  useGetAllJobs();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { allJobs = [], searchedQuery = "" } = useSelector((state) => state.job);
  const [selectedFilters, setSelectedFilters] = useState(createEmptyFilters);
  const { handleToggleSaved, savedJobIds } = useSavedJobs();
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const JOBS_PER_PAGE = 12;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchedQuery) {
      dispatch(setSearchQuery(""));
    }
  }, [dispatch, searchedQuery]);

  const handleToggleFilter = useCallback((category, value, isChecked) => {
    setSelectedFilters((prev) => {
      const newSet = new Set(prev[category]);
      isChecked ? newSet.add(value) : newSet.delete(value);
      return { ...prev, [category]: newSet };
    });
    setCurrentPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedFilters(createEmptyFilters());
    setCurrentPage(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setSearchQuery(searchInput.trim()));
    navigate(`/browse?query=${encodeURIComponent(searchInput.trim())}`);
  };

  const filteredJobs = useMemo(() => {
    let jobs = [...allJobs];

    if (searchedQuery.trim()) {
      const q = searchedQuery.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job?.title?.toLowerCase().includes(q) ||
          job?.description?.toLowerCase().includes(q) ||
          job?.location?.toLowerCase().includes(q)
      );
    }

    const activeFilters = Object.entries(selectedFilters).filter(
      ([, values]) => values.size > 0
    );

    if (!activeFilters.length) return jobs;

    return jobs.filter((job) =>
      activeFilters.every(([category, values]) => {
        if (category === "experience") {
          const exp = Number(job?.experienceLevel) || 0;
          return [...values].some((value) => {
            if (value.includes("Entry")) return exp <= 1;
            if (value.includes("Mid")) return exp >= 2 && exp <= 4;
            if (value.includes("Senior")) return exp >= 5 && exp <= 8;
            if (value.includes("Lead")) return exp >= 8;
            return false;
          });
        }

        if (category === "salary") {
          const salaryLpa = Number(job?.salary);
          return [...values].some((value) => {
            const range = SALARY_RANGES.find((r) => r.label === value);
            if (!range) return false;
            if (range.max === null) return salaryLpa >= range.min;
            return salaryLpa >= range.min && salaryLpa < range.max;
          });
        }

        let jobValue = "";
        if (category === "industry") jobValue = job?.title || "";
        else if (category === "location") jobValue = job?.location || job?.company?.location || "";

        if (!jobValue) return false;
        return [...values].some((value) =>
          jobValue.toLowerCase().includes(value.toLowerCase())
        );
      })
    );
  }, [allJobs, searchedQuery, selectedFilters]);

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice(0, currentPage * JOBS_PER_PAGE);

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
                  placeholder="Search jobs by title, skill, or location..."
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-12 px-4 rounded-xl border-gray-300 lg:hidden",
                  showFilters && "bg-blue-50 border-blue-300 text-blue-600"
                )}
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </form>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-[320px_1fr] items-start">
            {showFilters && (
              <aside
                className={cn(
                  "lg:sticky lg:top-24",
                  "max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:bg-gray-900/50 max-lg:p-4 max-lg:overflow-y-auto"
                )}
              >
                <div className="lg:hidden flex justify-end mb-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(false)}
                    className="rounded-full bg-white text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <FilterCard
                  selectedFilters={selectedFilters}
                  onToggle={handleToggleFilter}
                  onClearAll={handleClearAll}
                  onRemoveChip={(category, value) =>
                    handleToggleFilter(category, value, false)
                  }
                />
              </aside>
            )}

            <main className="space-y-8 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="bg-white border border-gray-100 rounded-2xl card-shadow p-5 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {searchedQuery ? `Results for "${searchedQuery}"` : "Find Your Dream Job"}
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                  <h2 className="text-xl font-bold text-gray-800 mb-2">No jobs found</h2>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    We couldn't find any jobs matching your criteria. Try adjusting your filters or search terms.
                  </p>
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    className="rounded-xl border-gray-300"
                  >
                    Clear all filters
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {paginatedJobs.map((job, index) => (
                      <motion.div
                        key={job._id}
                        variants={cardVariants}
                      >
                        <Job
                          job={job}
                          isSaved={savedJobIds.has(String(job._id))}
                          onToggleSaved={handleToggleSaved}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {totalPages > 1 && paginatedJobs.length < filteredJobs.length && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center pt-4"
                    >
                      <Button
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="btn-primary rounded-xl px-8 py-5 font-semibold"
                      >
                        Load More ({filteredJobs.length - paginatedJobs.length} remaining)
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
