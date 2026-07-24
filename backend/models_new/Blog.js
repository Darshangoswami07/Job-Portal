import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
  featured: { type: Boolean, default: false },
  readTime: { type: Number, default: 5 },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  publishedAt: { type: Date },
}, { timestamps: true });

blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ title: "text", content: "text" });
blogSchema.index({ status: 1, featured: 1, createdAt: -1 });

export const Blog = mongoose.model("Blog", blogSchema);
