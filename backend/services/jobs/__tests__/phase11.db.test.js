import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

import { normalizeSearchQuery } from "../queryNormalize.js";
import { computeFreshness, parseSearchParams, buildGroupSearchFilter } from "../search.js";
import { useTestDb } from "../../../test/mongo.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { User } from "../../../models/user.model.js";
import { getSearchSuggestions, searchJobs } from "../../../controllers/job.controller.js";
import { getJobRecommendations } from "../../../controllers_new/recommendationController.js";

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};
const oid = () => new mongoose.Types.ObjectId();

describe("query normalization (controlled — no cross-tech equivalence)", () => {
  it("fixes spacing / spelling variants", () => {
    expect(normalizeSearchQuery("react js").normalized).toBe("react");
    expect(normalizeSearchQuery("React.js Developer").normalized).toBe("react developer");
    expect(normalizeSearchQuery("nodejs").normalized).toBe("node");
    expect(normalizeSearchQuery("software eng").normalized).toBe("software engineer");
    expect(normalizeSearchQuery("front end").normalized).toBe("frontend");
    expect(normalizeSearchQuery("  Sr  Backend  ").normalized).toBe("senior backend");
  });

  it("NEVER makes distinct technologies equivalent", () => {
    expect(normalizeSearchQuery("java").normalized).toBe("java");
    expect(normalizeSearchQuery("java").normalized).not.toBe("javascript");
    expect(normalizeSearchQuery("react").normalized).not.toBe("angular");
    expect(normalizeSearchQuery("python").normalized).not.toBe("php");
    // spacing variant of JavaScript is still javascript, not java
    expect(normalizeSearchQuery("java script").normalized).toBe("javascript");
  });

  it("buildGroupSearchFilter applies it to $text only", () => {
    const { filter } = buildGroupSearchFilter(parseSearchParams({ q: "react js" }).params);
    expect(filter.$text.$search).toBe("react");
  });

  it("parseSearchParams accepts sort=salary", () => {
    expect(parseSearchParams({ sort: "salary" }).params.sort).toBe("salary");
    expect(parseSearchParams({ sort: "bogus" }).error).toBeTruthy();
  });
});

describe("computeFreshness (real timestamps only)", () => {
  it("claims a label only when backed by a timestamp", () => {
    expect(computeFreshness({ postedAt: new Date() }).label).toBe("Just posted");
    expect(computeFreshness({ postedAt: new Date(Date.now() - 5 * 864e5) }).label).toBe("Recently posted");
    expect(computeFreshness({ postedAt: new Date(Date.now() - 60 * 864e5) }).label).toBe("");
    expect(computeFreshness({}).label).toBe("");
  });
});

describe("search suggestions endpoint (DB)", () => {
  useTestDb();
  beforeEach(async () => {
    await JobGroup.deleteMany({});
    await JobGroup.insertMany([
      { dedupeHash: "a", displayTitle: "React Developer", companyName: "Acme", location: "Bengaluru", skills: ["React", "Redux"], status: "active", bestJobId: oid(), sources: [], postedAt: new Date() },
      { dedupeHash: "b", displayTitle: "Senior React Engineer", companyName: "Reactful Inc", location: "Remote", skills: ["React", "TypeScript"], status: "active", bestJobId: oid(), sources: [], postedAt: new Date() },
      { dedupeHash: "c", displayTitle: "Backend Engineer", companyName: "Beta", location: "Pune", skills: ["Node.js"], status: "active", bestJobId: oid(), sources: [], postedAt: new Date() },
    ]);
  });

  it("returns real indexed suggestions, bounded, and never fabricated", async () => {
    const res = mockRes();
    await getSearchSuggestions({ query: { q: "react" } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(res.body.suggestions.length).toBeLessThanOrEqual(8);
    for (const s of res.body.suggestions) {
      expect(["title", "company", "location", "skill"]).toContain(s.type);
      expect(s.value.toLowerCase()).toContain("react");
    }
  });

  it("empty for a <2 char query, safe for junk", async () => {
    const a = mockRes();
    await getSearchSuggestions({ query: { q: "r" } }, a);
    expect(a.body.suggestions).toEqual([]);
    const b = mockRes();
    await getSearchSuggestions({ query: { q: "$$$###" } }, b);
    expect(b.statusCode).toBe(200);
  });
});

describe("search DTO carries freshness; empty-profile recos carry missing[]", () => {
  useTestDb();
  beforeEach(async () => {
    await JobGroup.deleteMany({});
    await User.deleteMany({});
    await JobGroup.create({ dedupeHash: "x", displayTitle: "Backend Engineer", companyName: "Acme", status: "active", remoteType: "remote", bestJobId: oid(), sources: [{ jobId: oid(), sourceName: "Job-Pilot", sourceType: "internal", applyType: "internal", status: "active", applyUrl: "" }], activeSourceCount: 1, postedAt: new Date() });
  });

  it("search cards include a freshness label", async () => {
    const res = mockRes();
    await searchJobs({ query: {} }, res);
    expect(res.body.jobs[0]).toHaveProperty("freshness");
    expect(res.body.jobs[0].freshness).toBe("Just posted");
  });

  it("recommendations fallback tells a thin-profile user exactly what to add", async () => {
    const blank = await User.create({ fullname: "B", email: `b${Date.now()}@x.com`, password: "h", roles: { jobSeeker: true }, profile: {} });
    const res = mockRes();
    await getJobRecommendations({ id: blank._id, query: {} }, res);
    expect(res.body.meta.strategy).toBe("fallback");
    expect(res.body.meta.missing).toEqual(expect.arrayContaining(["skills", "preferredRole", "location"]));
  });
});
