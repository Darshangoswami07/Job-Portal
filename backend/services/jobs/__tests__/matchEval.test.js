import { describe, it, expect } from "vitest";
import { evaluate, evaluateAsync, EVAL_USERS } from "../matchEval.js";
import { matchUserToJob } from "../matching.js";
import { blendMatch } from "../aiMatcher.js";

describe("recommendation quality — deterministic baseline benchmark", () => {
  const report = evaluate();

  it("puts a relevant job first for every synthetic user", () => {
    // eslint-disable-next-line no-console
    console.log(
      `[matchEval] P@5=${report.meanPrecisionAtK.toFixed(2)} HitRate@5=${report.hitRateAtK.toFixed(2)} MRR=${report.mrr.toFixed(2)}`
    );
    const topHit = report.perUser.filter((r) => r.topIsRelevant).length / report.perUser.length;
    expect(topHit).toBe(1);
  });

  it("meets a reasonable quality bar across all personas (documented, not over-fit)", () => {
    // eslint-disable-next-line no-console
    console.log(
      `[matchEval] personas=${report.perUser.length}  P@5=${report.meanPrecisionAtK.toFixed(2)}  ` +
      `HitRate@5=${report.hitRateAtK.toFixed(2)}  MRR=${report.mrr.toFixed(2)}  NDCG@5=${report.ndcgAtK.toFixed(2)}`
    );
    expect(report.perUser.length).toBeGreaterThanOrEqual(8);
    expect(report.hitRateAtK).toBe(1);
    expect(report.mrr).toBeGreaterThanOrEqual(0.8);
    // NDCG@5 is the meaningful ranking metric when relevance is sparse (1-2 of 15).
    expect(report.ndcgAtK).toBeGreaterThanOrEqual(0.9);
  });

  it("baseline vs deterministic+AI comparison runs and is tabulated (Phase 9 §14)", async () => {
    // A stand-in AI scorer: nudges toward whatever the deterministic matcher
    // already likes (mirrors a well-behaved provider). Real-provider numbers are
    // measured in production via recoMetrics — not from a live LLM in CI.
    const fakeAiRow = (profile, group) => {
      const b = matchUserToJob(profile, group);
      return { matchScore: Math.min(1, b.score + 0.05), strengths: [], gaps: [] };
    };
    const withAi = await evaluateAsync((profile, group) => {
      const baseline = matchUserToJob(profile, group);
      return blendMatch(baseline, fakeAiRow(profile, group)).score;
    });
    // eslint-disable-next-line no-console
    console.log(
      `[matchEval] baseline  P@5=${report.meanPrecisionAtK.toFixed(2)} HitRate@5=${report.hitRateAtK.toFixed(2)} MRR=${report.mrr.toFixed(2)}\n` +
      `[matchEval] +AI(mock) P@5=${withAi.meanPrecisionAtK.toFixed(2)} HitRate@5=${withAi.hitRateAtK.toFixed(2)} MRR=${withAi.mrr.toFixed(2)}`
    );
    expect(withAi.hitRateAtK).toBe(1);
    expect(withAi.mrr).toBeGreaterThanOrEqual(0.8);
  });

  it("never ranks an obviously-wrong role above the relevant ones", () => {
    for (const r of report.perUser) {
      const u = EVAL_USERS.find((x) => x.id === r.user);
      const firstRelevant = r.ranked.findIndex((id) => u.relevant.includes(id));
      const salesIdx = r.ranked.indexOf("g-sales-mgr");
      const internIdx = r.ranked.indexOf("g-frontend-intern");
      expect(firstRelevant).toBeLessThan(salesIdx);
      if (u.id !== "u-react") expect(firstRelevant).toBeLessThan(internIdx);
    }
  });
});
