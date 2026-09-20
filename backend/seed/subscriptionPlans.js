import { SubscriptionPlan } from "../models_new/Subscription.js";

/**
 * JobPilot AI subscription plans.
 *
 * Prices are stored in INR (the platform's base currency). The frontend renders
 * localized prices from `frontend/src/config/pricing.js`; this seed only needs to
 * keep the DB in sync so the subscribe flow has a plan document to reference.
 *
 * Annual price = 12 months with a 20% discount (never hardcoded inconsistently).
 */
const ANNUAL_DISCOUNT = 0.2;
const annual = (monthly) => Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT));

const PLANS = [
  {
    slug: "free",
    name: "Free",
    description: "Everything you need to start your job search.",
    monthlyPrice: 0,
    isPopular: false,
    trialDays: 0,
    maxResumes: 1,
    maxCoverLetters: 1,
    aiSuggestions: false,
    prioritySupport: false,
    features: [
      "Basic job search",
      "Job bookmarking",
      "Basic career profile",
      "Limited AI tools",
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    description: "For serious job seekers who want the full AI toolkit.",
    monthlyPrice: 499,
    isPopular: true,
    trialDays: 14,
    maxResumes: 10,
    maxCoverLetters: 20,
    aiSuggestions: true,
    prioritySupport: false,
    features: [
      "Unlimited job search",
      "AI resume builder",
      "ATS resume checker",
      "AI cover letter generator",
      "Mock interviews",
      "Career recommendations",
      "Priority access to AI features",
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    description: "Advanced coaching and optimization for a faster offer.",
    monthlyPrice: 999,
    isPopular: false,
    trialDays: 0,
    maxResumes: 100,
    maxCoverLetters: 100,
    aiSuggestions: true,
    prioritySupport: true,
    features: [
      "Everything in Pro",
      "Advanced AI career coaching",
      "Advanced resume optimization",
      "Personalized career roadmap",
      "Advanced interview preparation",
      "Priority support",
      "Premium AI features",
    ],
  },
];

export async function seedSubscriptionPlans() {
  try {
    for (const p of PLANS) {
      const doc = {
        ...p,
        annualPrice: annual(p.monthlyPrice),
        isActive: true,
      };
      // Upsert by slug so price/feature edits in this file propagate on restart,
      // while admin edits to non-seeded fields are preserved.
      await SubscriptionPlan.updateOne(
        { slug: p.slug },
        { $set: doc },
        { upsert: true }
      );
    }
    console.log(`✓ Subscription plans ready (${PLANS.length})`);
  } catch (err) {
    console.error("Subscription plan seed failed:", err.message);
  }
}
