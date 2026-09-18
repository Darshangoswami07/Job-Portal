import { describe, it, expect } from "vitest";
import {
  BaseSourceAdapter,
  registerAdapter,
  getAdapter,
  listAdapters,
  resolveSourceCredential,
  rawJobToJobFields,
} from "../base.js";

describe("adapter registry", () => {
  it("registers and retrieves adapters by name", () => {
    class Dummy extends BaseSourceAdapter {}
    const dummy = new Dummy({ name: "dummy-test", type: "feed" });
    registerAdapter(dummy);
    expect(getAdapter("dummy-test")).toBe(dummy);
    expect(listAdapters()).toContain("dummy-test");
  });

  it("BaseSourceAdapter.fetch throws until implemented", async () => {
    const a = new BaseSourceAdapter({ name: "unimpl", type: "ats" });
    await expect(a.fetch({})).rejects.toThrow(/not implemented/i);
  });
});

describe("resolveSourceCredential", () => {
  it("reads the env var named by credentialRef, never a stored value", () => {
    const source = { credentialRef: "MY_SOURCE_TOKEN" };
    expect(resolveSourceCredential(source, {})).toBe("");
    expect(resolveSourceCredential(source, { MY_SOURCE_TOKEN: "tok" })).toBe("tok");
    expect(resolveSourceCredential({}, { MY_SOURCE_TOKEN: "tok" })).toBe("");
  });
});

describe("rawJobToJobFields", () => {
  const source = { _id: "src1", name: "Acme (Greenhouse)", type: "ats" };

  it("maps a raw ATS job to Job fields, marking it external", () => {
    const fields = rawJobToJobFields(
      {
        externalId: "gh-999",
        title: "Sr. Platform Engineer",
        description: "x".repeat(50),
        companyName: "Acme",
        companyWebsite: "https://acme.com",
        location: "Remote, US",
        applyUrl: "https://boards.greenhouse.io/acme/jobs/999?utm_source=x",
        postedAt: "2024-07-01T00:00:00Z",
      },
      source
    );

    expect(fields.applyType).toBe("external");
    expect(fields.sourceName).toBe("Acme (Greenhouse)");
    expect(fields.externalId).toBe("gh-999");
    expect(fields.remoteType).toBe("remote");
    expect(fields.normalizedTitle).toBe("senior platform engineer");
    expect(fields.normalizedCompany).toBe("acme");
    expect(fields.applyUrl).toBe(
      "https://boards.greenhouse.io/acme/jobs/999?utm_source=x"
    );
    expect(fields.canonicalUrl).toBe("https://boards.greenhouse.io/acme/jobs/999");
    expect(fields.dedupeHash).toMatch(/^[0-9a-f]{40}$/);
    expect(fields.companyDomain).toBe("acme.com");
    expect(fields.postedAt).toBeInstanceOf(Date);
  });

  it("never fabricates missing data", () => {
    const fields = rawJobToJobFields(
      { externalId: "gh-1", title: "Engineer", companyName: "Acme", location: "Pune" },
      source
    );
    expect(fields.salaryMin).toBeUndefined();
    expect(fields.salaryMax).toBeUndefined();
    expect(fields.country).toBeUndefined();
    expect(fields.jobType).toBeUndefined();
    expect(fields.applyUrl).toBe(""); // no valid URL supplied
    expect(fields.remoteType).toBe("unknown");
  });

  it("treats an internal source as internal apply", () => {
    const fields = rawJobToJobFields(
      { externalId: "1", title: "Engineer", companyName: "Us", location: "Pune" },
      { _id: "int", name: "Internal", type: "internal" }
    );
    expect(fields.applyType).toBe("internal");
  });
});
