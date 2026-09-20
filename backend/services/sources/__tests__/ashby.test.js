import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeRequest: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { AshbyAdapter, ashbyAdapter, mapAshbyJob } from "../ashby.js";
import { rawJobToJobFields, getAdapter } from "../base.js";
import { safeRequest } from "../httpClient.js";

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });

const job = {
  id: "job_123",
  title: "Frontend Engineer",
  descriptionHtml: "<p>Ship UI</p>",
  location: "Remote - US",
  address: { postalAddress: { addressLocality: "Austin", addressRegion: "TX", addressCountry: "US" } },
  isRemote: true,
  isListed: true,
  employmentType: "FullTime",
  department: "Engineering",
  team: "Web",
  jobUrl: "https://jobs.ashbyhq.com/acme/job_123",
  applyUrl: "https://jobs.ashbyhq.com/acme/job_123/application",
  publishedAt: "2024-07-01T09:00:00Z",
  updatedAt: "2024-07-15T09:00:00Z",
  compensation: { compensationTierSummary: { min: 120000, max: 160000, currency: "USD" } },
};

const validResponse = {
  jobs: [
    job,
    { id: "unlisted", title: "Hidden", isListed: false },
    { id: "no-title", title: "" },
    { title: "no-id" },
  ],
};

beforeEach(() => { safeRequest.mockReset(); });

describe("mapAshbyJob", () => {
  const m = mapAshbyJob(job, { companyName: "Acme Inc" });

  it("maps identity, title, description, location, department, remote", () => {
    expect(m.externalId).toBe("job_123");
    expect(m.title).toBe("Frontend Engineer");
    expect(m.description).toContain("Ship UI");
    expect(m.companyName).toBe("Acme Inc");
    expect(m.location).toBe("Remote - US");
    expect(m.department).toBe("Engineering");
    expect(m.jobType).toBe("Full-time");
    expect(m.workType).toBe("Remote");
    expect(m.country).toBe("US");
  });

  it("preserves jobUrl as originalUrl and applyUrl as apply link", () => {
    expect(m.originalUrl).toBe("https://jobs.ashbyhq.com/acme/job_123");
    expect(m.applyUrl).toBe("https://jobs.ashbyhq.com/acme/job_123/application");
  });

  it("maps compensation only when Ashby returns it", () => {
    expect(m.salaryMin).toBe(120000);
    expect(m.salaryMax).toBe(160000);
    expect(m.salaryCurrency).toBe("USD");
    const noComp = mapAshbyJob({ ...job, compensation: undefined });
    expect(noComp.salaryMin).toBeUndefined();
  });

  it("never fabricates skills / companyDomain", () => {
    expect(m.skills).toEqual([]);
    expect(m.companyDomain).toBe("");
  });

  it("drops unlisted jobs, jobs with no id/title, and null/empty input", () => {
    expect(mapAshbyJob({ id: "x", title: "y", isListed: false })).toBeNull();
    expect(mapAshbyJob({ id: "x", title: "" })).toBeNull();
    expect(mapAshbyJob({ title: "y" })).toBeNull();
    expect(mapAshbyJob(null)).toBeNull();
    expect(mapAshbyJob({})).toBeNull();
  });
});

describe("mapAshbyJob -> rawJobToJobFields", () => {
  it("produces an external ATS job with a dedupe hash", () => {
    const fields = rawJobToJobFields(mapAshbyJob(job, { companyName: "Acme Inc" }), { _id: "as1", name: "Ashby", type: "ats" });
    expect(fields.applyType).toBe("external");
    expect(fields.sourceType).toBe("ats");
    expect(fields.dedupeHash).toMatch(/^[0-9a-f]{40}$/);
    expect(fields.canonicalUrl).toBe("https://jobs.ashbyhq.com/acme/job_123");
  });
});

describe("AshbyAdapter", () => {
  it("is registered with the shared adapter registry", () => {
    expect(getAdapter("ashby")).toBe(ashbyAdapter);
  });

  it("validates the jobBoardName configuration", () => {
    const a = new AshbyAdapter();
    expect(() => a.buildUrl({ config: {} })).toThrow(/jobBoardName is required/);
    expect(() => a.buildUrl({ config: { jobBoardName: "bad/name" } })).toThrow(/invalid jobBoardName/);
    expect(a.buildUrl({ config: { jobBoardName: "Acme" } })).toBe(
      "https://api.ashbyhq.com/posting-api/job-board/Acme"
    );
  });

  it("fetch(): maps a valid payload and skips unusable/unlisted postings", async () => {
    safeRequest.mockResolvedValue(okBody(validResponse));
    const raw = await new AshbyAdapter().fetch({ config: { jobBoardName: "Acme", companyName: "Acme Inc" }, rateLimitPerMin: 0 });
    expect(raw).toHaveLength(1);
    expect(raw[0].externalId).toBe("job_123");
    expect(safeRequest).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: "POST" }));
  });

  it("fetch(): returns [] for an empty board without error", async () => {
    safeRequest.mockResolvedValue(okBody({ jobs: [] }));
    const raw = await new AshbyAdapter().fetch({ config: { jobBoardName: "Acme" }, rateLimitPerMin: 0 });
    expect(raw).toEqual([]);
  });

  it("fetch(): throws on a malformed response shape", async () => {
    safeRequest.mockResolvedValue(okBody({ data: [] }));
    await expect(
      new AshbyAdapter().fetch({ config: { jobBoardName: "Acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/unexpected response shape/);
  });

  it("fetch(): non-JSON body → response error", async () => {
    safeRequest.mockResolvedValue({ status: 200, headers: {}, body: "nope", url: "x" });
    await expect(
      new AshbyAdapter().fetch({ config: { jobBoardName: "Acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/not valid JSON/);
  });

  it("fetch(): a network/timeout error propagates", async () => {
    safeRequest.mockRejectedValue(new Error("ETIMEDOUT"));
    await expect(
      new AshbyAdapter().fetch({ config: { jobBoardName: "Acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/ETIMEDOUT/);
  });

  it("fetch(): missing config throws before any HTTP call", async () => {
    await expect(new AshbyAdapter().fetch({ config: {}, rateLimitPerMin: 0 })).rejects.toThrow(/jobBoardName is required/);
    expect(safeRequest).not.toHaveBeenCalled();
  });
});
