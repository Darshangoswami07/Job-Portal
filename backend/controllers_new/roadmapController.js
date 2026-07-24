import { CareerRoadmap } from "../models_new/CareerRoadmap.js";
import { normalizeJobMarket, JOB_MARKET_DEMAND } from "../constants/roadmapConstants.js";

const ROADMAP_DATA = {
  roles: {
    frontend: { title: "Frontend Developer", difficulty: "beginner", duration: "8-12 months", category: "Web Development", outcomes: ["Build responsive web apps", "Master modern JS frameworks", "Deploy production apps"] },
    backend: { title: "Backend Developer", difficulty: "beginner", duration: "8-12 months", category: "Web Development", outcomes: ["Build RESTful APIs", "Design database schemas", "Deploy cloud services"] },
    fullstack: { title: "Full Stack Developer", difficulty: "intermediate", duration: "12-18 months", category: "Web Development", outcomes: ["Build full-stack apps", "Own feature delivery", "Architect solutions"] },
    jsdev: { title: "JavaScript Developer", difficulty: "beginner", duration: "6-10 months", category: "Web Development", outcomes: ["Master JavaScript ecosystem", "Build web apps", "Full-stack JS development"] },
    tsdev: { title: "TypeScript Developer", difficulty: "intermediate", duration: "8-12 months", category: "Web Development", outcomes: ["Type-safe programming", "Build scalable apps", "Advanced TypeScript patterns"] },
    reactdev: { title: "React Developer", difficulty: "beginner", duration: "6-10 months", category: "Web Development", outcomes: ["Build React UIs", "State management", "React ecosystem mastery"] },
    nextdev: { title: "Next.js Developer", difficulty: "intermediate", duration: "8-14 months", category: "Web Development", outcomes: ["Full-stack Next.js apps", "SSR/SSG", "Server components"] },
    vuedev: { title: "Vue.js Developer", difficulty: "beginner", duration: "6-10 months", category: "Web Development", outcomes: ["Build Vue apps", "Composition API", "Vue ecosystem"] },
    angdev: { title: "Angular Developer", difficulty: "intermediate", duration: "8-14 months", category: "Web Development", outcomes: ["Enterprise Angular apps", "RxJS", "NgRx state management"] },
    android: { title: "Android Developer", difficulty: "intermediate", duration: "12-18 months", category: "Mobile Development", outcomes: ["Build Android apps", "Jetpack Compose", "Publish to Play Store"] },
    iosdev: { title: "iOS Developer", difficulty: "intermediate", duration: "12-18 months", category: "Mobile Development", outcomes: ["Build iOS apps", "SwiftUI", "Publish to App Store"] },
    flutterdev: { title: "Flutter Developer", difficulty: "beginner", duration: "8-14 months", category: "Mobile Development", outcomes: ["Cross-platform mobile apps", "Dart programming", "Widget tree mastery"] },
    rndev: { title: "React Native Developer", difficulty: "intermediate", duration: "10-16 months", category: "Mobile Development", outcomes: ["Cross-platform React apps", "Native modules", "App store deployment"] },
    pydev: { title: "Python Developer", difficulty: "beginner", duration: "6-10 months", category: "Programming Languages", outcomes: ["Python mastery", "Automation scripts", "Backend services"] },
    javadev: { title: "Java Developer", difficulty: "intermediate", duration: "10-16 months", category: "Programming Languages", outcomes: ["Enterprise Java apps", "Spring Boot", "Microservices"] },
    csdev: { title: "C# Developer", difficulty: "intermediate", duration: "10-16 months", category: "Programming Languages", outcomes: [".NET applications", "ASP.NET Core", "Azure services"] },
    godev: { title: "Go Developer", difficulty: "intermediate", duration: "8-14 months", category: "Programming Languages", outcomes: ["Concurrent systems", "CLI tools", "Cloud-native services"] },
    rustdev: { title: "Rust Developer", difficulty: "advanced", duration: "12-18 months", category: "Programming Languages", outcomes: ["Systems programming", "WebAssembly", "Performance-critical apps"] },
    phpdev: { title: "PHP Developer", difficulty: "beginner", duration: "6-10 months", category: "Programming Languages", outcomes: ["Web apps with PHP", "Laravel framework", "CMS development"] },
    kotlindev: { title: "Kotlin Developer", difficulty: "intermediate", duration: "8-14 months", category: "Programming Languages", outcomes: ["Android apps", "Kotlin Multiplatform", "Server-side Kotlin"] },
    dataanalyst: { title: "Data Analyst", difficulty: "beginner", duration: "6-12 months", category: "Data & AI", outcomes: ["Analyze datasets", "Create dashboards", "Data-driven decisions"] },
    datascience: { title: "Data Scientist", difficulty: "intermediate", duration: "12-24 months", category: "Data & AI", outcomes: ["Analyze data", "Build ML models", "Deploy AI solutions"] },
    mlengineer: { title: "Machine Learning Engineer", difficulty: "advanced", duration: "18-24 months", category: "Data & AI", outcomes: ["Build ML pipelines", "Deploy models", "Optimize performance"] },
    aiengineer: { title: "AI Engineer", difficulty: "advanced", duration: "8-12 months", category: "Data & AI", outcomes: ["Build AI systems", "LLM engineering", "RAG pipelines", "AI agents"] },
    dlengineer: { title: "Deep Learning Engineer", difficulty: "advanced", duration: "14-20 months", category: "Data & AI", outcomes: ["Neural networks", "Computer vision", "NLP models"] },
    nlpengineer: { title: "NLP Engineer", difficulty: "advanced", duration: "14-20 months", category: "Data & AI", outcomes: ["NLP pipelines", "Transformers", "Language models"] },
    cvengineer: { title: "Computer Vision Engineer", difficulty: "advanced", duration: "14-20 months", category: "Data & AI", outcomes: ["Image processing", "Object detection", "Video analytics"] },
    prompteng: { title: "Prompt Engineer", difficulty: "intermediate", duration: "4-8 months", category: "Data & AI", outcomes: ["Prompt optimization", "LLM integration", "AI workflows"] },
    llmeng: { title: "LLM Engineer", difficulty: "advanced", duration: "10-16 months", category: "Data & AI", outcomes: ["Fine-tune LLMs", "RAG systems", "AI agents"] },
    genaien: { title: "Generative AI Engineer", difficulty: "advanced", duration: "12-18 months", category: "Data & AI", outcomes: ["Generative models", "Diffusion models", "AI content creation"] },
    devops: { title: "DevOps Engineer", difficulty: "intermediate", duration: "12-18 months", category: "Cloud & DevOps", outcomes: ["Automate infrastructure", "Manage CI/CD pipelines", "Monitor production"] },
    clouden: { title: "Cloud Engineer", difficulty: "intermediate", duration: "10-16 months", category: "Cloud & DevOps", outcomes: ["Cloud infrastructure", "Migration", "Cloud-native apps"] },
    awsdev: { title: "AWS Engineer", difficulty: "intermediate", duration: "10-16 months", category: "Cloud & DevOps", outcomes: ["AWS services", "Cloud architecture", "Serverless apps"] },
    azuredev: { title: "Azure Engineer", difficulty: "intermediate", duration: "10-16 months", category: "Cloud & DevOps", outcomes: ["Azure services", "Hybrid cloud", "Azure DevOps"] },
    gcpdev: { title: "Google Cloud Engineer", difficulty: "intermediate", duration: "10-16 months", category: "Cloud & DevOps", outcomes: ["GCP services", "Data analytics", "Cloud native"] },
    k8seng: { title: "Kubernetes Engineer", difficulty: "advanced", duration: "12-18 months", category: "Cloud & DevOps", outcomes: ["K8s clusters", "Service mesh", "Container orchestration"] },
    dockereng: { title: "Docker Engineer", difficulty: "intermediate", duration: "8-12 months", category: "Cloud & DevOps", outcomes: ["Containerization", "Docker Compose", "Container security"] },
    sre: { title: "Site Reliability Engineer", difficulty: "advanced", duration: "14-20 months", category: "Cloud & DevOps", outcomes: ["System reliability", "Incident response", "SLO/SLI"] },
    cybersec: { title: "Cybersecurity Analyst", difficulty: "beginner", duration: "8-14 months", category: "Security", outcomes: ["Threat detection", "Security monitoring", "Incident response"] },
    pentest: { title: "Penetration Tester", difficulty: "advanced", duration: "12-18 months", category: "Security", outcomes: ["Ethical hacking", "Vulnerability assessment", "Red teaming"] },
    seclengineer: { title: "Security Engineer", difficulty: "intermediate", duration: "12-18 months", category: "Security", outcomes: ["Secure applications", "Penetration testing", "Compliance"] },
    ethicalh: { title: "Ethical Hacker", difficulty: "advanced", duration: "14-20 months", category: "Security", outcomes: ["Offensive security", "CTF competitions", "Bug bounty"] },
    socanalyst: { title: "SOC Analyst", difficulty: "beginner", duration: "6-12 months", category: "Security", outcomes: ["Security monitoring", "SIEM management", "Threat hunting"] },
    qaeng: { title: "QA Engineer", difficulty: "beginner", duration: "6-10 months", category: "QA", outcomes: ["Manual testing", "Test automation", "Quality processes"] },
    autoTest: { title: "Automation Test Engineer", difficulty: "intermediate", duration: "8-12 months", category: "QA", outcomes: ["Automated tests", "Selenium/Cypress", "CI/CD integration"] },
    perfTest: { title: "Performance Test Engineer", difficulty: "advanced", duration: "10-14 months", category: "QA", outcomes: ["Load testing", "JMeter/Locust", "Performance optimization"] },
    sqldev: { title: "SQL Developer", difficulty: "beginner", duration: "4-8 months", category: "Database", outcomes: ["Complex queries", "Database design", "Query optimization"] },
    dba: { title: "Database Administrator", difficulty: "intermediate", duration: "8-14 months", category: "Database", outcomes: ["DB administration", "Backup/recovery", "Performance tuning"] },
    dataeng: { title: "Data Engineer", difficulty: "intermediate", duration: "10-16 months", category: "Database", outcomes: ["Data pipelines", "ETL processes", "Big data tools"] },
    uidesigner: { title: "UI Designer", difficulty: "beginner", duration: "6-10 months", category: "Design", outcomes: ["User interfaces", "Design systems", "Figma mastery"] },
    uxdesigner: { title: "UX Designer", difficulty: "intermediate", duration: "8-14 months", category: "Design", outcomes: ["User research", "Wireframing", "Usability testing"] },
    proddes: { title: "Product Designer", difficulty: "intermediate", duration: "10-16 months", category: "Design", outcomes: ["End-to-end design", "Design strategy", "Design systems"] },
    product: { title: "Product Manager", difficulty: "intermediate", duration: "12-18 months", category: "Product", outcomes: ["Drive product strategy", "Lead cross-functional teams", "Launch products"] },
    techpm: { title: "Technical Product Manager", difficulty: "advanced", duration: "14-20 months", category: "Product", outcomes: ["Technical product strategy", "API products", "Platform products"] },
    projmgr: { title: "Project Manager", difficulty: "beginner", duration: "6-12 months", category: "Product", outcomes: ["Project planning", "Agile/Scrum", "Stakeholder management"] },
    scrummaster: { title: "Scrum Master", difficulty: "intermediate", duration: "6-10 months", category: "Product", outcomes: ["Scrum ceremonies", "Team facilitation", "Agile coaching"] },
    blockch: { title: "Blockchain Developer", difficulty: "advanced", duration: "14-20 months", category: "Blockchain", outcomes: ["Smart contracts", "DApps", "Web3 integration"] },
    solidity: { title: "Solidity Developer", difficulty: "advanced", duration: "12-18 months", category: "Blockchain", outcomes: ["Solidity contracts", "EVM", "DeFi protocols"] },
    web3dev: { title: "Web3 Developer", difficulty: "advanced", duration: "14-20 months", category: "Blockchain", outcomes: ["Web3 apps", "Wallet integration", "dApp development"] },
    unitydev: { title: "Unity Developer", difficulty: "intermediate", duration: "12-18 months", category: "Game Development", outcomes: ["2D/3D games", "C# scripting", "Unity physics"] },
    unrealdev: { title: "Unreal Engine Developer", difficulty: "advanced", duration: "16-24 months", category: "Game Development", outcomes: ["AAA games", "Blueprints/C++", "Unreal physics"] },
    gamedev: { title: "Game Developer", difficulty: "intermediate", duration: "12-18 months", category: "Game Development", outcomes: ["Game mechanics", "Multiplayer", "Game optimization"] },
    ardev: { title: "AR Developer", difficulty: "advanced", duration: "12-18 months", category: "Emerging Tech", outcomes: ["AR experiences", "ARKit/ARCore", "Spatial computing"] },
    vrdev: { title: "VR Developer", difficulty: "advanced", duration: "14-20 months", category: "Emerging Tech", outcomes: ["VR experiences", "Unity/Unreal VR", "Spatial computing"] },
    ioteng: { title: "IoT Engineer", difficulty: "intermediate", duration: "12-18 months", category: "Emerging Tech", outcomes: ["IoT devices", "Sensor integration", "Embedded systems"] },
    roboeng: { title: "Robotics Engineer", difficulty: "advanced", duration: "16-24 months", category: "Emerging Tech", outcomes: ["Robotics systems", "ROS", "Computer vision"] },
  },
  skillMap: {
    frontend: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Git", "REST APIs", "Responsive Design"],
    backend: ["Node.js", "Python", "Java", "PostgreSQL", "MongoDB", "Redis", "Docker", "Git", "REST APIs", "System Design"],
    fullstack: ["HTML", "CSS", "JavaScript", "React", "Node.js", "PostgreSQL", "MongoDB", "Docker", "TypeScript", "Git", "REST APIs", "System Design"],
    jsdev: ["JavaScript", "ES6+", "Node.js", "React", "TypeScript", "Git", "REST APIs", "Testing"],
    tsdev: ["TypeScript", "JavaScript", "React", "Node.js", "Generics", "Advanced Types", "Git", "Testing"],
    reactdev: ["React", "JavaScript", "TypeScript", "Hooks", "State Management", "REST APIs", "Git", "Testing"],
    nextdev: ["Next.js", "React", "TypeScript", "JavaScript", "REST APIs", "PostgreSQL", "Git", "Tailwind CSS"],
    vuedev: ["Vue.js", "JavaScript", "TypeScript", "Vuex/Pinia", "REST APIs", "Git", "Testing", "Vue Router"],
    angdev: ["Angular", "TypeScript", "RxJS", "NgRx", "REST APIs", "Git", "Testing", "CSS/SCSS"],
    android: ["Kotlin", "Java", "Android SDK", "Jetpack Compose", "Firebase", "REST APIs", "Git", "SQLite"],
    iosdev: ["Swift", "SwiftUI", "UIKit", "Core Data", "Firebase", "REST APIs", "Git", "Xcode"],
    flutterdev: ["Flutter", "Dart", "Firebase", "REST APIs", "Git", "State Management", "SQLite", "Widgets"],
    rndev: ["React Native", "JavaScript", "TypeScript", "Redux", "Firebase", "REST APIs", "Git", "Native Modules"],
    pydev: ["Python", "Django", "Flask", "PostgreSQL", "Git", "REST APIs", "Testing", "Docker"],
    javadev: ["Java", "Spring Boot", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "Git", "Microservices"],
    csdev: ["C#", ".NET Core", "ASP.NET", "SQL Server", "Azure", "Git", "REST APIs", "Docker"],
    godev: ["Go", "PostgreSQL", "Docker", "gRPC", "REST APIs", "Git", "Concurrency", "Testing"],
    rustdev: ["Rust", "Cargo", "WebAssembly", "PostgreSQL", "Git", "Systems Programming", "Concurrency", "Testing"],
    phpdev: ["PHP", "Laravel", "MySQL", "JavaScript", "HTML/CSS", "Git", "REST APIs", "Livewire"],
    kotlindev: ["Kotlin", "Spring Boot", "PostgreSQL", "Docker", "Git", "REST APIs", "Kotlin Multiplatform", "Testing"],
    dataanalyst: ["SQL", "Python", "Excel", "Tableau", "Power BI", "Statistics", "Data Cleaning", "Data Visualization"],
    datascience: ["Python", "SQL", "Statistics", "Machine Learning", "TensorFlow", "Pandas", "NumPy", "Data Visualization"],
    mlengineer: ["Python", "TensorFlow", "PyTorch", "MLOps", "Docker", "Kubernetes", "SQL", "Statistics"],
    aiengineer: ["Python", "PyTorch", "LLMs", "RAG", "AI Agents", "Docker", "FastAPI", "MCP", "Vector Databases", "LangChain"],
    dlengineer: ["Python", "PyTorch", "TensorFlow", "CNNs", "RNNs", "Transformers", "Computer Vision", "NLP"],
    nlpengineer: ["Python", "NLP", "Transformers", "BERT", "GPT", "Hugging Face", "PyTorch", "spaCy"],
    cvengineer: ["Python", "Computer Vision", "OpenCV", "YOLO", "CNNs", "PyTorch", "Image Processing", "TensorFlow"],
    prompteng: ["Prompt Engineering", "LLMs", "Python", "AI Agents", "RAG", "LangChain", "API Integration", "Testing"],
    llmeng: ["Python", "LLMs", "Fine-tuning", "RAG", "AI Agents", "PyTorch", "Docker", "LangChain", "MCP", "Vector Databases"],
    genaien: ["Python", "Generative AI", "Diffusion Models", "GANs", "Transformers", "PyTorch", "ComfyUI", "Docker"],
    devops: ["Linux", "Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Python", "Bash"],
    clouden: ["AWS", "GCP", "Azure", "Terraform", "Docker", "Kubernetes", "Networking", "CI/CD"],
    awsdev: ["AWS", "EC2", "S3", "Lambda", "DynamoDB", "API Gateway", "CloudFormation", "Docker"],
    azuredev: ["Azure", "Azure VMs", "Azure Functions", "Azure DevOps", "Azure SQL", "AKS", "Docker", "Terraform"],
    gcpdev: ["GCP", "Compute Engine", "Cloud Storage", "BigQuery", "GKE", "Cloud Functions", "Docker", "Terraform"],
    k8seng: ["Kubernetes", "Docker", "Helm", "Istio", "Linux", "Networking", "Monitoring", "Go/Python"],
    dockereng: ["Docker", "Docker Compose", "Kubernetes", "Linux", "CI/CD", "Security", "Monitoring", "Swarm"],
    sre: ["Linux", "Kubernetes", "Prometheus", "Grafana", "Python/Go", "Incident Management", "SLO/SLI", "Automation"],
    cybersec: ["Network Security", "SIEM", "Threat Intelligence", "Python", "Linux", "Incident Response", "Compliance", "Risk Assessment"],
    pentest: ["Penetration Testing", "Web Security", "Network Security", "Python", "Kali Linux", "Burp Suite", "Metasploit", "Exploit Development"],
    seclengineer: ["Network Security", "Cryptography", "Penetration Testing", "Python", "Linux", "Web Security", "Cloud Security", "Identity Management"],
    ethicalh: ["Ethical Hacking", "Penetration Testing", "Bug Bounty", "Python", "Kali Linux", "Social Engineering", "Reverse Engineering", "CTF"],
    socanalyst: ["SIEM", "Log Analysis", "Threat Detection", "Incident Response", "Networking", "Linux", "Windows Security", "Python"],
    qaeng: ["Manual Testing", "Test Automation", "Selenium", "JIRA", "API Testing", "SQL", "Agile", "Test Cases"],
    autoTest: ["Selenium", "Cypress", "API Testing", "Postman", "CI/CD", "JavaScript/Python", "Test Automation", "Framework Design"],
    perfTest: ["JMeter", "LoadRunner", "Gatling", "Performance Testing", "Monitoring", "Linux", "Database Tuning", "Network Analysis"],
    sqldev: ["SQL", "MySQL", "PostgreSQL", "Query Optimization", "Database Design", "Stored Procedures", "Indexing", "Normalization"],
    dba: ["PostgreSQL", "MySQL", "Oracle", "MongoDB", "Backup/Recovery", "Performance Tuning", "Security", "Replication"],
    dataeng: ["Python", "SQL", "Spark", "Airflow", "Data Warehousing", "ETL", "AWS/GCP", "Kafka", "Docker"],
    uidesigner: ["Figma", "Sketch", "Adobe XD", "Design Systems", "Typography", "Color Theory", "Prototyping", "User Research"],
    uxdesigner: ["User Research", "Wireframing", "Prototyping", "Usability Testing", "Figma", "Information Architecture", "Interaction Design", "Accessibility"],
    proddes: ["Figma", "Design Systems", "User Research", "Prototyping", "Visual Design", "Interaction Design", "Design Strategy", "Product Thinking"],
    product: ["Product Strategy", "User Research", "Analytics", "A/B Testing", "Agile", "SQL", "Communication", "Roadmapping"],
    techpm: ["Product Strategy", "API Design", "System Design", "Analytics", "Agile", "SQL", "Communication", "Technical Architecture"],
    projmgr: ["Project Management", "Agile/Scrum", "JIRA", "Risk Management", "Stakeholder Management", "Communication", "Budgeting", "Team Leadership"],
    scrummaster: ["Scrum", "Agile", "Facilitation", "Coaching", "JIRA/Confluence", "Conflict Resolution", "Continuous Improvement", "Team Dynamics"],
    blockch: ["Blockchain", "Solidity", "Ethereum", "Smart Contracts", "Web3.js", "Hardhat", "JavaScript", "Security"],
    solidity: ["Solidity", "EVM", "Smart Contracts", "OpenZeppelin", "Hardhat", "Foundry", "DeFi", "Blockchain Security"],
    web3dev: ["Web3.js", "Ethers.js", "React", "Solidity", "IPFS", "Smart Contracts", "Blockchain", "TypeScript"],
    unitydev: ["Unity", "C#", "3D Graphics", "Physics", "Animation", "UI Systems", "Optimization", "Git"],
    unrealdev: ["Unreal Engine", "C++", "Blueprints", "3D Graphics", "Physics", "Animation", "Optimization", "Multiplayer"],
    gamedev: ["Unity", "Unreal", "C#", "C++", "Game Design", "Physics", "Animation", "Optimization"],
    ardev: ["ARKit", "ARCore", "Unity", "C#", "3D Graphics", "Computer Vision", "Spatial Computing", "Swift/Kotlin"],
    vrdev: ["Unity VR", "Unreal VR", "C#", "C++", "3D Graphics", "Spatial Computing", "Optimization", "Interaction Design"],
    ioteng: ["Embedded Systems", "C/C++", "Python", "MQTT", "Sensors", "Arduino", "Raspberry Pi", "IoT Protocols"],
    roboeng: ["ROS", "C++", "Python", "Computer Vision", "Control Systems", "SLAM", "Kinematics", "Sensor Fusion"],
  },
  resources: {
    "JavaScript": [
      { title: "JavaScript.info", url: "https://javascript.info", type: "documentation", platform: "javascript.info", isFree: true },
      { title: "You Don't Know JS", url: "https://github.com/getify/You-Dont-Know-JS", type: "book", platform: "GitHub", isFree: true },
      { title: "JavaScript30", url: "https://javascript30.com", type: "course", platform: "wesbos", isFree: true },
      { title: "freeCodeCamp JavaScript", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", type: "tutorial", platform: "freeCodeCamp", isFree: true },
      { title: "MDN JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", type: "documentation", platform: "MDN", isFree: true },
      { title: "Namaste JavaScript (YouTube)", url: "https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP", type: "video", platform: "YouTube", isFree: true },
      { title: "JavaScript Algorithms", url: "https://github.com/trekhleb/javascript-algorithms", type: "github", platform: "GitHub", isFree: true },
      { title: "The Complete JavaScript Course (Udemy)", url: "https://www.udemy.com/course/the-complete-javascript-course/", type: "course", platform: "Udemy", isFree: false, rating: 4.7 },
    ],
    "React": [
      { title: "React Docs", url: "https://react.dev", type: "documentation", platform: "react.dev", isFree: true },
      { title: "Epic React (Kent C. Dodds)", url: "https://epicreact.dev", type: "course", platform: "Epic React", isFree: false, rating: 4.9 },
      { title: "React Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=bMknfKXIFA8", type: "video", platform: "YouTube", isFree: true },
      { title: "React Projects (roadmap.sh)", url: "https://roadmap.sh/react", type: "documentation", platform: "roadmap.sh", isFree: true },
      { title: "Awesome React", url: "https://github.com/enaqx/awesome-react", type: "github", platform: "GitHub", isFree: true },
      { title: "React - The Complete Guide (Udemy)", url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/", type: "course", platform: "Udemy", isFree: false, rating: 4.6 },
    ],
    "Node.js": [
      { title: "Node.js Docs", url: "https://nodejs.org/docs/latest/api/", type: "documentation", platform: "nodejs.org", isFree: true },
      { title: "Node.js Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=Oe421EPjeBE", type: "video", platform: "YouTube", isFree: true },
      { title: "Node.js Design Patterns", url: "https://www.nodejsdesignpatterns.com", type: "book", platform: "Book", isFree: false, rating: 4.5 },
      { title: "The Odin Project Node.js", url: "https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs", type: "tutorial", platform: "The Odin Project", isFree: true },
      { title: "Node.js Best Practices", url: "https://github.com/goldbergyoni/nodebestpractices", type: "github", platform: "GitHub", isFree: true },
    ],
    "Python": [
      { title: "Python.org Docs", url: "https://docs.python.org/3/", type: "documentation", platform: "python.org", isFree: true },
      { title: "Automate the Boring Stuff", url: "https://automatetheboringstuff.com", type: "book", platform: "Book", isFree: true },
      { title: "Python for Everybody", url: "https://www.coursera.org/specializations/python", type: "course", platform: "Coursera", isFree: true },
      { title: "Real Python Tutorials", url: "https://realpython.com", type: "tutorial", platform: "Real Python", isFree: true },
      { title: "Corey Schafer Python (YouTube)", url: "https://www.youtube.com/playlist?list=PL-osiE80TeTt2d9bfVyTiXJA-UTHn6WwU", type: "video", platform: "YouTube", isFree: true },
    ],
    "Docker": [
      { title: "Docker Docs", url: "https://docs.docker.com", type: "documentation", platform: "docker.com", isFree: true },
      { title: "Docker for Beginners", url: "https://github.com/docker/labs/tree/master/beginner/", type: "tutorial", platform: "GitHub", isFree: true },
      { title: "Docker Mastery (Udemy)", url: "https://www.udemy.com/course/docker-mastery/", type: "course", platform: "Udemy", isFree: false, rating: 4.7 },
      { title: "Docker Curriculum", url: "https://docker-curriculum.com", type: "tutorial", platform: "docker-curriculum.com", isFree: true },
    ],
    "TypeScript": [
      { title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/", type: "documentation", platform: "typescriptlang.org", isFree: true },
      { title: "TypeScript Deep Dive", url: "https://basarat.gitbook.io/typescript/", type: "book", platform: "GitBook", isFree: true },
      { title: "TypeScript Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=30LWjhZzg50", type: "video", platform: "YouTube", isFree: true },
      { title: "Understanding TypeScript (Udemy)", url: "https://www.udemy.com/course/understanding-typescript/", type: "course", platform: "Udemy", isFree: false, rating: 4.7 },
    ],
    "PostgreSQL": [
      { title: "PostgreSQL Docs", url: "https://www.postgresql.org/docs/", type: "documentation", platform: "postgresql.org", isFree: true },
      { title: "PostgreSQL Tutorial", url: "https://www.postgresqltutorial.com", type: "tutorial", platform: "postgresqltutorial.com", isFree: true },
      { title: "SQL & PostgreSQL (freeCodeCamp)", url: "https://www.youtube.com/watch?v=qw--VYLpxG4", type: "video", platform: "YouTube", isFree: true },
    ],
    "MongoDB": [
      { title: "MongoDB Docs", url: "https://www.mongodb.com/docs/", type: "documentation", platform: "mongodb.com", isFree: true },
      { title: "MongoDB University", url: "https://university.mongodb.com", type: "course", platform: "MongoDB University", isFree: true },
      { title: "The Complete MongoDB Course (Udemy)", url: "https://www.udemy.com/course/mongodb-the-complete-developers-guide/", type: "course", platform: "Udemy", isFree: false, rating: 4.5 },
    ],
    "AWS": [
      { title: "AWS Docs", url: "https://docs.aws.amazon.com", type: "documentation", platform: "aws.amazon.com", isFree: true },
      { title: "AWS Skill Builder", url: "https://explore.skillbuilder.aws/learn", type: "course", platform: "AWS", isFree: true },
      { title: "AWS Certified Solutions Architect (Udemy)", url: "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/", type: "course", platform: "Udemy", isFree: false, rating: 4.7 },
      { title: "freeCodeCamp AWS Course", url: "https://www.youtube.com/watch?v=3hLmDS179YE", type: "video", platform: "YouTube", isFree: true },
    ],
    "Kubernetes": [
      { title: "Kubernetes Docs", url: "https://kubernetes.io/docs/", type: "documentation", platform: "kubernetes.io", isFree: true },
      { title: "Kubernetes Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=X48VuDVv0do", type: "video", platform: "YouTube", isFree: true },
      { title: "Kubernetes the Hard Way", url: "https://github.com/kelseyhightower/kubernetes-the-hard-way", type: "tutorial", platform: "GitHub", isFree: true },
      { title: "CKA Certification Course (Udemy)", url: "https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/", type: "course", platform: "Udemy", isFree: false, rating: 4.8 },
    ],
    "System Design": [
      { title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "github", platform: "GitHub", isFree: true },
      { title: "Grokking the System Design Interview", url: "https://www.designgurus.org/course/grokking-the-system-design-interview", type: "course", platform: "DesignGurus", isFree: false, rating: 4.6 },
      { title: "System Design Interview (YouTube)", url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiHQVg0wFIwqQqEDL5D8bBxp", type: "video", platform: "YouTube", isFree: true },
      { title: "ByteByteGo", url: "https://www.youtube.com/c/ByteByteGo", type: "video", platform: "YouTube", isFree: true },
    ],
    "Git": [
      { title: "Git SCM Docs", url: "https://git-scm.com/doc", type: "documentation", platform: "git-scm.com", isFree: true },
      { title: "Learn Git Branching", url: "https://learngitbranching.js.org", type: "practice", platform: "learngitbranching.js.org", isFree: true },
      { title: "Git & GitHub Crash Course (freeCodeCamp)", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", type: "video", platform: "YouTube", isFree: true },
    ],
    "TensorFlow": [
      { title: "TensorFlow Docs", url: "https://www.tensorflow.org/learn", type: "documentation", platform: "tensorflow.org", isFree: true },
      { title: "TensorFlow 2.0 Complete Course (freeCodeCamp)", url: "https://www.youtube.com/watch?v=tPYj3fFJGjk", type: "video", platform: "YouTube", isFree: true },
      { title: "DeepLearning.AI TensorFlow Specialization", url: "https://www.coursera.org/specializations/tensorflow-in-practice", type: "course", platform: "Coursera", isFree: false, rating: 4.7 },
    ],
    "CI/CD": [
      { title: "GitHub Actions Docs", url: "https://docs.github.com/en/actions", type: "documentation", platform: "github.com", isFree: true },
      { title: "CI/CD Pipeline Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=eB0nUzAI7M8", type: "video", platform: "YouTube", isFree: true },
      { title: "Jenkins User Documentation", url: "https://www.jenkins.io/doc/", type: "documentation", platform: "jenkins.io", isFree: true },
    ],
    "Data Structures & Algorithms": [
      { title: "LeetCode", url: "https://leetcode.com", type: "practice", platform: "LeetCode", isFree: true },
      { title: "AlgoExpert", url: "https://www.algoexpert.io", type: "course", platform: "AlgoExpert", isFree: false, rating: 4.8 },
      { title: "NeetCode (YouTube)", url: "https://www.youtube.com/c/NeetCode", type: "video", platform: "YouTube", isFree: true },
      { title: "GeeksforGeeks DSA", url: "https://www.geeksforgeeks.org/data-structures/", type: "tutorial", platform: "GeeksforGeeks", isFree: true },
      { title: "Cracking the Coding Interview (Book)", url: "https://www.crackingthecodinginterview.com", type: "book", platform: "Book", isFree: false, rating: 4.7 },
    ],
    "SQL": [
      { title: "SQLZoo", url: "https://sqlzoo.net", type: "practice", platform: "SQLZoo", isFree: true },
      { title: "Mode SQL Tutorial", url: "https://mode.com/sql-tutorial/", type: "tutorial", platform: "Mode", isFree: true },
      { title: "SQL for Data Science (Coursera)", url: "https://www.coursera.org/learn/sql-for-data-science", type: "course", platform: "Coursera", isFree: true },
      { title: "LeetCode Database Problems", url: "https://leetcode.com/problemset/database/", type: "practice", platform: "LeetCode", isFree: true },
    ],
    "Go": [
      { title: "Go by Example", url: "https://gobyexample.com", type: "tutorial", platform: "Go by Example", isFree: true },
      { title: "Effective Go", url: "https://go.dev/doc/effective_go", type: "documentation", platform: "go.dev", isFree: true },
      { title: "Go Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=YS4e4q9oBaU", type: "video", platform: "YouTube", isFree: true },
      { title: "The Go Programming Language (Book)", url: "https://www.gopl.io", type: "book", platform: "Book", isFree: false, rating: 4.8 },
      { title: "Go Web Apps", url: "https://github.com/astaxie/build-web-application-with-golang", type: "tutorial", platform: "GitHub", isFree: true },
    ],
    "Rust": [
      { title: "The Rust Book", url: "https://doc.rust-lang.org/book/", type: "documentation", platform: "rust-lang.org", isFree: true },
      { title: "Rust by Example", url: "https://doc.rust-lang.org/rust-by-example/", type: "tutorial", platform: "rust-lang.org", isFree: true },
      { title: "Rustlings", url: "https://github.com/rust-lang/rustlings", type: "practice", platform: "GitHub", isFree: true },
      { title: "Rust in Action (Book)", url: "https://www.manning.com/books/rust-in-action", type: "book", platform: "Manning", isFree: false, rating: 4.6 },
      { title: "Comprehensive Rust (Google)", url: "https://google.github.io/comprehensive-rust/", type: "course", platform: "Google", isFree: true },
    ],
    "Kotlin": [
      { title: "Kotlin Docs", url: "https://kotlinlang.org/docs/home.html", type: "documentation", platform: "kotlinlang.org", isFree: true },
      { title: "Kotlin Koans", url: "https://play.kotlinlang.org/koans", type: "practice", platform: "JetBrains", isFree: true },
      { title: "Kotlin for Beginners (YouTube)", url: "https://www.youtube.com/playlist?list=PLQkwcJG4YTCQ6yXHi1F9mYf5F7PJ0HmK-", type: "video", platform: "YouTube", isFree: true },
      { title: "Android Basics in Kotlin", url: "https://developer.android.com/courses/android-basics-kotlin/course", type: "course", platform: "Google", isFree: true },
    ],
    "Flutter": [
      { title: "Flutter Docs", url: "https://docs.flutter.dev", type: "documentation", platform: "flutter.dev", isFree: true },
      { title: "Flutter Codelabs", url: "https://docs.flutter.dev/codelabs", type: "tutorial", platform: "Google", isFree: true },
      { title: "Flutter Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=pTJJsmejUOQ", type: "video", platform: "YouTube", isFree: true },
      { title: "The Complete Flutter Course (Udemy)", url: "https://www.udemy.com/course/learn-flutter-dart-to-build-ios-android-apps/", type: "course", platform: "Udemy", isFree: false, rating: 4.6 },
    ],
    "Swift": [
      { title: "Swift Docs", url: "https://docs.swift.org/swift-book/", type: "documentation", platform: "swift.org", isFree: true },
      { title: "100 Days of SwiftUI", url: "https://www.hackingwithswift.com/100/swiftui", type: "course", platform: "Hacking with Swift", isFree: true },
      { title: "Apple Developer Documentation", url: "https://developer.apple.com/documentation/", type: "documentation", platform: "Apple", isFree: true },
      { title: "iOS Academy (YouTube)", url: "https://www.youtube.com/c/iOSAcademy", type: "video", platform: "YouTube", isFree: true },
    ],
    "Dart": [
      { title: "Dart Docs", url: "https://dart.dev/guides", type: "documentation", platform: "dart.dev", isFree: true },
      { title: "Dart Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=5xlVP04905w", type: "video", platform: "YouTube", isFree: true },
      { title: "Dart Codelabs", url: "https://dart.dev/codelabs", type: "tutorial", platform: "Google", isFree: true },
    ],
    "Java": [
      { title: "Java Tutorials", url: "https://docs.oracle.com/javase/tutorial/", type: "documentation", platform: "Oracle", isFree: true },
      { title: "Spring Boot Guide", url: "https://spring.io/guides", type: "tutorial", platform: "Spring", isFree: true },
      { title: "Java Programming (freeCodeCamp)", url: "https://www.youtube.com/watch?v=drQK8ciCAjY", type: "video", platform: "YouTube", isFree: true },
      { title: "Baeldung", url: "https://www.baeldung.com", type: "tutorial", platform: "Baeldung", isFree: true },
      { title: "Java Design Patterns", url: "https://github.com/iluwatar/java-design-patterns", type: "github", platform: "GitHub", isFree: true },
    ],
    "C#": [
      { title: "C# Documentation", url: "https://docs.microsoft.com/en-us/dotnet/csharp/", type: "documentation", platform: "Microsoft", isFree: true },
      { title: "ASP.NET Core Docs", url: "https://docs.microsoft.com/en-us/aspnet/core/", type: "documentation", platform: "Microsoft", isFree: true },
      { title: "C# Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=GhQdlIFylQ8", type: "video", platform: "YouTube", isFree: true },
      { title: ".NET Microservices", url: "https://dotnet.microsoft.com/en-us/learn/aspnet/microservices-architecture", type: "tutorial", platform: "Microsoft", isFree: true },
    ],
    "PHP": [
      { title: "PHP Documentation", url: "https://www.php.net/docs.php", type: "documentation", platform: "php.net", isFree: true },
      { title: "Laravel Docs", url: "https://laravel.com/docs", type: "documentation", platform: "laravel.com", isFree: true },
      { title: "PHP Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=WY5NYM1I4lE", type: "video", platform: "YouTube", isFree: true },
      { title: "Laravel from Scratch", url: "https://laracasts.com/series/laravel-8-from-scratch", type: "course", platform: "Laracasts", isFree: true },
    ],
    "Vue.js": [
      { title: "Vue.js Docs", url: "https://vuejs.org/guide/introduction.html", type: "documentation", platform: "vuejs.org", isFree: true },
      { title: "Vue Mastery", url: "https://www.vuemastery.com", type: "course", platform: "Vue Mastery", isFree: false, rating: 4.5 },
      { title: "Vue.js Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=FXpIoQ_rT_c", type: "video", platform: "YouTube", isFree: true },
      { title: "Awesome Vue", url: "https://github.com/vuejs/awesome-vue", type: "github", platform: "GitHub", isFree: true },
    ],
    "Angular": [
      { title: "Angular Docs", url: "https://angular.dev", type: "documentation", platform: "angular.dev", isFree: true },
      { title: "Angular Tutorial (Tour of Heroes)", url: "https://angular.dev/tutorial", type: "tutorial", platform: "angular.dev", isFree: true },
      { title: "Angular for Beginners (YouTube)", url: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbk4FsTfLqTlvrE6O5e2C3w0", type: "video", platform: "YouTube", isFree: true },
      { title: "Ultimate Angular", url: "https://ultimatecourses.com/", type: "course", platform: "Ultimate Courses", isFree: false, rating: 4.7 },
    ],
    "Next.js": [
      { title: "Next.js Docs", url: "https://nextjs.org/docs", type: "documentation", platform: "nextjs.org", isFree: true },
      { title: "Next.js Learn", url: "https://nextjs.org/learn", type: "tutorial", platform: "Vercel", isFree: true },
      { title: "Next.js Tutorial (YouTube)", url: "https://www.youtube.com/watch?v=KjY94sAKnWg", type: "video", platform: "YouTube", isFree: true },
      { title: "Next.js Course (Codevolution)", url: "https://www.youtube.com/playlist?list=PLC3y8-rFHvwgC9mj0qv972IO5DmD-H0ol", type: "video", platform: "YouTube", isFree: true },
    ],
    "Tableau": [
      { title: "Tableau Public", url: "https://public.tableau.com", type: "practice", platform: "Tableau", isFree: true },
      { title: "Tableau Tutorials", url: "https://www.tableau.com/learn/tutorials", type: "tutorial", platform: "Tableau", isFree: true },
    ],
    "Power BI": [
      { title: "Power BI Docs", url: "https://docs.microsoft.com/en-us/power-bi/", type: "documentation", platform: "Microsoft", isFree: true },
      { title: "Power BI Guided Learning", url: "https://docs.microsoft.com/en-us/power-bi/guided-learning/", type: "tutorial", platform: "Microsoft", isFree: true },
    ],
    "Figma": [
      { title: "Figma Learn", url: "https://www.figma.com/resources/learn-design/", type: "tutorial", platform: "Figma", isFree: true },
      { title: "Figma 101 (YouTube)", url: "https://www.youtube.com/c/Figma", type: "video", platform: "YouTube", isFree: true },
      { title: "Design Systems with Figma", url: "https://www.figma.com/community/file/896793830748970293", type: "tutorial", platform: "Figma", isFree: true },
    ],
    "Unity": [
      { title: "Unity Learn", url: "https://learn.unity.com", type: "course", platform: "Unity", isFree: true },
      { title: "Unreal Engine Docs", url: "https://docs.unrealengine.com", type: "documentation", platform: "Epic Games", isFree: true },
      { title: "Unity Tutorials (YouTube)", url: "https://www.youtube.com/user/Unity3D", type: "video", platform: "YouTube", isFree: true },
    ],
    "Solidity": [
      { title: "Solidity Docs", url: "https://docs.soliditylang.org", type: "documentation", platform: "soliditylang.org", isFree: true },
      { title: "Cryptozombies", url: "https://cryptozombies.io", type: "course", platform: "CryptoZombies", isFree: true },
      { title: "Ethereum Dev (freeCodeCamp)", url: "https://www.youtube.com/watch?v=gyMwXuJrbJQ", type: "video", platform: "YouTube", isFree: true },
    ],
    "OpenCV": [
      { title: "OpenCV Docs", url: "https://docs.opencv.org", type: "documentation", platform: "opencv.org", isFree: true },
      { title: "OpenCV Tutorials", url: "https://docs.opencv.org/master/d9/df8/tutorial_root.html", type: "tutorial", platform: "OpenCV", isFree: true },
      { title: "Computer Vision (freeCodeCamp)", url: "https://www.youtube.com/watch?v=oXlwWbU8l2o", type: "video", platform: "YouTube", isFree: true },
    ],
    "Prompt Engineering": [
      { title: "OpenAI Prompt Guide", url: "https://platform.openai.com/docs/guides/prompt-engineering", type: "documentation", platform: "OpenAI", isFree: true },
      { title: "Prompt Engineering Guide", url: "https://www.promptingguide.ai", type: "tutorial", platform: "DAIR.AI", isFree: true },
      { title: "Learn Prompting", url: "https://learnprompting.org", type: "course", platform: "Learn Prompting", isFree: true },
      { title: "Brev.dev Prompt Engineering", url: "https://brev.dev/blog", type: "tutorial", platform: "Brev", isFree: true },
    ],
    "LLMs": [
      { title: "Hugging Face Docs", url: "https://huggingface.co/docs", type: "documentation", platform: "Hugging Face", isFree: true },
      { title: "LLM Course (YouTube)", url: "https://www.youtube.com/playlist?list=PLpzvKp4e3Eo_7yJ7vSYXsDOPOkiPFkQ2D", type: "video", platform: "YouTube", isFree: true },
      { title: "LangChain Docs", url: "https://python.langchain.com/docs", type: "documentation", platform: "LangChain", isFree: true },
      { title: "LLM University (Cohere)", url: "https://docs.cohere.com/docs/llmu", type: "course", platform: "Cohere", isFree: true },
    ],
    "RAG": [
      { title: "LangChain RAG Guide", url: "https://python.langchain.com/docs/use_cases/question_answering/", type: "tutorial", platform: "LangChain", isFree: true },
      { title: "RAG from Scratch (YouTube)", url: "https://www.youtube.com/playlist?list=PLfaIDFEXuae2LXbO1_PKyE9Z_TUyl3Cj1", type: "video", platform: "YouTube", isFree: true },
      { title: "LlamaIndex Docs", url: "https://docs.llamaindex.ai", type: "documentation", platform: "LlamaIndex", isFree: true },
    ],
    "AI Agents": [
      { title: "LangGraph Docs", url: "https://langchain-ai.github.io/langgraph/", type: "documentation", platform: "LangChain", isFree: true },
      { title: "CrewAI Docs", url: "https://docs.crewai.com", type: "documentation", platform: "CrewAI", isFree: true },
      { title: "AutoGen Docs", url: "https://microsoft.github.io/autogen/", type: "documentation", platform: "Microsoft", isFree: true },
      { title: "AI Agents Course (deeplearning.ai)", url: "https://www.deeplearning.ai/short-courses/", type: "course", platform: "DeepLearning.AI", isFree: false, rating: 4.8 },
    ],
    "MCP": [
      { title: "Model Context Protocol", url: "https://modelcontextprotocol.io", type: "documentation", platform: "Anthropic", isFree: true },
      { title: "MCP Specification", url: "https://spec.modelcontextprotocol.io", type: "documentation", platform: "Anthropic", isFree: true },
      { title: "MCP GitHub", url: "https://github.com/modelcontextprotocol", type: "github", platform: "GitHub", isFree: true },
    ],
    "Vector Databases": [
      { title: "Pinecone Docs", url: "https://docs.pinecone.io", type: "documentation", platform: "Pinecone", isFree: true },
      { title: "Qdrant Docs", url: "https://qdrant.tech/documentation/", type: "documentation", platform: "Qdrant", isFree: true },
      { title: "Chroma Docs", url: "https://docs.trychroma.com", type: "documentation", platform: "Chroma", isFree: true },
      { title: "Weaviate Docs", url: "https://weaviate.io/developers/weaviate", type: "documentation", platform: "Weaviate", isFree: true },
    ],
    "FastAPI": [
      { title: "FastAPI Docs", url: "https://fastapi.tiangolo.com", type: "documentation", platform: "FastAPI", isFree: true },
      { title: "FastAPI Course (freeCodeCamp)", url: "https://www.youtube.com/watch?v=0sOvCWFmrtA", type: "video", platform: "YouTube", isFree: true },
      { title: "Full Stack FastAPI Template", url: "https://github.com/tiangolo/full-stack-fastapi-template", type: "github", platform: "GitHub", isFree: true },
    ],
    "ROS": [
      { title: "ROS Documentation", url: "https://docs.ros.org", type: "documentation", platform: "ROS", isFree: true },
      { title: "ROS Tutorials", url: "https://wiki.ros.org/ROS/Tutorials", type: "tutorial", platform: "ROS", isFree: true },
      { title: "ROS 2 Basics (YouTube)", url: "https://www.youtube.com/playlist?list=PLK0b4e05LnzYNB6F11bCCbsuOHdfN0QjX", type: "video", platform: "YouTube", isFree: true },
    ],
    "Selenium": [
      { title: "Selenium Docs", url: "https://www.selenium.dev/documentation/", type: "documentation", platform: "selenium.dev", isFree: true },
      { title: "Selenium Tutorial (YouTube)", url: "https://www.youtube.com/watch?v=b8m9VcYnJN0", type: "video", platform: "YouTube", isFree: true },
    ],
    "Cypress": [
      { title: "Cypress Docs", url: "https://docs.cypress.io", type: "documentation", platform: "cypress.io", isFree: true },
      { title: "Cypress Tutorial (YouTube)", url: "https://www.youtube.com/watch?v=7N63cMKosIE", type: "video", platform: "YouTube", isFree: true },
    ],
    "JMeter": [
      { title: "JMeter Docs", url: "https://jmeter.apache.org/usermanual/", type: "documentation", platform: "Apache", isFree: true },
      { title: "JMeter Tutorial (YouTube)", url: "https://www.youtube.com/watch?v=5vZq1C3M_lE", type: "video", platform: "YouTube", isFree: true },
    ],
    "Spark": [
      { title: "Spark Docs", url: "https://spark.apache.org/docs/latest/", type: "documentation", platform: "Apache", isFree: true },
      { title: "Spark with Python (freeCodeCamp)", url: "https://www.youtube.com/watch?v=_C8kWso4ne4", type: "video", platform: "YouTube", isFree: true },
      { title: "Databricks Academy", url: "https://www.databricks.com/learn/training", type: "course", platform: "Databricks", isFree: true },
    ],
  },
  projects: {
    "HTML": [{ title: "Portfolio Website", description: "Build a personal portfolio site", difficulty: "beginner", estimatedTime: "2-3 hours", skills: ["HTML", "CSS"] }],
    "CSS": [{ title: "Responsive Landing Page", description: "Build a responsive landing page", difficulty: "beginner", estimatedTime: "3-4 hours", skills: ["CSS", "HTML"], githubUrl: "https://github.com/topics/responsive-landing-page" },
      { title: "CSS Art", description: "Create artwork using only CSS", difficulty: "beginner", estimatedTime: "1-2 hours", skills: ["CSS"] }],
    "JavaScript": [
      { title: "Todo App", description: "Build a todo application with CRUD", difficulty: "beginner", estimatedTime: "3-4 hours", skills: ["JavaScript", "HTML", "CSS"], githubUrl: "https://github.com/topics/todo-app" },
      { title: "Weather App", description: "Build a weather app using APIs", difficulty: "intermediate", estimatedTime: "4-6 hours", skills: ["JavaScript", "API", "HTML", "CSS"] },
      { title: "Calculator", description: "Build a calculator app", difficulty: "beginner", estimatedTime: "2-3 hours", skills: ["JavaScript", "HTML", "CSS"] },
      { title: "Memory Game", description: "Build a memory card game", difficulty: "intermediate", estimatedTime: "4-5 hours", skills: ["JavaScript", "HTML", "CSS"] },
    ],
    "React": [
      { title: "E-commerce Dashboard", description: "Build an admin dashboard", difficulty: "intermediate", estimatedTime: "8-12 hours", skills: ["React", "State Management", "API"], githubUrl: "https://github.com/topics/react-dashboard" },
      { title: "Social Media Feed", description: "Build a social media feed with infinite scroll", difficulty: "intermediate", estimatedTime: "6-8 hours", skills: ["React", "REST API", "CSS"] },
      { title: "Chat Application", description: "Build a real-time chat app", difficulty: "advanced", estimatedTime: "10-15 hours", skills: ["React", "WebSocket", "Node.js"] },
      { title: "Task Management App", description: "Build a Trello-like board", difficulty: "advanced", estimatedTime: "12-16 hours", skills: ["React", "DnD", "State Management"] },
    ],
    "Node.js": [
      { title: "REST API", description: "Build a RESTful API with Express", difficulty: "beginner", estimatedTime: "3-4 hours", skills: ["Node.js", "Express", "MongoDB"], githubUrl: "https://github.com/topics/rest-api-node" },
      { title: "Authentication System", description: "Build JWT auth system", difficulty: "intermediate", estimatedTime: "5-7 hours", skills: ["Node.js", "JWT", "MongoDB"] },
      { title: "Real-time Chat Server", description: "Build a WebSocket chat server", difficulty: "intermediate", estimatedTime: "6-8 hours", skills: ["Node.js", "WebSocket", "Socket.io"] },
      { title: "URL Shortener", description: "Build a URL shortening service", difficulty: "intermediate", estimatedTime: "4-6 hours", skills: ["Node.js", "Express", "PostgreSQL"] },
    ],
    "Python": [
      { title: "Data Analysis Script", description: "Analyze a dataset with Pandas", difficulty: "beginner", estimatedTime: "3-4 hours", skills: ["Python", "Pandas"] },
      { title: "Web Scraper", description: "Build a web scraping tool", difficulty: "intermediate", estimatedTime: "4-6 hours", skills: ["Python", "BeautifulSoup", "Requests"] },
      { title: "Automation Script", description: "Automate file organization", difficulty: "beginner", estimatedTime: "2-3 hours", skills: ["Python", "OS Module"] },
    ],
    "Docker": [
      { title: "Dockerize Full Stack App", description: "Containerize a full stack application", difficulty: "intermediate", estimatedTime: "3-5 hours", skills: ["Docker", "Docker Compose", "Node.js", "PostgreSQL"] },
      { title: "Multi-stage Build", description: "Optimize Docker builds", difficulty: "advanced", estimatedTime: "2-3 hours", skills: ["Docker"] },
    ],
    "TypeScript": [
      { title: "TypeScript Library", description: "Build a reusable TypeScript library", difficulty: "intermediate", estimatedTime: "4-6 hours", skills: ["TypeScript", "npm"] },
      { title: "Type-safe API Client", description: "Build a type-safe API client", difficulty: "intermediate", estimatedTime: "3-5 hours", skills: ["TypeScript", "REST API"] },
    ],
    "AWS": [
      { title: "Serverless API", description: "Deploy a serverless API on AWS Lambda", difficulty: "advanced", estimatedTime: "6-8 hours", skills: ["AWS Lambda", "API Gateway", "DynamoDB"] },
      { title: "Static Site on S3", description: "Host a static site on S3 with CloudFront", difficulty: "beginner", estimatedTime: "2-3 hours", skills: ["S3", "CloudFront", "Route53"] },
    ],
    "Vue.js": [
      { title: "Vue E-commerce", description: "Build an e-commerce frontend with Vue", difficulty: "intermediate", estimatedTime: "8-12 hours", skills: ["Vue.js", "Vuex", "API"] },
      { title: "Task Manager", description: "Build a Vue task management app", difficulty: "beginner", estimatedTime: "4-6 hours", skills: ["Vue.js", "Composition API"] },
    ],
    "Angular": [
      { title: "Admin Dashboard", description: "Build an Angular admin panel", difficulty: "intermediate", estimatedTime: "10-14 hours", skills: ["Angular", "RxJS", "NgRx"] },
      { title: "Blog Platform", description: "Build a blog with Angular", difficulty: "intermediate", estimatedTime: "8-10 hours", skills: ["Angular", "Angular Router", "REST API"] },
    ],
    "Next.js": [
      { title: "Full Stack Blog", description: "Build a blog with Next.js and MDX", difficulty: "intermediate", estimatedTime: "8-12 hours", skills: ["Next.js", "React", "Markdown"] },
      { title: "SaaS Landing", description: "Build a SaaS landing page with Next.js", difficulty: "intermediate", estimatedTime: "6-8 hours", skills: ["Next.js", "Tailwind CSS", "Stripe"] },
    ],
    "Go": [
      { title: "REST API in Go", description: "Build a REST API with Go", difficulty: "intermediate", estimatedTime: "6-8 hours", skills: ["Go", "PostgreSQL", "REST"] },
      { title: "CLI Tool", description: "Build a CLI tool in Go", difficulty: "beginner", estimatedTime: "3-4 hours", skills: ["Go", "CLI"] },
    ],
    "Rust": [
      { title: "CLI in Rust", description: "Build a CLI utility in Rust", difficulty: "intermediate", estimatedTime: "6-8 hours", skills: ["Rust", "CLI"] },
      { title: "Web Server", description: "Build a basic web server in Rust", difficulty: "advanced", estimatedTime: "8-12 hours", skills: ["Rust", "HTTP", "Concurrency"] },
    ],
    "Java": [
      { title: "Spring Boot API", description: "Build a REST API with Spring Boot", difficulty: "intermediate", estimatedTime: "8-12 hours", skills: ["Java", "Spring Boot", "PostgreSQL"] },
      { title: "Microservices Demo", description: "Build microservices with Spring Cloud", difficulty: "advanced", estimatedTime: "16-24 hours", skills: ["Java", "Spring Boot", "Docker", "Kafka"] },
    ],
    "C#": [
      { title: ".NET Web API", description: "Build a .NET Core Web API", difficulty: "intermediate", estimatedTime: "8-10 hours", skills: ["C#", "ASP.NET Core", "SQL Server"] },
      { title: "Blazor App", description: "Build a Blazor WebAssembly app", difficulty: "intermediate", estimatedTime: "8-12 hours", skills: ["C#", "Blazor", "REST API"] },
    ],
    "PHP": [
      { title: "Laravel Blog", description: "Build a blog with Laravel", difficulty: "beginner", estimatedTime: "6-8 hours", skills: ["PHP", "Laravel", "MySQL"] },
      { title: "E-commerce API", description: "Build e-commerce API with Laravel", difficulty: "intermediate", estimatedTime: "10-14 hours", skills: ["PHP", "Laravel", "REST API"] },
    ],
    "Kotlin": [
      { title: "Android Note App", description: "Build a note-taking Android app", difficulty: "beginner", estimatedTime: "6-8 hours", skills: ["Kotlin", "Android SDK", "Room"] },
      { title: "Weather App (Kotlin)", description: "Build a weather app in Kotlin", difficulty: "intermediate", estimatedTime: "8-10 hours", skills: ["Kotlin", "Retrofit", "Jetpack Compose"] },
    ],
    "Flutter": [
      { title: "Flutter Todo App", description: "Build a cross-platform todo app", difficulty: "beginner", estimatedTime: "4-6 hours", skills: ["Flutter", "Dart", "SQLite"] },
      { title: "Flutter Chat App", description: "Build a chat app with Flutter", difficulty: "advanced", estimatedTime: "12-16 hours", skills: ["Flutter", "Firebase", "WebSocket"] },
    ],
    "Figma": [
      { title: "Design System", description: "Create a design system in Figma", difficulty: "intermediate", estimatedTime: "8-12 hours", skills: ["Figma", "Design Systems", "Components"] },
      { title: "Mobile App Design", description: "Design a mobile app in Figma", difficulty: "beginner", estimatedTime: "4-6 hours", skills: ["Figma", "Prototyping"] },
    ],
    "Unity": [
      { title: "2D Platformer", description: "Build a 2D platformer game", difficulty: "intermediate", estimatedTime: "16-24 hours", skills: ["Unity", "C#", "Physics"] },
      { title: "AR App", description: "Build an AR app with Unity", difficulty: "advanced", estimatedTime: "20-30 hours", skills: ["Unity", "AR Foundation", "C#"] },
    ],
    "Solidity": [
      { title: "NFT Marketplace", description: "Build an NFT marketplace", difficulty: "advanced", estimatedTime: "20-30 hours", skills: ["Solidity", "React", "Hardhat"] },
      { title: "Token Contract", description: "Create an ERC-20 token", difficulty: "intermediate", estimatedTime: "4-6 hours", skills: ["Solidity", "OpenZeppelin", "Hardhat"] },
    ],
    "Swift": [
      { title: "iOS Notes App", description: "Build a notes app for iOS", difficulty: "beginner", estimatedTime: "6-8 hours", skills: ["Swift", "SwiftUI", "Core Data"] },
      { title: "iOS Fitness Tracker", description: "Build a fitness tracking app", difficulty: "advanced", estimatedTime: "16-20 hours", skills: ["Swift", "HealthKit", "Core Motion"] },
    ],
    "OpenCV": [
      { title: "Face Detection", description: "Build a face detection system", difficulty: "intermediate", estimatedTime: "6-8 hours", skills: ["Python", "OpenCV", "Computer Vision"] },
      { title: "Object Tracker", description: "Build real-time object tracking", difficulty: "advanced", estimatedTime: "10-14 hours", skills: ["Python", "OpenCV", "Deep Learning"] },
    ],
    "FastAPI": [
      { title: "ML API", description: "Deploy ML model with FastAPI", difficulty: "intermediate", estimatedTime: "4-6 hours", skills: ["FastAPI", "Python", "Docker"] },
      { title: "AI SaaS Backend", description: "Build AI SaaS backend with FastAPI", difficulty: "advanced", estimatedTime: "12-16 hours", skills: ["FastAPI", "PostgreSQL", "Redis", "Docker"] },
    ],
    "LLMs": [
      { title: "AI Chatbot", description: "Build an LLM-powered chatbot", difficulty: "intermediate", estimatedTime: "8-12 hours", skills: ["Python", "LLMs", "LangChain", "FastAPI"] },
      { title: "RAG System", description: "Build a RAG-based Q&A system", difficulty: "advanced", estimatedTime: "12-16 hours", skills: ["Python", "LLMs", "Vector DB", "LangChain"] },
    ],
    "AI Agents": [
      { title: "Research Agent", description: "Build an AI research agent", difficulty: "advanced", estimatedTime: "12-16 hours", skills: ["Python", "LangGraph", "LLMs"] },
      { title: "Coding Agent", description: "Build an autonomous coding agent", difficulty: "advanced", estimatedTime: "16-24 hours", skills: ["Python", "AI Agents", "Tool Use"] },
    ],
    "PyTorch": [
      { title: "Image Classifier", description: "Build CNN image classifier", difficulty: "intermediate", estimatedTime: "6-8 hours", skills: ["PyTorch", "CNNs", "Image Processing"] },
      { title: "Text Classifier", description: "Build transformer text classifier", difficulty: "intermediate", estimatedTime: "8-10 hours", skills: ["PyTorch", "Transformers", "NLP"] },
    ],
    "ROS": [
      { title: "Robot Navigation", description: "Build robot navigation with ROS", difficulty: "advanced", estimatedTime: "20-30 hours", skills: ["ROS", "Python/C++", "SLAM"] },
      { title: "Pick and Place", description: "Build pick and place robot arm", difficulty: "advanced", estimatedTime: "24-36 hours", skills: ["ROS", "MoveIt", "Computer Vision"] },
    ],
    "Selenium": [
      { title: "Test Suite", description: "Build a Selenium test suite", difficulty: "intermediate", estimatedTime: "6-8 hours", skills: ["Selenium", "Python/Java", "TestNG"] },
      { title: "E2E Framework", description: "Build an end-to-end testing framework", difficulty: "advanced", estimatedTime: "10-14 hours", skills: ["Selenium", "Cucumber", "CI/CD"] },
    ],
    "JMeter": [
      { title: "Load Test Suite", description: "Build a load testing suite", difficulty: "intermediate", estimatedTime: "6-8 hours", skills: ["JMeter", "Performance Testing"] },
      { title: "API Load Test", description: "Load test REST APIs", difficulty: "intermediate", estimatedTime: "5-7 hours", skills: ["JMeter", "API Testing"] },
    ],
    "Spark": [
      { title: "Data Pipeline", description: "Build a Spark data pipeline", difficulty: "advanced", estimatedTime: "10-14 hours", skills: ["Spark", "Python/Scala", "Parquet"] },
      { title: "Streaming App", description: "Build a Spark streaming app", difficulty: "advanced", estimatedTime: "12-16 hours", skills: ["Spark", "Kafka", "Streaming"] },
    ],
  },
  companyInfo: {
    Google: {
      overview: "Google focuses on scalability, distributed systems, and data-driven decision making.",
      dsaTopics: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "Recursion"],
      systemDesignTopics: ["Distributed Systems", "Scalability", "Data Pipelines", "MapReduce"],
      behavioralQuestions: ["Tell me about a time you led a project", "How do you handle ambiguity?"],
      rounds: [{ round: "Phone Screen", topics: ["DSA", "Problem Solving"], resources: ["LeetCode Medium"], tips: ["Focus on optimization"] },
        { round: "Coding", topics: ["Algorithms", "Data Structures"], resources: ["LeetCode"], tips: ["Write clean code"] },
        { round: "System Design", topics: ["Distributed Systems", "Scalability"], resources: ["System Design Primer"], tips: ["Think about tradeoffs"] },
        { round: "Behavioral", topics: ["Leadership", "Project Experience"], resources: ["STAR Method"], tips: ["Use specific examples"] },
        { round: "Hiring Committee", topics: ["Overall Assessment"], resources: [], tips: ["Be confident"] }],
    },
    Microsoft: {
      overview: "Microsoft values problem-solving, collaboration, and growth mindset.",
      dsaTopics: ["Arrays", "Strings", "Trees", "Dynamic Programming", "Design"],
      systemDesignTopics: ["Microservices", "Azure", "Distributed Systems"],
      behavioralQuestions: ["Describe a challenge you overcame", "How do you work in a team?"],
      rounds: [{ round: "Phone Screen", topics: ["Coding", "Problem Solving"], resources: ["LeetCode"], tips: ["Communicate clearly"] },
        { round: "Technical", topics: ["DSA", "Design"], resources: ["LeetCode", "System Design"], tips: ["Ask clarifying questions"] },
        { round: "System Design", topics: ["Architecture", "Scalability"], resources: ["Azure Docs"], tips: ["Know Azure services"] },
        { round: "Behavioral", topics: ["Teamwork", "Growth Mindset"], resources: ["Microsoft Principles"], tips: ["Show growth mindset"] },
        { round: "ASAPP", topics: ["Advanced Problem Solving"], resources: [], tips: ["Think out loud"] }],
    },
    Amazon: {
      overview: "Amazon obsesses over customers and uses Leadership Principles in all decisions.",
      dsaTopics: ["Arrays", "Strings", "Graphs", "Dynamic Programming", "OOD"],
      systemDesignTopics: ["Microservices", "Scalability", "AWS", "Event-Driven"],
      behavioralQuestions: ["Tell me about a time you failed", "How do you handle criticism?", "Describe a customer-obsessed decision"],
      rounds: [{ round: "Phone Screen", topics: ["DSA", "LP Questions"], resources: ["LeetCode"], tips: ["Review Leadership Principles"] },
        { round: "Coding", topics: ["Algorithms", "Data Structures"], resources: ["LeetCode Hard"], tips: ["Write optimal solutions"] },
        { round: "System Design", topics: ["Scalability", "AWS"], resources: ["Amazon Builders Library"], tips: ["Use AWS services"] },
        { round: "Bar Raiser", topics: ["LPs", "Deep Dive"], resources: ["Amazon LPs"], tips: ["Use STAR format"] },
        { round: "Hiring Manager", topics: ["Experience", "Culture Fit"], resources: [], tips: ["Show passion"] }],
    },
    Meta: {
      overview: "Meta focuses on real-time systems, large-scale data processing, and social graph infrastructure.",
      dsaTopics: ["Dynamic Programming", "Strings", "Trees", "Recursion", "Graphs"],
      systemDesignTopics: ["Real-time Systems", "Data Pipelines", "Caching", "Distributed Storage"],
      behavioralQuestions: ["How do you solve ambiguous problems?", "Tell me about a project you're proud of"],
      rounds: [{ round: "Phone Screen", topics: ["DSA", "Problem Solving"], resources: ["LeetCode"], tips: ["Be efficient"] },
        { round: "Coding", topics: ["Algorithms", "DSA"], resources: ["LeetCode Hard"], tips: ["Optimize constantly"] },
        { round: "System Design", topics: ["Distributed Systems", "Real-time"], resources: ["Meta Engineering Blog"], tips: ["Think at scale"] },
        { round: "Behavioral", topics: ["Ownership", "Impact"], resources: ["Meta Culture"], tips: ["Show ownership"] }],
    },
    Netflix: {
      overview: "Netflix values high performance, innovation, and cloud-native architecture on AWS.",
      dsaTopics: ["Arrays", "Strings", "System Design"],
      systemDesignTopics: ["Microservices", "CDN", "Streaming", "Chaos Engineering"],
      behavioralQuestions: ["How do you handle feedback?", "Tell me about a time you innovated"],
      rounds: [{ round: "Phone Screen", topics: ["DSA", "Architecture"], resources: ["LeetCode"], tips: ["Think about scale"] },
        { round: "Coding", topics: ["Algorithms", "Design"], resources: ["LeetCode Hard"], tips: ["Write production quality code"] },
        { round: "System Design", topics: ["Streaming", "Microservices"], resources: ["Netflix Tech Blog"], tips: ["Know the tradeoffs"] },
        { round: "Cultural", topics: ["Freedom & Responsibility"], resources: ["Netflix Culture Deck"], tips: ["Show you're a free agent"] }],
    },
    Uber: {
      overview: "Uber builds real-time marketplace systems at massive scale across 70+ countries.",
      dsaTopics: ["Graphs", "Maps", "DP", "System Design"],
      systemDesignTopics: ["Real-time Systems", "Geospatial", "Pricing Algorithms", "Event-driven"],
      behavioralQuestions: ["Tell me about a conflict", "How do you prioritize work?"],
      rounds: [{ round: "Phone Screen", topics: ["DSA"], resources: ["LeetCode Medium"], tips: ["Focus on graphs"] },
        { round: "Coding", topics: ["Algorithms", "Problem Solving"], resources: ["LeetCode Hard"], tips: ["Edge cases matter"] },
        { round: "System Design", topics: ["Real-time", "Geospatial"], resources: ["Uber Engineering"], tips: ["Think about real-time constraints"] },
        { round: "Behavioral", topics: ["Ownership", "Impact"], resources: ["Uber Values"], tips: ["Show impact"] }],
    },
    Flipkart: {
      overview: "Flipkart is India's e-commerce leader with focus on scale, personalization, and logistics.",
      dsaTopics: ["Arrays", "Strings", "DP", "OOD", "Trees"],
      systemDesignTopics: ["E-commerce", "Recommendations", "Inventory", "Payments"],
      behavioralQuestions: ["How do you handle pressure?", "Describe a time you showed leadership"],
      rounds: [{ round: "Machine Test", topics: ["DSA", "Problem Solving"], resources: ["LeetCode"], tips: ["Aim for optimal"] },
        { round: "Technical", topics: ["DSA", "System Design"], resources: ["System Design Primer"], tips: ["Be thorough"] },
        { round: "System Design", topics: ["E-commerce", "Scalability"], resources: ["Flipkart Engineering"], tips: ["Know Indian market"] },
        { round: "HR", topics: ["Culture Fit"], resources: [], tips: ["Be yourself"] }],
    },
    Swiggy: {
      overview: "Swiggy operates India's largest food delivery network with real-time logistics at scale.",
      dsaTopics: ["Graphs", "DP", "Greedy", "System Design"],
      systemDesignTopics: ["Logistics", "Real-time Tracking", "Recommendations", "Scaling"],
      behavioralQuestions: ["Describe a challenging project", "How do you deal with ambiguity?"],
      rounds: [{ round: "Coding", topics: ["DSA", "Problem Solving"], resources: ["LeetCode"], tips: ["Optimize for performance"] },
        { round: "Design", topics: ["System Design", "Architecture"], resources: ["System Design Primer"], tips: ["Think about scale in Indian context"] },
        { round: "Managerial", topics: ["Experience", "Leadership"], resources: [], tips: ["Show impact"] }],
    },
  },
  certifications: [
    { name: "AWS Certified Solutions Architect", provider: "AWS", cost: "$150", duration: "3 months", url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/" },
    { name: "AWS Certified Developer", provider: "AWS", cost: "$150", duration: "2 months", url: "https://aws.amazon.com/certification/certified-developer-associate/" },
    { name: "Google Cloud Associate Engineer", provider: "Google Cloud", cost: "$125", duration: "3 months", url: "https://cloud.google.com/certification/cloud-engineer" },
    { name: "Azure AZ-900", provider: "Microsoft", cost: "$99", duration: "1 month", url: "https://learn.microsoft.com/en-us/certifications/azure-fundamentals/" },
    { name: "CKA (Kubernetes)", provider: "CNCF", cost: "$395", duration: "3 months", url: "https://www.cncf.io/certification/cka/" },
    { name: "Docker Certified Associate", provider: "Docker", cost: "$250", duration: "2 months", url: "https://training.mirantis.com/dca-certification/" },
    { name: "Meta Frontend Developer", provider: "Meta/Coursera", cost: "$49/month", duration: "5 months", url: "https://www.coursera.org/professional-certificates/meta-front-end-developer" },
    { name: "Google Data Analytics", provider: "Google/Coursera", cost: "$49/month", duration: "6 months", url: "https://www.coursera.org/professional-certificates/google-data-analytics" },
    { name: "TensorFlow Developer Certificate", provider: "TensorFlow", cost: "$100", duration: "2 months", url: "https://www.tensorflow.org/certificate" },
    { name: "CompTIA Security+", provider: "CompTIA", cost: "$370", duration: "3 months", url: "https://www.comptia.org/certifications/security" },
    { name: "AWS Certified AI Practitioner", provider: "AWS", cost: "$150", duration: "3 months", url: "https://aws.amazon.com/certification/certified-ai-practitioner/" },
    { name: "Microsoft Azure AI Engineer", provider: "Microsoft", cost: "$165", duration: "3 months", url: "https://learn.microsoft.com/en-us/certifications/azure-ai-engineer/" },
    { name: "Google Cloud Generative AI", provider: "Google Cloud", cost: "$125", duration: "3 months", url: "https://cloud.google.com/learn/certification/generative-ai" },
    { name: "DeepLearning.AI Specializations", provider: "DeepLearning.AI", cost: "$49/month", duration: "4 months", url: "https://www.deeplearning.ai/courses/" },
    { name: "Hugging Face Course", provider: "Hugging Face", cost: "Free", duration: "2 months", url: "https://huggingface.co/learn/nlp-course" },
    { name: "NVIDIA DLI", provider: "NVIDIA", cost: "$90", duration: "1 month", url: "https://www.nvidia.com/en-us/training/" },
    { name: "Databricks ML Associate", provider: "Databricks", cost: "$200", duration: "2 months", url: "https://www.databricks.com/learn/certification" },
    { name: "AWS Certified DevOps Engineer", provider: "AWS", cost: "$300", duration: "3 months", url: "https://aws.amazon.com/certification/certified-devops-engineer-professional/" },
    { name: "ISTQB Certified Tester", provider: "ISTQB", cost: "$250", duration: "2 months", url: "https://www.istqb.org/" },
    { name: "CISSP", provider: "ISC2", cost: "$749", duration: "6 months", url: "https://www.isc2.org/Certifications/CISSP" },
    { name: "Google Professional Data Engineer", provider: "Google Cloud", cost: "$200", duration: "4 months", url: "https://cloud.google.com/learn/certification/data-engineer" },
    { name: "Unity Certified Developer", provider: "Unity", cost: "$250", duration: "3 months", url: "https://unity.com/products/unity-certifications" },
  ],
  jobMarkets: {
    "Frontend Developer": { demand: "high", averageSalary: 800000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Flipkart", "Swiggy"], growthRate: 15, competition: "medium", trendingSkills: ["React", "TypeScript", "Next.js"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "Backend Developer": { demand: "high", averageSalary: 900000, hiringCompanies: ["Google", "Amazon", "Uber", "Razorpay", "CRED"], growthRate: 18, competition: "medium", trendingSkills: ["Node.js", "Go", "Python", "Kubernetes"], topLocations: ["Bangalore", "Pune", "Delhi NCR"] },
    "Full Stack Developer": { demand: "very high", averageSalary: 1100000, hiringCompanies: ["Microsoft", "Amazon", "Flipkart", "Uber", "Swiggy"], growthRate: 20, competition: "high", trendingSkills: ["React", "Node.js", "AWS", "TypeScript"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "JavaScript Developer": { demand: "high", averageSalary: 750000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Uber", "Swiggy"], growthRate: 14, competition: "medium", trendingSkills: ["JavaScript", "TypeScript", "React", "Node.js"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "TypeScript Developer": { demand: "very high", averageSalary: 950000, hiringCompanies: ["Microsoft", "Google", "Amazon", "Flipkart", "Uber"], growthRate: 25, competition: "medium", trendingSkills: ["TypeScript", "React", "Node.js", "Next.js"], topLocations: ["Bangalore", "Hyderabad", "Pune"] },
    "React Developer": { demand: "very high", averageSalary: 900000, hiringCompanies: ["Google", "Amazon", "Flipkart", "Swiggy", "Uber"], growthRate: 18, competition: "high", trendingSkills: ["React", "TypeScript", "Next.js", "Tailwind"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "Next.js Developer": { demand: "very high", averageSalary: 1100000, hiringCompanies: ["Vercel", "Netflix", "Amazon", "Flipkart", "Swiggy"], growthRate: 35, competition: "medium", trendingSkills: ["Next.js", "React", "TypeScript", "PostgreSQL"], topLocations: ["Bangalore", "Hyderabad", "Remote"] },
    "Vue.js Developer": { demand: "medium", averageSalary: 800000, hiringCompanies: ["GitLab", "GitHub", "Alibaba", "Xiaomi", "Laravel"], growthRate: 12, competition: "low", trendingSkills: ["Vue.js", "TypeScript", "Pinia", "Nuxt.js"], topLocations: ["Bangalore", "Pune", "Delhi NCR"] },
    "Angular Developer": { demand: "medium", averageSalary: 950000, hiringCompanies: ["Google", "Microsoft", "J.P. Morgan", "Wells Fargo", "Dell"], growthRate: 10, competition: "medium", trendingSkills: ["Angular", "TypeScript", "RxJS", "NgRx"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "Android Developer": { demand: "high", averageSalary: 1000000, hiringCompanies: ["Google", "Amazon", "Flipkart", "Uber", "CRED"], growthRate: 15, competition: "medium", trendingSkills: ["Kotlin", "Jetpack Compose", "Android SDK", "Firebase"], topLocations: ["Bangalore", "Hyderabad", "Pune"] },
    "iOS Developer": { demand: "high", averageSalary: 1200000, hiringCompanies: ["Apple", "Google", "Amazon", "Swiggy", "CRED"], growthRate: 14, competition: "medium", trendingSkills: ["Swift", "SwiftUI", "UIKit", "Core Data"], topLocations: ["Bangalore", "Mumbai", "Hyderabad"] },
    "Flutter Developer": { demand: "high", averageSalary: 850000, hiringCompanies: ["Google", "BMW", "eBay", "Toyota", "Philips"], growthRate: 28, competition: "medium", trendingSkills: ["Flutter", "Dart", "Firebase", "State Management"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "React Native Developer": { demand: "high", averageSalary: 950000, hiringCompanies: ["Meta", "Amazon", "Walmart", "Uber", "Coinbase"], growthRate: 20, competition: "medium", trendingSkills: ["React Native", "TypeScript", "Redux", "Native Modules"], topLocations: ["Bangalore", "Hyderabad", "Pune"] },
    "Python Developer": { demand: "very high", averageSalary: 850000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Uber", "CRED"], growthRate: 22, competition: "high", trendingSkills: ["Python", "Django", "FastAPI", "Docker"], topLocations: ["Bangalore", "Hyderabad", "Pune"] },
    "Java Developer": { demand: "high", averageSalary: 1000000, hiringCompanies: ["Google", "Amazon", "Flipkart", "Oracle", "J.P. Morgan"], growthRate: 12, competition: "high", trendingSkills: ["Java", "Spring Boot", "Microservices", "Kubernetes"], topLocations: ["Bangalore", "Hyderabad", "Pune"] },
    "C# Developer": { demand: "medium", averageSalary: 950000, hiringCompanies: ["Microsoft", "Amazon", "Accenture", "Tata", "Infosys"], growthRate: 10, competition: "medium", trendingSkills: ["C#", ".NET Core", "Azure", "Blazor"], topLocations: ["Bangalore", "Pune", "Hyderabad"] },
    "Go Developer": { demand: "very high", averageSalary: 1400000, hiringCompanies: ["Google", "Uber", "Netflix", "Dropbox", "Cloudflare"], growthRate: 30, competition: "low", trendingSkills: ["Go", "Docker", "Kubernetes", "gRPC"], topLocations: ["Bangalore", "Remote", "Delhi NCR"] },
    "Rust Developer": { demand: "high", averageSalary: 1500000, hiringCompanies: ["Mozilla", "Microsoft", "Google", "Amazon", "Cloudflare"], growthRate: 35, competition: "low", trendingSkills: ["Rust", "WebAssembly", "Systems Programming", "Blockchain"], topLocations: ["Bangalore", "Remote", "Mumbai"] },
    "PHP Developer": { demand: "medium", averageSalary: 700000, hiringCompanies: ["Facebook", "WordPress", "Slack", "Etsy", "Lyft"], growthRate: 5, competition: "medium", trendingSkills: ["PHP", "Laravel", "Livewire", "MySQL"], topLocations: ["Bangalore", "Pune", "Noida"] },
    "Kotlin Developer": { demand: "high", averageSalary: 1100000, hiringCompanies: ["Google", "Amazon", "Flipkart", "CRED", "Swiggy"], growthRate: 20, competition: "medium", trendingSkills: ["Kotlin", "Spring Boot", "Android", "Kotlin Multiplatform"], topLocations: ["Bangalore", "Hyderabad", "Pune"] },
    "Data Analyst": { demand: "high", averageSalary: 700000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Flipkart", "Swiggy"], growthRate: 20, competition: "medium", trendingSkills: ["SQL", "Python", "Tableau", "Power BI"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "Data Scientist": { demand: "high", averageSalary: 1400000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Flipkart", "Uber"], growthRate: 25, competition: "high", trendingSkills: ["Machine Learning", "Python", "TensorFlow", "SQL"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "Machine Learning Engineer": { demand: "very high", averageSalary: 1600000, hiringCompanies: ["Google", "Meta", "Amazon", "Microsoft", "CRED"], growthRate: 28, competition: "high", trendingSkills: ["PyTorch", "TensorFlow", "MLOps", "Docker"], topLocations: ["Bangalore", "Hyderabad", "Delhi NCR"] },
    "AI Engineer": { demand: "very high", averageSalary: 2200000, hiringCompanies: ["Google", "OpenAI", "Microsoft", "Anthropic", "Meta"], growthRate: 45, competition: "high", trendingSkills: ["LLMs", "RAG", "AI Agents", "PyTorch", "LangChain"], topLocations: ["Bangalore", "Hyderabad", "San Francisco"] },
    "Deep Learning Engineer": { demand: "high", averageSalary: 1800000, hiringCompanies: ["Google", "Meta", "OpenAI", "NVIDIA", "Microsoft"], growthRate: 30, competition: "high", trendingSkills: ["PyTorch", "TensorFlow", "Transformers", "CNNs"], topLocations: ["Bangalore", "Hyderabad", "Delhi NCR"] },
    "NLP Engineer": { demand: "very high", averageSalary: 1700000, hiringCompanies: ["Google", "OpenAI", "Microsoft", "Meta", "Amazon"], growthRate: 35, competition: "high", trendingSkills: ["NLP", "Transformers", "Hugging Face", "spaCy"], topLocations: ["Bangalore", "Hyderabad", "Remote"] },
    "Computer Vision Engineer": { demand: "high", averageSalary: 1600000, hiringCompanies: ["Google", "Meta", "NVIDIA", "Amazon", "Tesla"], growthRate: 25, competition: "high", trendingSkills: ["Computer Vision", "OpenCV", "YOLO", "PyTorch"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "Prompt Engineer": { demand: "very high", averageSalary: 1500000, hiringCompanies: ["OpenAI", "Anthropic", "Google", "Microsoft", "Scale AI"], growthRate: 60, competition: "medium", trendingSkills: ["Prompt Engineering", "LLMs", "LangChain", "RAG"], topLocations: ["Remote", "Bangalore", "San Francisco"] },
    "LLM Engineer": { demand: "very high", averageSalary: 2500000, hiringCompanies: ["OpenAI", "Anthropic", "Google", "Meta", "Microsoft"], growthRate: 55, competition: "very high", trendingSkills: ["LLMs", "Fine-tuning", "RAG", "AI Agents", "MCP"], topLocations: ["Bangalore", "San Francisco", "Remote"] },
    "Generative AI Engineer": { demand: "very high", averageSalary: 2000000, hiringCompanies: ["OpenAI", "Stability AI", "Midjourney", "NVIDIA", "Google"], growthRate: 50, competition: "high", trendingSkills: ["Diffusion Models", "GANs", "Transformers", "PyTorch"], topLocations: ["Bangalore", "Remote", "San Francisco"] },
    "DevOps Engineer": { demand: "high", averageSalary: 1200000, hiringCompanies: ["Amazon", "Google", "Microsoft", "Netflix", "Uber"], growthRate: 22, competition: "medium", trendingSkills: ["Kubernetes", "Terraform", "AWS", "CI/CD"], topLocations: ["Bangalore", "Pune", "Delhi NCR"] },
    "Cloud Engineer": { demand: "very high", averageSalary: 1300000, hiringCompanies: ["AWS", "Google", "Microsoft", "Netflix", "Oracle"], growthRate: 24, competition: "medium", trendingSkills: ["AWS", "GCP", "Azure", "Terraform"], topLocations: ["Bangalore", "Mumbai", "Pune"] },
    "AWS Engineer": { demand: "very high", averageSalary: 1400000, hiringCompanies: ["Amazon", "Netflix", "Slack", "Airbnb", "Lyft"], growthRate: 25, competition: "medium", trendingSkills: ["AWS", "Lambda", "ECS", "CloudFormation"], topLocations: ["Bangalore", "Mumbai", "Hyderabad"] },
    "Azure Engineer": { demand: "high", averageSalary: 1300000, hiringCompanies: ["Microsoft", "Accenture", "TCS", "Infosys", "Wipro"], growthRate: 22, competition: "medium", trendingSkills: ["Azure", "Azure DevOps", "AKS", "ARM Templates"], topLocations: ["Bangalore", "Pune", "Hyderabad"] },
    "Google Cloud Engineer": { demand: "high", averageSalary: 1400000, hiringCompanies: ["Google", "Spotify", "Twitter", "PayPal", "Etsy"], growthRate: 23, competition: "medium", trendingSkills: ["GCP", "BigQuery", "GKE", "Cloud Run"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "Kubernetes Engineer": { demand: "very high", averageSalary: 1600000, hiringCompanies: ["Google", "Amazon", "Microsoft", "Netflix", "Uber"], growthRate: 30, competition: "medium", trendingSkills: ["Kubernetes", "Helm", "Istio", "ArgoCD"], topLocations: ["Bangalore", "Remote", "San Francisco"] },
    "Docker Engineer": { demand: "high", averageSalary: 1200000, hiringCompanies: ["Docker", "Amazon", "Google", "Microsoft", "Netflix"], growthRate: 20, competition: "medium", trendingSkills: ["Docker", "Docker Compose", "Swarm", "Security"], topLocations: ["Bangalore", "Pune", "Hyderabad"] },
    "Site Reliability Engineer": { demand: "very high", averageSalary: 2000000, hiringCompanies: ["Google", "Amazon", "Microsoft", "Netflix", "Meta"], growthRate: 28, competition: "high", trendingSkills: ["Linux", "Kubernetes", "Prometheus", "Go"], topLocations: ["Bangalore", "San Francisco", "Hyderabad"] },
    "Cybersecurity Analyst": { demand: "very high", averageSalary: 800000, hiringCompanies: ["CrowdStrike", "Palo Alto", "Microsoft", "Google", "Amazon"], growthRate: 30, competition: "medium", trendingSkills: ["SIEM", "Threat Intelligence", "Python", "Compliance"], topLocations: ["Bangalore", "Delhi NCR", "Mumbai"] },
    "Penetration Tester": { demand: "high", averageSalary: 1200000, hiringCompanies: ["CrowdStrike", "Palo Alto", "Check Point", "Amazon", "Google"], growthRate: 25, competition: "medium", trendingSkills: ["Pen Testing", "Web Security", "Burp Suite", "Python"], topLocations: ["Bangalore", "Delhi NCR", "Mumbai"] },
    "Security Engineer": { demand: "very high", averageSalary: 1300000, hiringCompanies: ["Google", "Microsoft", "Amazon", "CrowdStrike", "Palo Alto"], growthRate: 25, competition: "medium", trendingSkills: ["Cloud Security", "Python", "Penetration Testing", "Zero Trust"], topLocations: ["Bangalore", "Delhi NCR", "Mumbai"] },
    "Ethical Hacker": { demand: "high", averageSalary: 1400000, hiringCompanies: ["Bugcrowd", "HackerOne", "Google", "Microsoft", "Meta"], growthRate: 28, competition: "medium", trendingSkills: ["Ethical Hacking", "Bug Bounty", "CTF", "Reverse Engineering"], topLocations: ["Remote", "Bangalore", "Mumbai"] },
    "SOC Analyst": { demand: "high", averageSalary: 600000, hiringCompanies: ["CrowdStrike", "IBM", "Accenture", "Wipro", "TCS"], growthRate: 25, competition: "medium", trendingSkills: ["SIEM", "SOC", "Incident Response", "Log Analysis"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "QA Engineer": { demand: "medium", averageSalary: 600000, hiringCompanies: ["Amazon", "Flipkart", "Swiggy", "Uber", "CRED"], growthRate: 10, competition: "medium", trendingSkills: ["Manual Testing", "Selenium", "API Testing", "JIRA"], topLocations: ["Bangalore", "Pune", "Hyderabad"] },
    "Automation Test Engineer": { demand: "high", averageSalary: 850000, hiringCompanies: ["Amazon", "Google", "Microsoft", "Flipkart", "Swiggy"], growthRate: 18, competition: "medium", trendingSkills: ["Selenium", "Cypress", "CI/CD", "JavaScript"], topLocations: ["Bangalore", "Hyderabad", "Pune"] },
    "Performance Test Engineer": { demand: "medium", averageSalary: 1000000, hiringCompanies: ["Amazon", "Google", "Netflix", "Flipkart", "Uber"], growthRate: 15, competition: "low", trendingSkills: ["JMeter", "Gatling", "Performance Testing", "Monitoring"], topLocations: ["Bangalore", "Pune", "Hyderabad"] },
    "SQL Developer": { demand: "high", averageSalary: 700000, hiringCompanies: ["Google", "Amazon", "Flipkart", "J.P. Morgan", "Goldman Sachs"], growthRate: 12, competition: "medium", trendingSkills: ["SQL", "Query Optimization", "PL/SQL", "Data Modeling"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "Database Administrator": { demand: "medium", averageSalary: 900000, hiringCompanies: ["Amazon", "Google", "Oracle", "Microsoft", "IBM"], growthRate: 8, competition: "medium", trendingSkills: ["PostgreSQL", "MySQL", "MongoDB", "Performance Tuning"], topLocations: ["Bangalore", "Pune", "Hyderabad"] },
    "Data Engineer": { demand: "very high", averageSalary: 1400000, hiringCompanies: ["Google", "Amazon", "Microsoft", "Netflix", "Uber"], growthRate: 30, competition: "high", trendingSkills: ["Spark", "Airflow", "Python", "Kafka", "Snowflake"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "UI Designer": { demand: "high", averageSalary: 800000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Flipkart", "Swiggy"], growthRate: 15, competition: "medium", trendingSkills: ["Figma", "Design Systems", "Prototyping", "Typography"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "UX Designer": { demand: "high", averageSalary: 1000000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Flipkart", "Uber"], growthRate: 18, competition: "medium", trendingSkills: ["User Research", "Figma", "Usability Testing", "IA"], topLocations: ["Bangalore", "Hyderabad", "Mumbai"] },
    "Product Designer": { demand: "high", averageSalary: 1100000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Netflix", "Airbnb"], growthRate: 18, competition: "medium", trendingSkills: ["Design Systems", "Figma", "Prototyping", "UX Strategy"], topLocations: ["Bangalore", "Remote", "Mumbai"] },
    "Product Manager": { demand: "high", averageSalary: 1800000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Flipkart", "CRED"], growthRate: 15, competition: "high", trendingSkills: ["Product Strategy", "Data Analysis", "User Research", "A/B Testing"], topLocations: ["Bangalore", "Mumbai", "Delhi NCR"] },
    "Technical Product Manager": { demand: "very high", averageSalary: 2200000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Netflix", "Stripe"], growthRate: 22, competition: "high", trendingSkills: ["API Design", "System Design", "Technical Strategy", "Analytics"], topLocations: ["Bangalore", "San Francisco", "Mumbai"] },
    "Project Manager": { demand: "high", averageSalary: 1200000, hiringCompanies: ["Google", "Microsoft", "Amazon", "Accenture", "TCS"], growthRate: 10, competition: "medium", trendingSkills: ["Agile/Scrum", "JIRA", "Risk Management", "Stakeholder Mgmt"], topLocations: ["Bangalore", "Pune", "Mumbai"] },
    "Scrum Master": { demand: "medium", averageSalary: 1400000, hiringCompanies: ["Google", "Amazon", "Microsoft", "Accenture", "Infosys"], growthRate: 12, competition: "medium", trendingSkills: ["Scrum", "Agile", "Facilitation", "Coaching"], topLocations: ["Bangalore", "Hyderabad", "Pune"] },
    "Blockchain Developer": { demand: "medium", averageSalary: 1500000, hiringCompanies: ["Coinbase", "Binance", "Ethereum Foundation", "Polygon", "Chainlink"], growthRate: 20, competition: "medium", trendingSkills: ["Solidity", "Ethereum", "Web3.js", "Smart Contracts"], topLocations: ["Remote", "Bangalore", "San Francisco"] },
    "Solidity Developer": { demand: "high", averageSalary: 1800000, hiringCompanies: ["Ethereum Foundation", "OpenZeppelin", "Uniswap", "Aave", "Chainlink"], growthRate: 22, competition: "medium", trendingSkills: ["Solidity", "EVM", "DeFi", "Smart Contract Security"], topLocations: ["Remote", "Bangalore", "Delhi NCR"] },
    "Web3 Developer": { demand: "high", averageSalary: 1600000, hiringCompanies: ["Coinbase", "ConsenSys", "Polygon", "Chainlink", "Filecoin"], growthRate: 25, competition: "medium", trendingSkills: ["Web3.js", "Ethers.js", "React", "Solidity"], topLocations: ["Remote", "Bangalore", "San Francisco"] },
    "Unity Developer": { demand: "high", averageSalary: 900000, hiringCompanies: ["Unity", "Meta", "Google", "Microsoft", "Ubisoft"], growthRate: 15, competition: "medium", trendingSkills: ["Unity", "C#", "3D Graphics", "AR/VR"], topLocations: ["Bangalore", "Hyderabad", "Pune"] },
    "Unreal Engine Developer": { demand: "medium", averageSalary: 1200000, hiringCompanies: ["Epic Games", "Meta", "Microsoft", "Sony", "NVIDIA"], growthRate: 18, competition: "medium", trendingSkills: ["Unreal Engine", "C++", "Blueprints", "3D Graphics"], topLocations: ["Bangalore", "Remote", "Mumbai"] },
    "Game Developer": { demand: "medium", averageSalary: 900000, hiringCompanies: ["Ubisoft", "Rockstar", "EA", "Blizzard", "NVIDIA"], growthRate: 12, competition: "medium", trendingSkills: ["Unity", "Unreal", "C#", "C++", "Game Design"], topLocations: ["Bangalore", "Hyderabad", "Pune"] },
    "AR Developer": { demand: "high", averageSalary: 1400000, hiringCompanies: ["Apple", "Meta", "Google", "Microsoft", "NVIDIA"], growthRate: 30, competition: "medium", trendingSkills: ["ARKit", "ARCore", "Unity", "Computer Vision"], topLocations: ["Bangalore", "San Francisco", "Remote"] },
    "VR Developer": { demand: "medium", averageSalary: 1300000, hiringCompanies: ["Meta", "HTC", "Valve", "Sony", "Microsoft"], growthRate: 25, competition: "medium", trendingSkills: ["Unity VR", "Unreal VR", "C#", "3D Graphics"], topLocations: ["Bangalore", "San Francisco", "Remote"] },
    "IoT Engineer": { demand: "high", averageSalary: 1000000, hiringCompanies: ["Amazon", "Google", "Siemens", "Bosch", "Honeywell"], growthRate: 22, competition: "medium", trendingSkills: ["Embedded Systems", "C/C++", "MQTT", "Raspberry Pi"], topLocations: ["Bangalore", "Pune", "Hyderabad"] },
    "Robotics Engineer": { demand: "high", averageSalary: 1500000, hiringCompanies: ["Tesla", "Boston Dynamics", "NVIDIA", "Amazon", "Google"], growthRate: 25, competition: "medium", trendingSkills: ["ROS", "C++", "Computer Vision", "SLAM"], topLocations: ["Bangalore", "San Francisco", "Remote"] },
  },
  roleRoadmaps: {
    "Frontend Developer": [
      { order: 1, title: "HTML & CSS Mastery", description: "Master semantic HTML and modern CSS", skills: ["HTML5", "CSS3", "Flexbox", "Grid", "Responsive Design"] },
      { order: 2, title: "JavaScript Deep Dive", description: "Core JavaScript concepts and ES6+", skills: ["JavaScript", "ES6+", "DOM", "Async/Await", "Promises"] },
      { order: 3, title: "Version Control with Git", description: "Learn Git workflow and collaboration", skills: ["Git", "GitHub", "Pull Requests", "Code Review"] },
      { order: 4, title: "TypeScript Fundamentals", description: "Add type safety to JavaScript", skills: ["TypeScript", "Interfaces", "Generics", "Types"] },
      { order: 5, title: "React Ecosystem", description: "Build UIs with React and ecosystem", skills: ["React", "Hooks", "State Management", "React Router"] },
      { order: 6, title: "Modern CSS Frameworks", description: "Learn Tailwind CSS and CSS-in-JS", skills: ["Tailwind CSS", "Styled Components", "CSS Modules"] },
      { order: 7, title: "Testing & Quality", description: "Write unit and integration tests", skills: ["Jest", "React Testing Library", "Cypress"] },
      { order: 8, title: "Performance Optimization", description: "Optimize web app performance", skills: ["Lighthouse", "Code Splitting", "Lazy Loading", "Caching"] },
      { order: 9, title: "Build & Deploy", description: "Build and deploy frontend apps", skills: ["Webpack", "Vite", "CI/CD", "Vercel/Netlify"] },
      { order: 10, title: "Advanced Patterns", description: "Learn advanced React patterns", skills: ["Render Props", "HOCs", "Custom Hooks", "Compound Components"] },
      { order: 11, title: "System Design for Frontend", description: "Design scalable frontend architectures", skills: ["Micro-frontends", "State Management", "Architecture"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for frontend interviews", skills: ["DSA", "System Design", "Behavioral"] },
    ],
    "Backend Developer": [
      { order: 1, title: "Programming Language", description: "Master a backend language", skills: ["Node.js", "Python", "Go", "Java"] },
      { order: 2, title: "Databases & Data Modeling", description: "Learn SQL and NoSQL databases", skills: ["PostgreSQL", "MongoDB", "Redis", "Data Modeling"] },
      { order: 3, title: "API Design", description: "Build RESTful and GraphQL APIs", skills: ["REST", "GraphQL", "API Security", "OpenAPI"] },
      { order: 4, title: "Authentication & Authorization", description: "Implement secure auth", skills: ["JWT", "OAuth", "Session Management", "RBAC"] },
      { order: 5, title: "Message Queues", description: "Learn async processing", skills: ["Kafka", "RabbitMQ", "Bull", "Redis Pub/Sub"] },
      { order: 6, title: "Containerization", description: "Learn Docker basics", skills: ["Docker", "Docker Compose", "Containerization"] },
      { order: 7, title: "CI/CD Pipeline", description: "Set up automated pipelines", skills: ["GitHub Actions", "Jenkins", "GitLab CI"] },
      { order: 8, title: "Cloud Services", description: "Deploy on cloud platforms", skills: ["AWS", "EC2", "RDS", "Lambda", "S3"] },
      { order: 9, title: "Monitoring & Logging", description: "Implement observability", skills: ["Prometheus", "Grafana", "ELK Stack", "Sentry"] },
      { order: 10, title: "Microservices Architecture", description: "Design microservices", skills: ["Microservices", "Service Mesh", "gRPC"] },
      { order: 11, title: "System Design", description: "Design scalable systems", skills: ["System Design", "Caching", "Load Balancing", "Sharding"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for backend interviews", skills: ["DSA", "System Design", "SQL"] },
    ],
    "Full Stack Developer": [
      { order: 1, title: "HTML & CSS", description: "Master web fundamentals", skills: ["HTML5", "CSS3", "Flexbox", "Grid", "Responsive Design"] },
      { order: 2, title: "JavaScript Fundamentals", description: "Core JavaScript concepts", skills: ["JavaScript", "ES6+", "DOM", "Async/Await"] },
      { order: 3, title: "Version Control", description: "Learn Git workflow", skills: ["Git", "GitHub", "Pull Requests"] },
      { order: 4, title: "Frontend Framework", description: "Learn React", skills: ["React", "Hooks", "State Management", "React Router"] },
      { order: 5, title: "Backend with Node.js", description: "Build server-side apps", skills: ["Node.js", "Express", "REST API", "Authentication"] },
      { order: 6, title: "TypeScript", description: "Add type safety everywhere", skills: ["TypeScript", "Types", "Generics", "Interfaces"] },
      { order: 7, title: "Database Design", description: "Work with databases", skills: ["PostgreSQL", "MongoDB", "Redis", "Prisma"] },
      { order: 8, title: "Docker & Containerization", description: "Containerize applications", skills: ["Docker", "Docker Compose"] },
      { order: 9, title: "Testing", description: "Write tests across the stack", skills: ["Jest", "React Testing Library", "Supertest", "E2E"] },
      { order: 10, title: "Cloud Deployment", description: "Deploy full stack apps", skills: ["AWS", "Vercel", "Heroku", "CI/CD"] },
      { order: 11, title: "System Design", description: "Design full stack systems", skills: ["System Design", "Caching", "CDN", "Microservices"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for full stack roles", skills: ["DSA", "System Design", "Full Stack Concepts"] },
    ],
    "DevOps Engineer": [
      { order: 1, title: "Linux Fundamentals", description: "Master Linux command line", skills: ["Linux", "Bash", "Shell Scripting", "Linux Admin"] },
      { order: 2, title: "Networking Basics", description: "Understand network protocols", skills: ["TCP/IP", "DNS", "HTTP/HTTPS", "Load Balancers"] },
      { order: 3, title: "Scripting & Automation", description: "Write automation scripts", skills: ["Python", "Bash", "Ansible", "Automation"] },
      { order: 4, title: "Version Control", description: "Git for infrastructure", skills: ["Git", "GitOps", "Trunk-based Development"] },
      { order: 5, title: "CI/CD Pipelines", description: "Build automated pipelines", skills: ["Jenkins", "GitHub Actions", "GitLab CI", "ArgoCD"] },
      { order: 6, title: "Docker", description: "Master containerization", skills: ["Docker", "Docker Compose", "Docker Security"] },
      { order: 7, title: "Kubernetes", description: "Orchestrate containers", skills: ["Kubernetes", "Helm", "Kustomize", "Service Mesh"] },
      { order: 8, title: "Infrastructure as Code", description: "Manage infra with code", skills: ["Terraform", "CloudFormation", "Pulumi"] },
      { order: 9, title: "Cloud Platforms", description: "Master major clouds", skills: ["AWS", "GCP", "Azure", "Multi-cloud"] },
      { order: 10, title: "Monitoring & Observability", description: "Implement monitoring", skills: ["Prometheus", "Grafana", "Datadog", "ELK Stack"] },
      { order: 11, title: "Security & Compliance", description: "Secure infrastructure", skills: ["Security Best Practices", "Compliance", "Audit"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for DevOps roles", skills: ["System Design", "Scenario Questions", "DSA"] },
    ],
    "Data Scientist": [
      { order: 1, title: "Python & Statistics", description: "Master Python and stats", skills: ["Python", "Statistics", "Probability", "NumPy"] },
      { order: 2, title: "Data Manipulation", description: "Work with data using Pandas", skills: ["Pandas", "Data Cleaning", "Data Wrangling"] },
      { order: 3, title: "Data Visualization", description: "Create compelling visuals", skills: ["Matplotlib", "Seaborn", "Tableau", "Power BI"] },
      { order: 4, title: "SQL for Data", description: "Query and analyze data", skills: ["SQL", "Window Functions", "CTEs", "Query Optimization"] },
      { order: 5, title: "Machine Learning", description: "Build ML models", skills: ["Scikit-learn", "Regression", "Classification", "Clustering"] },
      { order: 6, title: "Deep Learning", description: "Learn neural networks", skills: ["TensorFlow", "PyTorch", "Keras", "Neural Networks"] },
      { order: 7, title: "Feature Engineering", description: "Create better features", skills: ["Feature Engineering", "Dimensionality Reduction", "PCA"] },
      { order: 8, title: "Model Deployment", description: "Deploy ML to production", skills: ["MLflow", "Docker", "FastAPI", "Model Serving"] },
      { order: 9, title: "Big Data Tools", description: "Work with big data", skills: ["Spark", "Hadoop", "Airflow", "Data Pipelines"] },
      { order: 10, title: "NLP & CV", description: "Specialize in NLP or CV", skills: ["NLP", "Computer Vision", "Transformers", "CNNs"] },
      { order: 11, title: "MLOps", description: "Manage ML lifecycle", skills: ["MLOps", "A/B Testing", "Model Monitoring", "CI/CD for ML"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for data science roles", skills: ["Statistics", "ML Theory", "Coding", "Case Studies"] },
    ],
    "Machine Learning Engineer": [
      { order: 1, title: "Python & Math", description: "Math foundations for ML", skills: ["Python", "Linear Algebra", "Calculus", "Probability"] },
      { order: 2, title: "Data Engineering", description: "Build data pipelines", skills: ["SQL", "Spark", "Airflow", "Data Pipelines"] },
      { order: 3, title: "Machine Learning", description: "Master ML algorithms", skills: ["Scikit-learn", "XGBoost", "Ensemble Methods"] },
      { order: 4, title: "Deep Learning", description: "Neural networks in depth", skills: ["TensorFlow", "PyTorch", "CNNs", "RNNs", "Transformers"] },
      { order: 5, title: "ML Infrastructure", description: "Build ML infra", skills: ["Docker", "Kubernetes", "GPU Computing", "MLflow"] },
      { order: 6, title: "Model Serving", description: "Serve models in production", skills: ["FastAPI", "Triton", "TorchServe", "TF Serving"] },
      { order: 7, title: "Feature Store", description: "Manage features at scale", skills: ["Feature Store", "Feast", "Tecton"] },
      { order: 8, title: "ML Pipelines", description: "Automate ML workflows", skills: ["Kubeflow", "TFX", "Airflow", "ML Pipelines"] },
      { order: 9, title: "A/B Testing & Experimentation", description: "Run experiments", skills: ["A/B Testing", "Statistical Tests", "Experiment Design"] },
      { order: 10, title: "MLOps & Monitoring", description: "Monitor ML systems", skills: ["Model Monitoring", "Drift Detection", "Explainability"] },
      { order: 11, title: "Advanced Topics", description: "Deep dive into specializations", skills: ["NLP", "Computer Vision", "Recommendation Systems"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for ML roles", skills: ["ML Theory", "Coding", "System Design", "Research Papers"] },
    ],
    "Cloud Architect": [
      { order: 1, title: "Cloud Fundamentals", description: "Understand cloud concepts", skills: ["Cloud Computing", "Virtualization", "Networking"] },
      { order: 2, title: "AWS Core Services", description: "Master AWS services", skills: ["EC2", "S3", "RDS", "VPC", "Lambda", "IAM"] },
      { order: 3, title: "GCP Services", description: "Learn Google Cloud", skills: ["Compute Engine", "Cloud Storage", "BigQuery", "GKE"] },
      { order: 4, title: "Azure Services", description: "Learn Microsoft Azure", skills: ["Azure VMs", "Azure Storage", "AKS", "Azure DevOps"] },
      { order: 5, title: "Infrastructure as Code", description: "Manage infra programmatically", skills: ["Terraform", "CloudFormation", "Pulumi"] },
      { order: 6, title: "Container Orchestration", description: "Kubernetes in depth", skills: ["Kubernetes", "Helm", "Service Mesh", "Istio"] },
      { order: 7, title: "Networking & Security", description: "Cloud networking and security", skills: ["VPC Design", "Security Groups", "VPN", "WAF", "Shield"] },
      { order: 8, title: "Database & Storage", description: "Cloud database solutions", skills: ["RDS", "Aurora", "DynamoDB", "Cloud SQL", "Bigtable"] },
      { order: 9, title: "Migration Strategies", description: "Plan cloud migrations", skills: ["Migration", "Lift & Shift", "Re-architecting"] },
      { order: 10, title: "Cost Optimization", description: "Optimize cloud costs", skills: ["Cost Management", "Reserved Instances", "Spot Instances"] },
      { order: 11, title: "Enterprise Architecture", description: "Design enterprise solutions", skills: ["TOGAF", "Enterprise Patterns", "Governance"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for cloud architect roles", skills: ["Architecture Design", "Scenario Questions", "Costing"] },
    ],
    "Security Engineer": [
      { order: 1, title: "Networking & Security Basics", description: "Foundational security concepts", skills: ["Network Security", "TCP/IP", "Firewall", "IDS/IPS"] },
      { order: 2, title: "Operating System Security", description: "Secure OS fundamentals", skills: ["Linux Security", "Windows Security", "Hardening"] },
      { order: 3, title: "Web Security", description: "Secure web applications", skills: ["OWASP Top 10", "XSS", "SQL Injection", "CSRF"] },
      { order: 4, title: "Cryptography", description: "Understand encryption", skills: ["Symmetric/Asymmetric", "TLS/SSL", "PKI", "Hashing"] },
      { order: 5, title: "Cloud Security", description: "Secure cloud infrastructure", skills: ["AWS Security", "IAM Policies", "GuardDuty", "Inspector"] },
      { order: 6, title: "Identity & Access Management", description: "Manage identities", skills: ["SSO", "OAuth", "SAML", "LDAP", "Zero Trust"] },
      { order: 7, title: "Penetration Testing", description: "Ethical hacking", skills: ["Metasploit", "Burp Suite", "Kali Linux", "Nmap"] },
      { order: 8, title: "Security Monitoring", description: "Monitor for threats", skills: ["SIEM", "Splunk", "ELK", "Threat Detection"] },
      { order: 9, title: "Incident Response", description: "Handle security incidents", skills: ["IR Process", "Forensics", "Malware Analysis"] },
      { order: 10, title: "Compliance & Governance", description: "Understand compliance", skills: ["GDPR", "SOC 2", "ISO 27001", "HIPAA"] },
      { order: 11, title: "DevSecOps", description: "Shift left security", skills: ["SAST", "DAST", "Secret Scanning", "Security as Code"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for security roles", skills: ["Security Concepts", "CTF", "Scenario Questions"] },
    ],
    "Mobile Developer": [
      { order: 1, title: "Programming Language", description: "Learn platform language", skills: ["Kotlin", "Swift", "Java", "Objective-C"] },
      { order: 2, title: "Platform Fundamentals", description: "Master platform basics", skills: ["Android SDK", "iOS SDK", "Activities", "ViewControllers"] },
      { order: 3, title: "UI Development", description: "Build mobile UIs", skills: ["Jetpack Compose", "SwiftUI", "Auto Layout", "Material Design"] },
      { order: 4, title: "Data Persistence", description: "Store data locally", skills: ["Room", "Core Data", "SQLite", "SharedPreferences"] },
      { order: 5, title: "Networking & APIs", description: "Connect to services", skills: ["Retrofit", "Alamofire", "REST", "GraphQL"] },
      { order: 6, title: "State Management", description: "Manage app state", skills: ["State Management", "MVVM", "Redux", "Bloc"] },
      { order: 7, title: "Firebase Integration", description: "Use Firebase services", skills: ["Firebase Auth", "Firestore", "Cloud Messaging", "Analytics"] },
      { order: 8, title: "Testing", description: "Test mobile apps", skills: ["Unit Tests", "UI Tests", "Espresso", "XCUITest"] },
      { order: 9, title: "App Store Deployment", description: "Publish to stores", skills: ["Google Play", "App Store", "Code Signing", "Review"] },
      { order: 10, title: "Performance Optimization", description: "Optimize mobile apps", skills: ["Memory Management", "Battery", "Network Optimization"] },
      { order: 11, title: "Advanced Topics", description: "Advanced mobile concepts", skills: ["Offline First", "Background Tasks", "Push Notifications"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for mobile roles", skills: ["DSA", "Mobile Design", "System Design"] },
    ],
    "Product Manager": [
      { order: 1, title: "Product Thinking", description: "Develop product mindset", skills: ["Product Thinking", "User Empathy", "Problem Solving"] },
      { order: 2, title: "User Research", description: "Understand users", skills: ["User Research", "Interviews", "Surveys", "Persona Creation"] },
      { order: 3, title: "Product Strategy", description: "Define product strategy", skills: ["Product Strategy", "Roadmapping", "OKRs", "GTM Strategy"] },
      { order: 4, title: "Data & Analytics", description: "Make data-driven decisions", skills: ["SQL", "Analytics", "A/B Testing", "Metrics"] },
      { order: 5, title: "UX & Design", description: "Understand design principles", skills: ["UX Design", "Wireframing", "Figma", "Prototyping"] },
      { order: 6, title: "Agile & Scrum", description: "Manage agile teams", skills: ["Agile", "Scrum", "Sprint Planning", "Retrospectives"] },
      { order: 7, title: "Technical Fundamentals", description: "Understand technology", skills: ["API Design", "System Design Basics", "Architecture"] },
      { order: 8, title: "Stakeholder Management", description: "Manage stakeholders", skills: ["Communication", "Presentation", "Negotiation"] },
      { order: 9, title: "Product Launch", description: "Launch products", skills: ["Launch Strategy", "Go-to-Market", "Beta Testing"] },
      { order: 10, title: "Growth & Monetization", description: "Grow products", skills: ["Growth Hacking", "Pricing", "Monetization", "Retention"] },
      { order: 11, title: "Leadership & Influence", description: "Lead without authority", skills: ["Leadership", "Influence", "Team Building"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for PM roles", skills: ["Case Studies", "Product Sense", "Estimation"] },
    ],
    "JavaScript Developer": [
      { order: 1, title: "JavaScript Fundamentals", description: "Core JS concepts and ES6+", skills: ["JavaScript", "ES6+", "Variables", "Functions", "Objects"] },
      { order: 2, title: "DOM Manipulation", description: "Master the browser DOM", skills: ["DOM", "Events", "DOM Traversal", "Manipulation"] },
      { order: 3, title: "Asynchronous JavaScript", description: "Callbacks, promises, async/await", skills: ["Promises", "Async/Await", "Callbacks", "Event Loop"] },
      { order: 4, title: "Modern JS Features", description: "Modern JavaScript features", skills: ["Modules", "Destructuring", "Spread/Rest", "Classes"] },
      { order: 5, title: "Package Management", description: "npm/yarn and modules", skills: ["npm", "yarn", "Package.json", "Module System"] },
      { order: 6, title: "Testing JavaScript", description: "Test JS code", skills: ["Jest", "Mocha", "Chai", "Testing Patterns"] },
      { order: 7, title: "Build Tools", description: "Webpack, Vite, ESBuild", skills: ["Webpack", "Vite", "ESBuild", "Bundlers"] },
      { order: 8, title: "Backend JavaScript", description: "Learn Node.js basics", skills: ["Node.js", "Express", "REST API", "npm"] },
      { order: 9, title: "Performance & Optimization", description: "Optimize JS performance", skills: ["Performance", "Memory Leaks", "Profiling", "Caching"] },
      { order: 10, title: "Interview Preparation", description: "Prepare for JS interviews", skills: ["DSA", "JS Concepts", "System Design"] },
    ],
    "TypeScript Developer": [
      { order: 1, title: "TypeScript Basics", description: "Types, interfaces, and basics", skills: ["TypeScript", "Types", "Interfaces", "Type Annotations"] },
      { order: 2, title: "Advanced Types", description: "Union, intersection, conditional types", skills: ["Union Types", "Intersection", "Generics", "Mapped Types"] },
      { order: 3, title: "TypeScript with React", description: "Type-safe React components", skills: ["React", "TypeScript", "Props", "Hooks Typing"] },
      { order: 4, title: "TypeScript with Node.js", description: "Backend TypeScript", skills: ["Node.js", "TypeScript", "Express", "TypeORM"] },
      { order: 5, title: "Utility Types", description: "Built-in TypeScript utilities", skills: ["Partial", "Pick", "Omit", "Record", "ReturnType"] },
      { order: 6, title: "TypeScript Configuration", description: "tsconfig and project setup", skills: ["tsconfig", "Strict Mode", "Paths", "Project References"] },
      { order: 7, title: "Testing TypeScript", description: "Test type-safe code", skills: ["Jest", "TypeScript Testing", "ts-jest", "Type Testing"] },
      { order: 8, title: "TypeScript Patterns", description: "Advanced TypeScript patterns", skills: ["Branded Types", "Discriminated Unions", "Builder Pattern"] },
      { order: 9, title: "Declaration Files", description: "Write .d.ts files", skills: ["Declarations", "Ambient Modules", "Module Augmentation"] },
      { order: 10, title: "Interview Preparation", description: "Prepare for TS roles", skills: ["TypeScript Concepts", "DSA", "Design Patterns"] },
    ],
    "React Developer": [
      { order: 1, title: "React Fundamentals", description: "Components, JSX, and props", skills: ["React", "JSX", "Components", "Props"] },
      { order: 2, title: "React Hooks", description: "useState, useEffect, custom hooks", skills: ["Hooks", "useState", "useEffect", "Custom Hooks"] },
      { order: 3, title: "State Management", description: "Context, Redux, Zustand", skills: ["Context API", "Redux", "Zustand", "State Management"] },
      { order: 4, title: "React Router", description: "Client-side routing", skills: ["React Router", "Nested Routes", "Auth Guards"] },
      { order: 5, title: "Performance Optimization", description: "React.memo, useMemo, lazy loading", skills: ["React.memo", "useMemo", "Code Splitting", "Lazy Loading"] },
      { order: 6, title: "Testing React Apps", description: "RTL and Jest", skills: ["React Testing Library", "Jest", "Integration Tests"] },
      { order: 7, title: "Server Components", description: "React Server Components", skills: ["RSC", "Server Components", "Suspense", "Streaming"] },
      { order: 8, title: "React Ecosystem", description: "Form libraries, data fetching", skills: ["React Query", "React Hook Form", "Framer Motion"] },
      { order: 9, title: "Full Stack React", description: "Next.js or Remix", skills: ["Next.js", "Remix", "API Routes", "SSR/SSG"] },
      { order: 10, title: "Advanced Patterns", description: "Render props, HOCs, compound components", skills: ["Render Props", "HOCs", "Compound Components", "Portals"] },
      { order: 11, title: "System Design", description: "Design React applications", skills: ["Micro-frontends", "Architecture", "Component Design"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for React roles", skills: ["React Concepts", "DSA", "System Design"] },
    ],
    "Next.js Developer": [
      { order: 1, title: "React Foundation", description: "React basics for Next.js", skills: ["React", "Components", "Hooks", "JSX"] },
      { order: 2, title: "Next.js Basics", description: "Pages, routing, layouts", skills: ["Next.js", "Pages", "Layouts", "File-based Routing"] },
      { order: 3, title: "Data Fetching", description: "SSR, SSG, ISR", skills: ["getServerSideProps", "getStaticProps", "ISR", "SWR"] },
      { order: 4, title: "API Routes", description: "Build APIs with Next.js", skills: ["API Routes", "Middleware", "Edge Functions"] },
      { order: 5, title: "App Router", description: "Next.js 13+ App Router", skills: ["App Router", "Server Components", "Layouts", "Loading"] },
      { order: 6, title: "Database Integration", description: "Connect databases", skills: ["Prisma", "PostgreSQL", "MongoDB", "Vercel Postgres"] },
      { order: 7, title: "Authentication", description: "NextAuth.js, Auth0", skills: ["NextAuth.js", "JWT", "OAuth", "Session Management"] },
      { order: 8, title: "Styling", description: "Tailwind, CSS Modules", skills: ["Tailwind CSS", "CSS Modules", "Styled Components"] },
      { order: 9, title: "Deployment", description: "Vercel, Docker", skills: ["Vercel", "Docker", "CI/CD", "Edge Network"] },
      { order: 10, title: "Advanced Patterns", description: "Middleware, rewrites, i18n", skills: ["Middleware", "Rewrites", "i18n", "Redirects"] },
      { order: 11, title: "Performance", description: "Core Web Vitals, optimization", skills: ["Core Web Vitals", "Image Optimization", "Fonts", "Analytics"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Next.js roles", skills: ["Next.js Concepts", "React", "System Design"] },
    ],
    "Vue.js Developer": [
      { order: 1, title: "Vue.js Basics", description: "Reactivity, directives, templates", skills: ["Vue.js", "Reactivity", "Directives", "Templates"] },
      { order: 2, title: "Composition API", description: "Composition API and script setup", skills: ["Composition API", "ref", "reactive", "computed"] },
      { order: 3, title: "Vue Router", description: "Client-side routing", skills: ["Vue Router", "Nested Routes", "Navigation Guards"] },
      { order: 4, title: "State Management", description: "Pinia/Vuex", skills: ["Pinia", "Vuex", "State Management", "Stores"] },
      { order: 5, title: "Forms & Validation", description: "Handle form inputs", skills: ["v-model", "Form Validation", "VeeValidate", "Formkit"] },
      { order: 6, title: "API Integration", description: "Axios, fetch, data fetching", skills: ["Axios", "API Integration", "REST", "GraphQL"] },
      { order: 7, title: "Testing", description: "Vitest, Vue Test Utils", skills: ["Vitest", "Vue Test Utils", "Cypress"] },
      { order: 8, title: "Nuxt.js", description: "Full-stack Vue with Nuxt", skills: ["Nuxt.js", "SSR", "File-based Routing", "Server Routes"] },
      { order: 9, title: "Performance", description: "Lazy loading, code splitting", skills: ["Lazy Loading", "Code Splitting", "Bundle Optimization"] },
      { order: 10, title: "Interview Preparation", description: "Prepare for Vue roles", skills: ["Vue.js Concepts", "DSA", "System Design"] },
    ],
    "Angular Developer": [
      { order: 1, title: "TypeScript & ES6+", description: "TypeScript for Angular", skills: ["TypeScript", "ES6+", "Decorators", "Generics"] },
      { order: 2, title: "Angular Fundamentals", description: "Components, modules, templates", skills: ["Angular", "Components", "Modules", "Templates"] },
      { order: 3, title: "RxJS & Observables", description: "Reactive programming", skills: ["RxJS", "Observables", "Operators", "Subjects"] },
      { order: 4, title: "Angular Forms", description: "Template-driven and reactive forms", skills: ["Reactive Forms", "Template Forms", "Validators", "FormArray"] },
      { order: 5, title: "Routing & Navigation", description: "Angular Router", skills: ["Angular Router", "Lazy Loading", "Guards", "Resolvers"] },
      { order: 6, title: "State Management", description: "NgRx/Signal store", skills: ["NgRx", "Store", "Effects", "Signals"] },
      { order: 7, title: "HTTP & APIs", description: "HttpClient, interceptors", skills: ["HttpClient", "Interceptors", "Error Handling", "Caching"] },
      { order: 8, title: "Testing", description: "Jasmine, Karma, TestBed", skills: ["Jasmine", "Karma", "TestBed", "Component Testing"] },
      { order: 9, title: "Performance", description: "Change detection, optimization", skills: ["Change Detection", "OnPush", "TrackBy", "Lazy Loading"] },
      { order: 10, title: "Angular Material & CDK", description: "UI components", skills: ["Angular Material", "CDK", "Theming", "Accessibility"] },
      { order: 11, title: "Backend Integration", description: "Full-stack Angular", skills: ["Node.js", "Express", "REST API", "Auth"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Angular roles", skills: ["Angular Concepts", "TypeScript", "System Design"] },
    ],
    "Android Developer": [
      { order: 1, title: "Kotlin for Android", description: "Modern Android development", skills: ["Kotlin", "Android SDK", "Gradle"] },
      { order: 2, title: "Android Architecture", description: "Activities, fragments, lifecycle", skills: ["Activities", "Fragments", "Lifecycle", "ViewModel"] },
      { order: 3, title: "Jetpack Compose", description: "Modern UI toolkit", skills: ["Jetpack Compose", "Composables", "State", "Theming"] },
      { order: 4, title: "Data Persistence", description: "Room, DataStore, SQLite", skills: ["Room", "DataStore", "SQLite", "SharedPreferences"] },
      { order: 5, title: "Networking", description: "Retrofit, OkHttp, Ktor", skills: ["Retrofit", "OkHttp", "Ktor", "REST APIs"] },
      { order: 6, title: "Dependency Injection", description: "Hilt, Dagger, Koin", skills: ["Hilt", "Dagger", "Koin", "DI Patterns"] },
      { order: 7, title: "Navigation", description: "Navigation Component", skills: ["Navigation", "Deep Links", "NavGraph", "Bottom Nav"] },
      { order: 8, title: "Firebase", description: "Firebase services", skills: ["Firebase Auth", "Firestore", "Cloud Messaging", "Analytics"] },
      { order: 9, title: "Testing", description: "JUnit, Espresso, MockK", skills: ["JUnit", "Espresso", "MockK", "UI Testing"] },
      { order: 10, title: "Play Store", description: "Publishing and CI/CD", skills: ["Google Play", "App Signing", "CI/CD", "Review"] },
      { order: 11, title: "Performance", description: "Memory, battery, optimization", skills: ["Memory Management", "Battery", "Network", "ProGuard"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Android roles", skills: ["Android Concepts", "DSA", "System Design"] },
    ],
    "iOS Developer": [
      { order: 1, title: "Swift Fundamentals", description: "Modern Swift language", skills: ["Swift", "Xcode", "Playgrounds", "Swift Package Manager"] },
      { order: 2, title: "SwiftUI", description: "Declarative iOS UI", skills: ["SwiftUI", "Views", "Modifiers", "State"] },
      { order: 3, title: "UIKit", description: "Traditional iOS framework", skills: ["UIKit", "ViewControllers", "Auto Layout", "Storyboards"] },
      { order: 4, title: "Data Persistence", description: "Core Data, SwiftData, UserDefaults", skills: ["Core Data", "SwiftData", "UserDefaults", "CloudKit"] },
      { order: 5, title: "Networking", description: "URLSession, Alamofire", skills: ["URLSession", "Alamofire", "Codable", "REST APIs"] },
      { order: 6, title: "Concurrency", description: "Async/await, actors", skills: ["async/await", "Actors", "Task Groups", "Sendable"] },
      { order: 7, title: "Architecture", description: "MVVM, Coordinators", skills: ["MVVM", "Coordinators", "SOLID", "Clean Architecture"] },
      { order: 8, title: "App Store", description: "Publishing and TestFlight", skills: ["App Store Connect", "TestFlight", "Code Signing", "Review"] },
      { order: 9, title: "Testing", description: "XCTest, UI testing", skills: ["XCTest", "UI Testing", "Snapshot Testing", "Performance"] },
      { order: 10, title: "Combine & Swift Concurrency", description: "Reactive iOS", skills: ["Combine", "Swift Concurrency", "Publishers", "Subscribers"] },
      { order: 11, title: "Advanced iOS", description: "Push notifications, background tasks", skills: ["Push Notifications", "Background Tasks", "Widgets", "App Clips"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for iOS roles", skills: ["iOS Concepts", "DSA", "System Design"] },
    ],
    "Flutter Developer": [
      { order: 1, title: "Dart Programming", description: "Learn Dart language", skills: ["Dart", "Async/Await", "Streams", "Collections"] },
      { order: 2, title: "Flutter Widgets", description: "Widget tree and composition", skills: ["Flutter", "Widgets", "Stateless", "Stateful"] },
      { order: 3, title: "State Management", description: "Provider, Riverpod, Bloc", skills: ["Provider", "Riverpod", "Bloc", "GetX"] },
      { order: 4, title: "Navigation & Routing", description: "GoRouter, Navigator 2.0", skills: ["GoRouter", "Navigator 2.0", "Deep Links"] },
      { order: 5, title: "Data & APIs", description: "HTTP, Dio, GraphQL", skills: ["Dio", "REST API", "GraphQL", "JSON Serialization"] },
      { order: 6, title: "Local Storage", description: "SQLite, Hive, SharedPreferences", skills: ["SQLite", "Hive", "SharedPreferences", "File Storage"] },
      { order: 7, title: "Firebase Integration", description: "Firebase with Flutter", skills: ["Firebase Auth", "Firestore", "Cloud Messaging", "Storage"] },
      { order: 8, title: "Platform Channels", description: "Native platform code", skills: ["Platform Channels", "Method Channel", "Native Modules"] },
      { order: 9, title: "Testing", description: "Flutter tests", skills: ["Unit Tests", "Widget Tests", "Integration Tests", "Mockito"] },
      { order: 10, title: "App Stores", description: "Deploy to stores", skills: ["Google Play", "App Store", "CI/CD", "Code Signing"] },
      { order: 11, title: "Performance", description: "Flutter performance", skills: ["Performance", "Rebuilds", "Memory", "Animation"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Flutter roles", skills: ["Flutter Concepts", "Dart", "DSA"] },
    ],
    "React Native Developer": [
      { order: 1, title: "React Foundation", description: "React for mobile", skills: ["React", "JSX", "Hooks", "Components"] },
      { order: 2, title: "React Native Core", description: "Core RN components", skills: ["React Native", "Views", "Text", "ScrollView", "FlatList"] },
      { order: 3, title: "Navigation", description: "React Navigation", skills: ["React Navigation", "Stack", "Tab", "Drawer"] },
      { order: 4, title: "State Management", description: "Redux, Zustand, Context", skills: ["Redux", "Zustand", "Context API", "MMKV"] },
      { order: 5, title: "Native Modules", description: "Native platform code", skills: ["Native Modules", "Turbo Modules", "Fabric", "JSI"] },
      { order: 6, title: "Networking", description: "API integration", skills: ["Axios", "REST API", "GraphQL", "WebSockets"] },
      { order: 7, title: "Data Persistence", description: "SQLite, AsyncStorage", skills: ["SQLite", "AsyncStorage", "WatermelonDB", "Realm"] },
      { order: 8, title: "Animations", description: "RN animations", skills: ["Animated API", "Reanimated", "Lottie", "Gesture Handler"] },
      { order: 9, title: "Testing", description: "RN testing", skills: ["Jest", "React Native Testing Library", "Detox"] },
      { order: 10, title: "App Stores", description: "Deploy RN apps", skills: ["Google Play", "App Store", "CodePush", "CI/CD"] },
      { order: 11, title: "Performance", description: "RN performance", skills: ["Performance", "Bridge", "Hermes", "RAM Bundles"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for RN roles", skills: ["React Native", "React", "DSA"] },
    ],
    "Python Developer": [
      { order: 1, title: "Python Core", description: "Python fundamentals", skills: ["Python", "Data Types", "Control Flow", "Functions"] },
      { order: 2, title: "OOP & Patterns", description: "Object-oriented Python", skills: ["OOP", "Classes", "Inheritance", "Design Patterns"] },
      { order: 3, title: "Django Framework", description: "Full-stack Django", skills: ["Django", "ORM", "Admin", "Views", "Templates"] },
      { order: 4, title: "FastAPI/Flask", description: "Modern Python APIs", skills: ["FastAPI", "Flask", "REST API", "OpenAPI"] },
      { order: 5, title: "Databases", description: "SQL and Python", skills: ["PostgreSQL", "SQLAlchemy", "Django ORM", "Redis"] },
      { order: 6, title: "Testing", description: "pytest, unittest", skills: ["pytest", "unittest", "Mock", "TDD"] },
      { order: 7, title: "Async Python", description: "Async/await, asyncio", skills: ["asyncio", "async/await", "aiohttp", "WebSockets"] },
      { order: 8, title: "Docker & Deployment", description: "Containerize Python apps", skills: ["Docker", "Gunicorn", "Nginx", "CI/CD"] },
      { order: 9, title: "Package Management", description: "PyPI, Poetry, pip", skills: ["Poetry", "pip", "PyPI", "Virtual Environments"] },
      { order: 10, title: "Background Tasks", description: "Celery, Redis Queue", skills: ["Celery", "Redis Queue", "Background Tasks", "Scheduling"] },
      { order: 11, title: "API Design", description: "Best practices", skills: ["REST", "GraphQL", "API Security", "Rate Limiting"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Python roles", skills: ["Python", "DSA", "System Design"] },
    ],
    "Java Developer": [
      { order: 1, title: "Java Core", description: "Java language fundamentals", skills: ["Java", "OOP", "Collections", "Streams"] },
      { order: 2, title: "Build Tools", description: "Maven, Gradle", skills: ["Maven", "Gradle", "Dependencies", "Build Lifecycle"] },
      { order: 3, title: "Spring Boot", description: "Modern Java framework", skills: ["Spring Boot", "IoC", "Auto-configuration", "Actuator"] },
      { order: 4, title: "Spring Data", description: "Database access", skills: ["Spring Data JPA", "Hibernate", "Transactions", "QueryDSL"] },
      { order: 5, title: "REST APIs with Spring", description: "Build REST APIs", skills: ["REST", "Spring MVC", "Validation", "Exception Handling"] },
      { order: 6, title: "Microservices", description: "Spring Cloud, service discovery", skills: ["Microservices", "Eureka", "Gateway", "Feign", "Resilience4j"] },
      { order: 7, title: "Security", description: "Spring Security", skills: ["Spring Security", "JWT", "OAuth2", "Method Security"] },
      { order: 8, title: "Testing", description: "JUnit, Mockito, Integration tests", skills: ["JUnit 5", "Mockito", "Testcontainers", "Integration Tests"] },
      { order: 9, title: "Message Queues", description: "Kafka, RabbitMQ", skills: ["Kafka", "RabbitMQ", "Event-Driven", "Pub/Sub"] },
      { order: 10, title: "Docker & K8s", description: "Containerize Java apps", skills: ["Docker", "Kubernetes", "Helm", "Deployment"] },
      { order: 11, title: "Performance", description: "JVM tuning, profiling", skills: ["JVM", "GC Tuning", "Profiling", "Memory Management"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Java roles", skills: ["Java", "DSA", "System Design"] },
    ],
    "C# Developer": [
      { order: 1, title: "C# Language", description: "Modern C# features", skills: ["C#", ".NET", "LINQ", "Async/Await"] },
      { order: 2, title: ".NET Core", description: "Cross-platform .NET", skills: [".NET Core", "CLI", "Configuration", "Middleware"] },
      { order: 3, title: "ASP.NET Core", description: "Web API development", skills: ["ASP.NET Core", "REST API", "Minimal APIs", "SignalR"] },
      { order: 4, title: "Entity Framework", description: "Database ORM", skills: ["Entity Framework", "Code First", "Migrations", "LINQ"] },
      { order: 5, title: "Azure Integration", description: "Cloud services", skills: ["Azure", "Azure Functions", "Azure SQL", "Service Bus"] },
      { order: 6, title: "Testing", description: "xUnit, Moq, FluentAssertions", skills: ["xUnit", "Moq", "FluentAssertions", "Integration Tests"] },
      { order: 7, title: "Dependency Injection", description: "DI patterns in .NET", skills: ["DI", "IoC Containers", "Scoped/Transient/Singleton"] },
      { order: 8, title: "Microservices", description: ".NET microservices", skills: ["Microservices", "gRPC", "Docker", "Orleans"] },
      { order: 9, title: "Blazor", description: "Full-stack C# web", skills: ["Blazor", "Components", "WebAssembly", "Server"] },
      { order: 10, title: "Performance", description: "Optimize .NET apps", skills: ["Performance", "Span/Caching", "Benchmarking", "Memory"] },
      { order: 11, title: "Clean Architecture", description: "Architecture patterns", skills: ["Clean Architecture", "DDD", "CQRS", "MediatR"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for C# roles", skills: ["C#", "DSA", "System Design"] },
    ],
    "Go Developer": [
      { order: 1, title: "Go Basics", description: "Go syntax and tooling", skills: ["Go", "Types", "Functions", "Packages"] },
      { order: 2, title: "Concurrency", description: "Goroutines and channels", skills: ["Goroutines", "Channels", "Mutex", "WaitGroups"] },
      { order: 3, title: "HTTP Services", description: "Build web services", skills: ["net/http", "Mux", "REST API", "Middleware"] },
      { order: 4, title: "Data & SQL", description: "Database access", skills: ["PostgreSQL", "sqlx", "GORM", "Migrations"] },
      { order: 5, title: "Testing", description: "Go testing patterns", skills: ["go test", "Table Tests", "Mocking", "Benchmarks"] },
      { order: 6, title: "CLI Tools", description: "Build CLI applications", skills: ["Cobra", "Viper", "CLI Design", "Flags"] },
      { order: 7, title: "gRPC", description: "gRPC services", skills: ["gRPC", "Protocol Buffers", "Client/Server", "Streaming"] },
      { order: 8, title: "Docker & Deployment", description: "Containerize Go apps", skills: ["Docker", "Multi-stage Builds", "Kubernetes", "Deploy"] },
      { order: 9, title: "Go Modules", description: "Dependency management", skills: ["Go Modules", "Versioning", "Private Modules", "Vendoring"] },
      { order: 10, title: "Performance", description: "Profiling and optimization", skills: ["pprof", "Benchmarking", "Memory", "Optimization"] },
      { order: 11, title: "System Programming", description: "Advanced Go", skills: ["Networking", "File Systems", "Signal Handling", "CGo"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Go roles", skills: ["Go Concepts", "Concurrency", "System Design"] },
    ],
    "Rust Developer": [
      { order: 1, title: "Rust Fundamentals", description: "Ownership, borrowing, lifetimes", skills: ["Rust", "Ownership", "Borrowing", "Lifetimes"] },
      { order: 2, title: "Types & Traits", description: "Advanced type system", skills: ["Traits", "Generics", "Enums", "Pattern Matching"] },
      { order: 3, title: "Error Handling", description: "Result, Option, custom errors", skills: ["Result", "Option", "Error Handling", "thiserror", "anyhow"] },
      { order: 4, title: "Async Rust", description: "Async/await, tokio", skills: ["async/await", "Tokio", "Futures", "Async Traits"] },
      { order: 5, title: "Testing", description: "Rust testing", skills: ["Unit Tests", "Integration Tests", "Proptest", "Criterion"] },
      { order: 6, title: "CLI & Tooling", description: "Build CLI in Rust", skills: ["clap", "CLI Tools", "Terminal Apps", "serde"] },
      { order: 7, title: "Web Services", description: "Actix-web, Axum", skills: ["Actix-web", "Axum", "REST API", "SQLx"] },
      { order: 8, title: "Concurrency", description: "Advanced concurrency", skills: ["Concurrency", "Atomics", "Mutex", "RwLock"] },
      { order: 9, title: "WebAssembly", description: "Rust to WASM", skills: ["WebAssembly", "wasm-pack", "wasm-bindgen", "Yew"] },
      { order: 10, title: "Systems Programming", description: "Low-level Rust", skills: ["Unsafe Rust", "FFI", "Memory Management"] },
      { order: 11, title: "Performance", description: "Zero-cost abstractions", skills: ["Performance", "SIMD", "Cache", "Optimization"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Rust roles", skills: ["Rust Concepts", "Systems Programming", "DSA"] },
    ],
    "PHP Developer": [
      { order: 1, title: "PHP Basics", description: "PHP language fundamentals", skills: ["PHP", "Syntax", "Types", "Functions", "OOP"] },
      { order: 2, title: "Laravel Framework", description: "Modern PHP framework", skills: ["Laravel", "Artisan", "Eloquent", "Blade"] },
      { order: 3, title: "Database & Eloquent", description: "Database ORM", skills: ["Eloquent", "MySQL", "Migrations", "Relationships"] },
      { order: 4, title: "REST APIs", description: "Build APIs with Laravel", skills: ["REST API", "API Resources", "Sanctum"] },
      { order: 5, title: "Authentication", description: "Auth systems", skills: ["Laravel Breeze/Jetstream", "Auth", "Roles", "Permissions"] },
      { order: 6, title: "Testing", description: "PHPUnit, Pest", skills: ["PHPUnit", "Pest", "Feature Tests", "Unit Tests"] },
      { order: 7, title: "Livewire & Alpine.js", description: "Modern PHP frontend", skills: ["Livewire", "Alpine.js", "Components", "Reactive"] },
      { order: 8, title: "Deployment", description: "Deploy PHP apps", skills: ["Forge", "Envoyer", "Docker", "CI/CD"] },
      { order: 9, title: "Packages & Composer", description: "Dependency management", skills: ["Composer", "Packagist", "Package Creation"] },
      { order: 10, title: "Performance", description: "PHP optimization", skills: ["Caching", "Queues", "Horizon", "Optimization"] },
      { order: 11, title: "Filament & TALL Stack", description: "Admin panels", skills: ["Filament", "TALL Stack", "Admin Panels"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for PHP roles", skills: ["PHP Concepts", "Laravel", "DSA"] },
    ],
    "Kotlin Developer": [
      { order: 1, title: "Kotlin Language", description: "Modern JVM language", skills: ["Kotlin", "Null Safety", "Extensions", "Coroutines"] },
      { order: 2, title: "Kotlin Multiplatform", description: "Share code across platforms", skills: ["KMP", "Common Module", "Expect/Actual", "Compose Multiplatform"] },
      { order: 3, title: "Spring Boot with Kotlin", description: "Backend with Kotlin", skills: ["Spring Boot", "Kotlin DSL", "Exposed", "Ktor"] },
      { order: 4, title: "Ktor Framework", description: "Lightweight Kotlin backend", skills: ["Ktor", "Routing", "Content Negotiation", "WebSockets"] },
      { order: 5, title: "Coroutines & Flow", description: "Async programming", skills: ["Coroutines", "Flow", "Channels", "Structured Concurrency"] },
      { order: 6, title: "Testing", description: "Kotlin testing", skills: ["Kotest", "MockK", "JUnit", "Integration Tests"] },
      { order: 7, title: "Android with Kotlin", description: "Android development", skills: ["Android SDK", "Jetpack", "Compose", "MVVM"] },
      { order: 8, title: "Functional Kotlin", description: "Functional programming", skills: ["Arrow", "Functional Patterns", "Monads", "Immutability"] },
      { order: 9, title: "Serialization", description: "kotlinx.serialization", skills: ["Serialization", "JSON", "Protocol Buffers"] },
      { order: 10, title: "Performance", description: "Optimize Kotlin", skills: ["Performance", "Inline", "Value Classes", "Optimization"] },
      { order: 11, title: "Full Stack Kotlin", description: "Full-stack with Kotlin/JS", skills: ["Kotlin/JS", "React with Kotlin", "Full Stack"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Kotlin roles", skills: ["Kotlin", "DSA", "System Design"] },
    ],
    "Data Analyst": [
      { order: 1, title: "SQL Mastery", description: "Query and analyze data", skills: ["SQL", "SELECT", "JOINs", "Aggregations", "Window Functions"] },
      { order: 2, title: "Python for Data", description: "Pandas, NumPy", skills: ["Python", "Pandas", "NumPy", "Data Cleaning"] },
      { order: 3, title: "Statistics", description: "Statistical analysis", skills: ["Statistics", "Probability", "Hypothesis Testing", "A/B Testing"] },
      { order: 4, title: "Data Visualization", description: "Visualize insights", skills: ["Matplotlib", "Seaborn", "Tableau", "Power BI"] },
      { order: 5, title: "Excel & Sheets", description: "Advanced spreadsheet analysis", skills: ["Excel", "Pivot Tables", "VLOOKUP", "Power Query"] },
      { order: 6, title: "Data Cleaning", description: "Clean and prepare data", skills: ["Data Cleaning", "Outliers", "Missing Data", "Normalization"] },
      { order: 7, title: "Business Metrics", description: "KPI and metrics", skills: ["KPIs", "Cohort Analysis", "Funnel Analysis", "Retention"] },
      { order: 8, title: "Dashboard Creation", description: "Build interactive dashboards", skills: ["Tableau", "Power BI", "Looker", "Metabase"] },
      { order: 9, title: "Reporting", description: "Data storytelling", skills: ["Reporting", "Data Storytelling", "Communication", "Presentations"] },
      { order: 10, title: "Interview Preparation", description: "Prepare for data analyst roles", skills: ["SQL", "Statistics", "Case Studies"] },
    ],
    "Deep Learning Engineer": [
      { order: 1, title: "Math Foundations", description: "Linear algebra, calculus, probability", skills: ["Linear Algebra", "Calculus", "Probability", "Statistics"] },
      { order: 2, title: "Python for ML", description: "NumPy, Pandas, Matplotlib", skills: ["NumPy", "Pandas", "Matplotlib", "Scientific Computing"] },
      { order: 3, title: "Neural Networks", description: "MLPs, backpropagation", skills: ["Neural Networks", "Backpropagation", "Activation Functions", "Gradient Descent"] },
      { order: 4, title: "PyTorch", description: "Deep learning framework", skills: ["PyTorch", "Tensors", "Autograd", "nn.Module"] },
      { order: 5, title: "TensorFlow/Keras", description: "Alternative framework", skills: ["TensorFlow", "Keras", "tf.data", "SavedModel"] },
      { order: 6, title: "CNNs", description: "Convolutional neural networks", skills: ["CNNs", "Conv2D", "Pooling", "Transfer Learning"] },
      { order: 7, title: "RNNs & LSTMs", description: "Sequence models", skills: ["RNN", "LSTM", "GRU", "Sequence Modeling"] },
      { order: 8, title: "Transformers", description: "Attention is all you need", skills: ["Transformers", "Self-Attention", "BERT", "GPT"] },
      { order: 9, title: "GANs & VAEs", description: "Generative models", skills: ["GANs", "VAEs", "Diffusion Models", "Generative AI"] },
      { order: 10, title: "Model Optimization", description: "Quantization, pruning", skills: ["Quantization", "Pruning", "ONNX", "TensorRT"] },
      { order: 11, title: "MLOps", description: "ML pipelines", skills: ["MLflow", "Docker", "Kubeflow", "Model Serving"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for DL roles", skills: ["Deep Learning", "ML Theory", "System Design"] },
    ],
    "NLP Engineer": [
      { order: 1, title: "Python & NLP Basics", description: "Python for NLP", skills: ["Python", "NLP", "Regular Expressions", "spaCy"] },
      { order: 2, title: "Text Processing", description: "Tokenization, stemming, lemmatization", skills: ["Tokenization", "Stemming", "Lemmatization", "NLTK"] },
      { order: 3, title: "Word Embeddings", description: "Word2Vec, GloVe, FastText", skills: ["Word2Vec", "GloVe", "FastText", "Embeddings"] },
      { order: 4, title: "Sequence Models", description: "RNNs, LSTMs for NLP", skills: ["RNN", "LSTM", "BiLSTM", "Seq2Seq"] },
      { order: 5, title: "Transformers", description: "Transformer architecture", skills: ["Transformers", "Self-Attention", "BERT", "RoBERTa"] },
      { order: 6, title: "Hugging Face", description: "HF ecosystem", skills: ["Hugging Face", "Transformers", "Datasets", "Tokenizers"] },
      { order: 7, title: "Named Entity Recognition", description: "NER systems", skills: ["NER", "Entity Recognition", "CRF", "Custom NER"] },
      { order: 8, title: "Text Classification", description: "Sentiment, topic classification", skills: ["Text Classification", "Sentiment Analysis", "Zero-shot"] },
      { order: 9, title: "Question Answering", description: "QA systems", skills: ["QA", "SQuAD", "Retrieval", "Reading Comprehension"] },
      { order: 10, title: "Machine Translation", description: "Translation systems", skills: ["Machine Translation", "NMT", "Transformers", "BLEU"] },
      { order: 11, title: "LLM Fine-tuning", description: "Fine-tune language models", skills: ["Fine-tuning", "LoRA", "PEFT", "RLHF"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for NLP roles", skills: ["NLP", "Deep Learning", "Transformers"] },
    ],
    "Computer Vision Engineer": [
      { order: 1, title: "Image Processing", description: "OpenCV, image basics", skills: ["OpenCV", "Image Processing", "Filters", "Histograms"] },
      { order: 2, title: "Python & ML Basics", description: "Python, NumPy for CV", skills: ["Python", "NumPy", "Matplotlib", "Scikit-image"] },
      { order: 3, title: "Feature Detection", description: "SIFT, SURF, ORB", skills: ["SIFT", "SURF", "ORB", "Feature Matching"] },
      { order: 4, title: "CNNs for Vision", description: "Convolutional networks", skills: ["CNNs", "ResNet", "VGG", "Inception"] },
      { order: 5, title: "Object Detection", description: "YOLO, SSD, Faster R-CNN", skills: ["Object Detection", "YOLO", "SSD", "Faster R-CNN"] },
      { order: 6, title: "Image Segmentation", description: "Semantic and instance segmentation", skills: ["Segmentation", "U-Net", "Mask R-CNN", "SAM"] },
      { order: 7, title: "Video Analysis", description: "Video processing, tracking", skills: ["Video Analysis", "Object Tracking", "Optical Flow", "Action Recognition"] },
      { order: 8, title: "3D Vision", description: "Depth, point clouds", skills: ["3D Vision", "Point Cloud", "Depth Estimation", "NeRF"] },
      { order: 9, title: "GANs for CV", description: "Image generation", skills: ["GANs", "Image Generation", "Style Transfer", "Super Resolution"] },
      { order: 10, title: "Model Deployment", description: "Deploy CV models", skills: ["ONNX", "TensorRT", "Docker", "Edge Deployment"] },
      { order: 11, title: "Production Systems", description: "Build CV pipelines", skills: ["Pipeline", "Monitoring", "Data Labeling", "Active Learning"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for CV roles", skills: ["Computer Vision", "Deep Learning", "System Design"] },
    ],
    "Prompt Engineer": [
      { order: 1, title: "LLM Fundamentals", description: "Understanding LLMs", skills: ["LLMs", "Prompting Basics", "Tokenization", "Context Windows"] },
      { order: 2, title: "Prompt Techniques", description: "Chain-of-thought, few-shot", skills: ["Chain-of-Thought", "Few-shot", "Zero-shot", "Role Prompting"] },
      { order: 3, title: "Advanced Prompting", description: "Tree-of-thought, self-consistency", skills: ["Tree-of-Thought", "Self-Consistency", "ReAct", "Reflexion"] },
      { order: 4, title: "API Integration", description: "OpenAI, Anthropic, Google APIs", skills: ["OpenAI API", "Anthropic API", "Gemini API", "Function Calling"] },
      { order: 5, title: "RAG for Prompts", description: "Retrieval-augmented generation", skills: ["RAG", "Vector Search", "Context Retrieval", "Hybrid Search"] },
      { order: 6, title: "Prompt Optimization", description: "A/B test, iterate prompts", skills: ["A/B Testing", "Prompt Iteration", "Metrics", "Templates"] },
      { order: 7, title: "AI Agents", description: "Build agent systems", skills: ["AI Agents", "Tool Use", "Autonomous Workflows"] },
      { order: 8, title: "Safety & Ethics", description: "Responsible AI", skills: ["Prompt Injection", "Jailbreak", "Guardrails", "Bias"] },
      { order: 9, title: "Evaluation", description: "Evaluate prompt quality", skills: ["Evaluation", "Metrics", "Benchmarks", "Human Eval"] },
      { order: 10, title: "Production Prompts", description: "Manage prompts in prod", skills: ["Prompt Management", "Versioning", "Testing", "Monitoring"] },
      { order: 11, title: "Application Building", description: "Build prompt-based apps", skills: ["Python", "Streamlit", "FastAPI", "Frontend Integration"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for prompt engineering roles", skills: ["Prompting", "LLMs", "AI Agents"] },
    ],
    "LLM Engineer": [
      { order: 1, title: "Python & PyTorch", description: "ML foundations", skills: ["Python", "PyTorch", "NumPy", "Pandas"] },
      { order: 2, title: "NLP Fundamentals", description: "Tokenization, embeddings", skills: ["NLP", "Tokenization", "Embeddings", "Transformers"] },
      { order: 3, title: "Transformers Deep Dive", description: "Architecture, attention", skills: ["Transformers", "Self-Attention", "Multi-head", "Positional Encoding"] },
      { order: 4, title: "LLM Architecture", description: "GPT, LLaMA, Mistral", skills: ["GPT", "LLaMA", "Mistral", "Architecture"] },
      { order: 5, title: "Fine-tuning", description: "LoRA, QLoRA, full fine-tune", skills: ["Fine-tuning", "LoRA", "QLoRA", "PEFT"] },
      { order: 6, title: "RAG Systems", description: "Retrieval-augmented generation", skills: ["RAG", "Chunking", "Embeddings", "Vector DBs", "Hybrid Search"] },
      { order: 7, title: "AI Agents", description: "Autonomous LLM agents", skills: ["AI Agents", "LangGraph", "Tool Calling", "Memory", "Multi-Agent"] },
      { order: 8, title: "MCP Protocol", description: "Model Context Protocol", skills: ["MCP", "MCP Servers", "MCP Clients", "Tool Integration"] },
      { order: 9, title: "LLM Evaluation", description: "Evaluate LLM outputs", skills: ["Evaluation", "Hallucination", "Rouge", "BLEU", "Human Eval"] },
      { order: 10, title: "Deployment", description: "Deploy LLMs", skills: ["Docker", "Kubernetes", "vLLM", "TGI", "Ollama"] },
      { order: 11, title: "Production Systems", description: "Build LLM products", skills: ["FastAPI", "Monitoring", "Cost Tracking", "Latency"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for LLM roles", skills: ["LLMs", "Transformers", "System Design", "AI"] },
    ],
    "Generative AI Engineer": [
      { order: 1, title: "Python & PyTorch", description: "ML foundations", skills: ["Python", "PyTorch", "TensorFlow", "NumPy"] },
      { order: 2, title: "Deep Learning", description: "Neural networks", skills: ["Neural Networks", "CNNs", "RNNs", "Transformers"] },
      { order: 3, title: "GANs", description: "Generative adversarial networks", skills: ["GANs", "DCGAN", "StyleGAN", "Training Stability"] },
      { order: 4, title: "Diffusion Models", description: "DDPM, Stable Diffusion", skills: ["Diffusion Models", "DDPM", "Stable Diffusion", "Latent Diffusion"] },
      { order: 5, title: "VAEs", description: "Variational autoencoders", skills: ["VAEs", "KL Divergence", "Reparameterization"] },
      { order: 6, title: "LLMs for Generation", description: "Text generation", skills: ["LLMs", "GPT", "Text Generation", "Prompting"] },
      { order: 7, title: "Image Generation", description: "Text-to-image, image-to-image", skills: ["Stable Diffusion", "DALL-E", "Midjourney", "ComfyUI"] },
      { order: 8, title: "Video Generation", description: "Text-to-video", skills: ["Video Generation", "Animation", "Frame Interpolation"] },
      { order: 9, title: "Multi-modal Models", description: "Text, image, audio", skills: ["Multi-modal", "CLIP", "BLIP", "ImageBind"] },
      { order: 10, title: "Fine-tuning GenAI", description: "LoRA, DreamBooth", skills: ["LoRA", "DreamBooth", "ControlNet", "Custom Models"] },
      { order: 11, title: "Deployment", description: "Deploy generative models", skills: ["Docker", "API", "GPU Serving", "Cost Optimization"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for GenAI roles", skills: ["Generative AI", "Diffusion Models", "LLMs"] },
    ],
    "Cloud Engineer": [
      { order: 1, title: "Cloud Fundamentals", description: "Cloud concepts, IaaS/PaaS/SaaS", skills: ["Cloud Computing", "Virtualization", "Networking", "Linux"] },
      { order: 2, title: "AWS Core", description: "EC2, S3, VPC, IAM", skills: ["EC2", "S3", "VPC", "IAM", "Route53"] },
      { order: 3, title: "GCP Services", description: "Compute, Storage, Networking", skills: ["Compute Engine", "Cloud Storage", "VPC", "Cloud CDN"] },
      { order: 4, title: "Azure Services", description: "VMs, Storage, Networking", skills: ["Azure VMs", "Azure Storage", "Virtual Network", "Azure AD"] },
      { order: 5, title: "Infrastructure as Code", description: "Terraform, CloudFormation", skills: ["Terraform", "CloudFormation", "Pulumi", "State Management"] },
      { order: 6, title: "Containerization", description: "Docker, ECS, AKS, GKE", skills: ["Docker", "ECS", "AKS", "GKE", "Container Registry"] },
      { order: 7, title: "CI/CD", description: "Build pipelines", skills: ["GitHub Actions", "Jenkins", "GitLab CI", "Spinnaker"] },
      { order: 8, title: "Monitoring", description: "Cloud monitoring tools", skills: ["CloudWatch", "Stackdriver", "Azure Monitor", "Grafana"] },
      { order: 9, title: "Security & Compliance", description: "Cloud security", skills: ["Security Groups", "Encryption", "Compliance", "Audit"] },
      { order: 10, title: "Cost Management", description: "Optimize cloud costs", skills: ["Cost Explorer", "Reserved Instances", "Spot", "Savings Plans"] },
      { order: 11, title: "Migration", description: "Cloud migration", skills: ["Migration", "Lift & Shift", "AWS MGN", "Hybrid Cloud"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for cloud roles", skills: ["Cloud Architecture", "System Design", "Costing"] },
    ],
    "AWS Engineer": [
      { order: 1, title: "AWS Fundamentals", description: "Core AWS concepts", skills: ["AWS", "Global Infrastructure", "Free Tier", "Billing"] },
      { order: 2, title: "Compute Services", description: "EC2, Lambda, ECS, EKS", skills: ["EC2", "Lambda", "ECS", "EKS", "Fargate"] },
      { order: 3, title: "Storage Services", description: "S3, EBS, EFS, Glacier", skills: ["S3", "EBS", "EFS", "Glacier", "Storage Classes"] },
      { order: 4, title: "Database Services", description: "RDS, DynamoDB, Aurora", skills: ["RDS", "DynamoDB", "Aurora", "ElastiCache", "Redshift"] },
      { order: 5, title: "Networking", description: "VPC, CloudFront, Route53", skills: ["VPC", "Subnets", "CloudFront", "Route53", "ELB"] },
      { order: 6, title: "Security & IAM", description: "AWS security", skills: ["IAM", "Security Groups", "KMS", "WAF", "Shield"] },
      { order: 7, title: "Serverless", description: "Lambda, API Gateway, Step Functions", skills: ["API Gateway", "Step Functions", "EventBridge", "SQS/SNS"] },
      { order: 8, title: "DevOps Tools", description: "CodePipeline, CodeBuild", skills: ["CodePipeline", "CodeBuild", "CloudFormation", "CDK"] },
      { order: 9, title: "Monitoring & Logging", description: "CloudWatch, X-Ray", skills: ["CloudWatch", "X-Ray", "CloudTrail", "Config"] },
      { order: 10, title: "Cost Optimization", description: "AWS cost management", skills: ["Cost Explorer", "Trusted Advisor", "Compute Optimizer"] },
      { order: 11, title: "Well-Architected", description: "AWS Well-Architected Framework", skills: ["Well-Architected", "Reliability", "Security", "Performance"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for AWS roles", skills: ["AWS Services", "Architecture", "Scenario Questions"] },
    ],
    "Azure Engineer": [
      { order: 1, title: "Azure Fundamentals", description: "Azure basics and portal", skills: ["Azure", "Azure Portal", "Subscriptions", "Resource Groups"] },
      { order: 2, title: "Compute", description: "VMs, App Service, Functions, AKS", skills: ["Azure VMs", "App Service", "Azure Functions", "AKS"] },
      { order: 3, title: "Storage", description: "Blob, Disk, Files, Cosmos DB", skills: ["Blob Storage", "Disk Storage", "Azure Files", "Cosmos DB"] },
      { order: 4, title: "Networking", description: "Virtual Network, Load Balancer, CDN", skills: ["VNet", "Load Balancer", "Azure DNS", "CDN", "VPN"] },
      { order: 5, title: "Databases", description: "Azure SQL, Cosmos DB, Redis", skills: ["Azure SQL", "Cosmos DB", "Azure Cache for Redis"] },
      { order: 6, title: "Identity & Security", description: "Azure AD, RBAC, Security Center", skills: ["Azure AD", "RBAC", "Security Center", "Key Vault"] },
      { order: 7, title: "DevOps", description: "Azure DevOps, Boards, Pipelines", skills: ["Azure DevOps", "Pipelines", "Repos", "Artifacts", "Boards"] },
      { order: 8, title: "ARM & Bicep", description: "Infrastructure as Code", skills: ["ARM Templates", "Bicep", "Deployment", "Resource Manager"] },
      { order: 9, title: "Monitoring", description: "Azure Monitor, Log Analytics", skills: ["Azure Monitor", "Log Analytics", "Application Insights"] },
      { order: 10, title: "Hybrid Cloud", description: "Hybrid and migration", skills: ["Azure Arc", "Hybrid Cloud", "Migration", "Azure Stack"] },
      { order: 11, title: "Solutions Architecture", description: "Design Azure solutions", skills: ["Architecture", "High Availability", "DR", "Scalability"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Azure roles", skills: ["Azure", "Architecture", "Scenario Questions"] },
    ],
    "Google Cloud Engineer": [
      { order: 1, title: "GCP Fundamentals", description: "GCP basics and console", skills: ["GCP", "Projects", "Console", "IAM", "Cloud Shell"] },
      { order: 2, title: "Compute", description: "Compute Engine, GKE, Cloud Run", skills: ["Compute Engine", "GKE", "Cloud Run", "App Engine"] },
      { order: 3, title: "Storage", description: "Cloud Storage, Filestore, Persistent Disk", skills: ["Cloud Storage", "Filestore", "Persistent Disk", "Transfer"] },
      { order: 4, title: "Databases", description: "Cloud SQL, Bigtable, Firestore", skills: ["Cloud SQL", "Bigtable", "Firestore", "Memorystore", "Spanner"] },
      { order: 5, title: "Networking", description: "VPC, Cloud CDN, Cloud DNS", skills: ["VPC", "Cloud CDN", "Cloud DNS", "Cloud NAT", "Load Balancing"] },
      { order: 6, title: "Big Data", description: "BigQuery, Dataflow, Pub/Sub", skills: ["BigQuery", "Dataflow", "Pub/Sub", "Dataproc", "Composer"] },
      { order: 7, title: "Security", description: "IAM, Cloud Armor, Security Command Center", skills: ["IAM", "Cloud Armor", "Security Command Center", "KMS"] },
      { order: 8, title: "DevOps & CI/CD", description: "Cloud Build, Deploy, Source Repos", skills: ["Cloud Build", "Cloud Deploy", "Source Repos", "Artifact Registry"] },
      { order: 9, title: "Monitoring", description: "Cloud Monitoring, Logging, Trace", skills: ["Cloud Monitoring", "Logging", "Trace", "Profiler"] },
      { order: 10, title: "Serverless", description: "Cloud Functions, Workflows", skills: ["Cloud Functions", "Workflows", "Eventarc", "Apigee"] },
      { order: 11, title: "Architecture", description: "Design GCP solutions", skills: ["Architecture", "Migration", "Hybrid", "Anthos"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for GCP roles", skills: ["GCP", "Architecture", "Scenario Questions"] },
    ],
    "Kubernetes Engineer": [
      { order: 1, title: "Containers & Docker", description: "Container fundamentals", skills: ["Docker", "Images", "Containers", "Dockerfile", "Registry"] },
      { order: 2, title: "K8s Architecture", description: "Pods, nodes, control plane", skills: ["Kubernetes", "Pods", "Nodes", "Control Plane", "etcd"] },
      { order: 3, title: "Workloads", description: "Deployments, StatefulSets, DaemonSets", skills: ["Deployments", "StatefulSets", "DaemonSets", "Jobs", "CronJobs"] },
      { order: 4, title: "Networking", description: "Services, Ingress, CNI", skills: ["Services", "Ingress", "Network Policies", "CNI", "DNS"] },
      { order: 5, title: "Storage", description: "Volumes, PVC, CSI", skills: ["Volumes", "PVC", "Storage Class", "CSI", "Persistent Storage"] },
      { order: 6, title: "Configuration", description: "ConfigMaps, Secrets", skills: ["ConfigMaps", "Secrets", "Helm", "Kustomize"] },
      { order: 7, title: "Security", description: "RBAC, Pod Security, Network Policies", skills: ["RBAC", "Pod Security", "Network Policies", "Service Accounts"] },
      { order: 8, title: "Monitoring", description: "Prometheus, Grafana", skills: ["Prometheus", "Grafana", "Metrics Server", "Custom Metrics"] },
      { order: 9, title: "Service Mesh", description: "Istio, Linkerd", skills: ["Istio", "Linkerd", "mTLS", "Traffic Management"] },
      { order: 10, title: "GitOps", description: "ArgoCD, Flux", skills: ["ArgoCD", "Flux", "GitOps", "Progressive Delivery"] },
      { order: 11, title: "Production K8s", description: "Production clusters", skills: ["Autoscaling", "HPA", "VPA", "Resource Quotas", "Backup"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for K8s roles", skills: ["Kubernetes", "System Design", "Troubleshooting"] },
    ],
    "Docker Engineer": [
      { order: 1, title: "Container Concepts", description: "Container fundamentals", skills: ["Containers", "Images", "Layers", "Union FS"] },
      { order: 2, title: "Docker Basics", description: "Run, build, manage", skills: ["Docker", "docker run", "docker build", "Dockerfile"] },
      { order: 3, title: "Docker Compose", description: "Multi-container apps", skills: ["Docker Compose", "Services", "Networks", "Volumes"] },
      { order: 4, title: "Dockerfile Best Practices", description: "Optimize Dockerfiles", skills: ["Multi-stage Builds", "Layer Caching", "Security", "Healthcheck"] },
      { order: 5, title: "Networking", description: "Bridge, host, overlay", skills: ["Docker Networking", "Bridge", "Overlay", "Network Drivers"] },
      { order: 6, title: "Volumes & Data", description: "Persistent data", skills: ["Volumes", "Bind Mounts", "tmpfs", "Data Management"] },
      { order: 7, title: "Registry & Images", description: "Docker Hub, private registries", skills: ["Docker Hub", "Registry", "Image Tagging", "Notary"] },
      { order: 8, title: "Docker Security", description: "Secure containers", skills: ["Docker Security", "Secrets", "Content Trust", "Rootless"] },
      { order: 9, title: "CI/CD with Docker", description: "Docker in pipelines", skills: ["GitHub Actions", "Docker Build", "CI/CD", "Testing"] },
      { order: 10, title: "Swarm & Orchestration", description: "Docker Swarm", skills: ["Docker Swarm", "Services", "Stacks", "Secrets"] },
      { order: 11, title: "Production Operations", description: "Manage Docker in prod", skills: ["Logging", "Monitoring", "Resource Limits", "Health"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Docker roles", skills: ["Docker", "Containers", "System Design"] },
    ],
    "Site Reliability Engineer": [
      { order: 1, title: "Linux Mastery", description: "Advanced Linux administration", skills: ["Linux", "Kernel", "Systemd", "Filesystems", "Performance"] },
      { order: 2, title: "Programming", description: "Python/Go automation", skills: ["Python", "Go", "Shell Scripting", "Automation"] },
      { order: 3, title: "Networking", description: "TCP/IP, HTTP, DNS, load balancing", skills: ["TCP/IP", "HTTP", "DNS", "Load Balancing", "Proxies"] },
      { order: 4, title: "Monitoring & Observability", description: "Prometheus, Grafana, Alerting", skills: ["Prometheus", "Grafana", "Alertmanager", "Thanos"] },
      { order: 5, title: "Logging & Tracing", description: "ELK, Loki, Jaeger", skills: ["ELK", "Loki", "Jaeger", "Tracing", "Log Management"] },
      { order: 6, title: "Incident Response", description: "On-call, incident management", skills: ["Incident Response", "On-call", "Postmortem", "Blameless"] },
      { order: 7, title: "SLO/SLI/Error Budgets", description: "Reliability metrics", skills: ["SLO", "SLI", "Error Budgets", "Service Level"] },
      { order: 8, title: "Capacity Planning", description: "Scale and capacity", skills: ["Capacity Planning", "Load Testing", "Autoscaling", "Forecasting"] },
      { order: 9, title: "Chaos Engineering", description: "Chaos experiments", skills: ["Chaos Engineering", "Chaos Monkey", "Litmus", "Gremlin"] },
      { order: 10, title: "Kubernetes Operations", description: "Run K8s in production", skills: ["Kubernetes", "Operators", "Custom Resources", "Controllers"] },
      { order: 11, title: "Automation", description: "Automate everything", skills: ["Terraform", "Ansible", "CI/CD", "GitOps"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for SRE roles", skills: ["SRE Principles", "System Design", "Troubleshooting"] },
    ],
    "Cybersecurity Analyst": [
      { order: 1, title: "Networking & Security", description: "Network security basics", skills: ["Networking", "TCP/IP", "Firewalls", "IDS/IPS"] },
      { order: 2, title: "Operating System Security", description: "Windows/Linux hardening", skills: ["Linux Security", "Windows Security", "Hardening", "Group Policy"] },
      { order: 3, title: "Threat Intelligence", description: "Threat research and analysis", skills: ["Threat Intel", "IoC", "TTPs", "Threat Feeds"] },
      { order: 4, title: "SIEM & Log Management", description: "Splunk, ELK, QRadar", skills: ["SIEM", "Splunk", "ELK", "Log Analysis", "Correlation"] },
      { order: 5, title: "Vulnerability Management", description: "Scan and assess", skills: ["Vulnerability Scanning", "Nessus", "Qualys", "Remediation"] },
      { order: 6, title: "Incident Response", description: "Respond to incidents", skills: ["Incident Response", "Forensics", "IR Playbooks", "Containment"] },
      { order: 7, title: "Malware Analysis", description: "Analyze malware", skills: ["Malware Analysis", "Reverse Engineering", "Sandbox", "Static/Dynamic"] },
      { order: 8, title: "Web Security", description: "OWASP, web app security", skills: ["OWASP Top 10", "Web Security", "XSS", "SQLi"] },
      { order: 9, title: "Cloud Security", description: "AWS/Azure/GCP security", skills: ["Cloud Security", "IAM", "Security Groups", "GuardDuty"] },
      { order: 10, title: "Compliance", description: "GDPR, SOC2, ISO 27001", skills: ["Compliance", "GDPR", "SOC 2", "ISO 27001", "Audit"] },
      { order: 11, title: "Security Operations", description: "Daily SOC operations", skills: ["SOC", "Triage", "Escalation", "Reporting"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for SOC roles", skills: ["Security Concepts", "Incident Response", "Threat Intel"] },
    ],
    "Penetration Tester": [
      { order: 1, title: "Networking & Protocols", description: "Deep networking knowledge", skills: ["TCP/IP", "Protocols", "Wireshark", "Network Analysis"] },
      { order: 2, title: "Linux & Scripting", description: "Kali Linux, Python/Bash", skills: ["Kali Linux", "Python", "Bash", "Automation"] },
      { order: 3, title: "Web Application Testing", description: "OWASP, Burp Suite", skills: ["OWASP", "Burp Suite", "Web Security", "XSS", "SQLi"] },
      { order: 4, title: "Network Pen Testing", description: "Nmap, Metasploit", skills: ["Nmap", "Metasploit", "Nessus", "Network Testing"] },
      { order: 5, title: "Exploit Development", description: "Write exploits", skills: ["Exploit Dev", "Fuzzing", "Buffer Overflow", "Shellcode"] },
      { order: 6, title: "Wireless Security", description: "WiFi pen testing", skills: ["Wireless", "WPA2", "Aircrack-ng", "Recon"] },
      { order: 7, title: "Active Directory", description: "AD security testing", skills: ["Active Directory", "Kerberos", "LDAP", "Privilege Escalation"] },
      { order: 8, title: "Cloud Pen Testing", description: "Cloud security testing", skills: ["Cloud Testing", "AWS/Azure", "Container Security"] },
      { order: 9, title: "Social Engineering", description: "Human vector attacks", skills: ["Social Engineering", "Phishing", "Vishing", "Physical"] },
      { order: 10, title: "Reporting", description: "Write penetration test reports", skills: ["Reporting", "Remediation", "Risk Assessment"] },
      { order: 11, title: "Red Teaming", description: "Advanced adversarial simulation", skills: ["Red Team", "C2", "Persistence", "Lateral Movement"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for pentest roles", skills: ["Pentesting", "Security", "CTF", "OSCP"] },
    ],
    "Ethical Hacker": [
      { order: 1, title: "Security Foundations", description: "InfoSec basics", skills: ["Security Fundamentals", "Cryptography", "Networking"] },
      { order: 2, title: "Reconnaissance", description: "OSINT, information gathering", skills: ["OSINT", "Reconnaissance", "Footprinting", "Google Dorks"] },
      { order: 3, title: "Scanning & Enumeration", description: "Nmap, enumeration", skills: ["Nmap", "Enumeration", "Service Discovery", "Vulnerability Scan"] },
      { order: 4, title: "Vulnerability Assessment", description: "Find vulnerabilities", skills: ["Vulnerability Assessment", "Nessus", "OpenVAS", "Nikto"] },
      { order: 5, title: "Web Hacking", description: "OWASP, Burp Suite", skills: ["Web Hacking", "Burp Suite", "OWASP", "SQLi", "XSS", "CSRF"] },
      { order: 6, title: "Network Hacking", description: "ARP spoofing, MITM", skills: ["Network Hacking", "ARP", "MITM", "Packet Sniffing"] },
      { order: 7, title: "Wireless Hacking", description: "WiFi attacks", skills: ["Wireless Hacking", "WPA Cracking", "Evil Twin", "Deauth"] },
      { order: 8, title: "Password Cracking", description: "Hashcat, John", skills: ["Password Cracking", "Hashcat", "John", "Rainbow Tables"] },
      { order: 9, title: "Exploitation", description: "Metasploit, public exploits", skills: ["Metasploit", "Exploit", "Shell", "Reverse Shell"] },
      { order: 10, title: "Post-Exploitation", description: "Privilege escalation, persistence", skills: ["Post-Exploitation", "PrivEsc", "Persistence", "Lateral Movement"] },
      { order: 11, title: "Bug Bounty", description: "Bug bounty programs", skills: ["Bug Bounty", "HackerOne", "Bugcrowd", "Responsible Disclosure"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for ethical hacking roles", skills: ["Ethical Hacking", "CTF", "Security Concepts"] },
    ],
    "SOC Analyst": [
      { order: 1, title: "Network Fundamentals", description: "Network protocols and devices", skills: ["Networking", "TCP/IP", "Firewalls", "Proxy"] },
      { order: 2, title: "Security Monitoring", description: "Monitor security events", skills: ["Security Monitoring", "Alerts", "Event Analysis", "Triage"] },
      { order: 3, title: "SIEM Tools", description: "Splunk, ArcSight, ELK", skills: ["SIEM", "Splunk", "ArcSight", "ELK", "QRadar"] },
      { order: 4, title: "Log Analysis", description: "Analyze security logs", skills: ["Log Analysis", "Log Sources", "Parsing", "Correlation"] },
      { order: 5, title: "Threat Detection", description: "Detect threats", skills: ["Threat Detection", "IoC", "Sigma Rules", "YARA"] },
      { order: 6, title: "Incident Triage", description: "Classify incidents", skills: ["Incident Triage", "Severity", "Impact", "Response"] },
      { order: 7, title: "Endpoint Security", description: "EDR, antivirus, host-based", skills: ["Endpoint Security", "EDR", "CrowdStrike", "SentinelOne"] },
      { order: 8, title: "Network Security", description: "Firewalls, IDS/IPS", skills: ["Firewall Logs", "IDS/IPS", "NetFlow", "Packet Analysis"] },
      { order: 9, title: "Phishing Analysis", description: "Email security", skills: ["Phishing", "Email Security", "DMARC", "SPF", "DKIM"] },
      { order: 10, title: "Reporting", description: "SOC reporting", skills: ["Reporting", "Metrics", "Dashboards", "Documentation"] },
      { order: 11, title: "Continuous Learning", description: "Stay updated", skills: ["Threat Research", "News", "Courses", "Certifications"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for SOC roles", skills: ["SOC", "Security Tools", "Incident Response"] },
    ],
    "QA Engineer": [
      { order: 1, title: "Testing Fundamentals", description: "Testing principles", skills: ["Manual Testing", "Testing Lifecycle", "Test Cases", "Bug Reporting"] },
      { order: 2, title: "Test Case Design", description: "Design effective tests", skills: ["Test Design", "Boundary Values", "Equivalence", "Decision Tables"] },
      { order: 3, title: "API Testing", description: "Postman, REST APIs", skills: ["API Testing", "Postman", "REST", "SOAP", "Status Codes"] },
      { order: 4, title: "Database Testing", description: "SQL for testers", skills: ["SQL", "Database Testing", "Data Validation", "Joins"] },
      { order: 5, title: "Agile & JIRA", description: "Agile testing", skills: ["Agile", "Scrum", "JIRA", "Stories", "Sprint Planning"] },
      { order: 6, title: "Automation Basics", description: "Intro to automation", skills: ["Automation", "Selenium", "Test Automation", "Framework"] },
      { order: 7, title: "Performance Basics", description: "Load testing", skills: ["Performance", "JMeter", "Load Testing", "Basics"] },
      { order: 8, title: "Mobile Testing", description: "Test mobile apps", skills: ["Mobile Testing", "Android/iOS", "Emulators", "Real Devices"] },
      { order: 9, title: "CI/CD Integration", description: "QA in CI/CD", skills: ["CI/CD", "Automation", "Test Pipelines", "Reporting"] },
      { order: 10, title: "Test Management", description: "Zephyr, TestRail", skills: ["Test Management", "TestRail", "Zephyr", "Metrics"] },
      { order: 11, title: "Exploratory Testing", description: "Explore and discover", skills: ["Exploratory Testing", "Session-based", "Heuristics"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for QA roles", skills: ["Testing Concepts", "SQL", "Automation"] },
    ],
    "Automation Test Engineer": [
      { order: 1, title: "Programming Foundation", description: "JavaScript/Python for tests", skills: ["JavaScript", "Python", "Programming", "OOP"] },
      { order: 2, title: "Selenium WebDriver", description: "Browser automation", skills: ["Selenium", "WebDriver", "Locators", "Waits"] },
      { order: 3, title: "Test Frameworks", description: "Jest, Mocha, PyTest", skills: ["Jest", "PyTest", "Mocha", "Test Runner"] },
      { order: 4, title: "Cypress", description: "Modern E2E testing", skills: ["Cypress", "Commands", "Fixtures", "Intercepts"] },
      { order: 5, title: "API Automation", description: "Postman, SuperTest", skills: ["API Automation", "Postman", "SuperTest", "Assertions"] },
      { order: 6, title: "Page Object Model", description: "Design patterns", skills: ["POM", "Page Objects", "Test Data", "Fixtures"] },
      { order: 7, title: "CI/CD for Tests", description: "Run tests in CI", skills: ["GitHub Actions", "Jenkins", "CI/CD", "Test Reports"] },
      { order: 8, title: "Visual Testing", description: "Percy, Applitools", skills: ["Visual Testing", "Percy", "Applitools", "Screenshots"] },
      { order: 9, title: "BDD with Cucumber", description: "Behavior-driven development", skills: ["Cucumber", "Gherkin", "BDD", "Feature Files"] },
      { order: 10, title: "Performance Automation", description: "K6, Lighthouse CI", skills: ["Performance", "K6", "Lighthouse", "Budgets"] },
      { order: 11, title: "Mobile Automation", description: "Appium, Detox", skills: ["Appium", "Detox", "Mobile Automation", "Cloud"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for automation roles", skills: ["Automation", "Selenium", "Cypress", "Framework Design"] },
    ],
    "Performance Test Engineer": [
      { order: 1, title: "Performance Concepts", description: "Latency, throughput, concurrency", skills: ["Performance Testing", "Latency", "Throughput", "Concurrency"] },
      { order: 2, title: "JMeter", description: "Apache JMeter", skills: ["JMeter", "Test Plans", "Thread Groups", "Listeners"] },
      { order: 3, title: "Load Testing", description: "Load test design", skills: ["Load Testing", "Scenarios", "Ramp-up", "Stress Testing"] },
      { order: 4, title: "Monitoring Basics", description: "Server monitoring", skills: ["Monitoring", "CPU", "Memory", "I/O", "Network"] },
      { order: 5, title: "Gatling", description: "Scala/Java load testing", skills: ["Gatling", "Simulations", "Feeder", "Assertions"] },
      { order: 6, title: "K6", description: "Modern load testing", skills: ["K6", "Scripts", "Metrics", "Thresholds"] },
      { order: 7, title: "Database Performance", description: "Query optimization", skills: ["Database", "SQL Tuning", "Indexes", "Query Plans"] },
      { order: 8, title: "Network Performance", description: "Network profiling", skills: ["Network", "Bandwidth", "Latency", "CDN"] },
      { order: 9, title: "APM Tools", description: "Dynatrace, AppDynamics", skills: ["APM", "Dynatrace", "AppDynamics", "Trace Analysis"] },
      { order: 10, title: "CI/CD Integration", description: "Performance in CI/CD", skills: ["CI/CD", "Gatling Jenkins", "Perf Regression", "Budgets"] },
      { order: 11, title: "Reporting & Analysis", description: "Performance analysis", skills: ["Reporting", "Bottleneck Analysis", "Recommendations"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for performance roles", skills: ["Performance Testing", "JMeter", "System Design"] },
    ],
    "SQL Developer": [
      { order: 1, title: "SQL Basics", description: "SELECT, INSERT, UPDATE, DELETE", skills: ["SQL", "SELECT", "WHERE", "JOINs", "GROUP BY"] },
      { order: 2, title: "Advanced Queries", description: "Subqueries, CTEs, window functions", skills: ["Subqueries", "CTEs", "Window Functions", "PARTITION BY"] },
      { order: 3, title: "Database Design", description: "Normalization, ERDs", skills: ["Normalization", "ERD", "Primary Keys", "Foreign Keys"] },
      { order: 4, title: "Indexing", description: "B-tree, hash indexes", skills: ["Indexing", "B-tree", "Composite Indexes", "EXPLAIN"] },
      { order: 5, title: "Stored Procedures", description: "PL/SQL, T-SQL", skills: ["Stored Procedures", "Functions", "Triggers", "Cursors"] },
      { order: 6, title: "Query Optimization", description: "Tune slow queries", skills: ["Query Optimization", "EXPLAIN ANALYZE", "Plan Analysis"] },
      { order: 7, title: "Transaction Management", description: "ACID, isolation levels", skills: ["Transactions", "ACID", "Isolation Levels", "Locks"] },
      { order: 8, title: "PostgreSQL", description: "Advanced Postgres", skills: ["PostgreSQL", "Extensions", "Full Text Search", "JSON"] },
      { order: 9, title: "Performance Tuning", description: "Database performance", skills: ["Performance", "Vacuum", "Analyze", "Configuration"] },
      { order: 10, title: "Data Modeling", description: "Model complex data", skills: ["Data Modeling", "Star Schema", "Snowflake", "Dimensional"] },
      { order: 11, title: "ETL & Data Migration", description: "Move data", skills: ["ETL", "Data Migration", "Bulk Load", "CDC"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for SQL roles", skills: ["SQL", "Database Design", "Performance Tuning"] },
    ],
    "Database Administrator": [
      { order: 1, title: "Database Fundamentals", description: "DB concepts and architecture", skills: ["Databases", "RDBMS", "CAP Theorem", "ACID", "BASE"] },
      { order: 2, title: "Installation & Configuration", description: "Setup databases", skills: ["PostgreSQL", "MySQL", "MongoDB", "Installation", "Config"] },
      { order: 3, title: "Backup & Recovery", description: "Backup strategies", skills: ["Backup", "pg_dump", "PITR", "Replication", "Snapshots"] },
      { order: 4, title: "Monitoring & Alerts", description: "DB monitoring", skills: ["Monitoring", "pg_stat", "Performance", "Alerting"] },
      { order: 5, title: "Performance Tuning", description: "Optimize DB performance", skills: ["Performance", "Query Tuning", "Indexing", "Buffer Cache"] },
      { order: 6, title: "Security", description: "DB security", skills: ["Security", "Encryption", "Roles", "Audit", "SSL/TLS"] },
      { order: 7, title: "High Availability", description: "HA setup", skills: ["High Availability", "Replication", "Failover", "Clustering"] },
      { order: 8, title: "Replication", description: "Master-slave, multi-master", skills: ["Streaming Replication", "Logical Replication", "Cascading"] },
      { order: 9, title: "Migration & Upgrades", description: "DB migration", skills: ["Migration", "Upgrades", "Zero-downtime", "Rollback"] },
      { order: 10, title: "SQL Tuning", description: "Deep SQL optimization", skills: ["SQL Tuning", "Execution Plans", "Indexing Strategies"] },
      { order: 11, title: "NoSQL Administration", description: "MongoDB, Redis", skills: ["MongoDB Admin", "Redis Admin", "Sharding", "Replica Sets"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for DBA roles", skills: ["Database Admin", "Performance", "Architecture"] },
    ],
    "Data Engineer": [
      { order: 1, title: "Python & SQL", description: "Core data skills", skills: ["Python", "SQL", "Pandas", "NumPy", "Data Structures"] },
      { order: 2, title: "Data Warehousing", description: "Warehouse concepts", skills: ["Data Warehousing", "Star Schema", "Snowflake", "Dimensional Modeling"] },
      { order: 3, title: "ETL/ELT Pipelines", description: "Build data pipelines", skills: ["ETL", "ELT", "Data Pipelines", "Incremental Loads"] },
      { order: 4, title: "Apache Spark", description: "Distributed data processing", skills: ["Spark", "RDD", "DataFrame", "SQL", "Streaming"] },
      { order: 5, title: "Workflow Orchestration", description: "Airflow, Dagster", skills: ["Airflow", "DAGs", "Scheduling", "Monitoring"] },
      { order: 6, title: "Cloud Data Platforms", description: "GCP/AWS data tools", skills: ["BigQuery", "Snowflake", "Redshift", "Databricks"] },
      { order: 7, title: "Streaming Data", description: "Kafka, Kinesis", skills: ["Kafka", "Kinesis", "Streaming", "Pub/Sub", "Flink"] },
      { order: 8, title: "Data Lakes", description: "Lake architecture", skills: ["Data Lake", "Delta Lake", "Iceberg", "Hudi", "Parquet"] },
      { order: 9, title: "Data Quality", description: "Great Expectations, dbt", skills: ["Data Quality", "Great Expectations", "dbt", "Validation"] },
      { order: 10, title: "Infrastructure", description: "Docker, CI/CD for data", skills: ["Docker", "Terraform", "CI/CD", "Kubernetes"] },
      { order: 11, title: "Data Governance", description: "Catalog, lineage, metadata", skills: ["Data Governance", "Data Catalog", "Lineage", "Metadata"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for data engineering roles", skills: ["Python", "SQL", "Spark", "System Design"] },
    ],
    "UI Designer": [
      { order: 1, title: "Design Principles", description: "Color, typography, layout", skills: ["Design Principles", "Color Theory", "Typography", "Layout"] },
      { order: 2, title: "Figma Mastery", description: "Design in Figma", skills: ["Figma", "Shapes", "Text", "Auto Layout", "Components"] },
      { order: 3, title: "Design Systems", description: "Create design systems", skills: ["Design Systems", "Variables", "Styles", "Components", "Documentation"] },
      { order: 4, title: "Visual Design", description: "Visual hierarchy and balance", skills: ["Visual Design", "Hierarchy", "Balance", "Contrast", "Whitespace"] },
      { order: 5, title: "Responsive Design", description: "Multi-device design", skills: ["Responsive Design", "Mobile First", "Breakpoints", "Grids"] },
      { order: 6, title: "Prototyping", description: "Interactive prototypes", skills: ["Prototyping", "Interactions", "Animations", "Transitions"] },
      { order: 7, title: "Icon Design", description: "Create icons", skills: ["Icon Design", "SVG", "Icon Sets", "Consistency"] },
      { order: 8, title: "Design Handoff", description: "Developer handoff", skills: ["Design Handoff", "Zeplin", "Specs", "Developer Collaboration"] },
      { order: 9, title: "Design Critiques", description: "Give and receive feedback", skills: ["Design Critique", "Feedback", "Iteration", "Collaboration"] },
      { order: 10, title: "Portfolio", description: "Build design portfolio", skills: ["Portfolio", "Case Studies", "Presentation", "Storytelling"] },
      { order: 11, title: "Tools & Workflow", description: "Sketch, Adobe XD", skills: ["Sketch", "Adobe XD", "Design Tools", "Workflow"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for UI roles", skills: ["UI Design", "Figma", "Design Systems", "Portfolio Review"] },
    ],
    "UX Designer": [
      { order: 1, title: "UX Fundamentals", description: "User experience principles", skills: ["UX Design", "User-Centered Design", "Usability", "Accessibility"] },
      { order: 2, title: "User Research", description: "Research methods", skills: ["User Research", "Interviews", "Surveys", "Contextual Inquiry"] },
      { order: 3, title: "Information Architecture", description: "Organize content", skills: ["Information Architecture", "Sitemaps", "Card Sorting", "Navigation"] },
      { order: 4, title: "Wireframing", description: "Low to high fidelity", skills: ["Wireframing", "Sketches", "Balsamiq", "Figma Wireframes"] },
      { order: 5, title: "Prototyping", description: "Interactive prototypes", skills: ["Prototyping", "Figma", "User Flows", "Clickable Prototypes"] },
      { order: 6, title: "Usability Testing", description: "Test with users", skills: ["Usability Testing", "Test Scripts", "Moderation", "Analysis"] },
      { order: 7, title: "Interaction Design", description: "Design interactions", skills: ["Interaction Design", "Micro-interactions", "Animations", "Gestures"] },
      { order: 8, title: "Accessibility", description: "WCAG, inclusive design", skills: ["Accessibility", "WCAG", "Screen Readers", "Inclusive Design"] },
      { order: 9, title: "Design Strategy", description: "Strategic design", skills: ["Design Strategy", "Design Thinking", "Workshops", "Facilitation"] },
      { order: 10, title: "Data-Driven Design", description: "Use data in design", skills: ["Data-Driven Design", "Analytics", "A/B Testing", "Metrics"] },
      { order: 11, title: "UX Writing", description: "Content design", skills: ["UX Writing", "Microcopy", "Content Strategy", "Tone of Voice"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for UX roles", skills: ["UX Design", "Portfolio", "Case Studies", "User Research"] },
    ],
    "Product Designer": [
      { order: 1, title: "Design Foundations", description: "Visual + UX principles", skills: ["Visual Design", "UX Design", "Typography", "Color", "Layout"] },
      { order: 2, title: "User Research", description: "Deep user insights", skills: ["User Research", "Interviews", "Surveys", "Empathy Mapping"] },
      { order: 3, title: "Product Thinking", description: "Product strategy", skills: ["Product Thinking", "Problem Solving", "Strategy", "Roadmapping"] },
      { order: 4, title: "Design Systems", description: "Systematic design", skills: ["Design Systems", "Components", "Patterns", "Governance"] },
      { order: 5, title: "Interaction Design", description: "Complex interactions", skills: ["Interaction Design", "User Flows", "Logic", "State Design"] },
      { order: 6, title: "Prototyping", description: "High-fidelity prototypes", skills: ["Prototyping", "Figma", "Principle", "Motion Design"] },
      { order: 7, title: "Design Ops", description: "Design operations", skills: ["Design Ops", "Design Process", "Tools", "Collaboration"] },
      { order: 8, title: "Cross-Functional Collaboration", description: "Work with PM/Eng", skills: ["Collaboration", "Product Management", "Engineering", "Stakeholders"] },
      { order: 9, title: "Data-Informed Design", description: "Analytics and design", skills: ["Data-Driven", "Analytics", "Experiments", "Metrics"] },
      { order: 10, title: "Service Design", description: "End-to-end services", skills: ["Service Design", "Blueprints", "Touchpoints", "Ecosystem"] },
      { order: 11, title: "Leadership", description: "Design leadership", skills: ["Design Leadership", "Mentoring", "Design Culture", "Advocacy"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for product design roles", skills: ["Product Design", "Portfolio", "Case Studies", "Strategy"] },
    ],
    "Technical Product Manager": [
      { order: 1, title: "Product Management", description: "PM fundamentals", skills: ["Product Management", "Strategy", "Roadmapping", "OKRs"] },
      { order: 2, title: "Technical Architecture", description: "Understanding systems", skills: ["System Design", "APIs", "Architecture", "Microservices"] },
      { order: 3, title: "API Product Design", description: "Design API products", skills: ["API Design", "REST", "GraphQL", "Developer Experience"] },
      { order: 4, title: "Data & Analytics", description: "Data-driven decisions", skills: ["SQL", "Analytics", "A/B Testing", "Metrics", "Dashboards"] },
      { order: 5, title: "Platform Products", description: "Platform strategy", skills: ["Platform", "Ecosystem", "Marketplace", "Multi-sided"] },
      { order: 6, title: "Developer Relations", description: "Engage developers", skills: ["DevRel", "Documentation", "Community", "APIs"] },
      { order: 7, title: "Agile at Scale", description: "SAFe, LeSS", skills: ["Agile", "Scrum at Scale", "SAFe", "LeSS"] },
      { order: 8, title: "Technical Roadmapping", description: "Technical roadmaps", skills: ["Technical Roadmap", "Prioritization", "Dependencies"] },
      { order: 9, title: "Product Launch", description: "Technical launches", skills: ["Launch", "Release", "Migration", "Rollback"] },
      { order: 10, title: "Stakeholder Management", description: "Executive communication", skills: ["Stakeholders", "Exec Communication", "Tradeoffs"] },
      { order: 11, title: "Innovation & Strategy", description: "Technical innovation", skills: ["Innovation", "Strategy", "Emerging Tech", "R&D"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for TPM roles", skills: ["Product Strategy", "System Design", "Technical Depth"] },
    ],
    "Project Manager": [
      { order: 1, title: "Project Management Basics", description: "PM fundamentals", skills: ["Project Management", "Scope", "Timeline", "Budget"] },
      { order: 2, title: "Agile & Scrum", description: "Agile methodology", skills: ["Agile", "Scrum", "Sprints", "Backlog", "Standups"] },
      { order: 3, title: "Waterfall & Hybrid", description: "Traditional approaches", skills: ["Waterfall", "Hybrid", "Milestones", "Gantt Charts"] },
      { order: 4, title: "Risk Management", description: "Identify and mitigate risks", skills: ["Risk Management", "Risk Register", "Mitigation", "Contingency"] },
      { order: 5, title: "Stakeholder Management", description: "Manage stakeholders", skills: ["Stakeholder Management", "Communication", "Expectations"] },
      { order: 6, title: "Resource Planning", description: "Plan resources", skills: ["Resource Planning", "Capacity", "Allocation", "Leveling"] },
      { order: 7, title: "Tools & Software", description: "JIRA, MS Project, Asana", skills: ["JIRA", "MS Project", "Asana", "Trello", "Confluence"] },
      { order: 8, title: "Budget Management", description: "Track and manage budgets", skills: ["Budget", "Cost Tracking", "Forecasting", "ROI"] },
      { order: 9, title: "Quality Management", description: "Quality processes", skills: ["Quality Management", "Standards", "Reviews", "Acceptance"] },
      { order: 10, title: "Communication", description: "Effective communication", skills: ["Communication", "Reporting", "Status Updates", "Meetings"] },
      { order: 11, title: "Team Leadership", description: "Lead project teams", skills: ["Leadership", "Motivation", "Conflict Resolution", "Delegation"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for PM roles", skills: ["Project Management", "Scenarios", "Leadership"] },
    ],
    "Scrum Master": [
      { order: 1, title: "Scrum Framework", description: "Scrum theory and values", skills: ["Scrum", "Sprint", "Increment", "Definition of Done"] },
      { order: 2, title: "Scrum Ceremonies", description: "Events and artifacts", skills: ["Sprint Planning", "Daily Standup", "Review", "Retro"] },
      { order: 3, title: "Agile Principles", description: "Agile manifesto", skills: ["Agile", "Principles", "Mindset", "Values"] },
      { order: 4, title: "Facilitation", description: "Facilitate teams", skills: ["Facilitation", "Meetings", "Workshops", "Decision Making"] },
      { order: 5, title: "Coaching", description: "Coach teams and individuals", skills: ["Coaching", "Questioning", "Feedback", "Growth"] },
      { order: 6, title: "Conflict Resolution", description: "Resolve team conflicts", skills: ["Conflict Resolution", "Mediation", "Difficult Conversations"] },
      { order: 7, title: "Impediment Removal", description: "Remove blockers", skills: ["Impediment Removal", "Escalation", "Problem Solving"] },
      { order: 8, title: "Metrics & Reporting", description: "Velocity, burndown", skills: ["Metrics", "Velocity", "Burndown", "Cycle Time"] },
      { order: 9, title: "Scrum at Scale", description: "Nexus, LeSS", skills: ["Scaling", "Nexus", "LeSS", "SAFe"] },
      { order: 10, title: "Continuous Improvement", description: "Kaizen culture", skills: ["Continuous Improvement", "Kaizen", "Experiments", "Learning"] },
      { order: 11, title: "Agile Tools", description: "JIRA, Miro, Confluence", skills: ["JIRA Advanced", "Miro", "Confluence", "Automation"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Scrum Master roles", skills: ["Scrum", "Facilitation", "Coaching Scenarios"] },
    ],
    "Blockchain Developer": [
      { order: 1, title: "Blockchain Fundamentals", description: "Distributed ledger, consensus", skills: ["Blockchain", "Distributed Ledger", "Consensus", "Cryptography"] },
      { order: 2, title: "Ethereum Platform", description: "EVM, accounts, transactions", skills: ["Ethereum", "EVM", "Accounts", "Gas", "Transactions"] },
      { order: 3, title: "Solidity Programming", description: "Smart contract development", skills: ["Solidity", "Smart Contracts", "ABI", "Events"] },
      { order: 4, title: "Web3.js / Ethers.js", description: "Blockchain frontend", skills: ["Web3.js", "Ethers.js", "Providers", "Signers"] },
      { order: 5, title: "Hardhat & Foundry", description: "Development frameworks", skills: ["Hardhat", "Foundry", "Testing", "Scripts"] },
      { order: 6, title: "OpenZeppelin", description: "Battle-tested contracts", skills: ["OpenZeppelin", "ERC20", "ERC721", "Access Control"] },
      { order: 7, title: "DeFi Protocols", description: "Uniswap, Aave, Compound", skills: ["DeFi", "AMM", "Lending", "Yield"] },
      { order: 8, title: "NFTs", description: "ERC-721, ERC-1155", skills: ["NFTs", "ERC-721", "Marketplace", "Metadata"] },
      { order: 9, title: "Security", description: "Smart contract security", skills: ["Security", "Reentrancy", "Audit", "Common Vulnerabilities"] },
      { order: 10, title: "IPFS & Storage", description: "Decentralized storage", skills: ["IPFS", "Filecoin", "Arweave", "Decentralized Storage"] },
      { order: 11, title: "Full Stack DApps", description: "Build complete DApps", skills: ["React", "DApps", "Wallet Connect", "UI/UX"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Blockchain roles", skills: ["Blockchain", "Solidity", "DeFi", "System Design"] },
    ],
    "Solidity Developer": [
      { order: 1, title: "Blockchain Basics", description: "Blockchain fundamentals", skills: ["Blockchain", "EVM", "Accounts", "Gas", "Transactions"] },
      { order: 2, title: "Solidity Language", description: "Solidity in depth", skills: ["Solidity", "Data Types", "Functions", "Modifiers", "Events"] },
      { order: 3, title: "Smart Contract Patterns", description: "Common patterns", skills: ["Ownable", "Pausable", "Upgradable", "Factory"] },
      { order: 4, title: "ERC Standards", description: "ERC20, ERC721, ERC1155", skills: ["ERC20", "ERC721", "ERC1155", "ERC4626"] },
      { order: 5, title: "Testing Solidity", description: "Hardhat, Foundry tests", skills: ["Hardhat Tests", "Foundry Tests", "Chai", "Coverage"] },
      { order: 6, title: "Gas Optimization", description: "Minimize gas costs", skills: ["Gas Optimization", "Storage", "Calldata", "Assembly"] },
      { order: 7, title: "DeFi Development", description: "Lending, swaps, staking", skills: ["DeFi", "Lending", "AMM", "Staking", "Yield"] },
      { order: 8, title: "Auditing", description: "Smart contract audits", skills: ["Auditing", "Slither", "Mythril", "Manual Review"] },
      { order: 9, title: "Upgradable Contracts", description: "Proxy patterns", skills: ["UUPS", "Transparent Proxy", "Beacon", "Diamond"] },
      { order: 10, title: "Assembly & Low-Level", description: "Yul, EVM opcodes", skills: ["Yul", "Assembly", "Opcodes", "Memory Layout"] },
      { order: 11, title: "Layer 2s", description: "Optimism, Arbitrum, Scroll", skills: ["Layer 2", "Rollups", "Optimistic", "ZK"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Solidity roles", skills: ["Solidity", "EVM", "DeFi", "Security"] },
    ],
    "Web3 Developer": [
      { order: 1, title: "Web3 Fundamentals", description: "Web3 concepts", skills: ["Web3", "Blockchain", "Decentralization", "Wallets"] },
      { order: 2, title: "Frontend Basics", description: "React for Web3", skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
      { order: 3, title: "Wallet Integration", description: "MetaMask, WalletConnect", skills: ["MetaMask", "WalletConnect", "EIP-1193", "Provider"] },
      { order: 4, title: "Smart Contract Interaction", description: "Call contracts from frontend", skills: ["ethers.js", "Contract Interaction", "Read/Write", "Events"] },
      { order: 5, title: "Web3 Frameworks", description: "Thirdweb, Moralis", skills: ["Thirdweb", "Moralis", "Alchemy", "Infura"] },
      { order: 6, title: "IPFS & Filecoin", description: "Decentralized storage", skills: ["IPFS", "Filecoin", "Pinata", "NFT Storage"] },
      { order: 7, title: "The Graph", description: "Index blockchain data", skills: ["The Graph", "Subgraph", "GraphQL", "Querying"] },
      { order: 8, title: "DApp Design", description: "Design for Web3", skills: ["DApp Design", "UX for Web3", "Loading States", "Transactions"] },
      { order: 9, title: "Testing DApps", description: "Test Web3 apps", skills: ["Testing", "Hardhat", "Local Blockchain", "Mocking"] },
      { order: 10, title: "Chain Integration", description: "Multi-chain support", skills: ["Ethereum", "Polygon", "Arbitrum", "Optimism"] },
      { order: 11, title: "Security & Best Practices", description: "Web3 security", skills: ["Security", "Phishing", "Gas Estimation", "Error Handling"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Web3 roles", skills: ["Web3", "React", "Smart Contracts", "System Design"] },
    ],
    "Unity Developer": [
      { order: 1, title: "Unity Editor", description: "Unity interface and workflow", skills: ["Unity", "Editor", "Scenes", "Assets", "Prefabs"] },
      { order: 2, title: "C# Scripting", description: "Game programming with C#", skills: ["C#", "MonoBehaviour", "Coroutines", "Events"] },
      { order: 3, title: "2D Game Development", description: "2D sprites, physics", skills: ["2D", "Sprites", "Colliders", "Physics 2D"] },
      { order: 4, title: "3D Game Development", description: "3D models, physics", skills: ["3D", "Meshes", "Physics 3D", "Raycasting"] },
      { order: 5, title: "Animation", description: "Animator, animations", skills: ["Animation", "Animator", "State Machine", "Blend Trees"] },
      { order: 6, title: "UI Systems", description: "Unity UI, TextMeshPro", skills: ["Unity UI", "TextMeshPro", "Buttons", "Panels"] },
      { order: 7, title: "Audio", description: "Sound and music", skills: ["Audio", "Audio Sources", "Mixers", "3D Sound"] },
      { order: 8, title: "ScriptableObjects", description: "Data-driven design", skills: ["ScriptableObjects", "Data Design", "Events", "Systems"] },
      { order: 9, title: "Multiplayer", description: "Netcode, Photon", skills: ["Multiplayer", "Netcode", "Photon", "Lobby"] },
      { order: 10, title: "Optimization", description: "Performance optimization", skills: ["Optimization", "Draw Calls", "LOD", "Batching"] },
      { order: 11, title: "Addressables", description: "Asset management", skills: ["Addressables", "Asset Bundles", "Remote Content"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Unity roles", skills: ["Unity", "C#", "Game Design", "Optimization"] },
    ],
    "Unreal Engine Developer": [
      { order: 1, title: "Unreal Editor", description: "UE5 interface and tools", skills: ["Unreal Engine", "Editor", "Levels", "Assets", "Content Browser"] },
      { order: 2, title: "Blueprints", description: "Visual scripting", skills: ["Blueprints", "Event Graph", "Variables", "Functions"] },
      { order: 3, title: "C++ for Unreal", description: "Native Unreal development", skills: ["C++", "UE API", "Gameplay Classes", "UProperties"] },
      { order: 4, title: "Level Design", description: "Build game levels", skills: ["Level Design", "Geometry", "Landscape", "Lighting"] },
      { order: 5, title: "Materials & Shaders", description: "Material editor and shaders", skills: ["Materials", "Shaders", "PBR", "Parameters"] },
      { order: 6, title: "Animation Systems", description: "Skeletal animation", skills: ["Animation", "Skeletal Meshes", "Anim Blueprints", "IK"] },
      { order: 7, title: "AI Systems", description: "Enemy AI, behavior trees", skills: ["AI", "Behavior Tree", "Blackboard", "Navigation"] },
      { order: 8, title: "Physics & Collision", description: "Game physics", skills: ["Physics", "Collision", "Chaos", "Destruction"] },
      { order: 9, title: "Niagara VFX", description: "Visual effects", skills: ["Niagara", "Particles", "Emitters", "GPU Sprites"] },
      { order: 10, title: "Multiplayer", description: "Replication, dedicated servers", skills: ["Multiplayer", "Replication", "Authority", "Dedicated Server"] },
      { order: 11, title: "Optimization", description: "UE5 performance", skills: ["Optimization", "Draw Calls", "Lumen", "Nanite"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for Unreal roles", skills: ["Unreal Engine", "C++", "Game Design"] },
    ],
    "Game Developer": [
      { order: 1, title: "Programming Language", description: "C# or C++ for games", skills: ["C#", "C++", "OOP", "Memory Management"] },
      { order: 2, title: "Game Engines", description: "Unity and Unreal basics", skills: ["Unity", "Unreal Engine", "Editor", "Workflow"] },
      { order: 3, title: "Game Physics", description: "Physics engines", skills: ["Physics", "Rigidbodies", "Colliders", "Forces"] },
      { order: 4, title: "Game Math", description: "Vectors, matrices, quaternions", skills: ["Game Math", "Vectors", "Matrices", "Quaternions"] },
      { order: 5, title: "Graphics Programming", description: "Render pipelines", skills: ["Graphics", "Shaders", "Lighting", "Rendering"] },
      { order: 6, title: "Game Design Patterns", description: "Common game patterns", skills: ["Game Patterns", "Game Loop", "Component", "Observer"] },
      { order: 7, title: "Audio Systems", description: "Game audio", skills: ["Audio", "SFX", "Music", "Spatial Audio"] },
      { order: 8, title: "Save & Load Systems", description: "Persist game state", skills: ["Save System", "Serialization", "Checkpoints"] },
      { order: 9, title: "UI/UX for Games", description: "Game UIs", skills: ["Game UI", "HUD", "Menus", "Input Systems"] },
      { order: 10, title: "Testing & Debugging", description: "Game testing", skills: ["Playtesting", "Debugging", "Performance", "Profiling"] },
      { order: 11, title: "Build & Ship", description: "Build games for release", skills: ["Build Pipeline", "Platforms", "Store Submission"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for game dev roles", skills: ["Game Development", "C#/C++", "System Design"] },
    ],
    "AR Developer": [
      { order: 1, title: "AR Fundamentals", description: "AR concepts and types", skills: ["AR", "Marker-based", "Markerless", "Spatial Mapping"] },
      { order: 2, title: "ARKit", description: "Apple AR framework", skills: ["ARKit", "Swift", "RealityKit", "Scene Understanding"] },
      { order: 3, title: "ARCore", description: "Google AR framework", skills: ["ARCore", "Kotlin", "Sceneform", "Cloud Anchors"] },
      { order: 4, title: "Unity AR Foundation", description: "Cross-platform AR", skills: ["Unity", "AR Foundation", "XR Plugin", "ARCamera"] },
      { order: 5, title: "3D Modeling for AR", description: "Create 3D assets", skills: ["3D Modeling", "Blender", "FBX", "GLTF"] },
      { order: 6, title: "Computer Vision", description: "Image recognition", skills: ["Computer Vision", "Image Tracking", "Object Recognition"] },
      { order: 7, title: "Spatial Computing", description: "Spatial mapping, meshing", skills: ["Spatial Mapping", "Room Scan", "Plane Detection"] },
      { order: 8, title: "Light Estimation", description: "Realistic lighting", skills: ["Light Estimation", "HDR Lighting", "Shadows"] },
      { order: 9, title: "Interaction Design", description: "AR interactions", skills: ["AR Interactions", "Gestures", "Raycasting", "Placement"] },
      { order: 10, title: "Performance", description: "Optimize AR apps", skills: ["AR Performance", "Battery", "Frame Rate", "Memory"] },
      { order: 11, title: "Cloud Anchors", description: "Shared AR experiences", skills: ["Cloud Anchors", "Multi-user AR", "Persistence"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for AR roles", skills: ["AR", "Computer Vision", "Unity/Swift"] },
    ],
    "VR Developer": [
      { order: 1, title: "VR Fundamentals", description: "VR concepts and hardware", skills: ["VR", "HMDs", "Tracking", "6DOF", "3DOF"] },
      { order: 2, title: "Unity VR", description: "Develop VR in Unity", skills: ["Unity", "XR Interaction Toolkit", "VR Camera", "Teleportation"] },
      { order: 3, title: "Unreal VR", description: "Develop VR in Unreal", skills: ["Unreal Engine", "VR Template", "Motion Controllers"] },
      { order: 4, title: "3D Graphics for VR", description: "High-performance 3D", skills: ["3D Graphics", "Stereo Rendering", "FOV", "LOD"] },
      { order: 5, title: "Interaction Design", description: "VR interactions", skills: ["VR Interaction", "Grab", "Teleport", "UI in VR"] },
      { order: 6, title: "Locomotion", description: "Movement in VR", skills: ["Locomotion", "Smooth Movement", "Snap Turn", "Room Scale"] },
      { order: 7, title: "Audio in VR", description: "Spatial audio", skills: ["Spatial Audio", "HRTF", "3D Audio", "Ambisonics"] },
      { order: 8, title: "Optimization", description: "VR performance", skills: ["VR Optimization", "FPS", "Render Scale", "ASW"] },
      { order: 9, title: "Hand Tracking", description: "Hand interactions", skills: ["Hand Tracking", "Leap Motion", "Ultraleap", "Gestures"] },
      { order: 10, title: "Multiplayer VR", description: "Social VR", skills: ["Multiplayer VR", "Photon", "Avatars", "Synchronization"] },
      { order: 11, title: "VR Testing", description: "Test VR experiences", skills: ["VR Testing", "Comfort", "Motion Sickness", "UX"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for VR roles", skills: ["VR", "Unity/Unreal", "3D Graphics"] },
    ],
    "IoT Engineer": [
      { order: 1, title: "Embedded Systems", description: "Microcontrollers and SoCs", skills: ["Embedded Systems", "Microcontrollers", "GPIO", "ADC/DAC"] },
      { order: 2, title: "C/C++ Programming", description: "Low-level programming", skills: ["C", "C++", "Memory Management", "Pointers"] },
      { order: 3, title: "Python for IoT", description: "Scripting and data", skills: ["Python", "MicroPython", "CircuitPython", "Scripting"] },
      { order: 4, title: "Arduino", description: "Arduino platform", skills: ["Arduino", "Sketches", "Libraries", "Shields"] },
      { order: 5, title: "Raspberry Pi", description: "Single-board computers", skills: ["Raspberry Pi", "Linux", "GPIO", "Camera"] },
      { order: 6, title: "Sensors & Actuators", description: "Hardware interfacing", skills: ["Sensors", "Temperature", "Motion", "Servos"] },
      { order: 7, title: "Communication Protocols", description: "I2C, SPI, UART, MQTT", skills: ["I2C", "SPI", "UART", "MQTT", "CoAP"] },
      { order: 8, title: "Wireless Communication", description: "WiFi, BLE, LoRa, Zigbee", skills: ["WiFi", "BLE", "LoRa", "Zigbee", "NFC"] },
      { order: 9, title: "Cloud IoT Platforms", description: "AWS IoT, Azure IoT Hub", skills: ["AWS IoT", "Azure IoT", "GCP IoT", "Device Shadows"] },
      { order: 10, title: "Edge Computing", description: "Process at edge", skills: ["Edge Computing", "Edge ML", "TensorFlow Lite"] },
      { order: 11, title: "Security", description: "IoT security", skills: ["IoT Security", "Encryption", "Secure Boot", "OTA Updates"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for IoT roles", skills: ["IoT", "Embedded Systems", "Networking"] },
    ],
    "Robotics Engineer": [
      { order: 1, title: "Mathematics for Robotics", description: "Linear algebra, calculus, kinematics", skills: ["Linear Algebra", "Calculus", "Kinematics", "Dynamics"] },
      { order: 2, title: "Programming", description: "C++ and Python for robotics", skills: ["C++", "Python", "Real-time Systems", "Optimization"] },
      { order: 3, title: "ROS (Robot Operating System)", description: "ROS 2 framework", skills: ["ROS 2", "Nodes", "Topics", "Services", "Actions"] },
      { order: 4, title: "Robot Kinematics", description: "Forward and inverse kinematics", skills: ["Kinematics", "Forward Kinematics", "Inverse Kinematics", "Jacobians"] },
      { order: 5, title: "Control Systems", description: "PID, state space", skills: ["Control Systems", "PID", "LQR", "MPC"] },
      { order: 6, title: "Computer Vision", description: "Robot vision", skills: ["Computer Vision", "OpenCV", "Object Detection", "Stereo Vision"] },
      { order: 7, title: "SLAM", description: "Simultaneous localization and mapping", skills: ["SLAM", "Visual SLAM", "LIDAR SLAM", "GMapping"] },
      { order: 8, title: "Motion Planning", description: "Path and trajectory planning", skills: ["Motion Planning", "RRT", "A*", "Trajectory Optimization"] },
      { order: 9, title: "Sensor Fusion", description: "Combine sensor data", skills: ["Sensor Fusion", "Kalman Filter", "EKF", "UKF"] },
      { order: 10, title: "Manipulation", description: "Robot arms and grippers", skills: ["Manipulation", "MoveIt", "Pick and Place", "Force Control"] },
      { order: 11, title: "Simulation", description: "Gazebo, Webots", skills: ["Simulation", "Gazebo", "Webots", "URDF/SDF"] },
      { order: 12, title: "Interview Preparation", description: "Prepare for robotics roles", skills: ["Robotics", "ROS", "Computer Vision", "Control"] },
    ],
    "AI Engineer 2026": [
      { order: 1, title: "Python Advanced", description: "OOP, async, type hints, packaging", skills: ["Python", "OOP", "Async/Await", "Type Hints", "Virtual Environments", "Packaging", "Testing", "Debugging"] },
      { order: 2, title: "Computer Science", description: "DSA, OS, networking, databases", skills: ["Data Structures", "Algorithms", "Time Complexity", "Operating Systems", "Networking", "Databases"] },
      { order: 3, title: "SQL & Databases", description: "PostgreSQL, Vector DBs, Redis, MongoDB", skills: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Vector Databases", "Query Optimization"] },
      { order: 4, title: "Backend Development", description: "FastAPI, Django, auth, WebSockets", skills: ["FastAPI", "Django", "Flask", "JWT", "OAuth", "WebSockets", "Celery", "GraphQL"] },
      { order: 5, title: "Machine Learning", description: "NumPy, Pandas, scikit-learn, model evaluation", skills: ["NumPy", "Pandas", "Matplotlib", "Scikit-learn", "Classification", "Regression", "Clustering", "Feature Engineering"] },
      { order: 6, title: "Deep Learning", description: "PyTorch, TensorFlow, CNNs, RNNs, Transformers", skills: ["PyTorch", "TensorFlow", "Neural Networks", "CNNs", "RNNs", "LSTM", "Transformers"] },
      { order: 7, title: "LLMs", description: "Tokenization, embeddings, prompt engineering, fine-tuning", skills: ["Tokenization", "Embeddings", "Prompt Engineering", "Fine-tuning", "Function Calling", "Structured Outputs"] },
      { order: 8, title: "RAG", description: "Chunking, vector search, hybrid search, re-ranking", skills: ["RAG", "Chunking", "Vector Search", "Hybrid Search", "Re-ranking", "Citations"] },
      { order: 9, title: "AI Agents", description: "LangGraph, multi-agent, tool calling, memory", skills: ["AI Agents", "LangGraph", "LangChain", "CrewAI", "AutoGen", "Tool Calling", "Memory", "Planning"] },
      { order: 10, title: "MCP Protocol", description: "Model Context Protocol servers and clients", skills: ["MCP", "MCP Servers", "MCP Clients", "Tool Integration", "File Systems", "Database MCP"] },
      { order: 11, title: "Deployment", description: "Docker, Kubernetes, CI/CD, cloud deploy", skills: ["Docker", "Docker Compose", "Kubernetes", "Nginx", "CI/CD", "GitHub Actions", "Railway", "AWS"] },
      { order: 12, title: "AI Observability", description: "Logging, monitoring, tracing, cost tracking", skills: ["Logging", "Monitoring", "Tracing", "Prompt Evaluation", "Cost Tracking", "LangSmith", "Helicone"] },
      { order: 13, title: "AI Security", description: "Prompt injection, guardrails, content moderation", skills: ["Prompt Injection", "Jailbreak Prevention", "Secrets Management", "API Security", "Rate Limiting", "Guardrails"] },
      { order: 14, title: "Production AI Systems", description: "Build complete AI products", skills: ["AI Resume Builder", "AI ATS Checker", "AI Interview Coach", "AI Research Assistant", "AI Customer Support Agent"] },
      { order: 15, title: "Portfolio Building", description: "10-15 production AI projects", skills: ["GitHub", "Live Demo", "Documentation", "Architecture Design", "Deployment", "CI/CD"] },
      { order: 16, title: "Interview Preparation", description: "AI, LLM, RAG, system design prep", skills: ["AI Engineer Interview", "LLM Questions", "RAG Questions", "System Design", "ML Fundamentals"] },
      { order: 17, title: "Weekly Learning Plan", description: "20-week structured schedule", skills: ["Python Weeks 1-2", "SQL Weeks 3-4", "ML Weeks 5-6", "DL Weeks 7-8", "LLMs Weeks 9-10", "RAG Weeks 11-12", "Agents Weeks 13-14", "MCP Weeks 15-16", "Deploy Weeks 17-18", "Projects Weeks 19-20"] },
      { order: 18, title: "Certifications", description: "AWS AI, Azure AI, GCP GenAI, DeepLearning.AI", skills: ["AWS AI Practitioner", "Azure AI Engineer", "Google Cloud GenAI", "DeepLearning.AI", "Hugging Face", "NVIDIA DLI"] },
      { order: 19, title: "Learning Resources", description: "Docs, courses, papers, GitHub repos", skills: ["Official Documentation", "YouTube Playlists", "Coursera", "DeepLearning.AI", "Research Papers", "GitHub Repos"] },
      { order: 20, title: "Progress Tracking", description: "Topics, streak, hours, projects, readiness", skills: ["Topic Tracking", "Study Streak", "Hours Tracking", "Project Completion", "AI Readiness Score", "Job Readiness Score"] },
    ],
  },
};
const AI_ENGINEER_2026_ROADMAP = {
  title: "AI Engineer 2026 – Complete Learning Path",
  category: "Data & AI",
  description: "The most comprehensive AI Engineer roadmap covering Python to production-ready AI systems. Build LLMs, RAG pipelines, AI agents, MCP servers, and deploy at scale.",
  difficulty: "advanced",
  estimatedDuration: "8-12 months",
  skills: ["Python", "PyTorch", "LLMs", "RAG", "AI Agents", "MCP", "Docker", "FastAPI", "Vector Databases", "LangChain", "LangGraph", "Kubernetes"],
  salary: "₹12-80+ LPA",
  salaryGlobal: "$120k-$300k+",
  demand: "Very High",
  trending: true,
  modulesCount: 20,
  projectsCount: 15,
  steps: [
    { order: 1, title: "Python Advanced", description: "OOP, async, type hints, packaging", skills: ["Python", "OOP", "Async/Await", "Type Hints", "Virtual Environments", "Packaging", "Testing", "Debugging"] },
    { order: 2, title: "Computer Science", description: "DSA, OS, networking, databases", skills: ["Data Structures", "Algorithms", "Time Complexity", "Operating Systems", "Networking", "Databases", "REST APIs"] },
    { order: 3, title: "SQL & Databases", description: "PostgreSQL, Vector DBs, Redis, MongoDB", skills: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Vector Databases", "Query Optimization"] },
    { order: 4, title: "Backend Development", description: "FastAPI, Django, auth, WebSockets", skills: ["FastAPI", "Django", "Flask", "JWT", "OAuth", "WebSockets", "Celery", "GraphQL"] },
    { order: 5, title: "Machine Learning", description: "NumPy, Pandas, scikit-learn, model evaluation", skills: ["NumPy", "Pandas", "Matplotlib", "Scikit-learn", "Classification", "Regression", "Clustering", "Feature Engineering"] },
    { order: 6, title: "Deep Learning", description: "PyTorch, TensorFlow, CNNs, RNNs, Transformers", skills: ["PyTorch", "TensorFlow", "Neural Networks", "CNNs", "RNNs", "LSTM", "Transformers"] },
    { order: 7, title: "LLMs", description: "Tokenization, embeddings, prompt engineering, fine-tuning", skills: ["Tokenization", "Embeddings", "Prompt Engineering", "Fine-tuning", "Function Calling", "Structured Outputs"] },
    { order: 8, title: "RAG", description: "Chunking, vector search, hybrid search, re-ranking", skills: ["RAG", "Chunking", "Vector Search", "Hybrid Search", "Re-ranking", "Citations"] },
    { order: 9, title: "AI Agents", description: "LangGraph, multi-agent, tool calling, memory", skills: ["AI Agents", "LangGraph", "LangChain", "CrewAI", "AutoGen", "Tool Calling", "Memory", "Planning"] },
    { order: 10, title: "MCP Protocol", description: "Model Context Protocol servers and clients", skills: ["MCP", "MCP Servers", "MCP Clients", "Tool Integration", "File Systems", "Database MCP", "GitHub MCP"] },
    { order: 11, title: "Deployment", description: "Docker, Kubernetes, CI/CD, cloud deploy", skills: ["Docker", "Docker Compose", "Kubernetes", "Nginx", "CI/CD", "GitHub Actions", "Railway", "AWS"] },
    { order: 12, title: "AI Observability", description: "Logging, monitoring, tracing, cost tracking", skills: ["Logging", "Monitoring", "Tracing", "Prompt Evaluation", "Cost Tracking", "LangSmith", "Helicone"] },
    { order: 13, title: "AI Security", description: "Prompt injection, guardrails, content moderation", skills: ["Prompt Injection", "Jailbreak Prevention", "Secrets Management", "API Security", "Rate Limiting", "Guardrails"] },
    { order: 14, title: "Production AI Systems", description: "Build complete AI products", skills: ["AI Resume Builder", "AI ATS Checker", "AI Interview Coach", "AI Research Assistant", "AI Customer Support Agent"] },
    { order: 15, title: "Portfolio Building", description: "10-15 production AI projects", skills: ["GitHub", "Live Demo", "Documentation", "Architecture Design", "Deployment", "CI/CD"] },
    { order: 16, title: "Interview Preparation", description: "AI, LLM, RAG, system design prep", skills: ["AI Engineer Interview", "LLM Questions", "RAG Questions", "System Design", "ML Fundamentals", "Deep Learning"] },
    { order: 17, title: "Weekly Learning Plan", description: "20-week structured schedule", skills: ["Python Weeks 1-2", "SQL Weeks 3-4", "ML Weeks 5-6", "DL Weeks 7-8", "LLMs Weeks 9-10", "RAG Weeks 11-12", "Agents Weeks 13-14", "MCP Weeks 15-16", "Deploy Weeks 17-18", "Projects Weeks 19-20"] },
    { order: 18, title: "Certifications", description: "AWS AI, Azure AI, GCP GenAI, DeepLearning.AI", skills: ["AWS AI Practitioner", "Azure AI Engineer", "Google Cloud GenAI", "DeepLearning.AI", "Hugging Face", "NVIDIA DLI"] },
    { order: 19, title: "Learning Resources", description: "Docs, courses, papers, GitHub repos", skills: ["Official Documentation", "YouTube Playlists", "Coursera", "DeepLearning.AI", "Research Papers", "GitHub Repos"] },
    { order: 20, title: "Progress Tracking", description: "Topics, streak, hours, projects, readiness", skills: ["Topic Tracking", "Study Streak", "Hours Tracking", "Project Completion", "AI Readiness Score", "Job Readiness Score"] },
  ],
};

function pick(arr, count) { const s = [...arr].sort(() => Math.random() - 0.5); return s.slice(0, count); }

function getResources(skills) {
  const result = [];
  skills.forEach(skill => {
    const res = ROADMAP_DATA.resources[skill];
    if (res) { res.forEach(r => { if (!result.find(x => x.url === r.url)) result.push(r); }); }
  });
  return result.slice(0, 8);
}

function getProjects(skills) {
  const result = [];
  skills.forEach(skill => {
    const projs = ROADMAP_DATA.projects[skill];
    if (projs) { projs.forEach(p => { if (!result.find(x => x.title === p.title)) result.push(p); }); }
  });
  return result.slice(0, 5);
}

function getSkillGap(currentSkills, targetRole) {
  const required = ROADMAP_DATA.skillMap[targetRole] || [];
  const lower = s => s.toLowerCase();
  const currentSet = new Set(currentSkills.map(lower));
  const known = required.filter(s => currentSet.has(lower(s)));
  const needsImprovement = required.filter(s => currentSet.has(lower(s)) && Math.random() > 0.6);
  const missing = required.filter(s => !currentSet.has(lower(s)));
  const matchScore = required.length > 0 ? Math.round((known.length / required.length) * 100) : 0;
  return { known: known.slice(0, 20), needsImprovement: needsImprovement.slice(0, 10), missing: missing.slice(0, 30), matchScore, analysis: `You have ${known.length} of ${required.length} required skills (${matchScore}% match). Focus on learning: ${missing.slice(0, 5).join(", ")}.` };
}

function generateWeeklyPlan(steps, weeklyHours) {
  const weeks = [];
  const tasksPerWeek = Math.max(2, Math.round(weeklyHours / 5));
  steps.forEach((step, i) => {
    const weekNum = i + 1;
    const tasks = [
      { title: `Learn ${step.title} - Part 1`, description: `Study the fundamentals of ${step.title}`, dayOfWeek: 0, estimatedHours: Math.round(weeklyHours * 0.3) },
      { title: `Practice ${step.title}`, description: `Build practice projects for ${step.title}`, dayOfWeek: 2, estimatedHours: Math.round(weeklyHours * 0.3) },
      { title: `${step.title} - Deep Dive`, description: `Advanced topics in ${step.title}`, dayOfWeek: 4, estimatedHours: Math.round(weeklyHours * 0.25) },
      { title: `Review & Quiz`, description: `Test your knowledge of ${step.title}`, dayOfWeek: 6, estimatedHours: Math.round(weeklyHours * 0.15) },
    ];
    weeks.push({ week: weekNum, title: `Week ${weekNum}: ${step.title}`, tasks: tasks.slice(0, tasksPerWeek) });
  });
  return weeks;
}

function generateRoadmapSteps(targetRole) {
  const steps = ROADMAP_DATA.roleRoadmaps[targetRole];
  if (!steps) return [];
  return steps.map(s => ({
    ...s,
    resources: getResources(s.skills),
    projects: getProjects(s.skills),
    completed: false,
    locked: s.order > 1,
    timeSpent: 0,
  }));
}

function determineDifficulty(currentRole, targetRole, yearsOfExperience) {
  const roleLevel = { beginner: 0, intermediate: 1, advanced: 2 };
  const roleInfo = ROADMAP_DATA.roles[targetRole];
  if (!roleInfo) return "intermediate";
  const baseDifficulty = roleInfo.difficulty;
  if (yearsOfExperience >= 5) return baseDifficulty === "advanced" ? "advanced" : "intermediate";
  if (yearsOfExperience >= 2) return "intermediate";
  return baseDifficulty;
}

export const generateRoadmap = async (req, res) => {
  try {
    const { currentRole, targetRole, yearsOfExperience, currentSkills, preferredTechStack, education, targetCompanies, preferredCountry, weeklyStudyHours, targetCompletionDate, targetSalary, interests } = req.body;
    if (!targetRole) return res.status(400).json({ success: false, message: "Target role is required" });

    const roleKey = Object.entries(ROADMAP_DATA.roles).find(([, v]) => v.title.toLowerCase() === targetRole.toLowerCase())?.[0];
    const roleName = Object.values(ROADMAP_DATA.roles).find(v => v.title.toLowerCase() === targetRole.toLowerCase());
    const validRole = roleName || ROADMAP_DATA.roles[Object.keys(ROADMAP_DATA.roles)[0]];
    const lookupKey = roleKey || Object.keys(ROADMAP_DATA.roles)[0];

    const cSkills = currentSkills || ROADMAP_DATA.skillMap[lookupKey]?.slice(0, 3) || [];
    const steps = generateRoadmapSteps(validRole.title);
    const skillGap = getSkillGap(cSkills, lookupKey);
    const difficulty = determineDifficulty(currentRole || "", lookupKey, yearsOfExperience || 0);
    const weeklyPlan = generateWeeklyPlan(steps, weeklyStudyHours || 10);
    const jobMarket = normalizeJobMarket(ROADMAP_DATA.jobMarkets[validRole.title] || { demand: "medium", averageSalary: 1000000, hiringCompanies: [], growthRate: 10, competition: "medium", trendingSkills: [] });
    const certs = pick(ROADMAP_DATA.certifications, 3);
    const companyName = targetCompanies?.[0] || "";
    const companyPrep = ROADMAP_DATA.companyInfo[companyName] || null;

    const roadmap = await CareerRoadmap.create({
      user: req.id,
      title: `Roadmap: ${currentRole || "Beginner"} → ${validRole.title}`,
      category: lookupKey,
      description: `Personalized roadmap${currentRole ? ` from ${currentRole}` : ""} to become a ${validRole.title} in ${difficulty === "beginner" ? "12" : difficulty === "intermediate" ? "15" : "18"} months.`,
      currentRole: currentRole || validRole.title,
      targetRole: validRole.title,
      yearsOfExperience: yearsOfExperience || 0,
      currentSkills: cSkills,
      preferredTechStack: preferredTechStack || [],
      education: education || "",
      targetCompanies: targetCompanies || [],
      preferredCountry: preferredCountry || "India",
      weeklyStudyHours: weeklyStudyHours || 10,
      targetCompletionDate: targetCompletionDate || null,
      targetSalary: targetSalary || null,
      interests: interests || [],
      steps: steps.map((s, i) => ({ ...s, locked: i > 0 })),
      weeklyPlan,
      skillGap,
      progress: 0,
      difficulty,
      estimatedDuration: `${difficulty === "beginner" ? "12" : difficulty === "intermediate" ? "15" : "18"} months`,
      source: "ai-generated",
      certifications: certs.map(c => ({ ...c, recommended: true })),
      jobMarket: {
        demand: jobMarket.demand,
        averageSalary: jobMarket.averageSalary,
        salaryCurrency: "INR",
        hiringCompanies: jobMarket.hiringCompanies || [],
        growthRate: jobMarket.growthRate || 10,
        competition: jobMarket.competition || "medium",
        trendingSkills: jobMarket.trendingSkills || [],
        topLocations: jobMarket.topLocations || [],
      },
      companyPreparation: companyPrep ? {
        companyName,
        overview: companyPrep.overview,
        dsaTopics: companyPrep.dsaTopics,
        systemDesignTopics: companyPrep.systemDesignTopics,
        behavioralQuestions: companyPrep.behavioralQuestions,
        interviewRounds: companyPrep.rounds.map(r => ({ ...r, completed: false })),
      } : undefined,
      outcomes: validRole.outcomes || [],
      status: "active",
    });
    res.status(201).json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyRoadmaps = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { user: req.id };
    if (status) query.status = status;
    const roadmaps = await CareerRoadmap.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await CareerRoadmap.countDocuments(query);
    res.json({ success: true, roadmaps, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getRoadmapById = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    res.json({ success: true, roadmap });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateRoadmap = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    const allowed = ["title", "status", "isFavorite", "weeklyStudyHours", "targetCompletionDate", "targetSalary", "tags"];
    allowed.forEach(field => { if (req.body[field] !== undefined) roadmap[field] = req.body[field]; });
    if (req.body.steps) { roadmap.steps = req.body.steps; }
    await roadmap.save();
    res.json({ success: true, roadmap });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteRoadmap = async (req, res) => {
  try {
    await CareerRoadmap.findOneAndDelete({ _id: req.params.id, user: req.id });
    res.json({ success: true, message: "Roadmap deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const duplicateRoadmap = async (req, res) => {
  try {
    const original = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!original) return res.status(404).json({ success: false, message: "Roadmap not found" });
    const data = original.toObject();
    delete data._id;
    delete data.__v;
    delete data.createdAt;
    delete data.updatedAt;
    data.title = `${data.title} (Copy)`;
    data.status = "active";
    data.progress = 0;
    data.steps = data.steps.map(s => ({ ...s, completed: false, locked: s.order > 1, timeSpent: 0 }));
    data.weeklyPlan = data.weeklyPlan.map(w => ({ ...w, completed: false, tasks: w.tasks.map(t => ({ ...t, completed: false })) }));
    const copy = await CareerRoadmap.create(data);
    res.status(201).json({ success: true, roadmap: copy });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const markStepComplete = async (req, res) => {
  try {
    const { stepIndex, timeSpent } = req.body;
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    if (stepIndex >= roadmap.steps.length) return res.status(400).json({ success: false, message: "Invalid step index" });

    const step = roadmap.steps[stepIndex];
    if (step.locked) return res.status(400).json({ success: false, message: "Step is locked. Complete previous steps first." });

    step.completed = !step.completed;
    if (step.completed) { step.completedAt = new Date(); if (timeSpent) step.timeSpent += timeSpent; }
    else { step.completedAt = null; }

    if (step.completed && stepIndex + 1 < roadmap.steps.length) { roadmap.steps[stepIndex + 1].locked = false; }

    const completed = roadmap.steps.filter(s => s.completed).length;
    roadmap.progress = Math.round((completed / roadmap.steps.length) * 100);
    roadmap.totalTimeSpent = (roadmap.totalTimeSpent || 0) + (timeSpent || 0);
    roadmap.hoursLearned = Math.round((roadmap.totalTimeSpent / 60) * 10) / 10;
    roadmap.projectsCompleted = roadmap.steps.filter(s => s.projects?.filter(p => p.completed).length > 0).length;

    await roadmap.save();
    res.json({ success: true, roadmap });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getSkillGapAnalysis = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    const lookupKey = Object.entries(ROADMAP_DATA.roles).find(([, v]) => v.title === roadmap.targetRole)?.[0];
    const analysis = getSkillGap(roadmap.currentSkills || [], lookupKey || "frontend");
    roadmap.skillGap = analysis;
    await roadmap.save();
    res.json({ success: true, skillGap: analysis });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const generateWeeklyPlanAction = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    const weeklyPlan = generateWeeklyPlan(roadmap.steps, roadmap.weeklyStudyHours || 10);
    roadmap.weeklyPlan = weeklyPlan;
    await roadmap.save();
    res.json({ success: true, weeklyPlan });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateWeeklyTask = async (req, res) => {
  try {
    const { weekIndex, taskIndex, completed } = req.body;
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    if (roadmap.weeklyPlan[weekIndex]?.tasks[taskIndex]) {
      roadmap.weeklyPlan[weekIndex].tasks[taskIndex].completed = completed;
      const allDone = roadmap.weeklyPlan[weekIndex].tasks.every(t => t.completed);
      roadmap.weeklyPlan[weekIndex].completed = allDone;
      await roadmap.save();
    }
    res.json({ success: true, weeklyPlan: roadmap.weeklyPlan });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const markWeeklyPlanComplete = async (req, res) => {
  try {
    const { weekIndex } = req.body;
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    if (roadmap.weeklyPlan[weekIndex]) {
      roadmap.weeklyPlan[weekIndex].tasks.forEach(t => t.completed = true);
      roadmap.weeklyPlan[weekIndex].completed = true;
      await roadmap.save();
    }
    res.json({ success: true, weeklyPlan: roadmap.weeklyPlan });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getDashboard = async (req, res) => {
  try {
    const roadmaps = await CareerRoadmap.find({ user: req.id });
    const active = roadmaps.filter(r => r.status === "active");
    const totalProgress = active.length > 0 ? Math.round(active.reduce((s, r) => s + r.progress, 0) / active.length) : 0;
    const totalSteps = active.reduce((s, r) => s + r.steps.length, 0);
    const completedSteps = active.reduce((s, r) => s + r.steps.filter(st => st.completed).length, 0);
    const totalHours = Math.round(active.reduce((s, r) => s + (r.hoursLearned || 0), 0) * 10) / 10;
    const projectsCompleted = active.reduce((s, r) => s + r.projectsCompleted, 0);
    const certificationsEarned = active.reduce((s, r) => s + r.certifications.filter(c => c.completed).length, 0);
    const interviewReadiness = active.length > 0 ? Math.round(active.reduce((s, r) => s + (r.interviewPrep?.readinessScore || 0), 0) / active.length) : 0;

    const currentStreak = active.reduce((s, r) => s + (r.currentStreak || 0), 0);
    const longestStreak = active.reduce((s, r) => s + (r.longestStreak || 0), 0);

    const skillGapAll = { known: [...new Set(active.flatMap(r => r.skillGap?.known || []))], missing: [...new Set(active.flatMap(r => r.skillGap?.missing || []))] };

    const notifications = active.flatMap(r => (r.notifications || []).filter(n => !n.read)).slice(0, 10);

    res.json({
      success: true,
      dashboard: {
        totalRoadmaps: roadmaps.length,
        activeRoadmaps: active.length,
        completedRoadmaps: roadmaps.filter(r => r.status === "completed").length,
        overallProgress: totalProgress,
        totalSteps,
        completedSteps,
        remainingSteps: totalSteps - completedSteps,
        currentStreak,
        longestStreak,
        hoursLearned: totalHours,
        projectsCompleted,
        certificationsEarned,
        interviewReadiness,
        knownSkills: skillGapAll.known.length,
        missingSkills: skillGapAll.missing.length,
        unreadNotifications: notifications.length,
        roadmaps: active.map(r => ({ _id: r._id, title: r.title, progress: r.progress, targetRole: r.targetRole, status: r.status })),
      },
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const aiMentor = async (req, res) => {
  try {
    const { question, roadmapId } = req.body;
    if (!question) return res.status(400).json({ success: false, message: "Question is required" });

    const roadmap = roadmapId ? await CareerRoadmap.findOne({ _id: roadmapId, user: req.id }) : null;
    const q = question.toLowerCase();
    let answer = "";

    if (q.includes("what should i learn next") || q.includes("next step") || q.includes("what to learn")) {
      if (roadmap) {
        const nextIncomplete = roadmap.steps.find(s => !s.completed && !s.locked);
        const nextLocked = roadmap.steps.find(s => s.locked);
        if (nextIncomplete) answer = `Your next step is **${nextIncomplete.title}**. Focus on: ${nextIncomplete.skills.join(", ")}. I've prepared resources including documentation and practice projects to help you.`;
        else if (nextLocked) answer = `Complete your current step first, then **${nextLocked.title}** will unlock. Stay consistent!`;
        else answer = "You've completed all steps! Review and practice to reinforce your skills before interviews.";
      } else {
        answer = "Start by creating a roadmap! Tell me your current role and target role, and I'll generate a personalized learning path.";
      }
    } else if (q.includes("am i ready for interview") || q.includes("interview ready") || q.includes("job ready")) {
      const progress = roadmap?.progress || 0;
      const interviewScore = roadmap?.interviewPrep?.readinessScore || 0;
      if (progress >= 80 && interviewScore >= 60) answer = `You're well prepared! You're ${progress}% through your roadmap with an interview readiness score of ${interviewScore}/100. Focus on mock interviews and practice DSA.`;
      else if (progress >= 50) answer = `You're making good progress (${progress}%). I recommend completing at least 80% of your roadmap and practicing at least 50 LeetCode problems before interviews.`;
      else answer = `You're ${progress}% through your roadmap. Keep learning and building projects. I'll let you know when you're interview-ready!`;
    } else if (q.includes("which project") || q.includes("what project") || q.includes("build")) {
      if (roadmap) {
        const incompleteStep = roadmap.steps.find(s => !s.completed);
        const projs = incompleteStep?.projects || [];
        if (projs.length > 0) answer = `For **${incompleteStep.title}**, try building: ${projs.slice(0, 3).map(p => `**${p.title}** (${p.difficulty}, ~${p.estimatedTime})`).join(", ")}.`;
        else answer = `Build a project that combines ${(roadmap.currentSkills || []).slice(0, 3).join(", ")} with what you're learning. Maybe a full-stack app?`;
      } else answer = "Create a roadmap first, then I'll recommend projects based on your learning path!";
    } else if (q.includes("what skills am i missing") || q.includes("skill gap") || q.includes("missing skills")) {
      if (roadmap?.skillGap) {
        const gap = roadmap.skillGap;
        answer = `**Known skills (${gap.known.length}):** ${gap.known.slice(0, 8).join(", ")}.\n**Missing skills (${gap.missing.length}):** ${gap.missing.slice(0, 8).join(", ")}.\n**Match score:** ${gap.matchScore}%.\n${gap.analysis || ""}`;
      } else if (roadmap) {
        const lookupKey = Object.entries(ROADMAP_DATA.roles).find(([, v]) => v.title === roadmap.targetRole)?.[0];
        const required = ROADMAP_DATA.skillMap[lookupKey || "frontend"] || [];
        answer = `For ${roadmap.targetRole}, you need: ${required.join(", ")}. Compare these with your current skills to identify gaps.`;
      } else answer = "Create a roadmap and add your current skills, then I can analyze your skill gaps!";
    } else if (q.includes("salary") || q.includes("lpa") || q.includes("crore") || q.includes("25 lpa") || q.includes("how much")) {
      const market = roadmap?.jobMarket;
      if (market) answer = `For **${roadmap.targetRole}**, the average salary is **₹${(market.averageSalary / 100000).toFixed(1)} LPA** with **${market.growthRate}% growth**.\nTop companies: ${(market.hiringCompanies || []).slice(0, 4).join(", ")}.\nTrending skills: ${(market.trendingSkills || []).join(", ")}.`;
      else answer = "The average salary for senior tech roles in India ranges from ₹25-60 LPA depending on company, location, and skills. FAANG companies pay 1.5-2x market rate.";
    } else if (q.includes("certification") || q.includes("certificate") || q.includes("certify")) {
      const certs = roadmap?.certifications?.filter(c => c.recommended) || ROADMAP_DATA.certifications.slice(0, 4);
      answer = `Recommended certifications:\n${certs.slice(0, 5).map(c => `- **${c.name}** (${c.provider}, ${c.duration}, ${c.cost})`).join("\n")}`;
    } else if (q.includes("company") || q.includes("google") || q.includes("microsoft") || q.includes("amazon") || q.includes("flipkart")) {
      const companyNames = ["Google", "Microsoft", "Amazon", "Flipkart", "Swiggy", "Meta", "Netflix", "Adobe", "Uber"];
      const mentioned = companyNames.find(c => q.includes(c.toLowerCase()));
      const info = ROADMAP_DATA.companyInfo[mentioned];
      if (info) answer = `**${mentioned}** preparation guide:\n${info.overview}\n**DS&A Topics:** ${info.dsaTopics.join(", ")}\n**System Design:** ${info.systemDesignTopics.join(", ")}\n**Interview rounds:** ${info.rounds.map(r => r.round).join(" → ")}`;
      else answer = `Top tech companies hiring in India include Google, Microsoft, Amazon, Flipkart, Swiggy, Uber, and Razorpay. Each has specific preparation requirements. Ask about any specific company!`;
    } else if (q.includes("how many hours") || q.includes("study plan") || q.includes("weekly")) {
      const hours = roadmap?.weeklyStudyHours || 10;
      answer = `You're studying ~${hours} hours/week. I recommend:\n- ${Math.round(hours * 0.4)}h learning new concepts\n- ${Math.round(hours * 0.3)}h hands-on projects\n- ${Math.round(hours * 0.2)}h practice & coding challenges\n- ${Math.round(hours * 0.1)}h review & revision`;
    } else {
      answer = `I'm your AI Career Mentor! I can help you with:\n- What to learn next based on your roadmap\n- Interview readiness assessment\n- Project recommendations\n- Skill gap analysis\n- Salary insights & market data\n- Company-specific preparation\n- Certification recommendations\n- Weekly study plans\n\nWhat would you like to know?`;
    }

    if (roadmap) {
      roadmap.aiMentorChat.push({ question, answer, timestamp: new Date() });
      await roadmap.save();
    }

    res.json({ success: true, answer, history: roadmap?.aiMentorChat || [] });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const resumeIntegration = async (req, res) => {
  try {
    const { resumeText, skills, projects, experience, education } = req.body;
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });

    const extractedSkills = skills || (resumeText ? resumeText.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : []);
    const lookupKey = Object.entries(ROADMAP_DATA.roles).find(([, v]) => v.title === roadmap.targetRole)?.[0];
    const requiredSkills = ROADMAP_DATA.skillMap[lookupKey || "frontend"] || [];
    const missingTech = requiredSkills.filter(r => !extractedSkills.some(s => s.toLowerCase() === r.toLowerCase()));

    const analysis = { resumeText: resumeText || "", skills: extractedSkills, projects: projects || [], experience: experience || "", education: education || "", missingTechnologies: missingTech, recommendations: missingTech.slice(0, 5).map(s => `Learn ${s} to meet ${roadmap.targetRole} requirements`), analyzedAt: new Date() };

    roadmap.currentSkills = [...new Set([...roadmap.currentSkills, ...extractedSkills])];
    roadmap.resumeAnalysis = analysis;
    await roadmap.save();

    res.json({ success: true, resumeAnalysis: analysis });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getJobMarket = async (req, res) => {
  try {
    const { role } = req.params;
    const market = ROADMAP_DATA.jobMarkets[role];
    if (market) return res.json({ success: true, jobMarket: market });
    const closest = Object.entries(ROADMAP_DATA.jobMarkets).find(([k]) => k.toLowerCase().includes(role.toLowerCase()))?.[1];
    res.json({ success: true, jobMarket: closest || { demand: "medium", averageSalary: 800000, hiringCompanies: [], growthRate: 12, competition: "medium", trendingSkills: [] } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getCompanyPrep = async (req, res) => {
  try {
    const { company } = req.params;
    const info = ROADMAP_DATA.companyInfo[company];
    if (!info) return res.status(404).json({ success: false, message: "Company info not found" });
    res.json({ success: true, companyPrep: info });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const addCertification = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    roadmap.certifications.push({ ...req.body, completed: false });
    await roadmap.save();
    res.json({ success: true, certifications: roadmap.certifications });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateCertification = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    const cert = roadmap.certifications.id(req.params.certId);
    if (!cert) return res.status(404).json({ success: false, message: "Certification not found" });
    Object.assign(cert, req.body);
    if (req.body.completed) cert.completedAt = new Date();
    await roadmap.save();
    res.json({ success: true, certifications: roadmap.certifications });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const exportRoadmap = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    const format = req.query.format || "json";
    const data = {
      title: roadmap.title, targetRole: roadmap.targetRole, progress: roadmap.progress,
      steps: roadmap.steps.map(s => ({ title: s.title, skills: s.skills, completed: s.completed })),
      skillGap: roadmap.skillGap,
      weeklyPlan: roadmap.weeklyPlan,
      jobMarket: roadmap.jobMarket,
    };

    roadmap.exportHistory.push({ format, exportedAt: new Date() });
    await roadmap.save();

    if (format === "json") return res.json({ success: true, export: data });
    if (format === "markdown") {
      const md = `# ${data.title}\n\n**Target:** ${data.targetRole} | **Progress:** ${data.progress}%\n\n## Steps\n\n${data.steps.map(s => `- [${s.completed ? "x" : " "}] **${s.title}** — ${s.skills.join(", ")}`).join("\n")}\n\n## Skill Gap\n\n**Known:** ${(data.skillGap?.known || []).join(", ")}\n**Missing:** ${(data.skillGap?.missing || []).join(", ")}`;
      res.setHeader("Content-Type", "text/markdown");
      return res.send(md);
    }
    res.json({ success: true, export: data });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const createNotification = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    roadmap.notifications.push({ type: req.body.type || "task", message: req.body.message, read: false });
    await roadmap.save();
    res.json({ success: true, notifications: roadmap.notifications });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    roadmap.notifications.forEach(n => n.read = true);
    await roadmap.save();
    res.json({ success: true, notifications: roadmap.notifications });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getAvailableRoles = async (req, res) => {
  const roles = Object.values(ROADMAP_DATA.roles).map(r => r.title);
  const companies = Object.keys(ROADMAP_DATA.companyInfo);
  const skills = [...new Set(Object.values(ROADMAP_DATA.skillMap).flat())].sort();
  res.json({ success: true, roles, companies, skills });
};

export const getResourcesBySkill = async (req, res) => {
  const { skill } = req.params;
  const resources = ROADMAP_DATA.resources[skill] || [];
  res.json({ success: true, resources });
};

export const getCatalog = async (req, res) => {
  try {
    const catalog = Object.entries(ROADMAP_DATA.roles).map(([key, role]) => {
      const steps = ROADMAP_DATA.roleRoadmaps[role.title] || [];
      const skillMap = ROADMAP_DATA.skillMap[key] || [];
      const jobMarket = ROADMAP_DATA.jobMarkets[role.title];
      const projectsCount = steps.reduce((sum, s) => {
        const projs = ROADMAP_DATA.roleRoadmaps[role.title] ? getProjects(s.skills).length : 0;
        return sum + projs;
      }, 0);
      return {
        id: key,
        title: role.title,
        category: role.category || "General",
        difficulty: role.difficulty,
        duration: role.duration,
        description: role.outcomes?.[0] || `Learn to become a ${role.title}`,
        skills: skillMap.slice(0, 8),
        modules: steps.length,
        projects: steps.reduce((sum, s) => sum + (s.skills?.length || 0), 0) || projectsCount,
        salary: jobMarket?.averageSalary ? `₹${(jobMarket.averageSalary / 100000).toFixed(0)}-${((jobMarket.averageSalary * 1.5) / 100000).toFixed(0)} LPA` : "N/A",
        demand: jobMarket?.demand || "medium",
        demandScore: jobMarket?.demand === "very high" ? 5 : jobMarket?.demand === "high" ? 4 : jobMarket?.demand === "medium" ? 3 : 2,
        outcomes: role.outcomes || [],
        trending: ["AI Engineer", "LLM Engineer", "AI Engineer 2026", "Generative AI Engineer", "Rust Developer", "Go Developer"].includes(role.title),
      };
    });
    const ai2026 = { ...AI_ENGINEER_2026_ROADMAP, id: "aiengineer2026", trending: true, demandScore: 5 };
    catalog.push(ai2026);
    catalog.sort((a, b) => b.demandScore - a.demandScore);
    res.json({ success: true, catalog });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const seedDefaultRoadmaps = async (req, res) => {
  try {
    const existing = await CareerRoadmap.find({ user: req.id, source: "default" });
    const existingTitles = new Set(existing.map(r => r.title));
    const defaults = Object.entries(ROADMAP_DATA.roles).map(([key, role]) => ({
      title: `Roadmap: ${role.title}`,
      category: role.category || "General",
      description: role.outcomes?.[0] || `Learn to become a ${role.title}`,
      targetRole: role.title,
      difficulty: role.difficulty,
      estimatedDuration: role.duration,
      skills: ROADMAP_DATA.skillMap[key]?.slice(0, 8) || [],
      modules: (ROADMAP_DATA.roleRoadmaps[role.title] || []).length,
      source: "default",
    }));
    const ai2026 = {
      title: "AI Engineer 2026 – Complete Learning Path",
      category: "Data & AI",
      description: AI_ENGINEER_2026_ROADMAP.description,
      targetRole: "AI Engineer 2026",
      difficulty: "advanced",
      estimatedDuration: "8-12 months",
      skills: ["Python", "PyTorch", "LLMs", "RAG", "AI Agents", "MCP", "Docker", "FastAPI"],
      modules: 20,
      source: "default",
    };
    defaults.push(ai2026);

    let created = 0;
    for (const d of defaults) {
      if (!existingTitles.has(d.title)) {
        const steps = generateRoadmapSteps(d.title.replace("Roadmap: ", ""));
        await CareerRoadmap.create({
          user: req.id,
          ...d,
          steps: steps.map((s, i) => ({ ...s, locked: i > 0 })),
          currentSkills: [],
          preferredTechStack: [],
          targetCompanies: [],
          weeklyStudyHours: 10,
          progress: 0,
          certifications: pick(ROADMAP_DATA.certifications, 3).map(c => ({ ...c, recommended: true })),
          jobMarket: normalizeJobMarket(ROADMAP_DATA.jobMarkets[d.targetRole] || { demand: "medium", averageSalary: 800000, hiringCompanies: [], growthRate: 10, competition: "medium", trendingSkills: [] }),
          aiMentorChat: [],
          notifications: [],
          weeklyPlan: generateWeeklyPlan(steps, 10),
          skillGap: getSkillGap([], Object.keys(ROADMAP_DATA.skillMap).find(k => ROADMAP_DATA.roles[k]?.title === d.targetRole) || Object.keys(ROADMAP_DATA.skillMap)[0]),
          status: "active",
          isFavorite: d.title.includes("AI Engineer 2026"),
        });
        created++;
      }
    }
    res.json({ success: true, message: `Created ${created} default roadmaps`, created });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: `Validation failed: ${error.message}`, allowedValues: { demand: ["low", "medium", "high", "very high"] } });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addSingleDefaultRoadmap = async (req, res) => {
  try {
    const { roleTitle } = req.body;
    if (!roleTitle) return res.status(400).json({ success: false, message: "Role title is required" });
    const normalizedRoleTitle = roleTitle.startsWith("AI Engineer 2026") ? "AI Engineer 2026" : roleTitle;
    const existingTitle = normalizedRoleTitle === "AI Engineer 2026" ? "AI Engineer 2026 – Complete Learning Path" : `Roadmap: ${normalizedRoleTitle}`;
    const existing = await CareerRoadmap.findOne({ user: req.id, title: existingTitle });
    if (existing) return res.json({ success: true, alreadyAdded: true, message: "Roadmap already added", roadmap: existing });
    let roleKey = Object.entries(ROADMAP_DATA.roles).find(([, v]) => v.title === normalizedRoleTitle)?.[0];
    let role = ROADMAP_DATA.roles[roleKey];
    let steps;
    let roadmapData;
    if (normalizedRoleTitle === "AI Engineer 2026") {
      steps = (AI_ENGINEER_2026_ROADMAP.steps || []).map(s => ({ ...s, resources: getResources(s.skills), projects: getProjects(s.skills), completed: false, locked: s.order > 1, timeSpent: 0 }));
      roadmapData = {
        title: "AI Engineer 2026 – Complete Learning Path",
        category: "Data & AI",
        description: AI_ENGINEER_2026_ROADMAP.description,
        targetRole: "AI Engineer 2026",
        difficulty: "advanced",
        estimatedDuration: "8-12 months",
        skills: ["Python", "PyTorch", "LLMs", "RAG", "AI Agents", "MCP"],
        modules: 20,
        isFavorite: true,
      };
    } else if (roleKey && role) {
      steps = generateRoadmapSteps(role.title);
      roadmapData = {
        title: `Roadmap: ${role.title}`,
        category: role.category || "General",
        description: role.outcomes?.[0] || `Learn to become a ${role.title}`,
        targetRole: role.title,
        difficulty: role.difficulty,
        estimatedDuration: role.duration,
        skills: ROADMAP_DATA.skillMap[roleKey]?.slice(0, 8) || [],
        modules: steps.length,
      };
    } else {
      return res.status(404).json({ success: false, message: `Role not found for "${roleTitle}". Ensure the catalog entry maps to a valid role title.` });
    }
    const roadmap = await CareerRoadmap.create({
      user: req.id, ...roadmapData, source: "default",
      steps: steps.map((s, i) => ({ ...s, locked: i > 0 })),
      currentSkills: [], preferredTechStack: [], targetCompanies: [],
      weeklyStudyHours: 10, progress: 0,
      certifications: pick(ROADMAP_DATA.certifications, 3).map(c => ({ ...c, recommended: true })),
      jobMarket: normalizeJobMarket(ROADMAP_DATA.jobMarkets[roleTitle] || { demand: "medium", averageSalary: 800000, hiringCompanies: [], growthRate: 10, competition: "medium", trendingSkills: [] }),
      aiMentorChat: [], notifications: [],
      weeklyPlan: generateWeeklyPlan(steps, 10),
      skillGap: roleKey ? getSkillGap([], roleKey) : { known: [], needsImprovement: [], missing: [], matchScore: 0, analysis: "Start your AI engineering journey!" },
      status: "active",
    });
    res.status(201).json({ success: true, roadmap });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: `Validation failed: ${error.message}`, allowedValues: { demand: ["low", "medium", "high", "very high"] } });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
