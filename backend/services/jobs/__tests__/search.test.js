import { describe, it, expect } from "vitest";
import {
  parseSearchParams,
  buildSearchFilter,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "../search.js";

describe("parseSearchParams", () => {
  it("applies defaults", () => {
    const { params } = parseSearchParams({});
    expect(params).toMatchObject({ q: "", page: 1, limit: DEFAULT_LIMIT, sort: "relevance" });
  });

  it("caps limit at MAX_LIMIT", () => {
    expect(parseSearchParams({ limit: "500" }).params.limit).toBe(MAX_LIMIT);
    expect(parseSearchParams({ limit: "10" }).params.limit).toBe(10);
  });

  it("rejects malformed page / limit", () => {
    expect(parseSearchParams({ page: "abc" }).error).toMatch(/page/);
    expect(parseSearchParams({ page: "0" }).error).toMatch(/page/);
    expect(parseSearchParams({ limit: "-3" }).error).toMatch(/limit/);
  });

  it("rejects an unknown sort", () => {
    expect(parseSearchParams({ sort: "magic" }).error).toMatch(/sort/);
    expect(parseSearchParams({ sort: "newest" }).params.sort).toBe("newest");
  });

  it("validates enum-ish filters", () => {
    expect(parseSearchParams({ remoteType: "space" }).error).toMatch(/remoteType/);
    expect(parseSearchParams({ jobType: "Wizard" }).error).toMatch(/jobType/);
    expect(parseSearchParams({ remoteType: "remote,hybrid" }).params.remoteType).toEqual([
      "remote",
      "hybrid",
    ]);
    expect(parseSearchParams({ jobType: "Full-time" }).params.jobType).toEqual(["Full-time"]);
  });

  it("rejects negative numeric filters and over-long strings", () => {
    expect(parseSearchParams({ salaryMin: "-1" }).error).toMatch(/salaryMin/);
    expect(parseSearchParams({ experienceMax: "abc" }).error).toMatch(/experienceMax/);
    expect(parseSearchParams({ q: "x".repeat(500) }).error).toMatch(/q/);
  });
});

describe("buildSearchFilter", () => {
  it("always excludes closed / inactive jobs", () => {
    const { filter } = buildSearchFilter(parseSearchParams({}).params);
    expect(filter.isActive).toEqual({ $ne: false });
    expect(filter.status.$nin).toContain("expired");
    expect(filter.status.$nin).toContain("removed");
  });

  it("adds a $text clause only when q is present", () => {
    expect(buildSearchFilter(parseSearchParams({}).params).filter.$text).toBeUndefined();
    const { filter, useTextScore } = buildSearchFilter(parseSearchParams({ q: "react" }).params);
    expect(filter.$text).toEqual({ $search: "react" });
    expect(useTextScore).toBe(true);
  });

  it("maps remoteType to remoteType + legacy workType", () => {
    const { filter } = buildSearchFilter(parseSearchParams({ remoteType: "remote" }).params);
    const clause = filter.$and.find((c) => JSON.stringify(c).includes("workType"));
    expect(clause.$or).toEqual(
      expect.arrayContaining([{ remoteType: "remote" }, { workType: "Remote" }])
    );
  });

  it("builds salary and experience ranges", () => {
    const { filter } = buildSearchFilter(
      parseSearchParams({ salaryMin: "5", salaryMax: "20", experienceMin: "2" }).params
    );
    const salary = filter.$and.find((c) => c.salary);
    const exp = filter.$and.find((c) => c.experienceLevel);
    expect(salary.salary).toEqual({ $gte: 5, $lte: 20 });
    expect(exp.experienceLevel).toEqual({ $gte: 2 });
  });

  it("sorts newest / oldest / relevance deterministically", () => {
    expect(buildSearchFilter(parseSearchParams({ sort: "newest" }).params).sort).toEqual({
      publishedAt: -1,
      createdAt: -1,
    });
    expect(buildSearchFilter(parseSearchParams({ sort: "oldest" }).params).sort).toEqual({
      publishedAt: 1,
      createdAt: 1,
    });
    expect(buildSearchFilter(parseSearchParams({}).params).sort).toHaveProperty("featured", -1);
  });
});
