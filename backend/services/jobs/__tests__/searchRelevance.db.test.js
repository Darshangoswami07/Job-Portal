import { describe, it, expect, beforeEach } from "vitest";

import { useTestDb } from "../../../test/mongo.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { BENCHMARK_JOBS, evaluate } from "../searchEval.js";

useTestDb();

// Seed the synthetic benchmark catalogue as JobGroups.
beforeEach(async () => {
  await JobGroup.createIndexes(); // ensure the $text index exists before we query
  const base = Date.now();
  await JobGroup.insertMany(
    BENCHMARK_JOBS.map((j, i) => ({
      dedupeHash: j.id,
      displayTitle: j.title,
      companyName: j.company,
      normalizedCompany: j.company.toLowerCase(),
      descriptionPreview: j.description,
      skills: j.skills,
      status: "active",
      remoteType: "onsite",
      // vary postedAt so a recency-only sort has a defined (unhelpful) order
      postedAt: new Date(base - i * 60000),
    }))
  );
});

/** What a relevance-aware search does: `$text` match ordered by textScore. */
async function textScoreSearch(q) {
  const rows = await JobGroup.find(
    { status: "active", $text: { $search: q } },
    { score: { $meta: "textScore" }, dedupeHash: 1 }
  )
    .sort({ score: { $meta: "textScore" } })
    .lean();
  return rows.map((r) => r.dedupeHash);
}

describe("MongoDB $text relevance (empirical baseline)", () => {
  it("ranks related jobs ahead of unrelated ones for 'react developer'", async () => {
    const ranked = await textScoreSearch("react developer");
    expect(ranked.length).toBeGreaterThan(0);
    // both React roles should be present and ahead of the data analyst
    expect(ranked.slice(0, 3)).toEqual(expect.arrayContaining(["react-dev"]));
    const analystPos = ranked.indexOf("data-analyst");
    const reactPos = ranked.indexOf("react-dev");
    if (analystPos !== -1) expect(reactPos).toBeLessThan(analystPos);
  });

  it("does not surface the internship first for 'senior software engineer'", async () => {
    const ranked = await textScoreSearch("senior software engineer");
    if (ranked.includes("se-senior") && ranked.includes("se-intern")) {
      expect(ranked.indexOf("se-senior")).toBeLessThan(ranked.indexOf("se-intern"));
    }
  });

  it("scores acceptably on the whole benchmark (documented, not asserted hard)", async () => {
    const report = await evaluate(textScoreSearch, { k: 3 });
    // Every query should put a related result at position 1.
    const topHitRate = report.perQuery.filter((r) => r.topIsRelevant).length / report.perQuery.length;
    // eslint-disable-next-line no-console
    console.log(
      `[searchEval] $text  meanP@3=${report.meanP.toFixed(2)}  MRR=${report.mrr.toFixed(2)}  topHitRate=${topHitRate.toFixed(2)}`
    );
    expect(topHitRate).toBeGreaterThanOrEqual(0.7);
    expect(report.mrr).toBeGreaterThan(0.5);
  });
});
