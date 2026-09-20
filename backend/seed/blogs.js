import { Blog } from "../models_new/Blog.js";
import { User } from "../models/user.model.js";

const CATEGORIES = [
  "Software Development", "React", "Next.js", "JavaScript", "TypeScript",
  "Python", "Java", "Go", "Node.js",
  "AI", "AI Engineering", "LLMs", "RAG", "MCP", "AI Agents", "LangGraph", "LangChain", "Prompt Engineering",
  "Career", "Resume Tips", "ATS Optimization", "Salary Negotiation", "Interview Preparation", "Remote Jobs", "Freelancing", "Career Growth",
  "Cloud", "AWS", "Azure", "Docker", "Kubernetes", "DevOps",
  "Data Science", "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
];

const BLOG_CONTENT = `# Introduction

In today's fast-paced technology landscape, staying ahead of the curve is not just an advantage — it's a necessity. Whether you're a seasoned professional or just starting your journey, understanding the foundational principles and emerging trends is crucial for long-term success.

## Why This Matters

The technology industry evolves at an unprecedented rate. New frameworks, tools, and methodologies emerge daily, making it challenging for professionals to keep their skills relevant. However, with the right approach and mindset, you can not only keep up but thrive.

### Key Principles

1. **Continuous Learning**: The most successful professionals dedicate time each week to learning new technologies
2. **Practical Application**: Theory without practice is hollow; build projects that challenge you
3. **Community Engagement**: Share your knowledge and learn from others
4. **Strategic Focus**: Depth in key areas matters more than shallow breadth

## Core Concepts

### Understanding the Fundamentals

Before diving into advanced topics, ensure you have a solid grasp of the fundamentals. This includes:

- **Problem-solving mindset**: Every technical challenge has a solution
- **System design thinking**: How components interact at scale
- **Performance optimization**: Writing code that not only works but performs
- **Security awareness**: Building with security from day one

\`\`\`javascript
// Example: A simple yet powerful pattern
const solution = (input) => {
  // Validate
  if (!input) throw new Error('Input required');
  
  // Transform
  const processed = transform(input);
  
  // Return
  return processed;
};
\`\`\`

### Advanced Techniques

Once you master the basics, explore advanced patterns:

> "The best code is the code that doesn't need to be written." — A wise engineer

| Technique | Benefit | Complexity |
|-----------|---------|------------|
| Caching | 10x performance | Medium |
| Lazy Loading | Faster initial loads | Low |
| Code Splitting | Smaller bundles | Medium |
| Microservices | Independent scaling | High |

## Practical Implementation

Let's walk through a real-world example:

1. Start with a clear requirement
2. Design the architecture
3. Implement incrementally
4. Test thoroughly
5. Deploy with confidence
6. Monitor and iterate

### Common Pitfalls to Avoid

- Premature optimization
- Over-engineering
- Ignoring edge cases
- Skipping tests
- Not documenting decisions

## Conclusion

The journey to mastery is continuous. Every line of code you write, every problem you solve, and every lesson you learn contributes to your growth as a professional. Stay curious, stay humble, and keep building.

---

*This article was crafted with insights from industry experts and real-world experience. Share your thoughts in the comments below.*`;

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800",
  "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800",
  "https://images.unsplash.com/photo-1537432376144-e84978a2925d?w=800",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
  "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
];

