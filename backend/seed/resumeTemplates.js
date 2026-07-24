import { ResumeTemplate } from "../models_new/ResumeTemplate.js";

function pick(arr) { return [...arr].sort(() => Math.random() - 0.5)[0]; }
function pickMany(arr, n) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function generateSvg(name, colors, layout) {
  const { primary, secondary, accent, background, text } = colors;
  const isTwoCol = layout === "two-column";
  const isCreative = layout === "creative";
  const isMinimal = layout === "minimal";
  const isExecutive = layout === "executive";

  const headerH = isCreative ? 80 : 60;
  const leftW = isTwoCol ? 90 : 0;
  const accentBar = isExecutive ? `<rect x="0" y="0" width="4" height="280" fill="${primary}" />` : "";
  const headerBg = isCreative
    ? `<rect x="0" y="0" width="260" height="${headerH}" fill="${primary}" rx="0" />
       <polygon points="0,${headerH} 260,${headerH} 220,${headerH + 20} 0,${headerH + 20}" fill="${primary}" opacity="0.3" />`
    : `<rect x="0" y="0" width="260" height="${headerH}" fill="${primary}" rx="0" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 340" width="260" height="340">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${secondary};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${primary};stop-opacity:0.8" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="260" height="340" fill="${background}" rx="4" stroke="${accent}" stroke-width="0.5"/>
  ${accentBar}
  ${headerBg}
  <circle cx="${isTwoCol ? 220 : 130}" cy="${headerH / 2}" r="16" fill="${accent}" opacity="0.3"/>
  <circle cx="${isTwoCol ? 220 : 130}" cy="${headerH / 2}" r="10" fill="${accent}" stroke="${primary}" stroke-width="1.5"/>
  <text x="${isTwoCol ? 28 : 16}" y="${headerH / 2 + 4}" font-family="Inter, sans-serif" font-size="10" font-weight="bold" fill="${isCreative || isTwoCol ? "#fff" : "#fff"}">${name.split(" ").slice(0, 2).join(" ")}</text>
  <text x="${isTwoCol ? 28 : 16}" y="${headerH / 2 + 18}" font-family="Inter, sans-serif" font-size="5" fill="${isCreative ? "#fff" : "rgba(255,255,255,0.7)"}" opacity="0.8">${pick(["Software Engineer", "Product Designer", "Marketing Lead", "Project Manager", "Data Analyst", "Full Stack Developer"])}</text>
  ${isTwoCol ? `<rect x="0" y="${headerH + 20}" width="${leftW}" height="${340 - headerH - 20}" fill="rgba(0,0,0,0.02)" />` : ""}
  <rect x="${isTwoCol ? leftW + 8 : 12}" y="${headerH + 24}" width="${260 - (isTwoCol ? leftW + 16 : 24)}" height="3" fill="${primary}" rx="1.5"/>
  <text x="${isTwoCol ? leftW + 8 : 12}" y="${headerH + 36}" font-family="Inter, sans-serif" font-size="5" font-weight="bold" fill="${text}">Experience</text>
  ${[0, 1, 2].map(i => {
    const y = headerH + 44 + i * 22;
    return `<rect x="${isTwoCol ? leftW + 8 : 12}" y="${y}" width="${160}" height="3" fill="${accent}" rx="1.5" opacity="${0.7 - i * 0.2}"/>
            <rect x="${isTwoCol ? leftW + 8 : 12}" y="${y + 6}" width="${200 - i * 20}" height="2" fill="${accent}" rx="1" opacity="${0.5 - i * 0.15}"/>
            <rect x="${isTwoCol ? leftW + 8 : 12}" y="${y + 10}" width="${180 - i * 25}" height="2" fill="${accent}" rx="1" opacity="${0.3 - i * 0.1}"/>`;
  }).join("")}
  <rect x="${isTwoCol ? leftW + 8 : 12}" y="${headerH + 114}" width="80" height="3" fill="${primary}" rx="1.5"/>
  <text x="${isTwoCol ? leftW + 8 : 12}" y="${headerH + 126}" font-family="Inter, sans-serif" font-size="5" font-weight="bold" fill="${text}">Education</text>
  ${[0, 1].map(i => {
    const y = headerH + 134 + i * 18;
    return `<rect x="${isTwoCol ? leftW + 8 : 12}" y="${y}" width="120" height="3" fill="${accent}" rx="1.5"/>
            <rect x="${isTwoCol ? leftW + 8 : 12}" y="${y + 6}" width="150" height="2" fill="${accent}" rx="1"/>`;
  }).join("")}
  ${isTwoCol ? `<text x="8" y="${headerH + 36}" font-family="Inter, sans-serif" font-size="4.5" font-weight="bold" fill="${text}">Skills</text>
    ${["React", "Node.js", "Python", "SQL", "AWS"].map((s, i) => {
      const y = headerH + 48 + i * 12;
      return `<rect x="8" y="${y}" width="3" height="3" fill="${primary}" rx="0.5"/><text x="14" y="${y + 2.5}" font-family="Inter, sans-serif" font-size="4" fill="${text}">${s}</text>`;
    }).join("")}` : ""}
  ${isCreative ? `<rect x="0" y="${340 - 6}" width="260" height="6" fill="url(#g2)" rx="0" />` : ""}
  ${isMinimal ? `<line x1="12" y1="${340 - 3}" x2="248" y2="${340 - 3}" stroke="${accent}" stroke-width="0.5"/>` : ""}
</svg>`;
}

