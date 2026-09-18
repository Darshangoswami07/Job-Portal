/**
 * Register / inspect public ATS boards as JobSources. Idempotent, explicit,
 * no secrets. Generalises setup-greenhouse-source.js to every implemented ATS
 * adapter so an operator can onboard VERIFIED company boards efficiently.
 *
 * A board is created DISABLED by default; pass --enable to turn it on.
 * NOTHING is hardcoded — the operator supplies the real board identifier.
 *
 * Register one board:
 *   node scripts/setup-ats-source.js --adapter=greenhouse      --board=acme          [--name="Acme"] [--enable]
 *   node scripts/setup-ats-source.js --adapter=lever           --site=leverdemo
 *   node scripts/setup-ats-source.js --adapter=ashby           --jobBoardName="Acme"
 *   node scripts/setup-ats-source.js --adapter=smartrecruiters --companyId=AcmeInc
 *   node scripts/setup-ats-source.js --adapter=workable        --subdomain=acme --apiTokenRef=WORKABLE_API_TOKEN
 *
 * Register several boards for one adapter at once:
 *   node scripts/setup-ats-source.js --adapter=greenhouse --boards=acme,globex,initech [--enable]
 *
 * Inspect what is already registered (no writes):
 *   node scripts/setup-ats-source.js --list
 *
 * The credential VALUE is never passed here — only the ENV-VAR NAME (workable).
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { JobSource } from "../models_new/JobSource.js";
import { SyncRun } from "../models_new/SyncRun.js";
import { Job } from "../models/job.model.js";
import { adapterSpec, validateSourceConfig } from "../services/sources/configValidation.js";
import "../services/jobs/sync.js"; // side-effect: registers every adapter
import { getAdapter } from "../services/sources/base.js";

const ATS_ADAPTERS = ["greenhouse", "lever", "ashby", "smartrecruiters", "workable"];
// Which config key holds the board identifier for each adapter.
const ID_KEY = {
  greenhouse: "boardToken",
  lever: "site",
  ashby: "jobBoardName",
  smartrecruiters: "companyId",
  workable: "subdomain",
};
// Friendly CLI flags → adapter config keys.
const CONFIG_KEYS = {
  greenhouse: ["board", "boardToken", "companyName"],
  lever: ["site", "company"],
  ashby: ["jobBoardName", "boardName"],
  smartrecruiters: ["companyId", "company", "maxDetail"],
  workable: ["subdomain", "apiTokenRef"],
};

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  })
);

function die(msg) {
  console.error(msg);
  process.exit(1);
}

async function listBoards() {
  const sources = await JobSource.find({ adapter: { $in: ATS_ADAPTERS } })
    .select("key name adapter type enabled config lastSyncAt lastSyncStatus health")
    .lean();
  if (!sources.length) {
    console.log("No ATS boards registered. Add one with --adapter=<x> --board=<realId>.");
    return;
  }
  const active = await Job.aggregate([
    { $match: { isActive: { $ne: false }, status: { $nin: ["expired", "filled", "removed", "error"] } } },
    { $group: { _id: "$sourceId", n: { $sum: 1 } } },
  ]);
  const byId = new Map(active.map((r) => [String(r._id), r.n]));

  console.log("\n── Registered ATS boards ──");
  for (const s of sources) {
    const last = await SyncRun.findOne({ sourceId: s._id }).sort({ startedAt: -1 }).select("status startedAt").lean();
    console.log(
      `  ${s.key.padEnd(28)} adapter=${s.adapter.padEnd(15)} enabled=${String(s.enabled).padEnd(5)} ` +
        `boardId=${String(s.config?.[ID_KEY[s.adapter]] || "?").padEnd(18)} ` +
        `activeJobs=${String(byId.get(String(s._id)) || 0).padStart(4)} ` +
        `lastSync=${s.lastSyncAt ? new Date(s.lastSyncAt).toISOString().slice(0, 16) : "never"} ` +
        `status=${last?.status || s.lastSyncStatus || "-"} ` +
        `consecFail=${s.health?.consecutiveFailures || 0}`
    );
  }
  console.log("");
}

async function registerBoard(adapter, ident, { enable, name, rateLimitPerMin }) {
  const spec = adapterSpec(adapter);
  const idKey = ID_KEY[adapter];
  const config = { [idKey]: String(ident) };
  // carry through any extra config flags the operator passed
  for (const key of CONFIG_KEYS[adapter]) {
    if (key !== "board" && args[key] !== undefined && !(key in config)) config[key] = String(args[key]);
  }
  if (args.apiTokenRef !== undefined) config.apiTokenRef = String(args.apiTokenRef);

  const check = validateSourceConfig(adapter, config);
  if (check.error) return die(`invalid config for ${adapter} board "${ident}": ${check.error}`);

  const key = `${adapter}:${String(ident).toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;
  const existing = await JobSource.findOne({ key });
  const setFields = { name: name || `${ident} (${adapter})`, type: spec.type, adapter, rateLimitPerMin, credentialRef: "" };
  for (const [k, v] of Object.entries(config)) setFields[`config.${k}`] = v;

  const doc = await JobSource.findOneAndUpdate(
    { key },
    { $set: setFields, $setOnInsert: { key, enabled: Boolean(enable) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (existing && enable && !doc.enabled) {
    doc.enabled = true;
    await doc.save();
  }
  console.log(
    `${existing ? "updated" : "created"} ${key}  (enabled=${doc.enabled})  sync:  npm run sync:jobs -- --source=${key}`
  );
}

const run = async () => {
  await connectDB();
  if (mongoose.connection.readyState !== 1) return die("No database connection (check MONGO_URI). Aborting.");

  if (args.list) {
    await listBoards();
    await mongoose.connection.close();
    return process.exit(0);
  }

  const adapter = typeof args.adapter === "string" ? args.adapter.toLowerCase() : "";
  if (!ATS_ADAPTERS.includes(adapter)) return die(`--adapter must be one of: ${ATS_ADAPTERS.join(", ")}  (or use --list)`);
  if (!getAdapter(adapter)) return die(`adapter "${adapter}" is not registered`);

  // Board identifier(s): single (--board/--site/--companyId/…) or batch (--boards=a,b,c).
  const single = args.board || args[ID_KEY[adapter]] || args[CONFIG_KEYS[adapter][0]];
  const batch = typeof args.boards === "string" ? args.boards.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const idents = batch.length ? batch : single ? [String(single)] : [];
  if (!idents.length) return die(`provide a board id: --board=<id> (or --boards=a,b,c) for ${adapter}`);

  const opts = {
    enable: Boolean(args.enable),
    name: typeof args.name === "string" && idents.length === 1 ? args.name : "",
    rateLimitPerMin: args.rate ? Number(args.rate) : 30,
  };
  for (const ident of idents) await registerBoard(adapter, ident, opts);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("setup-ats-source failed:", err.message);
  process.exit(1);
});
