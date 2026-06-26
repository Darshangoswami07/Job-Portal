import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/shared/Navbar";
import FilterCard from "@/components/filters/FilterCard";
import Job from "@/components/job/Job";
import { useDispatch, useSelector } from "react-redux";
import { setSearchQuery } from "@/store/slices/jobSlice";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import useSavedJobs from "@/hooks/useSavedJobs";
import { motion } from "framer-motion";

const createEmptyFilters = () => ({
  location: new Set(),
  industry: new Set(),
  salary: new Set(),
  experience: new Set(),
});

const MotionGrid = motion.div;
const MotionCard = motion.div;

export default function Jobs() {
  useGetAllJobs();

  const dispatch = useDispatch();
  const { allJobs = [], searchedQuery = "" } = useSelector(
    (store) => store.job
  );
  const [selectedFilters, setSelectedFilters] = useState(createEmptyFilters);
  const { handleToggleSaved, savedJobIds } = useSavedJobs();

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

  useEffect(() => {
    if (searchedQuery) {
      dispatch(setSearchQuery(""));
    }
  }, [dispatch, searchedQuery]);

  const filteredJobs = useMemo(() => {
    let jobs = [...allJobs];

    if (searchedQuery.trim()) {
      const q = searchedQuery.toLowerCase();
      jobs = jobs.filter((job) =>
        job?.title?.toLowerCase().includes(q) ||
        job?.description?.toLowerCase().includes(q) ||
        job?.location?.toLowerCase().includes(q)
      );
    }

    const activeFilters = Object.entries(selectedFilters).filter(
      ([, values]) => values.size > 0
    );

    if (!activeFilters.length) return jobs;

    return jobs.filter((job) => {
      return activeFilters.every(([category, values]) => {
        if (category === "experience") return true;

        if (category === "salary") {
          const salaryLpa = Number(job?.salary);
          const salary = Number.isFinite(salaryLpa)
            ? salaryLpa * 100000
            : Number(job?.salary);

          return [...values].some((value) => {
            if (value === "0-40k") return salary <= 40000;
            if (value === "42-1lakh") return salary > 40000 && salary <= 100000;
            if (value === "1-5lakh") return salary > 100000 && salary <= 500000;
            if (value === "5lakh+") return salary > 500000;
            return false;
          });
        }

        let jobValue = "";

        if (category === "industry") {
          jobValue = job?.title || "";
        } else if (category === "location") {
          jobValue = job?.location || job?.company?.location || "";
        }

        if (!jobValue) return false;

        return [...values].some((value) =>
          jobValue.toLowerCase().includes(value.toLowerCase())
        );
      });
    });
  }, [allJobs, searchedQuery, selectedFilters]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr] items-start">

          <aside className="sticky top-24">
            <FilterCard
              selectedFilters={selectedFilters}
              onToggle={handleToggleFilter}
              onClearAll={handleClearAll}
              onRemoveChip={(category, value) =>
                handleToggleFilter(category, value, false)
              }
            />
          </aside>

          <main className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.2)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Jobs Found
                  </h1>
                  <p className="max-w-2xl text-sm text-slate-500">
                    Explore the latest job listings with refined filters and a modern dashboard layout.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200">
                  {filteredJobs.length} results
                </span>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-10 text-center shadow-sm">
                <div className="text-5xl mb-4">🔍</div>
                <h2 className="text-lg font-semibold text-slate-800">No jobs found</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Try adjusting filters or search keywords to discover more opportunities.
                </p>
              </div>
            ) : (
              <MotionGrid
                className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.08 },
                  },
                }}
              >
                {filteredJobs.map((job) => (
                  <MotionCard
                    key={job?._id}
                    variants={{
                      hidden: { opacity: 0, y: 24 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    whileHover={{ y: -4 }}
                    className="rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.16)] transition-transform duration-300"
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
          </main>
        </div>
      </div>
    </div>
  );
}
