const ROLES_TEMPLATES = [
  { role: "Frontend Developer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [400000, 1200000], mid: [1200000, 2500000], senior: [2500000, 4500000], lead: [4500000, 8000000] }, skills: ["JavaScript", "TypeScript", "React", "Vue.js", "Angular", "CSS", "HTML", "Next.js", "Tailwind CSS", "Redux"] },
  { role: "Backend Developer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [500000, 1400000], mid: [1400000, 2800000], senior: [2800000, 5000000], lead: [5000000, 9000000] }, skills: ["Node.js", "Python", "Java", "Go", "Spring Boot", "Django", "Express", "PostgreSQL", "MongoDB", "Redis"] },
  { role: "Full Stack Developer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [500000, 1300000], mid: [1300000, 2600000], senior: [2600000, 4800000], lead: [4800000, 8500000] }, skills: ["React", "Node.js", "Python", "TypeScript", "MongoDB", "PostgreSQL", "Docker", "AWS"] },
  { role: "Mobile Developer (Android)", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [400000, 1200000], mid: [1200000, 2400000], senior: [2400000, 4400000], lead: [4400000, 8000000] }, skills: ["Kotlin", "Java", "Android SDK", "Jetpack Compose", "Firebase", "REST API", "SQLite"] },
  { role: "Mobile Developer (iOS)", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [450000, 1300000], mid: [1300000, 2600000], senior: [2600000, 4600000], lead: [4600000, 8200000] }, skills: ["Swift", "SwiftUI", "Objective-C", "iOS SDK", "Core Data", "Firebase", "REST API"] },
  { role: "React Native Developer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [400000, 1100000], mid: [1100000, 2300000], senior: [2300000, 4200000], lead: [4200000, 7500000] }, skills: ["React Native", "JavaScript", "TypeScript", "Redux", "Firebase", "Node.js", "Expo"] },
  { role: "Flutter Developer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [400000, 1100000], mid: [1100000, 2200000], senior: [2200000, 4000000], lead: [4000000, 7200000] }, skills: ["Flutter", "Dart", "Firebase", "REST API", "Provider", "Bloc"] },
  { role: "DevOps Engineer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [500000, 1500000], mid: [1500000, 2800000], senior: [2800000, 5500000], lead: [5500000, 9500000] }, skills: ["Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "AWS", "GCP", "Azure", "Prometheus", "Grafana"] },
  { role: "Cloud Architect", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [800000, 2000000], mid: [2000000, 4000000], senior: [4000000, 7500000], lead: [7500000, 12000000] }, skills: ["AWS", "GCP", "Azure", "Terraform", "Kubernetes", "Docker", "Microservices", "System Design"] },
  { role: "Site Reliability Engineer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [600000, 1600000], mid: [1600000, 3200000], senior: [3200000, 6000000], lead: [6000000, 10000000] }, skills: ["Docker", "Kubernetes", "Python", "Go", "Terraform", "Prometheus", "Grafana", "Linux"] },
  { role: "Data Scientist", dept: "Data", industry: "Technology", baseSalaries: { entry: [500000, 1600000], mid: [1600000, 3200000], senior: [3200000, 6000000], lead: [6000000, 10000000] }, skills: ["Python", "R", "SQL", "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "Tableau"] },
  { role: "Machine Learning Engineer", dept: "Data", industry: "Technology", baseSalaries: { entry: [600000, 1800000], mid: [1800000, 3500000], senior: [3500000, 6500000], lead: [6500000, 11000000] }, skills: ["Python", "TensorFlow", "PyTorch", "Keras", "Docker", "Kubernetes", "AWS SageMaker", "MLOps"] },
  { role: "Data Engineer", dept: "Data", industry: "Technology", baseSalaries: { entry: [500000, 1400000], mid: [1400000, 2800000], senior: [2800000, 5000000], lead: [5000000, 8500000] }, skills: ["Python", "Spark", "Hadoop", "SQL", "Airflow", "Kafka", "Snowflake", "AWS"] },
  { role: "Data Analyst", dept: "Data", industry: "Technology", baseSalaries: { entry: [300000, 900000], mid: [900000, 1800000], senior: [1800000, 3000000], lead: [3000000, 5000000] }, skills: ["SQL", "Python", "Tableau", "Power BI", "Excel", "R", "Pandas"] },
  { role: "AI Engineer", dept: "Data", industry: "Technology", baseSalaries: { entry: [700000, 2000000], mid: [2000000, 4000000], senior: [4000000, 7500000], lead: [7500000, 13000000] }, skills: ["Python", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "LangChain", "LLM", "RAG"] },
  { role: "BI Analyst", dept: "Data", industry: "Technology", baseSalaries: { entry: [300000, 800000], mid: [800000, 1600000], senior: [1600000, 2800000], lead: [2800000, 4500000] }, skills: ["SQL", "Power BI", "Tableau", "Excel", "DAX", "Data Modeling"] },
  { role: "Product Manager", dept: "Product", industry: "Technology", baseSalaries: { entry: [800000, 2000000], mid: [2000000, 3800000], senior: [3800000, 7000000], lead: [7000000, 12000000] }, skills: ["Product Strategy", "User Research", "A/B Testing", "Analytics", "Agile", "JIRA", "Figma"] },
  { role: "Technical Product Manager", dept: "Product", industry: "Technology", baseSalaries: { entry: [1000000, 2500000], mid: [2500000, 4500000], senior: [4500000, 8000000], lead: [8000000, 14000000] }, skills: ["Product Strategy", "System Design", "API Design", "Agile", "SQL", "User Research"] },
  { role: "Program Manager", dept: "Management", industry: "Technology", baseSalaries: { entry: [800000, 1800000], mid: [1800000, 3200000], senior: [3200000, 5500000], lead: [5500000, 9000000] }, skills: ["Project Management", "Agile", "JIRA", "Risk Management", "Stakeholder Management"] },
  { role: "Engineering Manager", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [1500000, 3000000], mid: [3000000, 6000000], senior: [6000000, 10000000], lead: [10000000, 18000000] }, skills: ["Team Leadership", "System Design", "Code Review", "Agile", "Performance Management", "Architecture"] },
  { role: "UI/UX Designer", dept: "Design", industry: "Technology", baseSalaries: { entry: [300000, 900000], mid: [900000, 2000000], senior: [2000000, 3500000], lead: [3500000, 6000000] }, skills: ["Figma", "Sketch", "Adobe XD", "User Research", "Wireframing", "Prototyping", "Usability Testing"] },
  { role: "Product Designer", dept: "Design", industry: "Technology", baseSalaries: { entry: [400000, 1200000], mid: [1200000, 2500000], senior: [2500000, 4200000], lead: [4200000, 7000000] }, skills: ["Figma", "User Research", "Prototyping", "Design Systems", "Interaction Design", "Usability Testing"] },
  { role: "UX Researcher", dept: "Design", industry: "Technology", baseSalaries: { entry: [500000, 1200000], mid: [1200000, 2400000], senior: [2400000, 4000000], lead: [4000000, 6500000] }, skills: ["User Research", "Usability Testing", "Survey Design", "Data Analysis", "Ethnography", "A/B Testing"] },
  { role: "Graphic Designer", dept: "Design", industry: "Technology", baseSalaries: { entry: [200000, 600000], mid: [600000, 1400000], senior: [1400000, 2500000], lead: [2500000, 4000000] }, skills: ["Photoshop", "Illustrator", "InDesign", "Figma", "Typography", "Brand Design"] },
  { role: "Motion Designer", dept: "Design", industry: "Technology", baseSalaries: { entry: [300000, 800000], mid: [800000, 1800000], senior: [1800000, 3000000], lead: [3000000, 5000000] }, skills: ["After Effects", "Premiere Pro", "Cinema 4D", "Blender", "Motion Graphics", "Animation"] },
  { role: "QA Engineer", dept: "QA", industry: "Technology", baseSalaries: { entry: [300000, 800000], mid: [800000, 1600000], senior: [1600000, 2800000], lead: [2800000, 4500000] }, skills: ["Manual Testing", "Selenium", "JIRA", "API Testing", "Test Case Design", "Regression Testing"] },
  { role: "Automation Engineer", dept: "QA", industry: "Technology", baseSalaries: { entry: [400000, 1000000], mid: [1000000, 2000000], senior: [2000000, 3500000], lead: [3500000, 5500000] }, skills: ["Selenium", "Cypress", "Python", "Java", "Jenkins", "API Automation", "CI/CD"] },
  { role: "SDET", dept: "QA", industry: "Technology", baseSalaries: { entry: [500000, 1200000], mid: [1200000, 2400000], senior: [2400000, 4000000], lead: [4000000, 6500000] }, skills: ["Python", "Java", "Selenium", "Cypress", "Performance Testing", "CI/CD", "Docker"] },
  { role: "Security Engineer", dept: "Security", industry: "Technology", baseSalaries: { entry: [600000, 1600000], mid: [1600000, 3000000], senior: [3000000, 5500000], lead: [5500000, 9000000] }, skills: ["Python", "Burp Suite", "Metasploit", "Wireshark", "Nessus", "Kali Linux", "AWS Security"] },
  { role: "Cybersecurity Analyst", dept: "Security", industry: "Technology", baseSalaries: { entry: [400000, 1000000], mid: [1000000, 2000000], senior: [2000000, 3500000], lead: [3500000, 5500000] }, skills: ["SIEM", "IDS/IPS", "Firewall", "Vulnerability Assessment", "Incident Response", "Splunk"] },
  { role: "Security Architect", dept: "Security", industry: "Technology", baseSalaries: { entry: [1200000, 2800000], mid: [2800000, 5000000], senior: [5000000, 8500000], lead: [8500000, 13000000] }, skills: ["Security Architecture", "Cloud Security", "IAM", "Encryption", "Zero Trust", "Compliance"] },
  { role: "Penetration Tester", dept: "Security", industry: "Technology", baseSalaries: { entry: [500000, 1200000], mid: [1200000, 2400000], senior: [2400000, 4000000], lead: [4000000, 6500000] }, skills: ["Burp Suite", "Metasploit", "Python", "Web Security", "Network Security", "Reverse Engineering"] },
  { role: "Solutions Architect", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [1200000, 2500000], mid: [2500000, 5000000], senior: [5000000, 9000000], lead: [9000000, 15000000] }, skills: ["System Design", "Cloud Architecture", "Microservices", "Enterprise Architecture", "AWS", "GCP", "Azure"] },
  { role: "Technical Writer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [300000, 800000], mid: [800000, 1600000], senior: [1600000, 2800000], lead: [2800000, 4500000] }, skills: ["Technical Writing", "Documentation", "API Docs", "Markdown", "Git", "MadCap Flare"] },
  { role: "Business Analyst", dept: "Management", industry: "Technology", baseSalaries: { entry: [300000, 800000], mid: [800000, 1600000], senior: [1600000, 2800000], lead: [2800000, 4500000] }, skills: ["SQL", "Excel", "Data Analysis", "Requirement Gathering", "JIRA", "Tableau"] },
  { role: "Scrum Master", dept: "Management", industry: "Technology", baseSalaries: { entry: [600000, 1400000], mid: [1400000, 2500000], senior: [2500000, 4000000], lead: [4000000, 6000000] }, skills: ["Agile", "Scrum", "JIRA", "Team Facilitation", "Conflict Resolution", "Coaching"] },
  { role: "Database Administrator", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [400000, 1000000], mid: [1000000, 2000000], senior: [2000000, 3500000], lead: [3500000, 5500000] }, skills: ["MySQL", "PostgreSQL", "MongoDB", "Oracle", "Performance Tuning", "Backup & Recovery"] },
  { role: "Network Engineer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [300000, 800000], mid: [800000, 1600000], senior: [1600000, 2800000], lead: [2800000, 4500000] }, skills: ["Cisco", "TCP/IP", "VPN", "Firewall", "Routing", "Switching", "SD-WAN"] },
  { role: "Blockchain Developer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [500000, 1500000], mid: [1500000, 3000000], senior: [3000000, 5500000], lead: [5500000, 9000000] }, skills: ["Solidity", "Ethereum", "Web3.js", "Smart Contracts", "Node.js", "Python", "DeFi"] },
  { role: "AR/VR Developer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [400000, 1200000], mid: [1200000, 2500000], senior: [2500000, 4200000], lead: [4200000, 7000000] }, skills: ["Unity", "Unreal Engine", "C#", "C++", "ARKit", "ARCore", "3D Modeling"] },
  { role: "Systems Engineer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [300000, 800000], mid: [800000, 1600000], senior: [1600000, 3000000], lead: [3000000, 5000000] }, skills: ["Linux", "Windows Server", "Networking", "Scripting", "Virtualization", "Active Directory"] },
  { role: "IT Support Engineer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [200000, 600000], mid: [600000, 1200000], senior: [1200000, 2000000], lead: [2000000, 3200000] }, skills: ["Troubleshooting", "Networking", "Windows", "Linux", "Active Directory", "ServiceNow"] },
  { role: "Research Scientist", dept: "Data", industry: "Technology", baseSalaries: { entry: [1000000, 2500000], mid: [2500000, 5000000], senior: [5000000, 9000000], lead: [9000000, 15000000] }, skills: ["Python", "Research", "Publications", "TensorFlow", "PyTorch", "NLP", "Computer Vision"] },
  { role: "Software Engineer (Backend)", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [500000, 1400000], mid: [1400000, 2800000], senior: [2800000, 5000000], lead: [5000000, 9000000] }, skills: ["Java", "Python", "Go", "Node.js", "Microservices", "SQL", "Redis", "Kafka"] },
  { role: "Software Engineer (Frontend)", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [400000, 1200000], mid: [1200000, 2500000], senior: [2500000, 4500000], lead: [4500000, 8000000] }, skills: ["JavaScript", "TypeScript", "React", "CSS", "HTML", "Web Performance", "Testing"] },
  { role: "Staff Engineer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [2000000, 3500000], mid: [3500000, 6500000], senior: [6500000, 11000000], lead: [11000000, 18000000] }, skills: ["System Design", "Architecture", "Mentoring", "Cross-functional Leadership"] },
  { role: "Principal Engineer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [3000000, 5000000], mid: [5000000, 9000000], senior: [9000000, 15000000], lead: [15000000, 25000000] }, skills: ["Architecture", "Strategic Planning", "Org-wide Impact", "System Design"] },
  { role: "VP of Engineering", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [4000000, 7000000], mid: [7000000, 12000000], senior: [12000000, 20000000], lead: [20000000, 35000000] }, skills: ["Engineering Leadership", "Strategy", "Team Building", "Architecture", "Budgeting"] },
  { role: "CTO", dept: "Management", industry: "Technology", baseSalaries: { entry: [5000000, 10000000], mid: [10000000, 20000000], senior: [20000000, 35000000], lead: [35000000, 60000000] }, skills: ["Technology Strategy", "Leadership", "Product Vision", "Architecture", "Team Building"] },
  { role: "Director of Product", dept: "Product", industry: "Technology", baseSalaries: { entry: [2500000, 5000000], mid: [5000000, 9000000], senior: [9000000, 15000000], lead: [15000000, 25000000] }, skills: ["Product Strategy", "Leadership", "User Research", "Data Driven Decision Making", "Roadmapping"] },
  { role: "Salesforce Developer", dept: "Engineering", industry: "Technology", baseSalaries: { entry: [400000, 1000000], mid: [1000000, 2000000], senior: [2000000, 3500000], lead: [3500000, 5500000] }, skills: ["Apex", "Visualforce", "Lightning", "SOQL", "Salesforce Cloud", "REST API"] },
  { role: "SAP Consultant", dept: "Engineering", industry: "Enterprise", baseSalaries: { entry: [500000, 1200000], mid: [1200000, 2200000], senior: [2200000, 3800000], lead: [3800000, 6000000] }, skills: ["SAP S/4HANA", "ABAP", "SAP Fiori", "SAP MM", "SAP SD", "SAP FI/CO"] },
  { role: "Marketing Manager", dept: "Marketing", industry: "Technology", baseSalaries: { entry: [500000, 1200000], mid: [1200000, 2500000], senior: [2500000, 4500000], lead: [4500000, 7500000] }, skills: ["Digital Marketing", "SEO/SEM", "Content Strategy", "Analytics", "Campaign Management", "CRM"] },
  { role: "Growth Hacker", dept: "Marketing", industry: "Technology", baseSalaries: { entry: [600000, 1500000], mid: [1500000, 3000000], senior: [3000000, 5000000], lead: [5000000, 8000000] }, skills: ["Growth Strategy", "A/B Testing", "Analytics", "SEO", "User Acquisition", "Conversion Optimization"] },
  { role: "HR Manager", dept: "HR", industry: "Technology", baseSalaries: { entry: [500000, 1200000], mid: [1200000, 2200000], senior: [2200000, 3800000], lead: [3800000, 6000000] }, skills: ["Talent Acquisition", "Employee Relations", "HR Operations", "Compensation", "Compliance"] },
  { role: "Talent Acquisition Specialist", dept: "HR", industry: "Technology", baseSalaries: { entry: [300000, 800000], mid: [800000, 1600000], senior: [1600000, 2800000], lead: [2800000, 4500000] }, skills: ["Sourcing", "Interviewing", "Recruitment Marketing", "ATS", "Employer Branding"] },
  { role: "Legal Counsel", dept: "Legal", industry: "Technology", baseSalaries: { entry: [800000, 1800000], mid: [1800000, 3500000], senior: [3500000, 6000000], lead: [6000000, 10000000] }, skills: ["Contract Law", "IP Law", "Compliance", "Corporate Law", "Data Privacy", "Negotiation"] },
  { role: "Finance Manager", dept: "Finance", industry: "Technology", baseSalaries: { entry: [800000, 1800000], mid: [1800000, 3200000], senior: [3200000, 5500000], lead: [5500000, 9000000] }, skills: ["Financial Modeling", "Budgeting", "Forecasting", "FP&A", "Excel", "ERP"] },
  { role: "Embedded Systems Engineer", dept: "Engineering", industry: "Hardware", baseSalaries: { entry: [400000, 1000000], mid: [1000000, 2000000], senior: [2000000, 3500000], lead: [3500000, 6000000] }, skills: ["C", "C++", "RTOS", "ARM", "Embedded Linux", "Microcontrollers", "I2C", "SPI"] },
  { role: "Game Developer", dept: "Engineering", industry: "Gaming", baseSalaries: { entry: [300000, 800000], mid: [800000, 1800000], senior: [1800000, 3200000], lead: [3200000, 5500000] }, skills: ["Unity", "Unreal Engine", "C#", "C++", "Game Design", "3D Modeling", "Physics"] },
  { role: "Data Architect", dept: "Data", industry: "Technology", baseSalaries: { entry: [1000000, 2500000], mid: [2500000, 4500000], senior: [4500000, 7500000], lead: [7500000, 12000000] }, skills: ["Data Modeling", "Snowflake", "BigQuery", "Spark", "Kafka", "Data Warehousing", "ETL"] },
  { role: "AI/ML Product Manager", dept: "Product", industry: "Technology", baseSalaries: { entry: [1200000, 2800000], mid: [2800000, 5000000], senior: [5000000, 8500000], lead: [8500000, 14000000] }, skills: ["AI/ML Knowledge", "Product Strategy", "Data Analysis", "User Research", "Agile", "A/B Testing"] },
];

const COMPANIES = [
  { name: "Google", multiplier: 2.0, industry: "Technology" },
  { name: "Microsoft", multiplier: 1.8, industry: "Technology" },
  { name: "Amazon", multiplier: 1.7, industry: "Technology" },
  { name: "Meta", multiplier: 2.1, industry: "Technology" },
  { name: "Apple", multiplier: 1.9, industry: "Technology" },
  { name: "Netflix", multiplier: 2.2, industry: "Technology" },
  { name: "Uber", multiplier: 1.6, industry: "Technology" },
  { name: "LinkedIn", multiplier: 1.8, industry: "Technology" },
  { name: "Salesforce", multiplier: 1.6, industry: "Technology" },
  { name: "Adobe", multiplier: 1.5, industry: "Technology" },
  { name: "Oracle", multiplier: 1.3, industry: "Technology" },
  { name: "IBM", multiplier: 1.2, industry: "Technology" },
  { name: "Intel", multiplier: 1.4, industry: "Hardware" },
  { name: "Flipkart", multiplier: 1.5, industry: "E-commerce" },
  { name: "Swiggy", multiplier: 1.3, industry: "Food Tech" },
  { name: "Zomato", multiplier: 1.3, industry: "Food Tech" },
  { name: "Razorpay", multiplier: 1.5, industry: "Fintech" },
  { name: "CRED", multiplier: 1.4, industry: "Fintech" },
  { name: "Paytm", multiplier: 1.2, industry: "Fintech" },
  { name: "MakeMyTrip", multiplier: 1.2, industry: "Travel" },
  { name: "Nykaa", multiplier: 1.3, industry: "E-commerce" },
  { name: "Zoho", multiplier: 0.9, industry: "Technology" },
  { name: "TCS", multiplier: 0.5, industry: "IT Services" },
  { name: "Infosys", multiplier: 0.5, industry: "IT Services" },
  { name: "Wipro", multiplier: 0.45, industry: "IT Services" },
  { name: "HCL", multiplier: 0.45, industry: "IT Services" },
  { name: "Accenture", multiplier: 0.7, industry: "Consulting" },
  { name: "Deloitte", multiplier: 0.8, industry: "Consulting" },
  { name: "Goldman Sachs", multiplier: 1.5, industry: "Finance" },
  { name: "JPMorgan", multiplier: 1.5, industry: "Finance" },
];

const LOCATIONS = [
  { name: "Bangalore", adjustment: 1.0 },
  { name: "Mumbai", adjustment: 1.05 },
  { name: "Delhi NCR", adjustment: 0.95 },
  { name: "Hyderabad", adjustment: 0.88 },
  { name: "Pune", adjustment: 0.85 },
  { name: "Chennai", adjustment: 0.82 },
  { name: "Kolkata", adjustment: 0.72 },
  { name: "Ahmedabad", adjustment: 0.7 },
  { name: "Jaipur", adjustment: 0.65 },
  { name: "Chandigarh", adjustment: 0.7 },
  { name: "Kochi", adjustment: 0.7 },
  { name: "Indore", adjustment: 0.6 },
  { name: "Lucknow", adjustment: 0.6 },
  { name: "Nagpur", adjustment: 0.6 },
  { name: "Surat", adjustment: 0.65 },
  { name: "Bhopal", adjustment: 0.6 },
  { name: "Bhubaneswar", adjustment: 0.65 },
  { name: "Coimbatore", adjustment: 0.65 },
  { name: "Remote", adjustment: 0.9 },
];

const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"];
const WORK_MODES = ["on-site", "remote", "hybrid"];
const EDUCATION_LEVELS = ["bachelors", "masters", "phd"];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const GROWTH_BY_ROLE = {
  "Frontend Developer": 12, "Backend Developer": 10, "Full Stack Developer": 11, "DevOps Engineer": 14,
  "Cloud Architect": 15, "Data Scientist": 16, "Machine Learning Engineer": 18, "Data Engineer": 14,
  "AI Engineer": 22, "Product Manager": 10, "Engineering Manager": 12, "Security Engineer": 13,
  "Mobile Developer (Android)": 8, "Mobile Developer (iOS)": 8, "UI/UX Designer": 9, "Staff Engineer": 12,
  "Principal Engineer": 10, "VP of Engineering": 11, "CTO": 10, "Blockchain Developer": 8,
  "AR/VR Developer": 12, "AI/ML Product Manager": 18, "Research Scientist": 16, "Solutions Architect": 11,
};

const DEMAND_BY_ROLE = {
  "Frontend Developer": 75, "Backend Developer": 80, "Full Stack Developer": 85, "DevOps Engineer": 82,
  "Cloud Architect": 70, "Data Scientist": 78, "Machine Learning Engineer": 85, "Data Engineer": 80,
  "AI Engineer": 92, "Product Manager": 76, "Engineering Manager": 72, "Security Engineer": 80,
  "Mobile Developer (Android)": 65, "Mobile Developer (iOS)": 60, "UI/UX Designer": 74, "Staff Engineer": 55,
  "Principal Engineer": 40, "VP of Engineering": 35, "CTO": 30, "Blockchain Developer": 45,
  "AR/VR Developer": 55, "AI/ML Product Manager": 82, "Research Scientist": 60, "Solutions Architect": 68,
};

const LEVEL_SENIORITY = { entry: 20, mid: 45, senior: 70, lead: 90 };
const LEVEL_EDUCATION = { entry: ["bachelors", "masters"], mid: ["bachelors", "masters"], senior: ["bachelors", "masters", "phd"], lead: ["bachelors", "masters", "phd"] };
const LEVEL_RSU = { entry: [0, 500000], mid: [500000, 1500000], senior: [1500000, 4000000], lead: [4000000, 10000000] };
const LEVEL_BONUS_PCT = { entry: [0, 5], mid: [5, 10], senior: [10, 20], lead: [15, 30] };

const COMPANY_DETAILS = COMPANIES.map(c => ({
  ...c,
  employees: rand(1000, 200000),
  founded: rand(1990, 2020),
  headquarters: pick(LOCATIONS.map(l => l.name)),
  revenue: `$${rand(100, 250000)}M`,
  rating: randFloat(3.5, 4.8).toFixed(1),
  interviewExp: pick(["Easy", "Moderate", "Difficult", "Very Difficult"]),
}));

export function generateSalaryData(count = 2000) {
  const records = [];
  const used = new Set();

  for (let i = 0; i < count; i++) {
    const tmpl = pick(ROLES_TEMPLATES);
    const company = pick(COMPANIES);
    const location = pick(LOCATIONS);
    const expLevel = pick(EXPERIENCE_LEVELS);
    const key = `${tmpl.role}|${company.name}|${location.name}|${expLevel}`;
    if (used.has(key) && Math.random() > 0.3) { i--; continue; }
    used.add(key);

    const [minBase, maxBase] = tmpl.baseSalaries[expLevel];
    const base = rand(minBase, maxBase);
    const companyMult = company.multiplier + randFloat(-0.1, 0.1);
    const locationAdj = location.adjustment + randFloat(-0.05, 0.05);
    const adjusted = Math.round(base * Math.max(0.3, companyMult) * locationAdj);

    const variance = randFloat(0.85, 1.15);
    const minSal = Math.round(adjusted * 0.8);
    const maxSal = Math.round(adjusted * 1.3);
    const avgSal = Math.round(adjusted * variance);
    const medSal = Math.round(avgSal * randFloat(0.95, 1.05));

    const bonusPct = randFloat(LEVEL_BONUS_PCT[expLevel][0], LEVEL_BONUS_PCT[expLevel][1]) / 100;
    const bonus = Math.round(avgSal * bonusPct);
    const [rsuMin, rsuMax] = LEVEL_RSU[expLevel];
    const stock = company.name === "Google" || company.name === "Meta" || company.name === "Amazon" || company.name === "Microsoft" || company.name === "Apple" || company.name === "Netflix" || company.name === "LinkedIn" || company.name === "Uber" || company.name === "Salesforce"
      ? rand(rsuMin, rsuMax)
      : Math.random() > 0.6 ? rand(Math.round(rsuMin * 0.5), Math.round(rsuMax * 0.5)) : 0;
    const totalComp = avgSal + bonus + stock;

    const growth = GROWTH_BY_ROLE[tmpl.role] || rand(5, 15);
    const demand = DEMAND_BY_ROLE[tmpl.role] || rand(40, 80);

    const skillCount = expLevel === "entry" ? rand(2, 3) : expLevel === "mid" ? rand(3, 5) : expLevel === "senior" ? rand(4, 6) : rand(5, 7);
    const shuffledSkills = shuffle(tmpl.skills);

    const workMode = expLevel === "lead" || expLevel === "senior" ? pick(["on-site", "remote", "hybrid", "hybrid"]) : pick(["on-site", "on-site", "hybrid"]);
    const education = pick(LEVEL_EDUCATION[expLevel]);

    records.push({
      role: tmpl.role,
      location: location.name,
      minSalary: minSal,
      maxSalary: maxSal,
      medianSalary: medSal,
      averageSalary: avgSal,
      currency: "INR",
      experienceLevel: expLevel,
      company: company.name,
      skills: shuffledSkills.slice(0, skillCount),
      source: "aggregated",
      reportedAt: new Date(Date.now() - rand(0, 365 * 2) * 86400000),
      bonus,
      stock,
      totalCompensation: totalComp,
      annualGrowth: growth,
      demandScore: demand + rand(-5, 5),
      department: tmpl.dept,
      industry: tmpl.industry,
      employmentType: "full-time",
      workMode,
      education,
      seniorityScore: LEVEL_SENIORITY[expLevel] + rand(-5, 5),
      dataQualityScore: rand(70, 98),
    });
  }
  return records;
}

export function getCompanyDetails() {
  return COMPANY_DETAILS;
}

export const ALL_ROLES = ROLES_TEMPLATES.map(r => r.role);
export const ALL_COMPANIES = COMPANIES.map(c => c.name);
export const ALL_LOCATIONS = LOCATIONS.map(l => l.name);
export const DEPARTMENTS = [...new Set(ROLES_TEMPLATES.map(r => r.dept))];
export const LEVELS = EXPERIENCE_LEVELS;
