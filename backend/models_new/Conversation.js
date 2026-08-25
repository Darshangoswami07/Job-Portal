import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, unique: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  jobSeeker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lastMessage: { type: String, default: "" },
  lastMessageAt: { type: Date, default: null },
  lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

conversationSchema.index({ jobSeeker: 1, updatedAt: -1 });
conversationSchema.index({ recruiter: 1, updatedAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
