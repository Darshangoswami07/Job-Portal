import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    safeGet: vi.fn(),
    safeRequest: vi.fn(),
    throttleHost: vi.fn().mockResolvedValue(undefined),
  };
});

import { TheMuseAdapter, mapTheMuseJob, THEMUSE_ADAPTER } from "../themuse.js";
import { UsaJobsAdapter, mapUsaJob, USAJOBS_ADAPTER } from "../usajobs.js";
import { JobicyAdapter, mapJobicyJob, JOBICY_ADAPTER } from "../jobicy.js";
import { getAdapter, rawJobToJobFields } from "../base.js";
import { knownAdapters, validateSourceConfig, adapterCatalog } from "../configValidation.js";
import { implementedSourceKeys, SOURCE_CAPABILITIES } from "../sourceCapabilities.js";
import { safeGet, SourceHttpError } from "../httpClient.js";

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });

beforeEach(() => {
  safeGet.mockReset();
});

// ── registry / matrix parity ─────────────────────────────────────────────
describe("Phase 14 — registry & capability matrix", () => {
  it("themuse + usajobs + jobicy are registered adapters of the right type", () => {
    expect(getAdapter(THEMUSE_ADAPTER)?.type).toBe("aggregator");
    expect(getAdapter(USAJOBS_ADAPTER)?.type).toBe("feed");
    expect(getAdapter(JOBICY_ADAPTER)?.type).toBe("aggregator");
  });

  it("implementedSourceKeys() still equals knownAdapters()", () => {
    expect([...implementedSourceKeys()].sort()).toEqual([...knownAdapters()].sort());
  });

  it("new adapters appear in the Add-Source catalogue", () => {
    const names = adapterCatalog().map((a) => a.adapter);
    expect(names).toContain("themuse");
    expect(names).toContain("usajobs");
    expect(names).toContain("jobicy");
  });

  it("every non-implemented source keeps adapter=null", () => {
    for (const s of Object.values(SOURCE_CAPABILITIES)) {
      if (s.availability !== "implemented") expect(s.adapter).toBeNull();
    }
  });
});

// ── The Muse ─────────────────────────────────────────────────────────────
describe("mapTheMuseJob", () => {
  const job = {
    id: 42,
    name: "Senior Backend Engineer",
    contents: "<p>Build APIs</p>",
    company: { name: "Acme" },
    locations: [{ name: "Flexible / Remote" }, { name: "New York, NY" }],
    levels: [{ name: "Senior Level" }],
    categories: [{ name: "Software Engineering" }],
    type: "Full Time",
    publication_date: "2026-08-01T00:00:00Z",
    refs: { landing_page: "https://www.themuse.com/jobs/acme/sbe" },
  };

  it("maps identity, company, remote flag, employment type, url, date", () => {
    const m = mapTheMuseJob(job);
    expect(m.externalId).toBe("themuse-42");
    expect(m.companyName).toBe("Acme");
    expect(m.workType).toBe("Remote");
    expect(m.jobType).toBe("Full-time");
    expect(m.applyUrl).toBe("https://www.themuse.com/jobs/acme/sbe");
    expect(m.originalUrl).toBe("https://www.themuse.com/jobs/acme/sbe");
    expect(m.postedAt).toBe("2026-08-01T00:00:00Z");
  });

  it("does not fabricate a missing url or drop rows without id/title", () => {
    expect(mapTheMuseJob({ name: "no id" })).toBeNull();
    expect(mapTheMuseJob({ id: 1 })).toBeNull();
    const bare = mapTheMuseJob({ id: 7, name: "X" });
    expect(bare.originalUrl).toBe("");
    expect(bare.workType).toBe("");
    expect(bare.jobType).toBe("");
  });
});

