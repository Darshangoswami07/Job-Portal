const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

export const isJoobleConfigured = () => Boolean(JOOBLE_API_KEY);

export async function fetchJoobleJobs({ keywords = "software developer", location = "India", page = 1 } = {}) {
  if (!isJoobleConfigured()) return [];

  const url = `https://jooble.org/api/${JOOBLE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords, location, page: String(page) }),
  });
  if (!res.ok) {
    throw new Error(`Jooble API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();

  return (data.jobs || []).map((job) => ({
    title: job.title,
    company: job.company || "Unknown Company",
    companyLogoUrl: "",
    location: job.location || "",
    salaryRange: job.salary || "",
    source: "Jooble",
    sourceUrl: job.link,
    postedDate: job.updated ? new Date(job.updated) : new Date(),
    description: job.snippet || "",
    externalId: job.id ? String(job.id) : job.link,
  }));
}
