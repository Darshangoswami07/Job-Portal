const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

const COUNTRY = process.env.ADZUNA_COUNTRY || "in";

export const isAdzunaConfigured = () => Boolean(ADZUNA_APP_ID && ADZUNA_APP_KEY);

export async function fetchAdzunaJobs({ what = "software developer", page = 1, resultsPerPage = 20 } = {}) {
  if (!isAdzunaConfigured()) return [];

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/${page}`);
  url.searchParams.set("app_id", ADZUNA_APP_ID);
  url.searchParams.set("app_key", ADZUNA_APP_KEY);
  url.searchParams.set("results_per_page", String(resultsPerPage));
  url.searchParams.set("what", what);
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Adzuna API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();

  return (data.results || []).map((job) => ({
    title: job.title,
    company: job.company?.display_name || "Unknown Company",
    companyLogoUrl: "",
    location: job.location?.display_name || "",
    salaryRange: job.salary_min || job.salary_max
      ? `${Math.round(job.salary_min || 0)} - ${Math.round(job.salary_max || 0)}`
      : "",
    source: "Adzuna",
    sourceUrl: job.redirect_url,
    postedDate: job.created ? new Date(job.created) : new Date(),
    description: job.description || "",
    externalId: String(job.id),
  }));
}