describe("TheMuseAdapter.fetch", () => {
  it("returns RawJob[] from a valid response and works anonymously (no api_key)", async () => {
    safeGet.mockResolvedValue(
      okBody({ page: 0, page_count: 1, results: [{ id: 1, name: "Engineer", refs: { landing_page: "https://x.co/1" } }] })
    );
    const raw = await new TheMuseAdapter().fetch({ config: {}, rateLimitPerMin: 0 });
    expect(raw.jobs).toHaveLength(1);
    expect(raw.jobs[0].externalId).toBe("themuse-1");
    expect(safeGet.mock.calls[0][0]).not.toContain("api_key");
  });

  it("sends the api_key from the env var NAME and never leaks the value", async () => {
    process.env.__TEST_MUSE = "muse-secret-value";
    safeGet.mockResolvedValue(okBody({ results: [{ id: 2, name: "Dev", refs: { landing_page: "https://x.co/2" } }], page_count: 1 }));
    const raw = await new TheMuseAdapter().fetch({ config: { apiKeyRef: "__TEST_MUSE" }, rateLimitPerMin: 0 });
    expect(safeGet.mock.calls[0][0]).toContain("api_key=muse-secret-value");
    expect(JSON.stringify(raw.jobs)).not.toContain("muse-secret-value");
    delete process.env.__TEST_MUSE;
  });

  it("stops cleanly on an empty result page", async () => {
    safeGet.mockResolvedValue(okBody({ results: [], page_count: 3 }));
    const raw = await new TheMuseAdapter().fetch({ config: { pages: 3 }, rateLimitPerMin: 0 });
    expect(raw.jobs).toEqual([]);
    expect(safeGet).toHaveBeenCalledTimes(1);
  });

  it("propagates an HTTP 429 / 5xx as a SourceHttpError (never as zero jobs)", async () => {
    safeGet.mockRejectedValue(new SourceHttpError("HTTP 429 from www.themuse.com", "http"));
    await expect(new TheMuseAdapter().fetch({ config: {}, rateLimitPerMin: 0 })).rejects.toMatchObject({ kind: "http" });
  });

  it("wraps a raw network error", async () => {
    safeGet.mockRejectedValue(new Error("socket hang up"));
    await expect(new TheMuseAdapter().fetch({ config: {}, rateLimitPerMin: 0 })).rejects.toMatchObject({ kind: "network" });
  });

  it("throws on malformed JSON", async () => {
    safeGet.mockResolvedValue({ status: 200, headers: {}, body: "<<not json>>", url: "x" });
    await expect(new TheMuseAdapter().fetch({ config: {}, rateLimitPerMin: 0 })).rejects.toBeInstanceOf(SourceHttpError);
  });
});

// ── USAJOBS ──────────────────────────────────────────────────────────────
describe("mapUsaJob", () => {
  const item = {
    MatchedObjectId: "123",
    MatchedObjectDescriptor: {
      PositionID: "ABC-123",
      PositionTitle: "IT Specialist",
      PositionURI: "https://www.usajobs.gov/job/123",
      PositionLocation: [{ LocationName: "Washington, DC" }, { LocationName: "Washington, DC" }],
      OrganizationName: "Department of Example",
      DepartmentName: "Department of Example",
      UserArea: { Details: { JobSummary: "<b>Do IT things</b>" } },
      PositionRemuneration: [{ MinimumRange: "90000", MaximumRange: "120000", RateIntervalCode: "Per Year" }],
      PositionSchedule: [{ Name: "Full-Time" }],
      PublicationStartDate: "2026-08-01",
      ApplicationCloseDate: "2026-09-01",
    },
  };

  it("maps identity, org, dedup location, salary (per-year only), url, dates", () => {
    const m = mapUsaJob(item);
    expect(m.externalId).toBe("usajobs-123");
    expect(m.companyName).toBe("Department of Example");
    expect(m.location).toBe("Washington, DC");
    expect(m.salaryMin).toBe(90000);
    expect(m.salaryCurrency).toBe("USD");
    expect(m.jobType).toBe("Full-time");
    expect(m.applyUrl).toBe("https://www.usajobs.gov/job/123");
    expect(m.expiresAt).toBe("2026-09-01");
    expect(m.country).toBe("US");
  });

  it("does not fabricate salary when the interval is not annual", () => {
    const hourly = JSON.parse(JSON.stringify(item));
    hourly.MatchedObjectDescriptor.PositionRemuneration = [{ MinimumRange: "40", MaximumRange: "55", RateIntervalCode: "Per Hour" }];
    const m = mapUsaJob(hourly);
    expect(m.salaryMin).toBeUndefined();
    expect(m.salaryMax).toBeUndefined();
  });

  it("drops rows with no descriptor / id / title", () => {
    expect(mapUsaJob({})).toBeNull();
    expect(mapUsaJob({ MatchedObjectDescriptor: { PositionTitle: "x" } })).toBeNull();
    expect(mapUsaJob({ MatchedObjectId: "1", MatchedObjectDescriptor: { PositionID: "1" } })).toBeNull();
  });
});

