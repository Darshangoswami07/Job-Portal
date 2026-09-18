/**
 * Local development helper — explicitly seeds sample jobs.
 *
 * This is NOT run on boot and must never run against production data.
 * Usage: `npm run seed:dev` from the backend directory.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { seedJobs } from "../seed/jobs.js";

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to run the dev job seed with NODE_ENV=production.");
    process.exit(1);
  }

  await connectDB();
  await seedJobs();
  await mongoose.connection.close();
  console.log("✅ Dev job seed complete.");
  process.exit(0);
};

run().catch((err) => {
  console.error("Dev job seed failed:", err);
  process.exit(1);
});
