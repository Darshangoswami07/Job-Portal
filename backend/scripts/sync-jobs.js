/**
 * Manual reconciliation sync of JobSources. NOT a scheduler — run by hand.
 * The background worker (`npm run worker`) always runs in "incremental" mode.
 *
 * Usage (from backend/):
 *   npm run sync:jobs                                        # every enabled source, incremental
 *   npm run sync:jobs -- --source=greenhouse:acme            # one source by key
 *   npm run sync:jobs -- --source=adzuna --mode=backfill     # operator backfill (larger, bounded)
 *   npm run sync:jobs -- --mode=backfill --sources=adzuna,jobicy,themuse
 *
 * `--mode=backfill` uses each adapter's larger bounded window (more keywords /
 * pages / filters) and disables the "unseen → expire" sweep — it is a partial
 * window, not a full re-listing. Still rate-limited and hard-capped.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { runAllSyncs, runSourceSync } from "../services/jobs/sync.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  })
);
const mode = args.mode === "backfill" ? "backfill" : "incremental";
const keys = args.source
  ? [String(args.source)]
  : typeof args.sources === "string"
    ? args.sources.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

const run = async () => {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("No database connection (check MONGO_URI). Aborting.");
    process.exit(1);
  }

  let results;
  if (keys) {
    results = [];
    for (const k of keys) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await runSourceSync(k, { mode }));
    }
  } else if (mode === "backfill") {
    console.error("Refusing a catalogue-wide backfill. Pass --source=<key> or --sources=a,b,c.");
    process.exit(1);
  } else {
    results = await runAllSyncs();
  }

  console.log(JSON.stringify({ mode, results }, null, 2));
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("sync-jobs failed:", err);
  process.exit(1);
});
