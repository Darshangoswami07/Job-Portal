// AI Service for generating intelligent content
// Uses template-based generation with contextual personalization
// Can be swapped with OpenAI/Gemini by adding API_KEY and calling the LLM

const resumeActionVerbs = [
  "Developed", "Led", "Architected", "Designed", "Implemented",
  "Optimized", "Delivered", "Automated", "Built", "Engineered",
  "Spearheaded", "Drove", "Established", "Managed", "Transformed",
  "Accelerated", "Championed", "Orchestrated", "Generated", "Streamlined"
];

const resumeKeywords = {
  frontend: ["React", "TypeScript", "Next.js", "Tailwind CSS", "REST APIs", "GraphQL", "Jest", "Cypress", "Webpack", "Responsive Design", "Accessibility", "Performance Optimization"],
  backend: ["Node.js", "Python", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "CI/CD", "Microservices", "GraphQL", "AWS", "System Design"],
  fullstack: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS", "REST APIs", "GraphQL", "CI/CD", "Agile", "Testing", "DevOps"],
  data: ["Python", "TensorFlow", "PyTorch", "SQL", "Pandas", "Scikit-learn", "Data Pipelines", "MLOps", "Statistics", "Deep Learning", "NLP", "Computer Vision"],
  devops: ["Docker", "Kubernetes", "Terraform", "Jenkins", "Ansible", "AWS", "GCP", "CI/CD", "Monitoring", "Linux", "GitOps", "Helm"]
};

export function generateResumeSuggestions(resume) {
  const skills = resume.skills || [];
  const experience = resume.experience || [];
  const summary = resume.summary || "";

  const category = detectCategory(skills);
  const keywords = resumeKeywords[category] || resumeKeywords.frontend;
  const missingKeywords = keywords.filter(k => !skills.some(s => s.toLowerCase().includes(k.toLowerCase()))).slice(0, 6);

  const suggestions = [];

  if (!summary || summary.length < 50) {
    suggestions.push({
      section: "summary",
      type: "improvement",
      message: "Add a compelling professional summary highlighting your key achievements and career goals. Aim for 2-3 impactful sentences.",
      suggestion: `Results-driven ${resume.headline || "professional"} with expertise in ${skills.slice(0, 3).join(", ") || "software development"}. Proven track record of delivering ${["high-impact solutions", "scalable applications", "measurable results"][Math.floor(Math.random() * 3)]} that drive business growth.`
    });
  }

  experience.forEach((exp, i) => {
    if (!exp.description || exp.description.length < 30) {
      const verb = resumeActionVerbs[Math.floor(Math.random() * resumeActionVerbs.length)];
      const tech = skills.length > 0 ? skills[Math.floor(Math.random() * skills.length)] : "modern technologies";
      suggestions.push({
        section: "experience",
        type: "content",
        message: `Add quantified achievements for your role at ${exp.company || "your company"}. Use action verbs and include metrics.`,
        suggestion: `${verb} ${["scalable features", "critical systems", "high-performance solutions", "production-grade applications"][Math.floor(Math.random() * 4)]} using ${tech}, resulting in ${["40% improvement in efficiency", "30% reduction in load time", "50% increase in team productivity", "25% cost savings"][Math.floor(Math.random() * 4)]}.`
      });
    }
  });

  if (missingKeywords.length > 0) {
    suggestions.push({
      section: "skills",
      type: "keyword",
      message: `Consider adding these in-demand skills to improve ATS ranking: ${missingKeywords.join(", ")}.`,
      suggestion: missingKeywords.slice(0, 4)
    });
  }

  const atsScore = calculateATSScore(resume, keywords);
  const improvements = [
    atsScore < 60 ? { section: "general", type: "ats", message: "Your ATS score is low. Add more industry keywords and quantify achievements with specific numbers.", suggestion: "Review job descriptions in your target role and incorporate relevant keywords naturally throughout your resume." } : null,
    (!resume.linkedin && !resume.github) ? { section: "contact", type: "missing", message: "Add LinkedIn and GitHub links to increase recruiter engagement.", suggestion: "Include your professional social profiles in the contact section." } : null,
    (resume.education || []).length === 0 ? { section: "education", type: "missing", message: "Add your educational background to complete your profile.", suggestion: "Include degree, institution, and graduation year." } : null
  ].filter(Boolean);

  const score = {
    overall: atsScore,
    keywords: Math.min(100, Math.round((skills.length / 10) * 100)),
    formatting: 85,
    experience: Math.min(100, Math.round((experience.length / 3) * 100)),
    education: resume.education && resume.education.length > 0 ? 90 : 30,
    ats: atsScore,
    suggestions: suggestions.length + improvements.length
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
    company: "Tech Corp",
    title: headline || "Software Engineer",
    location: location || "Remote",
    startDate: "2021-01",
    endDate: "",
    current: true,
    description: `${resumeActionVerbs[Math.floor(Math.random() * resumeActionVerbs.length)]} scalable features using ${skillList[0] || "modern technologies"}, resulting in improved system performance and team productivity. Collaborated across cross-functional teams to deliver projects on time and within scope.`
  }];

  const generatedEducation = hasEducation ? education : [{
    institution: "University of Technology",
    degree: "Bachelor of Science",
    field: "Computer Science",
    startDate: "2016-09",
    endDate: "2020-06",
    grade: "3.8 GPA",
    current: false,
  }];

  const generatedProjects = projects?.length > 0 ? projects : [{
    name: `${skillList[0] || "Full Stack"} Platform`,
    description: `Built a full-stack application using ${skillList.slice(0, 3).join(", ")}. Implemented features including user authentication, real-time updates, and responsive design.`,
    url: "",
    technologies: skillList.slice(0, 4),
  }];

  const achievements = [
    `${resumeActionVerbs[Math.floor(Math.random() * resumeActionVerbs.length)]} initiative resulting in 40% efficiency improvement`,
    `Led team of ${Math.floor(Math.random() * 5) + 3} engineers to deliver critical project ahead of schedule`,
    `Reduced system downtime by 60% through implementation of automated monitoring`,
    `Recognized as top performer for 2 consecutive quarters`,
  ];

  return {
    summary: generatedSummary,
    headline: headline || "Full Stack Developer",
    skills: [...new Set([...skillList, ...resumeKeywords[detectCategory(skillList)]?.slice(0, 4) || []])],
    experience: generatedExperience,
    education: generatedEducation,
    projects: generatedProjects,
    achievements,
  };
}

