import { describe, it, expect } from "vitest";
import {
  generateDedupeHash,
  computeDedupeFields,
  sourceTypePriority,
  pickBestJob,
} from "../dedupe.js";

describe("generateDedupeHash", () => {
  it("is deterministic for the same inputs", () => {
    const a = generateDedupeHash({
      normalizedCompany: "acme",
      normalizedTitle: "backend engineer",
      normalizedLocation: "pune",
      remoteType: "onsite",
    });
    const b = generateDedupeHash({
      normalizedCompany: "acme",
      normalizedTitle: "backend engineer",
      normalizedLocation: "pune",
      remoteType: "onsite",
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{40}$/);
  });

  it("differs when seniority or city differ", () => {
    const senior = generateDedupeHash({
      normalizedCompany: "acme",
      normalizedTitle: "senior backend engineer",
      normalizedLocation: "pune",
      remoteType: "onsite",
    });
    const intern = generateDedupeHash({
      normalizedCompany: "acme",
      normalizedTitle: "backend engineer intern",
      normalizedLocation: "pune",
      remoteType: "onsite",
    });
    const otherCity = generateDedupeHash({
      normalizedCompany: "acme",
      normalizedTitle: "senior backend engineer",
      normalizedLocation: "bangalore",
      remoteType: "onsite",
    });
    expect(senior).not.toBe(intern);
    expect(senior).not.toBe(otherCity);
  });

  it("returns '' without a company or title", () => {
    expect(generateDedupeHash({ normalizedTitle: "x" })).toBe("");
    expect(generateDedupeHash({ normalizedCompany: "x" })).toBe("");
    expect(generateDedupeHash({})).toBe("");
  });
});

describe("computeDedupeFields", () => {
  it("normalizes and hashes a raw-ish job; two sources of one vacancy collide", () => {
    const jobA = computeDedupeFields({
      title: "Sr. Software Engineer",
      companyName: "Acme, Inc.",
      location: "Bangalore, India",
      remoteType: "onsite",
    });
    const jobB = computeDedupeFields({
      title: "Senior Software Engineer",
      companyName: "Acme Inc",
      location: "Bangalore, India",
      remoteType: "onsite",
    });
    expect(jobA.dedupeHash).toBeTruthy();
    expect(jobA.dedupeHash).toBe(jobB.dedupeHash);
    expect(jobA.normalizedCompany).toBe("acmeinc");
  });

  it("does not merge a remote and an on-site posting", () => {
    const remote = computeDedupeFields({
      title: "Support Engineer",
      companyName: "Acme",
      location: "Remote",
      remoteType: "remote",
    });
    const onsite = computeDedupeFields({
      title: "Support Engineer",
      companyName: "Acme",
      location: "Pune",
      remoteType: "onsite",
    });
    expect(remote.dedupeHash).not.toBe(onsite.dedupeHash);
  });
});

describe("pickBestJob", () => {
  it("prefers a higher source-type priority", () => {
    expect(sourceTypePriority("internal")).toBeGreaterThan(sourceTypePriority("aggregator"));
    const best = pickBestJob([
      { jobId: "1", sourceType: "aggregator", description: "x".repeat(500), salaryMin: 10 },
      { jobId: "2", sourceType: "internal", description: "short" },
    ]);
    expect(best.jobId).toBe("2");
  });

  it("breaks ties on completeness then recency", () => {
    const best = pickBestJob([
      { jobId: "a", sourceType: "aggregator", description: "short", postedAt: "2024-01-01" },
      {
        jobId: "b",
        sourceType: "aggregator",
        description: "x".repeat(500),
        salaryMin: 5,
        postedAt: "2023-01-01",
      },
    ]);
    expect(best.jobId).toBe("b");
  });

  it("returns null for an empty list", () => {
    expect(pickBestJob([])).toBeNull();
  });
});
