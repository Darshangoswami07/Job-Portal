import { useSelector } from "react-redux"
import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

import useGetAllJobs from "@/hooks/useGetAllJobs"
import LatestJobCard from "./LatestJobCards"

export default function LatestJobs() {
  useGetAllJobs()
  const { allJobs } = useSelector((store) => store.job)
  const navigate = useNavigate()

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Latest Job Openings</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            Fresh opportunities from top companies updated daily
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allJobs.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Jobs Available
              </h3>
              <p className="text-gray-500">
                Check back later for new job opportunities.
              </p>
            </div>
          ) : (
            allJobs
              ?.slice(0, 6)
              .map((job) => (
                <LatestJobCard key={job._id} job={job} />
              ))
          )}
        </div>

        {allJobs.length > 6 && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => navigate("/browse")}
              className="btn-secondary inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm"
            >
              View All Jobs
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
