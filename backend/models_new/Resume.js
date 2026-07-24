import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: "" },
  degree: { type: String, default: "" },
  field: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  grade: { type: String, default: "" },
  current: { type: Boolean, default: false },
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  company: { type: String, default: "" },
  title: { type: String, default: "" },
  location: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  current: { type: Boolean, default: false },
  description: { type: String, default: "" },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  url: { type: String, default: "" },
  technologies: [{ type: String }],
}, { _id: false });

const certificateSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  issuer: { type: String, default: "" },
  date: { type: String, default: "" },
  url: { type: String, default: "" },
}, { _id: false });

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "My Resume" },
  template: { type: String, default: "modern" },
  fullName: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  location: { type: String, default: "" },
  headline: { type: String, default: "" },
  summary: { type: String, default: "" },
  website: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  github: { type: String, default: "" },
  education: [educationSchema],
  experience: [experienceSchema],
  skills: [{ type: String }],
  projects: [projectSchema],
  certifications: [certificateSchema],
  languages: [{ type: String }],
  achievements: [{ type: String }],
  photo: { type: String, default: "" },
  atsScore: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: false },
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true });

resumeSchema.index({ user: 1, createdAt: -1 });
resumeSchema.index({ user: 1, title: 1 });

export const Resume = mongoose.model("Resume", resumeSchema);
