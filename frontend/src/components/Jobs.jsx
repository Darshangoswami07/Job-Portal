import React from "react";
import Navbar from "./shared/Navbar";
import FilterCard from "./FilterCard";
import Job from "./job";
import { useSelector } from "react-redux";
import useGetAllJobs from "@/hooks/useGetAllJobs";

const jobAarray = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Jobs() {
  useGetAllJobs();
  const {allJobs}=useSelector(store=>store.job);
  return (
    <div>
      <Navbar />

      <div className="max-w-7xl mx-auto mt-5 px-4">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="w-full lg:w-[20%]">
            <FilterCard />
          </div>
          {allJobs.length <= 0 ? (
            <div className="flex-1 min-h-[60vh] flex items-center justify-center">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-slate-700">No Jobs Found</h2>
                <p className="text-slate-500">Try adjusting your search criteria or check back later.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[88vh] overflow-y-auto pb-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {allJobs.map((job) => (
                  <div key={job?._id} ><Job job={job} /></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
