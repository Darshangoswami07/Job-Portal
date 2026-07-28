import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import passport from "passport";

import connectDB from "./config/database.js";
import "./config/passport.js";
import { getAllowedOrigins } from "./config/runtimeUrls.js";

import userRoutes from "./routes/user.route.js";
import companyRoutes from "./routes/company.route.js";
import jobRoutes from "./routes/job.route.js";
import applicationRoutes from "./routes/application.route.js";
import savedJobRoutes from "./routes/savedJob.route.js";
import oauthRoutes from "./routes/oauth.routes.js";

import resumeRoutes from "./routes_new/resume.routes.js";
import coverLetterRoutes from "./routes_new/coverLetter.routes.js";
import interviewRoutes from "./routes_new/interview.routes.js";
import salaryRoutes from "./routes_new/salary.routes.js";
import roadmapRoutes from "./routes_new/roadmap.routes.js";
import resumeCheckRoutes from "./routes_new/resumeCheck.routes.js";
import blogRoutes from "./routes_new/blog.routes.js";
import questionRoutes from "./routes_new/question.routes.js";
import careerGuideRoutes from "./routes_new/careerGuide.routes.js";
import resumeTemplateRoutes from "./routes_new/resumeTemplate.routes.js";
import contactRoutes from "./routes_new/contact.routes.js";
import supportTicketRoutes from "./routes_new/supportTicket.routes.js";
import subscriptionRoutes from "./routes_new/subscription.routes.js";
import notificationRoutes from "./routes_new/notification.routes.js";
import companyAggregatorRoutes from "./routes_new/companyAggregator.routes.js";
import jobAggregationRoutes from "./routes_new/jobAggregation.routes.js";
import { aggregateCompanies } from "./services/companyAggregator.js";
import { runJobAggregation } from "./services/jobAggregationPipeline.js";
import cron from "node-cron";
import { seedBlogs } from "./seed/blogs.js";
import { seedInterviewQuestions } from "./seed/interviewQuestions.js";
import { seedResumeTemplates } from "./seed/resumeTemplates.js";
import { seedCareerGuides } from "./seed/careerGuides.js";
import { seedJobs } from "./seed/jobs.js";

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    console.log("Blocked by CORS:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "job-portal-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/user", oauthRoutes);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/job", jobRoutes);
app.use("/api/v1/application", applicationRoutes);
app.use("/api/v1/saved-jobs", savedJobRoutes);

app.use("/api/v1/resumes", resumeRoutes);
app.use("/api/v1/cover-letters", coverLetterRoutes);
app.use("/api/v1/interviews", interviewRoutes);
app.use("/api/v1/salaries", salaryRoutes);
app.use("/api/v1/roadmaps", roadmapRoutes);
app.use("/api/v1/resume-check", resumeCheckRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/questions", questionRoutes);
app.use("/api/v1/career-guides", careerGuideRoutes);
app.use("/api/v1/resume-templates", resumeTemplateRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/support-tickets", supportTicketRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/company-profiles", companyAggregatorRoutes);
app.use("/api/v1/job-aggregation", jobAggregationRoutes);

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

const PORT = process.env.PORT || 8000;

async function runStartupDataSync() {
  console.log("Database connection established, checking jobs...");
  try {
    const Job = mongoose.connection.model("Job");
    const jobCount = await Job.countDocuments().catch(() => 0);
    if (jobCount < 100) {
      console.log(`Initializing ${100 - jobCount} sample jobs...`);
      await seedJobs();
    }
  } catch (error) {
    console.log("Job seeding check failed, attempting full seed...");
    await seedJobs();
  }
  console.log("Loading jobs from all sources...");
  const syncResult = await aggregateCompanies();
  console.log(`Startup completed: ${syncResult.count || 0} profiles aggregated`);

  runJobAggregation().catch((error) => console.error("Initial job aggregation failed:", error.message));
}

connectDB()
  .then(() => {
    // Bind the port and register shutdown handlers immediately so nodemon/process
    // managers can restart cleanly without racing a slow startup data sync.
    const server = http.createServer(app);

    let bindAttemptsLeft = 15;
    server.on("error", (err) => {
      // On Windows, nodemon force-kills the previous process instead of signaling it
      // (Node doesn't get real POSIX signal delivery there), so the OS can take a
      // moment to release the port on restart. Retry (bounded) instead of crashing.
      if (err.code === "EADDRINUSE" && bindAttemptsLeft > 0) {
        bindAttemptsLeft -= 1;
        console.log(`Port still in use, retrying in 300ms... (${bindAttemptsLeft} attempts left)`);
        setTimeout(() => server.listen(PORT), 300);
      } else {
        console.error("❌ Server error:", err);
        process.exit(1);
      }
    });

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Jobs loaded from all providers - Ready to serve!`);
    });

    const openSockets = new Set();
    server.on("connection", (socket) => {
      openSockets.add(socket);
      socket.on("close", () => openSockets.delete(socket));
    });

    const jobAggregationTask = cron.schedule("0 */4 * * *", () => {
      console.log("Running scheduled job aggregation sync...");
      runJobAggregation().catch((error) => console.error("Scheduled job aggregation failed:", error.message));
    });

    let shuttingDown = false;
    const shutdown = (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`\n${signal} received, shutting down gracefully...`);
      jobAggregationTask.stop();
      server.close(() => {
        mongoose.connection.close(true).then(() => {
          console.log("Shutdown complete.");
          process.exit(0);
        });
      });
      for (const socket of openSockets) socket.destroy();
      setTimeout(() => process.exit(1), 3000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGUSR2", () => shutdown("SIGUSR2"));

    runStartupDataSync().catch((error) => console.error("Startup data sync failed:", error));
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
  });
