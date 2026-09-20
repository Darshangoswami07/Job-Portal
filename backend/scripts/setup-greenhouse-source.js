/**
 * Register (or update) a Greenhouse JobSource. Idempotent, explicit, no secrets.
 *
 * A Greenhouse board is public via the Job Board API, so NO credential is
 * required — only the board token.
 *
 * Usage (from backend/):
 *   node scripts/setup-greenhouse-source.js --board=<boardToken> \
 *        [--name="Acme (Greenhouse)"] [--company="Acme Inc"] \
 *        [--rate=30] [--enable]
 *
 * The source is created DISABLED by default; pass --enable to turn it on, or
 * flip `enabled` later. It never runs on application startup.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { JobSource } from "../models_new/JobSource.js";
import { GREENHOUSE_ADAPTER } from "../services/sources/greenhouse.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  })
);

const board = typeof args.board === "string" ? args.board.trim() : "";
if (!board || !/^[a-z0-9][a-z0-9-]{0,80}$/i.test(board)) {
  console.error("Missing/invalid --board=<greenhouseBoardToken>");
  process.exit(1);
}

const key = `greenhouse:${board.toLowerCase()}`;
const name = typeof args.name === "string" ? args.name : "Greenhouse";
const companyName = typeof args.company === "string" ? args.company : "";
const rateLimitPerMin = args.rate ? Number(args.rate) : 30;
const enabled = Boolean(args.enable);

const run = async () => {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("No database connection (check MONGO_URI). Aborting.");
    process.exit(1);
  }

  const existing = await JobSource.findOne({ key });

  const doc = await JobSource.findOneAndUpdate(
    { key },
    {
      $set: {
        name,
        type: "ats",
        adapter: GREENHOUSE_ADAPTER,
        rateLimitPerMin: Number.isFinite(rateLimitPerMin) ? rateLimitPerMin : 30,
        credentialRef: "",
        "config.boardToken": board,
        ...(companyName ? { "config.companyName": companyName } : {}),
      },
      $setOnInsert: { key, enabled },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (existing && args.enable) {
    doc.enabled = true;
    await doc.save();
  }

  console.log(
    `${existing ? "Updated" : "Created"} JobSource "${key}" (enabled=${doc.enabled}, adapter=${doc.adapter}, board=${board})`
  );
  console.log("Run a sync with:  npm run sync:jobs");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("setup-greenhouse-source failed:", err);
  process.exit(1);
});
