import mongoose from "mongoose";

const hashtagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    postCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

hashtagSchema.index({ postCount: -1 });

export const SocialHashtag = mongoose.model("SocialHashtag", hashtagSchema);