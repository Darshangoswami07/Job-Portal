import { CareerGuide } from "../models_new/CareerGuide.js";
import { User } from "../models/user.model.js";

const GUIDE_CONTENT = `# Introduction

Welcome to this comprehensive career guide. In today's rapidly evolving technology landscape, staying ahead of the curve is not just an advantage — it's a necessity for long-term career success.

## Why This Matters

The technology industry continues to transform at an unprecedented pace. New frameworks, tools, methodologies, and paradigms emerge constantly, making it essential for professionals to invest in continuous learning and skill development.

### Key Principles for Career Growth

1. **Continuous Learning**: Dedicate time each week to learning new technologies and concepts
2. **Practical Application**: Build real projects that challenge you and demonstrate your skills
3. **Community Engagement**: Share knowledge, contribute to open source, and build your network
4. **Strategic Focus**: Develop depth in key areas that align with market demand

## Core Concepts

### Understanding the Fundamentals

Before diving into advanced topics, ensure you have a solid grasp of the fundamentals:

- **Problem-solving mindset**: Every technical challenge has a solution
- **System design thinking**: Understanding how components interact at scale
- **Performance optimization**: Writing code that not only works but performs efficiently
- **Security awareness**: Building with security considerations from day one

\`\`\`javascript
// Example: A production-ready pattern
const createApiHandler = (config) => {
  const { baseUrl, timeout, retries } = {
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    retries: 3,
    ...config
  };

  return async (endpoint, options = {}) => {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(\`\${baseUrl}\${endpoint}\`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timer);

        if (!response.ok) {
          throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }

    throw lastError;
  };
};
\`\`\`

### Advanced Techniques

Once you've mastered the basics, explore these advanced patterns:

> "The best code is the code that doesn't need to be written." — A wise engineer

| Technique | Benefit | Complexity |
|-----------|---------|------------|
| Caching | 10x performance improvement | Medium |
| Lazy Loading | Faster initial load times | Low |
| Code Splitting | Smaller bundle sizes | Medium |
| Microservices | Independent scaling | High |
| Event Sourcing | Complete audit trail | High |

## Practical Implementation

Here's a step-by-step approach to implementing what you learn:

1. Start with a clear understanding of requirements
2. Design the architecture before writing code
3. Implement incrementally with regular testing
4. Deploy with confidence using CI/CD pipelines
5. Monitor performance and iterate based on feedback

### Common Pitfalls to Avoid

- Premature optimization without data to support decisions
- Over-engineering solutions for simple problems
- Ignoring edge cases in your implementation
- Skipping tests to save time initially
- Not documenting architectural decisions

## Best Practices

### Code Organization

\`\`\`
project/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API and external service calls
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
├── tests/              # Test files
├── docs/               # Documentation
└── scripts/            # Build and deployment scripts
\`\`\`

### Testing Strategy

Implement a comprehensive testing strategy:

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test how components work together
3. **End-to-End Tests**: Test complete user flows
4. **Performance Tests**: Ensure your application meets performance benchmarks

\`\`\`typescript
// Example test pattern
describe('UserAuthentication', () => {
  it('should authenticate valid users', async () => {
    const result = await authenticateUser({
      email: 'test@example.com',
      password: 'securePassword123'
    });
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    await expect(
      authenticateUser({
        email: 'wrong@example.com',
        password: 'wrong'
      })
    ).rejects.toThrow('Invalid credentials');
  });
});
\`\`\`

## Tools and Resources

### Essential Tools

| Tool | Purpose | Alternative |
|------|---------|-------------|
| VS Code | Code editor | WebStorm, Sublime Text |
| Git | Version control | Mercurial, SVN |
| Docker | Containerization | Podman, containerd |
| Postman | API testing | Insomnia, Bruno |
| Figma | Design collaboration | Sketch, Adobe XD |

### Learning Resources

- Official documentation and tutorials
- Online courses (Coursera, Udemy, freeCodeCamp)
- Developer blogs and newsletters
- Open source projects to contribute to
- Tech conferences and meetups

## Conclusion

The journey to mastery is continuous. Every line of code you write, every problem you solve, and every lesson you learn contributes to your growth as a professional. Stay curious, stay humble, and keep building.

---

*This guide was crafted with insights from industry experts and real-world experience. Share your thoughts and questions in the comments below.*`;

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80",
  "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
  "https://images.unsplash.com/photo-1537432376144-e84978a2925d?w=800&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
  "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
  "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
];

