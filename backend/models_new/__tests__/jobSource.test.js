import { describe, it, expect } from "vitest";
import { JobSource } from "../JobSource.js";

describe("JobSource model", () => {
  it("requires key, name and type", () => {
    const err = new JobSource({}).validateSync();
    expect(err).toBeDefined();
    expect(err.errors.key).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.type).toBeDefined();
  });

  it("rejects an unknown type", () => {
    const err = new JobSource({ key: "x", name: "X", type: "scraper" }).validateSync();
    expect(err?.errors?.type).toBeDefined();
  });

  it("accepts a valid source and applies safe defaults", () => {
    const src = new JobSource({ key: "greenhouse:acme", name: "Acme (Greenhouse)", type: "ats" });
    expect(src.validateSync()).toBeUndefined();
    expect(src.enabled).toBe(false);
    expect(src.lastSyncStatus).toBe("never");
    expect(src.schedule).toBe(""); // empty = use per-adapter default cadence (Phase 13)
    expect(src.rateLimitPerMin).toBe(60);
  });

  it("resolves a credential only from the environment, by name", () => {
    const src = new JobSource({
      key: "adzuna:in",
      name: "Adzuna",
      type: "aggregator",
      credentialRef: "TEST_ADZUNA_KEY",
    });
    expect(src.resolveCredential({})).toBe("");
    expect(src.hasCredential({})).toBe(false);
    expect(src.resolveCredential({ TEST_ADZUNA_KEY: "secret-value" })).toBe("secret-value");
    expect(src.hasCredential({ TEST_ADZUNA_KEY: "secret-value" })).toBe(true);
  });

  it("never persists a raw credential value on the document", () => {
    const src = new JobSource({
      key: "x:y",
      name: "Y",
      type: "partner",
      credentialRef: "SOME_SECRET",
    });
    const json = JSON.stringify(src.toObject());
    expect(json).not.toContain("secret");
    expect(src.toObject()).not.toHaveProperty("credential");
  });
});
