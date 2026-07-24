import { CareerRoadmap } from "../models_new/CareerRoadmap.js";

const roadmapTemplates = {
  frontend: { title: "Frontend Developer Roadmap", steps: [
    { order: 1, title: "HTML & CSS", description: "Master the fundamentals of web structure and styling.", skills: ["HTML5", "CSS3", "Flexbox", "Grid"], resources: ["MDN Web Docs", "FreeCodeCamp"] },
    { order: 2, title: "JavaScript Fundamentals", description: "Learn core JavaScript concepts.", skills: ["ES6+", "DOM Manipulation", "Async JS"], resources: ["JavaScript.info", "You Don't Know JS"] },
    { order: 3, title: "Version Control", description: "Learn Git and collaborative development.", skills: ["Git", "GitHub", "Pull Requests"], resources: ["Git Handbook"] },
    { order: 4, title: "React Framework", description: "Build modern UIs with React.", skills: ["React", "Hooks", "State Management"], resources: ["React Docs", "Epic React"] },
    { order: 5, title: "TypeScript", description: "Add type safety to your applications.", skills: ["TypeScript", "Generics", "Types"], resources: ["TypeScript Handbook"] },
    { order: 6, title: "Advanced Topics", description: "Performance, testing, and architecture.", skills: ["Testing", "Performance", "System Design"], resources: ["Frontend Masters"] },
  ], duration: "12-18 months", difficulty: "beginner" },
  backend: { title: "Backend Developer Roadmap", steps: [
    { order: 1, title: "Programming Language", description: "Choose and master a backend language.", skills: ["Node.js", "Python", "Java"], resources: ["Node.js Docs", "Python.org"] },
    { order: 2, title: "Databases", description: "Learn SQL and NoSQL databases.", skills: ["PostgreSQL", "MongoDB", "Redis"], resources: ["Postgres Tutorial"] },
    { order: 3, title: "API Design", description: "Build RESTful and GraphQL APIs.", skills: ["REST", "GraphQL", "API Security"], resources: ["REST API Tutorial"] },
    { order: 4, title: "Authentication", description: "Implement secure authentication.", skills: ["JWT", "OAuth", "Session Management"], resources: ["JWT.io"] },
    { order: 5, title: "DevOps Basics", description: "Learn deployment and infrastructure.", skills: ["Docker", "CI/CD", "Cloud"], resources: ["Docker Docs"] },
    { order: 6, title: "System Design", description: "Design scalable backend systems.", skills: ["Microservices", "Caching", "Load Balancing"], resources: ["System Design Primer"] },
  ], duration: "12-18 months", difficulty: "beginner" },
  devops: { title: "DevOps Engineer Roadmap", steps: [
    { order: 1, title: "Linux Fundamentals", description: "Master Linux command line and scripting.", skills: ["Linux", "Bash", "Shell Scripting"], resources: ["Linux Journey"] },
    { order: 2, title: "Networking Basics", description: "Understand network protocols and security.", skills: ["TCP/IP", "DNS", "HTTP/HTTPS"], resources: ["Computer Networking Course"] },
    { order: 3, title: "CI/CD Pipelines", description: "Automate build and deployment.", skills: ["Jenkins", "GitHub Actions", "GitLab CI"], resources: ["GitHub Actions Docs"] },
    { order: 4, title: "Containerization", description: "Learn Docker and Kubernetes.", skills: ["Docker", "Kubernetes", "Helm"], resources: ["Kubernetes Docs"] },
    { order: 5, title: "Cloud Platforms", description: "Master cloud infrastructure.", skills: ["AWS", "GCP", "Azure"], resources: ["AWS Docs"] },
    { order: 6, title: "Monitoring & Logging", description: "Implement observability.", skills: ["Prometheus", "Grafana", "ELK Stack"], resources: ["Prometheus Docs"] },
  ], duration: "12-18 months", difficulty: "intermediate" },
  datascience: { title: "Data Scientist Roadmap", steps: [
    { order: 1, title: "Python & Statistics", description: "Learn Python and statistical analysis.", skills: ["Python", "NumPy", "Statistics"], resources: ["Python for Data Science"] },
    { order: 2, title: "Data Manipulation", description: "Work with data using Pandas.", skills: ["Pandas", "Data Cleaning", "Visualization"], resources: ["Pandas Docs"] },
    { order: 3, title: "Machine Learning", description: "Understand ML algorithms.", skills: ["Scikit-learn", "Regression", "Classification"], resources: ["Scikit-learn Docs"] },
    { order: 4, title: "Deep Learning", description: "Learn neural networks.", skills: ["TensorFlow", "PyTorch", "CNNs"], resources: ["Fast.ai"] },
    { order: 5, title: "MLOps", description: "Deploy and monitor ML models.", skills: ["MLflow", "Model Deployment", "A/B Testing"], resources: ["MLflow Docs"] },
    { order: 6, title: "Specialization", description: "NLP, Computer Vision, or Recommendation Systems.", skills: ["NLP", "CV", "Recommendation Systems"], resources: ["Hugging Face"] },
  ], duration: "12-24 months", difficulty: "intermediate" },
};

export const generateRoadmap = async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) return res.status(400).json({ success: false, message: "Category is required" });

    const template = roadmapTemplates[category.toLowerCase()];
    if (!template) return res.status(400).json({ success: false, message: "Invalid category. Use: frontend, backend, devops, or datascience" });

    const roadmap = await CareerRoadmap.create({
      user: req.id,
      title: template.title,
      category: category.toLowerCase(),
      description: `A comprehensive ${template.difficulty} roadmap to become a ${category} developer.`,
      steps: template.steps.map((s) => ({ ...s, completed: false })),
      estimatedDuration: template.duration,
      difficulty: template.difficulty,
      outcomes: [`Build production-ready ${category} applications`, `Understand ${category} best practices`, `Be job-ready for ${category} roles`],
    });
    res.status(201).json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyRoadmaps = async (req, res) => {
  try {
    const roadmaps = await CareerRoadmap.find({ user: req.id }).sort({ createdAt: -1 });
    res.json({ success: true, roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoadmapById = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    res.json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markStepComplete = async (req, res) => {
  try {
    const { stepIndex } = req.body;
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.id });
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found" });
    if (stepIndex >= roadmap.steps.length) return res.status(400).json({ success: false, message: "Invalid step index" });

    roadmap.steps[stepIndex].completed = !roadmap.steps[stepIndex].completed;
    const completed = roadmap.steps.filter((s) => s.completed).length;
    roadmap.progress = Math.round((completed / roadmap.steps.length) * 100);
    await roadmap.save();
    res.json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRoadmap = async (req, res) => {
  try {
    await CareerRoadmap.findOneAndDelete({ _id: req.params.id, user: req.id });
    res.json({ success: true, message: "Roadmap deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