export function generateCoverLetterContent({ jobTitle, companyName, yourName, skills, experienceLevel, tone }) {
  const toneMap = {
    formal: {
      greeting: "Dear Hiring Manager,",
      closing: "Sincerely",
      style: "professional"
    },
    conversational: {
      greeting: "Hi there,",
      closing: "Best regards",
      style: "warm and approachable"
    },
    enthusiastic: {
      greeting: "Dear [Company Name] Team,",
      closing: "With enthusiasm",
      style: "energetic and passionate"
    }
  };

  const t = toneMap[tone] || toneMap.formal;
  const skillList = skills?.length > 0 ? skills.slice(0, 5) : ["relevant technical skills", "problem-solving abilities", "team collaboration"];
  const level = experienceLevel || "mid";

  const experiencePhrases = {
    entry: [
      "I recently graduated with a strong foundation in [field] and have honed my skills through internships and personal projects.",
      "I am eager to apply my fresh perspective and up-to-date knowledge of industry best practices to your team.",
      "My academic projects have prepared me to immediately contribute to [Company]'s engineering initiatives.",
    ],
    mid: [
      "With several years of hands-on experience delivering production-grade solutions, I bring both technical depth and a collaborative mindset.",
      "I have consistently delivered measurable results, including [achievement], and am excited about the opportunity to bring this expertise to [Company].",
      "My background in [skill] has equipped me to tackle complex challenges while mentoring junior team members.",
    ],
    senior: [
      "With over [years] years of experience leading high-impact engineering teams and shipping products at scale, I am confident in my ability to drive excellence at [Company].",
      "I have architected systems handling millions of users and led cross-functional initiatives that directly impacted revenue and customer satisfaction.",
      "My track record of technical leadership and strategic thinking makes me an ideal candidate to help [Company] scale its engineering organization.",
    ]
  };

  const phrases = experiencePhrases[level] || experiencePhrases.mid;
  const body = [
    `${t.greeting}`,
    `\n\nI am writing to express my strong interest in the ${jobTitle || "position"} at ${companyName || "your company"}. ${phrases[Math.floor(Math.random() * phrases.length)].replace(/\[company\]/gi, companyName || "your company").replace(/\[skill\]/g, skillList[0] || "software engineering").replace(/\[field\]/g, "computer science").replace(/\[years\]/g, "5+")}`,
    `\n\nThroughout my career, I have developed deep expertise in ${skillList.join(", ")}. ${["I thrive in collaborative environments", "I am passionate about building products that make a difference", "I take ownership of problems and drive them to completion", "I believe in writing clean, maintainable code that scales"][Math.floor(Math.random() * 4)]}.`,
    `\n\n${["One of my proudest achievements was", "A notable example of my impact was when", "I particularly excelled when I"][Math.floor(Math.random() * 3)]} ${["led a cross-functional team to deliver a major product launch ahead of schedule", "optimized a critical system reducing latency by 60%", "architected a solution handling 10x traffic growth with zero downtime", "built and mentored a team of 5 engineers while personally contributing to code", "implemented a CI/CD pipeline that reduced deployment time from hours to minutes"][Math.floor(Math.random() * 5)]}.`,
    `\n\nI am particularly drawn to ${companyName || "your company"} because of ${["its reputation for innovation", "the impressive work your team has done in the industry", "the opportunity to work on challenging problems at scale", "your commitment to engineering excellence"][Math.floor(Math.random() * 4)]}. I am excited about the opportunity to contribute to your team's success.`,
    `\n\nThank you for considering my application. I look forward to the possibility of discussing how my skills and experience align with the needs of ${companyName || "your team"}.`,
    `\n\n${t.closing},\n${yourName || "Applicant"}`
  ].join("");

  return { content: body, tone: t.style };
}

