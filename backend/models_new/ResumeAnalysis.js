import mongoose from "mongoose";

const grammarIssueSchema = new mongoose.Schema({
  issue: { type: String },
  suggestion: { type: String },
  severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  context: { type: String, default: "" },
}, { _id: false });

const formattingIssueSchema = new mongoose.Schema({
  issue: { type: String },
  suggestion: { type: String },
  severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  category: { type: String, default: "" },
}, { _id: false });

const keywordAnalysisSchema = new mongoose.Schema({
  keyword: { type: String },
  present: { type: Boolean, default: false },
  count: { type: Number, default: 0 },
  density: { type: Number, default: 0 },
  relevance: { type: Number, default: 0 },
  category: { type: String, default: "" },
}, { _id: false });

const matchedKeywordSchema = new mongoose.Schema({
  keyword: { type: String },
  count: { type: Number, default: 0 },
  category: { type: String, default: "" },
}, { _id: false });

const sectionFeedbackSchema = new mongoose.Schema({
  section: { type: String },
  score: { type: Number, default: 0 },
  feedback: { type: String },
  suggestions: [{ type: String }],
}, { _id: false });

const rewriteSuggestionSchema = new mongoose.Schema({
  section: { type: String },
  original: { type: String },
  improved: { type: String },
  explanation: { type: String },
}, { _id: false });

const careerInsightSchema = new mongoose.Schema({
  role: { type: String },
  matchPercentage: { type: Number },
  salaryRange: { type: String },
  skillGap: [{ type: String }],
  certifications: [{ type: String }],
  interviewReadiness: { type: Number },
}, { _id: false });

const resumeAnalysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalFilename: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  fileType: { type: String, enum: ["pdf", "docx", "doc", "txt"], default: "pdf" },
  fileSize: { type: Number, default: 0 },

  atsScore: { type: Number, default: 0 },
  formattingScore: { type: Number, default: 0 },
  keywordScore: { type: Number, default: 0 },
  overallScore: { type: Number, default: 0 },
  readabilityScore: { type: Number, default: 0 },
  grammarScore: { type: Number, default: 0 },
  skillsScore: { type: Number, default: 0 },
  experienceScore: { type: Number, default: 0 },
  projectsScore: { type: Number, default: 0 },
  educationScore: { type: Number, default: 0 },
  certificationsScore: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 0 },

  extractedText: { type: String, default: "" },
  parsedData: {
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    summary: { type: String, default: "" },
    skills: [{ type: String }],
    experience: [{
      company: { type: String },
      title: { type: String },
      location: { type: String },
      startDate: { type: String },
      endDate: { type: String },
      current: { type: Boolean },
      description: { type: String },
    }],
    education: [{
      institution: { type: String },
      degree: { type: String },
      field: { type: String },
      startDate: { type: String },
      endDate: { type: String },
      grade: { type: String },
    }],
    certifications: [{ name: { type: String }, issuer: { type: String }, date: { type: String } }],
    projects: [{ name: { type: String }, description: { type: String }, technologies: [{ type: String }], url: { type: String } }],
    achievements: [{ type: String }],
    languages: [{ type: String }],
    awards: [{ type: String }],
  },

  scoreConfidence: { type: Number, default: 85 },

  missingKeywords: [{ type: String }],
  matchedKeywords: [matchedKeywordSchema],
  keywordAnalysis: [keywordAnalysisSchema],
  keywordDensity: { type: Object, default: {} },
  overusedKeywords: [{ type: String }],
  suggestedKeywords: [{ type: String }],

  suggestions: [{ type: String }],
  sectionFeedback: [sectionFeedbackSchema],
  rewriteSuggestions: [rewriteSuggestionSchema],

  grammarIssues: [grammarIssueSchema],
  spellingIssues: [{ word: { type: String }, suggestion: { type: String }, context: { type: String } }],
  readabilityIssues: [{ issue: { type: String }, suggestion: { type: String }, severity: { type: String } }],
  passiveVoiceInstances: [{ sentence: { type: String }, suggestion: { type: String } }],

  formattingIssues: [formattingIssueSchema],
  formattingDetails: {
    hasImages: { type: Boolean },
    hasTables: { type: Boolean },
    hasColumns: { type: Boolean },
    hasIcons: { type: Boolean },
    fontType: { type: String },
    atsFriendlyFont: { type: Boolean },
    marginsOk: { type: Boolean },
    headingsOk: { type: Boolean },
    textAlignmentOk: { type: Boolean },
    sectionOrderOk: { type: Boolean },
    fileEncodingOk: { type: Boolean },
    pageCount: { type: Number },
    estimatedWordCount: { type: Number },
  },

  strengths: [{ type: String }],
  weaknesses: [{ type: String }],

  improvedResume: {
    content: { type: String },
    sections: { type: Object, default: {} },
    changes: [{ type: String }],
  },

  jobDescriptionMatch: {
    jdProvided: { type: Boolean },
    matchPercentage: { type: Number },
    matchedKeywords: [{ type: String }],
    missingKeywords: [{ type: String }],
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    missingExperience: [{ type: String }],
    recommendedImprovements: [{ type: String }],
  },

  careerInsights: [careerInsightSchema],
  suitableRoles: [{ type: String }],
  estimatedSalaryRange: { type: String },
  skillGaps: [{ type: String }],
  recommendedCertifications: [{ type: String }],
  recommendedProjects: [{ type: String }],
  interviewReadinessScore: { type: Number },
  careerRoadmap: [{ stage: { type: String }, duration: { type: String }, actions: [{ type: String }] }],

  reportPdfUrl: { type: String, default: "" },
  reportDocxUrl: { type: String, default: "" },
  versionLabel: { type: String, default: "" },
  isComparison: { type: Boolean, default: false },
  comparisonWithId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeAnalysis", default: null },
}, { timestamps: true });

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });

export const ResumeAnalysis = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
