const KEYWORDS = [
  "Spring Boot",
  "Spring MVC",
  "Node.js",
  "Next.js",
  "React Native",
  "TypeScript",
  "JavaScript",
  "PostgreSQL",
  "Kubernetes",
  "Microservices",
  "Microservice",
  "Elasticsearch",
  "Docker",
  "MongoDB",
  "GraphQL",
  "DynamoDB",
  "RabbitMQ",
  "Redis",
  "Angular",
  "Terraform",
  "Golang",
  "Python",
  "Kafka",
  "MySQL",
  "Lambda",
  "React",
  "Spring",
  "AWS",
  "Vue",
  "SQL",
  "NoSQL",
  "Git",
  "CI/CD",
  "Linux",
  "Java",
].sort((a, b) => b.length - a.length);

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const KEYWORD_RE_SOURCE = `(?<![A-Za-z0-9])(?:${KEYWORDS.map(escapeRegex).join(
  "|"
)})(?![A-Za-z0-9])`;

export function highlightKeywords(text) {
  if (!text) return null;
  const re = new RegExp(KEYWORD_RE_SOURCE, "gi");
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlight: false });
    }
    parts.push({ text: match[0], highlight: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }
  return parts;
}

export function daysAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) {
    const hours = Math.max(1, Math.floor(diff / (1000 * 60 * 60)));
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  if (n >= 1000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `${n}`;
}

export function formatSalary(job) {
  const currency = job?.salaryCurrency === "INR" ? "₹" : "$";
  const value = Number(job?.salary) || 0;
  const formatted = value.toLocaleString("en-IN");
  return { currency, value: formatted, lpa: job?.salaryCurrency === "INR" };
}

export function getSalaryRange(job) {
  const base = Number(job?.salary) || 0;
  const min = Number(job?.salaryMin) || Math.round(base * 0.8);
  const max = Number(job?.salaryMax) || Math.round(base * 1.25);
  const avg = Number(job?.salary) || Math.round((min + max) / 2);
  return { min, avg, max, derived: !job?.salaryMin || !job?.salaryMax };
}

export function formatExperience(job) {
  const min = job?.experienceMin ?? job?.experienceLevel;
  const max = job?.experienceMax;
  if (min == null) return "Fresher";
  if (max != null && max !== min) return `${min}-${max} yrs`;
  return `${min}+ yrs`;
}

export function getWorkType(job) {
  return job?.workType || "On-site";
}

export function getHiringStatus(job) {
  if (job?.deadline && new Date(job.deadline) < new Date()) {
    return { label: "Closed", tone: "gray" };
  }
  if (job?.urgent) return { label: "Urgently Hiring", tone: "red" };
  if (job?.featured || job?.trending) return { label: "Actively Hiring", tone: "green" };
  return { label: "Actively Hiring", tone: "green" };
}

export function getApplicantCount(job) {
  return Number(job?.applicantsCount) || job?.applications?.length || 0;
}

function hashString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getCompanyRating(companyName) {
  if (!companyName) return 4.5;
  return Math.round((4.1 + (hashString(companyName) % 10) / 10) * 10) / 10;
}

export function getCompanySize(companyName) {
  const sizes = [
    "11-50 employees",
    "51-200 employees",
    "201-500 employees",
    "501-1,000 employees",
    "1,000-5,000 employees",
    "5,000+ employees",
  ];
  if (!companyName) return sizes[0];
  return sizes[hashString(companyName) % sizes.length];
}

export function getResponseRate(job) {
  const base = 62;
  const ai = Math.min(28, (Number(job?.aiMatch) || 0) / 3);
  const applicants = Math.min(8, getApplicantCount(job) * 0.15);
  return Math.min(98, Math.round(base + ai + applicants));
}

export function getInterviewDuration(job) {
  const map = { easy: 30, medium: 45, hard: 60 };
  return map[job?.interviewDifficulty] || 45;
}

export function getHiringUrgency(job) {
  if (job?.urgent) return { label: "High", value: 92, tone: "red" };
  if (job?.featured || job?.trending) return { label: "Medium", value: 68, tone: "amber" };
  return { label: "Normal", value: 45, tone: "green" };
}

export function isVerified(job) {
  return Boolean(job?.verified || job?.company?.verified);
}

export function getCompanyWebsite(job) {
  const raw = job?.company?.website;
  if (!raw) return "";
  return raw.startsWith("http") ? raw : `https://${raw}`;
}
