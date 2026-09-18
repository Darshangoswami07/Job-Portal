import { describe, it, expect, beforeEach, vi } from "vitest";
import { recoCacheKey, cacheGet, cacheSet, invalidateUser, _cacheClear, _cacheSize, RECO_CACHE_TTL_MS } from "../recoCache.js";
import { recoMetrics } from "../recoMetrics.js";

const profileA = { roleFamilies: ["backend"], skills: ["node.js", "mongodb"], seniority: "senior", years: 5, locations: ["bengaluru"], remotePref: "remote", jobTypePref: "Full-time", industries: ["technology"], behaviour: { savedCount: 2, appliedCount: 1 } };
const profileB = { ...profileA, roleFamilies: ["frontend"], skills: ["react"] };

beforeEach(() => _cacheClear());

describe("recoCacheKey", () => {
  it("is stable for the same shaped inputs and different per user / version / profile", () => {
    const base = { matchingVersion: "m1", aiVersion: "ai1", promptVersion: "p1", profile: profileA, extra: { dismissedCount: 0 } };
    expect(recoCacheKey("u1", base)).toBe(recoCacheKey("u1", base));
    expect(recoCacheKey("u1", base)).not.toBe(recoCacheKey("u2", base));
    expect(recoCacheKey("u1", base)).not.toBe(recoCacheKey("u1", { ...base, matchingVersion: "m2" }));
    expect(recoCacheKey("u1", base)).not.toBe(recoCacheKey("u1", { ...base, aiVersion: "ai2" }));
    expect(recoCacheKey("u1", base)).not.toBe(recoCacheKey("u1", { ...base, promptVersion: "p2" }));
    expect(recoCacheKey("u1", base)).not.toBe(recoCacheKey("u1", { ...base, profile: profileB }));
    expect(recoCacheKey("u1", base)).not.toBe(recoCacheKey("u1", { ...base, extra: { dismissedCount: 1 } }));
  });
});

describe("get / set / expiry", () => {
  it("stores and returns a value; miss returns null", () => {
    expect(cacheGet("k")).toBeNull();
    cacheSet("k", { hi: 1 });
    expect(cacheGet("k")).toEqual({ hi: 1 });
  });

  it("expires after the TTL", () => {
    vi.useFakeTimers();
    cacheSet("k", { v: 1 }, 60_000);
    expect(cacheGet("k")).toEqual({ v: 1 });
    vi.advanceTimersByTime(61_000);
    expect(cacheGet("k")).toBeNull();
    vi.useRealTimers();
  });

  it("clamps a silly TTL into [1min, 1h]", () => {
    expect(RECO_CACHE_TTL_MS).toBeGreaterThanOrEqual(60_000);
    expect(RECO_CACHE_TTL_MS).toBeLessThanOrEqual(60 * 60 * 1000);
  });
});

describe("user isolation + invalidation", () => {
  it("invalidateUser drops only that user's entries", () => {
    cacheSet("reco:u1:m1:ai1:p1:aaaa", { u: 1 });
    cacheSet("reco:u1:m1:ai1:p1:bbbb", { u: 1 });
    cacheSet("reco:u2:m1:ai1:p1:cccc", { u: 2 });
    invalidateUser("u1");
    expect(cacheGet("reco:u1:m1:ai1:p1:aaaa")).toBeNull();
    expect(cacheGet("reco:u1:m1:ai1:p1:bbbb")).toBeNull();
    expect(cacheGet("reco:u2:m1:ai1:p1:cccc")).toEqual({ u: 2 });
  });
});

describe("failure safety", () => {
  it("cacheGet never throws on a bad key", () => {
    expect(() => cacheGet(undefined)).not.toThrow();
    expect(cacheGet(undefined)).toBeNull();
  });
  it("bounded size — old entries evicted, never unbounded growth", () => {
    for (let i = 0; i < 2100; i += 1) cacheSet(`k${i}`, i, 3600_000);
    expect(_cacheSize()).toBeLessThanOrEqual(2000);
  });
});

describe("recoMetrics privacy + counters", () => {
  beforeEach(() => recoMetrics._reset());
  it("snapshot carries only operational metadata (no profile / prompt / PII keys)", () => {
    recoMetrics.recordRequest({ strategy: "deterministic+ai", candidateCount: 40, aiCandidateCount: 12, totalMs: 120, aiMs: 40 });
    recoMetrics.recordAiAttempt();
    recoMetrics.recordAiFallback("timeout");
    recoMetrics.recordCache("hit");
    recoMetrics.recordDismissal();
    const snap = recoMetrics.snapshot();
    const json = JSON.stringify(snap);
    for (const forbidden of ["skills", "headline", "prompt", "token", "apiKey", "password", "email", "profile"]) {
      expect(json.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
    expect(snap.requests).toBe(1);
    expect(snap.ai.errors.timeout).toBe(1);
    expect(snap.cache.hit).toBe(1);
    expect(snap.dismissals).toBe(1);
    expect(snap.latencyMs.totalAvg).toBe(120);
  });
});