const TEMPLATES_CONFIG = [
  { name: "Ace Professional", cat: "Professional", sub: "Corporate", layout: "standard", premium: false, ats: 96, features: ["ats-optimized", "clean-layout"] },
  { name: "Summit Executive", cat: "Professional", sub: "Executive", layout: "executive", premium: true, ats: 98, features: ["executive", "letterhead"] },
  { name: "Aspire Corporate", cat: "Professional", sub: "Corporate", layout: "two-column", premium: false, ats: 94, features: ["two-column", "sidebar"] },
  { name: "Pinnacle Business", cat: "Professional", sub: "Business", layout: "standard", premium: true, ats: 95, features: ["business", "formal"] },
  { name: "Apex", cat: "Professional", sub: "Corporate", layout: "minimal", premium: true, ats: 97, features: ["minimal", "clean"] },
  { name: "Titan", cat: "Professional", sub: "Executive", layout: "executive", premium: true, ats: 93, features: ["executive", "bold"] },
  { name: "Prime", cat: "Professional", sub: "Business", layout: "standard", premium: false, ats: 92, features: ["professional", "classic"] },
  { name: "Elite", cat: "Professional", sub: "Corporate", layout: "two-column", premium: true, ats: 95, features: ["two-column", "elegant"] },
  { name: "Pro Executive", cat: "Professional", sub: "Executive", layout: "executive", premium: false, ats: 94, features: ["executive", "timeless"] },
  { name: "Core", cat: "Professional", sub: "Business", layout: "minimal", premium: false, ats: 91, features: ["minimal", "direct"] },
  { name: "Vertex", cat: "Professional", sub: "Corporate", layout: "standard", premium: true, ats: 96, features: ["professional", "structured"] },
  { name: "Zenith", cat: "Professional", sub: "Executive", layout: "executive", premium: true, ats: 97, features: ["executive", "premium"] },

  { name: "Nova Modern", cat: "Modern", sub: "Minimal", layout: "minimal", premium: false, ats: 90, features: ["minimal", "modern"] },
  { name: "Pulse", cat: "Modern", sub: "Creative", layout: "creative", premium: false, ats: 88, features: ["creative", "colorful"] },
  { name: "Flux", cat: "Modern", sub: "Minimal", layout: "minimal", premium: true, ats: 89, features: ["minimal", "clean"] },
  { name: "Sleek", cat: "Modern", sub: "Designer", layout: "two-column", premium: false, ats: 87, features: ["two-column", "modern"] },
  { name: "Evo", cat: "Modern", sub: "Minimal", layout: "standard", premium: false, ats: 91, features: ["minimal", "professional"] },
  { name: "Blend", cat: "Modern", sub: "Creative", layout: "creative", premium: true, ats: 85, features: ["creative", "unique"] },
  { name: "Haven", cat: "Modern", sub: "Minimal", layout: "minimal", premium: false, ats: 88, features: ["minimal", "airy"] },
  { name: "Mosaic", cat: "Modern", sub: "Designer", layout: "creative", premium: true, ats: 86, features: ["creative", "artistic"] },
  { name: "Simplify", cat: "Modern", sub: "Minimal", layout: "minimal", premium: false, ats: 92, features: ["minimal", "clean"] },
  { name: "Fresco", cat: "Modern", sub: "Creative", layout: "standard", premium: false, ats: 87, features: ["modern", "fresh"] },

  { name: "Code Senior", cat: "Technology", sub: "Software Engineer", layout: "standard", premium: false, ats: 95, features: ["tech", "skills-focused"] },
  { name: "DevPro", cat: "Technology", sub: "Software Engineer", layout: "two-column", premium: false, ats: 93, features: ["two-column", "tech"] },
  { name: "SwiftStack", cat: "Technology", sub: "Full Stack", layout: "standard", premium: true, ats: 94, features: ["tech", "project-highlight"] },
  { name: "AIML Pro", cat: "Technology", sub: "AI Engineer", layout: "two-column", premium: true, ats: 92, features: ["ai", "research"] },
  { name: "DataCraft", cat: "Technology", sub: "Data Scientist", layout: "standard", premium: false, ats: 91, features: ["data", "analytics"] },
  { name: "CloudNative", cat: "Technology", sub: "Cloud Engineer", layout: "two-column", premium: true, ats: 93, features: ["cloud", "devops"] },
  { name: "SysArch", cat: "Technology", sub: "DevOps", layout: "standard", premium: false, ats: 94, features: ["devops", "infrastructure"] },
  { name: "CyberShield", cat: "Technology", sub: "Cybersecurity", layout: "executive", premium: true, ats: 95, features: ["security", "certifications"] },
  { name: "Quantum", cat: "Technology", sub: "Software Engineer", layout: "minimal", premium: false, ats: 90, features: ["minimal", "engineer"] },
  { name: "Frontier", cat: "Technology", sub: "Frontend Developer", layout: "creative", premium: true, ats: 89, features: ["creative", "portfolio"] },
  { name: "Backend Pro", cat: "Technology", sub: "Backend Developer", layout: "standard", premium: false, ats: 93, features: ["backend", "api"] },
  { name: "React Forge", cat: "Technology", sub: "React Developer", layout: "two-column", premium: false, ats: 91, features: ["frontend", "react"] },
  { name: "Next Ninja", cat: "Technology", sub: "Next.js Developer", layout: "standard", premium: true, ats: 92, features: ["fullstack", "nextjs"] },
  { name: "Pythonista", cat: "Technology", sub: "Python Developer", layout: "minimal", premium: false, ats: 90, features: ["python", "data"] },
  { name: "SpringUp", cat: "Technology", sub: "Java Developer", layout: "two-column", premium: true, ats: 93, features: ["java", "enterprise"] },
  { name: "KubeOps", cat: "Technology", sub: "DevOps Engineer", layout: "standard", premium: false, ats: 94, features: ["kubernetes", "devops"] },
  { name: "Pipeline", cat: "Technology", sub: "DevOps", layout: "two-column", premium: true, ats: 92, features: ["devops", "automation"] },
  { name: "DataVault", cat: "Technology", sub: "Data Scientist", layout: "executive", premium: true, ats: 91, features: ["data-science", "ml"] },
  { name: "MLArchitect", cat: "Technology", sub: "Machine Learning Engineer", layout: "standard", premium: true, ats: 93, features: ["machine-learning", "ai"] },
  { name: "SecOps", cat: "Technology", sub: "Cybersecurity Engineer", layout: "executive", premium: true, ats: 96, features: ["cybersecurity", "compliance"] },
  { name: "BlockForge", cat: "Technology", sub: "Blockchain Developer", layout: "creative", premium: true, ats: 87, features: ["blockchain", "web3"] },
  { name: "MobileCraft", cat: "Technology", sub: "Mobile Developer", layout: "standard", premium: false, ats: 90, features: ["mobile", "ios-android"] },
  { name: "GameDev", cat: "Technology", sub: "Game Developer", layout: "creative", premium: true, ats: 86, features: ["gaming", "unity"] },
  { name: "EmbeddedPro", cat: "Technology", sub: "Embedded Engineer", layout: "minimal", premium: false, ats: 92, features: ["embedded", "iot"] },

  { name: "AI Pioneer", cat: "AI Engineer", sub: "AI Engineer", layout: "standard", premium: true, ats: 94, features: ["ai", "research-papers"] },
  { name: "LLM Architect", cat: "AI Engineer", sub: "LLM Engineer", layout: "two-column", premium: true, ats: 93, features: ["llm", "nlp"] },
  { name: "PromptWise", cat: "AI Engineer", sub: "Prompt Engineer", layout: "minimal", premium: true, ats: 90, features: ["prompt-engineering", "ai"] },
  { name: "GenAI Pro", cat: "AI Engineer", sub: "Generative AI Engineer", layout: "creative", premium: true, ats: 91, features: ["generative-ai", "diffusion"] },
  { name: "MLCore", cat: "AI Engineer", sub: "ML Engineer", layout: "standard", premium: false, ats: 93, features: ["machine-learning", "mlops"] },
  { name: "NLPMaster", cat: "AI Engineer", sub: "NLP Engineer", layout: "two-column", premium: true, ats: 92, features: ["nlp", "transformers"] },
  { name: "VisionAI", cat: "AI Engineer", sub: "Computer Vision Engineer", layout: "standard", premium: true, ats: 91, features: ["computer-vision", "cnn"] },
  { name: "RAG Builder", cat: "AI Engineer", sub: "RAG Engineer", layout: "creative", premium: true, ats: 90, features: ["rag", "vector-db"] },
  { name: "AI Research", cat: "AI Engineer", sub: "AI Research Engineer", layout: "executive", premium: true, ats: 95, features: ["research", "publications"] },
  { name: "RoboMind", cat: "AI Engineer", sub: "Robotics Engineer", layout: "standard", premium: true, ats: 92, features: ["robotics", "ros"] },
  { name: "DeepLearn", cat: "AI Engineer", sub: "Deep Learning Engineer", layout: "two-column", premium: true, ats: 93, features: ["deep-learning", "neural-nets"] },
  { name: "AgentForge", cat: "AI Engineer", sub: "AI Agent Engineer", layout: "creative", premium: true, ats: 89, features: ["ai-agents", "langgraph"] },
  { name: "LangChain Dev", cat: "AI Engineer", sub: "LangChain Developer", layout: "standard", premium: true, ats: 91, features: ["langchain", "llm-apps"] },
  { name: "HuggingFace Pro", cat: "AI Engineer", sub: "AI Engineer", layout: "two-column", premium: true, ats: 92, features: ["huggingface", "models"] },

  { name: "Canvas", cat: "Creative", sub: "Designer", layout: "creative", premium: true, ats: 85, features: ["creative", "portfolio"] },
  { name: "Portfolia", cat: "Creative", sub: "UI/UX Designer", layout: "creative", premium: false, ats: 86, features: ["design", "showcase"] },
  { name: "Artisan", cat: "Creative", sub: "Designer", layout: "two-column", premium: true, ats: 84, features: ["creative", "visual"] },
  { name: "PixelPerfect", cat: "Creative", sub: "UI/UX", layout: "minimal", premium: false, ats: 88, features: ["ui-ux", "minimal"] },
  { name: "ColorCraft", cat: "Creative", sub: "Photographer", layout: "creative", premium: true, ats: 82, features: ["photography", "visual"] },
  { name: "BrandKit", cat: "Creative", sub: "Marketing", layout: "two-column", premium: false, ats: 87, features: ["marketing", "branding"] },
  { name: "Storyboard", cat: "Creative", sub: "Designer", layout: "standard", premium: true, ats: 85, features: ["creative", "storytelling"] },
  { name: "Vivid", cat: "Creative", sub: "Designer", layout: "creative", premium: false, ats: 83, features: ["creative", "colorful"] },
  { name: "Studio", cat: "Creative", sub: "Photographer", layout: "minimal", premium: true, ats: 84, features: ["photography", "elegant"] },
  { name: "Marketing Flow", cat: "Creative", sub: "Marketing", layout: "standard", premium: false, ats: 90, features: ["marketing", "metrics"] },

  { name: "Fresher First", cat: "Student", sub: "Fresher", layout: "standard", premium: false, ats: 89, features: ["fresher", "education-focused"] },
  { name: "Campus Pro", cat: "Student", sub: "Graduate", layout: "two-column", premium: false, ats: 88, features: ["graduate", "internship"] },
  { name: "GradBase", cat: "Student", sub: "Graduate", layout: "minimal", premium: false, ats: 87, features: ["graduate", "entry-level"] },
  { name: "InternEdge", cat: "Student", sub: "Internship", layout: "standard", premium: false, ats: 86, features: ["internship", "skills"] },
  { name: "Scholar", cat: "Student", sub: "Fresher", layout: "executive", premium: true, ats: 90, features: ["academic", "education"] },
  { name: "LaunchPad", cat: "Student", sub: "Graduate", layout: "creative", premium: true, ats: 85, features: ["graduate", "modern"] },
  { name: "Blueprint", cat: "Student", sub: "Fresher", layout: "standard", premium: false, ats: 88, features: ["entry-level", "clean"] },
  { name: "Aspire Grad", cat: "Student", sub: "Graduate", layout: "two-column", premium: false, ats: 87, features: ["graduate", "academic"] },

  { name: "MedHealth", cat: "Healthcare", sub: "Medical", layout: "standard", premium: true, ats: 96, features: ["healthcare", "medical"] },
  { name: "NursePro", cat: "Healthcare", sub: "Nursing", layout: "two-column", premium: false, ats: 95, features: ["nursing", "healthcare"] },
  { name: "PharmaCore", cat: "Healthcare", sub: "Pharmaceutical", layout: "executive", premium: true, ats: 94, features: ["pharma", "research"] },
  { name: "DocProfile", cat: "Healthcare", sub: "Physician", layout: "standard", premium: true, ats: 97, features: ["medical", "clinical"] },
  { name: "VitalSigns", cat: "Healthcare", sub: "Healthcare Admin", layout: "minimal", premium: false, ats: 92, features: ["healthcare", "administration"] },

  { name: "Finance Pro", cat: "Finance", sub: "Banking", layout: "executive", premium: true, ats: 96, features: ["finance", "banking"] },
  { name: "AuditPro", cat: "Finance", sub: "Accounting", layout: "standard", premium: false, ats: 94, features: ["audit", "accounting"] },
  { name: "InvestorEdge", cat: "Finance", sub: "Investment Banking", layout: "executive", premium: true, ats: 97, features: ["investment", "finance"] },
  { name: "WealthPro", cat: "Finance", sub: "Financial Advisor", layout: "two-column", premium: true, ats: 93, features: ["finance", "advisory"] },
  { name: "RiskExpert", cat: "Finance", sub: "Risk Management", layout: "standard", premium: false, ats: 92, features: ["risk", "compliance"] },

  { name: "SalesPulse", cat: "Sales", sub: "Sales Manager", layout: "standard", premium: false, ats: 91, features: ["sales", "revenue"] },
  { name: "RevenuePro", cat: "Sales", sub: "Business Development", layout: "two-column", premium: true, ats: 90, features: ["sales", "growth"] },
  { name: "ClosingEdge", cat: "Sales", sub: "Account Executive", layout: "executive", premium: true, ats: 92, features: ["sales", "enterprise"] },
  { name: "DealMaker", cat: "Sales", sub: "Sales Development", layout: "minimal", premium: false, ats: 89, features: ["sales", "outbound"] },

  { name: "HR Pro", cat: "HR", sub: "HR Generalist", layout: "standard", premium: false, ats: 93, features: ["hr", "recruitment"] },
  { name: "TalentFind", cat: "HR", sub: "Recruiter", layout: "two-column", premium: true, ats: 92, features: ["recruitment", "talent"] },
  { name: "PeopleOps", cat: "HR", sub: "HR Manager", layout: "executive", premium: true, ats: 94, features: ["hr", "people-operations"] },
  { name: "CultureBuild", cat: "HR", sub: "HR Business Partner", layout: "standard", premium: false, ats: 91, features: ["hr", "culture"] },

  { name: "Product Vision", cat: "Product Manager", sub: "Product Manager", layout: "standard", premium: false, ats: 92, features: ["product", "strategy"] },
  { name: "PM Pro", cat: "Product Manager", sub: "Senior PM", layout: "executive", premium: true, ats: 94, features: ["product", "leadership"] },
  { name: "GrowthPM", cat: "Product Manager", sub: "Growth PM", layout: "two-column", premium: true, ats: 91, features: ["product", "growth"] },
  { name: "TechPM", cat: "Product Manager", sub: "Technical PM", layout: "standard", premium: false, ats: 93, features: ["product", "technical"] },
  { name: "AgileLead", cat: "Product Manager", sub: "Agile PM", layout: "minimal", premium: false, ats: 90, features: ["product", "agile"] },

  { name: "Project Pulse", cat: "Project Manager", sub: "Project Manager", layout: "standard", premium: false, ats: 93, features: ["project", "pmp"] },
  { name: "ScrumMaster", cat: "Project Manager", sub: "Scrum Master", layout: "two-column", premium: true, ats: 92, features: ["agile", "scrum"] },
  { name: "PM Lead", cat: "Project Manager", sub: "Senior PM", layout: "executive", premium: true, ats: 95, features: ["project", "leadership"] },
  { name: "PMP Cert", cat: "Project Manager", sub: "PMP Certified", layout: "standard", premium: false, ats: 94, features: ["pmp", "certification"] },

  { name: "ConsultPro", cat: "Consultant", sub: "Management Consultant", layout: "executive", premium: true, ats: 96, features: ["consulting", "strategy"] },
  { name: "StrategyEdge", cat: "Consultant", sub: "Strategy Consultant", layout: "standard", premium: true, ats: 95, features: ["strategy", "analytics"] },
  { name: "BizConsult", cat: "Consultant", sub: "Business Consultant", layout: "two-column", premium: false, ats: 93, features: ["consulting", "business"] },
  { name: "Advisory Pro", cat: "Consultant", sub: "Advisor", layout: "executive", premium: true, ats: 94, features: ["advisory", "expert"] },

  { name: "Freelancer Plus", cat: "Freelancer", sub: "Freelancer", layout: "creative", premium: true, ats: 88, features: ["freelance", "portfolio"] },
  { name: "GigPro", cat: "Freelancer", sub: "Contractor", layout: "standard", premium: false, ats: 90, features: ["freelance", "project-based"] },
  { name: "SoloDev", cat: "Freelancer", sub: "Freelance Developer", layout: "two-column", premium: true, ats: 89, features: ["freelance", "developer"] },
  { name: "CreativeSolo", cat: "Freelancer", sub: "Freelance Designer", layout: "creative", premium: false, ats: 85, features: ["freelance", "designer"] },

  { name: "Academic Pro", cat: "Academic", sub: "Professor", layout: "executive", premium: true, ats: 95, features: ["academic", "research"] },
  { name: "Research Scholar", cat: "Academic", sub: "Researcher", layout: "standard", premium: false, ats: 93, features: ["research", "publications"] },
  { name: "Teaching Pro", cat: "Academic", sub: "Teacher", layout: "two-column", premium: false, ats: 92, features: ["teaching", "education"] },
  { name: "PhD Profile", cat: "Academic", sub: "PhD Candidate", layout: "minimal", premium: true, ats: 94, features: ["phd", "research"] },
  { name: "PostDoc", cat: "Academic", sub: "Postdoctoral", layout: "standard", premium: true, ats: 95, features: ["postdoc", "academic"] },

  { name: "Global Citizen", cat: "International Resume", sub: "International", layout: "standard", premium: true, ats: 93, features: ["international", "global"] },
  { name: "EuroPass", cat: "International Resume", sub: "Europass Format", layout: "standard", premium: false, ats: 96, features: ["europass", "standard"] },
  { name: "Asia Pro", cat: "International Resume", sub: "Asia-Pacific", layout: "two-column", premium: true, ats: 91, features: ["asia", "professional"] },
  { name: "UK Standard", cat: "International Resume", sub: "UK Format", layout: "executive", premium: false, ats: 95, features: ["uk", "standard"] },
  { name: "Remote Ready", cat: "International Resume", sub: "Remote Work", layout: "minimal", premium: false, ats: 90, features: ["remote", "distributed"] },
  { name: "WorkAbroad", cat: "International Resume", sub: "Expat", layout: "standard", premium: true, ats: 92, features: ["expat", "international"] },

  { name: "MBA Elite", cat: "Business", sub: "MBA Graduate", layout: "executive", premium: true, ats: 96, features: ["mba", "business"] },
  { name: "Executive Suite", cat: "Business", sub: "C-Suite", layout: "executive", premium: true, ats: 98, features: ["executive", "c-suite"] },
  { name: "Director Pro", cat: "Business", sub: "Director", layout: "executive", premium: true, ats: 97, features: ["director", "leadership"] },
  { name: "Startup Founder", cat: "Business", sub: "Entrepreneur", layout: "creative", premium: true, ats: 88, features: ["founder", "startup"] },
  { name: "Business Analyst", cat: "Business", sub: "Business Analyst", layout: "standard", premium: false, ats: 93, features: ["analyst", "business"] },
  { name: "Operations Pro", cat: "Business", sub: "Operations Manager", layout: "standard", premium: false, ats: 92, features: ["operations", "management"] },
  { name: "Supply Chain", cat: "Business", sub: "Supply Chain", layout: "two-column", premium: true, ats: 91, features: ["supply-chain", "logistics"] },

  { name: "Legal Brief", cat: "Legal", sub: "Lawyer", layout: "executive", premium: true, ats: 97, features: ["legal", "law"] },
  { name: "Paralegal Pro", cat: "Legal", sub: "Paralegal", layout: "standard", premium: false, ats: 95, features: ["legal", "paralegal"] },
  { name: "Compliance Pro", cat: "Legal", sub: "Compliance Officer", layout: "executive", premium: true, ats: 96, features: ["compliance", "regulatory"] },
  { name: "Legal Counsel", cat: "Legal", sub: "Corporate Counsel", layout: "standard", premium: true, ats: 96, features: ["legal", "corporate"] },
];