export function evaluateInterviewAnswer(question, answer, category) {
  if (!answer || answer.length < 10) {
    return { score: 0, feedback: "Your answer is too brief. Please provide a more detailed response.", clarity: 0, relevance: 0, completeness: 0 };
  }

  const wordCount = answer.split(/\s+/).length;
  const hasStructure = /first|second|finally|however|therefore|because|for example|specifically|in conclusion/i.test(answer);
  const hasTechnicalTerms = /function|component|api|database|algorithm|framework|library|endpoint|middleware|async|promise|callback|state|props|hook|effect|reducer|store|cache|query|mutation|subscription|event|stream|buffer|thread|process|memory|cache|cluster|schema|index|query|join|sort|filter|reduce|map/i.test(answer);
  const hasExamples = /for example|such as|like|specifically|in my experience|i built|i created|i developed|i implemented|i designed|i led/i.test(answer);
  const hasMetrics = /\d+%|\d+x|\d+ milliseconds|\d+ seconds|\d+ users|\d+ requests|\d+ queries/i.test(answer);

  let score = 0;
  score += Math.min(30, Math.round((wordCount / 50) * 30));
  score += hasStructure ? 15 : 0;
  score += hasTechnicalTerms ? 25 : 0;
  score += hasExamples ? 20 : 0;
  score += hasMetrics ? 10 : 0;
  score = Math.min(100, score);

  let feedback;
  if (score >= 85) {
    feedback = "Excellent answer! You provided a well-structured response with technical depth and concrete examples. Consider using the STAR method (Situation, Task, Action, Result) for even more impact.";
  } else if (score >= 65) {
    feedback = "Good answer with solid technical content. To improve, try adding specific examples from your experience and quantifying the impact of your work.";
  } else if (score >= 40) {
    feedback = "Decent start. Your answer covers some key points but would benefit from more structure, technical details, and concrete examples. Try using the STAR method.";
  } else {
    feedback = "Your answer needs more substance. Research common interview questions for this topic and practice structuring your responses with the STAR method (Situation, Task, Action, Result).";
  }

  return {
    score,
    feedback,
    clarity: Math.min(10, Math.round((hasStructure ? 7 : 4) + (wordCount > 30 ? 2 : 0))),
    relevance: Math.min(10, Math.round((hasTechnicalTerms ? 8 : 4) + (hasExamples ? 2 : 0))),
    completeness: Math.min(10, Math.round(score / 10))
  };
}

