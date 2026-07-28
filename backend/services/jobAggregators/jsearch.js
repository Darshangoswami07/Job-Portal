const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "jsearch.p.rapidapi.com";

export const isJSearchConfigured = () => Boolean(RAPIDAPI_KEY);

export async function fetchJSearchJobs({ query = "software developer in India", page = 1 } = {}) {
  if (!isJSearchConfigured()) return [];

  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("num_pages", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
  });
  if (!res.ok) {
    throw new Error(`JSearch API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();

  return (data.data || []).map((job) => ({
    title: job.job_title,
    company: job.employer_name || "Unknown Company",
    companyLogoUrl: job.employer_logo || "",
    location: [job.job_city, job.job_country].filter(Boolean).join(", "),
    salaryRange: job.job_min_salary || job.job_max_salary
      ? `${job.job_min_salary || 0} - ${job.job_max_salary || 0} ${job.job_salary_currency || ""}`.trim()
      : "",
    source: job.job_publisher || "JSearch",
    sourceUrl: job.job_apply_link,
    postedDate: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : new Date(),
    description: job.job_description || "",
    externalId: job.job_id,
  }));
}
