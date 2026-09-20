import { describe, it, expect } from "vitest";

import { planKeywordQueries, MODE_LIMITS, QUERY_FAMILIES } from "../queryProfiles.js";

describe("planKeywordQueries — bounded orchestration", () => {
  it("incremental mode is small and capped", () => {
    const p = planKeywordQueries({ mode: "incremental", countries: ["in"] });
    expect(p.keywords.length).toBe(MODE_LIMITS.incremental.maxKeywords);
    expect(p.pagesPerQuery).toBe(MODE_LIMITS.incremental.maxPagesPerQuery);
    expect(p.requests.length).toBeLessThanOrEqual(MODE_LIMITS.incremental.maxRequests);
  });

  it("backfill mode is larger but still hard-capped", () => {
    const p = planKeywordQueries({ mode: "backfill", countries: ["in", "gb", "us"] });
    expect(p.keywords.length).toBeLessThanOrEqual(MODE_LIMITS.backfill.maxKeywords);
    expect(p.pagesPerQuery).toBeLessThanOrEqual(MODE_LIMITS.backfill.maxPagesPerQuery);
    expect(p.requests.length).toBeLessThanOrEqual(MODE_LIMITS.backfill.maxRequests);
    expect(p.requests.length).toBe(120); // 18kw × 3pg × 3 countries = 162 → capped to 120
  });

  it("an explicit lower cap wins over the mode ceiling", () => {
    const p = planKeywordQueries({ mode: "backfill", countries: ["in", "gb"], maxRequests: 20, maxKeywords: 5 });
    expect(p.keywords.length).toBe(5); // explicit keyword cap below the mode ceiling
    // 5 keywords × 2 countries × 3 pages = 30 candidate requests, hard-capped to 20
    expect(p.requests.length).toBe(20);
  });

  it("families select the right keyword sets and de-dupe overlaps", () => {
    const p = planKeywordQueries({ mode: "backfill", families: ["software", "software"] });
    expect(p.keywords).toEqual([...new Set(QUERY_FAMILIES.software)].slice(0, MODE_LIMITS.backfill.maxKeywords));
  });

  it("explicit keywords override families; blanks dropped, lower-cased", () => {
    const p = planKeywordQueries({ keywords: ["  React Dev ", "", "REACT DEV", "go"] });
    expect(p.keywords).toEqual(["react dev", "go"]);
  });

  it("defaults to a single ('') market when no countries given", () => {
    const p = planKeywordQueries({ mode: "incremental", keywords: ["x"] });
    expect(p.countries).toEqual([""]);
    expect(p.requests[0]).toMatchObject({ keyword: "x", country: "", page: 1 });
  });

  it("resultsPerPage clamps to the provider max of 50", () => {
    expect(planKeywordQueries({ resultsPerPage: 999 }).resultsPerPage).toBe(50);
    expect(planKeywordQueries({ resultsPerPage: 10 }).resultsPerPage).toBe(10);
  });
});
