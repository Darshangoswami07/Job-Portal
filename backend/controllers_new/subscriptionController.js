import { SubscriptionPlan, UserSubscription } from "../models_new/Subscription.js";

export const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ monthlyPrice: 1 });
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Plan deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const sub = await UserSubscription.findOne({ user: req.id, status: "active" }).populate("plan");
    res.json({ success: true, subscription: sub || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const { planId, billingCycle = "monthly" } = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    const existing = await UserSubscription.findOne({ user: req.id, status: "active" });
    if (existing) return res.status(400).json({ success: false, message: "You already have an active subscription" });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === "annual" ? 12 : 1));

    const sub = await UserSubscription.create({
      user: req.id,
      plan: planId,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEnd: plan.trialDays > 0 ? new Date(now.getTime() + plan.trialDays * 86400000) : undefined,
      status: plan.trialDays > 0 ? "active" : "active",
    });
    res.status(201).json({ success: true, subscription: sub });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const sub = await UserSubscription.findOne({ user: req.id, status: "active" });
    if (!sub) return res.status(404).json({ success: false, message: "No active subscription found" });
    sub.status = "canceled";
    sub.canceledAt = new Date();
    await sub.save();
    res.json({ success: true, message: "Subscription canceled" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
