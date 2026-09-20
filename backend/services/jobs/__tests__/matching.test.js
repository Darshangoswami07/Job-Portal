import { describe, it, expect } from "vitest";
import {
  canonicalSkill,
  skillOverlap,
  seniorityCompat,
  experienceCompat,
  roleFamilyMatch,
  locationCompat,
  matchUserToJob,
  matchLabel,
  WEIGHTS,
} from "../matching.js";
import { buildUserProfileVector } from "../userProfile.js";

const profile = (over = {}) =>
  buildUserProfileVector(
    {
      profile: {
        skills: ["React", "Node.js", "TypeScript", "MongoDB"],
        headline: "Senior Backend Engineer",
        location: "Bengaluru",
        workPreference: "Remote",
        employmentType: "Full time",
        experience: [
          { title: "Backend Engineer", startDate: "2019-01-01", current: true },
        ],
        ...over,
      },
    },
    {}
  );

const group = (over = {}) => ({
  displayTitle: "Senior Backend Engineer",
  normalizedTitle: "senior backend engineer",
  skills: ["Node.js", "MongoDB", "AWS"],
  remoteType: "remote",
  normalizedLocation: "bengaluru",
  location: "Bengaluru",
  jobType: "Full-time",
  experienceLevel: 4,
  industry: "Technology",
  dedupeHash: "h1",
  ...over,
});

describe("skill matching", () => {
  it("folds controlled synonyms only", () => {
    expect(canonicalSkill("JS")).toBe("javascript");
    expect(canonicalSkill("nodejs")).toBe("node.js");
    expect(canonicalSkill("k8s")).toBe("kubernetes");
    expect(canonicalSkill("react")).toBe("react");
    expect(canonicalSkill("angular")).toBe("angular"); // never mapped to react
  });

  it("scores recall against the job's listed skills", () => {
    const r = skillOverlap(["node.js", "mongodb", "react"], ["Node.js", "MongoDB", "AWS"]);
    expect(r.matched.sort()).toEqual(["mongodb", "node.js"]);
    expect(r.missing).toEqual(["aws"]);
    expect(r.score).toBeGreaterThan(0.5);
  });

  it("returns null (unknown, not zero) when the job lists no skills", () => {
    expect(skillOverlap(["react"], []).score).toBeNull();
  });

  it("zero when the user has no skills but the job requires some", () => {
    expect(skillOverlap([], ["react"]).score).toBe(0);
  });
});

describe("seniority + experience", () => {
  it("same band = 1, adjacent tapers, intern vs principal floors", () => {
    expect(seniorityCompat("senior", "Senior Software Engineer")).toBe(1);
    expect(seniorityCompat("junior", "Senior Software Engineer")).toBeLessThan(1);
    expect(seniorityCompat("intern", "Principal Engineer")).toBeLessThanOrEqual(0.1);
  });

  it("experience: meets or exceeds need = high, big gap = low", () => {
    expect(experienceCompat(6, 4)).toBe(1);
    expect(experienceCompat(1, 6)).toBeLessThan(0.3);
    expect(experienceCompat(5, undefined)).toBeGreaterThan(0.5); // unknown need → neutral
  });
});

describe("role family + location", () => {
  it("same family = 1, different = strong penalty", () => {
    expect(roleFamilyMatch(["backend"], "Backend Engineer").score).toBe(1);
    expect(roleFamilyMatch(["backend"], "Frontend Engineer").score).toBeLessThan(0.2);
  });

  it("remote job + remote preference = full marks", () => {
    const c = locationCompat(profile(), group({ remoteType: "remote" }));
    expect(c.location).toBe(1);
    expect(c.remoteType).toBe(1);
  });

  it("onsite job in another city = location penalty", () => {
    const c = locationCompat(profile(), group({ remoteType: "onsite", normalizedLocation: "london uk", location: "London" }));
    expect(c.location).toBeLessThan(0.2);
  });
});

describe("matchUserToJob", () => {
  it("strong overall match for an aligned profile/job", () => {
    const r = matchUserToJob(profile(), group());
    expect(r.score).toBeGreaterThan(0.7);
    expect(r.confidence).toBe("high");
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.version).toBe("m1");
  });

  it("caps the score when the role area is clearly different", () => {
    const r = matchUserToJob(profile(), group({ displayTitle: "Frontend Engineer", normalizedTitle: "frontend engineer" }));
    expect(r.score).toBeLessThanOrEqual(0.45);
    expect(r.gaps.join(" ")).toMatch(/role area/i);
  });

  it("caps the score for a seniority mismatch (intern role, senior profile)", () => {
    const r = matchUserToJob(profile(), group({ displayTitle: "Backend Engineering Intern", normalizedTitle: "backend engineering intern" }));
    expect(r.score).toBeLessThanOrEqual(0.4);
  });

  it("penalizes a previously rejected vacancy", () => {
    const p = profile();
    p.rejectedGroupKeys = new Set(["h1"]);
    const withRej = matchUserToJob(p, group());
    const without = matchUserToJob(profile(), group());
    expect(withRej.score).toBeLessThan(without.score);
  });

  it("weights sum to 1", () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });

  it("matchLabel buckets sensibly", () => {
    expect(matchLabel(0.85)).toBe("Strong match");
    expect(matchLabel(0.65)).toBe("Good match");
    expect(matchLabel(0.2)).toBe("");
  });
});

describe("empty profile", () => {
  it("produces no signal and still returns a bounded score", () => {
    const empty = buildUserProfileVector({ profile: {} }, {});
    expect(empty.hasSignal).toBe(false);
    const r = matchUserToJob(empty, group());
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(1);
  });
});
