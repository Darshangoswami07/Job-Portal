/**
 * Centralized pricing configuration for JobPilot AI.
 *
 * This is the single source of truth for what the Pricing page displays.
 * To change prices later, edit ONLY the `pricingPlans[*].price` values below.
 * Annual prices are derived automatically (see ANNUAL_DISCOUNT) — never hardcode
 * them separately.
 *
 * The backend `SubscriptionPlan` collection is kept in sync via
 * `backend/seed/subscriptionPlans.js` (matched by `slug`).
 */

export const ANNUAL_DISCOUNT = 0.2; // 20% off the equivalent 12 months

export const CURRENCIES = {
  INR: { code: "INR", symbol: "₹", locale: "en-IN", flag: "🇮🇳", label: "INR", country: "IN" },
  USD: { code: "USD", symbol: "$", locale: "en-US", flag: "🇺🇸", label: "USD", country: "US" },
};

export const DEFAULT_CURRENCY = "USD";

/** Countries that should map to INR. Everything else falls back to USD. */
export const INR_COUNTRIES = new Set(["IN"]);

export const pricingPlans = [
  {
    slug: "free",
    name: "Free",
    description: "Everything you need to start your job search.",
    isPopular: false,
    cta: "Get Started",
    price: { inr: 0, usd: 0 },
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
    isPopular: true,
    cta: "Start Pro",
    price: { inr: 499, usd: 9.99 },
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
    isPopular: false,
    cta: "Get Premium",
    price: { inr: 999, usd: 19.99 },
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

/** Monthly price for a plan in the given currency code ("INR" | "USD"). */
export function getMonthlyPrice(plan, currencyCode) {
  return currencyCode === "INR" ? plan.price.inr : plan.price.usd;
}

/** Annual price = 12 months with the annual discount applied. */
export function getAnnualPrice(plan, currencyCode) {
  const yearly = getMonthlyPrice(plan, currencyCode) * 12 * (1 - ANNUAL_DISCOUNT);
  return currencyCode === "INR" ? Math.round(yearly) : Math.round(yearly * 100) / 100;
}

/** Effective monthly price shown under an annual plan (annual / 12). */
export function getAnnualPerMonth(plan, currencyCode) {
  const perMonth = getAnnualPrice(plan, currencyCode) / 12;
  return currencyCode === "INR" ? Math.round(perMonth) : Math.round(perMonth * 100) / 100;
}

/** Format a numeric amount as a localized currency string (no decimals for whole values). */
export function formatPrice(amount, currencyCode) {
  const { locale, symbol } = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const hasFraction = Math.round(amount) !== amount;
  return `${symbol}${amount.toLocaleString(locale, {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
