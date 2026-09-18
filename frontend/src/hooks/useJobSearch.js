import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useDebounce } from "./useDebounce";
import { searchJobs } from "@/api/jobsApi";

export const JOBS_PAGE_SIZE = 12;

const EMPTY_PAGINATION = { page: 1, limit: JOBS_PAGE_SIZE, total: 0, totalPages: 0 };

const isAbort = (err) =>
  axios.isCancel?.(err) || err?.name === "CanceledError" || err?.code === "ERR_CANCELED";

function cleanParams(obj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      out[k] = v.join(",");
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Server-driven job search. The caller fully owns the query / sort / filter UI
 * state (controlled inputs); this hook debounces the keyword, paginates and
 * fetches. There is NO client-side filtering or sorting.
 *
 * @param {{ query?: string, filters?: object, sort?: string }} opts
 */
export default function useJobSearch({ query = "", filters = {}, sort = "relevance" } = {}) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({
    jobs: [],
    pagination: EMPTY_PAGINATION,
    meta: {},
    loading: true,
    error: null,
  });

  const debouncedQuery = useDebounce(query, 400);
  const filterKey = useMemo(() => JSON.stringify(cleanParams(filters)), [filters]);
  const abortRef = useRef(null);

  // Reset to the first page whenever the query, filters or sort change.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filterKey, sort]);

  const runSearch = useCallback(
    async (pageToLoad) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setResult((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const params = cleanParams({
          q: String(debouncedQuery || "").trim(),
          page: pageToLoad,
          limit: JOBS_PAGE_SIZE,
          sort,
          ...filters,
        });
        const res = await searchJobs(params, { signal: controller.signal });
        const data = res.data || {};
        setResult((prev) => ({
          jobs: pageToLoad > 1 ? [...prev.jobs, ...(data.jobs || [])] : data.jobs || [],
          pagination: data.pagination || EMPTY_PAGINATION,
          meta: data.meta || {},
          loading: false,
          error: null,
        }));
      } catch (err) {
        if (isAbort(err)) return;
        setResult((prev) => ({
          ...prev,
          loading: false,
          error: err.response?.data?.message || "Failed to load jobs",
        }));
      }
    },
    // filterKey stands in for `filters` to avoid identity churn
    [debouncedQuery, sort, filterKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    runSearch(page);
    return () => abortRef.current?.abort();
  }, [runSearch, page]);

  const hasMore = result.pagination.page < result.pagination.totalPages;
  const loadMore = useCallback(() => setPage((p) => p + 1), []);

  return {
    jobs: result.jobs,
    pagination: result.pagination,
    meta: result.meta,
    loading: result.loading,
    error: result.error,
    page,
    hasMore,
    loadMore,
    refetch: () => runSearch(1),
  };
}
