import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../httpClient.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, safeGet: vi.fn(), throttleHost: vi.fn().mockResolvedValue(undefined) };
});

import { SmartRecruitersAdapter, smartRecruitersAdapter, mapSmartRecruitersPosting } from "../smartrecruiters.js";
import { rawJobToJobFields, getAdapter } from "../base.js";
import { safeGet } from "../httpClient.js";

const okBody = (obj) => ({ status: 200, headers: {}, body: JSON.stringify(obj), url: "x" });

const summary = { id: "744000", name: "Backend Engineer", releasedDate: "2024-07-01T09:00:00Z" };
const detail = {
  id: "744000",
  name: "Backend Engineer",
  company: { name: "Acme Inc" },
  location: { city: "Bengaluru", region: "KA", country: "India", remote: false },
  typeOfEmployment: { label: "Full-time" },
  department: { label: "Engineering" },
  function: { label: "Software Development" },
  industry: { label: "Technology" },
  postingUrl: "https://jobs.smartrecruiters.com/AcmeInc/744000-backend-engineer",
  jobAd: {
    sections: {
      jobDescription: { text: "Build backend services" },
      qualifications: { text: "5 years experience" },
      additionalInformation: { text: "Great benefits" },
    },
  },
};

// list response then per-posting detail
function mockList(content) {
  safeGet.mockImplementation((url) => {
    const u = String(url || "");
    if (u.includes("/postings?")) return Promise.resolve(okBody({ content, totalFound: content.length }));
    const id = u.substring(u.lastIndexOf("/") + 1);
    if (id === "744000") return Promise.resolve(okBody(detail));
    return Promise.resolve(okBody({ id, name: "No desc posting", jobAd: { sections: {} } }));
  });
}

beforeEach(() => { safeGet.mockReset(); });

describe("mapSmartRecruitersPosting", () => {
  const m = mapSmartRecruitersPosting({ ...summary, ...detail }, { companyName: "fallback" });

  it("maps identity, title, description sections, company, location", () => {
    expect(m.externalId).toBe("744000");
    expect(m.title).toBe("Backend Engineer");
    expect(m.description).toContain("Build backend services");
    expect(m.description).toContain("5 years experience");
    expect(m.companyName).toBe("Acme Inc");
    expect(m.location).toBe("Bengaluru, KA, India");
    expect(m.country).toBe("India");
    expect(m.department).toBe("Engineering");
    expect(m.jobType).toBe("Full-time");
  });

  it("preserves postingUrl as originalUrl and applyUrl", () => {
    expect(m.originalUrl).toBe("https://jobs.smartrecruiters.com/AcmeInc/744000-backend-engineer");
    expect(m.applyUrl).toBe("https://jobs.smartrecruiters.com/AcmeInc/744000-backend-engineer");
  });

  it("never fabricates salary / skills / companyDomain", () => {
    expect(m.salaryMin).toBeUndefined();
    expect(m.skills).toEqual([]);
    expect(m.companyDomain).toBe("");
  });

  it("returns null for missing id/title and null/empty input", () => {
    expect(mapSmartRecruitersPosting({ name: "x" })).toBeNull();
    expect(mapSmartRecruitersPosting({ id: "1", name: "" })).toBeNull();
    expect(mapSmartRecruitersPosting(null)).toBeNull();
  });
});

describe("mapSmartRecruitersPosting -> rawJobToJobFields", () => {
  it("produces an external ATS job with a dedupe hash", () => {
    const fields = rawJobToJobFields(
      mapSmartRecruitersPosting({ ...summary, ...detail }),
      { _id: "sr1", name: "SmartRecruiters", type: "ats" }
    );
    expect(fields.applyType).toBe("external");
    expect(fields.sourceType).toBe("ats");
    expect(fields.dedupeHash).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe("SmartRecruitersAdapter", () => {
  it("is registered with the shared adapter registry", () => {
    expect(getAdapter("smartrecruiters")).toBe(smartRecruitersAdapter);
  });

  it("validates the companyId configuration", () => {
    const a = new SmartRecruitersAdapter();
    expect(() => a.baseUrlFor({ config: {} })).toThrow(/companyId is required/);
    expect(() => a.baseUrlFor({ config: { companyId: "bad/id" } })).toThrow(/invalid companyId/);
    expect(a.baseUrlFor({ config: { companyId: "AcmeInc" } }).base).toBe("https://api.smartrecruiters.com");
  });

  it("fetch(): lists then fetches detail, keeping only postings with a description", async () => {
    mockList([summary, { id: "999", name: "Other" }]);
    const raw = await new SmartRecruitersAdapter().fetch({ config: { companyId: "AcmeInc" }, rateLimitPerMin: 0 });
    expect(raw).toHaveLength(1);
    expect(raw[0].externalId).toBe("744000");
  });

  it("fetch(): returns [] for an empty company without error", async () => {
    safeGet.mockResolvedValue(okBody({ content: [] }));
    const raw = await new SmartRecruitersAdapter().fetch({ config: { companyId: "AcmeInc" }, rateLimitPerMin: 0 });
    expect(raw).toEqual([]);
  });

  it("fetch(): throws on a malformed list response shape", async () => {
    safeGet.mockResolvedValue(okBody({ jobs: [] }));
    await expect(
      new SmartRecruitersAdapter().fetch({ config: { companyId: "AcmeInc" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/unexpected list shape/);
  });

  it("fetch(): non-JSON list body → response error", async () => {
    safeGet.mockResolvedValue({ status: 200, headers: {}, body: "<html>", url: "x" });
    await expect(
      new SmartRecruitersAdapter().fetch({ config: { companyId: "AcmeInc" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/not valid JSON/);
  });

  it("fetch(): a network/timeout error on the list call propagates", async () => {
    safeGet.mockRejectedValue(new Error("ETIMEDOUT"));
    await expect(
      new SmartRecruitersAdapter().fetch({ config: { companyId: "AcmeInc" }, rateLimitPerMin: 0 })
    ).rejects.toThrow(/ETIMEDOUT/);
  });

  it("fetch(): missing config throws before any HTTP call", async () => {
    await expect(
      new SmartRecruitersAdapter().fetch({ config: {}, rateLimitPerMin: 0 })
    ).rejects.toThrow(/companyId is required/);
    expect(safeGet).not.toHaveBeenCalled();
  });
});
