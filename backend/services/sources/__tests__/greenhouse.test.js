import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import {
  GreenhouseAdapter,
  greenhouseAdapter,
  mapGreenhouseJob,
  decodeHtmlEntities,
} from "../greenhouse.js";
import { rawJobToJobFields, getAdapter } from "../base.js";
import { safeGet } from "../httpClient.js";
import {
  greenhouseListResponse,
  greenhouseEmptyResponse,
  greenhouseMalformedResponse,
} from "./fixtures/greenhouse.js";

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });

beforeEach(() => {
  safeGet.mockReset();
});

describe("decodeHtmlEntities", () => {
  it("decodes the entity-encoded content Greenhouse returns", () => {
    const html = decodeHtmlEntities(greenhouseListResponse.jobs[0].content);
    expect(html).toContain("<strong>Senior Backend Engineer</strong>");
    expect(html).toContain("We're hiring");
    expect(html).toContain("APIs & services");
    expect(html).not.toContain("&lt;");
  });
  it("is safe on empty / numeric entities", () => {
    expect(decodeHtmlEntities("")).toBe("");
    expect(decodeHtmlEntities("A&#38;B&#x26;C")).toBe("A&B&C");
  });
});

describe("mapGreenhouseJob", () => {
  const mapped = mapGreenhouseJob(greenhouseListResponse.jobs[0], { companyName: "Acme Inc" });

  it("maps identity, title, description, company, location, department", () => {
    expect(mapped.externalId).toBe("4012345");
    expect(mapped.title).toBe("Senior Backend Engineer");
    expect(mapped.description).toContain("<strong>");
    expect(mapped.companyName).toBe("Acme Inc");
    expect(mapped.location).toBe("Bengaluru, India");
    expect(mapped.department).toBe("Engineering");
    expect(mapped.tags).toEqual(["Engineering"]);
  });

  it("preserves the original + application URL (the Greenhouse posting)", () => {
    expect(mapped.originalUrl).toBe("https://boards.greenhouse.io/acme/jobs/4012345");
    expect(mapped.applyUrl).toBe("https://boards.greenhouse.io/acme/jobs/4012345");
  });

  it("maps posted / updated dates", () => {
    expect(mapped.postedAt).toBe("2024-07-01T09:00:00-04:00");
    expect(mapped.sourceUpdatedAt).toBe("2024-07-15T10:20:30-04:00");
  });

  it("reads employment type from metadata when present, else leaves it empty", () => {
    expect(mapped.jobType).toBe("Full-time");
    expect(mapGreenhouseJob(greenhouseListResponse.jobs[1]).jobType).toBe("");
  });

  it("never fabricates salary / country / skills / companyDomain / workType", () => {
    expect(mapped.salaryMin).toBeUndefined();
    expect(mapped.salaryMax).toBeUndefined();
    expect(mapped.country).toBe("");
    expect(mapped.skills).toEqual([]);
    expect(mapped.companyDomain).toBe("");
    expect(mapped.workType).toBe("");
  });

  it("drops postings with no id or no title", () => {
    expect(mapGreenhouseJob(greenhouseListResponse.jobs[2])).toBeNull();
    expect(mapGreenhouseJob(greenhouseListResponse.jobs[3])).toBeNull();
    expect(mapGreenhouseJob(null)).toBeNull();
    expect(mapGreenhouseJob({})).toBeNull();
  });

  it("ignores an invalid absolute_url rather than passing garbage through", () => {
    const m = mapGreenhouseJob({ id: 1, title: "X", absolute_url: "javascript:alert(1)" });
    expect(m.originalUrl).toBe("");
    expect(m.applyUrl).toBe("");
  });
});

describe("mapGreenhouseJob → rawJobToJobFields (external contract)", () => {
  it("produces an external job with normalized fields + dedupe hash", () => {
    const source = { _id: "gh1", name: "Greenhouse", type: "ats" };
    const fields = rawJobToJobFields(
      mapGreenhouseJob(greenhouseListResponse.jobs[1], { companyName: "Acme Inc" }),
      source
    );
    expect(fields.applyType).toBe("external");
    expect(fields.sourceType).toBe("ats");
    expect(fields.sourceName).toBe("Greenhouse");
    expect(fields.source).toBe("Greenhouse");
    expect(fields.remoteType).toBe("remote");
    expect(fields.normalizedTitle).toBe("product designer remote");
    expect(fields.dedupeHash).toMatch(/^[0-9a-f]{40}$/);
    expect(fields.canonicalUrl).toBe("https://boards.greenhouse.io/acme/jobs/4012346");
  });
});

describe("GreenhouseAdapter", () => {
  it("is registered with the shared adapter registry", () => {
    expect(getAdapter("greenhouse")).toBe(greenhouseAdapter);
  });

  it("validates board token configuration", () => {
    const a = new GreenhouseAdapter();
    expect(() => a.buildUrl({ config: {} })).toThrow(/boardToken is required/);
    expect(() => a.buildUrl({ config: { boardToken: "bad token!" } })).toThrow(/invalid board token/);
    expect(a.buildUrl({ config: { boardToken: "acme" } })).toBe(
      "https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true"
    );
  });

  it("fetch(): maps a valid payload and skips unusable postings", async () => {
    safeGet.mockResolvedValue(okBody(greenhouseListResponse));
    const raw = await new GreenhouseAdapter().fetch({
      config: { boardToken: "acme", companyName: "Acme Inc" },
      rateLimitPerMin: 0,
    });
    expect(raw).toHaveLength(2);
    expect(raw.map((r) => r.externalId)).toEqual(["4012345", "4012346"]);
  });

  it("fetch(): throws on malformed response shape", async () => {
    safeGet.mockResolvedValue(okBody(greenhouseMalformedResponse));
    await expect(
      new GreenhouseAdapter().fetch({ config: { boardToken: "acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/unexpected response shape/);
  });

  it("fetch(): returns [] for an empty board without error", async () => {
    safeGet.mockResolvedValue(okBody(greenhouseEmptyResponse));
    const raw = await new GreenhouseAdapter().fetch({
      config: { boardToken: "acme" },
      rateLimitPerMin: 0,
    });
    expect(raw).toEqual([]);
  });

  it("fetch(): non-JSON body → response error", async () => {
    safeGet.mockResolvedValue({ status: 200, headers: {}, body: "<html>oops</html>", url: "x" });
    await expect(
      new GreenhouseAdapter().fetch({ config: { boardToken: "acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/not valid JSON/);
  });

  it("fetch(): a network error from safeGet propagates (not swallowed)", async () => {
    safeGet.mockRejectedValue(new Error("ECONNRESET"));
    await expect(
      new GreenhouseAdapter().fetch({ config: { boardToken: "acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/ECONNRESET/);
  });
});