describe("UsaJobsAdapter.fetch", () => {
  const cfg = { apiKeyRef: "__TEST_USAJOBS_KEY", userAgentRef: "__TEST_USAJOBS_UA", queries: ["engineer"], pages: 1 };
  const setEnv = () => {
    process.env.__TEST_USAJOBS_KEY = "usajobs-secret";
    process.env.__TEST_USAJOBS_UA = "ops@example.com";
  };
  const clearEnv = () => {
    delete process.env.__TEST_USAJOBS_KEY;
    delete process.env.__TEST_USAJOBS_UA;
  };

  it("throws a config error when either credential is missing", async () => {
    await expect(
      new UsaJobsAdapter().fetch({ config: { apiKeyRef: "NOPE_KEY", userAgentRef: "NOPE_UA" }, rateLimitPerMin: 0 })
    ).rejects.toMatchObject({ kind: "config" });
  });

  it("sends both credentials as headers and never returns them in the data", async () => {
    setEnv();
    safeGet.mockResolvedValue(
      okBody({
        SearchResult: {
          SearchResultItems: [
            {
              MatchedObjectId: "9",
              MatchedObjectDescriptor: { PositionID: "9", PositionTitle: "Engineer", PositionURI: "https://www.usajobs.gov/job/9", PositionLocation: [{ LocationName: "Remote" }] },
            },
          ],
        },
      })
    );
    const raw = await new UsaJobsAdapter().fetch({ config: cfg, rateLimitPerMin: 0 });
    expect(raw[0].externalId).toBe("usajobs-9");
    const headers = safeGet.mock.calls[0][1].headers;
    expect(headers["Authorization-Key"]).toBe("usajobs-secret");
    expect(headers["User-Agent"]).toBe("ops@example.com");
    expect(JSON.stringify(raw)).not.toContain("usajobs-secret");
    clearEnv();
  });

  it("treats an empty SearchResultItems as zero new jobs (not an error)", async () => {
    setEnv();
    safeGet.mockResolvedValue(okBody({ SearchResult: { SearchResultItems: [] } }));
    const raw = await new UsaJobsAdapter().fetch({ config: cfg, rateLimitPerMin: 0 });
    expect(raw).toEqual([]);
    clearEnv();
  });

  it("propagates 5xx / timeout as SourceHttpError", async () => {
    setEnv();
    safeGet.mockRejectedValue(new SourceHttpError("Request timed out", "timeout"));
    await expect(new UsaJobsAdapter().fetch({ config: cfg, rateLimitPerMin: 0 })).rejects.toMatchObject({ kind: "timeout" });
    clearEnv();
  });
});

// ── Jobicy ───────────────────────────────────────────────────────────────
describe("mapJobicyJob", () => {
  const job = {
    id: 152837,
    url: "https://jobicy.com/jobs/152837-product-lead-ai-platform",
    jobTitle: "Product Lead, AI Platform",
    companyName: "6sense",
    jobIndustry: ["Product & Operations"],
    jobType: ["Full-Time"],
    jobGeo: "USA",
    jobLevel: "Senior",
    jobDescription: "<p>Our Mission: multiply what matters.</p>",
    pubDate: "2026-09-08T18:50:02+00:00",
    salaryMin: 197997,
    salaryMax: 260863,
    salaryCurrency: "USD",
    salaryPeriod: "yearly",
  };

  it("maps identity, remote flag, employment type, annual salary, canonical url", () => {
    const m = mapJobicyJob(job);
    expect(m.externalId).toBe("jobicy-152837");
    expect(m.workType).toBe("Remote");
    expect(m.jobType).toBe("Full-time");
    expect(m.salaryMin).toBe(197997);
    expect(m.salaryCurrency).toBe("USD");
    expect(m.applyUrl).toBe("https://jobicy.com/jobs/152837-product-lead-ai-platform");
    expect(m.originalUrl).toBe(m.applyUrl); // canonical Jobicy URL preserved
  });

  it("does not record salary when the period is not annual, drops id/title-less rows", () => {
    const hourly = mapJobicyJob({ ...job, salaryPeriod: "hourly", salaryMin: 90, salaryMax: 120 });
    expect(hourly.salaryMin).toBeUndefined();
    expect(hourly.salaryMax).toBeUndefined();
    expect(mapJobicyJob({ jobTitle: "no id" })).toBeNull();
    expect(mapJobicyJob({ id: 1 })).toBeNull();
    const bare = mapJobicyJob({ id: 2, jobTitle: "X" });
    expect(bare.originalUrl).toBe("");
  });
});

