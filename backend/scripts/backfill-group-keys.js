/**
 * Phase 7 migration: populate `Job.groupKey` for rows that predate it.
 *
 * `groupKey` defaults to the deterministic `dedupeHash`. The Level-3 similarity
 * assist later repoints it for near-identical cross-source vacancies, and an
 * admin "split" resets it — this script only fills the empty ones, it never
 * overrides an existing value.
 *
 * SAFETY: dry-run by default (`--commit` to write). Never deletes anything.
 *
 * Usage (from backend/):
 *   node scripts/backfill-group-keys.js            # dry run
 *   node scripts/backfill-group-keys.js --commit
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { Job } from "../models/job.model.js";
import { rebuildGroup } from "../services/jobs/ingest.js";

const COMMIT = process.argv.includes("--commit");

async function main() {
  console.log(`\nBackfill Job.groupKey — mode: ${COMMIT ? "COMMIT" : "DRY RUN"}`);
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("No database connection. Aborting.");
    process.exit(1);
  }

  const filter = {
    dedupeHash: { $gt: "" },
    $or: [{ groupKey: { $exists: false } }, { groupKey: "" }, { groupKey: null }],
  };

  const pending = await Job.countDocuments(filter);
  console.log(`  rows needing a groupKey: ${pending}`);

  if (COMMIT && pending) {
    const res = await Job.updateMany(filter, [
      { $set: { groupKey: "$dedupeHash" } },
    ]);
    console.log(`  updated: ${res.modifiedCount}`);

    const keys = await Job.distinct("groupKey", { groupKey: { $gt: "" } });
    console.log(`  rebuilding ${keys.length} groups…`);
    for (const key of keys) await rebuildGroup(key);
  }

  await mongoose.connection.close();
  console.log(COMMIT ? "\n✅ Committed.\n" : "\nℹ️  Dry run — re-run with --commit.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("backfill-group-keys failed:", err);
  process.exit(1);
});
