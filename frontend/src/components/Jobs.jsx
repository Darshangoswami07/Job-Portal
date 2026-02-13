import React from "react";
import Navbar from "./shared/Navbar";
import FilterCard from "./FilterCard";
import Job from "./job";

const jobAarray = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Jobs() {
  return (
    <div>
      <Navbar />

      <div className="max-w-7xl mx-auto mt-5">
        <div className="flex gap-5">
          <div className="w-[20%]">
            <FilterCard />
          </div>
          {jobAarray.length <= 0 ? (
            <span>No jobs found</span>
          ) : (
            <div className="flex-1 h-[88vh] overflow-y-auto pb-5">
              <div className="grid grid-cols-3 gap-4">
                {jobAarray.map((item, index) => (
                  <div><Job /></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
