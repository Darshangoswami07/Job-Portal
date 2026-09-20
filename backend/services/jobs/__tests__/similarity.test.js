import { describe, it, expect } from "vitest";
import {
  titleTokenSet,
  jaccard,
  shingleSet,
  roleFamily,
  mergeGuard,
  scoreSimilarity,
} from "../similarity.js";

const longDesc = (extra = "") =>
  `We are looking for a backend engineer to design and build resilient distributed
   services. You will own APIs, data pipelines and observability, work closely with
   product, and mentor other engineers. Requirements: strong experience with Node.js,
   databases, cloud infrastructure and testing. ${extra}`;

describe("text helpers", () => {
  it("titleTokenSet drops stopwords when enough meaningful tokens remain", () => {
    expect([...titleTokenSet("senior software engineer for the platform team")]).toEqual(
      expect.arrayContaining(["senior", "software", "engineer", "platform", "team"])
    );
    expect(titleTokenSet("senior software engineer for the platform team").has("for")).toBe(false);
    // a stopword-dominated title keeps its full token set rather than collapsing
    expect(titleTokenSet("recruiter job a").size).toBe(3);
  });

  it("jaccard is 1 for identical sets, 0 for disjoint", () => {
    expect(jaccard(new Set(["a", "b"]), new Set(["a", "b"]))).toBe(1);
    expect(jaccard(new Set(["a"]), new Set(["b"]))).toBe(0);
    expect(jaccard(new Set(), new Set(["a"]))).toBe(0);
  });

  it("shingleSet builds k-word shingles and is stable", () => {
    const a = shingleSet("the quick brown fox jumps", 3);
    expect(a.has("the quick brown")).toBe(true);
    expect(a.has("quick brown fox")).toBe(true);
    expect(shingleSet("", 3).size).toBe(0);
  });

  it("roleFamily distinguishes frontend / backend / data", () => {
    expect(roleFamily("Senior Frontend Engineer")).toBe("frontend");
    expect(roleFamily("Backend Developer")).toBe("backend");
    expect(roleFamily("Data Scientist")).toBe("data");
    expect(roleFamily("Office Manager")).toBe("");
  });
});

describe("mergeGuard", () => {
  const base = {
    title: "Software Engineer",
    normalizedTitle: "software engineer",
    normalizedLocation: "bengaluru",
    remoteType: "onsite",
    jobType: "Full-time",
    sourceId: "s1",
    externalId: "1",
  };

  it("passes for two compatible postings from different sources", () => {
    expect(mergeGuard(base, { ...base, sourceId: "s2", externalId: "9" })).toEqual([]);
  });

  it("blocks Senior vs Intern", () => {
    expect(mergeGuard({ ...base, title: "Senior Software Engineer" }, { ...base, title: "Software Engineering Intern" }))
      .toEqual(expect.arrayContaining([expect.stringMatching(/seniority/)]));
  });

  it("blocks Backend vs Frontend", () => {
    expect(mergeGuard({ ...base, title: "Backend Engineer" }, { ...base, title: "Frontend Engineer" }))
      .toEqual(expect.arrayContaining([expect.stringMatching(/role/)]));
  });

  it("blocks Bengaluru vs London", () => {
    expect(mergeGuard(base, { ...base, sourceId: "s2", normalizedLocation: "london uk" }))
      .toEqual(expect.arrayContaining([expect.stringMatching(/location/)]));
  });

  it("blocks Remote vs Onsite", () => {
    expect(mergeGuard(base, { ...base, sourceId: "s2", remoteType: "remote" }))
      .toEqual(expect.arrayContaining([expect.stringMatching(/workplace/)]));
  });

  it("blocks Full-time vs Internship", () => {
    expect(mergeGuard(base, { ...base, sourceId: "s2", jobType: "Internship" }))
      .toEqual(expect.arrayContaining([expect.stringMatching(/employment/)]));
  });

  it("blocks two postings from the SAME source with different ids", () => {
    expect(mergeGuard(base, { ...base, externalId: "2" }))
      .toEqual(expect.arrayContaining([expect.stringMatching(/same source/)]));
  });

  it("does not block when one side's workplace/seniority is unknown", () => {
    expect(mergeGuard(base, { ...base, sourceId: "s2", remoteType: "unknown", jobType: "" })).toEqual([]);
  });
});

describe("scoreSimilarity", () => {
  const a = {
    normalizedTitle: "senior backend engineer",
    title: "Senior Backend Engineer",
    description: longDesc(),
    normalizedLocation: "bengaluru",
    remoteType: "onsite",
    jobType: "Full-time",
    canonicalUrl: "https://boards.greenhouse.io/acme/jobs/1",
    sourceId: "s1",
    externalId: "1",
  };

  it("HIGH confidence when the same posting comes from two sources", () => {
    const b = {
      ...a,
      description: longDesc("Extra sentence added by the aggregator."),
      canonicalUrl: "https://jobs.lever.co/acme/2",
      sourceId: "s2",
      externalId: "2",
    };
    const r = scoreSimilarity(a, b);
    expect(r.confidence).toBe("high");
  });

  it("BLOCKED regardless of text similarity when a guard fails", () => {
    const b = { ...a, title: "Backend Engineering Intern", normalizedTitle: "backend engineering intern", sourceId: "s2", externalId: "2" };
    const r = scoreSimilarity(a, b);
    expect(r.confidence).toBe("blocked");
    expect(r.signals.blocks.length).toBeGreaterThan(0);
  });

  it("identical canonical URL forces HIGH", () => {
    const b = { ...a, description: "totally different text about something else entirely", sourceId: "s2", externalId: "2" };
    expect(scoreSimilarity(a, b).confidence).toBe("high");
  });

  it("LOW confidence for unrelated roles at the same company", () => {
    const b = {
      normalizedTitle: "office administrator",
      title: "Office Administrator",
      description: "Manage the front desk, greet visitors, order supplies and coordinate travel.",
      normalizedLocation: "bengaluru",
      remoteType: "onsite",
      sourceId: "s2",
      externalId: "2",
    };
    expect(["low", "medium"]).toContain(scoreSimilarity(a, b).confidence);
    expect(scoreSimilarity(a, b).confidence).not.toBe("high");
  });
});