const COLOR_PALETTES = [
  { name: "Corporate Blue", primary: "#0A66C2", secondary: "#1F2937", accent: "#E5E7EB", background: "#FFFFFF", text: "#111827" },
  { name: "Emerald", primary: "#059669", secondary: "#1F2937", accent: "#D1FAE5", background: "#FFFFFF", text: "#111827" },
  { name: "Royal Purple", primary: "#7C3AED", secondary: "#2D1B69", accent: "#EDE9FE", background: "#FFFFFF", text: "#111827" },
  { name: "Crimson", primary: "#DC2626", secondary: "#1F2937", accent: "#FEE2E2", background: "#FFFFFF", text: "#111827" },
  { name: "Ocean", primary: "#0891B2", secondary: "#164E63", accent: "#CFFAFE", background: "#FFFFFF", text: "#111827" },
  { name: "Warm Amber", primary: "#D97706", secondary: "#1F2937", accent: "#FEF3C7", background: "#FFFFFF", text: "#111827" },
  { name: "Slate", primary: "#475569", secondary: "#1E293B", accent: "#F1F5F9", background: "#FFFFFF", text: "#0F172A" },
  { name: "Rose", primary: "#E11D48", secondary: "#1F2937", accent: "#FFE4E6", background: "#FFFFFF", text: "#111827" },
  { name: "Teal", primary: "#0D9488", secondary: "#134E4A", accent: "#CCFBF1", background: "#FFFFFF", text: "#111827" },
  { name: "Indigo", primary: "#4F46E5", secondary: "#1E1B4B", accent: "#E0E7FF", background: "#FFFFFF", text: "#111827" },
  { name: "Night", primary: "#1E293B", secondary: "#0F172A", accent: "#E2E8F0", background: "#F8FAFC", text: "#0F172A" },
  { name: "Forest", primary: "#166534", secondary: "#14532D", accent: "#DCFCE7", background: "#FFFFFF", text: "#111827" },
  { name: "Ocean Blue", primary: "#2563EB", secondary: "#1E3A5F", accent: "#DBEAFE", background: "#FFFFFF", text: "#111827" },
  { name: "Fiery Red", primary: "#B91C1C", secondary: "#7F1D1D", accent: "#FEE2E2", background: "#FFF7F7", text: "#111827" },
  { name: "Dark Luxury", primary: "#1F2937", secondary: "#111827", accent: "#F3F4F6", background: "#FFFFFF", text: "#111827" },
  { name: "Sunset", primary: "#EA580C", secondary: "#9A3412", accent: "#FFEDD5", background: "#FFFFFF", text: "#111827" },
  { name: "Mint", primary: "#10B981", secondary: "#065F46", accent: "#D1FAE5", background: "#FFFFFF", text: "#111827" },
  { name: "Navy", primary: "#1E40AF", secondary: "#1E3A5F", accent: "#DBEAFE", background: "#F0F5FF", text: "#111827" },
  { name: "Berry", primary: "#BE185D", secondary: "#831843", accent: "#FCE7F3", background: "#FFFFFF", text: "#111827" },
  { name: "Gold", primary: "#B45309", secondary: "#78350F", accent: "#FEF3C7", background: "#FFFCF5", text: "#111827" },
  { name: "Cyberpunk", primary: "#06B6D4", secondary: "#0E7490", accent: "#CFFAFE", background: "#F0FDFF", text: "#111827" },
  { name: "Lavender", primary: "#8B5CF6", secondary: "#5B21B6", accent: "#EDE9FE", background: "#FAF5FF", text: "#111827" },
  { name: "Professional Gray", primary: "#374151", secondary: "#111827", accent: "#F3F4F6", background: "#FFFFFF", text: "#111827" },
  { name: "Azure", primary: "#0284C7", secondary: "#075985", accent: "#E0F2FE", background: "#FFFFFF", text: "#111827" },
  { name: "Sage", primary: "#4ADE80", secondary: "#166534", accent: "#DCFCE7", background: "#FAFFFA", text: "#111827" },
];

