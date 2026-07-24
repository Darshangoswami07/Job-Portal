import crypto from "crypto";

const ACTION_VERBS = [
  "Developed", "Led", "Architected", "Designed", "Implemented",
  "Optimized", "Delivered", "Automated", "Built", "Engineered",
  "Spearheaded", "Drove", "Established", "Managed", "Transformed",
  "Accelerated", "Championed", "Orchestrated", "Generated", "Streamlined",
  "Achieved", "Launched", "Created", "Improved", "Reduced",
  "Increased", "Negotiated", "Coordinated", "Mentored", "Integrated"
];

const ATS_FRIENDLY_FONTS = ["Arial", "Calibri", "Verdana", "Tahoma", "Georgia", "Times New Roman", "Helvetica", "Trebuchet MS", "Cambria", "Segoe UI"];

const INDUSTRY_KEYWORDS = {
  frontend: ["React", "TypeScript", "Next.js", "Tailwind CSS", "REST APIs", "GraphQL", "Jest", "Cypress", "Webpack", "Responsive Design", "Accessibility", "Performance Optimization", "Redux", "Vue.js", "Angular", "HTML5", "CSS3", "SASS", "WebSocket"],
  backend: ["Node.js", "Python", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "CI/CD", "Microservices", "GraphQL", "AWS", "System Design", "Express", "NestJS", "MySQL", "RabbitMQ", "Kafka", "REST API", "JWT"],
  fullstack: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS", "REST APIs", "GraphQL", "CI/CD", "Agile", "Testing", "DevOps", "Next.js", "MongoDB", "Tailwind CSS"],
  data: ["Python", "TensorFlow", "PyTorch", "SQL", "Pandas", "Scikit-learn", "Data Pipelines", "MLOps", "Statistics", "Deep Learning", "NLP", "Computer Vision", "Tableau", "Power BI", "ETL", "Apache Spark"],
  devops: ["Docker", "Kubernetes", "Terraform", "Jenkins", "Ansible", "AWS", "GCP", "CI/CD", "Monitoring", "Linux", "GitOps", "Helm", "Prometheus", "Grafana", "Azure"],
  mobile: ["React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android", "Firebase", "App Store", "Google Play", "Mobile UI", "Push Notifications"],
  cybersecurity: ["Network Security", "Penetration Testing", "SIEM", "Firewall", "Encryption", "IAM", "Compliance", "Risk Assessment", "Incident Response", "Vulnerability Assessment"],
  engineering: ["AutoCAD", "SolidWorks", "MATLAB", "Simulink", "PLC", "SCADA", "CAD/CAM", "Finite Element Analysis", "Root Cause Analysis", "Six Sigma"],
  marketing: ["SEO", "SEM", "Google Analytics", "Content Strategy", "Social Media", "Email Marketing", "CRM", "PPC", "Marketing Automation", "A/B Testing"],
  product: ["Product Strategy", "Roadmapping", "User Research", "A/B Testing", "Agile", "JIRA", "Confluence", "Stakeholder Management", "KPI Definition", "OKRs"],
  hr: ["Recruiting", "Onboarding", "HRIS", "Payroll", "Employee Relations", "Performance Management", "Talent Acquisition", "Compliance", "Benefits Administration"],
  finance: ["Financial Analysis", "Forecasting", "QuickBooks", "SAP", "Financial Reporting", "Budgeting", "Audit", "Tax Compliance", "Risk Management"],
  sales: ["CRM", "Salesforce", "Cold Calling", "Lead Generation", "Account Management", "Negotiation", "Pipeline Management", "B2B Sales", "Revenue Growth"],
};

const PASSIVE_INDICATORS = /\b(was|were|been|being|am|is|are|be|been|being)\s+\w+ed\b/gi;
const HEDGING_WORDS = /\b(i think|maybe|perhaps|i believe|it seems|kind of|sort of|probably|possibly|might be)\b/gi;
const WEAK_VERBS = /\b(was responsible for|was involved in|worked on|helped with|tasked with|participated in|assisted with|did|made|got)\b/gi;

function detectCategory(skills) {
  const skillStr = (skills || []).join(" ").toLowerCase();
  if (skillStr.includes("react") || skillStr.includes("css") || skillStr.includes("html") || skillStr.includes("javascript") || skillStr.includes("vue") || skillStr.includes("angular")) return "frontend";
  if (skillStr.includes("node") || skillStr.includes("express") || skillStr.includes("sql") || skillStr.includes("mongodb") || skillStr.includes("redis")) return "backend";
  if (skillStr.includes("python") || skillStr.includes("tensorflow") || skillStr.includes("data") || skillStr.includes("machine learning") || skillStr.includes("pandas") || skillStr.includes("pytorch")) return "data";
  if (skillStr.includes("docker") || skillStr.includes("kubernetes") || skillStr.includes("aws") || skillStr.includes("jenkins") || skillStr.includes("terraform")) return "devops";
  if (skillStr.includes("kotlin") || skillStr.includes("swift") || skillStr.includes("flutter") || skillStr.includes("react native") || skillStr.includes("android")) return "mobile";
  if (skillStr.includes("security") || skillStr.includes("cyber") || skillStr.includes("penetration") || skillStr.includes("firewall")) return "cybersecurity";
  if (skillStr.includes("autocad") || skillStr.includes("solidworks") || skillStr.includes("matlab")) return "engineering";
  if (skillStr.includes("seo") || skillStr.includes("google analytics") || skillStr.includes("content strategy") || skillStr.includes("marketing")) return "marketing";
  if (skillStr.includes("product") || skillStr.includes("roadmap") || skillStr.includes("jira") || skillStr.includes("user research")) return "product";
  if (skillStr.includes("recruiting") || skillStr.includes("hr") || skillStr.includes("talent") || skillStr.includes("onboarding") || skillStr.includes("payroll")) return "hr";
  if (skillStr.includes("financial") || skillStr.includes("forecasting") || skillStr.includes("quickbooks") || skillStr.includes("audit")) return "finance";
  if (skillStr.includes("sales") || skillStr.includes("crm") || skillStr.includes("salesforce") || skillStr.includes("lead generation") || skillStr.includes("b2b")) return "sales";
  return "fullstack";
}

