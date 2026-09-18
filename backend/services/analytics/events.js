/**
 * Product-event recording (PLAN.md Phase 10 §10.2–10.3, §10.16).
 *
 * `recordEvent` is fire-and-forget and NEVER throws into the caller — an
 * analytics failure must not break job search, Apply, Saved Jobs or
 * recommendations. `meta` is aggressively sanitized: only short scalar values
 * survive, and anything that looks secret / PII is dropped.
 */
import { AnalyticsEvent, ANALYTICS_EVENTS } from "../../models_new/AnalyticsEvent.js";

const EVENT_SET = new Set(ANALYTICS_EVENTS);
const SECRET_KEY_RE = /(pass|token|secret|cookie|auth|key|credential|email|phone|resume|jwt|bearer)/i;
const MAX_META_KEYS = 12;
const MAX_STR = 120;

/** Keep only short scalars; drop objects/arrays and anything secret-ish. */
export function sanitizeMeta(meta) {
  const out = {};
  if (!meta || typeof meta !== "object") return out;
  let n = 0;
  for (const [k, v] of Object.entries(meta)) {
    if (n >= MAX_META_KEYS) break;
    if (SECRET_KEY_RE.test(k)) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === "string") {
      out[k] = v.length > MAX_STR ? v.slice(0, MAX_STR) : v;
      n += 1;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
      n += 1;
    } else if (typeof v === "boolean") {
      out[k] = v;
      n += 1;
    }
    // objects / arrays / functions are intentionally ignored
  }
  return out;
}

/**
 * @param {string} type   one of ANALYTICS_EVENTS
 * @param {object} [opts]  { userId, groupKey, meta }
 */
export function recordEvent(type, { userId, groupKey, meta } = {}) {
  if (!EVENT_SET.has(type)) return Promise.resolve(null);
  // Callers do NOT await — analytics is best-effort background work. The promise
  // is returned only so tests can flush it deterministically.
  return AnalyticsEvent.create({
    type,
    userRef: userId || undefined,
    groupKey: typeof groupKey === "string" ? groupKey.slice(0, 60) : "",
    meta: sanitizeMeta(meta),
    at: new Date(),
  }).catch((err) => {
    if (process.env.NODE_ENV !== "test") console.warn(`[analytics] ${type} not recorded: ${err.message}`);
    return null;
  });
}