const FONTS = [
  "Inter", "Roboto", "Lato", "Open Sans", "Montserrat", "Poppins",
  "Nunito", "Raleway", "Work Sans", "Source Sans Pro", "Merriweather",
  "Playfair Display", "PT Sans", "Noto Sans", "Quicksand",
];

const SECTIONS_BY_CATEGORY = {
  "Technology": ["header", "summary", "skills", "experience", "projects", "education", "certifications", "achievements", "github"],
  "AI Engineer": ["header", "summary", "skills", "experience", "projects", "publications", "models", "certifications", "github", "huggingface"],
  "Creative": ["header", "summary", "skills", "experience", "portfolio", "education", "certifications", "awards"],
  "Professional": ["header", "summary", "experience", "education", "skills", "certifications", "references"],
  "Student": ["header", "education", "skills", "experience", "projects", "certifications", "activities"],
  "Finance": ["header", "summary", "experience", "education", "certifications", "skills", "references"],
  "Healthcare": ["header", "summary", "experience", "education", "certifications", "skills", "publications"],
  "Modern": ["header", "summary", "experience", "skills", "education", "projects", "interests"],
  "Business": ["header", "summary", "experience", "education", "achievements", "skills", "references"],
  "Sales": ["header", "summary", "experience", "achievements", "skills", "education", "certifications"],
  "HR": ["header", "summary", "experience", "skills", "education", "certifications", "references"],
  "Product Manager": ["header", "summary", "experience", "skills", "products", "education", "certifications"],
  "Project Manager": ["header", "summary", "experience", "certifications", "skills", "education", "references"],
  "Consultant": ["header", "summary", "experience", "education", "skills", "certifications", "achievements"],
  "Freelancer": ["header", "summary", "skills", "projects", "experience", "education", "portfolio"],
  "Academic": ["header", "summary", "education", "experience", "publications", "research", "certifications"],
  "International Resume": ["header", "summary", "experience", "education", "languages", "skills", "certifications"],
  "Legal": ["header", "summary", "experience", "education", "certifications", "skills", "publications"],
};

