/**
 * Short-TTL, user-isolated recommendation cache (PLAN.md Phase 9 §17–20).
 *
 * In-process only — no Redis, no new infra. Bounded size (LRU-ish eviction).
 * The key binds userId + strategy versions + a hash of the profile-shaping
 * inputs, so a stale result can never leak across users or across an
 * incompatible matching/AI/prompt version. Cache failure is never fatal:
 * callers wrap `get`/`set` and simply recompute on any problem.
 */
import crypto from "crypto";

const MAX_ENTRIES = 2000;
const DEFAULT_TTL_MS = clampTtl(Number(process.env.RECO_CACHE_TTL_MS) || 10 * 60 * 1000);

function clampTtl(ms) {
  if (!Number.isFinite(ms)) return 10 * 60 * 1000;
  return Math.max(60 * 1000, Math.min(ms, 60 * 60 * 1000)); // 1 min … 1 hour
}

export const RECO_CACHE_TTL_MS = DEFAULT_TTL_MS;

const store = new Map(); // key -> { value, expiresAt }

/** Deterministic fingerprint of the inputs that shape a user's recommendations. */
export function recoCacheKey(userId, { matchingVersion, aiVersion, promptVersion, profile, extra } = {}) {
  const shaped = {
    roleFamilies: profile?.roleFamilies || [],
    skills: profile?.skills || [],
    seniority: profile?.seniority || "",
    years: profile?.years ?? null,
    locations: profile?.locations || [],
    remotePref: profile?.remotePref || "",
    jobTypePref: profile?.jobTypePref || "",
    industries: profile?.industries || [],
    savedCount: profile?.behaviour?.savedCount ?? 0,
    appliedCount: profile?.behaviour?.appliedCount ?? 0,
    dismissedCount: extra?.dismissedCount ?? 0,
  };
  const h = crypto.createHash("sha1").update(JSON.stringify(shaped)).digest("hex").slice(0, 16);
  return `reco:${userId}:${matchingVersion || "-"}:${aiVersion || "-"}:${promptVersion || "-"}:${h}`;
}

export function cacheGet(key) {
  try {
    const hit = store.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    // refresh recency (LRU)
    store.delete(key);
    store.set(key, hit);
    return hit.value;
  } catch {
    return null;
  }
}

export function cacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  try {
    if (store.size >= MAX_ENTRIES) {
      const oldest = store.keys().next().value;
      if (oldest) store.delete(oldest);
    }
    store.set(key, { value, expiresAt: Date.now() + clampTtl(ttlMs) });
    return true;
  } catch {
    return false;
  }
}

/** Drop every cached page for one user (any version). Call after meaningful activity. */
export function invalidateUser(userId) {
  try {
    const prefix = `reco:${userId}:`;
    for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
  } catch {
    /* non-fatal */
  }
}

export function _cacheClear() {
  store.clear();
}
export function _cacheSize() {
  return store.size;
}
