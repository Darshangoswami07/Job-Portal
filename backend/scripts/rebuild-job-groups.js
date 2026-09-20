/**
 * Recompute every Job's dedupe signature (Phase 4 added seniority +
 * employment-type discriminators) and rebuild all JobGroups. Idempotent.
 *
 * SAFETY: dry-run by default (`--commit` to write). Never deletes a Job. Only
 * prunes JobGroups that ended up with zero members (they are derived data).
 *
 * Usage (from backend/):
 *   node scripts/rebuild-job-groups.js            # dry run
 *   node scripts/rebuild-job-groups.js --commit
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { Job } from "../models/job.model.js";
import { JobGroup } from "../models_new/JobGroup.js";
import { computeDedupeFields } from "../services/jobs/dedupe.js";
import { rebuildGroup } from "../services/jobs/ingest.js";

const COMMIT = process.argv.includes("--commit");

const summary = { scanned: 0, hashChanged: 0, groupsRebuilt: 0, groupsPruned: 0 };

async function main() {
  console.log(`\nRebuild JobGroups — mode: ${COMMIT ? "COMMIT" : "DRY RUN"}`);
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("No database connection. Aborting.");
    process.exit(1);
  }

  const hashes = new Set();
  const ops = [];
  const cursor = Job.find({})
    .populate({ path: "company", select: "name website email" })
    .lean()
    .cursor();

  for await (const job of cursor) {
    summary.scanned += 1;
    const fresh = computeDedupeFields({
      title: job.title,
      companyName: job.companyName || job.company?.name,
      location: job.location,
      remoteType: job.remoteType || "unknown",
      jobType: job.jobType,
    });

    if (job.dedupeHash) hashes.add(job.dedupeHash);
    if (fresh.dedupeHash) hashes.add(fresh.dedupeHash);
    // effective grouping key (a similarity-merged job points elsewhere)
    if (job.groupKey) hashes.add(job.groupKey);

    if (
      fresh.dedupeHash !== (job.dedupeHash || "") ||
      fresh.normalizedTitle !== (job.normalizedTitle || "") ||
      fresh.normalizedCompany !== (job.normalizedCompany || "")
    ) {
      summary.hashChanged += 1;
      const set = {
        dedupeHash: fresh.dedupeHash,
        normalizedTitle: fresh.normalizedTitle,
        normalizedCompany: fresh.normalizedCompany,
        normalizedLocation: fresh.normalizedLocation,
      };
      // Move the groupKey with the hash UNLESS the similarity assist had
      // pointed it at another vacancy — that merge is preserved until re-sync.
      if (!job.groupKey || job.groupKey === (job.dedupeHash || "")) {
        set.groupKey = fresh.dedupeHash;
        hashes.add(fresh.dedupeHash);
      }
      ops.push({ updateOne: { filter: { _id: job._id }, update: { $set: set } } });
    }
  }

  if (COMMIT && ops.length) {
    for (let i = 0; i < ops.length; i += 500) {
      await Job.bulkWrite(ops.slice(i, i + 500), { ordered: false });
    }
  }

  if (COMMIT) {
    for (const hash of hashes) {
      await rebuildGroup(hash);
      summary.groupsRebuilt += 1;
    }
    const pruned = await JobGroup.deleteMany({ activeSourceCount: 0, "sources.0": { $exists: false } });
    summary.groupsPruned = pruned.deletedCount || 0;
  } else {
    summary.groupsRebuilt = hashes.size;
  }

  await mongoose.connection.close();
  console.log("\n── Summary ─────────────");
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(16)} ${v}`);
  console.log(COMMIT ? "\n✅ Committed.\n" : "\nℹ️  Dry run — re-run with --commit.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("rebuild-job-groups failed:", err);
  process.exit(1);
});
