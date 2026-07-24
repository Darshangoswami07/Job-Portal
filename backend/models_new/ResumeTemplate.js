import mongoose from "mongoose";

const colorPaletteSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  primary: { type: String, default: "#0A66C2" },
  secondary: { type: String, default: "#1F2937" },
  accent: { type: String, default: "#E5E7EB" },
  background: { type: String, default: "#FFFFFF" },
  text: { type: String, default: "#111827" },
  muted: { type: String, default: "#6B7280" },
  border: { type: String, default: "#E5E7EB" },
  success: { type: String, default: "#10B981" },
  warning: { type: String, default: "#F59E0B" },
}, { _id: false });

const fontConfigSchema = new mongoose.Schema({
  heading: { type: String, default: "Inter" },
  body: { type: String, default: "Inter" },
}, { _id: false });

const pageOptionsSchema = new mongoose.Schema({
  marginTop: { type: Number, default: 40 },
  marginBottom: { type: Number, default: 40 },
  marginLeft: { type: Number, default: 40 },
  marginRight: { type: Number, default: 40 },
  spacing: { type: Number, default: 12 },
  showIcons: { type: Boolean, default: true },
  headerStyle: { type: String, default: "modern" },
  sectionDivider: { type: String, default: "line" },
  columns: { type: Number, default: 1 },
}, { _id: false });

const resumeTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  category: { type: String, required: true, index: true },
  subcategory: { type: String, default: "" },
  tags: [{ type: String }],
  previewImage: { type: String, default: "" },
  thumbnail: { type: String, default: "" },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  downloads: { type: Number, default: 0 },
  favorites: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5 },
  ratingCount: { type: Number, default: 0 },
  atsScore: { type: Number, default: 85 },
  popularity: { type: Number, default: 0 },
  layout: { type: String, default: "modern" },
  font: { type: String, default: "Inter" },
  fontSize: { type: String, default: "11pt" },
  fontConfig: { type: fontConfigSchema, default: () => ({}) },
  colors: {
    primary: { type: String, default: "#0A66C2" },
    secondary: { type: String, default: "#1F2937" },
    accent: { type: String, default: "#E5E7EB" },
    background: { type: String, default: "#FFFFFF" },
    text: { type: String, default: "#111827" },
  },
  colorPalettes: [colorPaletteSchema],
  pageOptions: { type: pageOptionsSchema, default: () => ({}) },
  features: [{ type: String }],
  sections: [{ type: String }],
  structure: { type: mongoose.Schema.Types.Mixed, default: {} },
  previewSvg: { type: String, default: "" },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

resumeTemplateSchema.index({ category: 1, isActive: 1, popularity: -1 });
resumeTemplateSchema.index({ downloads: -1, rating: -1 });
resumeTemplateSchema.index({ tags: 1 });
resumeTemplateSchema.index({ name: "text", description: "text", tags: "text" });

export const ResumeTemplate = mongoose.model("ResumeTemplate", resumeTemplateSchema);
