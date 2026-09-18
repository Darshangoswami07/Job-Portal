import { describe, it, expect } from "vitest";
import { computeBackfillFields } from "../backfill.js";

const baseInternalJob = {
  _id: "job_internal_1",
  title: "Senior Frontend Engineer",
  source: "JobPilot Ai",
  sourceUrl: "",
  created_by: "user_1",
  company: { name: "Acme Corp", website: "https://acme.com" },
  location: "Bangalore",
  workType: "On-site",
  isActive: true,
  createdAt: new Date("2024-05-01T00:00:00Z"),
  updatedAt: new Date("2024-06-01T00:00:00Z"),
  publishedAt: new Date("2024-05-01T00:00:00Z"),
};

const baseAggregatedJob = {
  _id: "job_agg_1",
  title: "Backend Developer",
  source: "Adzuna",
  sourceUrl: "https://www.adzuna.com/details/12345?utm_source=partner",
  created_by: "system_user",
  companyName: "Globex",
  location: "Remote",
  workType: "Remote",
  isActive: true,
  createdAt: new Date("2024-04-01T00:00:00Z"),
};

describe("computeBackfillFields — internal jobs", () => {
  it("marks the job internal and never invents an apply URL", () => {
    const { set } = computeBackfillFields(baseInternalJob);
    expect(set.sourceType).toBe("internal");
    expect(set.sourceName).toBe("Internal");
    expect(set.applyType).toBe("internal"); // explicitly labelled, never external
    expect(set.originalUrl).toBeUndefined();
    expect(set.applyUrl).toBeUndefined();
    expect(set.companyName).toBe("Acme Corp");
    expect(set.normalizedCompany).toBe("acmecorp");
    expect(set.normalizedTitle).toBe("senior frontend engineer");
    expect(set.dedupeHash).toMatch(/^[0-9a-f]{40}$/);
    expect(set.status).toBe("active");
    expect(set.firstSeenAt).toEqual(baseInternalJob.createdAt);
  });

  it("does not touch country", () => {
    const { set } = computeBackfillFields({ ...baseInternalJob, country: "India" });
    expect(set.country).toBeUndefined();
  });
});

describe("computeBackfillFields — aggregated jobs", () => {
  it("preserves the original URL as apply/original/canonical and marks it external", () => {
    const { set } = computeBackfillFields(baseAggregatedJob);
    expect(set.sourceType).toBe("aggregator");
    expect(set.sourceName).toBe("Adzuna");
    expect(set.originalUrl).toBe(baseAggregatedJob.sourceUrl);
    expect(set.applyUrl).toBe(baseAggregatedJob.sourceUrl);
    expect(set.canonicalUrl).toBe("https://www.adzuna.com/details/12345");
    expect(set.applyType).toBe("external");
    expect(set.remoteType).toBe("remote");
    expect(set.normalizedLocation).toBe("remote");
  });

  it("never fabricates a URL when sourceUrl is missing/invalid", () => {
    const { set } = computeBackfillFields({
      ...baseAggregatedJob,
      sourceUrl: "",
    });
    expect(set.originalUrl).toBeUndefined();
    expect(set.applyUrl).toBeUndefined();
    expect(set.applyType).toBe("internal"); // no external URL → not marked external
  });
});

describe("computeBackfillFields — idempotency", () => {
  it("returns an empty set when every Phase 1 field is already populated", () => {
    const populated = {
      ...baseAggregatedJob,
      sourceType: "aggregator",
      sourceName: "Adzuna",
      originalUrl: baseAggregatedJob.sourceUrl,
      applyUrl: baseAggregatedJob.sourceUrl,
      canonicalUrl: "https://www.adzuna.com/details/12345",
      applyType: "external",
      companyName: "Globex",
      companyDomain: "globex.com",
      normalizedTitle: "backend developer",
      normalizedCompany: "globex",
      normalizedLocation: "remote",
      remoteType: "remote",
      dedupeHash: "a".repeat(40),
      status: "active",
      firstSeenAt: baseAggregatedJob.createdAt,
      lastSeenAt: baseAggregatedJob.createdAt,
      postedAt: baseAggregatedJob.createdAt,
    };
    const { set } = computeBackfillFields(populated);
    expect(Object.keys(set)).toHaveLength(0);
  });
});

describe("computeBackfillFields — grouping candidate", () => {
  it("emits a group candidate carrying the job's dedupe identity", () => {
    const { dedupeHash, groupCandidate } = computeBackfillFields(baseAggregatedJob);
    expect(dedupeHash).toBeTruthy();
    expect(groupCandidate.jobId).toBe("job_agg_1");
    expect(groupCandidate.applyUrl).toBe(baseAggregatedJob.sourceUrl);
    expect(groupCandidate.sourceType).toBe("aggregator");
  });
});
