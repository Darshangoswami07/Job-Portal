import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  registerMatchProvider,
  clearMatchProvider,
  isAiEnabled,
  refineMatches,
  blendMatch,
  profileSummaryForAi,
  AI_MAX_CANDIDATES,
} from "../aiMatcher.js";

const profile = {
  roleFamilies: ["backend"],
  seniority: "senior",
  years: 5,
  skills: ["node.js", "mongodb", "aws", "typescript"],
  remotePref: "remote",
  jobTypePref: "Full-time",
  locations: ["bengaluru"],
  industries: ["technology"],
  password: "should-not-be-sent",
  email: "should-not-be-sent@example.com",
};

const scored = (n = 3) =>
  Array.from({ length: n }, (_, i) => ({
    group: {
      _id: `g${i}`,
      displayTitle: `Backend Engineer ${i}`,
      companyName: "Acme",
      location: "Remote",
      remoteType: "remote",
      skills: ["node.js", "mongodb"],
      descriptionPreview: "Build services",
      sources: [],
    },
    baseline: { score: 0.6 + i * 0.05, confidence: "medium", reasons: ["Skill match"], gaps: [] },
  }));

beforeEach(() => {
  clearMatchProvider();
  process.env.AI_RECOMMENDATIONS_ENABLED = "true";
});
afterEach(() => {
  clearMatchProvider();
  delete process.env.AI_RECOMMENDATIONS_ENABLED;
});

describe("feature flag + provider", () => {
  it("disabled when the flag is off, even with a provider", () => {
    registerMatchProvider(async () => []);
    process.env.AI_RECOMMENDATIONS_ENABLED = "false";
    expect(isAiEnabled()).toBe(false);
  });
  it("disabled when no provider is registered, even with the flag on", () => {
    expect(isAiEnabled()).toBe(false);
  });
  it("enabled only with flag on AND a provider", () => {
    registerMatchProvider(async () => []);
    expect(isAiEnabled()).toBe(true);
  });
  it("refineMatches is a no-op (null) when disabled", async () => {
    expect(await refineMatches(profile, scored())).toBeNull();
  });
});

describe("privacy of the prompt payload", () => {
  it("profileSummaryForAi never carries password / email / raw PII", () => {
    const s = JSON.stringify(profileSummaryForAi(profile));
    expect(s).not.toMatch(/password|should-not-be-sent/);
  });
  it("the provider receives only minimal profile + job fields", async () => {
    const seen = vi.fn(async () => []);
    registerMatchProvider(seen);
    await refineMatches(profile, scored());
    const payload = seen.mock.calls[0][0];
    expect(payload.profile).not.toHaveProperty("password");
    expect(payload.profile).not.toHaveProperty("email");
    expect(payload.jobs[0]).not.toHaveProperty("sources");
    expect(payload.jobs.length).toBeLessThanOrEqual(AI_MAX_CANDIDATES);
  });
});

describe("safe fallback on every failure mode", () => {
  const bad = {
    "throws (5xx-like)": async () => { throw new Error("HTTP 503"); },
    "rejects (rate limit)": () => Promise.reject(new Error("429 rate limited")),
    "returns non-array": async () => ({ nope: true }),
    "returns malformed rows": async () => [{ foo: 1 }, { groupId: "", matchScore: "x" }],
    "returns null": async () => null,
    "hangs past the timeout": () => new Promise((r) => setTimeout(() => r([]), 5000)),
  };
  for (const [name, fn] of Object.entries(bad)) {
    it(`→ null when the provider ${name}`, async () => {
      registerMatchProvider(fn);
      const out = await refineMatches(profile, scored(), { timeoutMs: 50 });
      expect(out).toBeNull();
    });
  }

  it("valid structured response → a usable Map", async () => {
    registerMatchProvider(async ({ jobs }) =>
      jobs.map((j, i) => ({ groupId: j.groupId, matchScore: 0.9 - i * 0.1, confidence: "high", strengths: ["Great fit"], gaps: [] }))
    );
    const map = await refineMatches(profile, scored());
    expect(map).toBeInstanceOf(Map);
    expect(map.get("g0").matchScore).toBeCloseTo(0.9);
    expect(map.get("g0").confidence).toBe("high");
  });

  it("clamps out-of-range scores and drops rows with no groupId", async () => {
    registerMatchProvider(async () => [
      { groupId: "g0", matchScore: 5 },
      { groupId: "", matchScore: 0.5 },
      { matchScore: 0.5 },
    ]);
    const map = await refineMatches(profile, scored());
    expect(map.size).toBe(1);
    expect(map.get("g0").matchScore).toBe(1);
  });
});

describe("blendMatch", () => {
  const baseline = { score: 0.6, confidence: "medium", reasons: ["a"], gaps: ["x"], signals: {} };
  it("returns the baseline untouched (deterministic strategy) when there is no AI row", () => {
    const r = blendMatch(baseline, null);
    expect(r.score).toBe(0.6);
    expect(r.strategy).toBe("deterministic");
  });
  it("anchors on the deterministic score (70/30) and merges explanations", () => {
    const r = blendMatch(baseline, { matchScore: 1, strengths: ["b"], gaps: ["y"] });
    expect(r.score).toBeCloseTo(0.7 * 0.6 + 0.3 * 1, 5);
    expect(r.reasons).toEqual(expect.arrayContaining(["a", "b"]));
    expect(r.gaps).toEqual(expect.arrayContaining(["x", "y"]));
    expect(r.strategy).toBe("deterministic+ai");
  });
});