const blogTemplates = [
  // AI & ML
  { title: "The Complete Guide to Large Language Models in 2026", category: "LLMs", tags: ["AI", "LLM", "GPT", "NLP"], readTime: 12 },
  { title: "Building Production-Ready RAG Systems: A Step-by-Step Guide", category: "RAG", tags: ["RAG", "AI", "LLM", "Vector Databases"], readTime: 15 },
  { title: "MCP Protocol Explained: The Future of AI-Tool Integration", category: "MCP", tags: ["MCP", "AI", "Protocol", "Integration"], readTime: 10 },
  { title: "Building Autonomous AI Agents with LangGraph", category: "LangGraph", tags: ["LangGraph", "AI Agents", "LangChain", "AI"], readTime: 14 },
  { title: "LangChain Mastery: Building Complex AI Workflows", category: "LangChain", tags: ["LangChain", "AI", "LLM", "Workflows"], readTime: 13 },
  { title: "Prompt Engineering: The Definitive Guide for 2026", category: "Prompt Engineering", tags: ["Prompt Engineering", "AI", "LLM", "Best Practices"], readTime: 11 },
  { title: "AI Agents in Production: Architecture, Patterns, and Pitfalls", category: "AI Agents", tags: ["AI Agents", "Production", "Architecture"], readTime: 16 },
  { title: "The Rise of Agentic AI: What Every Developer Should Know", category: "AI Engineering", tags: ["AI", "Agentic", "Engineering", "Trends"], readTime: 9 },
  { title: "Fine-Tuning LLMs for Domain-Specific Applications", category: "AI Engineering", tags: ["Fine-Tuning", "LLM", "AI", "Domain"], readTime: 14 },
  { title: "Vector Databases 101: Choosing the Right One for Your RAG Pipeline", category: "RAG", tags: ["Vector DB", "RAG", "Pinecone", "Weaviate"], readTime: 11 },
  { title: "Multimodal AI: Combining Text, Vision, and Audio", category: "AI", tags: ["Multimodal", "AI", "Vision", "Audio"], readTime: 13 },
  { title: "AI Safety and Alignment: A Practical Guide for Engineers", category: "AI Engineering", tags: ["AI Safety", "Alignment", "Ethics", "Engineering"], readTime: 12 },

  // Frontend
  { title: "React 19: What's New and How to Upgrade", category: "React", tags: ["React", "Frontend", "JavaScript", "Upgrade"], readTime: 10 },
  { title: "Next.js 15 App Router: The Complete Guide", category: "Next.js", tags: ["Next.js", "React", "App Router", "SSR"], readTime: 15 },
  { title: "JavaScript Design Patterns Every Developer Should Know", category: "JavaScript", tags: ["JavaScript", "Design Patterns", "ES6", "Best Practices"], readTime: 11 },
  { title: "TypeScript 5.5 Features That Will Transform Your Code", category: "TypeScript", tags: ["TypeScript", "JavaScript", "Static Typing"], readTime: 9 },
  { title: "Building Scalable React Apps with Clean Architecture", category: "React", tags: ["React", "Architecture", "Scalability", "Best Practices"], readTime: 13 },
  { title: "Server Components vs Client Components in Next.js", category: "Next.js", tags: ["Next.js", "Server Components", "React", "Performance"], readTime: 10 },
  { title: "Mastering React Server Components for Better Performance", category: "React", tags: ["React", "Server Components", "RSC", "Performance"], readTime: 12 },
  { title: "State Management in 2026: From Context to Signals", category: "Frontend", tags: ["State Management", "React", "Signals", "Frontend"], readTime: 11 },
  { title: "Web Performance Optimization: A Comprehensive Guide", category: "Frontend", tags: ["Performance", "Web", "Optimization", "Lighthouse"], readTime: 14 },
  { title: "Tailwind CSS Best Practices for Large Projects", category: "Frontend", tags: ["Tailwind", "CSS", "Frontend", "Design"], readTime: 8 },
  { title: "The Complete Guide to React Testing in 2026", category: "React", tags: ["React", "Testing", "Jest", "Cypress"], readTime: 13 },
  { title: "Building Accessible Web Applications: A Developer's Guide", category: "Frontend", tags: ["Accessibility", "a11y", "Frontend", "Inclusive Design"], readTime: 10 },

  // Backend
  { title: "Node.js Best Practices for Production Applications", category: "Node.js", tags: ["Node.js", "Backend", "Production", "Best Practices"], readTime: 12 },
  { title: "Building RESTful APIs with Express.js: The Right Way", category: "Node.js", tags: ["Express", "API", "Node.js", "REST"], readTime: 10 },
  { title: "Python FastAPI vs Django: Choosing the Right Framework", category: "Python", tags: ["Python", "FastAPI", "Django", "Backend"], readTime: 9 },
  { title: "Go vs Rust: A Practical Comparison for Backend Services", category: "Go", tags: ["Go", "Rust", "Backend", "Comparison"], readTime: 11 },
  { title: "Java 21 Features That Modern Developers Need to Know", category: "Java", tags: ["Java", "JVM", "Modern Java", "Features"], readTime: 10 },
  { title: "GraphQL vs REST: Making the Right Choice in 2026", category: "Software Development", tags: ["GraphQL", "REST", "API", "Backend"], readTime: 11 },
  { title: "Microservices Architecture: Patterns and Anti-Patterns", category: "Software Development", tags: ["Microservices", "Architecture", "Patterns", "Backend"], readTime: 14 },
  { title: "Event-Driven Architecture with Node.js and Kafka", category: "Node.js", tags: ["Node.js", "Kafka", "Event-Driven", "Architecture"], readTime: 13 },
  { title: "Database Design Patterns for Scalable Applications", category: "Software Development", tags: ["Database", "Design Patterns", "SQL", "NoSQL"], readTime: 12 },
  { title: "Building Real-Time Applications with WebSockets", category: "Node.js", tags: ["WebSockets", "Real-Time", "Node.js", "Socket.io"], readTime: 10 },
  { title: "API Security Best Practices: From OAuth to API Keys", category: "Software Development", tags: ["API Security", "OAuth", "JWT", "Authentication"], readTime: 13 },
  { title: "Caching Strategies for High-Performance APIs", category: "Software Development", tags: ["Caching", "Redis", "CDN", "Performance"], readTime: 10 },

  // Cloud & DevOps
  { title: "AWS Certification Path 2026: Which One Should You Choose?", category: "AWS", tags: ["AWS", "Certification", "Cloud", "Career"], readTime: 9 },
  { title: "Azure vs AWS: A Comprehensive Cloud Comparison", category: "Cloud", tags: ["Azure", "AWS", "Cloud", "Comparison"], readTime: 11 },
  { title: "Docker Compose for Development: Tips and Tricks", category: "Docker", tags: ["Docker", "Docker Compose", "DevOps", "Development"], readTime: 8 },
  { title: "Kubernetes in Production: Lessons Learned from 5 Years", category: "Kubernetes", tags: ["Kubernetes", "K8s", "Production", "DevOps"], readTime: 15 },
  { title: "CI/CD Pipeline Design: From Zero to Production", category: "DevOps", tags: ["CI/CD", "GitHub Actions", "DevOps", "Pipeline"], readTime: 12 },
  { title: "Infrastructure as Code with Terraform: Getting Started", category: "DevOps", tags: ["Terraform", "IaC", "Infrastructure", "DevOps"], readTime: 10 },
  { title: "Monitoring and Observability in Cloud-Native Applications", category: "DevOps", tags: ["Monitoring", "Observability", "Prometheus", "Grafana"], readTime: 11 },
  { title: "Serverless Architecture: When to Use and When to Avoid", category: "Cloud", tags: ["Serverless", "AWS Lambda", "Cloud", "Architecture"], readTime: 10 },
  { title: "Mastering AWS ECS and Fargate for Container Orchestration", category: "AWS", tags: ["AWS", "ECS", "Fargate", "Containers"], readTime: 13 },
  { title: "GitOps: The Modern Approach to Deployment", category: "DevOps", tags: ["GitOps", "ArgoCD", "DevOps", "Deployment"], readTime: 9 },
  { title: "Zero Trust Security Architecture for Cloud Applications", category: "Cloud", tags: ["Zero Trust", "Security", "Cloud", "Architecture"], readTime: 12 },
  { title: "Helm Charts: Package Management for Kubernetes", category: "Kubernetes", tags: ["Helm", "Kubernetes", "Package Management", "DevOps"], readTime: 10 },

  // Data Science & ML
  { title: "Machine Learning Pipeline: From Data Collection to Deployment", category: "Machine Learning", tags: ["ML", "Pipeline", "Data Science", "Deployment"], readTime: 14 },
  { title: "Deep Learning with PyTorch: A Practical Introduction", category: "Deep Learning", tags: ["Deep Learning", "PyTorch", "Neural Networks", "AI"], readTime: 13 },
  { title: "Natural Language Processing with Transformers", category: "NLP", tags: ["NLP", "Transformers", "BERT", "AI"], readTime: 12 },
  { title: "Computer Vision: From CNNs to Vision Transformers", category: "Computer Vision", tags: ["Computer Vision", "CNN", "ViT", "AI"], readTime: 14 },
  { title: "Feature Engineering for Better Machine Learning Models", category: "Machine Learning", tags: ["Feature Engineering", "ML", "Data Science", "Best Practices"], readTime: 11 },
  { title: "Time Series Forecasting with Python", category: "Data Science", tags: ["Time Series", "Python", "Forecasting", "Data Science"], readTime: 11 },
  { title: "MLOps: Bringing DevOps Practices to Machine Learning", category: "Data Science", tags: ["MLOps", "DevOps", "ML", "Data Science"], readTime: 12 },
  { title: "Reinforcement Learning: From Theory to Application", category: "Machine Learning", tags: ["Reinforcement Learning", "RL", "AI", "ML"], readTime: 15 },
  { title: "Data Engineering: Building Robust Data Pipelines", category: "Data Science", tags: ["Data Engineering", "ETL", "Data Pipelines", "Big Data"], readTime: 13 },
  { title: "Model Deployment Strategies for Production ML Systems", category: "Machine Learning", tags: ["Deployment", "ML", "Production", "Model Serving"], readTime: 12 },
  { title: "Explainable AI: Making Black Box Models Understandable", category: "AI", tags: ["XAI", "Explainable AI", "Interpretability", "AI"], readTime: 10 },
  { title: "Data Visualization Best Practices with Python", category: "Data Science", tags: ["Data Visualization", "Python", "Matplotlib", "Dashboard"], readTime: 9 },

  // Career
  { title: "The Ultimate Resume Guide for Tech Professionals in 2026", category: "Resume Tips", tags: ["Resume", "Career", "Job Search", "Tech"], readTime: 10 },
  { title: "ATS Optimization: How to Get Past Automated Resume Screeners", category: "ATS Optimization", tags: ["ATS", "Resume", "Job Search", "Recruitment"], readTime: 9 },
  { title: "Salary Negotiation: A Step-by-Step Guide for Tech Roles", category: "Salary Negotiation", tags: ["Salary", "Negotiation", "Career", "Compensation"], readTime: 11 },
  { title: "Cracking the Tech Interview: System Design Edition", category: "Interview Preparation", tags: ["Interview", "System Design", "Tech", "Preparation"], readTime: 14 },
  { title: "Remote Work vs Office: Making the Right Choice for Your Career", category: "Remote Jobs", tags: ["Remote Work", "WFH", "Career", "Work-Life Balance"], readTime: 8 },
  { title: "The Complete Guide to Freelancing in Tech", category: "Freelancing", tags: ["Freelancing", "Contract", "Career", "Self-Employment"], readTime: 12 },
  { title: "Career Growth Strategies for Software Engineers", category: "Career Growth", tags: ["Career Growth", "Software Engineering", "Promotion", "Leadership"], readTime: 10 },
  { title: "How to Write a Cover Letter That Gets You Hired", category: "Resume Tips", tags: ["Cover Letter", "Job Search", "Career", "Application"], readTime: 8 },
  { title: "Networking in the Digital Age: Building Meaningful Connections", category: "Career", tags: ["Networking", "LinkedIn", "Career", "Professional Growth"], readTime: 9 },
  { title: "From Junior to Senior: A Roadmap for Software Engineers", category: "Career Growth", tags: ["Career Growth", "Software Engineering", "Promotion", "Skills"], readTime: 13 },
  { title: "Technical Writing: A Career Path Worth Exploring", category: "Career", tags: ["Technical Writing", "Career", "Documentation", "Communication"], readTime: 7 },
  { title: "Building Your Personal Brand as a Developer", category: "Career", tags: ["Personal Brand", "Developer", "LinkedIn", "Social Media"], readTime: 9 },
  { title: "Interview Prep: Top 100 Data Structures & Algorithms Questions", category: "Interview Preparation", tags: ["Interview", "DSA", "Algorithms", "Preparation"], readTime: 16 },
  { title: "How to Negotiate a Signing Bonus and Equity Package", category: "Salary Negotiation", tags: ["Salary", "Negotiation", "Equity", "Signing Bonus"], readTime: 10 },
  { title: "The Remote Job Seeker's Toolkit: Tools and Strategies", category: "Remote Jobs", tags: ["Remote Jobs", "Job Search", "Tools", "Strategies"], readTime: 8 },
  { title: "Building a Standout GitHub Portfolio for Job Seekers", category: "Career Growth", tags: ["GitHub", "Portfolio", "Job Search", "Open Source"], readTime: 7 },

  // Cloud & DevOps continued
  { title: "AWS Lambda Best Practices for Production Workloads", category: "AWS", tags: ["AWS Lambda", "Serverless", "Cloud", "Best Practices"], readTime: 11 },
  { title: "Azure DevOps: A Complete CI/CD Guide", category: "Azure", tags: ["Azure", "DevOps", "CI/CD", "Cloud"], readTime: 12 },
  { title: "Docker Multistage Builds for Smaller Images", category: "Docker", tags: ["Docker", "Multistage Build", "Optimization", "DevOps"], readTime: 8 },
  { title: "Kubernetes Security Best Practices", category: "Kubernetes", tags: ["Kubernetes", "Security", "Pod Security", "RBAC"], readTime: 13 },

  // Software Development general
  { title: "Clean Code Principles: Writing Code Humans Love to Read", category: "Software Development", tags: ["Clean Code", "Best Practices", "Readability", "Maintainability"], readTime: 10 },
  { title: "Test-Driven Development: Why and How to Get Started", category: "Software Development", tags: ["TDD", "Testing", "Best Practices", "Software Engineering"], readTime: 11 },
  { title: "Design Patterns in Modern JavaScript and TypeScript", category: "TypeScript", tags: ["Design Patterns", "TypeScript", "JavaScript", "OOP"], readTime: 12 },
  { title: "Code Review Best Practices for Engineering Teams", category: "Software Development", tags: ["Code Review", "Team", "Best Practices", "Collaboration"], readTime: 9 },
  { title: "Building CLI Tools with Node.js: A Complete Guide", category: "Node.js", tags: ["Node.js", "CLI", "Tools", "Automation"], readTime: 10 },

  // Additional AI
  { title: "Building a ChatGPT Clone with LangChain and OpenAI", category: "LangChain", tags: ["LangChain", "ChatGPT", "OpenAI", "AI"], readTime: 14 },
  { title: "Retrieval-Augmented Generation: Advanced Techniques", category: "RAG", tags: ["RAG", "Advanced", "Retrieval", "Generation"], readTime: 13 },
  { title: "AI-Powered Code Generation: Tools and Best Practices", category: "AI Engineering", tags: ["Code Generation", "AI", "Copilot", "Productivity"], readTime: 10 },
  { title: "The Complete MCP Server Implementation Guide", category: "MCP", tags: ["MCP", "Server", "Implementation", "Protocol"], readTime: 15 },
  { title: "Building a Multi-Agent System with LangGraph", category: "LangGraph", tags: ["LangGraph", "Multi-Agent", "AI", "Workflows"], readTime: 14 },

  // Additional Data Science
  { title: "Python for Data Science: NumPy and Pandas Deep Dive", category: "Python", tags: ["Python", "NumPy", "Pandas", "Data Science"], readTime: 11 },
  { title: "Building Recommendation Systems with Python", category: "Machine Learning", tags: ["Recommendation", "Python", "ML", "Collaborative Filtering"], readTime: 13 },
  { title: "Anomaly Detection Techniques for Production Systems", category: "Data Science", tags: ["Anomaly Detection", "Data Science", "ML", "Monitoring"], readTime: 10 },

  // Additional Career
  { title: "Imposter Syndrome in Tech: How to Overcome Self-Doubt", category: "Career", tags: ["Imposter Syndrome", "Mental Health", "Career", "Growth"], readTime: 8 },
  { title: "The First 90 Days: A Guide for New Engineering Managers", category: "Career Growth", tags: ["Engineering Manager", "Leadership", "Management", "Career"], readTime: 12 },
  { title: "How to Get Your First Open Source Contribution", category: "Career Growth", tags: ["Open Source", "Contribution", "GitHub", "Beginner"], readTime: 7 },
  { title: "Side Projects That Will Boost Your Developer Career", category: "Career", tags: ["Side Projects", "Portfolio", "Career", "Growth"], readTime: 9 },
  { title: "Technical Interview Prep: Behavioral Questions Masterclass", category: "Interview Preparation", tags: ["Behavioral", "Interview", "STAR Method", "Preparation"], readTime: 10 },
  { title: "Resume Keywords: What Recruiters Are Looking For in 2026", category: "Resume Tips", tags: ["Resume", "Keywords", "Recruiter", "ATS"], readTime: 8 },
  { title: "The Freelancer's Guide to Setting Rates and Finding Clients", category: "Freelancing", tags: ["Freelancing", "Rates", "Clients", "Business"], readTime: 11 },
  { title: "Remote Work Productivity: Tools and Techniques That Work", category: "Remote Jobs", tags: ["Remote Work", "Productivity", "Tools", "WFH"], readTime: 9 },
  { title: "How to Ace Your System Design Interview", category: "Interview Preparation", tags: ["System Design", "Interview", "Architecture", "Scalability"], readTime: 14 },
  { title: "Career Pivot: Transitioning from Another Field to Tech", category: "Career", tags: ["Career Pivot", "Transition", "Tech", "Career Change"], readTime: 10 },
  { title: "Negotiating Severance and Exit Packages in Tech", category: "Salary Negotiation", tags: ["Severance", "Negotiation", "Exit", "Career"], readTime: 8 },
];

