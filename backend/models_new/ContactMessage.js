import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, default: "" },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isSpam: { type: Boolean, default: false },
  replied: { type: Boolean, default: false },
  repliedAt: { type: Date },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

contactMessageSchema.index({ isRead: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1 });

export const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
