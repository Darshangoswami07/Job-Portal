import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  type: { type: String, enum: ["documentation", "video", "course", "book", "blog", "github", "practice", "article", "tutorial"], default: "documentation" },
  platform: String,
  duration: String,
  difficulty: String,
  isFree: { type: Boolean, default: true },
  rating: Number,
});

const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  estimatedTime: String,
  githubUrl: String,
  liveUrl: String,
  skills: [String],
  completed: { type: Boolean, default: false },
});

const stepSchema = new mongoose.Schema({
  order: Number,
  title: String,
  description: String,
  skills: [String],
  resources: [resourceSchema],
  projects: [projectSchema],
  completed: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  startedAt: Date,
  completedAt: Date,
  timeSpent: { type: Number, default: 0 },
  quizzes: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String,
  }],
  codingChallenges: [{
    title: String,
    description: String,
    difficulty: String,
    platformUrl: String,
    completed: { type: Boolean, default: false },
  }],
});

const weeklyTaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  completed: { type: Boolean, default: false },
  dayOfWeek: { type: Number, enum: [0, 1, 2, 3, 4, 5, 6] },
  estimatedHours: Number,
});

const weeklyPlanSchema = new mongoose.Schema({
  week: Number,
  title: String,
  tasks: [weeklyTaskSchema],
  completed: { type: Boolean, default: false },
});

const interviewRoundSchema = new mongoose.Schema({
  round: String,
  topics: [String],
  resources: [String],
  tips: [String],
  completed: { type: Boolean, default: false },
});

const careerRoadmapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  category: String,
  description: String,
  currentRole: String,
  targetRole: { type: String, required: true },
  yearsOfExperience: { type: Number, default: 0 },
  currentSkills: [String],
  missingSkills: [String],
  preferredTechStack: [String],
  education: String,
  certifications: [{
    name: String,
    provider: String,
    url: String,
    cost: String,
    duration: String,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    recommended: { type: Boolean, default: false },
  }],
  targetCompanies: [String],
  preferredCountry: { type: String, default: "India" },
  weeklyStudyHours: { type: Number, default: 10 },
  targetCompletionDate: Date,
  targetSalary: Number,
  interests: [String],
  steps: [stepSchema],
  weeklyPlan: [weeklyPlanSchema],
  skillGap: {
    known: [String],
    needsImprovement: [String],
    missing: [String],
    analysis: String,
    matchScore: { type: Number, default: 0 },
  },
  progress: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  hoursLearned: { type: Number, default: 0 },
  projectsCompleted: { type: Number, default: 0 },
  resumeAnalysis: {
    resumeText: String,
    skills: [String],
    projects: [String],
    experience: String,
    education: String,
    missingTechnologies: [String],
    recommendations: [String],
    analyzedAt: Date,
  },
  jobMarket: {
    demand: { type: String, enum: ["low", "medium", "high", "very high"], default: "medium" },
    averageSalary: Number,
    salaryCurrency: { type: String, default: "INR" },
    hiringCompanies: [String],
    growthRate: Number,
    competition: String,
    trendingSkills: [String],
    topLocations: [String],
    lastUpdated: Date,
  },
  companyPreparation: {
    companyName: String,
    overview: String,
    interviewRounds: [interviewRoundSchema],
    dsaTopics: [String],
    systemDesignTopics: [String],
    behavioralQuestions: [String],
    preparationResources: [String],
  },
  interviewPrep: {
    mockInterviewsCompleted: { type: Number, default: 0 },
    codingQuestionsSolved: { type: Number, default: 0 },
    behavioralQuestions: [String],
    systemDesignTopics: [String],
    readinessScore: { type: Number, default: 0 },
    lastPracticedAt: Date,
  },
  status: { type: String, enum: ["active", "archived", "completed", "draft"], default: "active" },
  isFavorite: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  estimatedDuration: String,
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
  source: { type: String, enum: ["template", "ai-generated", "resume", "company", "default"], default: "ai-generated" },
  aiMentorChat: [{
    question: String,
    answer: String,
    timestamp: { type: Date, default: Date.now },
  }],
  notifications: [{
    type: { type: String, enum: ["task", "milestone", "weekly", "resource", "trending"], default: "task" },
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  outcomes: [String],
  tags: [String],
  sharedWith: [String],
  exportHistory: [{
    format: { type: String, enum: ["pdf", "excel", "json", "markdown"] },
    exportedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

careerRoadmapSchema.index({ user: 1, status: 1 });
careerRoadmapSchema.index({ user: 1, createdAt: -1 });

export const CareerRoadmap = mongoose.model("CareerRoadmap", careerRoadmapSchema);
