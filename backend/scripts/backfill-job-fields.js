/**
 * One-time, idempotent backfill of the Phase 1 Job fields (PLAN.md §10 / §13).
 *
 * SAFETY
 *   - Dry-run by default. Pass `--commit` to write.
 *   - Never deletes a job. Never overwrites a valid existing value.
 *   - Never fabricates an apply/original URL — only reuses an existing
 *     `sourceUrl` when it is a valid http(s) URL.
 *   - Idempotent: a second run reports 0 changes.
 *
 * USAGE (from backend/)
 *   node scripts/backfill-job-fields.js            # dry run, full report
 *   node scripts/backfill-job-fields.js --commit   # apply changes
 *   node scripts/backfill-job-fields.js --limit=200 --commit
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { Job } from "../models/job.model.js";
import { JobGroup } from "../models_new/JobGroup.js";
import { computeBackfillFields } from "../services/jobs/backfill.js";
import { pickBestJob } from "../services/jobs/dedupe.js";

const args = process.argv.slice(2);
const COMMIT = args.includes("--commit") || args.includes("--yes");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 0;
const batchArg = args.find((a) => a.startsWith("--batch="));
const BATCH = batchArg ? Number(batchArg.split("=")[1]) : 500;

const summary = {
  scanned: 0,
  jobsWithChanges: 0,
  jobFieldWrites: 0,
  jobsNoChange: 0,
  jobsWithoutApplyUrl: 0,
  jobsWithoutDedupeHash: 0,
  groupsTouched: 0,
  groupJobLinks: 0,
};

async function flushJobWrites(ops) {
  if (!ops.length) return;
  summary.jobFieldWrites += ops.length;
  if (COMMIT) await Job.bulkWrite(ops, { ordered: false });
}

async function upsertGroup(hash, candidates) {
  // Deduplicate candidate job rows by jobId (idempotency).
  const byJob = new Map();
  for (const c of candidates) byJob.set(String(c.jobId), c);
  const rows = [...byJob.values()];

  const best = pickBestJob(rows) || rows[0];
  const active = rows.filter((r) => r.status === "active");
  const dates = rows
    .flatMap((r) => [r.postedAt, r.lastSeenAt, r.createdAt])
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((n) => !Number.isNaN(n));

  const groupDoc = {
    dedupeHash: hash,
    displayTitle: best.title || "",
    normalizedTitle: best.normalizedTitle || "",
    companyName: best.companyName || "",
    normalizedCompany: best.normalizedCompany || "",
    companyDomain: best.companyDomain || "",
    location: best.location || "",
    normalizedLocation: best.normalizedLocation || "",
    remoteType: best.remoteType || "unknown",
    salaryMin: best.salaryMin,
    salaryMax: best.salaryMax,
    salaryCurrency: best.salaryCurrency || "",
    skills: Array.isArray(best.skills) ? best.skills : [],
    sources: rows.map((r) => ({
      jobId: r.jobId,
      sourceName: r.sourceName || "",
      sourceType: r.sourceType || "internal",
      applyUrl: r.applyUrl || "",
      applyType: r.applyType || "internal",
      postedAt: r.postedAt,
      lastSeenAt: r.lastSeenAt,
    })),
    bestJobId: best.jobId,
    activeSourceCount: active.length,
    firstSeenAt: dates.length ? new Date(Math.min(...dates)) : undefined,
    lastSeenAt: dates.length ? new Date(Math.max(...dates)) : undefined,
    status: active.length ? "active" : "inactive",
  };

  summary.groupsTouched += 1;
  summary.groupJobLinks += rows.length;

  if (!COMMIT) return;

  await JobGroup.updateOne({ dedupeHash: hash }, { $set: groupDoc }, { upsert: true });
  const group = await JobGroup.findOne({ dedupeHash: hash }).select("_id").lean();
  if (group) {
    await Job.updateMany(
      { _id: { $in: rows.map((r) => r.jobId) } },
      { $set: { groupId: group._id } }
    );
  }
}

async function main() {
  console.log(`\nBackfill Job fields — mode: ${COMMIT ? "COMMIT (writing)" : "DRY RUN"}`);
  if (LIMIT) console.log(`Limit: ${LIMIT} jobs`);

  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("No database connection (check MONGO_URI). Aborting.");
    process.exit(1);
  }

  const cursor = Job.find({})
    .populate({ path: "company", select: "name website email" })
    .lean()
    .cursor();

  const groupsByHash = new Map();
  let ops = [];

  for await (const job of cursor) {
    summary.scanned += 1;
    const { set, dedupeHash, groupCandidate } = computeBackfillFields(job);

    if (!job.applyUrl && !set.applyUrl) summary.jobsWithoutApplyUrl += 1;
    if (!dedupeHash) summary.jobsWithoutDedupeHash += 1;

    if (Object.keys(set).length > 0) {
      summary.jobsWithChanges += 1;
      ops.push({ updateOne: { filter: { _id: job._id }, update: { $set: set } } });
      if (ops.length >= BATCH) {
        await flushJobWrites(ops);
        ops = [];
      }
    } else {
      summary.jobsNoChange += 1;
    }

    if (groupCandidate && dedupeHash) {
      if (!groupsByHash.has(dedupeHash)) groupsByHash.set(dedupeHash, []);
      groupsByHash.get(dedupeHash).push(groupCandidate);
    }

    if (LIMIT && summary.scanned >= LIMIT) break;
  }

  await flushJobWrites(ops);

  for (const [hash, candidates] of groupsByHash) {
    await upsertGroup(hash, candidates);
  }

  await mongoose.connection.close();

  console.log("\n── Summary ─────────────────────────────");
  for (const [k, v] of Object.entries(summary)) {
    console.log(`  ${k.padEnd(22)} ${v}`);
  }
  console.log(
    COMMIT
      ? "\n✅ Backfill committed.\n"
      : "\nℹ️  Dry run only — re-run with --commit to apply.\n"
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
