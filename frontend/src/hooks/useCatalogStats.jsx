import { useEffect, useState } from "react";

import { getCatalogStats } from "@/api/jobsApi";

/**
 * Real, database-backed catalogue numbers for the public homepage.
 * No fabricated fallback — while loading, `stats` is null and callers should
 * render a placeholder, never a fake number.
 */
export default function useCatalogStats() {
  const [state, setState] = useState({
    stats: null,
    sourceNames: [],
    topCategories: [],
    topCompanies: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    getCatalogStats()
      .then((res) => {
        if (!alive) return;
        const d = res.data || {};
        setState({
          stats: d.stats || null,
          sourceNames: d.sourceNames || [],
          topCategories: d.topCategories || [],
          topCompanies: d.topCompanies || [],
          loading: false,
          error: d.success ? null : "unavailable",
        });
      })
      .catch(() => {
        if (alive) setState((s) => ({ ...s, loading: false, error: "unavailable" }));
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
