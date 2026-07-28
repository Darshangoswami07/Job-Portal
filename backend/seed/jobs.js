import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";

const companies = [
  { name: "Google", logo: "https://www.google.com/s2/favicons?domain=google.com&sz=128", location: "Bangalore", industry: "Technology", size: "10000+" },
  { name: "Microsoft", logo: "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128", location: "Hyderabad", industry: "Technology", size: "10000+" },
  { name: "Amazon", logo: "https://www.google.com/s2/favicons?domain=amazon.com&sz=128", location: "Bangalore", industry: "E-commerce", size: "10000+" },
  { name: "Meta", logo: "https://www.google.com/s2/favicons?domain=meta.com&sz=128", location: "Bangalore", industry: "Technology", size: "10000+" },
  { name: "Apple", logo: "https://www.google.com/s2/favicons?domain=apple.com&sz=128", location: "Hyderabad", industry: "Technology", size: "10000+" },
  { name: "Netflix", logo: "https://www.google.com/s2/favicons?domain=netflix.com&sz=128", location: "Mumbai", industry: "Entertainment", size: "1000-5000" },
  { name: "Flipkart", logo: "https://www.google.com/s2/favicons?domain=flipkart.com&sz=128", location: "Bangalore", industry: "E-commerce", size: "10000+" },
  { name: "Swiggy", logo: "https://www.google.com/s2/favicons?domain=swiggy.com&sz=128", location: "Bangalore", industry: "Food Tech", size: "5000-10000" },
  { name: "Zomato", logo: "https://www.google.com/s2/favicons?domain=zomato.com&sz=128", location: "Gurgaon", industry: "Food Tech", size: "5000-10000" },
  { name: "Uber", logo: "https://www.google.com/s2/favicons?domain=uber.com&sz=128", location: "Bangalore", industry: "Transportation", size: "10000+" },
  { name: "Razorpay", logo: "https://www.google.com/s2/favicons?domain=razorpay.com&sz=128", location: "Bangalore", industry: "Fintech", size: "1000-5000" },
  { name: "PhonePe", logo: "https://www.google.com/s2/favicons?domain=phonepe.com&sz=128", location: "Bangalore", industry: "Fintech", size: "1000-5000" },
  { name: "Cred", logo: "https://www.google.com/s2/favicons?domain=cred.club&sz=128", location: "Bangalore", industry: "Fintech", size: "500-1000" },
  { name: "Ola", logo: "https://www.google.com/s2/favicons?domain=olacabs.com&sz=128", location: "Bangalore", industry: "Transportation", size: "5000-10000" },
  { name: "Paytm", logo: "https://www.google.com/s2/favicons?domain=paytm.com&sz=128", location: "Noida", industry: "Fintech", size: "10000+" },
  { name: "Byju's", logo: "https://www.google.com/s2/favicons?domain=byjus.com&sz=128", location: "Bangalore", industry: "Edtech", size: "10000+" },
  { name: "Unacademy", logo: "https://www.google.com/s2/favicons?domain=unacademy.com&sz=128", location: "Bangalore", industry: "Edtech", size: "1000-5000" },
  { name: "Stripe", logo: "https://www.google.com/s2/favicons?domain=stripe.com&sz=128", location: "Remote", industry: "Fintech", size: "5000-10000" },
  { name: "Shopify", logo: "https://www.google.com/s2/favicons?domain=shopify.com&sz=128", location: "Remote", industry: "E-commerce", size: "5000-10000" },
  { name: "GitLab", logo: "https://www.google.com/s2/favicons?domain=gitlab.com&sz=128", location: "Remote", industry: "Technology", size: "1000-5000" },
  { name: "Atlassian", logo: "https://www.google.com/s2/favicons?domain=atlassian.com&sz=128", location: "Bangalore", industry: "Technology", size: "5000-10000" },
  { name: "Adobe", logo: "https://www.google.com/s2/favicons?domain=adobe.com&sz=128", location: "Noida", industry: "Technology", size: "10000+" },
  { name: "Salesforce", logo: "https://www.google.com/s2/favicons?domain=salesforce.com&sz=128", location: "Hyderabad", industry: "Technology", size: "10000+" },
  { name: "Oracle", logo: "https://www.google.com/s2/favicons?domain=oracle.com&sz=128", location: "Bangalore", industry: "Technology", size: "10000+" },
  { name: "IBM", logo: "https://www.google.com/s2/favicons?domain=ibm.com&sz=128", location: "Bangalore", industry: "Technology", size: "10000+" },
  { name: "Intel", logo: "https://www.google.com/s2/favicons?domain=intel.com&sz=128", location: "Bangalore", industry: "Semiconductor", size: "10000+" },
  { name: "Tesla", logo: "https://www.google.com/s2/favicons?domain=tesla.com&sz=128", location: "Remote", industry: "Automotive", size: "10000+" },
  { name: "Spotify", logo: "https://www.google.com/s2/favicons?domain=spotify.com&sz=128", location: "Remote", industry: "Music", size: "5000-10000" },
  { name: "Twitter/X", logo: "https://www.google.com/s2/favicons?domain=twitter.com&sz=128", location: "Remote", industry: "Social Media", size: "1000-5000" },
  { name: "LinkedIn", logo: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=128", location: "Bangalore", industry: "Social Media", size: "10000+" },
  { name: "Goldman Sachs", logo: "https://www.google.com/s2/favicons?domain=goldmansachs.com&sz=128", location: "Bangalore", industry: "Finance", size: "10000+" },
  { name: "JPMorgan", logo: "https://www.google.com/s2/favicons?domain=jpmorgan.com&sz=128", location: "Mumbai", industry: "Finance", size: "10000+" },
  { name: "Walmart", logo: "https://www.google.com/s2/favicons?domain=walmart.com&sz=128", location: "Remote", industry: "Retail", size: "10000+" },
  { name: "Cisco", logo: "https://www.google.com/s2/favicons?domain=cisco.com&sz=128", location: "Bangalore", industry: "Technology", size: "10000+" },
  { name: "Deloitte", logo: "https://www.google.com/s2/favicons?domain=deloitte.com&sz=128", location: "Mumbai", industry: "Consulting", size: "10000+" },
  { name: "Accenture", logo: "https://www.google.com/s2/favicons?domain=accenture.com&sz=128", location: "Bangalore", industry: "Consulting", size: "10000+" },
  { name: "TCS", logo: "https://www.google.com/s2/favicons?domain=tcs.com&sz=128", location: "Mumbai", industry: "Technology", size: "10000+" },
  { name: "Infosys", logo: "https://www.google.com/s2/favicons?domain=infosys.com&sz=128", location: "Bangalore", industry: "Technology", size: "10000+" },
  { name: "Wipro", logo: "https://www.google.com/s2/favicons?domain=wipro.com&sz=128", location: "Bangalore", industry: "Technology", size: "10000+" },
  { name: "HCL", logo: "https://www.google.com/s2/favicons?domain=hcl.com&sz=128", location: "Noida", industry: "Technology", size: "10000+" },
  { name: "Zoom", logo: "https://www.google.com/s2/favicons?domain=zoom.us&sz=128", location: "Remote", industry: "Technology", size: "1000-5000" },
  { name: "Slack", logo: "https://www.google.com/s2/favicons?domain=slack.com&sz=128", location: "Remote", industry: "Technology", size: "1000-5000" },
  { name: "Notion", logo: "https://www.google.com/s2/favicons?domain=notion.so&sz=128", location: "Remote", industry: "Technology", size: "500-1000" },
  { name: "Figma", logo: "https://www.google.com/s2/favicons?domain=figma.com&sz=128", location: "Remote", industry: "Technology", size: "500-1000" },
  { name: "Vercel", logo: "https://www.google.com/s2/favicons?domain=vercel.com&sz=128", location: "Remote", industry: "Technology", size: "100-500" },
  { name: "Linear", logo: "https://www.google.com/s2/favicons?domain=linear.app&sz=128", location: "Remote", industry: "Technology", size: "50-100" },
  { name: "Postman", logo: "https://www.google.com/s2/favicons?domain=postman.com&sz=128", location: "Bangalore", industry: "Technology", size: "500-1000" },
  { name: "Freshworks", logo: "https://www.google.com/s2/favicons?domain=freshworks.com&sz=128", location: "Chennai", industry: "Technology", size: "1000-5000" },
  { name: "Zoho", logo: "https://www.google.com/s2/favicons?domain=zoho.com&sz=128", location: "Chennai", industry: "Technology", size: "10000+" },
  { name: "Dream11", logo: "https://www.google.com/s2/favicons?domain=dream11.com&sz=128", location: "Mumbai", industry: "Gaming", size: "1000-5000" },
];

const JOB_TEMPLATES = [
  // Frontend
  { title: "Senior Frontend Engineer", industry: "Technology", department: "Engineering", skills: ["React", "TypeScript", "CSS", "GraphQL"], minExp: 5, maxExp: 8, salary: 35, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "Frontend Developer", industry: "Technology", department: "Engineering", skills: ["React", "JavaScript", "HTML", "CSS"], minExp: 2, maxExp: 4, salary: 18, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "React Native Developer", industry: "Technology", department: "Mobile", skills: ["React Native", "JavaScript", "iOS", "Android"], minExp: 3, maxExp: 6, salary: 22, type: "Full-time", workType: "Remote", level: "Mid" },
  { title: "UI Engineer", industry: "Technology", department: "Design", skills: ["React", "Storybook", "CSS", "Design Systems"], minExp: 3, maxExp: 6, salary: 20, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Frontend Architect", industry: "Technology", department: "Engineering", skills: ["React", "Next.js", "Architecture", "Performance"], minExp: 8, maxExp: 12, salary: 50, type: "Full-time", workType: "Remote", level: "Lead" },
  { title: "Junior Frontend Developer", industry: "Technology", department: "Engineering", skills: ["HTML", "CSS", "JavaScript", "React"], minExp: 0, maxExp: 1, salary: 8, type: "Full-time", workType: "On-site", level: "Entry" },
  { title: "Next.js Developer", industry: "Technology", department: "Engineering", skills: ["Next.js", "React", "TypeScript", "Node.js"], minExp: 3, maxExp: 6, salary: 25, type: "Full-time", workType: "Remote", level: "Mid" },
  { title: "Vue.js Developer", industry: "Technology", department: "Engineering", skills: ["Vue.js", "JavaScript", "TypeScript", "Pinia"], minExp: 2, maxExp: 5, salary: 18, type: "Full-time", workType: "Hybrid", level: "Mid" },

  // Backend
  { title: "Senior Backend Engineer", industry: "Technology", department: "Engineering", skills: ["Node.js", "Python", "PostgreSQL", "AWS"], minExp: 5, maxExp: 8, salary: 38, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "Backend Developer - Python", industry: "Technology", department: "Engineering", skills: ["Python", "Django", "PostgreSQL", "REST APIs"], minExp: 2, maxExp: 5, salary: 18, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Java Backend Developer", industry: "Technology", department: "Engineering", skills: ["Java", "Spring Boot", "Microservices", "Kafka"], minExp: 3, maxExp: 6, salary: 22, type: "Full-time", workType: "On-site", level: "Mid" },
  { title: "Go/Golang Engineer", industry: "Technology", department: "Engineering", skills: ["Go", "gRPC", "Docker", "Kubernetes"], minExp: 4, maxExp: 7, salary: 30, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "Node.js Developer", industry: "Technology", department: "Engineering", skills: ["Node.js", "Express", "MongoDB", "Redis"], minExp: 2, maxExp: 4, salary: 16, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Backend Architect", industry: "Technology", department: "Engineering", skills: ["System Design", "Microservices", "Cloud", "Scalability"], minExp: 8, maxExp: 12, salary: 55, type: "Full-time", workType: "Remote", level: "Lead" },
  { title: "Junior Backend Developer", industry: "Technology", department: "Engineering", skills: ["Python", "SQL", "REST APIs"], minExp: 0, maxExp: 1, salary: 7, type: "Full-time", workType: "On-site", level: "Entry" },
  { title: "Rust Systems Engineer", industry: "Technology", department: "Engineering", skills: ["Rust", "Systems Programming", "Performance"], minExp: 4, maxExp: 7, salary: 35, type: "Full-time", workType: "Remote", level: "Senior" },

  // Full Stack
  { title: "Full Stack Developer", industry: "Technology", department: "Engineering", skills: ["React", "Node.js", "TypeScript", "PostgreSQL"], minExp: 3, maxExp: 6, salary: 24, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Senior Full Stack Engineer", industry: "Technology", department: "Engineering", skills: ["React", "Node.js", "AWS", "System Design"], minExp: 5, maxExp: 8, salary: 40, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "Full Stack Developer - MERN", industry: "Technology", department: "Engineering", skills: ["MongoDB", "Express", "React", "Node.js"], minExp: 2, maxExp: 4, salary: 15, type: "Full-time", workType: "On-site", level: "Mid" },
  { title: "Full Stack Engineer - Python", industry: "Technology", department: "Engineering", skills: ["Python", "React", "FastAPI", "PostgreSQL"], minExp: 3, maxExp: 5, salary: 20, type: "Full-time", workType: "Hybrid", level: "Mid" },

  // DevOps / Cloud
  { title: "DevOps Engineer", industry: "Technology", department: "Infrastructure", skills: ["Docker", "Kubernetes", "AWS", "Terraform"], minExp: 4, maxExp: 7, salary: 30, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "Cloud Engineer - AWS", industry: "Technology", department: "Infrastructure", skills: ["AWS", "Infrastructure", "CloudFormation", "CI/CD"], minExp: 3, maxExp: 6, salary: 28, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Site Reliability Engineer", industry: "Technology", department: "Infrastructure", skills: ["Kubernetes", "Prometheus", "Go", "Incident Response"], minExp: 5, maxExp: 8, salary: 35, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "Platform Engineer", industry: "Technology", department: "Infrastructure", skills: ["Kubernetes", "Docker", "CI/CD", "Developer Experience"], minExp: 4, maxExp: 7, salary: 32, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "DevOps Intern", industry: "Technology", department: "Infrastructure", skills: ["Docker", "Linux", "AWS"], minExp: 0, maxExp: 0, salary: 3, type: "Internship", workType: "On-site", level: "Entry" },

  // AI / ML / Data
  { title: "Machine Learning Engineer", industry: "Technology", department: "AI/ML", skills: ["PyTorch", "TensorFlow", "Python", "MLOps"], minExp: 4, maxExp: 7, salary: 35, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "AI Engineer", industry: "Technology", department: "AI/ML", skills: ["LLMs", "LangChain", "Python", "RAG"], minExp: 3, maxExp: 6, salary: 30, type: "Full-time", workType: "Remote", level: "Mid" },
  { title: "Data Scientist", industry: "Technology", department: "Data", skills: ["Python", "SQL", "Machine Learning", "Statistics"], minExp: 3, maxExp: 6, salary: 28, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Data Engineer", industry: "Technology", department: "Data", skills: ["Spark", "Kafka", "Airflow", "SQL"], minExp: 3, maxExp: 6, salary: 25, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "NLP Engineer", industry: "Technology", department: "AI/ML", skills: ["NLP", "Transformers", "BERT", "Python"], minExp: 3, maxExp: 6, salary: 30, type: "Full-time", workType: "Remote", level: "Mid" },
  { title: "Computer Vision Engineer", industry: "Technology", department: "AI/ML", skills: ["Computer Vision", "PyTorch", "OpenCV", "Python"], minExp: 4, maxExp: 7, salary: 32, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "MLOps Engineer", industry: "Technology", department: "Infrastructure", skills: ["MLOps", "Kubernetes", "MLflow", "Python"], minExp: 3, maxExp: 6, salary: 28, type: "Full-time", workType: "Remote", level: "Mid" },
  { title: "Data Analyst", industry: "Technology", department: "Data", skills: ["SQL", "Python", "Tableau", "Excel"], minExp: 1, maxExp: 3, salary: 12, type: "Full-time", workType: "On-site", level: "Entry" },
  { title: "AI Research Scientist", industry: "Technology", department: "Research", skills: ["Deep Learning", "Research", "PyTorch", "Publications"], minExp: 5, maxExp: 10, salary: 45, type: "Full-time", workType: "Remote", level: "Lead" },
  { title: "Machine Learning Intern", industry: "Technology", department: "AI/ML", skills: ["Python", "Machine Learning", "PyTorch"], minExp: 0, maxExp: 0, salary: 4, type: "Internship", workType: "On-site", level: "Entry" },

  // Product / Design
  { title: "Product Manager", industry: "Technology", department: "Product", skills: ["Product Strategy", "Roadmapping", "Analytics", "Agile"], minExp: 4, maxExp: 7, salary: 30, type: "Full-time", workType: "Hybrid", level: "Senior" },
  { title: "Associate Product Manager", industry: "Technology", department: "Product", skills: ["Product", "Analytics", "User Research"], minExp: 1, maxExp: 3, salary: 15, type: "Full-time", workType: "On-site", level: "Entry" },
  { title: "Product Designer", industry: "Technology", department: "Design", skills: ["Figma", "UI/UX", "Design Systems", "Prototyping"], minExp: 3, maxExp: 6, salary: 22, type: "Full-time", workType: "Remote", level: "Mid" },
  { title: "UX Researcher", industry: "Technology", department: "Design", skills: ["User Research", "Usability Testing", "Qualitative"], minExp: 2, maxExp: 5, salary: 18, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Visual Designer", industry: "Technology", department: "Design", skills: ["Figma", "Illustrator", "Branding", "Typography"], minExp: 2, maxExp: 4, salary: 15, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Senior Product Manager", industry: "Technology", department: "Product", skills: ["Product Strategy", "Leadership", "Data-Driven", "Stakeholder Management"], minExp: 6, maxExp: 10, salary: 45, type: "Full-time", workType: "Remote", level: "Lead" },

  // Mobile
  { title: "iOS Developer", industry: "Technology", department: "Mobile", skills: ["Swift", "SwiftUI", "iOS", "Xcode"], minExp: 3, maxExp: 6, salary: 25, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Android Developer", industry: "Technology", department: "Mobile", skills: ["Kotlin", "Jetpack Compose", "Android SDK"], minExp: 3, maxExp: 6, salary: 24, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Senior Mobile Developer", industry: "Technology", department: "Mobile", skills: ["React Native", "Flutter", "Mobile Architecture"], minExp: 5, maxExp: 8, salary: 35, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "Flutter Developer", industry: "Technology", department: "Mobile", skills: ["Flutter", "Dart", "Mobile", "Cross-Platform"], minExp: 2, maxExp: 5, salary: 18, type: "Full-time", workType: "Remote", level: "Mid" },

  // Data Science / Analytics
  { title: "Senior Data Scientist", industry: "Technology", department: "Data", skills: ["Python", "Machine Learning", "Deep Learning", "Statistics"], minExp: 5, maxExp: 8, salary: 40, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "Business Intelligence Analyst", industry: "Finance", department: "Analytics", skills: ["SQL", "Power BI", "Tableau", "Excel"], minExp: 2, maxExp: 4, salary: 14, type: "Full-time", workType: "On-site", level: "Mid" },
  { title: "Analytics Engineer", industry: "Technology", department: "Data", skills: ["SQL", "dbt", "Airflow", "Snowflake"], minExp: 3, maxExp: 5, salary: 22, type: "Full-time", workType: "Hybrid", level: "Mid" },

  // Security
  { title: "Security Engineer", industry: "Technology", department: "Security", skills: ["Cybersecurity", "Pen Testing", "Cloud Security", "Zero Trust"], minExp: 4, maxExp: 7, salary: 32, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "Application Security Engineer", industry: "Technology", department: "Security", skills: ["AppSec", "SAST", "DAST", "OWASP"], minExp: 3, maxExp: 6, salary: 28, type: "Full-time", workType: "Remote", level: "Mid" },
  { title: "SOC Analyst", industry: "Technology", department: "Security", skills: ["Security Monitoring", "Incident Response", "SIEM"], minExp: 1, maxExp: 3, salary: 12, type: "Full-time", workType: "On-site", level: "Entry" },

  // QA / Testing
  { title: "QA Engineer", industry: "Technology", department: "QA", skills: ["Testing", "Cypress", "Selenium", "Automation"], minExp: 2, maxExp: 4, salary: 14, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "SDET", industry: "Technology", department: "QA", skills: ["Python", "Selenium", "CI/CD", "Test Automation"], minExp: 3, maxExp: 6, salary: 20, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Senior QA Automation", industry: "Technology", department: "QA", skills: ["Playwright", "Cypress", "API Testing", "Performance"], minExp: 5, maxExp: 8, salary: 28, type: "Full-time", workType: "Remote", level: "Senior" },

  // Engineering Manager / Leadership
  { title: "Engineering Manager", industry: "Technology", department: "Engineering", skills: ["Leadership", "Team Management", "System Design", "Agile"], minExp: 8, maxExp: 12, salary: 55, type: "Full-time", workType: "Hybrid", level: "Lead" },
  { title: "VP of Engineering", industry: "Technology", department: "Engineering", skills: ["Leadership", "Strategy", "Architecture", "Team Building"], minExp: 12, maxExp: 16, salary: 80, type: "Full-time", workType: "Remote", level: "Lead" },
  { title: "Director of Engineering", industry: "Technology", department: "Engineering", skills: ["Engineering Leadership", "Strategy", "Scalability"], minExp: 10, maxExp: 15, salary: 70, type: "Full-time", workType: "Remote", level: "Lead" },
  { title: "Tech Lead", industry: "Technology", department: "Engineering", skills: ["Architecture", "Code Review", "Mentoring", "System Design"], minExp: 6, maxExp: 9, salary: 42, type: "Full-time", workType: "Hybrid", level: "Lead" },

  // Blockchain / Web3
  { title: "Blockchain Developer", industry: "Technology", department: "Engineering", skills: ["Solidity", "Ethereum", "Web3", "Smart Contracts"], minExp: 3, maxExp: 6, salary: 30, type: "Full-time", workType: "Remote", level: "Mid" },
  { title: "Web3 Engineer", industry: "Technology", department: "Engineering", skills: ["Web3", "Ethers.js", "DeFi", "Smart Contracts"], minExp: 3, maxExp: 6, salary: 32, type: "Full-time", workType: "Remote", level: "Mid" },

  // Marketing / Growth
  { title: "Growth Marketing Manager", industry: "Technology", department: "Marketing", skills: ["Growth", "SEO", "Analytics", "A/B Testing"], minExp: 3, maxExp: 6, salary: 22, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Digital Marketing Specialist", industry: "Technology", department: "Marketing", skills: ["SEO", "SEM", "Content Marketing", "Analytics"], minExp: 2, maxExp: 4, salary: 12, type: "Full-time", workType: "On-site", level: "Entry" },
  { title: "Content Marketing Manager", industry: "Technology", department: "Marketing", skills: ["Content Strategy", "Writing", "SEO", "B2B"], minExp: 4, maxExp: 7, salary: 20, type: "Full-time", workType: "Remote", level: "Senior" },
  { title: "Product Marketing Manager", industry: "Technology", department: "Marketing", skills: ["Product Marketing", "Go-to-Market", "Positioning", "Messaging"], minExp: 4, maxExp: 7, salary: 28, type: "Full-time", workType: "Hybrid", level: "Senior" },

  // HR / People
  { title: "HR Business Partner", industry: "Technology", department: "People", skills: ["HR", "Employee Relations", "Recruitment", "Culture"], minExp: 4, maxExp: 7, salary: 20, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Talent Acquisition Specialist", industry: "Technology", department: "People", skills: ["Recruitment", "Sourcing", "Interviewing", "ATS"], minExp: 2, maxExp: 4, salary: 14, type: "Full-time", workType: "On-site", level: "Mid" },
  { title: "Technical Recruiter", industry: "Technology", department: "People", skills: ["Technical Recruitment", "Sourcing", "Talent Mapping"], minExp: 3, maxExp: 6, salary: 18, type: "Full-time", workType: "Remote", level: "Mid" },
  { title: "HR Intern", industry: "Technology", department: "People", skills: ["HR", "Communication", "Organization"], minExp: 0, maxExp: 0, salary: 3, type: "Internship", workType: "On-site", level: "Entry" },

  // Finance / Legal
  { title: "Financial Analyst", industry: "Finance", department: "Finance", skills: ["Financial Modeling", "Excel", "Valuation", "Analytics"], minExp: 2, maxExp: 5, salary: 16, type: "Full-time", workType: "On-site", level: "Mid" },
  { title: "Legal Counsel - Technology", industry: "Technology", department: "Legal", skills: ["Contract Law", "IP", "Privacy", "Compliance"], minExp: 4, maxExp: 7, salary: 30, type: "Full-time", workType: "Hybrid", level: "Senior" },
  { title: "Compliance Officer", industry: "Finance", department: "Legal", skills: ["Compliance", "Regulations", "Risk Management"], minExp: 3, maxExp: 6, salary: 22, type: "Full-time", workType: "On-site", level: "Mid" },

  // Customer Success / Support
  { title: "Customer Success Manager", industry: "Technology", department: "Customer Success", skills: ["Customer Success", "SaaS", "Account Management", "CRM"], minExp: 3, maxExp: 6, salary: 18, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Technical Support Engineer", industry: "Technology", department: "Support", skills: ["Technical Support", "Debugging", "APIs", "SQL"], minExp: 2, maxExp: 4, salary: 12, type: "Full-time", workType: "On-site", level: "Mid" },
  { title: "Solutions Engineer", industry: "Technology", department: "Solutions", skills: ["Pre-Sales", "Technical Demos", "API", "Cloud"], minExp: 3, maxExp: 6, salary: 25, type: "Full-time", workType: "Hybrid", level: "Mid" },

  // Consulting
  { title: "Management Consultant", industry: "Consulting", department: "Consulting", skills: ["Strategy", "Analytics", "Problem Solving", "Presentation"], minExp: 3, maxExp: 6, salary: 25, type: "Full-time", workType: "On-site", level: "Mid" },
  { title: "Technology Consultant", industry: "Consulting", department: "Consulting", skills: ["Technology Strategy", "Digital Transformation", "Cloud"], minExp: 4, maxExp: 7, salary: 30, type: "Full-time", workType: "Hybrid", level: "Senior" },
  { title: "Senior Consultant", industry: "Consulting", department: "Consulting", skills: ["Strategy", "Operations", "Digital", "Client Management"], minExp: 5, maxExp: 8, salary: 35, type: "Full-time", workType: "On-site", level: "Senior" },

  // DBRE / Database
  { title: "Database Administrator", industry: "Technology", department: "Infrastructure", skills: ["PostgreSQL", "MySQL", "MongoDB", "Performance Tuning"], minExp: 4, maxExp: 7, salary: 25, type: "Full-time", workType: "Hybrid", level: "Mid" },
  { title: "Database Reliability Engineer", industry: "Technology", department: "Infrastructure", skills: ["PostgreSQL", "Redis", "Cassandra", "High Availability"], minExp: 5, maxExp: 8, salary: 35, type: "Full-time", workType: "Remote", level: "Senior" },
];

const descriptions = {
  "Senior Frontend Engineer": "We are looking for a Senior Frontend Engineer to lead the development of our web application. You will work closely with our design and product teams to create intuitive, high-performance user interfaces. You will mentor junior engineers and drive frontend architecture decisions.",
  "Frontend Developer": "Join our team as a Frontend Developer and help build beautiful, responsive web applications. You will implement UI components, integrate APIs, and ensure a seamless user experience across all devices.",
  "React Native Developer": "We need a React Native Developer to build and maintain our mobile applications. You will work on both iOS and Android platforms, ensuring native-like performance and great user experience.",
  "Senior Backend Engineer": "We are seeking a Senior Backend Engineer to design and build scalable backend systems. You will architect APIs, optimize database performance, and ensure high availability of our services.",
  "Backend Developer - Python": "Join our backend team to build robust APIs and services using Python and Django. You will work on database design, API development, and system integration.",
  "Full Stack Developer": "We are looking for a versatile Full Stack Developer who can work across the entire technology stack. You will build features end-to-end, from database schema to user interface.",
  "DevOps Engineer": "As a DevOps Engineer, you will build and maintain our cloud infrastructure, implement CI/CD pipelines, and ensure the reliability and scalability of our production systems.",
  "Machine Learning Engineer": "Join our AI team to build and deploy machine learning models at scale. You will work on recommendation systems, natural language processing, and predictive analytics.",
  "Product Manager": "We are seeking a Product Manager to define and execute product strategy. You will work with engineering, design, and business teams to deliver impactful products.",
  "Data Scientist": "As a Data Scientist, you will analyze large datasets, build predictive models, and generate actionable insights to drive business decisions.",
  "Engineering Manager": "Lead and mentor a team of engineers while driving technical strategy and delivering high-impact projects. You will balance people management with technical contribution.",
  "Security Engineer": "Protect our systems and data by implementing security best practices, conducting audits, and responding to security incidents.",
  "iOS Developer": "Build world-class iOS applications using Swift and SwiftUI. You will work on features that delight millions of users worldwide.",
  "Android Developer": "Join our Android team to build cutting-edge mobile experiences using Kotlin and Jetpack Compose.",
  "QA Engineer": "Ensure the quality of our products through comprehensive testing strategies, automated tests, and continuous improvement of QA processes.",
};

function generateDescription(title, companyName, skills) {
  if (descriptions[title]) return descriptions[title];
  const skillStr = skills.slice(0, 3).join(", ");
  return `Join ${companyName} as a ${title}. You will work with ${skillStr} and other cutting-edge technologies to build scalable, high-quality solutions. Collaborate with cross-functional teams to deliver impactful products.`;
}

function generateBenefits() {
  const all = [
    "Health Insurance", "Dental Coverage", "Vision Insurance", "401(k) Matching",
    "Unlimited PTO", "Flexible Hours", "Remote Work Options", "Stock Options",
    "Equity Grants", "Annual Bonus", "Learning Budget", "Gym Membership",
    "Mental Health Support", "Parental Leave", "Sabbatical", "Free Meals",
    "Snacks & Drinks", "Commuter Benefits", "Cell Phone Allowance", "Internet Stipend",
    "Professional Development", "Conference Attendance", "Certification Support",
    "Employee Assistance Program", "Life Insurance", "Disability Insurance",
    "Pet Insurance", "Childcare Support", "Tuition Reimbursement", "Student Loan Assistance",
  ];
  const count = 3 + Math.floor(Math.random() * 5);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateResponsibilities(title) {
  return [
    `Develop and maintain ${title} solutions for our platform`,
    "Collaborate with cross-functional teams to define requirements",
    "Write clean, maintainable, and well-tested code",
    "Participate in code reviews and architectural discussions",
    "Mentor junior team members and contribute to engineering culture",
    "Troubleshoot and resolve production issues",
    "Contribute to technical documentation",
    "Stay current with industry trends and best practices",
  ];
}

function generateNiceToHave() {
  const all = [
    "Experience with cloud platforms (AWS/GCP/Azure)",
    "Knowledge of containerization (Docker, Kubernetes)",
    "Understanding of CI/CD pipelines",
    "Experience with agile development methodologies",
    "Open source contributions",
    "Published technical articles or talks",
    "Experience with microservices architecture",
    "Familiarity with monitoring and observability tools",
  ];
  const count = 2 + Math.floor(Math.random() * 3);
  return [...all].sort(() => Math.random() - 0.5).slice(0, count);
}

function generateHash(title, companyName, location) {
  return `${title.toLowerCase().replace(/\s+/g, "-")}-${companyName.toLowerCase().replace(/\s+/g, "-")}-${location.toLowerCase().replace(/\s+/g, "-")}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seedJobs() {
  try {
    const existing = await Job.countDocuments({ isActive: true });
    if (existing > 200) {
      console.log(`✅ ${existing} jobs already exist. Skipping seed.`);
      return;
    }

    let systemUser = await User.findOne({ email: "system@jobhub.com" });
    if (!systemUser) {
      systemUser = await User.create({
        fullname: "JobHub System",
        email: "system@jobhub.com",
        password: "system-seed-account-do-not-use",
        profileCompleted: true,
        roles: { jobSeeker: true, recruiter: true },
        currentRole: "recruiter",
        profile: {
          headline: "JobHub System Account",
          bio: "System account for job seeding",
          profilePhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        },
      });
      console.log("✅ System user created.");
    }

    const now = Date.now();
    const jobs = [];

    for (let i = 0; i < JOB_TEMPLATES.length; i++) {
      const tmpl = JOB_TEMPLATES[i];
      const companyData = companies[i % companies.length];

      let company = await Company.findOne({ name: companyData.name });
      if (!company) {
        company = await Company.create({
          name: companyData.name,
          logo: companyData.logo,
          location: companyData.location,
          industry: companyData.industry,
          size: companyData.size,
          created_by: systemUser._id,
          description: `${companyData.name} is a leading ${companyData.industry} company with offices worldwide.`,
          email: `hr@${companyData.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        });
      }

      const locations = [companyData.location, "Bangalore", "Hyderabad", "Mumbai", "Delhi NCR", "Pune", "Chennai", "Remote"];
      const location = tmpl.workType === "Remote" ? "Remote" : locations[i % locations.length];
      const daysAgo = randomInt(0, 45);
      const publishedDate = new Date(now - daysAgo * 86400000);

      const missingSkills = tmpl.skills.slice(0, randomInt(1, 2));
      const aiMatch = randomInt(65, 98);
      const atsScore = randomInt(60, 95);

      jobs.push({
        title: tmpl.title,
        slug: tmpl.title.toLowerCase().replace(/\s+/g, "-") + `-${i}`,
        description: generateDescription(tmpl.title, companyData.name, tmpl.skills),
        requirements: tmpl.skills.map(s => `Proficiency in ${s}`),
        responsibilities: generateResponsibilities(tmpl.title),
        niceToHave: generateNiceToHave(),
        skills: tmpl.skills,
        benefits: generateBenefits(),
        salary: tmpl.salary + randomInt(-5, 10),
        salaryCurrency: "INR",
        salaryMin: tmpl.salary - 5,
        salaryMax: tmpl.salary + 10,
        experienceLevel: tmpl.minExp,
        experienceMin: tmpl.minExp,
        experienceMax: tmpl.maxExp,
        location,
        city: location === "Remote" ? "Remote" : location.split(",")[0],
        country: "India",
        jobType: tmpl.type,
        workType: tmpl.workType,
        position: randomInt(1, 5),
        company: company._id,
        created_by: systemUser._id,
        views: randomInt(50, 5000),
        applicantsCount: randomInt(5, 200),
        isActive: true,
        featured: i < 12,
        trending: i >= 8 && i < 22,
        urgent: i >= 15 && i < 20,
        verified: i < 30,
        easyApply: i % 3 === 0,
        sponsored: i >= 10 && i < 14,
        remoteFriendly: tmpl.workType === "Remote",
        visaSponsorship: i % 5 === 0,
        workAuthorization: "Any",
        industry: tmpl.industry,
        department: tmpl.department,
        tags: [...tmpl.skills, tmpl.industry, tmpl.level],
        aiMatch,
        atsScore,
        skillMatch: randomInt(70, 95),
        resumeMatch: randomInt(55, 90),
        missingSkills,
        interviewDifficulty: ["easy", "medium", "hard"][randomInt(0, 2)],
        estimatedSalary: `₹${tmpl.salary - 5}-${tmpl.salary + 10} LPA`,
        careerGrowth: `Potential to grow to ${tmpl.level === "Lead" ? "Director" : tmpl.level === "Senior" ? "Lead" : "Senior"} role within 2-3 years`,
        promotionPotential: tmpl.level === "Entry" ? "High" : tmpl.level === "Mid" ? "Good" : "Moderate",
        learningResources: [
          `https://roadmap.sh/${tmpl.skills[0]?.toLowerCase() || "frontend"}`,
          "https://www.coursera.org",
          "https://www.udemy.com",
        ],
        source: "JobHub",
        sourceUrl: "",
        externalId: `jobhub-${i}`,
        hash: generateHash(tmpl.title, companyData.name, location),
        deadline: new Date(now + randomInt(10, 60) * 86400000),
        publishedAt: publishedDate,
        updatedAt: publishedDate,
        createdAt: publishedDate,
      });
    }

    // Add additional jobs to hit 500+ total by creating variations
    for (let i = 0; i < 200; i++) {
      const tmpl = JOB_TEMPLATES[i % JOB_TEMPLATES.length];
      const companyData = companies[(i + 5) % companies.length];
      const location = ["Bangalore", "Hyderabad", "Mumbai", "Pune", "Chennai", "Delhi NCR", "Gurgaon", "Noida", "Remote", "Kolkata"][i % 10];
      const daysAgo = randomInt(0, 60);
      const publishedDate = new Date(now - daysAgo * 86400000);
      const idx = JOB_TEMPLATES.length + i;

      let company = await Company.findOne({ name: companyData.name });
      if (!company) continue;

      const aiMatch = randomInt(60, 96);

      jobs.push({
        title: tmpl.title,
        slug: `${tmpl.title.toLowerCase().replace(/\s+/g, "-")}-${idx}`,
        description: generateDescription(tmpl.title, companyData.name, tmpl.skills),
        requirements: tmpl.skills.map(s => `Proficiency in ${s}`),
        responsibilities: generateResponsibilities(tmpl.title),
        niceToHave: generateNiceToHave(),
        skills: tmpl.skills,
        benefits: generateBenefits(),
        salary: tmpl.salary + randomInt(-8, 12),
        salaryCurrency: "INR",
        salaryMin: tmpl.salary - 8,
        salaryMax: tmpl.salary + 12,
        experienceLevel: tmpl.minExp,
        experienceMin: tmpl.minExp,
        experienceMax: tmpl.maxExp,
        location,
        country: "India",
        jobType: tmpl.type,
        workType: ["Remote", "Hybrid", "On-site"][i % 3],
        position: randomInt(1, 4),
        company: company._id,
        created_by: systemUser._id,
        views: randomInt(20, 3000),
        applicantsCount: randomInt(2, 150),
        isActive: true,
        featured: false,
        trending: i < 15,
        urgent: i >= 30 && i < 38,
        verified: i < 20,
        easyApply: i % 4 === 0,
        remoteFriendly: i % 3 === 0,
        visaSponsorship: i % 6 === 0,
        industry: tmpl.industry,
        department: tmpl.department,
        tags: [...tmpl.skills, tmpl.industry],
        aiMatch,
        atsScore: randomInt(55, 92),
        skillMatch: randomInt(65, 92),
        resumeMatch: randomInt(50, 88),
        missingSkills: tmpl.skills.slice(0, randomInt(0, 2)),
        interviewDifficulty: ["easy", "medium", "hard"][randomInt(0, 2)],
        estimatedSalary: `₹${Math.max(3, tmpl.salary - 8)}-${tmpl.salary + 12} LPA`,
        careerGrowth: `Career progression opportunities in ${tmpl.industry} sector`,
        source: "JobHub",
        hash: `${tmpl.title.toLowerCase().replace(/\s+/g, "-")}-${companyData.name.toLowerCase().replace(/\s+/g, "-")}-${location.toLowerCase().replace(/\s+/g, "-")}-${idx}`,
        deadline: new Date(now + randomInt(10, 45) * 86400000),
        publishedAt: publishedDate,
        createdAt: publishedDate,
        updatedAt: publishedDate,
      });
    }

    await Job.insertMany(jobs);
    console.log(`✅ ${jobs.length} jobs seeded successfully.`);

    const jobTypes = [...new Set(jobs.map(j => j.jobType))];
    const workTypes = [...new Set(jobs.map(j => j.workType))];
    const industries = [...new Set(jobs.map(j => j.industry))];
    const cities = [...new Set(jobs.filter(j => j.workType !== "Remote").map(j => j.city || j.location))];
    console.log(`📊 Types: ${jobTypes.join(", ")}`);
    console.log(`🏢 Work: ${workTypes.join(", ")}`);
    console.log(`🏭 Industries: ${industries.slice(0, 10).join(", ")}...`);
    console.log(`📍 Cities: ${cities.slice(0, 10).join(", ")}...`);
  } catch (error) {
    console.error("❌ Job seed error:", error.message);
  }
}