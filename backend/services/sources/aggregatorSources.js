/**
 * Registration helpers for the non-ATS ("aggregator" / "feed") job sources.
 *
 * These JobSources are created DISABLED. An operator enables the ones that are
 * ready (credentials present, or no credential required) via
 * `scripts/setup-aggregator-sources.js`. No secrets are stored — only the
 * env-var names in `config.*Ref`.
 */
import { JobSource } from "../../models_new/JobSource.js";
import { ADZUNA_ADAPTER } from "./adzuna.js";
import { JSEARCH_ADAPTER } from "./jsearch.js";
import { JOOBLE_ADAPTER } from "./jooble.js";
import { THEMUSE_ADAPTER } from "./themuse.js";
import { USAJOBS_ADAPTER } from "./usajobs.js";
import { JOBICY_ADAPTER } from "./jobicy.js";

export const AGGREGATOR_DEFS = [
  {
    key: "adzuna",
    name: "Adzuna",
    type: "aggregator",
    adapter: ADZUNA_ADAPTER,
    rateLimitPerMin: 20,
    schedule: "0 */6 * * *", // every 6h
    config: { appIdRef: "ADZUNA_APP_ID", appKeyRef: "ADZUNA_APP_KEY", country: "in", pages: 1 },
    credentialEnvs: ["ADZUNA_APP_ID", "ADZUNA_APP_KEY"],
  },
  {
    key: "jsearch",
    name: "JSearch",
    type: "aggregator",
    adapter: JSEARCH_ADAPTER,
    rateLimitPerMin: 10,
    schedule: "30 */12 * * *", // twice a day (quota-sensitive)
    config: { apiKeyRef: "RAPIDAPI_KEY", numPages: 1, country: "India" },
    credentialEnvs: ["RAPIDAPI_KEY"],
  },
  {
    key: "jooble",
    name: "Jooble",
    type: "aggregator",
    adapter: JOOBLE_ADAPTER,
    rateLimitPerMin: 20,
    schedule: "15 */6 * * *",
    config: { apiKeyRef: "JOOBLE_API_KEY", location: "India" },
    credentialEnvs: ["JOOBLE_API_KEY"],
  },
  {
    key: "themuse",
    name: "The Muse",
    type: "aggregator",
    adapter: THEMUSE_ADAPTER,
    rateLimitPerMin: 20,
    schedule: "0 */3 * * *", // every 3h
    // The api_key is OPTIONAL — anonymous access works. The ref only names an
    // env var; if unset the adapter simply omits it.
    config: { apiKeyRef: "THE_MUSE_API_KEY", pages: 3 },
    credentialEnvs: [], // none required
  },
  {
    key: "jobicy",
    name: "Jobicy",
    type: "aggregator",
    adapter: JOBICY_ADAPTER,
    rateLimitPerMin: 15,
    schedule: "0 */6 * * *",
    config: { count: 100 },
    credentialEnvs: [], // none required
  },
  {
    key: "usajobs",
    name: "USAJOBS",
    type: "feed",
    adapter: USAJOBS_ADAPTER,
    rateLimitPerMin: 30,
    schedule: "0 */6 * * *",
    config: { apiKeyRef: "USAJOBS_API_KEY", userAgentRef: "USAJOBS_USER_AGENT", pages: 1 },
    credentialEnvs: ["USAJOBS_API_KEY", "USAJOBS_USER_AGENT"],
  },
];

export function aggregatorHasCredentials(def, env = process.env) {
  return (def.credentialEnvs || []).every((name) => Boolean(env[name]));
}

/** Idempotently ensure a JobSource row exists for each source (disabled). */
export async function ensureAggregatorSources() {
  const out = [];
  for (const def of AGGREGATOR_DEFS) {
    const doc = await JobSource.findOneAndUpdate(
      { key: def.key },
      {
        $set: {
          name: def.name,
          type: def.type || "aggregator",
          adapter: def.adapter,
          rateLimitPerMin: def.rateLimitPerMin,
          schedule: def.schedule,
          credentialRef: "",
        },
        $setOnInsert: { key: def.key, enabled: false, config: def.config },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    out.push(doc);
  }
  return out;
}
