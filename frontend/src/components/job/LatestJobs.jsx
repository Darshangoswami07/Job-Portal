import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { searchJobs } from "@/api/jobsApi"
import LatestJobCard from "./LatestJobCards"

export default function LatestJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let alive = true
    // Real server-side grouped catalogue — the same source Find Jobs uses.
    // No client-side "load the whole catalogue" preload.
    searchJobs({ sort: "newest", limit: 6 })
      .then((res) => {
        if (!alive || !res.data?.success) return
        setJobs(res.data.jobs || [])
        setTotal(res.data.pagination?.total || 0)
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Latest Job Openings</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            Fresh opportunities, kept up to date by continuous source syncs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
            ))
          ) : jobs.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Available</h3>
              <p className="text-gray-500">Check back later for new job opportunities.</p>
            </div>
          ) : (
            jobs.map((job) => <LatestJobCard key={job._id} job={job} />)
          )}
        </div>

        {!loading && total > jobs.length && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => navigate("/jobs?sort=newest")}
              className="btn-secondary inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm"
            >
              View all {total.toLocaleString()} jobs
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
