import axios from "axios";
import { BACKEND_URL } from "@/utils/constant";

/**
 * Phase 8 — personalized job recommendations. Authenticated; the backend uses
 * the current logged-in user's profile + saved jobs + application history.
 */
const BASE = `${BACKEND_URL}/api/v1/recommendations`;

export const getRecommendations = (params = {}, config = {}) =>
  axios.get(`${BASE}/jobs`, { params, withCredentials: true, ...config });

export const getJobMatch = (groupId, config = {}) =>
  axios.get(`${BASE}/jobs/${groupId}`, { withCredentials: true, ...config });

export const dismissJob = (groupId, body = {}, config = {}) =>
  axios.post(`${BASE}/jobs/${groupId}/dismiss`, body, { withCredentials: true, ...config });

export const undismissJob = (groupId, config = {}) =>
  axios.delete(`${BASE}/jobs/${groupId}/dismiss`, { withCredentials: true, ...config });

/** Fire-and-forget analytics beacon. Never throws into the caller. */
export const recordRecoEvent = (type, groupId, meta = {}) => {
  try {
    axios
      .post(`${BACKEND_URL}/api/v1/analytics/events`, { type, groupId, meta }, { withCredentials: true })
      .catch(() => {});
  } catch {
    /* noop */
  }
};
