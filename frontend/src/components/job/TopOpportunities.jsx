import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import JobScrollRow from "@/components/job/JobScrollRow";
import { getFeaturedJobs, getTrendingJobs } from "@/api/jobsApi";

const WORK_TYPE_TO_REMOTE = { Remote: "remote", Hybrid: "hybrid", "On-site": "onsite", Onsite: "onsite" };

/** Shape a raw populated Job document into the card DTO the grid expects. */
function normalize(doc) {
  return {
    _id: doc._id,
    title: doc.title,
    company: { name: doc.company?.name || "", logo: doc.company?.logo || "", domain: doc.company?.domain || "" },
    companyName: doc.company?.name || "",
    location: doc.location || doc.company?.location || "",
    remoteType: WORK_TYPE_TO_REMOTE[doc.workType] || "",
    jobType: doc.jobType || "",
    seniority: doc.seniority || "",
    salaryMin: doc.salaryMin ?? (doc.salary || undefined),
    salaryMax: doc.salaryMax,
    salaryCurrency: doc.salaryCurrency || "INR",
    description: doc.description || "",
    skills: doc.skills || [],
    postedAt: doc.publishedAt || doc.createdAt,
    sourceName: doc.sourceName || doc.source || "",
    applyType: doc.applyType || "internal",
  };
}

/**
 * "Top Opportunities" — real curated jobs (featured, then trending as a
 * fallback). Renders nothing when neither returns data.
 */
export default function TopOpportunities({ savedJobIds, onToggleSaved, onOpenPreview }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let res = await getFeaturedJobs();
        let list = res.data?.jobs || [];
        if (!list.length) {
          res = await getTrendingJobs();
          list = res.data?.jobs || [];
        }
        if (!cancelled) setJobs(list.slice(0, 10).map(normalize));
      } catch {
        if (!cancelled) setJobs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <JobScrollRow
      title="Top Opportunities"
      icon={Flame}
      subtitle="Standout roles from reputable companies."
      jobs={jobs}
      loading={loading}
      savedJobIds={savedJobIds}
      onToggleSaved={onToggleSaved}
      onOpenPreview={onOpenPreview}
    />
  );
}
