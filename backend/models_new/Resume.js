import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  institution: { type: String, default: "" },
  degree: { type: String, default: "" },
  field: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  grade: { type: String, default: "" },
  current: { type: Boolean, default: false },
  description: { type: String, default: "" },
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  company: { type: String, default: "" },
  title: { type: String, default: "" },
  location: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  current: { type: Boolean, default: false },
  description: { type: String, default: "" },
  highlights: [{ type: String }],
}, { _id: false });

const projectSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  url: { type: String, default: "" },
  technologies: [{ type: String }],
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  highlights: [{ type: String }],
}, { _id: false });

const certificateSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, default: "" },
  issuer: { type: String, default: "" },
  date: { type: String, default: "" },
  url: { type: String, default: "" },
  description: { type: String, default: "" },
}, { _id: false });

const socialLinkSchema = new mongoose.Schema({
  platform: { type: String, default: "" },
  url: { type: String, default: "" },
  label: { type: String, default: "" },
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  type: { type: String, required: true },
  title: { type: String, default: "" },
  visible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  columns: { type: Number, default: 1 },
}, { _id: false });

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "My Resume" },
  template: { type: String, default: "modern" },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeTemplate" },
  fullName: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  location: { type: String, default: "" },
  headline: { type: String, default: "" },
  summary: { type: String, default: "" },
  website: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  github: { type: String, default: "" },
  twitter: { type: String, default: "" },
  portfolio: { type: String, default: "" },
  photo: { type: String, default: "" },
  education: [educationSchema],
  experience: [experienceSchema],
  skills: [{ type: String }],
  projects: [projectSchema],
  certifications: [certificateSchema],
  languages: [{ type: String }],
  achievements: [{ type: String }],
  awards: [{ type: String }],
  interests: [{ type: String }],
  references: [{ type: String }],
  socialLinks: [socialLinkSchema],
  sections: [sectionSchema],

  colors: {
    primary: { type: String, default: "#0A66C2" },
    secondary: { type: String, default: "#1F2937" },
    accent: { type: String, default: "#E5E7EB" },
    background: { type: String, default: "#FFFFFF" },
    text: { type: String, default: "#111827" },
  },
  fontConfig: {
    heading: { type: String, default: "Inter" },
    body: { type: String, default: "Inter" },
  },
  pageOptions: {
    marginTop: { type: Number, default: 40 },
    marginBottom: { type: Number, default: 40 },
    marginLeft: { type: Number, default: 40 },
    marginRight: { type: Number, default: 40 },
    spacing: { type: Number, default: 12 },
    showIcons: { type: Boolean, default: true },
    headerStyle: { type: String, default: "modern" },
    sectionDivider: { type: String, default: "line" },
    columns: { type: Number, default: 1 },
  },

  atsScore: { type: Number, default: 0 },
  atsData: { type: mongoose.Schema.Types.Mixed, default: {} },
  isPublic: { type: Boolean, default: false },
  publicSlug: { type: String, unique: true, sparse: true },
  isFavorite: { type: Boolean, default: false },
  status: { type: String, enum: ["draft", "complete", "archived"], default: "draft" },
  version: { type: Number, default: 1 },
  downloadCount: { type: Number, default: 0 },
  lastAutoSaved: { type: Date },
}, { timestamps: true });

resumeSchema.index({ user: 1, createdAt: -1 });
resumeSchema.index({ user: 1, title: 1 });
resumeSchema.index({ isPublic: 1, updatedAt: -1 });

export const Resume = mongoose.model("Resume", resumeSchema);
