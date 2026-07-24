import { InterviewSession } from "../models_new/InterviewSession.js";
import { InterviewQuestion } from "../models_new/InterviewQuestion.js";
import { generateInterviewQuestions, evaluateInterviewAnswer } from "../services/aiService.js";

const categories = {
  frontend: ["React", "JavaScript", "CSS", "HTML", "TypeScript", "Web Performance"],
  backend: ["Node.js", "Python", "Java", "APIs", "Databases", "Authentication"],
  fullstack: ["React", "Node.js", "Databases", "DevOps", "System Design", "Testing"],
  "react": ["JSX", "Hooks", "State Management", "Performance", "Testing", "Routing"],
  "node": ["Express", "Async", "Streams", "Security", "Patterns", "Databases"],
  "java": ["OOP", "Collections", "Multithreading", "Spring", "JPA", "Microservices"],
  "python": ["Data Structures", "Decorators", "Generators", "Django", "FastAPI", "Testing"],
  "ai-engineer": ["ML", "Deep Learning", "NLP", "Computer Vision", "MLOps", "Transformers"],
};

export const getCategories = async (req, res) => {
  const cats = Object.entries(categories).map(([id, skills]) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1), skills }));
  res.json({ success: true, categories: cats });
};

export const startInterview = async (req, res) => {
  try {
    const { category, difficulty = "medium", timePerQuestion = 120, questionCount = 5 } = req.body;
    const cat = category?.toLowerCase();

    const aiQuestions = generateInterviewQuestions(cat, difficulty, questionCount);
    const answers = aiQuestions.map((q) => ({
      question: q.question,
      difficulty: q.difficulty,
      tags: q.tags || [],
      answer: "",
      score: 0,
      feedback: "",
      aiEvaluation: { clarity: 0, relevance: 0, completeness: 0, suggestion: "" },
    }));

    const session = await InterviewSession.create({
      user: req.id,
      category: cat,
      difficulty,
      questions: answers,
      maxScore: questionCount * 10,
      timePerQuestion,
      status: "in_progress",
    });

    const sessObj = session.toObject();
    sessObj.questions = sessObj.questions.map((q) => ({ question: q.question, difficulty: q.difficulty, tags: q.tags }));

    res.status(201).json({ success: true, session: { ...sessObj, questions: answers.map((q) => ({ question: q.question, difficulty: q.difficulty, tags: q.tags })) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { sessionId, questionIndex, answer } = req.body;
    const session = await InterviewSession.findOne({ _id: sessionId, user: req.id });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (questionIndex >= session.questions.length) return res.status(400).json({ success: false, message: "Invalid question index" });

    const q = session.questions[questionIndex];
    q.answer = answer;

    const evaluation = evaluateInterviewAnswer(q.question, answer, session.category);
    q.score = Math.round(evaluation.score / 10);
    q.feedback = evaluation.feedback;
    q.aiEvaluation = { clarity: evaluation.clarity, relevance: evaluation.relevance, completeness: evaluation.completeness, suggestion: evaluation.feedback };
    q.duration = req.body.duration || 0;

    session.totalScore = session.questions.reduce((sum, qq) => sum + (qq.score || 0), 0);

    const allAnswered = session.questions.every((qq) => qq.answer && qq.answer.length > 0);
    if (allAnswered) {
      session.status = "completed";
      session.completedAt = new Date();
    }
    await session.save();
    res.json({ success: true, session, currentScore: evaluation.score, evaluation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMySessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.id }).sort({ createdAt: -1 });
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, user: req.id });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
