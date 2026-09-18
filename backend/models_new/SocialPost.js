import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video", "pdf", "docx", "ppt", "document", "audio"],
      required: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    name: { type: String, default: "" },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: "" },
    thumb: { type: String, default: "" },
  },
  { _id: true }
);

const pollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 120 },
  votes: { type: Number, default: 0 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "text", "article", "image", "video", "document",
        "project", "hiring", "openToWork", "promotion", "certificate",
        "hackathon", "internship", "referral", "poll", "achievement",
        "interview", "advice", "portfolio", "github",
      ],
      default: "text",
      index: true,
    },
    content: { type: String, default: "", trim: true },
    contentText: { type: String, default: "" },
    media: [mediaSchema],
    visibility: {
      type: String,
      enum: ["public", "connections", "followers", "onlyMe", "recruitersOnly", "jobSeekersOnly"],
      default: "public",
    },

    hashtags: [{ type: String, trim: true, index: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    hiring: {
      title: String,
      companyName: String,
      location: String,
      employmentType: String,
      salary: { type: String },
      applyLink: String,
      isRemote: Boolean,
    },

    project: {
      name: String,
      description: String,
      url: String,
      github: String,
      demo: String,
      techStack: [String],
      status: String,
    },

    certificate: {
      name: String,
      issuer: String,
      issueDate: Date,
      credentialId: String,
      credentialUrl: String,
      fileUrl: String,
      publicId: String,
    },

    achievement: {
      title: String,
      category: { type: String, enum: ["hackathon", "award", "certification", "placement", "graduation", "promotion", "other"], default: "other" },
      description: String,
    },

    article: {
      title: String,
      coverUrl: String,
      readingTime: Number,
      tableOfContents: [String],
    },

    link: {
      url: String,
      title: String,
      description: String,
      image: String,
      domain: String,
    },

    poll: {
      question: { type: String },
      options: [pollOptionSchema],
      endsAt: Date,
      totalVotes: { type: Number, default: 0 },
    },

    tags: [{ type: String }],

    // --- Editorial / curated content (PLAN: Feed content architecture) ---
    // Editorial posts are JobPilot-authored or curated pieces. The UI badges
    // them ("Featured from JobPilot") so they are never mistaken for organic
    // user posts. `source` keeps attribution for any future external feed
    // integration (RSS / engineering blogs) — title + excerpt + link only.
    isEditorial: { type: Boolean, default: false, index: true },
    excerpt: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    readTime: { type: Number, default: 0 },
    source: {
      name: { type: String, default: "" },
      url: { type: String, default: "" },
    },

    reactionCounts: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      celebrate: { type: Number, default: 0 },
      insightful: { type: Number, default: 0 },
      support: { type: Number, default: 0 },
      funny: { type: Number, default: 0 },
      applause: { type: Number, default: 0 },
    },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },

    pinned: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    isPoll: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["active", "hidden", "reported", "deleted"],
      default: "active",
    },
    moderation: {
      reviewed: { type: Boolean, default: false },
      flaggedBySystem: { type: Boolean, default: false },
      flagReason: { type: String, default: "" },
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ isEditorial: 1, status: 1 });
postSchema.index({ "moderation.flaggedBySystem": 1 });
postSchema.index({ contentText: "text" });

export const SocialPost = mongoose.model("SocialPost", postSchema);