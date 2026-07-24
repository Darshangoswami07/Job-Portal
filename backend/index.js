import dotenv from "dotenv";
dotenv.config();

import express from "express";
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

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
