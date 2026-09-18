import { describe, it, expect } from "vitest";
import {
  normalizeTitle,
  normalizeCompany,
  normalizeLocation,
  detectRemoteType,
  stripTrackingParams,
  isHttpUrl,
  extractDomain,
  collapseWhitespace,
} from "../normalize.js";

describe("normalizeTitle", () => {
  it("lowercases, collapses whitespace and expands abbreviations", () => {
    expect(normalizeTitle("  Sr.   Software    Engineer ")).toBe("senior software engineer");
    expect(normalizeTitle("Jr Backend Dev")).toBe("junior backend developer");
  });

  it("drops trailing requisition ids", () => {
    expect(normalizeTitle("Backend Engineer (REQ-12345)")).toBe("backend engineer");
    expect(normalizeTitle("Data Analyst #4821")).toBe("data analyst");
  });

  it("is null-safe", () => {
    expect(normalizeTitle(null)).toBe("");
    expect(normalizeTitle(undefined)).toBe("");
  });
});

describe("normalizeCompany", () => {
  it("reduces to lowercase alphanumerics", () => {
    expect(normalizeCompany("Acme, Inc.")).toBe("acmeinc");
    expect(normalizeCompany("  Google ")).toBe("google");
    expect(normalizeCompany(null)).toBe("");
  });
});

describe("normalizeLocation", () => {
  it("keeps a normalized city string", () => {
    expect(normalizeLocation("Bangalore, India")).toBe("bangalore, india");
  });
  it("collapses a remote location to 'remote'", () => {
    expect(normalizeLocation("Remote")).toBe("remote");
    expect(normalizeLocation("", { remoteType: "remote" })).toBe("remote");
    expect(normalizeLocation("Anywhere")).toBe("remote");
  });
});

describe("detectRemoteType", () => {
  it("prefers explicit structured workType", () => {
    expect(detectRemoteType({ workType: "Remote" })).toBe("remote");
    expect(detectRemoteType({ workType: "Hybrid" })).toBe("hybrid");
    expect(detectRemoteType({ workType: "On-site" })).toBe("onsite");
  });
  it("treats an on-site + remoteFriendly job as hybrid", () => {
    expect(detectRemoteType({ workType: "On-site", remoteFriendly: true })).toBe("hybrid");
  });
  it("falls back to keyword sniffing", () => {
    expect(detectRemoteType({ location: "Remote - US" })).toBe("remote");
    expect(detectRemoteType({ description: "This is a hybrid role" })).toBe("hybrid");
    expect(detectRemoteType({ location: "In-office, Pune" })).toBe("onsite");
  });
  it("returns 'unknown' with no signal", () => {
    expect(detectRemoteType({})).toBe("unknown");
    expect(detectRemoteType({ location: "Pune" })).toBe("unknown");
  });
});

describe("stripTrackingParams", () => {
  it("removes utm/tracking params and fragments", () => {
    expect(stripTrackingParams("https://x.com/job?utm_source=li&id=5#top")).toBe(
      "https://x.com/job?id=5"
    );
    expect(stripTrackingParams("https://x.com/job?gh_src=abc")).toBe("https://x.com/job");
  });
  it("returns '' for non-http(s) or invalid URLs", () => {
    expect(stripTrackingParams("not a url")).toBe("");
    expect(stripTrackingParams("ftp://x.com")).toBe("");
    expect(stripTrackingParams("")).toBe("");
  });
});

describe("isHttpUrl / extractDomain / collapseWhitespace", () => {
  it("isHttpUrl", () => {
    expect(isHttpUrl("https://a.com")).toBe(true);
    expect(isHttpUrl("http://a.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
  });
  it("extractDomain", () => {
    expect(extractDomain("https://www.acme.com/careers")).toBe("acme.com");
    expect(extractDomain("hr@acme.com")).toBe("acme.com");
    expect(extractDomain("acme.com")).toBe("acme.com");
    expect(extractDomain("")).toBe("");
  });
  it("collapseWhitespace", () => {
    expect(collapseWhitespace("  a   b  ")).toBe("a b");
    expect(collapseWhitespace(null)).toBe("");
  });
});