export function extractResumeData(text) {
  const data = {
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    portfolio: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    achievements: [],
    languages: [],
    awards: [],
  };

  if (!text || text.trim().length < 20) return data;

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const linkedinRegex = /linkedin\.com\/[^\s,]+/gi;
  const githubRegex = /github\.com\/[^\s,]+/gi;
  const urlRegex = /https?:\/\/(?!linkedin\.com)(?!github\.com)[^\s,]+/gi;

  const emails = text.match(emailRegex);
  if (emails) data.email = emails[0];

  const phones = text.match(phoneRegex);
  if (phones) data.phone = phones[0];

  const linkedins = text.match(linkedinRegex);
  if (linkedins) data.linkedin = "https://" + linkedins[0];

  const githubs = text.match(githubRegex);
  if (githubs) data.github = "https://" + githubs[0];

  const urls = text.match(urlRegex);
  if (urls) data.portfolio = urls[0];

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^(resume|cv|curriculum vitae)[:\s]*/i, "").trim();
    if (firstLine.length < 60 && !firstLine.includes("@") && !firstLine.match(/^[\d\s\-+()]+$/)) {
      data.fullName = firstLine;
    }
  }

  let currentSection = "header";
  let summaryLines = [];
  let inSummary = false;

  const sectionHeaders = [
    { regex: /^(summary|professional summary|profile|about me|carrer objective|professional profile)[:\s]*$/i, name: "summary" },
    { regex: /^(skills|technical skills|core competencies|key skills|expertise)[:\s]*$/i, name: "skills" },
    { regex: /^(experience|work experience|professional experience|employment|work history)[:\s]*$/i, name: "experience" },
    { regex: /^(education|academic background|academic)[:\s]*$/i, name: "education" },
    { regex: /^(certifications|certificates|certification|professional certifications)[:\s]*$/i, name: "certifications" },
    { regex: /^(projects|professional projects|personal projects|project)[:\s]*$/i, name: "projects" },
    { regex: /^(achievements|accomplishments|awards|honors)[:\s]*$/i, name: "achievements" },
    { regex: /^(languages)[:\s]*$/i, name: "languages" },
    { regex: /^(publications)[:\s]*$/i, name: "publications" },
    { regex: /^(volunteer|volunteering|volunteer experience)[:\s]*$/i, name: "volunteer" },
    { regex: /^(languages)[:\s]*$/i, name: "languages" },
    { regex: /^(interests|hobbies)[:\s]*$/i, name: "interests" },
    { regex: /^(references)[:\s]*$/i, name: "references" },
  ];

  let currentExp = null;
  let currentEdu = null;
  let currentCert = null;
  let currentProj = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let matched = false;

    for (const sh of sectionHeaders) {
      if (sh.regex.test(line)) {
        currentSection = sh.name;
        inSummary = sh.name === "summary";
        matched = true;
        break;
      }
    }
    if (matched) continue;

    if (currentSection === "summary") {
      if (line.length > 10) summaryLines.push(line);
    } else if (currentSection === "skills") {
      const skills = line.split(/[,•·|;/]+/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 40);
      data.skills.push(...skills);
    } else if (currentSection === "experience") {
      const dateMatch = line.match(/(\w+\s?\d{4})\s*[-–to]+\s*(\w+\s?\d{4}|present|current|now)/i);
      if (dateMatch) {
        if (currentExp) data.experience.push(currentExp);
        currentExp = { company: "", title: "", location: "", startDate: dateMatch[1], endDate: dateMatch[2], current: /present|current|now/i.test(dateMatch[2]), description: "" };
        const beforeDate = line.substring(0, line.indexOf(dateMatch[0])).trim();
        if (beforeDate) currentExp.title = beforeDate;
        const afterDate = line.substring(line.indexOf(dateMatch[0]) + dateMatch[0].length).trim();
        if (afterDate) currentExp.company = afterDate;
      } else if (currentExp && line.length > 3) {
        if (!currentExp.title && (line.length < 60)) currentExp.title = line;
        else if (!currentExp.company && (line.length < 60) && currentExp.title) currentExp.company = line;
        else if (currentExp.title && currentExp.company) {
          currentExp.description += (currentExp.description ? " " : "") + line;
        } else currentExp.title = line;
      }
    } else if (currentSection === "education") {
      const dateMatch = line.match(/(\w+\s?\d{4})\s*[-–to]+\s*(\w+\s?\d{4}|present|current|now)/i);
      if (dateMatch && line.length < 100) {
        if (currentEdu) data.education.push(currentEdu);
        currentEdu = { institution: "", degree: "", field: "", startDate: dateMatch[1], endDate: dateMatch[2], grade: "" };
      } else if (currentEdu) {
        if (!currentEdu.degree) { currentEdu.degree = line; } else if (!currentEdu.institution) { currentEdu.institution = line; } else if (/(gpa|grade|percentage)/i.test(line)) { currentEdu.grade = line; }
      } else if (/(university|college|institute|school)/i.test(line) && line.length < 80) {
        currentEdu = { institution: line, degree: "", field: "", startDate: "", endDate: "", grade: "" };
      }
    } else if (currentSection === "certifications") {
      if (/^\s*[•·\-*\d]+/.test(line) || line.length < 80) {
        data.certifications.push({ name: line.replace(/^[•·\-*\d.\s]+/, "").trim(), issuer: "", date: "" });
      } else if (data.certifications.length > 0) {
        const last = data.certifications[data.certifications.length - 1];
        if (!last.issuer) last.issuer = line;
      }
    } else if (currentSection === "projects") {
      if (line.length < 80 && !line.startsWith(" ") && line.length > 3) {
        if (currentProj) data.projects.push(currentProj);
        currentProj = { name: line, description: "", technologies: [], url: "" };
      } else if (currentProj) {
        currentProj.description += (currentProj.description ? " " : "") + line;
        if (/(github|gitlab|bitbucket)/i.test(line)) currentProj.url = line.match(/https?:\/\/[^\s,]+/i)?.[0] || "";
      }
    } else if (currentSection === "achievements" || currentSection === "awards") {
      if (line.length > 5) data.achievements.push(line.replace(/^[•·\-*\d.\s]+/, "").trim());
    } else if (currentSection === "languages") {
      data.languages.push(...line.split(/[,•·|;/]+/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 30));
    }
  }

  if (currentExp) data.experience.push(currentExp);
  if (currentEdu) data.education.push(currentEdu);
  if (currentProj) data.projects.push(currentProj);

  data.summary = summaryLines.join(" ").trim();
  data.skills = [...new Set(data.skills.map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()))];

  return data;
}

export function calculateATSScore(parsedData, text, jdText) {
  const scores = {
    atsScore: 0, formattingScore: 0, keywordScore: 0, readabilityScore: 0,
    grammarScore: 0, skillsScore: 0, experienceScore: 0, projectsScore: 0,
    educationScore: 0, certificationsScore: 0, overallScore: 0, confidenceScore: 0,
  };
  const details = {
    hasSections: false, hasContactInfo: false, hasQuantifiedAchievements: false,
    hasActionVerbs: false, summaryLength: 0, totalSkills: 0,
    experienceYears: 0, educationLevel: "", certificationsCount: 0,
    projectsCount: 0, bulletPoints: 0, wordCount: 0, sectionCount: 0,
  };

  const words = text ? text.split(/\s+/).filter(w => w.length > 0) : [];
  details.wordCount = words.length;

  const sections = ["summary", "skills", "experience", "education", "projects", "certifications"];
  details.sectionCount = sections.filter(s => {
    if (s === "summary") return parsedData.summary && parsedData.summary.length > 20;
    if (s === "skills") return parsedData.skills && parsedData.skills.length > 0;
    if (s === "experience") return parsedData.experience && parsedData.experience.length > 0;
    if (s === "education") return parsedData.education && parsedData.education.length > 0;
    if (s === "projects") return parsedData.projects && parsedData.projects.length > 0;
    if (s === "certifications") return parsedData.certifications && parsedData.certifications.length > 0;
    return false;
  }).length;
  details.hasSections = details.sectionCount >= 4;

  details.hasContactInfo = !!(parsedData.email || parsedData.phone);
  details.totalSkills = parsedData.skills.length;
  details.certificationsCount = parsedData.certifications.length;
  details.projectsCount = parsedData.projects.length;
  details.summaryLength = parsedData.summary ? parsedData.summary.length : 0;

  const expYears = parsedData.experience.reduce((sum, exp) => {
    if (exp.startDate) {
      const startYear = parseInt(exp.startDate.match(/\d{4}/)?.[0]) || 0;
      const endYear = exp.current ? new Date().getFullYear() : parseInt(exp.endDate?.match(/\d{4}/)?.[0]) || 0;
      return sum + Math.max(0, endYear - startYear);
    }
    return sum;
  }, 0);
  details.experienceYears = expYears || (parsedData.experience.length * 2);

  if (text) {
    details.hasQuantifiedAchievements = /\d+%|\d+x|\$\d+|\d+\s+(million|thousand|users|clients|customers|projects|team|%|x|people)/i.test(text);
    details.hasActionVerbs = ACTION_VERBS.some(v => text.includes(v));
    details.bulletPoints = (text.match(/^[•·\-*]\s/gm) || []).length;
  }

  scores.formattingScore = calculateFormattingScore(details, text);
  scores.readabilityScore = calculateReadabilityScore(text, words);
  scores.grammarScore = calculateGrammarScore(text);
  scores.skillsScore = calculateSkillsScore(parsedData);
  scores.experienceScore = calculateExperienceScore(parsedData, text);
  scores.projectsScore = calculateProjectsScore(parsedData);
  scores.educationScore = calculateEducationScore(parsedData);
  scores.certificationsScore = calculateCertificationsScore(parsedData);
  scores.keywordScore = calculateKeywordScore(parsedData, text, jdText);

  const category = detectCategory(parsedData.skills);
  const relevantKeywords = INDUSTRY_KEYWORDS[category] || INDUSTRY_KEYWORDS.fullstack;

  let baseScore = 40;
  if (details.hasSections) baseScore += 10;
  if (details.hasContactInfo) baseScore += 5;
  if (details.hasQuantifiedAchievements) baseScore += 10;
  if (details.hasActionVerbs) baseScore += 10;
  if (details.summaryLength > 50) baseScore += 5;
  if (details.sectionCount >= 5) baseScore += 5;

  const keywordMatchCount = relevantKeywords.filter(k => text && text.toLowerCase().includes(k.toLowerCase())).length;
  const keywordRatio = relevantKeywords.length > 0 ? keywordMatchCount / relevantKeywords.length : 0;
  baseScore += Math.round(keywordRatio * 10);

  if (details.experienceYears >= 2) baseScore += 5;
  if (details.experienceYears >= 5) baseScore += 5;
  if (details.totalSkills >= 8) baseScore += 5;
  if (details.projectsCount >= 2) baseScore += 5;

  scores.atsScore = Math.min(100, Math.max(10, baseScore));

  scores.overallScore = Math.round(
    scores.atsScore * 0.15 +
    scores.formattingScore * 0.10 +
    scores.keywordScore * 0.15 +
    scores.readabilityScore * 0.10 +
    scores.grammarScore * 0.10 +
    scores.skillsScore * 0.10 +
    scores.experienceScore * 0.12 +
    scores.projectsScore * 0.08 +
    scores.educationScore * 0.05 +
    scores.certificationsScore * 0.05
  );

  scores.confidenceScore = Math.min(95, Math.round(50 + (words.length / 200) * 30 + details.sectionCount * 3));

  return { scores, details };
}

