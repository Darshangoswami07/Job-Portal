/**
 * @deprecated (Phase 4)
 *
 * The self-contained Adzuna/JSearch/Jooble aggregator that used to fetch,
 * normalize, dedupe AND persist jobs in one place has been split into proper
 * source adapters that feed the central ingestion pipeline:
 *
 *   backend/services/sources/adzuna.js
 *   backend/services/sources/jsearch.js
 *   backend/services/sources/jooble.js
 *        ↓ fetch → RawJob
 *   backend/services/jobs/ingest.js  (single persistence boundary)
 *        ↓
 *   Job + JobGroup
 *
 * This module now only forwards to the new pipeline so old imports keep
 * working. It performs NO direct persistence. It will be removed once no
 * caller references it.
 */

/** @deprecated Use the sync worker (`npm run worker`) / `runAllSyncs()`. */
export async function aggregateJobs() {
  console.warn(
    "[deprecated] aggregateJobs(): third-party aggregation now runs through the " +
      "source-adapter + sync pipeline. Enable the adzuna/jsearch/jooble JobSources."
  );

  const { runSourceSync } = await import("./jobs/sync.js");
  const { ensureAggregatorSources, AGGREGATOR_DEFS } = await import(
    "./sources/aggregatorSources.js"
  );

  await ensureAggregatorSources();

  const results = [];
  for (const def of AGGREGATOR_DEFS) {
    // runSourceSync no-ops (skipped:"disabled") unless an operator enabled it.
    results.push(await runSourceSync(def.key));
  }

  return {
    deprecated: true,
    message:
      "aggregateJobs is deprecated. Configure credentials, enable the aggregator " +
      "JobSources, and let the background sync worker keep them fresh.",
    results,
  };
}
