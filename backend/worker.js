/**
 * Dedicated background sync worker.
 *
 * Runs the SyncScheduler and NOTHING else — no Express, no HTTP listener. Deploy
 * this as a separate process (a Render "Background Worker" running
 * `npm run worker`) so job synchronization never competes with API requests.
 *
 * There is exactly ONE scheduler (services/jobs/scheduler.js). Do not also set
 * RUN_SYNC_WORKER=true on the web service if a dedicated worker is deployed —
 * the per-source Mongo advisory lock makes a stray second process safe, but a
 * single worker is the intended shape.
 *
 * Graceful shutdown on SIGINT / SIGTERM.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "./config/database.js";
import { startScheduler, stopScheduler } from "./services/jobs/scheduler.js";
import { JobSource } from "./models_new/JobSource.js";
import { ensureInternalSource } from "./services/sources/internal.js";
import { describeWorkerPlan } from "./services/jobs/workerDiagnostics.js";

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[worker] ${signal} received — shutting down`);
  try {
    await stopScheduler();
    await mongoose.connection.close();
  } catch (err) {
    console.error("[worker] shutdown error:", err.message);
  }
  process.exit(0);
}

/** Safe-to-log summary of what the scheduler will do. No secrets, ever. */
async function logStartupDiagnostics() {
  await ensureInternalSource();
  const sources = await JobSource.find({})
    .select("key adapter type enabled schedule lastSyncAt lastSyncStatus config")
    .lean();
  const plan = describeWorkerPlan(sources, new Date());

  console.log(`[worker] enabled=true mode=dedicated-worker node=${process.version} tz=UTC`);
  console.log(`[worker] sources: configured=${plan.configured} enabled=${plan.enabled} scheduled=${plan.scheduled}`);
  console.log(`[worker] enabled sources: ${plan.enabledKeys.join(", ") || "(none)"}`);
  if (plan.dueNow.length) console.log(`[worker] due now: ${plan.dueNow.join(", ")}`);
  if (plan.nextDue) {
    console.log(
      `[worker] nextDue=${plan.nextDue.key} schedule="${plan.nextDue.schedule}" at=${plan.nextDue.at} (in ~${plan.nextDue.inMinutes}m)`
    );
  } else {
    console.log("[worker] nextDue=(no cron-scheduled source — internal runs every tick)");
  }

  // A worker that starts with zero enabled sources is almost certainly a
  // misconfiguration — make it loud rather than "silently healthy".
  if (plan.enabled === 0) {
    console.warn("[worker] WARNING: no enabled JobSources. Nothing will sync until an operator enables a source.");
  } else if (plan.scheduled === 0) {
    console.warn("[worker] WARNING: only the every-tick internal source is enabled; no cron-scheduled sources.");
  }
  return plan;
}

async function main() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("[worker] no database connection (check MONGO_URI). Exiting.");
    process.exit(1);
  }
  console.log("[worker] database connected");

  try {
    await logStartupDiagnostics();
  } catch (err) {
    console.error("[worker] startup diagnostics failed (continuing):", err.message);
  }

  const scheduler = startScheduler();
  if (!scheduler) {
    console.error("[worker] scheduler failed to start — exiting so the platform restarts us");
    process.exit(1);
  }
  console.log("[worker] scheduler running — tick every 60s");

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
