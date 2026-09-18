import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";

import connectDB from "./config/database.js";
import passport, { initPassport } from "./config/passport.js";
import { getAllowedOrigins } from "./config/runtimeUrls.js";
import { initChatSocket } from "./socket/index.js";

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
import chatRoutes from "./routes_new/chat.routes.js";
import socialRoutes from "./routes_new/social.routes.js";
import companyAggregatorRoutes from "./routes_new/companyAggregator.routes.js";
import jobAggregationRoutes from "./routes_new/jobAggregation.routes.js";
import adminJobSourceRoutes from "./routes_new/adminJobSource.routes.js";
import adminJobGroupRoutes from "./routes_new/adminJobGroup.routes.js";
import adminAuditRoutes from "./routes_new/adminAudit.routes.js";
import recommendationRoutes from "./routes_new/recommendation.routes.js";
import adminRecoRoutes from "./routes_new/adminReco.routes.js";
import { clientRouter as analyticsClientRoutes, adminRouter as adminAnalyticsRoutes } from "./routes_new/analytics.routes.js";
import { bootstrapAiProvider } from "./services/jobs/aiProvider.js";
import { aggregateCompanies } from "./services/companyAggregator.js";
import { seedBlogs } from "./seed/blogs.js";
import { seedInterviewQuestions } from "./seed/interviewQuestions.js";
import { seedResumeTemplates } from "./seed/resumeTemplates.js";
import { seedCareerGuides } from "./seed/careerGuides.js";
import { seedSubscriptionPlans } from "./seed/subscriptionPlans.js";
import { seedFeedPosts } from "./seed/feedPosts.js";
// Sample job seeding is no longer run on boot. It fabricated listings against
// real company names, which conflicts with the "real job data only" direction.
// Use `npm run seed:dev` (scripts/seed-dev-jobs.js) for local development only.

initPassport();

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
    cookie: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
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
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/company-profiles", companyAggregatorRoutes);
app.use("/api/v1/jobs", jobAggregationRoutes);
app.use("/api/v1/admin/job-sources", adminJobSourceRoutes);
app.use("/api/v1/admin/job-groups", adminJobGroupRoutes);
app.use("/api/v1/admin/audit", adminAuditRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/admin/reco-metrics", adminRecoRoutes);
app.use("/api/v1/analytics", analyticsClientRoutes);
app.use("/api/v1/admin/analytics", adminAnalyticsRoutes);
app.use("/api/v1/social", socialRoutes);

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    const server = http.createServer(app);
    initChatSocket(server);
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Error: Port ${PORT} is already in use by another process.`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", err);
      }
    });
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Phase 9: register the real LLM match provider IF the feature flag is on
    // AND the provider is fully configured. Missing config → deterministic-only.
    // Never fails startup.
    try {
      const ai = bootstrapAiProvider();
      console.log(
        `AI recommendations: feature=${ai.featureEnabled} provider=${ai.providerName} configured=${ai.providerConfigured}`
      );
    } catch (err) {
      console.error("AI provider bootstrap failed (deterministic-only):", err.message);
    }

    // Ensure subscription plans exist so the Pricing page + subscribe flow work.
    // Idempotent (upsert by slug); never blocks startup.
    seedSubscriptionPlans();

    // Ensure the Feed has editorial content so it is never an empty page.
    // Idempotent (skips when the editorial posts already exist).
    seedFeedPosts();

    // Refresh derived company profiles in the background — never block startup.
    aggregateCompanies()
      .then((syncResult) =>
        console.log(`Company profiles aggregated: ${syncResult?.count || 0}`)
      )
      .catch((err) => console.error("Company aggregation failed:", err.message));

    // Search reads the JobGroup collection. If it is empty but recruiter jobs
    // exist, the grouped search would show nothing — bootstrap the internal
    // source once, in the background (internal only: no external HTTP). Idempotent.
    (async () => {
      try {
        const { Job } = await import("./models/job.model.js");
        const { JobGroup } = await import("./models_new/JobGroup.js");
        const [jobs, groups] = await Promise.all([
          Job.estimatedDocumentCount(),
          JobGroup.estimatedDocumentCount(),
        ]);
        if (jobs > 0 && groups === 0) {
          console.log(`Bootstrapping job groups from ${jobs} existing jobs…`);
          const { runSourceSync } = await import("./services/jobs/sync.js");
          const r = await runSourceSync("internal");
          console.log(`Job group bootstrap: ${JSON.stringify(r?.counts || r)}`);
        }
      } catch (err) {
        console.error("Job group bootstrap failed:", err.message);
      }
    })();

    // Job-sync scheduler. OFF by default: run the dedicated `npm run worker`
    // process instead. This fallback is only for a single-instance deploy that
    // cannot afford a separate worker — the advisory lock keeps it safe.
    if (process.env.RUN_SYNC_WORKER === "true") {
      import("./services/jobs/scheduler.js")
        .then(({ startScheduler, stopScheduler }) => {
          startScheduler();
          process.on("SIGTERM", () => stopScheduler());
          process.on("SIGINT", () => stopScheduler());
        })
        .catch((err) => console.error("Scheduler failed to start:", err.message));
    }
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
  });
