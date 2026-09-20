import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "SocialPost", required: true, index: true },
    collection: { type: String, default: "Saved Posts", trim: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, collection: 1, createdAt: -1 });

export const SocialBookmark = mongoose.model("SocialBookmark", bookmarkSchema);