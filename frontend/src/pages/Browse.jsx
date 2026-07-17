import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Search, X, Briefcase, ArrowLeft } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Job from "@/components/job/Job";
import JobSkeleton from "@/components/job/JobSkeleton";
import { setSearchQuery } from "@/store/slices/jobSlice";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import useSavedJobs from "@/hooks/useSavedJobs";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="bg-white border border-gray-200 rounded-lg card-shadow p-4 sm:p-6">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search jobs..."
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
            </form>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg card-shadow p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {queryFromUrl ? (
                  <>
                    Search results for "<span className="text-blue-600">{queryFromUrl}</span>"
                  </>
                ) : (
                  "Browse Jobs"
                )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <h2 className="text-xl font-bold text-gray-800 mb-2">No results found</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              We couldn't find any jobs matching "{queryFromUrl}". Try different keywords.
            </p>
            <Button
              onClick={() => navigate("/jobs")}
              variant="outline"
              className="rounded-lg border-gray-300"
            >
              Browse all jobs
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Job
                key={job._id}
                job={job}
                isSaved={savedJobIds.has(String(job._id))}
                onToggleSaved={handleToggleSaved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
