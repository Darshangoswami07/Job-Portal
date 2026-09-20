import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { getRecommendations } from "@/api/recommendationsApi";

const isAbort = (err) =>
  axios.isCancel?.(err) || err?.name === "CanceledError" || err?.code === "ERR_CANCELED";

const EMPTY = { page: 1, limit: 12, total: 0, totalPages: 0 };

/**
 * Server-driven personalized recommendations. No client-side ranking — the
 * backend returns ranked JobGroups with match metadata. Safe when the user has
 * no profile signal: the backend sends a general fallback list.
 */
export default function useRecommendations({ limit = 12, enabled = true } = {}) {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({
    jobs: [],
    pagination: EMPTY,
    meta: {},
    loading: enabled,
    error: null,
  });
  const abortRef = useRef(null);

  const run = useCallback(
    async (pageToLoad) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await getRecommendations(
          { page: pageToLoad, limit },
          { signal: controller.signal }
        );
        const d = res.data || {};
        setState((s) => ({
          jobs: pageToLoad > 1 ? [...s.jobs, ...(d.jobs || [])] : d.jobs || [],
          pagination: d.pagination || EMPTY,
          meta: d.meta || {},
          loading: false,
          error: null,
        }));
      } catch (err) {
        if (isAbort(err)) return;
        setState((s) => ({ ...s, loading: false, error: err.response?.data?.message || "Failed to load recommendations" }));
      }
    },
    [limit]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    run(page);
    return () => abortRef.current?.abort();
  }, [enabled, run, page]);

  const hasMore = state.pagination.page < state.pagination.totalPages;

  return {
    ...state,
    page,
    hasMore,
    loadMore: useCallback(() => setPage((p) => p + 1), []),
    refetch: () => run(1),
  };
}
