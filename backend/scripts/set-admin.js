/**
 * Grant / revoke the `admin` role for a user. Idempotent.
 *
 * Usage (from backend/):
 *   node scripts/set-admin.js --email=ops@example.com
 *   node scripts/set-admin.js --email=ops@example.com --revoke
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { User } from "../models/user.model.js";

const emailArg = process.argv.find((a) => a.startsWith("--email="));
const email = emailArg ? emailArg.split("=")[1].trim().toLowerCase() : "";
const revoke = process.argv.includes("--revoke");

if (!email) {
  console.error("Usage: node scripts/set-admin.js --email=<user email> [--revoke]");
  process.exit(1);
}

const run = async () => {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("No database connection. Aborting.");
    process.exit(1);
  }
  const user = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
  if (!user) {
    console.error(`No user with email "${email}"`);
    process.exit(1);
  }
  user.roles = user.roles || {};
  user.roles.admin = !revoke;
  await user.save();
  console.log(`${revoke ? "Revoked" : "Granted"} admin for ${user.email} (${user._id})`);
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("set-admin failed:", err);
  process.exit(1);
});
