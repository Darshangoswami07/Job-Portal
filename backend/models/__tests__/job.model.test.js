import { describe, it, expect } from "vitest";
import { Job } from "../job.model.js";

const indexEntry = (keys) =>
  Job.schema.indexes().find((entry) => {
    const k = entry[0];
    const wanted = Object.keys(keys);
    return (
      Object.keys(k).length === wanted.length &&
      wanted.every((key) => k[key] === keys[key])
    );
  });

describe("Job schema — Phase 1 fields", () => {
  it("adds the source-identity / apply-URL / lifecycle paths", () => {
    for (const path of [
      "sourceId",
      "sourceType",
      "sourceName",
      "originalUrl",
      "applyUrl",
      "canonicalUrl",
      "applyType",
      "companyName",
      "companyDomain",
      "normalizedTitle",
      "normalizedCompany",
      "normalizedLocation",
      "remoteType",
      "dedupeHash",
      "groupId",
      "postedAt",
      "firstSeenAt",
      "lastSeenAt",
      "lastVerifiedAt",
      "expiresAt",
      "status",
    ]) {
      expect(Job.schema.path(path), `missing path: ${path}`).toBeDefined();
    }
  });

  it("relaxes required constraints so external jobs are storable", () => {
    for (const path of ["salary", "experienceLevel", "position", "jobType", "company", "created_by"]) {
      expect(Job.schema.path(path).isRequired, `${path} should not be required`).toBeFalsy();
    }
  });

  it("keeps title / description / location required for real jobs", () => {
    expect(Job.schema.path("title").isRequired).toBe(true);
    expect(Job.schema.path("description").isRequired).toBe(true);
    expect(Job.schema.path("location").isRequired).toBe(true);
  });

  it("does not default country or force salary to 0", () => {
    expect(Job.schema.path("country").defaultValue).toBeUndefined();
    expect(Job.schema.path("salary").defaultValue).toBeUndefined();
  });

  it("constrains status / applyType / remoteType to their enums", () => {
    expect(Job.schema.path("status").enumValues).toContain("removed");
    expect(Job.schema.path("applyType").enumValues).toEqual(["internal", "external"]);
    expect(Job.schema.path("remoteType").enumValues).toContain("unknown");
  });
});

describe("Job schema — Phase 1 indexes", () => {
  it("declares a partial-unique index on (sourceId, externalId)", () => {
    const entry = indexEntry({ sourceId: 1, externalId: 1 });
    expect(entry).toBeDefined();
    expect(entry[1].unique).toBe(true);
    expect(entry[1].partialFilterExpression).toBeDefined();
    expect(entry[1].partialFilterExpression.sourceId).toEqual({ $exists: true });
  });

  it("declares dedupe / group / lifecycle indexes", () => {
    expect(indexEntry({ dedupeHash: 1 })).toBeDefined();
    expect(indexEntry({ groupId: 1 })).toBeDefined();
    expect(indexEntry({ status: 1, lastSeenAt: 1 })).toBeDefined();
    expect(indexEntry({ normalizedCompany: 1, status: 1 })).toBeDefined();
  });

  it("keeps the existing text index", () => {
    const textIdx = Job.schema.indexes().find((e) => Object.values(e[0]).includes("text"));
    expect(textIdx).toBeDefined();
  });
});