const guideTemplates = [
  // === SOFTWARE DEVELOPMENT ===
  { title: "Complete React Guide: From Zero to Production", category: "Software Development", subcategory: "Frontend", tags: ["React", "JavaScript", "Frontend", "Web Development"], level: "beginner", difficulty: 3, readTime: 25, completionTime: 480, featured: true, beginnerFriendly: true },
  { title: "Next.js 15 Roadmap: Full-Stack React Framework Mastery", category: "Software Development", subcategory: "Frontend", tags: ["Next.js", "React", "Full-Stack", "SSR", "App Router"], level: "intermediate", difficulty: 5, readTime: 20, completionTime: 360, featured: true, trending: true },
  { title: "TypeScript Mastery: Advanced Patterns and Best Practices", category: "Software Development", subcategory: "Frontend", tags: ["TypeScript", "JavaScript", "Types", "Generics"], level: "advanced", difficulty: 7, readTime: 22, completionTime: 420, featured: true, trending: true },
  { title: "JavaScript Interview Guide: 100 Questions Explained", category: "Software Development", subcategory: "Frontend", tags: ["JavaScript", "Interview", "Algorithms", "Data Structures"], level: "intermediate", difficulty: 6, readTime: 30, completionTime: 600, trending: true },
  { title: "Modern CSS: Grid, Flexbox, and Beyond", category: "Software Development", subcategory: "Frontend", tags: ["CSS", "Grid", "Flexbox", "Design", "Responsive"], level: "beginner", difficulty: 2, readTime: 15, completionTime: 240, beginnerFriendly: true },
  { title: "Node.js Backend Development: The Complete Guide", category: "Software Development", subcategory: "Backend", tags: ["Node.js", "Express", "Backend", "API", "Server"], level: "intermediate", difficulty: 5, readTime: 28, completionTime: 540 },
  { title: "Python Web Development with Django and FastAPI", category: "Software Development", subcategory: "Backend", tags: ["Python", "Django", "FastAPI", "Backend", "Web"], level: "intermediate", difficulty: 5, readTime: 24, completionTime: 480 },
  { title: "Go Programming: Building High-Performance Backend Services", category: "Software Development", subcategory: "Backend", tags: ["Go", "Golang", "Backend", "Performance", "Concurrency"], level: "advanced", difficulty: 7, readTime: 20, completionTime: 360 },
  { title: "Rust for Systems Programming: A Beginner's Roadmap", category: "Software Development", subcategory: "Backend", tags: ["Rust", "Systems", "Memory Safety", "Performance"], level: "intermediate", difficulty: 8, readTime: 25, completionTime: 480, trending: true },
  { title: "Java 21+ Features: Modern Java Development", category: "Software Development", subcategory: "Backend", tags: ["Java", "JVM", "Spring", "Enterprise"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "Software Architecture Patterns: A Complete Guide", category: "Software Development", subcategory: "Architecture", tags: ["Architecture", "Design Patterns", "SOLID", "Clean Code"], level: "advanced", difficulty: 8, readTime: 30, completionTime: 600, featured: true },
  { title: "Testing Strategies for Modern Applications", category: "Software Development", subcategory: "Testing", tags: ["Testing", "TDD", "Jest", "Cypress", "Unit Tests"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "Git Mastery: Advanced Version Control Techniques", category: "Software Development", subcategory: "Tools", tags: ["Git", "Version Control", "GitHub", "Collaboration"], level: "beginner", difficulty: 3, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "REST API Design Best Practices and Standards", category: "Software Development", subcategory: "Backend", tags: ["REST", "API", "Design", "HTTP", "Best Practices"], level: "intermediate", difficulty: 4, readTime: 16, completionTime: 240 },
  { title: "GraphQL API Development: From Basics to Advanced", category: "Software Development", subcategory: "Backend", tags: ["GraphQL", "API", "Apollo", "Query Language"], level: "intermediate", difficulty: 5, readTime: 20, completionTime: 360, trending: true },
  { title: "Web Performance Optimization: Core Web Vitals Deep Dive", category: "Software Development", subcategory: "Frontend", tags: ["Performance", "Web Vitals", "Lighthouse", "Optimization"], level: "intermediate", difficulty: 5, readTime: 16, completionTime: 240 },
  { title: "Accessible Web Development: a11y Best Practices", category: "Software Development", subcategory: "Frontend", tags: ["Accessibility", "a11y", "Inclusive Design", "WCAG"], level: "beginner", difficulty: 3, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Micro-Frontends Architecture: Scaling Frontend Development", category: "Software Development", subcategory: "Frontend", tags: ["Micro-Frontends", "Architecture", "Module Federation", "Scalability"], level: "advanced", difficulty: 8, readTime: 20, completionTime: 360 },
  { title: "API Security: OAuth, JWT, and Beyond", category: "Software Development", subcategory: "Backend", tags: ["API Security", "OAuth", "JWT", "Authentication", "Authorization"], level: "intermediate", difficulty: 6, readTime: 18, completionTime: 300 },
  { title: "Clean Code: Principles for Maintainable Software", category: "Software Development", subcategory: "Best Practices", tags: ["Clean Code", "Readability", "Maintainability", "Best Practices"], level: "beginner", difficulty: 3, readTime: 12, completionTime: 180, beginnerFriendly: true },

  // === AI & DATA ===
  { title: "AI Engineer Roadmap 2026: Complete Career Guide", category: "AI & Data", subcategory: "AI Engineering", tags: ["AI", "Roadmap", "Career", "2026", "Engineering"], level: "beginner", difficulty: 4, readTime: 35, completionTime: 720, featured: true, trending: true, beginnerFriendly: true },
  { title: "Machine Learning Guide: From Theory to Production", category: "AI & Data", subcategory: "Machine Learning", tags: ["Machine Learning", "ML", "Supervised", "Unsupervised", "Models"], level: "intermediate", difficulty: 6, readTime: 30, completionTime: 600, featured: true },
  { title: "Deep Learning Fundamentals: Neural Networks Explained", category: "AI & Data", subcategory: "Deep Learning", tags: ["Deep Learning", "Neural Networks", "PyTorch", "TensorFlow"], level: "intermediate", difficulty: 7, readTime: 28, completionTime: 540 },
  { title: "Natural Language Processing: Complete Guide with Transformers", category: "AI & Data", subcategory: "NLP", tags: ["NLP", "Transformers", "BERT", "GPT", "Tokenization"], level: "intermediate", difficulty: 6, readTime: 24, completionTime: 480, trending: true },
  { title: "RAG Systems: Building Production-Ready Retrieval Augmented Generation", category: "AI & Data", subcategory: "RAG", tags: ["RAG", "Retrieval", "Generation", "Vector DB", "Embeddings"], level: "advanced", difficulty: 8, readTime: 26, completionTime: 480, featured: true, trending: true },
  { title: "MCP Servers: Model Context Protocol Implementation Guide", category: "AI & Data", subcategory: "MCP", tags: ["MCP", "Protocol", "AI", "Context", "Integration"], level: "advanced", difficulty: 8, readTime: 20, completionTime: 360, trending: true },
  { title: "AI Agents: Building Autonomous Systems with LangGraph", category: "AI & Data", subcategory: "AI Agents", tags: ["AI Agents", "LangGraph", "Autonomous", "Orchestration", "Tools"], level: "advanced", difficulty: 9, readTime: 30, completionTime: 600, featured: true, trending: true },
  { title: "LangChain Framework: Building LLM-Powered Applications", category: "AI & Data", subcategory: "LangChain", tags: ["LangChain", "LLM", "Chains", "Prompts", "Agents"], level: "intermediate", difficulty: 6, readTime: 22, completionTime: 420 },
  { title: "LlamaIndex: Data Framework for LLM Applications", category: "AI & Data", subcategory: "LlamaIndex", tags: ["LlamaIndex", "Indexing", "Retrieval", "LLM", "Data"], level: "intermediate", difficulty: 6, readTime: 18, completionTime: 300 },
  { title: "Vector Databases: Pinecone, Qdrant, Weaviate, FAISS", category: "AI & Data", subcategory: "Vector Search", tags: ["Vector DB", "Pinecone", "Qdrant", "FAISS", "Embeddings"], level: "intermediate", difficulty: 6, readTime: 20, completionTime: 360, trending: true },
  { title: "Prompt Engineering: The Definitive Guide for 2026", category: "AI & Data", subcategory: "Prompt Engineering", tags: ["Prompt Engineering", "GPT", "LLM", "Best Practices", "Chain-of-Thought"], level: "beginner", difficulty: 3, readTime: 18, completionTime: 300, beginnerFriendly: true, trending: true },
  { title: "Generative AI: Creating with Diffusion Models and LLMs", category: "AI & Data", subcategory: "Generative AI", tags: ["Generative AI", "Diffusion", "LLM", "Image Generation", "Text Generation"], level: "intermediate", difficulty: 6, readTime: 22, completionTime: 420 },
  { title: "Computer Vision: From CNNs to Vision Transformers", category: "AI & Data", subcategory: "Computer Vision", tags: ["Computer Vision", "CNN", "ViT", "Object Detection", "Image Segmentation"], level: "advanced", difficulty: 7, readTime: 26, completionTime: 480 },
  { title: "Fine-Tuning LLMs for Domain-Specific Applications", category: "AI & Data", subcategory: "Fine Tuning", tags: ["Fine-Tuning", "LLM", "LoRA", "QLoRA", "Domain Adaptation"], level: "advanced", difficulty: 8, readTime: 22, completionTime: 420 },
  { title: "MLOps: Production ML Systems and Pipelines", category: "AI & Data", subcategory: "MLOps", tags: ["MLOps", "Pipeline", "Deployment", "Monitoring", "MLflow"], level: "advanced", difficulty: 8, readTime: 24, completionTime: 480, featured: true },
  { title: "AI System Design: Architecting Intelligent Applications", category: "AI & Data", subcategory: "AI Engineering", tags: ["System Design", "AI", "Architecture", "Scalability", "Intelligent Systems"], level: "advanced", difficulty: 9, readTime: 28, completionTime: 540, trending: true },
  { title: "AI Deployment: Taking Models to Production", category: "AI & Data", subcategory: "AI Deployment", tags: ["Deployment", "Serving", "Containerization", "API", "Scaling"], level: "intermediate", difficulty: 6, readTime: 20, completionTime: 360 },
  { title: "Production AI: Building Reliable AI Systems", category: "AI & Data", subcategory: "AI Engineering", tags: ["Production", "Reliability", "Monitoring", "Observability", "AI"], level: "advanced", difficulty: 8, readTime: 22, completionTime: 420 },
  { title: "Complete Python for AI: NumPy, Pandas, and Beyond", category: "AI & Data", subcategory: "Python", tags: ["Python", "NumPy", "Pandas", "Data Science", "AI"], level: "beginner", difficulty: 3, readTime: 20, completionTime: 360, beginnerFriendly: true },
  { title: "Statistics for Machine Learning: Essential Concepts", category: "AI & Data", subcategory: "Statistics", tags: ["Statistics", "Probability", "Hypothesis Testing", "Bayesian", "ML"], level: "intermediate", difficulty: 6, readTime: 18, completionTime: 300 },
  { title: "HuggingFace Ecosystem: Models, Datasets, and Spaces", category: "AI & Data", subcategory: "HuggingFace", tags: ["HuggingFace", "Transformers", "Datasets", "Spaces", "Models"], level: "intermediate", difficulty: 5, readTime: 16, completionTime: 240 },
  { title: "OpenAI APIs: GPT-4, Assistants, and Function Calling", category: "AI & Data", subcategory: "OpenAI", tags: ["OpenAI", "GPT-4", "API", "Assistants", "Function Calling"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300, trending: true },
  { title: "Gemini APIs: Building with Google's Multimodal AI", category: "AI & Data", subcategory: "Gemini", tags: ["Gemini", "Google", "Multimodal", "API", "AI"], level: "intermediate", difficulty: 5, readTime: 16, completionTime: 240 },
  { title: "Claude APIs: Building with Anthropic's Claude", category: "AI & Data", subcategory: "Claude", tags: ["Claude", "Anthropic", "API", "AI", "Safety"], level: "intermediate", difficulty: 5, readTime: 16, completionTime: 240 },
  { title: "Data Engineering: Building Robust Data Pipelines", category: "AI & Data", subcategory: "Data Engineering", tags: ["Data Engineering", "ETL", "Data Pipelines", "Spark", "Kafka"], level: "intermediate", difficulty: 6, readTime: 22, completionTime: 420 },

  // === CLOUD & DEVOPS ===
  { title: "AWS Certification Guide: Complete Path for 2026", category: "Cloud & DevOps", subcategory: "AWS", tags: ["AWS", "Certification", "Cloud", "Solutions Architect", "Developer"], level: "beginner", difficulty: 4, readTime: 20, completionTime: 360, beginnerFriendly: true },
  { title: "Azure Cloud: Building Enterprise-Grade Solutions", category: "Cloud & DevOps", subcategory: "Azure", tags: ["Azure", "Microsoft", "Cloud", "Enterprise", "DevOps"], level: "intermediate", difficulty: 5, readTime: 22, completionTime: 420 },
  { title: "Google Cloud Platform: GCP Services Deep Dive", category: "Cloud & DevOps", subcategory: "GCP", tags: ["GCP", "Google Cloud", "Compute", "Storage", "Serverless"], level: "intermediate", difficulty: 5, readTime: 20, completionTime: 360 },
  { title: "Docker Complete Guide: From Development to Production", category: "Cloud & DevOps", subcategory: "Docker", tags: ["Docker", "Containers", "Images", "Docker Compose", "Dockerfile"], level: "beginner", difficulty: 3, readTime: 22, completionTime: 420, beginnerFriendly: true },
  { title: "Kubernetes: Orchestrating Containers at Scale", category: "Cloud & DevOps", subcategory: "Kubernetes", tags: ["Kubernetes", "K8s", "Orchestration", "Pods", "Services"], level: "intermediate", difficulty: 7, readTime: 30, completionTime: 600, featured: true },
  { title: "Terraform: Infrastructure as Code Mastery", category: "Cloud & DevOps", subcategory: "Terraform", tags: ["Terraform", "IaC", "Infrastructure", "HCL", "State"], level: "intermediate", difficulty: 6, readTime: 22, completionTime: 420 },
  { title: "CI/CD Pipeline Design: From Zero to Production", category: "Cloud & DevOps", subcategory: "CI/CD", tags: ["CI/CD", "GitHub Actions", "GitLab CI", "Jenkins", "Pipeline"], level: "intermediate", difficulty: 5, readTime: 20, completionTime: 360 },
  { title: "DevOps Culture and Practices: The Complete Guide", category: "Cloud & DevOps", subcategory: "DevOps", tags: ["DevOps", "Culture", "Automation", "Monitoring", "Incidents"], level: "beginner", difficulty: 3, readTime: 18, completionTime: 300, beginnerFriendly: true },
  { title: "Kubernetes Security: RBAC, Pod Security, and Network Policies", category: "Cloud & DevOps", subcategory: "Kubernetes", tags: ["Kubernetes", "Security", "RBAC", "Pod Security", "Network"], level: "advanced", difficulty: 8, readTime: 22, completionTime: 420 },
  { title: "Serverless Architecture: AWS Lambda and Beyond", category: "Cloud & DevOps", subcategory: "Serverless", tags: ["Serverless", "Lambda", "Event-Driven", "Cloud", "Architecture"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "Monitoring and Observability: Prometheus, Grafana, and ELK", category: "Cloud & DevOps", subcategory: "DevOps", tags: ["Monitoring", "Observability", "Prometheus", "Grafana", "ELK Stack"], level: "intermediate", difficulty: 6, readTime: 22, completionTime: 420 },
  { title: "Helm Charts: Kubernetes Package Management", category: "Cloud & DevOps", subcategory: "Kubernetes", tags: ["Helm", "Charts", "Kubernetes", "Package Manager", "Templates"], level: "intermediate", difficulty: 5, readTime: 16, completionTime: 240 },
  { title: "Cloud Security Best Practices: Zero Trust Architecture", category: "Cloud & DevOps", subcategory: "Cloud Security", tags: ["Cloud Security", "Zero Trust", "IAM", "Encryption", "Compliance"], level: "advanced", difficulty: 7, readTime: 22, completionTime: 420 },
  { title: "GitOps: Modern Deployment with ArgoCD and Flux", category: "Cloud & DevOps", subcategory: "GitOps", tags: ["GitOps", "ArgoCD", "Flux", "Deployment", "Kubernetes"], level: "intermediate", difficulty: 6, readTime: 18, completionTime: 300, trending: true },
  { title: "Docker Compose for Development Environments", category: "Cloud & DevOps", subcategory: "Docker", tags: ["Docker Compose", "Development", "Multi-Container", "Local"], level: "beginner", difficulty: 3, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "AWS ECS and Fargate: Container Orchestration on AWS", category: "Cloud & DevOps", subcategory: "AWS", tags: ["AWS", "ECS", "Fargate", "Containers", "Orchestration"], level: "intermediate", difficulty: 5, readTime: 20, completionTime: 360 },
  { title: "Cloud Cost Optimization: Saving Money on AWS, Azure, GCP", category: "Cloud & DevOps", subcategory: "Cloud", tags: ["Cost", "Optimization", "AWS", "Azure", "GCP"], level: "intermediate", difficulty: 4, readTime: 16, completionTime: 240 },
  { title: "Platform Engineering: Building Internal Developer Platforms", category: "Cloud & DevOps", subcategory: "DevOps", tags: ["Platform Engineering", "IDP", "Developer Experience", "Backstage"], level: "advanced", difficulty: 7, readTime: 24, completionTime: 480, trending: true },

  // === CAREER ===
  { title: "Resume Writing: The Ultimate Guide for Tech Professionals", category: "Career", subcategory: "Resume Writing", tags: ["Resume", "Writing", "Tech", "Job Search", "Career"], level: "beginner", difficulty: 2, readTime: 16, completionTime: 240, beginnerFriendly: true, featured: true },
  { title: "ATS Optimization: How to Beat Automated Resume Screeners", category: "Career", subcategory: "ATS Optimization", tags: ["ATS", "Resume", "Automated", "Keywords", "Formatting"], level: "intermediate", difficulty: 4, readTime: 14, completionTime: 200, trending: true },
  { title: "Salary Negotiation: Step-by-Step Guide for Tech Roles", category: "Career", subcategory: "Salary Negotiation", tags: ["Salary", "Negotiation", "Compensation", "Equity", "Offer"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300, trending: true },
  { title: "LinkedIn Optimization: Building a Profile That Gets Noticed", category: "Career", subcategory: "LinkedIn Optimization", tags: ["LinkedIn", "Profile", "Networking", "Personal Brand", "Recruiters"], level: "beginner", difficulty: 2, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Remote Jobs: Finding and Thriving in Remote Work", category: "Career", subcategory: "Remote Jobs", tags: ["Remote", "WFH", "Remote Work", "Productivity", "Distributed"], level: "beginner", difficulty: 2, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Freelancing Guide: Building a Successful Independent Career", category: "Career", subcategory: "Freelancing", tags: ["Freelancing", "Contract", "Self-Employed", "Clients", "Rates"], level: "intermediate", difficulty: 4, readTime: 20, completionTime: 360 },
  { title: "Portfolio Guide: Building a Developer Portfolio That Stands Out", category: "Career", subcategory: "Portfolio", tags: ["Portfolio", "GitHub", "Projects", "Showcase", "Personal Website"], level: "beginner", difficulty: 2, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Networking in Tech: Building Meaningful Professional Connections", category: "Career", subcategory: "Networking", tags: ["Networking", "Community", "Meetups", "Conferences", "Mentorship"], level: "beginner", difficulty: 2, readTime: 12, completionTime: 180, beginnerFriendly: true },
  { title: "Frontend Interview Preparation: Complete Guide", category: "Career", subcategory: "Interview Preparation", tags: ["Interview", "Frontend", "React", "CSS", "JavaScript"], level: "intermediate", difficulty: 6, readTime: 25, completionTime: 480, featured: true },
  { title: "Backend Interview Preparation: System Design and Algorithms", category: "Career", subcategory: "Interview Preparation", tags: ["Interview", "Backend", "System Design", "Algorithms", "Databases"], level: "advanced", difficulty: 7, readTime: 28, completionTime: 540 },
  { title: "AI Engineer Interview Preparation: ML System Design", category: "Career", subcategory: "Interview Preparation", tags: ["Interview", "AI", "Engineer", "ML System Design", "Research"], level: "advanced", difficulty: 8, readTime: 26, completionTime: 480, trending: true },
  { title: "DevOps Interview Preparation: CI/CD, Cloud, and SRE", category: "Career", subcategory: "Interview Preparation", tags: ["Interview", "DevOps", "CI/CD", "Cloud", "SRE"], level: "intermediate", difficulty: 6, readTime: 22, completionTime: 420 },
  { title: "HR Interview Guide: Behavioral Questions and STAR Method", category: "Career", subcategory: "Interview Preparation", tags: ["HR", "Behavioral", "STAR", "Soft Skills", "Cultural Fit"], level: "beginner", difficulty: 2, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Behavioral Interviews: Tell Me About a Time When...", category: "Career", subcategory: "Interview Preparation", tags: ["Behavioral", "Interview", "Storytelling", "Leadership", "Teamwork"], level: "beginner", difficulty: 3, readTime: 16, completionTime: 240, beginnerFriendly: true },
  { title: "Leadership in Tech: From Engineer to Engineering Manager", category: "Career", subcategory: "Leadership", tags: ["Leadership", "Engineering Manager", "Management", "Team Lead", "Career Growth"], level: "intermediate", difficulty: 5, readTime: 22, completionTime: 420, featured: true },
  { title: "Career Growth Strategies for Software Engineers", category: "Career", subcategory: "Career Growth", tags: ["Career Growth", "Promotion", "Skills", "Senior", "Staff"], level: "intermediate", difficulty: 4, readTime: 18, completionTime: 300 },
  { title: "Technical Writing: A Career Path Worth Exploring", category: "Career", subcategory: "Career Growth", tags: ["Technical Writing", "Documentation", "Communication", "Career", "Writing"], level: "beginner", difficulty: 2, readTime: 12, completionTime: 180, beginnerFriendly: true },
  { title: "Imposter Syndrome in Tech: Overcoming Self-Doubt", category: "Career", subcategory: "Career Growth", tags: ["Imposter Syndrome", "Mental Health", "Confidence", "Growth", "Mindset"], level: "beginner", difficulty: 1, readTime: 10, completionTime: 120, beginnerFriendly: true },
  { title: "Side Projects That Boost Your Developer Career", category: "Career", subcategory: "Career Growth", tags: ["Side Projects", "Open Source", "Portfolio", "Learning", "Growth"], level: "beginner", difficulty: 2, readTime: 12, completionTime: 180, beginnerFriendly: true },
  { title: "Career Pivot: Transitioning to Tech from Another Field", category: "Career", subcategory: "Career Growth", tags: ["Career Pivot", "Transition", "Career Change", "Bootcamp", "Self-Taught"], level: "beginner", difficulty: 2, readTime: 16, completionTime: 240, beginnerFriendly: true },
  { title: "Personal Branding for Developers: Standing Out in Tech", category: "Career", subcategory: "Personal Branding", tags: ["Personal Brand", "Social Media", "Twitter", "LinkedIn", "Blogging"], level: "beginner", difficulty: 2, readTime: 14, completionTime: 200, beginnerFriendly: true },

  // === PRODUCT & SYSTEM DESIGN ===
  { title: "Product Management: The Complete Guide for Aspiring PMs", category: "Product & Design", subcategory: "Product Management", tags: ["Product Management", "PM", "Roadmap", "Strategy", "Stakeholders"], level: "beginner", difficulty: 3, readTime: 22, completionTime: 420, beginnerFriendly: true },
  { title: "Agile Methodologies: Scrum, Kanban, and Beyond", category: "Product & Design", subcategory: "Agile", tags: ["Agile", "Scrum", "Kanban", "Sprint", "Standup"], level: "beginner", difficulty: 3, readTime: 16, completionTime: 240, beginnerFriendly: true },
  { title: "Scrum Master: Facilitating High-Performing Teams", category: "Product & Design", subcategory: "Scrum", tags: ["Scrum", "Facilitation", "Retrospective", "Sprint Planning", "Team"], level: "intermediate", difficulty: 4, readTime: 18, completionTime: 300 },
  { title: "UI/UX Design Principles for Developers", category: "Product & Design", subcategory: "Design", tags: ["UI", "UX", "Design", "User Research", "Prototyping"], level: "beginner", difficulty: 3, readTime: 16, completionTime: 240, beginnerFriendly: true },
  { title: "Design Thinking: A Human-Centered Approach to Product Design", category: "Product & Design", subcategory: "Design", tags: ["Design Thinking", "Empathy", "Prototyping", "Ideation", "User-Centered"], level: "beginner", difficulty: 3, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "System Design: The Complete Interview Guide", category: "System Design", subcategory: "System Design", tags: ["System Design", "Scalability", "Architecture", "Distributed Systems", "Interview"], level: "advanced", difficulty: 8, readTime: 30, completionTime: 600, featured: true, trending: true },
  { title: "Scalability Patterns: Building Systems That Scale", category: "System Design", subcategory: "Scalability", tags: ["Scalability", "Horizontal Scaling", "Vertical Scaling", "Load", "Performance"], level: "advanced", difficulty: 8, readTime: 24, completionTime: 480 },
  { title: "Load Balancing: Algorithms, Strategies, and Best Practices", category: "System Design", subcategory: "Load Balancing", tags: ["Load Balancing", "NGINX", "HAProxy", "Round Robin", "Consistent Hashing"], level: "intermediate", difficulty: 6, readTime: 18, completionTime: 300 },
  { title: "Microservices Architecture: Patterns, Anti-Patterns, and Best Practices", category: "System Design", subcategory: "Microservices", tags: ["Microservices", "Architecture", "Service Mesh", "API Gateway", "Event-Driven"], level: "advanced", difficulty: 8, readTime: 28, completionTime: 540, featured: true },
  { title: "Caching Strategies: Redis, CDN, and Application Caching", category: "System Design", subcategory: "Caching", tags: ["Caching", "Redis", "CDN", "Memcached", "Performance"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "Database Design: SQL, NoSQL, and NewSQL Patterns", category: "System Design", subcategory: "Databases", tags: ["Databases", "SQL", "NoSQL", "PostgreSQL", "MongoDB", "Design"], level: "intermediate", difficulty: 6, readTime: 22, completionTime: 420 },
  { title: "Distributed Systems: Consistency, Availability, and Partition Tolerance", category: "System Design", subcategory: "Distributed Systems", tags: ["Distributed Systems", "CAP Theorem", "Consistency", "Replication", "Partitioning"], level: "advanced", difficulty: 9, readTime: 26, completionTime: 480 },
  { title: "Event-Driven Architecture: Kafka, RabbitMQ, and Message Queues", category: "System Design", subcategory: "Architecture", tags: ["Event-Driven", "Kafka", "RabbitMQ", "Message Queue", "Streaming"], level: "advanced", difficulty: 7, readTime: 22, completionTime: 420 },
  { title: "API Gateway Pattern: Centralized API Management", category: "System Design", subcategory: "Architecture", tags: ["API Gateway", "Microservices", "Security", "Rate Limiting", "Routing"], level: "intermediate", difficulty: 5, readTime: 16, completionTime: 240 },

  // === DATA STRUCTURES & ALGORITHMS ===
  { title: "Arrays and Strings: The Foundation of DSA", category: "DSA", subcategory: "Arrays", tags: ["Arrays", "Strings", "Two Pointers", "Sliding Window", "Algorithms"], level: "beginner", difficulty: 3, readTime: 20, completionTime: 360, beginnerFriendly: true },
  { title: "Linked Lists: Types, Operations, and Common Problems", category: "DSA", subcategory: "Linked Lists", tags: ["Linked Lists", "Singly", "Doubly", "Circular", "Pointers"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "Trees: Binary Trees, BSTs, and Tree Traversals", category: "DSA", subcategory: "Trees", tags: ["Trees", "Binary Tree", "BST", "Traversal", "Recursion"], level: "intermediate", difficulty: 6, readTime: 22, completionTime: 420 },
  { title: "Graphs: BFS, DFS, and Advanced Graph Algorithms", category: "DSA", subcategory: "Graphs", tags: ["Graphs", "BFS", "DFS", "Dijkstra", "Topological Sort"], level: "advanced", difficulty: 8, readTime: 26, completionTime: 480, trending: true },
  { title: "Dynamic Programming: From Basics to Advanced", category: "DSA", subcategory: "Dynamic Programming", tags: ["Dynamic Programming", "Memoization", "Tabulation", "Optimization", "Algorithms"], level: "advanced", difficulty: 9, readTime: 30, completionTime: 600, featured: true },
  { title: "Sorting Algorithms: A Complete Guide with Complexity Analysis", category: "DSA", subcategory: "Sorting", tags: ["Sorting", "QuickSort", "MergeSort", "HeapSort", "Complexity"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "Searching Algorithms: Binary Search and Beyond", category: "DSA", subcategory: "Searching", tags: ["Searching", "Binary Search", "Linear Search", "Search Space", "Algorithms"], level: "beginner", difficulty: 3, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Hash Tables: Design, Implementation, and Use Cases", category: "DSA", subcategory: "Hashing", tags: ["Hash Tables", "Hashing", "Collision Resolution", "HashMap", "HashSet"], level: "intermediate", difficulty: 5, readTime: 16, completionTime: 240 },
  { title: "Recursion and Backtracking: Problem-Solving Patterns", category: "DSA", subcategory: "Recursion", tags: ["Recursion", "Backtracking", "Divide and Conquer", "Recursive Thinking"], level: "intermediate", difficulty: 7, readTime: 20, completionTime: 360 },
  { title: "Greedy Algorithms: When Being Selfish Is Optimal", category: "DSA", subcategory: "Greedy", tags: ["Greedy", "Optimization", "Interval Scheduling", "Coin Change", "Algorithms"], level: "intermediate", difficulty: 6, readTime: 16, completionTime: 240 },
  { title: "System Design for DSA: LeetCode-Style Problem Solving", category: "DSA", subcategory: "Problem Solving", tags: ["LeetCode", "Problem Solving", "Patterns", "Interview Prep", "Algorithms"], level: "intermediate", difficulty: 6, readTime: 24, completionTime: 480, trending: true },
  { title: "Bit Manipulation: Tricks and Techniques for Coding Interviews", category: "DSA", subcategory: "Bit Manipulation", tags: ["Bit Manipulation", "Bits", "XOR", "Shifts", "Optimization"], level: "advanced", difficulty: 7, readTime: 16, completionTime: 240 },

  // === Additional AI Engineer 2026 Deep Dives ===
  { title: "LangGraph: Building Multi-Agent Workflows", category: "AI & Data", subcategory: "LangGraph", tags: ["LangGraph", "Multi-Agent", "State Machines", "Workflows", "Orchestration"], level: "advanced", difficulty: 8, readTime: 24, completionTime: 480, trending: true },
  { title: "LangGraph: Conditional Branching and Human-in-the-Loop", category: "AI & Data", subcategory: "LangGraph", tags: ["LangGraph", "Branching", "Human-in-the-Loop", "Approval", "Interrupt"], level: "advanced", difficulty: 9, readTime: 20, completionTime: 360 },
  { title: "AI Safety: Building Responsible AI Systems", category: "AI & Data", subcategory: "AI Engineering", tags: ["AI Safety", "Alignment", "Responsible AI", "Bias", "Red Teaming"], level: "advanced", difficulty: 7, readTime: 22, completionTime: 420 },
  { title: "OpenAI Assistants API: Building Custom AI Assistants", category: "AI & Data", subcategory: "OpenAI", tags: ["OpenAI", "Assistants", "GPT-4", "Tools", "Knowledge Retrieval"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300, trending: true },
  { title: "Multimodal AI: Working with Text, Images, and Audio", category: "AI & Data", subcategory: "Multimodal", tags: ["Multimodal", "Vision", "Audio", "CLIP", "Whisper"], level: "advanced", difficulty: 7, readTime: 22, completionTime: 420 },

  // === Additional Software Development ===
  { title: "React State Management: Context, Redux, Zustand, and Signals", category: "Software Development", subcategory: "Frontend", tags: ["React", "State Management", "Redux", "Zustand", "Context"], level: "intermediate", difficulty: 5, readTime: 20, completionTime: 360 },
  { title: "React Server Components: Deep Dive into RSC Architecture", category: "Software Development", subcategory: "Frontend", tags: ["React", "Server Components", "RSC", "Suspense", "Streaming"], level: "advanced", difficulty: 7, readTime: 22, completionTime: 420, trending: true },
  { title: "WebSockets and Real-Time Communication: A Complete Guide", category: "Software Development", subcategory: "Frontend", tags: ["WebSockets", "Real-Time", "Socket.io", "SSE", "Push"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "Building CLI Tools with Node.js", category: "Software Development", subcategory: "Tools", tags: ["CLI", "Node.js", "Commands", "Automation", "Developer Tools"], level: "intermediate", difficulty: 4, readTime: 14, completionTime: 200 },
  { title: "Design Patterns in TypeScript: Modern Implementation Guide", category: "Software Development", subcategory: "Best Practices", tags: ["Design Patterns", "TypeScript", "Singleton", "Factory", "Observer"], level: "intermediate", difficulty: 6, readTime: 20, completionTime: 360 },
  { title: "Code Review Best Practices: Giving and Receiving Feedback", category: "Software Development", subcategory: "Best Practices", tags: ["Code Review", "Feedback", "Collaboration", "Best Practices", "Team"], level: "beginner", difficulty: 2, readTime: 12, completionTime: 180, beginnerFriendly: true },
  { title: "Docker for Developers: Beyond the Basics", category: "Cloud & DevOps", subcategory: "Docker", tags: ["Docker", "Multistage", "Optimization", "Networking", "Volumes"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "Database Indexing: A Complete Performance Guide", category: "System Design", subcategory: "Databases", tags: ["Database", "Indexing", "Performance", "B-Tree", "Query Optimization"], level: "intermediate", difficulty: 6, readTime: 18, completionTime: 300 },

  // === More Career ===
  { title: "First 90 Days as a Software Engineer: A Success Guide", category: "Career", subcategory: "Career Growth", tags: ["First Job", "Onboarding", "Junior", "Success", "New Grad"], level: "beginner", difficulty: 2, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Writing a Tech Resume That Gets You Past Recruiters", category: "Career", subcategory: "Resume Writing", tags: ["Resume", "Recruiter", "ATS", "Keywords", "Format"], level: "beginner", difficulty: 2, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Tech Interview Prep: Top Behavioral Questions and Answers", category: "Career", subcategory: "Interview Preparation", tags: ["Behavioral", "STAR", "Tell Me About Yourself", "Strengths", "Weaknesses"], level: "beginner", difficulty: 2, readTime: 16, completionTime: 240, beginnerFriendly: true },
  { title: "Negotiating Your First Tech Offer: A Complete Script", category: "Career", subcategory: "Salary Negotiation", tags: ["Negotiation", "Offer", "Salary", "Equity", "Benefits"], level: "beginner", difficulty: 3, readTime: 18, completionTime: 300 },
  { title: "Building a Tech Network: LinkedIn, Twitter, and Communities", category: "Career", subcategory: "Networking", tags: ["Networking", "LinkedIn", "Twitter", "Discord", "Community"], level: "beginner", difficulty: 1, readTime: 12, completionTime: 180, beginnerFriendly: true },

  // === More AI ===
  { title: "Qdrant Vector Database: Advanced Search and Filtering", category: "AI & Data", subcategory: "Vector Search", tags: ["Qdrant", "Vector DB", "Semantic Search", "Filtering", "Scalability"], level: "advanced", difficulty: 7, readTime: 20, completionTime: 360 },
  { title: "Pinecone Serverless: Vector Search at Scale", category: "AI & Data", subcategory: "Vector Search", tags: ["Pinecone", "Serverless", "Vector Search", "Indexing", "Cloud"], level: "intermediate", difficulty: 5, readTime: 16, completionTime: 240 },
  { title: "FAISS: Facebook's Vector Search Library Deep Dive", category: "AI & Data", subcategory: "Vector Search", tags: ["FAISS", "Vector Search", "Similarity", "Indexing", "GPU"], level: "advanced", difficulty: 8, readTime: 22, completionTime: 420 },
  { title: "Embeddings: From Word2Vec to Modern Text Embeddings", category: "AI & Data", subcategory: "Vector Search", tags: ["Embeddings", "Word2Vec", "Sentence Transformers", "OpenAI", "Text"], level: "intermediate", difficulty: 6, readTime: 20, completionTime: 360 },
  { title: "Azure AI Services: Building Enterprise AI Solutions", category: "Cloud & DevOps", subcategory: "Azure", tags: ["Azure", "AI", "Cognitive Services", "Azure OpenAI", "Enterprise"], level: "intermediate", difficulty: 5, readTime: 20, completionTime: 360 },

  // === More DSA ===
  { title: "Two Pointers Technique: Solving Array Problems Efficiently", category: "DSA", subcategory: "Arrays", tags: ["Two Pointers", "Arrays", "Optimization", "In-Place", "Algorithms"], level: "intermediate", difficulty: 5, readTime: 14, completionTime: 200 },
  { title: "Sliding Window: A Comprehensive Guide with Examples", category: "DSA", subcategory: "Arrays", tags: ["Sliding Window", "Subarrays", "Fixed Window", "Variable Window", "Optimization"], level: "intermediate", difficulty: 5, readTime: 16, completionTime: 240 },
  { title: "Stack and Queue: Implementation and Common Problems", category: "DSA", subcategory: "Stacks & Queues", tags: ["Stack", "Queue", "Monotonic Stack", "Deque", "LIFO"], level: "intermediate", difficulty: 4, readTime: 14, completionTime: 200 },
  { title: "Binary Search Trees: Operations, Balancing, and Traversals", category: "DSA", subcategory: "Trees", tags: ["BST", "Binary Search Tree", "AVL", "Red-Black", "Traversal"], level: "intermediate", difficulty: 6, readTime: 18, completionTime: 300 },
  { title: "Heap Data Structure: Priority Queues and Heap Sort", category: "DSA", subcategory: "Heaps", tags: ["Heap", "Priority Queue", "Heap Sort", "Min Heap", "Max Heap"], level: "intermediate", difficulty: 5, readTime: 14, completionTime: 200 },
  { title: "Trie Data Structure: Autocomplete and Spell Check", category: "DSA", subcategory: "Trees", tags: ["Trie", "Prefix Tree", "Autocomplete", "Spell Check", "Search"], level: "intermediate", difficulty: 5, readTime: 14, completionTime: 200 },
  { title: "Union-Find (Disjoint Set): Applications and Implementation", category: "DSA", subcategory: "Graphs", tags: ["Union-Find", "Disjoint Set", "Graph", "Connectivity", "Kruskal"], level: "intermediate", difficulty: 5, readTime: 14, completionTime: 200 },
  { title: "Topological Sort: Ordering Tasks and Dependencies", category: "DSA", subcategory: "Graphs", tags: ["Topological Sort", "DAG", "Dependencies", "Kahn's Algorithm", "DFS"], level: "intermediate", difficulty: 6, readTime: 14, completionTime: 200 },
  { title: "Shortest Path Algorithms: Dijkstra, Bellman-Ford, Floyd-Warshall", category: "DSA", subcategory: "Graphs", tags: ["Shortest Path", "Dijkstra", "Bellman-Ford", "Floyd-Warshall", "Graphs"], level: "advanced", difficulty: 7, readTime: 20, completionTime: 360 },
  { title: "Minimum Spanning Trees: Kruskal and Prim Algorithms", category: "DSA", subcategory: "Graphs", tags: ["MST", "Kruskal", "Prim", "Union-Find", "Graph Algos"], level: "advanced", difficulty: 7, readTime: 16, completionTime: 240 },

  // === More Cloud & DevOps ===
  { title: "Service Mesh: Istio, Linkerd, and Consul Comparison", category: "Cloud & DevOps", subcategory: "Service Mesh", tags: ["Service Mesh", "Istio", "Linkerd", "Consul", "Microservices"], level: "advanced", difficulty: 8, readTime: 22, completionTime: 420 },
  { title: "Chaos Engineering: Building Resilient Systems", category: "Cloud & DevOps", subcategory: "DevOps", tags: ["Chaos Engineering", "Resilience", "Chaos Monkey", "Litmus", "Testing"], level: "advanced", difficulty: 7, readTime: 18, completionTime: 300 },
  { title: "GitHub Actions: Advanced CI/CD Workflows", category: "Cloud & DevOps", subcategory: "CI/CD", tags: ["GitHub Actions", "Workflows", "CI/CD", "Actions", "Automation"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "AWS VPC Design: Networking on the Cloud", category: "Cloud & DevOps", subcategory: "AWS", tags: ["AWS", "VPC", "Networking", "Subnets", "Security Groups"], level: "intermediate", difficulty: 6, readTime: 20, completionTime: 360 },
  { title: "Kubernetes Operators: Extending Kubernetes with Custom Controllers", category: "Cloud & DevOps", subcategory: "Kubernetes", tags: ["Kubernetes", "Operators", "Controllers", "CRD", "Custom Resources"], level: "advanced", difficulty: 9, readTime: 24, completionTime: 480 },

  // === More Product & Design ===
  { title: "Product Roadmap: From Vision to Execution", category: "Product & Design", subcategory: "Product Management", tags: ["Roadmap", "Strategy", "Prioritization", "OKRs", "Execution"], level: "intermediate", difficulty: 4, readTime: 18, completionTime: 300 },
  { title: "User Research Methods for Better Product Decisions", category: "Product & Design", subcategory: "Design", tags: ["User Research", "Interviews", "Surveys", "Usability Testing", "Analytics"], level: "beginner", difficulty: 3, readTime: 16, completionTime: 240, beginnerFriendly: true },
  { title: "A/B Testing: Data-Driven Product Decisions", category: "Product & Design", subcategory: "Product Management", tags: ["A/B Testing", "Experimentation", "Conversion", "Data-Driven", "Metrics"], level: "intermediate", difficulty: 5, readTime: 16, completionTime: 240 },
  { title: "OKR Framework: Setting and Achieving Ambitious Goals", category: "Product & Design", subcategory: "Product Management", tags: ["OKRs", "Goals", "Objectives", "Key Results", "Framework"], level: "beginner", difficulty: 3, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Stakeholder Management: Communicating with Impact", category: "Product & Design", subcategory: "Product Management", tags: ["Stakeholders", "Communication", "Alignment", "Executives", "Cross-Functional"], level: "intermediate", difficulty: 4, readTime: 16, completionTime: 240 },

  // === More System Design ===
  { title: "Designing URL Shortener: A System Design Case Study", category: "System Design", subcategory: "System Design", tags: ["System Design", "URL Shortener", "Scalability", "Database", "Cache"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "Designing WhatsApp: Real-Time Messaging at Scale", category: "System Design", subcategory: "System Design", tags: ["System Design", "Messaging", "Real-Time", "WhatsApp", "Scalability"], level: "advanced", difficulty: 8, readTime: 24, completionTime: 480 },
  { title: "Designing Netflix: Video Streaming Architecture", category: "System Design", subcategory: "System Design", tags: ["System Design", "Netflix", "Streaming", "CDN", "Recommendation"], level: "advanced", difficulty: 8, readTime: 26, completionTime: 480 },
  { title: "Designing Uber: Ride-Hailing System Architecture", category: "System Design", subcategory: "System Design", tags: ["System Design", "Uber", "Location", "Matching", "Dispatch"], level: "advanced", difficulty: 8, readTime: 24, completionTime: 480 },
  { title: "Designing Amazon: E-Commerce Platform Architecture", category: "System Design", subcategory: "System Design", tags: ["System Design", "E-Commerce", "Amazon", "Catalog", "Order"], level: "advanced", difficulty: 9, readTime: 28, completionTime: 540 },
  { title: "Designing Twitter: Social Media Feed at Scale", category: "System Design", subcategory: "System Design", tags: ["System Design", "Twitter", "Feed", "Timeline", "Fan-Out"], level: "advanced", difficulty: 7, readTime: 22, completionTime: 420 },
  { title: "Designing YouTube: Video Sharing Platform", category: "System Design", subcategory: "System Design", tags: ["System Design", "YouTube", "Video", "Transcoding", "Storage"], level: "advanced", difficulty: 8, readTime: 24, completionTime: 480 },
  { title: "Designing a CDN: Content Delivery Networks", category: "System Design", subcategory: "System Design", tags: ["CDN", "Content Delivery", "Edge", "Caching", "Latency"], level: "advanced", difficulty: 7, readTime: 20, completionTime: 360 },
  { title: "Designing a Chat System: WebSocket Architecture", category: "System Design", subcategory: "System Design", tags: ["Chat", "WebSocket", "Real-Time", "Persistence", "Architecture"], level: "intermediate", difficulty: 6, readTime: 18, completionTime: 300 },
  { title: "Designing a Rate Limiter: Throttling at Scale", category: "System Design", subcategory: "System Design", tags: ["Rate Limiter", "Throttling", "API", "Scalability", "Redis"], level: "intermediate", difficulty: 6, readTime: 16, completionTime: 240 },

  // === Additional Software Development ===
  { title: "WebAssembly: Running High-Performance Code in the Browser", category: "Software Development", subcategory: "Frontend", tags: ["WebAssembly", "Wasm", "Performance", "Browser", "Rust"], level: "advanced", difficulty: 8, readTime: 20, completionTime: 360, trending: true },
  { title: "Progressive Web Apps: Building Installable Experiences", category: "Software Development", subcategory: "Frontend", tags: ["PWA", "Service Workers", "Offline", "Manifest", "Web"], level: "intermediate", difficulty: 5, readTime: 18, completionTime: 300 },
  { title: "Email Templates That Work: HTML Email Development", category: "Software Development", subcategory: "Frontend", tags: ["Email", "HTML", "Templates", "Responsive", "Email Clients"], level: "intermediate", difficulty: 4, readTime: 14, completionTime: 200 },
  { title: "Internationalization (i18n): Building Multi-Language Apps", category: "Software Development", subcategory: "Frontend", tags: ["i18n", "Internationalization", "Localization", "Translation", "React"], level: "intermediate", difficulty: 4, readTime: 16, completionTime: 240 },
  { title: "State Machines and XState: Predictable State Management", category: "Software Development", subcategory: "Frontend", tags: ["State Machines", "XState", "Finite State", "Complex State", "Visualization"], level: "advanced", difficulty: 7, readTime: 18, completionTime: 300 },

  // === More Career Guides ===
  { title: "From Intern to Full-Time: Navigating Your First Tech Job", category: "Career", subcategory: "Career Growth", tags: ["Internship", "New Grad", "First Job", "Career", "Growth"], level: "beginner", difficulty: 2, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Public Speaking for Engineers: Presenting with Confidence", category: "Career", subcategory: "Career Growth", tags: ["Public Speaking", "Presentations", "Communication", "Conferences", "Confidence"], level: "beginner", difficulty: 3, readTime: 16, completionTime: 240, beginnerFriendly: true },
  { title: "Mentorship in Tech: Finding and Being a Great Mentor", category: "Career", subcategory: "Career Growth", tags: ["Mentorship", "Mentor", "Mentee", "Growth", "Guidance"], level: "beginner", difficulty: 2, readTime: 12, completionTime: 180, beginnerFriendly: true },
  { title: "Burnout Prevention: Sustainable Career Practices", category: "Career", subcategory: "Career Growth", tags: ["Burnout", "Mental Health", "Wellness", "Work-Life Balance", "Self-Care"], level: "beginner", difficulty: 1, readTime: 14, completionTime: 200, beginnerFriendly: true },
  { title: "Open Source Contribution: Your First PR Guide", category: "Career", subcategory: "Career Growth", tags: ["Open Source", "Contribution", "GitHub", "PR", "Community"], level: "beginner", difficulty: 2, readTime: 14, completionTime: 200, beginnerFriendly: true },
];

const EXCERPTS = [
  "Master the essential concepts and practical techniques that top professionals use to excel in this field. A comprehensive resource for career growth.",
  "Discover proven strategies and best practices that will accelerate your learning and help you stand out in a competitive market.",
  "A complete, step-by-step guide covering everything from fundamentals to advanced implementation strategies for career success.",
  "Learn from industry experts with actionable advice, real-world examples, and battle-tested techniques for professional development.",
  "Your definitive resource for understanding and mastering this critical topic. Includes practical exercises and expert insights.",
  "Deep dive into cutting-edge approaches and methodologies transforming the industry. Perfect for professionals seeking to level up.",
  "Everything you need to know, from getting started to advanced concepts. Packed with practical examples and expert guidance.",
  "Build real skills with this hands-on guide featuring practical exercises, code examples, and actionable career advice.",
  "Navigate the complexities of this domain with confidence. Expert insights and proven strategies for tangible results.",
  "Transform your understanding with this comprehensive exploration of key concepts, tools, and best practices in the field.",
  "Practical guidance for professionals looking to master this area and advance their careers with confidence and clarity.",
  "An authoritative guide covering the latest trends, tools, and techniques that are shaping the future of this field.",
  "Accelerate your career growth with this focused guide to the most important skills and knowledge in the industry today.",
  "Bridge the gap between theory and practice with real-world examples, case studies, and actionable implementation guidance.",
  "Your complete playbook for success in this domain, featuring expert interviews, practical exercises, and a clear learning path.",
  "Stay ahead of the curve with this forward-looking guide covering emerging trends and future-proof career strategies.",
  "Build a strong foundation and advance to expert level with this structured, comprehensive learning resource.",
  "Unlock your potential with this guide to the tools, techniques, and mindsets that define successful professionals.",
  "A practical, no-fluff guide to mastering the skills that matter most for your career in today's technology landscape.",
  "Learn, practice, and apply with this comprehensive guide featuring real projects, expert tips, and career insights.",
];

function slugify(text, index) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + `-${Date.now()}-${index}`;
}

export async function seedCareerGuides() {
  try {
    const existing = await CareerGuide.countDocuments({ status: "published" });
    if (existing > 50) {
      console.log(`✅ ${existing} career guides already exist. Skipping seed.`);
      return;
    }

    let systemUser = await User.findOne({ email: "system@jobhub.com" });
    if (!systemUser) {
      systemUser = await User.create({
        fullname: "JobHub Editorial Team",
        email: "system@jobhub.com",
        password: "system-seed-account-do-not-use",
        profileCompleted: true,
        roles: { jobSeeker: true, recruiter: true },
        currentRole: "recruiter",
        profile: {
          headline: "Career & Technology Education",
          bio: "JobHub Editorial Team — expert career guides for tech professionals",
          profilePhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        },
      });
      console.log("✅ System author user created.");
    }

    const authors = [
      { name: "Sarah Chen", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
      { name: "Alex Rodriguez", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
      { name: "Emily Watson", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200" },
      { name: "David Kim", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" },
      { name: "Priya Patel", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" },
      { name: "Marcus Johnson", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200" },
      { name: "Aisha Mohammed", photo: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200" },
      { name: "James Wilson", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200" },
      { name: "Sofia Garcia", photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200" },
      { name: "Ryan Thompson", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200" },
    ];

    const now = Date.now();
    const guides = guideTemplates.map((t, i) => {
      const daysAgo = Math.floor(Math.random() * 90);
      const publishedDate = new Date(now - daysAgo * 86400000);
      const updatedDate = new Date(publishedDate.getTime() + Math.floor(Math.random() * 30) * 86400000);
      const authorIdx = i % authors.length;
      const excerptIdx = i % EXCERPTS.length;

      return {
        title: t.title,
        slug: slugify(t.title, i),
        content: GUIDE_CONTENT,
        excerpt: EXCERPTS[excerptIdx],
        coverImage: COVER_IMAGES[i % COVER_IMAGES.length],
        category: t.category,
        subcategory: t.subcategory,
        tags: t.tags,
        level: t.level,
        difficulty: t.difficulty,
        readTime: t.readTime,
        completionTime: t.completionTime,
        author: systemUser._id,
        status: "published",
        featured: t.featured || false,
        trending: t.trending || false,
        beginnerFriendly: t.beginnerFriendly || false,
        isPremium: false,
        views: Math.floor(Math.random() * 8000) + 200,
        likes: [],
        bookmarks: [],
        comments: [],
        sections: [
          { title: "Introduction", content: "Overview of the topic and why it matters for your career.", order: 0 },
          { title: "Getting Started", content: "Prerequisites, setup, and initial concepts to understand before diving deeper.", order: 1 },
          { title: "Core Concepts", content: "The fundamental principles and building blocks you need to master.", order: 2 },
          { title: "Advanced Techniques", content: "Deep dive into advanced patterns, optimization strategies, and expert-level approaches.", order: 3 },
          { title: "Practical Implementation", content: "Step-by-step implementation guide with real-world examples and code snippets.", order: 4 },
          { title: "Best Practices", content: "Industry best practices, common pitfalls to avoid, and proven strategies for success.", order: 5 },
          { title: "Tools and Resources", content: "Essential tools, libraries, frameworks, and learning resources to continue your journey.", order: 6 },
          { title: "Conclusion", content: "Summary of key takeaways and next steps for your career development.", order: 7 },
        ],
        resources: [
          "Official documentation and API references",
          "Recommended books and online courses",
          "Community forums and discussion groups",
          "Open source projects and sample code",
          "Video tutorials and workshop recordings",
        ],
        references: [
          "Industry research and whitepapers",
          "Academic papers and publications",
          "Expert interviews and case studies",
          "Conference talks and presentations",
        ],
        seoTitle: t.title,
        seoDescription: EXCERPTS[excerptIdx],
        publishedAt: publishedDate,
        updatedAt: updatedDate,
        createdAt: publishedDate,
      };
    });

    await CareerGuide.insertMany(guides);
    console.log(`✅ ${guides.length} career guides seeded successfully.`);

    const categories = [...new Set(guides.map((g) => g.category))];
    const levels = [...new Set(guides.map((g) => g.level))];
    console.log(`📂 Categories (${categories.length}): ${categories.join(", ")}`);
    console.log(`📊 Levels: ${levels.join(", ")}`);
  } catch (error) {
    console.error("❌ Career guide seed error:", error.message);
  }
}