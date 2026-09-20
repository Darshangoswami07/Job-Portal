import { SocialHashtag } from "../models_new/SocialHashtag.js";
import { User } from "../models/user.model.js";

const capitalize = (s) => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);

export async function aiAssistPost(req, res) {
  try {
    const { action, text = "", context = {} } = req.body;
    const actionMap = {
      improve: "improve",
      professional: "professional",
      grammar: "grammar",
      hashtags: "hashtags",
      summarize: "summarize",
      translate: "translate",
      careerTips: "careerTips",
      hiring: "hiring",
      project: "project",
      certificate: "certificate",
      achievement: "achievement",
    };
    const key = actionMap[action];
    if (!key) {
      return res.status(400).json({ success: false, message: "Unknown AI action." });
    }

    const result = await runAction(key, text, context, req.id);
    return res.json({ success: true, result });
  } catch (error) {
    console.error("Error in aiAssistPost:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function runAction(key, text, ctx, userId) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  switch (key) {
    case "improve":
      return improveWriting(clean);
    case "professional":
      return makeProfessional(clean);
    case "grammar":
      return fixGrammar(clean);
    case "hashtags":
      return generateHashtags(clean);
    case "summarize":
      return summarize(clean);
    case "translate":
      return translateToEnglish(clean);
    case "careerTips":
      return generateCareerTips(ctx, userId);
    case "hiring":
      return generateHiringPost(ctx);
    case "project":
      return generateProjectShowcase(ctx);
    case "certificate":
      return generateCertificatePost(ctx);
    case "achievement":
      return generateAchievementPost(ctx);
    default:
      return "";
  }
}

function improveWriting(text) {
  if (!text) return { text: "", applied: false };
  let improved = text
    .replace(/\bgonna\b/g, "going to")
    .replace(/\bwanna\b/g, "want to")
    .replace(/\bgotta\b/g, "have to")
    .replace(/\bur gonna\b/g, "you are going to")
    .replace(/\bdon't\b/gi, "do not")
    .replace(/\bisn't\b/gi, "is not")
    .replace(/\bare\bgot\b/gi, "");
  improved = improved.replace(/(^|\. )(\w)/g, (m, p, c) => `${p}${c.toUpperCase()}`);
  return { text: improved, applied: true };
}

function makeProfessional(text) {
  if (!text) return { text: "", applied: false };
  let out = text.trim();
  if (!['.', '!', '?'].includes(out.slice(-1))) out += ".";
  out = out.charAt(0).toUpperCase() + out.slice(1);
  out = out.replace(/awesome|amazing|super cool|really great|so cool/gi, "highly effective");
  out = out.replace(/i think|i believe|maybe|probably/gi, "");
  out = out.replace(/\s{2,}/g, " ").trim();
  return { text: out, applied: true };
}

function fixGrammar(text) {
  if (!text) return { text: "", applied: false };
  let out = text
    .replace(/\bteh\b/gi, "the")
    .replace(/\brecieve\b/gi, "receive")
    .replace(/\brecieved\b/gi, "received")
    .replace(/\bacheive\b/gi, "achieve")
    .replace(/\bacheived\b/gi, "achieved")
    .replace(/\balot\b/gi, "a lot")
    .replace(/\bbecuase\b/gi, "because")
    .replace(/\bdefinately\b/gi, "definitely")
    .replace(/\bseperate\b/gi, "separate")
    .replace(/\boccured\b/gi, "occurred")
    .replace(/\bpriveledge\b/gi, "privilege");
  out = out.replace(/(^|([.!?]\s+))([a-z])/g, (m, p1, p2, c) => `${p2}${c.toUpperCase()}`);
  return { text: out, applied: true };
}

function generateHashtags(text) {
  if (!text) return { hashtags: [] };
  const words = String(text).toLowerCase().match(/[a-z0-9_]+/g) || [];
  const stop = new Set(["the", "a", "an", "and", "or", "for", "to", "of", "in", "on", "with", "is", "are", "was", "were", "your", "you", "our", "my", "me", "i", "career", "jobs", "job", "work", "new", "just", "have", "has", "this", "that", "it", "we", "they", "there", "about", "from", "at"]);
  const freq = {};
  for (const w of words) {
    if (w.length < 3 || stop.has(w)) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([w]) => w);
  const categorized = [];
  for (const w of sorted) {
    if (categorized.includes(w) || categorized.length >= 5) break;
    categorized.push(w);
  }
  const defaults = ["#JobSearch", "#CareerGrowth", "#Hiring", "#ProfessionalGrowth", "#Opportunities", "#Recruitment", "#Networking", "#CareerAdvice"];
  const hashtags = [...new Set([...categorized, ...defaults])].slice(0, 8).map((h) => `#${h.replace(/^#/)}`);
  return { hashtags };
}

function summarize(text) {
  if (!text) return { summary: "" };
  let clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= 220) return { summary: clean };
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  const summary = [];
  let len = 0;
  for (const s of sentences) {
    if (len + s.length > 220) break;
    summary.push(s);
    len += s.length;
  }
  const result = summary.join(" ") + (summary.length < sentences.length ? "…" : "");
  return { summary: result };
}

function translateToEnglish(text) {
  if (!text) return { text: "" };
  return { text: String(text).trim(), detected: "en", likelyEnglish: /^[\x00-\x7F\s.,!?'"()-]+$/.test(String(text)) };
}

async function generateCareerTips(ctx, userId) {
  let skills = [];
  let headline = "";
  try {
    const user = await User.findById(userId).select("profile.skills profile.headline fullname").lean();
    skills = user?.profile?.skills || [];
    headline = user?.profile?.headline || user?.fullname || "";
  } catch { /* ignore */ }
  const topSkills = skills.slice(0, 4).join(", ") || "your core skills";
  const tips = [
    `Keep ${topSkills} sharp by building small portfolio projects and sharing your learnings weekly.`,
    headline ? `As a ${headline}, showcase real outcomes over responsibilities to attract the right opportunity.` : "Update your headline to a clear, keyword-rich professional summary for better visibility.",
    "Engage meaningfully — comment with value on posts in your field to grow your professional network.",
    "Share your journey: documenting your progress builds credibility and helps recruiters discover you.",
    "Set a goal to connect with 5 professionals in your industry this week and personalize each request.",
  ];
  return { tips, skills, headline };
}

function generateHiringPost(ctx) {
  const title = ctx.title || "Software Engineer";
  const company = ctx.company || "Your Company";
  const location = ctx.location || "Remote";
  const type = ctx.type || "Full-time";
  const salary = ctx.salary || "";
  const applyLink = ctx.applyLink || "";
  const lines = [
    `🚀 We're hiring! ${title} at ${company}`,
    `📍 ${location}`,
    type ? `💼 ${type}` : "",
    salary ? `💰 ${salary}` : "",
    "",
    "What we're looking for:",
    "• Strong fundamentals and a growth mindset",
    "• Ability to collaborate and ship quality work",
    "• Excitement to learn and take ownership",
    "",
  ];
  const text = lines.filter(Boolean).join("\n") + (applyLink ? `Apply here: ${applyLink}` : "DM me for more details or to apply!") + "\n\n#Hiring #JobOpening #CareerGrowth";
  return { text };
}

function generateProjectShowcase(ctx) {
  const name = ctx.name || "My Latest Project";
  const stack = Array.isArray(ctx.techStack) ? ctx.techStack.join(", ") : ctx.techStack || "";
  const description = ctx.description || "";
  const github = ctx.github || "";
  const demo = ctx.demo || "";
  const lines = [
    `🚀 Just shipped: ${name}`,
    stockLine(description),
    "",
    stack ? `🛠 Stack: ${stack}` : "",
    "",
    showcaseLines(),
  ];
  function stockLine(d) { return d ? d : "I've been building something I'm really excited to share!"; }
  function showcaseLines() {
    const arr = [];
    if (github) arr.push(`🔗 GitHub: ${github}`);
    if (demo) arr.push(`🌐 Demo: ${demo}`);
    return arr.length ? arr.join("\n") : "";
  }
  const text = lines.filter(Boolean).join("\n") + "\n\nWhat do you think? Feedback welcome!" + "\n\n#Project #Developer #BuildInPublic";
  return { text };
}

function generateCertificatePost(ctx) {
  const name = ctx.name || "my new certification";
  const issuer = ctx.issuer || "";
  const credentialId = ctx.credentialId || "";
  const text = [
    `🏆 Proud to share that I've completed ${name}${issuer ? ` from ${issuer}` : ""}!`,
    credentialId ? `Credential ID: ${credentialId}` : "",
    "",
    "Continuous learning is a journey — excited to apply these skills to real-world projects.",
    "",
    "#Certification #CareerGrowth #Learning #Skills",
  ].filter(Boolean).join("\n");
  return { text };
}

function generateAchievementPost(ctx) {
  const title = ctx.title || "a milestone";
  const text = [
    `🎉 Excited to share: ${title}!`,
    "",
    "Hard work, dedication and the support of an amazing network made this possible. Grateful for everyone along the way.",
    "",
    "#Achievement #CareerGrowth #Milestone",
  ].join("\n");
  return { text };
}

export const suggestHashtags = generateHashtags;

export async function getSuggestedHashtags(_req, res) {
  try {
    const tags = await SocialHashtag.find()
      .sort({ postCount: -1 })
      .limit(8)
      .select("name postCount")
      .lean();
    const defaults = ["JobSearch", "CareerGrowth", "Hiring", "Networking", "TechJobs", "ProfessionalGrowth"];
    const combined = [
      ...tags.map((t) => ({ name: t.name, postCount: t.postCount })),
      ...defaults.filter((d) => !tags.some((t) => t.name === d.toLowerCase())).map((d) => ({ name: d, postCount: 0 })),
    ].slice(0, 10);
    return res.json({ success: true, hashtags: combined });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}