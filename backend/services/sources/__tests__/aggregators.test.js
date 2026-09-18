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

import { AdzunaAdapter, mapAdzunaJob, ADZUNA_ADAPTER } from "../adzuna.js";
import { JSearchAdapter, mapJSearchJob, JSEARCH_ADAPTER } from "../jsearch.js";
import { JoobleAdapter, mapJoobleJob, JOOBLE_ADAPTER } from "../jooble.js";
import { getAdapter, rawJobToJobFields } from "../base.js";
import { safeGet, safeRequest } from "../httpClient.js";

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });

beforeEach(() => {
  safeGet.mockReset();
  safeRequest.mockReset();
});

describe("adapter registration", () => {
  it("all three aggregator adapters are registered", () => {
    expect(getAdapter(ADZUNA_ADAPTER)?.type).toBe("aggregator");
    expect(getAdapter(JSEARCH_ADAPTER)?.type).toBe("aggregator");
    expect(getAdapter(JOOBLE_ADAPTER)?.type).toBe("aggregator");
  });
});

describe("mapAdzunaJob", () => {
  const job = {
    id: 555,
    title: "Backend Engineer",
    description: "<p>Build APIs</p>",
    company: { display_name: "Acme" },
    location: { display_name: "Bengaluru, India" },
    salary_min: 1200000,
    salary_max: 2000000,
    redirect_url: "https://www.adzuna.in/details/555",
    created: "2024-06-01T00:00:00Z",
    category: { label: "IT Jobs" },
  };
  const m = mapAdzunaJob(job, { country: "in" });

  it("maps id, title, company, location, url, salary, date", () => {
    expect(m.externalId).toBe("adzuna-555");
    expect(m.title).toBe("Backend Engineer");
    expect(m.companyName).toBe("Acme");
    expect(m.location).toBe("Bengaluru, India");
    expect(m.originalUrl).toBe("https://www.adzuna.in/details/555");
    expect(m.applyUrl).toBe("https://www.adzuna.in/details/555");
    expect(m.salaryMin).toBe(1200000);
    expect(m.salaryMax).toBe(2000000);
    expect(m.postedAt).toBe("2024-06-01T00:00:00Z");
  });
  it("does not fabricate a missing salary or url", () => {
    const bare = mapAdzunaJob({ id: 1, title: "X" });
    expect(bare.salaryMin).toBeUndefined();
    expect(bare.originalUrl).toBe("");
    expect(mapAdzunaJob({ title: "no id" })).toBeNull();
  });
});

describe("mapJSearchJob", () => {
  const job = {
    job_id: "abc123",
    job_title: "Frontend Developer",
    job_description: "<div>React</div>",
    employer_name: "Globex",
    job_city: "Pune",
    job_state: "MH",
    job_country: "IN",
    job_min_salary: 800000,
    job_max_salary: 1500000,
    job_salary_currency: "INR",
    job_employment_type: "FULLTIME",
    job_is_remote: true,
    job_apply_link: "https://globex.com/careers/abc123",
    job_posted_at_datetime_utc: "2024-05-20T12:00:00Z",
  };
  const m = mapJSearchJob(job);

  it("maps identity, company, location, salary, employment type, remote, url", () => {
    expect(m.externalId).toBe("jsearch-abc123");
    expect(m.companyName).toBe("Globex");
    expect(m.location).toBe("Pune, MH, IN");
    expect(m.salaryMin).toBe(800000);
    expect(m.salaryCurrency).toBe("INR");
    expect(m.jobType).toBe("Full-time");
    expect(m.workType).toBe("Remote");
    expect(m.applyUrl).toBe("https://globex.com/careers/abc123");
  });
  it("drops rows with no id / title and does not invent data", () => {
    expect(mapJSearchJob({ job_title: "x" })).toBeNull();
    const bare = mapJSearchJob({ job_id: "x", job_title: "X" });
    expect(bare.salaryMin).toBeUndefined();
    expect(bare.applyUrl).toBe("");
  });
});

describe("mapJoobleJob", () => {
  const m = mapJoobleJob({
    id: 987,
    title: "Data Scientist",
    company: "Initech",
    location: "Remote",
    snippet: "<b>ML</b> models",
    salary: "₹20,00,000 - ₹30,00,000",
    link: "https://jooble.org/away/987",
    updated: "2024-06-10T00:00:00Z",
  });

  it("maps identity, company, url, date; derives a stable id when missing", () => {
    expect(m.externalId).toBe("jooble-987");
    expect(m.companyName).toBe("Initech");
    expect(m.applyUrl).toBe("https://jooble.org/away/987");
    const noId = mapJoobleJob({ title: "T", company: "C", link: "https://x.co/1" });
    expect(noId.externalId).toMatch(/^jooble-[0-9a-f]{16}$/);
    expect(mapJoobleJob({ company: "no title" })).toBeNull();
  });
});

describe("adapter.fetch — credentials + no direct persistence", () => {
  it("Adzuna throws a config error when credentials are absent", async () => {
    await expect(
      new AdzunaAdapter().fetch({ config: { appIdRef: "NOPE_ID", appKeyRef: "NOPE_KEY" }, rateLimitPerMin: 0 })
    ).rejects.toMatchObject({ kind: "config" });
  });

  it("JSearch resolves credentials from env by NAME only and returns RawJob[] (no DB write)", async () => {
    process.env.__TEST_RAPID = "secret-key";
    safeGet.mockResolvedValue(
      okBody({ data: [{ job_id: "1", job_title: "Engineer", job_apply_link: "https://x.co/1" }] })
    );
    const raw = await new JSearchAdapter().fetch({
      config: { apiKeyRef: "__TEST_RAPID", queries: ["engineer"] },
      rateLimitPerMin: 0,
    });
    expect(Array.isArray(raw)).toBe(true);
    expect(raw[0].externalId).toBe("jsearch-1");
    // header carried the key, value never in the returned data
    expect(JSON.stringify(raw)).not.toContain("secret-key");
    delete process.env.__TEST_RAPID;
  });

  it("Jooble uses POST and scrubs the key from any error message", async () => {
    process.env.__TEST_JOOBLE = "j-secret";
    safeRequest.mockRejectedValue(new Error("boom https://jooble.org/api/j-secret failed"));
    await expect(
      new JoobleAdapter().fetch({ config: { apiKeyRef: "__TEST_JOOBLE", queries: ["x"] }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/\*\*\*/);
    delete process.env.__TEST_JOOBLE;
  });

  it("mapped aggregator job → rawJobToJobFields marks it external with preserved URL", () => {
    const fields = rawJobToJobFields(mapAdzunaJob({ id: 9, title: "Engineer", redirect_url: "https://a.co/9" }, {}), {
      _id: "s",
      name: "Adzuna",
      type: "aggregator",
    });
    expect(fields.applyType).toBe("external");
    expect(fields.applyUrl).toBe("https://a.co/9");
    expect(fields.sourceName).toBe("Adzuna");
  });
});