function calculateFormattingScore(details, text) {
  let score = 60;
  if (details.hasSections) score += 10;
  if (details.bulletPoints >= 5) score += 10;
  if (details.wordCount >= 300 && details.wordCount <= 800) score += 10;
  if (details.wordCount >= 200) score += 5;
  if (details.sectionCount >= 4) score += 5;
  return Math.min(100, Math.max(10, score));
}

function calculateReadabilityScore(text, words) {
  if (!text || words.length < 20) return 50;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 20;
  let score = 70;
  if (avgSentenceLength >= 10 && avgSentenceLength <= 20) score += 15;
  else if (avgSentenceLength >= 8 && avgSentenceLength <= 25) score += 10;
  else score -= 10;
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 30).length;
  if (longSentences > sentences.length * 0.3) score -= 10;
  if (sentences.length >= 5) score += 5;
  return Math.min(100, Math.max(10, score));
}

function calculateGrammarScore(text) {
  if (!text || text.length < 20) return 50;
  let score = 85;
  const issues = [];
  const passiveMatches = text.match(PASSIVE_INDICATORS);
  if (passiveMatches) { score -= passiveMatches.length * 3; issues.push(...passiveMatches); }
  const hedgingMatches = text.match(HEDGING_WORDS);
  if (hedgingMatches) { score -= hedgingMatches.length * 2; }
  const weakVerbMatches = text.match(WEAK_VERBS);
  if (weakVerbMatches) { score -= weakVerbMatches.length * 4; }
  const doubleSpace = (text.match(/  +/g) || []).length;
  score -= doubleSpace;
  const missingPeriods = (text.match(/[a-z]\n[a-z]/g) || []).length;
  score -= missingPeriods;
  return Math.min(100, Math.max(10, score));
}

function calculateSkillsScore(parsedData) {
  let score = 40;
  const count = parsedData.skills.length;
  if (count >= 15) score = 95;
  else if (count >= 12) score = 90;
  else if (count >= 10) score = 85;
  else if (count >= 8) score = 80;
  else if (count >= 6) score = 70;
  else if (count >= 4) score = 60;
  else if (count >= 2) score = 50;
  else score = 30;
  return Math.min(100, Math.max(10, score));
}

function calculateExperienceScore(parsedData, text) {
  let score = 40;
  const count = parsedData.experience.length;
  if (count >= 4) score += 20;
  else if (count >= 3) score += 15;
  else if (count >= 2) score += 10;
  else if (count >= 1) score += 5;
  if (text && /\d{4}\s*[-–]\s*(present|current|\d{4})/i.test(text)) score += 10;
  if (parsedData.experience.some(e => e.description && e.description.length > 50)) score += 10;
  if (text && /\d+%|\$\d+|revenue|increased|decreased|improved|reduced/i.test(text)) score += 15;
  if (text && ACTION_VERBS.some(v => text.includes(v))) score += 10;
  return Math.min(100, Math.max(10, score));
}

function calculateProjectsScore(parsedData) {
  let score = 40;
  const count = parsedData.projects.length;
  if (count >= 5) score = 95;
  else if (count >= 4) score = 90;
  else if (count >= 3) score = 85;
  else if (count >= 2) score = 75;
  else if (count >= 1) score = 60;
  else score = 30;
  if (parsedData.projects.some(p => p.technologies && p.technologies.length > 0)) score += 10;
  if (parsedData.projects.some(p => p.url)) score += 5;
  return Math.min(100, Math.max(10, score));
}

function calculateEducationScore(parsedData) {
  let score = 40;
  const count = parsedData.education.length;
  if (count >= 2) score = 90;
  else if (count >= 1) score = 75;
  else score = 20;
  if (parsedData.education.some(e => e.grade && e.grade.length > 0)) score += 10;
  return Math.min(100, Math.max(10, score));
}

function calculateCertificationsScore(parsedData) {
  const count = parsedData.certifications.length;
  if (count >= 5) return 95;
  if (count >= 3) return 85;
  if (count >= 2) return 75;
  if (count >= 1) return 60;
  return 30;
}

function calculateKeywordScore(parsedData, text, jdText) {
  let score = 40;
  const category = detectCategory(parsedData.skills);
  const keywords = INDUSTRY_KEYWORDS[category] || INDUSTRY_KEYWORDS.fullstack;
  if (text) {
    const matched = keywords.filter(k => text.toLowerCase().includes(k.toLowerCase()));
    const ratio = keywords.length > 0 ? matched.length / keywords.length : 0;
    score += Math.round(ratio * 40);
  }
  if (parsedData.skills.length >= 8) score += 10;
  if (jdText && text) {
    const jdWords = jdText.toLowerCase().split(/\s+/);
    const resumeWords = text.toLowerCase().split(/\s+/);
    const jdKeywords = jdWords.filter(w => w.length > 3);
    const uniqueJD = [...new Set(jdKeywords)];
    const matchedJD = uniqueJD.filter(w => resumeWords.includes(w));
    const jdRatio = uniqueJD.length > 0 ? matchedJD.length / uniqueJD.length : 0;
    score += Math.round(jdRatio * 10);
  }
  return Math.min(100, Math.max(10, score));
}

export function analyzeGrammar(text) {
  const issues = [];
  if (!text) return issues;

  const passiveMatches = text.matchAll(PASSIVE_INDICATORS);
  for (const m of passiveMatches) {
    issues.push({ issue: `Passive voice: "${m[0]}"`, suggestion: `Replace with active voice for stronger impact`, severity: "medium", context: m[0] });
  }

  const weakVerbMatches = text.matchAll(WEAK_VERBS);
  for (const m of weakVerbMatches) {
    issues.push({ issue: `Weak verb phrase: "${m[0]}"`, suggestion: `Use a strong action verb like "Led", "Developed", "Implemented"`, severity: "high", context: m[0] });
  }

  const hedgingMatches = text.matchAll(HEDGING_WORDS);
  for (const m of hedgingMatches) {
    issues.push({ issue: `Hedging language: "${m[0]}"`, suggestion: `Use confident, direct language`, severity: "low", context: m[0] });
  }

  const doubleSpaces = (text.match(/  +/g) || []).length;
  if (doubleSpaces > 2) {
    issues.push({ issue: `${doubleSpaces} instances of double spacing found`, suggestion: `Use single spaces between sentences`, severity: "low", context: "Double spacing detected" });
  }

  const sentences = text.split(/[.!?]+\s*/).filter(s => s.trim().length > 0);
  for (const sentence of sentences) {
    if (sentence.split(/\s+/).length > 35) {
      issues.push({ issue: `Overly long sentence (${sentence.split(/\s+/).length} words)`, suggestion: `Break into shorter sentences for better readability`, severity: "medium", context: sentence.substring(0, 80) + "..." });
    }
    if (!/^[A-Z]/.test(sentence.trim()) && sentence.trim().length > 10) {
      issues.push({ issue: `Sentence does not start with a capital letter`, suggestion: `Capitalize the first word of each sentence`, severity: "high", context: sentence.substring(0, 60) });
    }
  }

  const bulletPoints = text.split("\n").filter(l => /^[•·\-*]\s/.test(l.trim()));
  for (const bp of bulletPoints) {
    if (/^[•·\-*]\s+(was|were|been)/i.test(bp.trim())) {
      issues.push({ issue: `Bullet starts with passive voice`, suggestion: `Start with a strong action verb instead`, severity: "high", context: bp.trim().substring(0, 60) });
    }
    if (!bp.trim().endsWith(".") && !bp.trim().endsWith("!") && !bp.trim().endsWith("?") && bp.trim().length > 10) {
      issues.push({ issue: `Bullet point missing period`, suggestion: `End each bullet point with a period`, severity: "low", context: bp.trim().substring(0, 60) });
    }
  }

  return issues;
}

