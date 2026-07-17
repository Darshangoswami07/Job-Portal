import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, X, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import FilterCard from "@/components/filters/FilterCard";
import Job from "@/components/job/Job";
import JobSkeleton from "@/components/job/JobSkeleton";
import { setSearchQuery } from "@/store/slices/jobSlice";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import useSavedJobs from "@/hooks/useSavedJobs";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const createEmptyFilters = () => ({
  location: new Set(),
  industry: new Set(),
  salary: new Set(),
  experience: new Set(),
});

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35 },
  }),
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
  const [sectionRef, isSectionVisible] = useScrollAnimation({ threshold: 0.05 });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchedQuery) {
      dispatch(setSearchQuery(""));
    }
  }, [dispatch, searchedQuery]);

  const handleToggleFilter = (category, value, isChecked) => {
    setSelectedFilters((prev) => {
      const newSet = new Set(prev[category]);
      isChecked ? newSet.add(value) : newSet.delete(value);
      return { ...prev, [category]: newSet };
    });
  };

  const handleClearAll = () => {
    setSelectedFilters(createEmptyFilters());
  };

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
        if (category === "experience") return true;

        if (category === "salary") {
          const salaryLpa = Number(job?.salary);
          const salary = Number.isFinite(salaryLpa) ? salaryLpa * 100000 : Number(job?.salary);
          return [...values].some((value) => {
            if (value === "0-40k") return salary <= 40000;
            if (value === "42-1lakh") return salary > 40000 && salary <= 100000;
            if (value === "1-5lakh") return salary > 100000 && salary <= 500000;
            if (value === "5lakh+") return salary > 500000;
            return false;
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
      className="min-h-screen bg-gray-50"
    >
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-lg card-shadow p-4 sm:p-6 mb-8">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search jobs by title, skill, or location..."
                className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
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
              className="h-12 px-6 rounded-lg btn-primary font-semibold"
            >
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-12 px-4 rounded-lg border-gray-300 lg:hidden",
                showFilters && "bg-blue-50 border-blue-300 text-blue-600"
              )}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </form>
        </div>

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
            <div className="bg-white border border-gray-200 rounded-lg card-shadow p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {searchedQuery ? `Results for "${searchedQuery}"` : "All Jobs"}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700 shrink-0">
                  {filteredJobs.length} results
                </span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <JobSkeleton key={i} />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg card-shadow p-12 text-center">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center">
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
                  className="rounded-lg border-gray-300"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedJobs.map((job, index) => (
                    <motion.div
                      key={job._id}
                      variants={cardVariants}
                      initial="hidden"
                      animate={isSectionVisible ? "visible" : "hidden"}
                      custom={index}
                    >
                      <Job
                        job={job}
                        isSaved={savedJobIds.has(String(job._id))}
                        onToggleSaved={handleToggleSaved}
                      />
                    </motion.div>
                  ))}
                </div>

                {totalPages > 1 && paginatedJobs.length < filteredJobs.length && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="btn-primary rounded-lg px-8 py-5 font-semibold"
                    >
                      Load More ({filteredJobs.length - paginatedJobs.length} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </motion.div>
  );
}
