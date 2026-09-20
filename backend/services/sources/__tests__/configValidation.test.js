import { describe, it, expect } from "vitest";
import {
  validateSourceConfig,
  getCredentialStatus,
  sanitizeConfig,
  knownAdapters,
  adapterCatalog,
} from "../configValidation.js";

describe("validateSourceConfig", () => {
  it("rejects an unknown adapter", () => {
    expect(validateSourceConfig("scraper", {}).error).toMatch(/unknown adapter/i);
  });

  it("greenhouse requires a valid board token", () => {
    expect(validateSourceConfig("greenhouse", {}).error).toMatch(/boardToken is required/);
    expect(validateSourceConfig("greenhouse", { boardToken: "bad token!" }).error).toMatch(/invalid board token/);
    expect(validateSourceConfig("greenhouse", { boardToken: "acme" }).ok).toBe(true);
  });

  it("aggregator credential refs must be ENV VAR NAMES, not values", () => {
    expect(validateSourceConfig("adzuna", { appIdRef: "abc123secret" }).error).toMatch(/ENV VAR NAME/);
    expect(validateSourceConfig("jooble", { apiKeyRef: "JOOBLE_API_KEY" }).ok).toBe(true);
  });

  it("rejects a baseUrl override (SSRF surface)", () => {
    expect(validateSourceConfig("greenhouse", { boardToken: "a", baseUrl: "http://evil" }).error).toMatch(
      /baseUrl/
    );
  });

  it("rejects an invalid cron schedule in config", () => {
    expect(validateSourceConfig("greenhouse", { boardToken: "a", schedule: "nope" }).error).toMatch(/cron/i);
  });

  it("knownAdapters covers the implemented sources", () => {
    expect(knownAdapters()).toEqual(
      expect.arrayContaining([
        "internal", "greenhouse", "lever", "ashby", "smartrecruiters", "workable",
        "adzuna", "jsearch", "jooble",
      ])
    );
  });

  it("lever / ashby / smartrecruiters are unauthenticated public boards", () => {
    expect(validateSourceConfig("lever", {}).error).toMatch(/site is required/);
    expect(validateSourceConfig("lever", { site: "bad site!" }).error).toMatch(/invalid site/);
    expect(validateSourceConfig("lever", { site: "leverdemo" }).ok).toBe(true);
    expect(getCredentialStatus("lever", { site: "x" }, {}).configured).toBe(true);

    expect(validateSourceConfig("ashby", {}).error).toMatch(/jobBoardName is required/);
    expect(validateSourceConfig("ashby", { jobBoardName: "Acme" }).ok).toBe(true);
    expect(getCredentialStatus("ashby", { jobBoardName: "x" }, {}).configured).toBe(true);

    expect(validateSourceConfig("smartrecruiters", {}).error).toMatch(/companyId is required/);
    expect(validateSourceConfig("smartrecruiters", { companyId: "Acme", maxDetail: -1 }).error).toMatch(/maxDetail/);
    expect(validateSourceConfig("smartrecruiters", { companyId: "Acme" }).ok).toBe(true);
    expect(getCredentialStatus("smartrecruiters", { companyId: "x" }, {}).configured).toBe(true);
  });

  it("workable requires a subdomain + an ENV VAR NAME token ref", () => {
    expect(validateSourceConfig("workable", {}).error).toMatch(/subdomain is required/);
    expect(validateSourceConfig("workable", { subdomain: "acme", apiTokenRef: "not a name" }).error).toMatch(
      /ENV VAR NAME/
    );
    expect(validateSourceConfig("workable", { subdomain: "acme", apiTokenRef: "WORKABLE_API_TOKEN" }).ok).toBe(true);
    expect(getCredentialStatus("workable", { apiTokenRef: "WORKABLE_API_TOKEN" }, {}).configured).toBe(false);
    expect(
      getCredentialStatus("workable", { apiTokenRef: "WORKABLE_API_TOKEN" }, { WORKABLE_API_TOKEN: "v" }).configured
    ).toBe(true);
  });
});

describe("adapterCatalog", () => {
  it("exposes the new ATS adapters with config-field descriptors and no secret values", () => {
    const byName = Object.fromEntries(adapterCatalog().map((a) => [a.adapter, a]));
    for (const name of ["lever", "ashby", "smartrecruiters", "workable"]) {
      expect(byName[name]).toBeTruthy();
      expect(byName[name].type).toBe("ats");
      expect(byName[name].configFields.length).toBeGreaterThan(0);
    }
    expect(byName.lever.needsCredential).toBe(false);
    expect(byName.ashby.needsCredential).toBe(false);
    expect(byName.smartrecruiters.needsCredential).toBe(false);
    expect(byName.workable.needsCredential).toBe(true);
    // the workable token field is flagged secret so the UI never renders a value
    expect(byName.workable.configFields.find((f) => f.key === "apiTokenRef").secret).toBe(true);
  });
});

describe("getCredentialStatus", () => {
  it("internal / greenhouse need no credential", () => {
    expect(getCredentialStatus("internal", {}, {}).configured).toBe(true);
    expect(getCredentialStatus("greenhouse", { boardToken: "a" }, {}).configured).toBe(true);
  });

  it("aggregators report configured only when the env vars exist", () => {
    expect(getCredentialStatus("adzuna", {}, {}).configured).toBe(false);
    expect(
      getCredentialStatus("adzuna", {}, { ADZUNA_APP_ID: "x", ADZUNA_APP_KEY: "y" }).configured
    ).toBe(true);
    expect(getCredentialStatus("jsearch", { apiKeyRef: "CUSTOM_KEY" }, { CUSTOM_KEY: "v" }).configured).toBe(true);
  });
});

describe("sanitizeConfig", () => {
  it("redacts secret-ish keys but keeps public identifiers + plain config", () => {
    const out = sanitizeConfig({
      boardToken: "acme",
      appIdRef: "ADZUNA_APP_ID",
      apiKeyRef: "RAPIDAPI_KEY",
      country: "in",
      pages: 2,
    });
    expect(out.boardToken).toBe("acme");
    expect(out.country).toBe("in");
    expect(out.pages).toBe(2);
    expect(out.appIdRef).toBe("***configured***");
    expect(out.apiKeyRef).toBe("***configured***");
    expect(JSON.stringify(out)).not.toContain("ADZUNA_APP_ID");
    expect(JSON.stringify(out)).not.toContain("RAPIDAPI_KEY");
  });
});