describe("JobicyAdapter.fetch", () => {
  it("returns RawJob[] from a valid response with no credential", async () => {
    safeGet.mockResolvedValue(okBody({ jobCount: 1, jobs: [{ id: 5, jobTitle: "Eng", url: "https://jobicy.com/jobs/5" }], success: true }));
    const raw = await new JobicyAdapter().fetch({ config: { count: 50 }, rateLimitPerMin: 0 });
    expect(raw.jobs).toHaveLength(1);
    expect(raw.jobs[0].externalId).toBe("jobicy-5");
    expect(safeGet.mock.calls[0][0]).toContain("count=50");
  });

  it("propagates 429 / 5xx as SourceHttpError, wraps a raw error", async () => {
    safeGet.mockRejectedValue(new SourceHttpError("HTTP 429 from jobicy.com", "http"));
    await expect(new JobicyAdapter().fetch({ config: {}, rateLimitPerMin: 0 })).rejects.toMatchObject({ kind: "http" });
    safeGet.mockRejectedValue(new Error("ECONNRESET"));
    await expect(new JobicyAdapter().fetch({ config: {}, rateLimitPerMin: 0 })).rejects.toMatchObject({ kind: "network" });
  });

  it("an empty jobs array yields [] (not an error)", async () => {
    safeGet.mockResolvedValue(okBody({ jobs: [], success: true }));
    const raw = await new JobicyAdapter().fetch({ config: {}, rateLimitPerMin: 0 });
    expect(raw.jobs).toEqual([]);
  });

  it("runs one bounded request per configured filter", async () => {
    safeGet.mockResolvedValue(okBody({ jobs: [{ id: 1, jobTitle: "A", url: "https://jobicy.com/1" }], success: true }));
    await new JobicyAdapter().fetch({ config: { filters: [{ geo: "usa" }, { industry: "engineering" }] }, rateLimitPerMin: 0 });
    expect(safeGet).toHaveBeenCalledTimes(2);
    expect(safeGet.mock.calls[0][0]).toContain("geo=usa");
    expect(safeGet.mock.calls[1][0]).toContain("industry=engineering");
  });
});

// ── config validation ────────────────────────────────────────────────────
describe("Phase 14 — config validation", () => {
  it("themuse: valid with no config; rejects a raw key value", () => {
    expect(validateSourceConfig("themuse", {}).ok).toBe(true);
    expect(validateSourceConfig("themuse", { apiKeyRef: "sk-live-abc" }).error).toMatch(/ENV VAR NAME/);
  });

  it("usajobs: requires env-var NAMES, rejects a raw value", () => {
    expect(validateSourceConfig("usajobs", { apiKeyRef: "USAJOBS_API_KEY", userAgentRef: "USAJOBS_USER_AGENT" }).ok).toBe(true);
    expect(validateSourceConfig("usajobs", { apiKeyRef: "actual-secret-key" }).error).toMatch(/ENV VAR NAME/);
  });

  it("mapped new-source job → external applyType with preserved URL", () => {
    const fields = rawJobToJobFields(mapTheMuseJob({ id: 5, name: "Eng", refs: { landing_page: "https://x.co/5" } }), {
      _id: "s",
      name: "The Muse",
      type: "aggregator",
    });
    expect(fields.applyType).toBe("external");
    expect(fields.applyUrl).toBe("https://x.co/5");
    expect(fields.sourceName).toBe("The Muse");
  });
});