export function detectSpellingIssues(text) {
  const issues = [];
  if (!text) return issues;

  const commonTypos = {
    "recieve": "receive", "acheive": "achieve", "acheived": "achieved",
    "adress": "address", "alot": "a lot", "becuase": "because",
    "begining": "beginning", "beleive": "believe", "calender": "calendar",
    "commitee": "committee", "commited": "committed", "compleate": "complete",
    "definately": "definitely", "develope": "develop", "environement": "environment",
    "expereince": "experience", "experiance": "experience", "familar": "familiar",
    "febuary": "February", "forecast": "forecast", "foriegn": "foreign",
    "gaurantee": "guarantee", "goverment": "government", "grammer": "grammar",
    "harrassment": "harassment", "heirarchy": "hierarchy", "imediately": "immediately",
    "independant": "independent", "independance": "independence", "initiave": "initiative",
    "instalment": "installment", "intelectual": "intellectual", "interum": "interim",
    "jounery": "journey", "judgement": "judgment", "knowlege": "knowledge",
    "liason": "liaison", "libary": "library", "licenced": "licensed",
    "managment": "management", "millenia": "millennia", "millenium": "millennium",
    "miscelaneous": "miscellaneous", "misspell": "misspell", "neccessary": "necessary",
    "occassion": "occasion", "occuring": "occurring", "oppertunity": "opportunity",
    "paralel": "parallel", "parliament": "parliament", "percieve": "perceive",
    "perserverance": "perseverance", "phenomenon": "phenomenon", "potatoe": "potato",
    "priveledge": "privilege", "priviledge": "privilege", "proffesional": "professional",
    "programing": "programming", "propogate": "propagate", "pubically": "publicly",
    "recieved": "received", "reccommend": "recommend", "refered": "referred",
    "referrence": "reference", "religous": "religious", "remeber": "remember",
    "renewel": "renewal", "resistence": "resistance", "responsability": "responsibility",
    "restaraunt": "restaurant", "rhytmn": "rhythm", "sargent": "sergeant",
    "seperate": "separate", "sergent": "sergeant", "sincerly": "sincerely",
    "speach": "speech", "successfull": "successful", "supercede": "supersede",
    "suprise": "surprise", "tomatos": "tomatoes", "tommorow": "tomorrow",
    "tommorrow": "tomorrow", "truely": "truly", "unfamiliar": "unfamiliar",
    "unforseen": "unforeseen", "unneccessary": "unnecessary", "unprecidented": "unprecedented",
    "vaccuum": "vacuum", "vacumn": "vacuum", "vegitable": "vegetable",
    "vegitables": "vegetables", "wierd": "weird", "writen": "written",
    "writting": "writing", "accomodate": "accommodate", "accomodation": "accommodation",
  };

  const words = text.split(/\s+/);
  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
    if (commonTypos[clean]) {
      issues.push({ word: word, suggestion: commonTypos[clean], context: `"${word}" → "${commonTypos[clean]}"` });
    }
  }

  return issues;
}

export function analyzeFormatting(text, parsedData) {
  const issues = [];
  const details = {
    hasImages: false, hasTables: false, hasColumns: false, hasIcons: false,
    fontType: "Unknown", atsFriendlyFont: true, marginsOk: true,
    headingsOk: true, textAlignmentOk: true, sectionOrderOk: true,
    fileEncodingOk: true, pageCount: 1, estimatedWordCount: 0,
  };

  details.estimatedWordCount = text ? text.split(/\s+/).length : 0;

  if (text) {
    if (text.includes("|") && (text.match(/\|/g) || []).length > 5) {
      issues.push({ issue: "Tables detected - may not parse correctly in ATS", suggestion: "Convert tables to simple lists with clear headings", severity: "high", category: "tables" });
      details.hasTables = true;
      details.atsFriendlyFont = false;
    }
    if (text.includes("\t")) {
      issues.push({ issue: "Tab characters detected", suggestion: "Replace tabs with spaces for better ATS compatibility", severity: "medium", category: "formatting" });
    }
    if (text.split("\n").some(l => /^\s{2,}/.test(l) && l.trim().length > 0)) {
      issues.push({ issue: "Irregular indentation detected", suggestion: "Use consistent left alignment for all text", severity: "low", category: "alignment" });
    }
  }

  if (details.estimatedWordCount > 900) {
    issues.push({ issue: `Resume is ${details.estimatedWordCount} words - likely too long`, suggestion: "Keep resume to 400-700 words for optimal ATS parsing", severity: "high", category: "length" });
  } else if (details.estimatedWordCount < 200 && details.estimatedWordCount > 0) {
    issues.push({ issue: `Resume is only ${details.estimatedWordCount} words - seems too brief`, suggestion: "Expand your resume with more detailed experience and achievements", severity: "medium", category: "length" });
  }

  if (!parsedData.email) {
    issues.push({ issue: "Email address not found", suggestion: "Include your email address in the contact section", severity: "high", category: "contact" });
  }
  if (!parsedData.phone) {
    issues.push({ issue: "Phone number not found", suggestion: "Include your phone number for recruiter contact", severity: "high", category: "contact" });
  }

  const sectionOrder = [];
  const lower = text ? text.toLowerCase() : "";
  if (lower.includes("summary")) sectionOrder.push("summary");
  if (lower.includes("skill")) sectionOrder.push("skills");
  if (lower.includes("experience")) sectionOrder.push("experience");
  if (lower.includes("education")) sectionOrder.push("education");
  if (lower.includes("project")) sectionOrder.push("projects");
  if (lower.includes("certification")) sectionOrder.push("certifications");

  if (sectionOrder.length > 1) {
    const expected = ["summary", "skills", "experience", "education", "projects", "certifications"];
    const filteredExpected = expected.filter(e => sectionOrder.includes(e));
    if (sectionOrder[0] !== "summary") {
      issues.push({ issue: "Summary section should be first", suggestion: "Move your professional summary to the top of your resume", severity: "medium", category: "section_order" });
    }
    if (sectionOrder.indexOf("experience") > sectionOrder.indexOf("education") && sectionOrder.includes("experience") && sectionOrder.includes("education")) {
      if (parsedData.experience.length > 1) {
        issues.push({ issue: "Experience should come before Education for experienced professionals", suggestion: "Reorder sections: Summary, Skills, Experience, Education", severity: "low", category: "section_order" });
      }
    }
  }

  if (!parsedData.summary || parsedData.summary.length < 20) {
    issues.push({ issue: "Professional summary missing or too short", suggestion: "Add a 2-3 sentence professional summary highlighting your key qualifications", severity: "high", category: "content" });
  }

  if (parsedData.skills.length < 5 && parsedData.skills.length > 0) {
    issues.push({ issue: `Only ${parsedData.skills.length} skills listed`, suggestion: "Include 10-15 relevant technical and soft skills", severity: "medium", category: "skills" });
  }

  return { issues, details };
}

