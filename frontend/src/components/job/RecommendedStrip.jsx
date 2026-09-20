import { Link } from "react-router-dom";
import { Sparkles, UserCog } from "lucide-react";
import JobScrollRow from "@/components/job/JobScrollRow";
import useRecommendations from "@/hooks/useRecommendations";
import { MISSING_PROFILE_LABELS } from "@/utils/jobFilters";

/**
 * "Recommended for You" strip — only rendered for a logged-in user. Uses the
 * real recommendations API; shows a match badge only when the backend returns
 * one, and prompts to complete the profile when there is no signal yet.
 */
export default function RecommendedStrip({ user, savedJobIds, onToggleSaved, onOpenPreview }) {
  const { jobs, meta, loading, error } = useRecommendations({ limit: 6, enabled: Boolean(user) });

  if (!user) return null;
  if (error) return null;
  if (!loading && jobs.length === 0) return null;

  const personalized = meta?.personalized;
  const missing = Array.isArray(meta?.missing) ? meta.missing : [];

  return (
    <JobScrollRow
      title="Recommended for You"
      icon={Sparkles}
      subtitle={
        personalized
          ? "Based on your skills, experience and preferences."
          : "Recommended based on your profile — add more detail to sharpen these."
      }
      action={{ to: "/recommended-jobs", label: "See all" }}
      jobs={jobs}
      loading={loading}
      savedJobIds={savedJobIds}
      onToggleSaved={onToggleSaved}
      onOpenPreview={onOpenPreview}
      headerExtra={
        !loading && personalized === false ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {missing.slice(0, 3).map((m) => (
              <span key={m} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                {MISSING_PROFILE_LABELS[m] || m}
              </span>
            ))}
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/15"
            >
              <UserCog className="h-3 w-3" /> Complete profile
            </Link>
          </div>
        ) : null
      }
    />
  );
}