export function generateInterviewQuestions(category, difficulty, count = 5) {
  const questions = {
    frontend: [
      { question: "Explain the virtual DOM and how it differs from the real DOM. How does React use it to optimize performance?", difficulty: "medium", tags: ["React", "Performance"] },
      { question: "Describe the CSS Box Model and how box-sizing affects element sizing. How would you debug layout issues?", difficulty: "easy", tags: ["CSS", "Layout"] },
      { question: "What are JavaScript closures? Provide a practical use case and explain potential memory implications.", difficulty: "medium", tags: ["JavaScript", "Scope"] },
      { question: "How does React's reconciliation algorithm work? What are keys and why are they important?", difficulty: "hard", tags: ["React", "Internals"] },
      { question: "Explain different approaches to state management in React applications. Compare Context API, Redux, and Zustand.", difficulty: "medium", tags: ["React", "State Management"] },
      { question: "Describe progressive web app (PWA) features. How would you implement offline support?", difficulty: "hard", tags: ["PWA", "Service Workers"] },
      { question: "How do you optimize a React application for performance? List specific techniques and tools.", difficulty: "hard", tags: ["React", "Performance"] },
      { question: "Explain event delegation in JavaScript and its performance benefits.", difficulty: "easy", tags: ["JavaScript", "Events"] },
      { question: "What is the difference between controlled and uncontrolled components in React?", difficulty: "easy", tags: ["React", "Forms"] },
      { question: "How would you implement a custom hook for debounced search? Handle race conditions.", difficulty: "medium", tags: ["React", "Hooks"] },
    ],
    backend: [
      { question: "Explain RESTful API design principles. What are the key constraints and best practices?", difficulty: "medium", tags: ["API", "REST"] },
      { question: "How would you design a database schema for a social media platform? Consider scalability.", difficulty: "hard", tags: ["Database", "Schema Design"] },
      { question: "What is JWT authentication and how does it work? Compare with session-based auth.", difficulty: "medium", tags: ["Auth", "JWT"] },
      { question: "Explain microservices architecture. What are the pros and cons compared to monoliths?", difficulty: "hard", tags: ["Architecture", "Microservices"] },
      { question: "How do you handle database migrations and schema changes in production?", difficulty: "medium", tags: ["Database", "DevOps"] },
      { question: "Explain indexing in databases. How do you decide which columns to index?", difficulty: "easy", tags: ["Database", "Performance"] },
      { question: "Describe the CAP theorem and how it applies to distributed systems.", difficulty: "hard", tags: ["Distributed Systems", "CAP"] },
      { question: "How would you implement rate limiting for an API? Compare different algorithms.", difficulty: "medium", tags: ["API", "Security"] },
      { question: "Explain the event loop in Node.js. How does it handle asynchronous operations?", difficulty: "medium", tags: ["Node.js", "Event Loop"] },
      { question: "What strategies would you use to scale a database that has grown to 10TB?", difficulty: "hard", tags: ["Database", "Scaling"] },
    ],
    fullstack: [
      { question: "How do you decide between REST and GraphQL for a new API? What factors influence your choice?", difficulty: "hard", tags: ["API", "Architecture"] },
      { question: "Explain the full request-response lifecycle from browser to server and back.", difficulty: "medium", tags: ["Web", "HTTP"] },
      { question: "How would you implement real-time features like notifications or live chat?", difficulty: "hard", tags: ["Real-time", "WebSocket"] },
      { question: "Describe your ideal CI/CD pipeline. What stages would you include?", difficulty: "medium", tags: ["DevOps", "CI/CD"] },
      { question: "How do you handle state management in large applications? Compare client vs server state.", difficulty: "medium", tags: ["Architecture", "State"] },
      { question: "Design a URL shortening service like bit.ly. Consider all system design aspects.", difficulty: "hard", tags: ["System Design", "Architecture"] },
      { question: "How would you implement authentication across multiple microservices?", difficulty: "hard", tags: ["Auth", "Microservices"] },
      { question: "Explain different caching strategies and when to use each one.", difficulty: "medium", tags: ["Caching", "Performance"] },
      { question: "Describe how you would migrate a monolithic application to microservices.", difficulty: "hard", tags: ["Architecture", "Migration"] },
      { question: "What security considerations are important when building a web application?", difficulty: "medium", tags: ["Security", "Web"] },
    ],
    react: [
      { question: "Explain React 18 concurrent features and how they improve user experience.", difficulty: "hard", tags: ["React", "Concurrent"] },
      { question: "What are React Server Components and when would you use them?", difficulty: "hard", tags: ["React", "SSR"] },
      { question: "Describe the different React rendering patterns: CSR, SSR, SSG, ISR.", difficulty: "medium", tags: ["React", "Rendering"] },
      { question: "How do React Portals work and what problems do they solve?", difficulty: "medium", tags: ["React", "Portals"] },
      { question: "Explain error boundaries in React. How do you implement graceful error handling?", difficulty: "easy", tags: ["React", "Error Handling"] },
    ],
    node: [
      { question: "Explain the different types of Node.js streams and their use cases.", difficulty: "hard", tags: ["Node.js", "Streams"] },
      { question: "How would you handle file uploads in Node.js? Consider large files and security.", difficulty: "medium", tags: ["Node.js", "Files"] },
      { question: "Describe worker threads in Node.js. When would you use them instead of clustering?", difficulty: "hard", tags: ["Node.js", "Threads"] },
      { question: "How do you debug Node.js applications in production?", difficulty: "medium", tags: ["Node.js", "Debugging"] },
      { question: "Explain the Node.js module system. How do CommonJS and ESM differ?", difficulty: "easy", tags: ["Node.js", "Modules"] },
    ],
    python: [
      { question: "Explain Python decorators with practical examples. How do they work under the hood?", difficulty: "medium", tags: ["Python", "Decorators"] },
      { question: "What are Python generators and when would you use them for performance?", difficulty: "medium", tags: ["Python", "Generators"] },
      { question: "Explain the Global Interpreter Lock and its impact on multi-threading.", difficulty: "hard", tags: ["Python", "GIL"] },
      { question: "How does Python's memory management work? What reference counting and garbage collection?", difficulty: "hard", tags: ["Python", "Memory"] },
      { question: "Compare FastAPI, Django, and Flask. When would you choose each?", difficulty: "medium", tags: ["Python", "Frameworks"] },
    ],
    java: [
      { question: "Explain Java memory model and garbage collection mechanisms.", difficulty: "hard", tags: ["Java", "Memory"] },
      { question: "What are the SOLID principles? Provide Java examples for each.", difficulty: "medium", tags: ["Java", "OOP"] },
      { question: "How does HashMap work internally in Java? What affects its performance?", difficulty: "hard", tags: ["Java", "Collections"] },
      { question: "Explain Spring Boot auto-configuration and dependency injection.", difficulty: "medium", tags: ["Java", "Spring"] },
      { question: "What are Java streams and lambda expressions? How do they enable functional programming?", difficulty: "medium", tags: ["Java", "Functional"] },
    ],
    "ai-engineer": [
      { question: "Explain the bias-variance tradeoff in machine learning models.", difficulty: "hard", tags: ["ML", "Theory"] },
      { question: "How would you design a system to detect fraudulent transactions in real-time?", difficulty: "hard", tags: ["ML", "System Design"] },
      { question: "Compare supervised, unsupervised, and reinforcement learning with examples.", difficulty: "medium", tags: ["ML", "Concepts"] },
      { question: "What is the Transformer architecture and why is it so effective for NLP tasks?", difficulty: "hard", tags: ["AI", "NLP"] },
      { question: "How do you handle imbalanced datasets in classification problems?", difficulty: "medium", tags: ["ML", "Data"] },
      { question: "Explain gradient descent and its variants. When would you use Adam over SGD?", difficulty: "medium", tags: ["ML", "Optimization"] },
      { question: "How would you evaluate the performance of a recommendation system?", difficulty: "hard", tags: ["ML", "Evaluation"] },
      { question: "Describe MLOps practices for deploying and monitoring ML models in production.", difficulty: "medium", tags: ["ML", "MLOps"] },
    ]
  };

  const all = questions[category] || questions.frontend;
  const filtered = difficulty === "all" ? all : all.filter(q => q.difficulty === difficulty);
  const sorted = [...filtered].sort(() => Math.random() - 0.5);
  return sorted.slice(0, Math.min(count, sorted.length));
}

