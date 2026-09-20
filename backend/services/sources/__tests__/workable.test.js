import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { WorkableAdapter, workableAdapter, mapWorkableJob } from "../workable.js";
import { rawJobToJobFields, getAdapter } from "../base.js";
import { safeGet } from "../httpClient.js";

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });

const TOKEN = "test-workable-token";
const summary = { shortcode: "ABC123", title: "Data Engineer" };
const detail = {
  shortcode: "ABC123",
  title: "Data Engineer",
  full_description: "<p>Own the data platform</p>",
  location: { location_str: "London, UK", city: "London", country: "United Kingdom", telecommuting: true },
  employment_type: "Full-time",
  department: "Data",
  function: "Engineering",
  url: "https://acme.workable.com/j/ABC123",
  application_url: "https://apply.workable.com/acme/j/ABC123/apply",
  shortlink: "https://acme.workable.com/j/ABC123",
  created_at: "2024-07-01T09:00:00Z",
};

function mockApi(jobs) {
  safeGet.mockImplementation((url) => {
    if (/\/spi\/v3\/jobs\?/.test(url)) return Promise.resolve(okBody({ jobs, paging: {} }));
    const code = decodeURIComponent(url.split("/spi/v3/jobs/")[1] || "");
    if (code === "ABC123") return Promise.resolve(okBody(detail));
    return Promise.resolve(okBody({ shortcode: code, title: "No desc" }));
  });
}

beforeEach(() => {
  safeGet.mockReset();
  process.env.WORKABLE_API_TOKEN = TOKEN;
});
afterEach(() => {
  delete process.env.WORKABLE_API_TOKEN;
});

describe("mapWorkableJob", () => {
  const m = mapWorkableJob({ ...summary, ...detail }, { companyName: "Acme Inc" });

  it("maps identity, title, description, location, department, remote", () => {
    expect(m.externalId).toBe("ABC123");
    expect(m.title).toBe("Data Engineer");
    expect(m.description).toContain("data platform");
    expect(m.companyName).toBe("Acme Inc");
    expect(m.location).toBe("London, UK");
    expect(m.department).toBe("Data");
    expect(m.jobType).toBe("Full-time");
    expect(m.workType).toBe("Remote");
    expect(m.country).toBe("United Kingdom");
  });

  it("preserves url as originalUrl and application_url as apply link", () => {
    expect(m.originalUrl).toBe("https://acme.workable.com/j/ABC123");
    expect(m.applyUrl).toBe("https://apply.workable.com/acme/j/ABC123/apply");
  });

  it("never fabricates salary / skills / companyDomain", () => {
    expect(m.salaryMin).toBeUndefined();
    expect(m.skills).toEqual([]);
    expect(m.companyDomain).toBe("");
  });

  it("returns null for missing shortcode/title and null input", () => {
    expect(mapWorkableJob({ title: "x" })).toBeNull();
    expect(mapWorkableJob({ shortcode: "x", title: "" })).toBeNull();
    expect(mapWorkableJob(null)).toBeNull();
  });
});

describe("mapWorkableJob -> rawJobToJobFields", () => {
  it("produces an external ATS job with a dedupe hash", () => {
    const fields = rawJobToJobFields(
      mapWorkableJob({ ...summary, ...detail }, { companyName: "Acme Inc" }),
      { _id: "wk1", name: "Workable", type: "ats" }
    );
    expect(fields.applyType).toBe("external");
    expect(fields.sourceType).toBe("ats");
    expect(fields.remoteType).toBe("remote");
    expect(fields.dedupeHash).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe("WorkableAdapter", () => {
  it("is registered with the shared adapter registry", () => {
    expect(getAdapter("workable")).toBe(workableAdapter);
  });

  it("resolve(): validates subdomain and token presence", () => {
    const a = new WorkableAdapter();
    expect(() => a.resolve({ config: {} })).toThrow(/subdomain is required/);
    expect(() => a.resolve({ config: { subdomain: "bad sub!" } })).toThrow(/subdomain is required/);
    delete process.env.WORKABLE_API_TOKEN;
    expect(() => a.resolve({ config: { subdomain: "acme" } })).toThrow(/token not configured/);
  });

  it("fetch(): lists then fetches detail, keeping only postings with a description", async () => {
    mockApi([summary, { shortcode: "NODESC", title: "Other" }]);
    const raw = await new WorkableAdapter().fetch({ config: { subdomain: "acme", companyName: "Acme Inc" }, rateLimitPerMin: 0 });
    expect(raw).toHaveLength(1);
    expect(raw[0].externalId).toBe("ABC123");
    expect(safeGet).toHaveBeenCalledWith(
      expect.stringMatching(/\/spi\/v3\/jobs\?/),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }) })
    );
  });

  it("fetch(): returns [] for an empty account without error", async () => {
    safeGet.mockResolvedValue(okBody({ jobs: [], paging: {} }));
    const raw = await new WorkableAdapter().fetch({ config: { subdomain: "acme" }, rateLimitPerMin: 0 });
    expect(raw).toEqual([]);
  });

  it("fetch(): throws on a malformed list response shape", async () => {
    safeGet.mockResolvedValue(okBody({ data: [] }));
    await expect(
      new WorkableAdapter().fetch({ config: { subdomain: "acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/unexpected list shape/);
  });

  it("fetch(): a network/timeout error propagates and never leaks the token", async () => {
    safeGet.mockRejectedValue(new Error(`ETIMEDOUT for Bearer ${TOKEN}`));
    await expect(
      new WorkableAdapter().fetch({ config: { subdomain: "acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/\*\*\*/);
    await new WorkableAdapter()
      .fetch({ config: { subdomain: "acme" }, rateLimitPerMin: 0 })
      .catch((e) => expect(e.message).not.toContain(TOKEN));
  });

  it("fetch(): missing token throws before any HTTP call", async () => {
    delete process.env.WORKABLE_API_TOKEN;
    await expect(
      new WorkableAdapter().fetch({ config: { subdomain: "acme" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/token not configured/);
    expect(safeGet).not.toHaveBeenCalled();
  });
});
