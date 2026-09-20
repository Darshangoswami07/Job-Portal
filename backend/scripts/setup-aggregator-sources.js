/**
 * Register / enable / disable the third-party aggregator JobSources
 * (Adzuna, JSearch, Jooble). Idempotent. No secrets — only env-var NAMES.
 *
 * Usage (from backend/):
 *   node scripts/setup-aggregator-sources.js                       # create (disabled) + show status
 *   node scripts/setup-aggregator-sources.js --enable=adzuna,jooble
 *   node scripts/setup-aggregator-sources.js --disable=jsearch
 *
 * A source is only enabled if its credential env vars are present.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { JobSource } from "../models_new/JobSource.js";
import {
  AGGREGATOR_DEFS,
  ensureAggregatorSources,
  aggregatorHasCredentials,
} from "../services/sources/aggregatorSources.js";

const arg = (name) => {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
};
const toEnable = new Set(arg("enable"));
const toDisable = new Set(arg("disable"));

async function main() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("No database connection. Aborting.");
    process.exit(1);
  }

  await ensureAggregatorSources();

  for (const def of AGGREGATOR_DEFS) {
    if (toEnable.has(def.key)) {
      if (!aggregatorHasCredentials(def)) {
        console.warn(`skip enable "${def.key}" — missing env: ${def.credentialEnvs.join(", ")}`);
        continue;
      }
      await JobSource.updateOne({ key: def.key }, { $set: { enabled: true } });
      console.log(`enabled  ${def.key}`);
    }
    if (toDisable.has(def.key)) {
      await JobSource.updateOne({ key: def.key }, { $set: { enabled: false } });
      console.log(`disabled ${def.key}`);
    }
  }

  console.log("\n── Aggregator sources ──");
  for (const def of AGGREGATOR_DEFS) {
    const doc = await JobSource.findOne({ key: def.key }).lean();
    console.log(
      `  ${def.key.padEnd(10)} enabled=${doc?.enabled}  creds=${aggregatorHasCredentials(def)}  schedule="${doc?.schedule}"`
    );
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("setup-aggregator-sources failed:", err);
  process.exit(1);
});
