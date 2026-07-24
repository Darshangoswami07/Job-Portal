import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  monthlyPrice: { type: Number, required: true },
  annualPrice: { type: Number, required: true },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  trialDays: { type: Number, default: 0 },
  maxResumes: { type: Number, default: 1 },
  maxCoverLetters: { type: Number, default: 1 },
  aiSuggestions: { type: Boolean, default: false },
  prioritySupport: { type: Boolean, default: false },
}, { timestamps: true });

const userSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
  status: { type: String, enum: ["active", "canceled", "expired", "past_due"], default: "active" },
  billingCycle: { type: String, enum: ["monthly", "annual"], default: "monthly" },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  trialEnd: { type: Date },
  canceledAt: { type: Date },
  stripeCustomerId: { type: String, default: "" },
  stripeSubscriptionId: { type: String, default: "" },
  razorpaySubscriptionId: { type: String, default: "" },
  paymentMethod: { type: String, default: "" },
  invoices: [{
    amount: { type: Number },
    currency: { type: String, default: "INR" },
    status: { type: String },
    invoiceUrl: { type: String },
    paidAt: { type: Date },
  }],
}, { timestamps: true });

userSubscriptionSchema.index({ user: 1 });
userSubscriptionSchema.index({ status: 1 });

export const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
export const UserSubscription = mongoose.model("UserSubscription", userSubscriptionSchema);
