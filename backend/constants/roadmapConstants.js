export const JOB_MARKET_DEMAND = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  VERY_HIGH: "very high",
};

export const VALID_DEMAND_VALUES = Object.values(JOB_MARKET_DEMAND);

export function normalizeDemand(value) {
  if (!value) return JOB_MARKET_DEMAND.MEDIUM;
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, " ");
  if (normalized === "very high" || normalized === "veryhigh") return JOB_MARKET_DEMAND.VERY_HIGH;
  if (normalized === "high") return JOB_MARKET_DEMAND.HIGH;
  if (normalized === "medium" || normalized === "med") return JOB_MARKET_DEMAND.MEDIUM;
  if (normalized === "low") return JOB_MARKET_DEMAND.LOW;
  return JOB_MARKET_DEMAND.MEDIUM;
}

export function normalizeJobMarket(jobMarket) {
  if (!jobMarket) return { demand: JOB_MARKET_DEMAND.MEDIUM, averageSalary: 800000, hiringCompanies: [], growthRate: 10, competition: "medium", trendingSkills: [] };
  return { ...jobMarket, demand: normalizeDemand(jobMarket.demand) };
}

export const DEFAULT_JOB_MARKET = {
  demand: JOB_MARKET_DEMAND.MEDIUM,
  averageSalary: 800000,
  hiringCompanies: [],
  growthRate: 10,
  competition: "medium",
  trendingSkills: [],
};