export async function seedResumeTemplates() {
  try {
    const existing = await ResumeTemplate.countDocuments({ isActive: true });
    if (existing >= 80) {
      console.log(`✓ ${existing} resume templates already exist — skipping seed`);
      return;
    }

    console.log("🌱 Seeding resume templates...");

    const templates = TEMPLATES_CONFIG.map((cfg, idx) => {
      const colorPalette = pick(COLOR_PALETTES);
      const headingFont = pick(FONTS);
      const bodyFont = pick(FONTS.filter(f => f !== headingFont));
      const sections = SECTIONS_BY_CATEGORY[cfg.cat] || ["header", "summary", "experience", "education", "skills"];

      const colors = {
        primary: colorPalette.primary,
        secondary: colorPalette.secondary,
        accent: colorPalette.accent,
        background: colorPalette.background,
        text: colorPalette.text,
      };

      return {
        name: cfg.name,
        slug: slugify(cfg.name) + "-" + idx,
        description: `A ${cfg.sub ? cfg.sub.toLowerCase() + " " : ""}resume template${cfg.premium ? " with premium design" : ""}. ATS score ${cfg.ats}%. ${pick(["Perfect for experienced professionals.", "Ideal for career changers.", "Great for showcasing technical skills.", "Designed for executive roles.", "Optimized for recruiter ATS systems."])}`,
        category: cfg.cat,
        subcategory: cfg.sub || "",
        tags: [cfg.cat.toLowerCase(), cfg.sub?.toLowerCase() || "", ...cfg.features],
        isPremium: cfg.premium,
        isActive: true,
        downloads: randInt(100, 50000),
        favorites: randInt(50, 10000),
        rating: +(4 + Math.random()).toFixed(1),
        ratingCount: randInt(10, 5000),
        atsScore: cfg.ats,
        popularity: randInt(100, 9900),
        layout: cfg.layout,
        font: headingFont,
        fontSize: pick(["10pt", "10.5pt", "11pt", "11.5pt"]),
        fontConfig: { heading: headingFont, body: bodyFont },
        colors,
        colorPalettes: pickMany(COLOR_PALETTES, 3),
        pageOptions: {
          marginTop: randInt(30, 50),
          marginBottom: randInt(30, 50),
          marginLeft: randInt(30, 50),
          marginRight: randInt(30, 50),
          spacing: randInt(8, 16),
          showIcons: pick([true, false]),
          headerStyle: pick(["modern", "classic", "minimal", "creative"]),
          sectionDivider: pick(["line", "space", "border", "none"]),
          columns: cfg.layout === "two-column" ? 2 : 1,
        },
        features: cfg.features,
        sections,
        structure: {
          sections,
          layout: cfg.layout,
          showPhoto: pick([true, false]),
          showIcons: pick([true, false]),
        },
        previewSvg: generateSvg(cfg.name, colors, cfg.layout),
        lastUpdated: new Date(Date.now() - randInt(0, 90) * 86400000),
      };
    });

    await ResumeTemplate.insertMany(templates, { ordered: false });
    console.log(`  ✓ ${templates.length} resume templates seeded successfully`);
  } catch (error) {
    console.error("✗ Failed to seed resume templates:", error.message);
  }
}
