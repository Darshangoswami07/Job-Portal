import { describe, it, expect, beforeEach } from "vitest";
import {
  checkAiQuality,
  isAiQualityTripped,
  aiQualitySnapshot,
  clearAiQualityGuard,
} from "../aiQualityGuard.js";
import { isAiSuppressed, isAiEnabled, registerMatchProvider, clearMatchProvider } from "../aiMatcher.js";

beforeEach(() => {
  clearAiQualityGuard();
  clearMatchProvider();
  delete process.env.AI_RECOMMENDATIONS_ENABLED;
});

describe("AI quality regression guard", () => {
  it("stays open when AI == deterministic (aiRowFor returns null)", async () => {
    const snap = await checkAiQuality(async () => null);
    expect(snap.tripped).toBe(false);
    expect(isAiQualityTripped()).toBe(false);
    expect(isAiSuppressed()).toBe(false);
    expect(snap.baseline).toBeTruthy();
    expect(snap.ai).toBeTruthy();
  });

  it("trips + suppresses AI when the AI strategy is materially worse", async () => {
    // an AI that drags every score toward zero → ranking collapses
    const snap = await checkAiQuality(async () => ({ matchScore: 0.01 }));
    expect(snap.tripped).toBe(true);
    expect(snap.reason).toMatch(/dropped/);
    expect(isAiSuppressed()).toBe(true);
  });

  it("suppression makes isAiEnabled() false even with flag + provider", async () => {
    process.env.AI_RECOMMENDATIONS_ENABLED = "true";
    registerMatchProvider(async () => []);
    expect(isAiEnabled()).toBe(true);
    await checkAiQuality(async () => ({ matchScore: 0 }));
    expect(isAiEnabled()).toBe(false); // guard tripped → suppressed
  });

  it("clearAiQualityGuard re-opens it", async () => {
    await checkAiQuality(async () => ({ matchScore: 0 }));
    expect(isAiQualityTripped()).toBe(true);
    clearAiQualityGuard();
    expect(isAiQualityTripped()).toBe(false);
    expect(isAiSuppressed()).toBe(false);
  });

  it("a provider error inside the check is treated as no-AI (never throws)", async () => {
    const snap = await checkAiQuality(async () => { throw new Error("boom"); });
    expect(snap.tripped).toBe(false);
  });

  it("snapshot carries the threshold and never a secret", () => {
    const s = aiQualitySnapshot();
    expect(s).toHaveProperty("threshold");
    expect(JSON.stringify(s)).not.toMatch(/sk-|Bearer /);
  });
});
