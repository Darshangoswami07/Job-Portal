import { describe, it, expect } from "vitest";
import { computeDedupeFields, seniorityBucket } from "../dedupe.js";

const hash = (job) => computeDedupeFields(job).dedupeHash;

const base = {
  title: "Software Engineer",
  companyName: "Acme",
  location: "Bengaluru",
  remoteType: "onsite",
  jobType: "Full-time",
};

describe("seniorityBucket", () => {
  it("buckets common seniority tokens", () => {
    expect(seniorityBucket("Senior Backend Engineer")).toBe("senior");
    expect(seniorityBucket("Sr. Data Scientist")).toBe("senior");
    expect(seniorityBucket("Software Engineering Intern")).toBe("intern");
    expect(seniorityBucket("Junior Developer")).toBe("junior");
    expect(seniorityBucket("Principal Architect")).toBe("principal");
    expect(seniorityBucket("Engineering Lead")).toBe("lead");
    expect(seniorityBucket("Software Engineer")).toBe("");
  });
});

describe("dedupe guards — conflicting signals must NOT merge", () => {
  it("Senior vs non-senior → different hash", () => {
    expect(hash({ ...base, title: "Senior Software Engineer" })).not.toBe(hash(base));
  });

  it("different city → different hash", () => {
    expect(hash({ ...base, location: "London" })).not.toBe(hash(base));
  });

  it("remote vs onsite → different hash", () => {
    expect(hash({ ...base, location: "Remote", remoteType: "remote" })).not.toBe(hash(base));
  });

  it("full-time vs contract → different hash", () => {
    expect(hash({ ...base, jobType: "Contract" })).not.toBe(hash(base));
  });

  it("different company → different hash", () => {
    expect(hash({ ...base, companyName: "Globex" })).not.toBe(hash(base));
  });
});

describe("dedupe — genuinely-equivalent postings DO merge", () => {
  it("same vacancy described slightly differently → same hash", () => {
    const a = hash({
      title: "Sr. Software Engineer",
      companyName: "Acme, Inc.",
      location: "Bengaluru, India",
      remoteType: "onsite",
      jobType: "Full-time",
    });
    const b = hash({
      title: "Senior Software Engineer",
      companyName: "Acme Inc",
      location: "Bengaluru, India",
      remoteType: "onsite",
      jobType: "Full-time",
    });
    expect(a).toBe(b);
  });

  it("unknown seniority / employment type still group with each other", () => {
    expect(hash(base)).toBe(hash({ ...base }));
    const noType = { ...base, jobType: "" };
    expect(hash(noType)).toBe(hash({ ...noType }));
  });
});