export function analyzeKeywords(parsedData, text, jdText) {
  const category = detectCategory(parsedData.skills);
  const industryKeywords = INDUSTRY_KEYWORDS[category] || INDUSTRY_KEYWORDS.fullstack;

  const keywordAnalysis = [];
  const missingKeywords = [];
  const matchedKeywords = [];
  const overused = [];
  const suggested = [];

  for (const kw of industryKeywords) {
    const lowerText = text ? text.toLowerCase() : "";
    const lowerKw = kw.toLowerCase();
    const regex = new RegExp(lowerKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = text ? text.match(regex) : [];
    const count = matches ? matches.length : 0;
    const present = count > 0;
    const density = text ? (count / text.split(/\s+/).length) * 100 : 0;

    keywordAnalysis.push({ keyword: kw, present, count, density: Math.round(density * 100) / 100, relevance: present ? Math.min(100, count * 20) : 0, category });

    if (present) {
      matchedKeywords.push({ keyword: kw, count, category });
      if (count > 5) overused.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  if (jdText) {
    const jdWords = jdText.toLowerCase().split(/\s+/);
    const jdKeywords = [...new Set(jdWords.filter(w => w.length > 3 && !w.match(/^\d+$/)))];
    const resumeWords = text ? text.toLowerCase().split(/\s+/) : [];
    for (const kw of jdKeywords) {
      const kwClean = kw.replace(/[^a-zA-Z]/g, "");
      if (
        kwClean.length > 3 &&
        !missingKeywords.includes(kwClean) &&
        !matchedKeywords.some(m => m.keyword.toLowerCase() === kwClean) &&
        !keywordAnalysis.some(k => k.keyword.toLowerCase() === kwClean) &&
        !suggested.includes(kwClean)
      ) {
        const isPresent = resumeWords.some(w => w.replace(/[^a-zA-Z]/g, "") === kwClean);
        if (!isPresent) suggested.push(kwClean);
      }
    }
  }

  if (suggested.length === 0) {
    suggested.push(...missingKeywords.slice(0, 5));
  }

  const keywordDensity = {};
  if (text) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const total = words.length;
    const freq = {};
    for (const w of words) {
      const clean = w.replace(/[^a-zA-Z]/g, "");
      if (clean.length > 3) freq[clean] = (freq[clean] || 0) + 1;
    }
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
    for (const [word, count] of sorted) {
      keywordDensity[word] = { count, density: Math.round((count / total) * 10000) / 100 };
    }
  }

  return { keywordAnalysis, missingKeywords, matchedKeywords, overusedKeywords: overused, suggestedKeywords: suggested.slice(0, 10), keywordDensity };
}

export function matchJobDescription(parsedData, text, jdText) {
  const result = {
    jdProvided: !!jdText,
    matchPercentage: 0,
    matchedKeywords: [],
    missingKeywords: [],
    matchedSkills: [],
    missingSkills: [],
    missingExperience: [],
    recommendedImprovements: [],
  };

  if (!jdText || !text) return result;

  const jdWords = jdText.toLowerCase().split(/\s+/);
  const resumeWords = text.toLowerCase().split(/\s+/);
  const resumeSet = new Set(resumeWords);
  const jdSet = new Set(jdWords);

  const jdKeywords = [...new Set(jdWords.filter(w => w.length > 4))];
  const matched = jdKeywords.filter(w => resumeSet.has(w));
  const missing = jdKeywords.filter(w => !resumeSet.has(w) && w.length > 4);

  result.matchedKeywords = matched;
  result.missingKeywords = [...new Set(missing)].slice(0, 20);
  result.matchPercentage = jdKeywords.length > 0 ? Math.round((matched.length / jdKeywords.length) * 100) : 0;

  const resumeSkills = (parsedData.skills || []).map(s => s.toLowerCase());
  const skillKeywords = Object.values(INDUSTRY_KEYWORDS).flat();
  const jdSkillKeywords = jdKeywords.filter(w => skillKeywords.some(sk => sk.toLowerCase() === w));

  for (const sk of jdSkillKeywords) {
    const found = resumeSkills.some(rs => rs.includes(sk) || sk.includes(rs));
    if (found) {
      result.matchedSkills.push(sk);
    } else {
      result.missingSkills.push(sk);
    }
  }

  result.matchedSkills = [...new Set(result.matchedSkills)];
  result.missingSkills = [...new Set(result.missingSkills)];

  if (result.matchPercentage < 50) {
    result.recommendedImprovements.push("Your resume has low keyword match with this job description. Consider tailoring your resume for this specific role.");
  }
  if (result.missingSkills.length > 3) {
    result.recommendedImprovements.push(`Add these missing skills to your resume: ${result.missingSkills.slice(0, 5).join(", ")}`);
  }
  if (parsedData.experience.length === 0) {
    result.missingExperience.push("No work experience found in resume");
    result.recommendedImprovements.push("Add relevant work experience matching the job requirements");
  }
  result.recommendedImprovements.push("Quantify achievements with specific metrics mentioned in the job description");
  result.recommendedImprovements.push("Use keywords and phrases from the job description throughout your resume");

  return result;
}

export function generateSectionFeedback(parsedData, text) {
  const feedback = [];

  if (parsedData.summary) {
    const s = parsedData.summary;
    const sug = [];
    let score = 70;
    if (s.length < 50) { score -= 20; sug.push("Summary is too short - expand to 2-3 sentences"); }
    if (s.length > 300) { score -= 10; sug.push("Summary is too long - keep it concise"); }
    if (!/\d+/.test(s)) { score -= 10; sug.push("Add measurable impact to your summary"); }
    if (!ACTION_VERBS.some(v => s.includes(v))) { score -= 10; sug.push("Start your summary with a strong action verb"); }
    if (sug.length === 0) { score += 10; sug.push("Consider adding more specific technical keywords"); }
    feedback.push({ section: "summary", score: Math.min(100, Math.max(10, score)), feedback: score >= 80 ? "Strong summary section" : "Summary needs improvement", suggestions: sug });
  } else {
    feedback.push({ section: "summary", score: 10, feedback: "Summary section is missing", suggestions: ["Add a professional summary highlighting your key qualifications and career goals"] });
  }

  if (parsedData.skills.length > 0) {
    const sug = [];
    let score = 70;
    if (parsedData.skills.length < 5) { score -= 20; sug.push("List at least 8-10 relevant skills"); }
    if (parsedData.skills.length > 25) { score -= 5; sug.push("Consider grouping skills by category for better readability"); }
    const category = detectCategory(parsedData.skills);
    const keywords = INDUSTRY_KEYWORDS[category] || INDUSTRY_KEYWORDS.fullstack;
    const missing = keywords.filter(k => !parsedData.skills.some(s => s.toLowerCase() === k.toLowerCase()));
    if (missing.length > 5) { score -= 10; sug.push(`Consider adding in-demand skills like ${missing.slice(0, 3).join(", ")}`); }
    if (sug.length === 0) { score += 10; }
    feedback.push({ section: "skills", score: Math.min(100, Math.max(10, score)), feedback: score >= 80 ? "Good skills coverage" : "Skills section needs improvement", suggestions: sug });
  } else {
    feedback.push({ section: "skills", score: 10, feedback: "Skills section is missing", suggestions: ["Add a comprehensive skills section with technical and soft skills"] });
  }

  if (parsedData.experience.length > 0) {
    const sug = [];
    let score = 65;
    const hasQuantified = text ? /\d+%|\$\d+|increased|decreased|improved|reduced|managed|led/i.test(text) : false;
    if (!hasQuantified) { score -= 15; sug.push("Quantify achievements with specific metrics (%, $, numbers)"); }
    if (!text || !ACTION_VERBS.some(v => text.includes(v))) { score -= 10; sug.push("Use strong action verbs to start each bullet point"); }
    if (parsedData.experience.some(e => !e.description || e.description.length < 30)) { score -= 10; sug.push("Expand job descriptions with more detail about your contributions"); }
    const totalYears = parsedData.experience.reduce((sum, e) => {
      const s = parseInt(e.startDate?.match(/\d{4}/)?.[0]) || 0;
      const en = e.current ? 2025 : parseInt(e.endDate?.match(/\d{4}/)?.[0]) || 0;
      return sum + Math.max(0, en - s);
    }, 0);
    if (totalYears < 1 && parsedData.experience.length <= 1) { score -= 5; sug.push("Include internships and relevant project experience"); }
    if (sug.length === 0) { score += 15; }
    feedback.push({ section: "experience", score: Math.min(100, Math.max(10, score)), feedback: score >= 80 ? "Strong experience section" : "Experience section needs improvement", suggestions: sug });
  } else {
    feedback.push({ section: "experience", score: 10, feedback: "Experience section is missing", suggestions: ["Add your work experience or relevant project experience"] });
  }

  if (parsedData.education.length > 0) {
    const sug = [];
    let score = 75;
    if (parsedData.education.some(e => !e.grade || e.grade.length < 3)) { score -= 10; sug.push("Add GPA or grade information if strong"); }
    if (parsedData.education.some(e => !e.startDate)) { score -= 5; sug.push("Add graduation dates for each degree"); }
    feedback.push({ section: "education", score: Math.min(100, Math.max(10, score)), feedback: "Education section present", suggestions: sug });
  } else {
    feedback.push({ section: "education", score: 10, feedback: "Education section is missing", suggestions: ["Add your educational background including institution, degree, and graduation year"] });
  }

  if (parsedData.projects.length > 0) {
    const sug = [];
    let score = 70;
    if (parsedData.projects.some(p => !p.description || p.description.length < 20)) { score -= 10; sug.push("Add more detail to project descriptions"); }
    if (parsedData.projects.some(p => !p.technologies || p.technologies.length === 0)) { score -= 10; sug.push("Mention technologies used in each project"); }
    if (parsedData.projects.some(p => p.url)) { score += 10; }
    else sug.push("Add GitHub or live demo links to your projects");
    feedback.push({ section: "projects", score: Math.min(100, Math.max(10, score)), feedback: score >= 80 ? "Good project section" : "Projects section needs work", suggestions: sug });
  } else {
    feedback.push({ section: "projects", score: 10, feedback: "Projects section is missing", suggestions: ["Add relevant projects demonstrating your technical skills"] });
  }

  if (parsedData.certifications.length > 0) {
    const sug = [];
    let score = 75;
    if (parsedData.certifications.length >= 3) score += 10;
    if (parsedData.certifications.some(c => !c.issuer)) { score -= 5; sug.push("Add the issuing organization for each certification"); }
    feedback.push({ section: "certifications", score: Math.min(100, Math.max(10, score)), feedback: "Certifications present", suggestions: sug });
  } else {
    feedback.push({ section: "certifications", score: 20, feedback: "No certifications listed", suggestions: ["Consider adding relevant industry certifications to boost your profile"] });
  }

  return feedback;
}

export function generateRewriteSuggestions(parsedData, text) {
  const suggestions = [];

  for (const exp of parsedData.experience) {
    if (exp.description && exp.description.length > 0) {
      const hasActionVerb = ACTION_VERBS.some(v => exp.description.includes(v));
      const hasQuantified = /\d+%|\$\d+|increased|decreased|improved|reduced|managed|led/i.test(exp.description);
      if (!hasActionVerb || !hasQuantified) {
        const verb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
        const tech = parsedData.skills.length > 0 ? parsedData.skills[Math.floor(Math.random() * parsedData.skills.length)] : "modern technologies";
        const improved = `${verb} scalable solutions using ${tech}, resulting in improved system performance and team productivity. Collaborated across cross-functional teams to deliver projects on time and within scope.`;
        suggestions.push({
          section: "experience",
          original: exp.description,
          improved,
          explanation: !hasActionVerb && !hasQuantified ? "Added action verb and quantified impact" : !hasActionVerb ? "Added strong action verb" : "Added quantified metrics",
        });
      }
    }
  }

  if (parsedData.summary && parsedData.summary.length < 100) {
    const skills = parsedData.skills.length > 0 ? parsedData.skills.slice(0, 3).join(", ") : "relevant technologies";
    const improved = `Results-driven ${parsedData.experience.length > 0 ? parsedData.experience[0]?.title || "professional" : "professional"} with expertise in ${skills}. Proven track record of delivering high-impact solutions, driving business growth, and leading cross-functional teams to achieve measurable results. Passionate about leveraging technology to solve complex problems.`;
    suggestions.push({
      section: "summary",
      original: parsedData.summary,
      improved,
      explanation: "Expanded summary to be more impactful with specific skills and value proposition",
    });
  }

  for (const proj of parsedData.projects) {
    if (!proj.description || proj.description.length < 30) {
      const techStr = proj.technologies && proj.technologies.length > 0 ? proj.technologies.join(", ") : parsedData.skills.slice(0, 3).join(", ");
      const improved = `Built and deployed a ${proj.name || "full-stack application"} using ${techStr}. Implemented core features including user authentication, real-time updates, and responsive design. Achieved ${Math.floor(Math.random() * 40) + 20}% improvement in user engagement through optimized performance and intuitive UI.`;
      suggestions.push({
        section: "projects",
        original: proj.description || "(empty)",
        improved,
        explanation: "Added technical details, technologies used, and quantified impact",
      });
    }
  }

  if (parsedData.achievements.length === 0 && parsedData.experience.length > 0) {
    const achievements = [
      `${ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)]} initiative resulting in 40% efficiency improvement`,
      `Led team of engineers to deliver critical project ahead of schedule`,
      `Reduced system downtime by 60% through automated monitoring implementation`,
    ];
    suggestions.push({
      section: "achievements",
      original: "(no achievements listed)",
      improved: achievements.join("\n"),
      explanation: "Added quantifiable achievements to demonstrate impact",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      section: "general",
      original: "Resume content is solid",
      improved: "Consider adding more quantified achievements and industry-specific keywords to further strengthen your resume.",
      explanation: "General optimization suggestion",
    });
  }

  return suggestions;
}

export function generateImprovedResume(parsedData, text) {
  const skills = parsedData.skills.length > 0 ? parsedData.skills : ["Communication", "Problem Solving", "Team Collaboration", "Project Management"];
  const hasExperience = parsedData.experience.length > 0;
  const hasEducation = parsedData.education.length > 0;

  const improvedSummary = parsedData.summary && parsedData.summary.length > 50
    ? parsedData.summary
    : `Results-driven ${parsedData.experience[0]?.title || "professional"} with expertise in ${skills.slice(0, 4).join(", ")}. Proven track record of delivering high-impact solutions and driving measurable business growth through innovative approaches and technical excellence. Passionate about leveraging cutting-edge technologies to solve complex problems and drive organizational success.`;

  const improvedExperience = parsedData.experience.length > 0 ? parsedData.experience.map(exp => {
    if (exp.description && ACTION_VERBS.some(v => exp.description.includes(v)) && /\d+/.test(exp.description)) return exp;
    const verb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
    const tech = skills.length > 0 ? skills[Math.floor(Math.random() * skills.length)] : "modern technologies";
    return {
      ...exp,
      description: `${verb} production-grade solutions using ${tech}, resulting in 35% improvement in system efficiency. Led cross-functional team initiatives and mentored junior developers. Delivered projects on time and under budget while maintaining high quality standards.`,
    };
  }) : [{
    company: "Tech Corp", title: parsedData.experience[0]?.title || "Software Engineer",
    location: "", startDate: "2021-01", endDate: "", current: true,
    description: `${ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)]} scalable features using ${skills[0] || "modern technologies"}, resulting in improved system performance. Collaborated across teams to deliver projects on time.`,
  }];

  const improvedEducation = parsedData.education.length > 0 ? parsedData.education : [{
    institution: "University of Technology", degree: "Bachelor of Science", field: "Computer Science",
    startDate: "2016", endDate: "2020", grade: "3.8 GPA",
  }];

  const improvedProjects = parsedData.projects.length > 0 ? parsedData.projects.map(p => ({
    ...p,
    description: p.description && p.description.length > 30 ? p.description : `Built a comprehensive ${p.name || "full-stack application"} using ${(p.technologies && p.technologies.length > 0 ? p.technologies : skills.slice(0, 3)).join(", ")}. Implemented user authentication, real-time features, and responsive design.`,
    technologies: p.technologies && p.technologies.length > 0 ? p.technologies : skills.slice(0, 4),
  })) : [];

  const improvedAchievements = parsedData.achievements.length > 0 ? parsedData.achievements : [
    `${ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)]} initiative resulting in 40% improvement in operational efficiency`,
    `Led team of ${Math.floor(Math.random() * 5) + 3} engineers to deliver critical project ahead of schedule`,
    `Reduced system costs by 25% through optimization and automation`,
  ];

  const changes = [];
  if (!parsedData.summary || parsedData.summary.length < 50) changes.push("Enhanced professional summary with impactful language and key skills");
  if (!parsedData.experience[0]?.description || !ACTION_VERBS.some(v => parsedData.experience[0]?.description?.includes(v))) changes.push("Added action verbs and quantified achievements to experience");
  if (parsedData.projects.length === 0) changes.push("Added relevant project examples");
  else if (parsedData.projects.some(p => !p.description || p.description.length < 30)) changes.push("Enhanced project descriptions with technologies and impact");
  if (parsedData.achievements.length === 0) changes.push("Added quantifiable achievements section");
  if (changes.length === 0) changes.push("Minor wording improvements for ATS optimization");

  return {
    sections: {
      summary: improvedSummary,
      skills: [...new Set([...skills, ...Object.values(INDUSTRY_KEYWORDS).flat().slice(0, 3)])],
      experience: improvedExperience,
      education: improvedEducation,
      projects: improvedProjects,
      achievements: improvedAchievements,
    },
    changes,
  };
}

export function generateCareerInsights(parsedData) {
  const insights = [];
  const category = detectCategory(parsedData.skills);

  const roleMap = {
    frontend: ["Frontend Developer", "UI Engineer", "React Developer", "JavaScript Developer", "Frontend Architect", "Web Developer"],
    backend: ["Backend Developer", "Node.js Developer", "Software Engineer", "API Developer", "Systems Engineer", "Backend Architect"],
    fullstack: ["Full Stack Developer", "Software Engineer", "Full Stack Architect", "Technical Lead", "Engineering Manager"],
    data: ["Data Scientist", "ML Engineer", "Data Analyst", "AI Engineer", "Data Engineer", "Research Scientist"],
    devops: ["DevOps Engineer", "SRE", "Cloud Architect", "Platform Engineer", "Infrastructure Engineer", "Site Reliability Engineer"],
    mobile: ["Mobile Developer", "iOS Developer", "Android Developer", "React Native Developer", "Flutter Developer"],
    cybersecurity: ["Security Engineer", "Cybersecurity Analyst", "Penetration Tester", "Security Architect", "CISO"],
    marketing: ["Marketing Manager", "Digital Marketing Specialist", "Growth Marketer", "Content Strategist", "SEO Specialist"],
    product: ["Product Manager", "Product Owner", "Technical Product Manager", "Product Analyst"],
  };

  const roles = roleMap[category] || roleMap.fullstack;
  const suitableRoles = roles.slice(0, 5);

  const skillCount = parsedData.skills.length;
  const expYears = parsedData.experience.reduce((sum, e) => {
    const s = parseInt(e.startDate?.match(/\d{4}/)?.[0]) || 0;
    const en = e.current ? 2025 : parseInt(e.endDate?.match(/\d{4}/)?.[0]) || 0;
    return sum + Math.max(0, en - s);
  }, 0) || parsedData.experience.length * 2;

  const salaryRanges = {
    entry: { min: "50k", max: "80k" },
    mid: { min: "80k", max: "120k" },
    senior: { min: "120k", max: "180k" },
    lead: { min: "150k", max: "250k" },
  };

  let level = "entry";
  if (expYears >= 8) level = "lead";
  else if (expYears >= 5) level = "senior";
  else if (expYears >= 2) level = "mid";

  const salaryRange = category === "data" || category === "devops"
    ? { entry: { min: "60k", max: "90k" }, mid: { min: "90k", max: "140k" }, senior: { min: "140k", max: "200k" }, lead: { min: "180k", max: "280k" } }[level]
    : salaryRanges[level];

  const categorySkills = INDUSTRY_KEYWORDS[category] || INDUSTRY_KEYWORDS.fullstack;
  const skillGaps = categorySkills.filter(s => !parsedData.skills.some(sk => sk.toLowerCase() === s.toLowerCase())).slice(0, 6);

  const certMap = {
    frontend: ["Meta Frontend Developer", "Google UX Design", "AWS Developer", "Microsoft Frontend"],
    backend: ["AWS Certified Developer", "MongoDB Certification", "Node.js Certification", "Google Cloud Engineer"],
    fullstack: ["AWS Developer", "Full Stack Open", "Meta Backend", "Google Cloud Engineer"],
    data: ["TensorFlow Developer", "AWS ML Specialty", "Google Data Engineer", "Microsoft Azure Data Scientist"],
    devops: ["AWS Solutions Architect", "CKA", "Terraform Associate", "Google Cloud Engineer"],
    mobile: ["Meta Android Developer", "Apple iOS Developer", "Flutter Certification", "Google Associate Android"],
  };

  const certifications = certMap[category] || certMap.fullstack;

  const interviewReadiness = Math.min(100, Math.max(10,
    (parsedData.skills.length / 15) * 30 +
    (Math.min(expYears, 10) / 10) * 25 +
    (parsedData.projects.length > 0 ? 15 : 0) +
    (parsedData.education.length > 0 ? 15 : 0) +
    (parsedData.certifications.length > 0 ? 15 : 0)
  ));

  const roadmap = [];
  if (level === "entry" || level === "mid") {
    roadmap.push({ stage: "Foundation (0-6 months)", duration: "6 months", actions: [
      `Master ${categorySkills.slice(0, 3).join(", ")}`,
      "Build 2-3 full-stack projects for portfolio",
      "Contribute to open source projects",
      "Complete relevant certifications",
    ]});
    if (level === "mid") {
      roadmap.push({ stage: "Growth (6-18 months)", duration: "12 months", actions: [
        `Deepen expertise in ${categorySkills.slice(2, 5).join(", ")}`,
        "Lead a team project or initiative",
        "Start technical writing or blogging",
        "Network at industry conferences",
      ]});
    }
  }
  roadmap.push({ stage: `${level === "lead" ? "Leadership" : "Senior"} (18-36 months)`, duration: "18 months", actions: [
    "Mentor junior team members",
    `Architect ${category === "frontend" ? "frontend" : category === "backend" ? "backend" : "full"} systems`,
    "Contribute to engineering strategy",
    "Build leadership and communication skills",
  ]});

  for (const role of suitableRoles) {
    const matchPct = Math.min(95, Math.max(10, Math.round(
      (parsedData.skills.length / 15) * 25 +
      (Math.min(expYears, 8) / 8) * 30 +
      (parsedData.projects.length > 0 ? 15 : 0) +
      (parsedData.education.length > 0 ? 15 : 0) +
      (parsedData.certifications.length > 0 ? 15 : 0)
    )));
    insights.push({
      role,
      matchPercentage: matchPct,
      salaryRange: `$${salaryRange.min} - $${salaryRange.max}`,
      skillGap: skillGaps.slice(0, 4),
      certifications: certifications.slice(0, 3),
      interviewReadiness: Math.round(interviewReadiness),
    });
  }

  return {
    suitableRoles,
    estimatedSalaryRange: `$${salaryRange.min} - $${salaryRange.max}`,
    skillGaps: skillGaps.slice(0, 8),
    recommendedCertifications: certifications.slice(0, 5),
    recommendedProjects: [
      `Build a ${category === "frontend" ? "component library with Storybook and comprehensive testing" : category === "backend" ? "microservices-based REST API with Docker and CI/CD" : category === "data" ? "ML pipeline with model deployment and monitoring" : "full-stack application with modern tech stack"}`,
      `Contribute to an open source ${category} project`,
      `Create a ${category === "devops" ? "Kubernetes operator or Terraform module" : "developer tool or library"} and publish it`,
    ],
    interviewReadinessScore: Math.round(interviewReadiness),
    careerRoadmap: roadmap,
    careerInsights: insights,
  };
}

export function generateResumeSuggestions(resume) {
  const skills = resume.skills || [];
  const experience = resume.experience || [];
  const summary = resume.summary || "";
  const category = detectCategory(skills);
  const keywords = INDUSTRY_KEYWORDS[category] || INDUSTRY_KEYWORDS.fullstack;
  const missingKeywords = keywords.filter(k => !skills.some(s => s.toLowerCase().includes(k.toLowerCase()))).slice(0, 6);
  const suggestions = [];

  if (!summary || summary.length < 50) {
    suggestions.push({
      section: "summary", type: "improvement",
      message: "Add a compelling professional summary highlighting your key achievements and career goals. Aim for 2-3 impactful sentences.",
      suggestion: `Results-driven ${resume.headline || "professional"} with expertise in ${skills.slice(0, 3).join(", ") || "software development"}. Proven track record of delivering high-impact solutions that drive business growth.`
    });
  }

  experience.forEach((exp, i) => {
    if (!exp.description || exp.description.length < 30) {
      const verb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
      const tech = skills.length > 0 ? skills[Math.floor(Math.random() * skills.length)] : "modern technologies";
      suggestions.push({
        section: "experience", type: "content",
        message: `Add quantified achievements for your role at ${exp.company || "your company"}. Use action verbs and include metrics.`,
        suggestion: `${verb} scalable solutions using ${tech}, resulting in 40% improvement in efficiency.`
      });
    }
  });

  if (missingKeywords.length > 0) {
    suggestions.push({
      section: "skills", type: "keyword",
      message: `Consider adding these in-demand skills: ${missingKeywords.join(", ")}.`,
      suggestion: missingKeywords.slice(0, 4)
    });
  }

  const atsScore = calculateATSScore(resume, JSON.stringify(resume), "").scores.atsScore;
  const improvements = [
    atsScore < 60 ? { section: "general", type: "ats", message: "Your ATS score is low. Add more industry keywords and quantify achievements.", suggestion: "Review job descriptions and incorporate relevant keywords naturally." } : null,
    (!resume.linkedin && !resume.github) ? { section: "contact", type: "missing", message: "Add LinkedIn and GitHub links.", suggestion: "Include professional social profiles in the contact section." } : null,
    (resume.education || []).length === 0 ? { section: "education", type: "missing", message: "Add your educational background.", suggestion: "Include degree, institution, and graduation year." } : null
  ].filter(Boolean);

  const score = {
    overall: atsScore, keywords: Math.min(100, Math.round((skills.length / 10) * 100)),
    formatting: 85, experience: Math.min(100, Math.round((experience.length / 3) * 100)),
    education: resume.education && resume.education.length > 0 ? 90 : 30,
    ats: atsScore, suggestions: suggestions.length + improvements.length
  };

  return { suggestions: [...suggestions, ...improvements], score, missingKeywords };
}

export function generateResumeContent({ fullName, email, phone, location, headline, skills, experience, education, projects, certifications, languages, summary, website, linkedin, github, template }) {
  const skillList = skills?.length > 0 ? skills : ["Communication", "Problem Solving", "Team Collaboration"];
  const hasExperience = experience?.length > 0;
  const hasEducation = education?.length > 0;

  const generatedSummary = summary && summary.length > 10 ? summary :
    `Results-driven ${headline || "professional"} with expertise in ${skillList.slice(0, 3).join(", ")}. Proven track record of delivering high-impact solutions and driving business growth through innovative approaches and technical excellence.`;

  const generatedExperience = hasExperience ? experience : [{
    company: "Tech Corp", title: headline || "Software Engineer", location: location || "Remote",
    startDate: "2021-01", endDate: "", current: true,
    description: `${ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)]} scalable features using ${skillList[0] || "modern technologies"}, resulting in improved system performance and team productivity.`
  }];

  const generatedEducation = hasEducation ? education : [{
    institution: "University of Technology", degree: "Bachelor of Science", field: "Computer Science",
    startDate: "2016-09", endDate: "2020-06", grade: "3.8 GPA", current: false,
  }];

  const generatedProjects = projects?.length > 0 ? projects : [{
    name: `${skillList[0] || "Full Stack"} Platform`,
    description: `Built a full-stack application using ${skillList.slice(0, 3).join(", ")}. Implemented features including user authentication, real-time updates, and responsive design.`,
    url: "", technologies: skillList.slice(0, 4),
  }];

  const achievements = [
    `${ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)]} initiative resulting in 40% efficiency improvement`,
    `Led team of ${Math.floor(Math.random() * 5) + 3} engineers to deliver critical project ahead of schedule`,
    `Reduced system downtime by 60% through implementation of automated monitoring`,
  ];

  return {
    summary: generatedSummary, headline: headline || "Full Stack Developer",
    skills: [...new Set([...skillList, ...(INDUSTRY_KEYWORDS[detectCategory(skillList)] || []).slice(0, 4)])],
    experience: generatedExperience, education: generatedEducation, projects: generatedProjects, achievements,
  };
}

export function generateCoverLetterContent({ jobTitle, companyName, yourName, skills, experienceLevel, tone }) {
  const toneMap = {
    formal: { greeting: "Dear Hiring Manager,", closing: "Sincerely", style: "professional" },
    conversational: { greeting: "Hi there,", closing: "Best regards", style: "warm and approachable" },
    enthusiastic: { greeting: "Dear [Company Name] Team,", closing: "With enthusiasm", style: "energetic" }
  };
  const t = toneMap[tone] || toneMap.formal;
  const skillList = skills?.length > 0 ? skills.slice(0, 5) : ["relevant skills", "problem-solving", "collaboration"];
  const level = experienceLevel || "mid";

  return {
    content: `${t.greeting}\n\nI am writing to express my strong interest in the ${jobTitle || "position"} at ${companyName || "your company"}. With expertise in ${skillList.join(", ")}, I am confident in my ability to contribute to your team's success.\n\nThroughout my career, I have delivered measurable results and am excited about the opportunity to bring my experience to ${companyName || "your company"}.\n\nThank you for your consideration.\n\n${t.closing},\n${yourName || "Applicant"}`,
    tone: t.style
  };
}

export function generateInterviewQuestions(category, difficulty, count = 5) {
  const questions = {
    frontend: [
      { question: "Explain the virtual DOM and how it differs from the real DOM.", difficulty: "medium", tags: ["React", "Performance"] },
      { question: "Describe the CSS Box Model and how box-sizing affects element sizing.", difficulty: "easy", tags: ["CSS", "Layout"] },
      { question: "What are JavaScript closures? Provide a practical use case.", difficulty: "medium", tags: ["JavaScript", "Scope"] },
      { question: "How does React's reconciliation algorithm work?", difficulty: "hard", tags: ["React", "Internals"] },
      { question: "Explain different approaches to state management in React.", difficulty: "medium", tags: ["React", "State"] },
      { question: "How do you optimize a React application for performance?", difficulty: "hard", tags: ["React", "Performance"] },
      { question: "Explain event delegation in JavaScript and its performance benefits.", difficulty: "easy", tags: ["JavaScript", "Events"] },
      { question: "What is the difference between controlled and uncontrolled components?", difficulty: "easy", tags: ["React", "Forms"] },
    ],
    backend: [
      { question: "Explain RESTful API design principles and key constraints.", difficulty: "medium", tags: ["API", "REST"] },
      { question: "What is JWT authentication and how does it work?", difficulty: "medium", tags: ["Auth", "JWT"] },
      { question: "Explain microservices architecture pros and cons.", difficulty: "hard", tags: ["Architecture", "Microservices"] },
      { question: "How do you handle database migrations in production?", difficulty: "medium", tags: ["Database", "DevOps"] },
      { question: "Explain indexing in databases and when to use it.", difficulty: "easy", tags: ["Database", "Performance"] },
    ],
    fullstack: [
      { question: "How do you decide between REST and GraphQL for a new API?", difficulty: "hard", tags: ["API", "Architecture"] },
      { question: "Explain the full request-response lifecycle from browser to server.", difficulty: "medium", tags: ["Web", "HTTP"] },
      { question: "How would you implement real-time features like notifications?", difficulty: "hard", tags: ["Real-time", "WebSocket"] },
      { question: "Describe your ideal CI/CD pipeline.", difficulty: "medium", tags: ["DevOps", "CI/CD"] },
    ],
    data: [
      { question: "Explain the bias-variance tradeoff in machine learning.", difficulty: "hard", tags: ["ML", "Theory"] },
      { question: "Compare supervised, unsupervised, and reinforcement learning.", difficulty: "medium", tags: ["ML", "Concepts"] },
      { question: "What is the Transformer architecture and why is it effective?", difficulty: "hard", tags: ["AI", "NLP"] },
      { question: "How do you handle imbalanced datasets?", difficulty: "medium", tags: ["ML", "Data"] },
    ],
  };

  const all = questions[category] || questions.fullstack;
  const filtered = difficulty === "all" ? all : all.filter(q => q.difficulty === difficulty);
  return [...filtered].sort(() => Math.random() - 0.5).slice(0, Math.min(count, filtered.length));
}

export function evaluateInterviewAnswer(question, answer) {
  if (!answer || answer.length < 10) {
    return { score: 0, feedback: "Answer too brief.", status: "incorrect", suggestions: ["Provide a detailed answer with examples"], strengths: [], technicalCorrectness: 0, communication: 0, completeness: 0, relevance: 0, confidence: 0, clarity: 0, grammar: 0, problemSolving: 0 };
  }

  const wordCount = answer.split(/\s+/).length;
  const lower = answer.toLowerCase();

  const hasStructure = /first|second|finally|however|therefore|because|for example|specifically|additionally|moreover/i.test(lower);
  const hasTechnicalTerms = /function|component|api|database|algorithm|framework|library|endpoint|middleware|async|promise|callback|state|props|hook|effect|reducer|store|cache|query|mutation|event|stream|buffer|thread|process|memory|schema|index|virtual|closure|delegation|memoization|async|promise|prototype|inheritance|polymorphism/i.test(lower);
  const hasExamples = /for example|such as|like|specifically|in my experience|for instance|example/i.test(lower);
  const hasMetrics = /\d+%|\d+x|\d+\s+(users|requests|projects|years|people)/i.test(lower);
  const hasDepth = /because|therefore|hence|thus|since|as a result|which means|this implies|fundamentally|mechanism|process/i.test(lower);

  const technicalCorrectness = Math.min(100, (wordCount / 60) * 35 + (hasTechnicalTerms ? 30 : 0) + (hasDepth ? 20 : 0) + (hasStructure ? 15 : 0));
  const communication = Math.min(100, (hasStructure ? 30 : 0) + (wordCount >= 30 ? 25 : 10) + 25);
  const completeness = Math.min(100, (wordCount / 80) * 30 + (hasStructure ? 20 : 0) + (hasExamples ? 25 : 0) + (hasDepth ? 15 : 0));
  const relevance = Math.min(100, (hasTechnicalTerms ? 40 : 0) + (hasExamples ? 30 : 0) + (wordCount >= 20 ? 30 : 15));
  const confidence = Math.min(100, (wordCount >= 50 ? 30 : wordCount >= 25 ? 20 : 10) + (!/i think|maybe|perhaps|not sure|i guess/i.test(lower) ? 25 : 0) + (hasStructure ? 25 : 0) + (hasExamples ? 20 : 0));
  const clarity = Math.min(100, (hasStructure ? 30 : 0) + 25 + (!/um|uh|like|you know/i.test(lower) ? 20 : 0) + 25);
  const grammarScore = Math.min(100, Math.max(20, 80 - ((lower.match(/[a-z][A-Z]/g) || []).length * 5) - ((answer.match(/\b(\w+)\b\s+\1\b/gi) || []).length * 10)));
  const problemSolving = Math.min(100, (hasExamples ? 30 : 0) + (hasMetrics ? 25 : 0) + (hasDepth ? 25 : 0));

  const overallScore = Math.round(
    technicalCorrectness * 0.20 + communication * 0.15 + completeness * 0.15 +
    relevance * 0.12 + confidence * 0.10 + clarity * 0.10 + grammarScore * 0.08 + problemSolving * 0.10
  );

  let status = "incorrect";
  if (overallScore >= 70) status = "correct";
  else if (overallScore >= 40) status = "partial";

  const suggestions = [];
  if (!hasStructure) suggestions.push("Structure your answer: definition, explanation, example, conclusion");
  if (!hasTechnicalTerms) suggestions.push("Include relevant technical terminology");
  if (!hasExamples) suggestions.push("Add concrete examples demonstrating practical application");
  if (!hasDepth) suggestions.push("Explain not just what but how and why");
  if (wordCount < 40) suggestions.push("Expand your answer with more details");

  const strengths = [];
  if (hasTechnicalTerms) strengths.push("Good use of technical terminology");
  if (hasStructure) strengths.push("Well-structured response");
  if (hasExamples) strengths.push("Effective use of examples");
  if (wordCount >= 60) strengths.push("Comprehensive answer");

  return {
    score: overallScore, feedback: overallScore >= 85 ? "Excellent answer!" : overallScore >= 70 ? "Good answer." : overallScore >= 50 ? "Decent answer." : overallScore >= 30 ? "Needs more substance." : "Too brief.",
    technicalCorrectness: Math.round(technicalCorrectness), communication: Math.round(communication),
    completeness: Math.round(completeness), relevance: Math.round(relevance),
    confidence: Math.round(confidence), clarity: Math.round(clarity),
    grammar: Math.round(grammarScore), problemSolving: Math.round(problemSolving),
    status, suggestions, strengths,
    idealAnswer: "A strong answer should define key terms, explain the underlying concept, provide a practical example, and discuss trade-offs or best practices."
  };
}

export { ACTION_VERBS, ATS_FRIENDLY_FONTS, INDUSTRY_KEYWORDS, detectCategory };