function detectCategory(skills) {
  const skillStr = (skills || []).join(" ").toLowerCase();
  if (skillStr.includes("react") || skillStr.includes("css") || skillStr.includes("html") || skillStr.includes("javascript")) return "frontend";
  if (skillStr.includes("node") || skillStr.includes("express") || skillStr.includes("sql") || skillStr.includes("mongodb")) return "backend";
  if (skillStr.includes("python") || skillStr.includes("tensorflow") || skillStr.includes("data")) return "data";
  if (skillStr.includes("docker") || skillStr.includes("kubernetes") || skillStr.includes("aws")) return "devops";
  if (skillStr.includes("java") || skillStr.includes("spring")) return "backend";
  return "fullstack";
}

function calculateATSScore(resume, keywords) {
  let score = 50;
  const textFields = [
    resume.summary || "",
    ...(resume.experience || []).map(e => e.description || ""),
    ...(resume.skills || []),
    resume.headline || ""
  ].join(" ").toLowerCase();

  const matched = keywords.filter(k => textFields.includes(k.toLowerCase()));
  score += Math.min(30, matched.length * 5);

  if (resume.education && resume.education.length > 0) score += 10;
  if (resume.experience && resume.experience.length >= 2) score += 10;
  if (textFields.length > 500) score += 10;
  if (/\d+%|\d+x|\d+ years/i.test(textFields)) score += 10;

  return Math.min(100, Math.max(20, score));
}
