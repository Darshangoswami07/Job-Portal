import axios from "axios";
import { BACKEND_URL } from "@/utils/constant";

/**
 * Admin Job Sources API (Phase 5). Uses the globally-configured axios instance.
 * Every call requires an authenticated admin — the backend enforces it.
 */
const BASE = `${BACKEND_URL}/api/v1/admin/job-sources`;
const cfg = (extra = {}) => ({ withCredentials: true, ...extra });

export const listJobSources = (extra) => axios.get(BASE, cfg(extra));
export const getAdapterCatalog = (extra) => axios.get(`${BASE}/adapters`, cfg(extra));
// Phase 12–17: source capability matrix + operational coverage
export const getSourceCapabilities = (extra) => axios.get(`${BASE}/capabilities`, cfg(extra));
export const getSourceCoverage = (extra) => axios.get(`${BASE}/coverage`, cfg(extra));
export const getJobSource = (id, extra) => axios.get(`${BASE}/${id}`, cfg(extra));
export const createJobSource = (body, extra) => axios.post(BASE, body, cfg(extra));
export const updateJobSource = (id, body, extra) => axios.patch(`${BASE}/${id}`, body, cfg(extra));
export const syncJobSource = (id, extra) => axios.post(`${BASE}/${id}/sync`, {}, cfg(extra));
// Phase 18: bounded connectivity + parser probe (no ingestion)
export const testJobSource = (id, extra) => axios.post(`${BASE}/${id}/test`, {}, cfg(extra));
export const getSourceConfigCheck = (extra) => axios.get(`${BASE}/config-check`, cfg(extra));
export const verifyJobSourceLinks = (id, body, extra) =>
  axios.post(`${BASE}/${id}/verify-links`, body || {}, cfg(extra));
export const getJobSourceSyncRuns = (id, params, extra) =>
  axios.get(`${BASE}/${id}/sync-runs`, cfg({ params, ...extra }));
export const getJobSourceHealth = (id, extra) => axios.get(`${BASE}/${id}/health`, cfg(extra));

const AUDIT_BASE = `${BACKEND_URL}/api/v1/admin/audit`;
export const getAuditLog = (params, extra) => axios.get(AUDIT_BASE, cfg({ params, ...extra }));

// ── Phase 7: admin JobGroup inspection + split ───────────────────────────
const GROUP_BASE = `${BACKEND_URL}/api/v1/admin/job-groups`;
export const listJobGroups = (params, extra) => axios.get(GROUP_BASE, cfg({ params, ...extra }));
export const getJobGroup = (id, extra) => axios.get(`${GROUP_BASE}/${id}`, cfg(extra));
export const splitJobGroup = (id, body, extra) =>
  axios.post(`${GROUP_BASE}/${id}/split`, body, cfg(extra));

// ── Phase 10: admin analytics dashboard ─────────────────────────────────
const ANALYTICS_BASE = `${BACKEND_URL}/api/v1/admin/analytics`;
export const getAdminAnalytics = (params, extra) => axios.get(ANALYTICS_BASE, cfg({ params, ...extra }));
export const runAiQualityCheck = (extra) => axios.post(`${ANALYTICS_BASE}/ai-quality/check`, {}, cfg(extra));
export const clearAiQualityGuard = (extra) => axios.post(`${ANALYTICS_BASE}/ai-quality/clear`, {}, cfg(extra));
