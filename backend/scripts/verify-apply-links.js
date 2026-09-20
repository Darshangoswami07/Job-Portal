/**
 * Controlled, rate-limited verification of stored EXTERNAL apply URLs.
 * NOT an aggressive crawler — bounded batch, per-host throttle, dry-run default.
 *
 * On a hard 404/410 the job is marked `status:"error"` (hidden from search) and
 * its group rebuilt. Network/timeout errors are left for the next run (no
 * penalty). A 2xx/3xx sets `lastVerifiedAt`.
 *
 * Usage (from backend/):
 *   node scripts/verify-apply-links.js               # dry run, 50 oldest
 *   node scripts/verify-apply-links.js --limit=100 --commit
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { verifyApplyLinks } from "../services/jobs/verifyLinks.js";

const COMMIT = process.argv.includes("--commit");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 50;

async function main() {
  console.log(`\nVerify apply links — mode: ${COMMIT ? "COMMIT" : "DRY RUN"} (limit ${LIMIT})`);
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("No database connection. Aborting.");
    process.exit(1);
  }

  const summary = await verifyApplyLinks({ limit: LIMIT, commit: COMMIT });

  await mongoose.connection.close();
  console.log("\n── Summary ─────────────");
  for (const [k, v] of Object.entries(summary)) console.log(`  ${String(k).padEnd(10)} ${v}`);
  console.log(COMMIT ? "\n✅ Committed.\n" : "\nℹ️  Dry run — re-run with --commit.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("verify-apply-links failed:", err);
  process.exit(1);
});