function slugify(text, index) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + `-${Date.now()}-${index}`;
}

const EXCERPTS = [
  "Discover the essential strategies and best practices that top engineers use to build scalable, maintainable systems.",
  "Learn how to navigate the complex landscape of modern technology with actionable insights and expert advice.",
  "A comprehensive deep dive into the most important concepts and techniques shaping the future of software development.",
  "Practical guidance for professionals looking to level up their skills and advance their careers in technology.",
  "Everything you need to know about this critical topic, from fundamentals to advanced implementation strategies.",
  "Expert insights and proven strategies to help you master this domain and stand out in a competitive market.",
  "An in-depth exploration of cutting-edge approaches and methodologies transforming the tech industry today.",
  "Real-world lessons and battle-tested techniques from experienced practitioners who have been in the trenches.",
  "Your complete resource for understanding and implementing best practices in this rapidly evolving field.",
  "Actionable advice and practical examples to help you solve real problems and deliver better results.",
];

export async function seedBlogs() {
  try {
    const existing = await Blog.countDocuments({ status: "published" });
    if (existing > 0) {
      console.log(`✅ ${existing} blogs already exist. Skipping seed.`);
      return;
    }

    let systemUser = await User.findOne({ email: "system@jobpilot.ai" });
    if (!systemUser) {
      systemUser = await User.create({
        fullname: "JobPilot Ai Editorial",
        email: "system@jobpilot.ai",
        password: "system-seed-account-do-not-use",
        profileCompleted: true,
        roles: { jobSeeker: true, recruiter: true },
        currentRole: "recruiter",
        profile: {
          headline: "Career & Technology Blog",
          bio: "JobPilot Ai Editorial Team — expert insights for tech professionals",
          profilePhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        },
      });
      console.log("✅ System author user created.");
    }

    const blogs = blogTemplates.map((t, i) => ({
      title: t.title,
      slug: slugify(t.title, i),
      content: BLOG_CONTENT,
      excerpt: EXCERPTS[i % EXCERPTS.length],
      coverImage: COVER_IMAGES[i % COVER_IMAGES.length],
      author: systemUser._id,
      category: t.category,
      tags: t.tags,
      status: "published",
      featured: i < 3,
      readTime: t.readTime,
      views: Math.floor(Math.random() * 5000) + 100,
      likes: [],
      bookmarks: [],
      comments: [],
      seoTitle: t.title,
      seoDescription: EXCERPTS[i % EXCERPTS.length],
      publishedAt: new Date(Date.now() - i * 3600000 * 4),
      createdAt: new Date(Date.now() - i * 3600000 * 4),
      updatedAt: new Date(Date.now() - i * 3600000 * 2),
    }));

    await Blog.insertMany(blogs);
    console.log(`✅ ${blogs.length} blogs seeded successfully.`);

    const categories = [...new Set(blogs.map((b) => b.category))];
    console.log(`📂 Categories (${categories.length}): ${categories.join(", ")}`);
  } catch (error) {
    console.error("❌ Seed error:", error.message);
  }
}