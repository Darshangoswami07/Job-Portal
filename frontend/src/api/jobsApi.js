import axios from "axios";
import { JOB_API_END_POINT } from "@/utils/constant";

/**
 * Centralised job HTTP calls (mirrors api/chatApi.js / api/socialApi.js).
 * Uses the globally-configured axios instance (see utils/axios.js).
 */

export const searchJobs = (params = {}, config = {}) =>
  axios.get(`${JOB_API_END_POINT}/search`, {
    params,
    withCredentials: true,
    ...config,
  });

/**
 * Real, indexed search suggestions (title / company / location / skill).
 * Backed by `GET /job/search/suggestions` — never fabricates a suggestion.
 * Returns `{ success, suggestions: [{ type, value }] }`.
 */
export const getSearchSuggestions = (q = "", config = {}) =>
  axios.get(`${JOB_API_END_POINT}/search/suggestions`, {
    params: { q },
    withCredentials: true,
    ...config,
  });

/** Curated real jobs for the "Top Opportunities" strip. */
export const getFeaturedJobs = (config = {}) =>
  axios.get(`${JOB_API_END_POINT}/featured`, { withCredentials: true, ...config });

export const getTrendingJobs = (config = {}) =>
  axios.get(`${JOB_API_END_POINT}/trending`, { withCredentials: true, ...config });

/** Public, read-only. Real aggregate counts for the marketing homepage. */
export const getCatalogStats = (config = {}) =>
  axios.get(`${JOB_API_END_POINT}/catalog-stats`, { withCredentials: true, ...config });

export const getJobById = (id, config = {}) =>
  axios.get(`${JOB_API_END_POINT}/get/${id}`, { withCredentials: true, ...config });

export const getJobFilterOptions = (config = {}) =>
  axios.get(`${JOB_API_END_POINT}/filters`, { withCredentials: true, ...config });

/**
 * Safe external Apply. The client sends ONLY the job id — the destination URL
 * is loaded and validated server-side. Returns `{ url, sourceName }`.
 */
export const getExternalApplyUrl = (jobId, config = {}) =>
  axios.post(`${JOB_API_END_POINT}/${jobId}/apply-redirect`, {}, { withCredentials: true, ...config });
