import { TrendingUp } from "lucide-react";
import { TRENDING_SEARCHES } from "@/utils/jobFilters";

/** Static, navigational trending search terms — each runs a real search. */
export default function TrendingSearches({ onSearch }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <TrendingUp className="h-4 w-4 text-primary" />
        Trending Searches
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {TRENDING_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onSearch(term)}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {term}
          </button>
        ))}
      </div>
    </section>
  );
}
