import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { LeverAdapter, leverAdapter, mapLeverPosting } from "../lever.js";
import { rawJobToJobFields, getAdapter } from "../base.js";
import { safeGet } from "../httpClient.js";

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });

const posting = {
  id: "abc-123",
  text: "Senior Backend Engineer",
  description: "<p>Join us</p>",
  descriptionBody: "<p>Build APIs</p>",
  categories: { location: "Bengaluru, India", department: "Engineering", team: "Platform", commitment: "Full-time" },
  country: "IN",
  workplaceType: "remote",
  hostedUrl: "https://jobs.lever.co/acme/abc-123",
  applyUrl: "https://jobs.lever.co/acme/abc-123/apply",
  createdAt: 1719826200000,
  updatedAt: 1720000000000,
};

const validResponse = [
  posting,
  { id: "no-title", text: "", categories: {} },
  { text: "No id", categories: {} },
];

beforeEach(() => { safeGet.mockReset(); });

describe("mapLeverPosting", () => {
  const m = mapLeverPosting(posting, { companyName: "Acme Inc" });

  it("maps identity, title, description, company, location, department", () => {
    expect(m.externalId).toBe("abc-123");
    expect(m.title).toBe("Senior Backend Engineer");
    expect(m.description).toContain("Join us");
    expect(m.description).toContain("Build APIs");
    expect(m.companyName).toBe("Acme Inc");
    expect(m.location).toBe("Bengaluru, India");
    expect(m.department).toBe("Engineering");
    expect(m.jobType).toBe("Full-time");
    expect(m.workType).toBe("Remote");
    expect(m.country).toBe("IN");
  });

  it("preserves hostedUrl as originalUrl and applyUrl as apply link", () => {
    expect(m.originalUrl).toBe("https://jobs.lever.co/acme/abc-123");
    expect(m.applyUrl).toBe("https://jobs.lever.co/acme/abc-123/apply");
  });

  it("maps epoch createdAt to a Date", () => {
    expect(m.postedAt).toBeInstanceOf(Date);
    expect(m.postedAt.getTime()).toBe(1719826200000);
  });

  it("never fabricates salary / skills / companyDomain", () => {
    expect(m.salaryMin).toBeUndefined();
    expect(m.salaryMax).toBeUndefined();
    expect(m.skills).toEqual([]);
    expect(m.companyDomain).toBe("");
  });

  it("maps a structured salaryRange only when present", () => {
    const withSalary = mapLeverPosting({ ...posting, salaryRange: { min: 100000, max: 150000, currency: "USD" } });
    expect(withSalary.salaryMin).toBe(100000);
    expect(withSalary.salaryMax).toBe(150000);
    expect(withSalary.salaryCurrency).toBe("USD");
  });

  it("drops postings with no id or no title, and null/empty input", () => {
    expect(mapLeverPosting({ text: "x" })).toBeNull();
    expect(mapLeverPosting({ id: "1", text: "" })).toBeNull();
    expect(mapLeverPosting(null)).toBeNull();
    expect(mapLeverPosting({})).toBeNull();
  });

  it("ignores an unsafe url rather than passing it through", () => {
    const m2 = mapLeverPosting({ id: "1", text: "X", hostedUrl: "javascript:alert(1)", applyUrl: "data:x" });
    expect(m2.originalUrl).toBe("");
    expect(m2.applyUrl).toBe("");
  });
});

describe("mapLeverPosting -> rawJobToJobFields", () => {
  it("produces an external ATS job with a dedupe hash", () => {
    const source = { _id: "lv1", name: "Lever", type: "ats" };
    const fields = rawJobToJobFields(mapLeverPosting(posting, { companyName: "Acme Inc" }), source);
    expect(fields.applyType).toBe("external");
    expect(fields.sourceType).toBe("ats");
    expect(fields.remoteType).toBe("remote");
    expect(fields.dedupeHash).toMatch(/^[0-9a-f]{40}$/);
    expect(fields.canonicalUrl).toBe("https://jobs.lever.co/acme/abc-123");
  });
});

describe("LeverAdapter", () => {
  it("is registered with the shared adapter registry", () => {
    expect(getAdapter("lever")).toBe(leverAdapter);
  });

  it("validates the site configuration", () => {
    const a = new LeverAdapter();
    expect(() => a.buildUrl({ config: {} })).toThrow(/site is required/);
    expect(() => a.buildUrl({ config: { site: "bad site!" } })).toThrow(/invalid site/);
    expect(a.buildUrl({ config: { site: "leverdemo" } })).toBe(
      "https://api.lever.co/v0/postings/leverdemo?mode=json"
    );
  });

  it("fetch(): maps a valid array and skips unusable postings", async () => {
    safeGet.mockResolvedValue(okBody(validResponse));
    const raw = await new LeverAdapter().fetch({ config: { site: "acme", companyName: "Acme Inc" }, rateLimitPerMin: 0 });
    expect(raw).toHaveLength(1);
    expect(raw[0].externalId).toBe("abc-123");
  });

  it("fetch(): returns [] for an empty board without error", async () => {
    safeGet.mockResolvedValue(okBody([]));
    const raw = await new LeverAdapter().fetch({ config: { site: "acme" }, rateLimitPerMin: 0 });
    expect(raw).toEqual([]);
  });

  it("fetch(): throws on a malformed (non-array) response", async () => {
    safeGet.mockResolvedValue(okBody({ postings: [] }));
    await expect(
      new LeverAdapter().fetch({ config: { site: "acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/unexpected response shape/);
  });

  it("fetch(): non-JSON body → response error", async () => {
    safeGet.mockResolvedValue({ status: 200, headers: {}, body: "<html>", url: "x" });
    await expect(
      new LeverAdapter().fetch({ config: { site: "acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/not valid JSON/);
  });

  it("fetch(): a network error from safeGet propagates (not swallowed)", async () => {
    safeGet.mockRejectedValue(new Error("ETIMEDOUT"));
    await expect(
      new LeverAdapter().fetch({ config: { site: "acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/ETIMEDOUT/);
  });
});
