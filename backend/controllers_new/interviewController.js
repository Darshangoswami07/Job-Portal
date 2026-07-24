import { InterviewSession } from "../models_new/InterviewSession.js";
import { generateInterviewQuestions, evaluateInterviewAnswer } from "../services/aiService.js";

const normalizeDifficulty = (d) => {
  if (!d) return "medium";
  const lower = d.toLowerCase();
  if (["easy", "medium", "hard"].includes(lower)) return lower;
  return "medium";
};

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
    const normalizedDifficulty = normalizeDifficulty(difficulty);

    const aiQuestions = generateInterviewQuestions(cat, normalizedDifficulty, questionCount);
    if (!aiQuestions || aiQuestions.length === 0) {
      return res.status(400).json({ success: false, message: "No questions could be generated for the selected category and difficulty." });
    }

    const answers = aiQuestions.map((q) => ({
      question: q.question,
      difficulty: q.difficulty || normalizedDifficulty,
      tags: q.tags || [],
      answer: "",
      score: 0,
      feedback: "",
      status: "unanswered",
      idealAnswer: "",
      professionalAnswer: "",
      shortAnswer: "",
      detailedAnswer: "",
      exampleCode: "",
      suggestions: [],
      strengths: [],
      evaluation: { technicalCorrectness: 0, communication: 0, completeness: 0, relevance: 0, confidence: 0, clarity: 0, grammar: 0, problemSolving: 0 },
    }));

    const session = await InterviewSession.create({
      user: req.id,
      category: cat,
      difficulty: normalizedDifficulty,
      questions: answers,
      maxScore: questionCount * 10,
      timePerQuestion,
      currentQuestionIndex: 0,
      status: "in_progress",
    });

    const sessObj = session.toObject();
    const firstQ = sessObj.questions[0];
    const nextQuestion = firstQ ? {
      _id: firstQ._id,
      question: firstQ.question,
      difficulty: firstQ.difficulty || normalizedDifficulty,
      tags: firstQ.tags || [],
    } : null;

    res.status(201).json({
      success: true,
      session: {
        _id: sessObj._id,
        category: sessObj.category,
        difficulty: sessObj.difficulty,
        timePerQuestion: sessObj.timePerQuestion,
        currentQuestionIndex: sessObj.currentQuestionIndex,
        status: sessObj.status,
        totalQuestions: sessObj.questions.length,
        questions: sessObj.questions.map((q) => ({
          _id: q._id,
          question: q.question,
          difficulty: q.difficulty,
          tags: q.tags,
        })),
      },
      currentQuestion: 1,
      totalQuestions: sessObj.questions.length,
      nextQuestion,
      completed: false,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function evaluateAllQuestions(session) {
  const tagScores = {};
  session.questions.forEach((qq) => {
    if (!qq.answer || qq.answer.length === 0) return;
    const evaluation = evaluateInterviewAnswer(qq.question, qq.answer, session.category);
    const normalizedScore = Math.min(10, Math.max(0, Math.round(evaluation.score / 10)));
    qq.score = normalizedScore;
    qq.feedback = evaluation.feedback;
    qq.status = evaluation.status;
    qq.idealAnswer = evaluation.idealAnswer || "";
    qq.professionalAnswer = evaluation.professionalAnswer || "";
    qq.shortAnswer = evaluation.shortAnswer || "";
    qq.detailedAnswer = evaluation.detailedAnswer || "";
    qq.exampleCode = evaluation.exampleCode || "";
    qq.suggestions = evaluation.suggestions || [];
    qq.strengths = evaluation.strengths || [];
    qq.evaluation = {
      technicalCorrectness: evaluation.technicalCorrectness || 0,
      communication: evaluation.communication || 0,
      completeness: evaluation.completeness || 0,
      relevance: evaluation.relevance || 0,
      confidence: evaluation.confidence || 0,
      clarity: evaluation.clarity || 0,
      grammar: evaluation.grammar || 0,
      problemSolving: evaluation.problemSolving || 0,
    };
    if (qq.tags) {
      qq.tags.forEach((tag) => {
        if (!tagScores[tag]) tagScores[tag] = { total: 0, count: 0 };
        tagScores[tag].total += qq.score || 0;
        tagScores[tag].count += 1;
      });
    }
  });

  session.totalScore = session.questions.reduce((sum, qq) => sum + (qq.score || 0), 0);
  session.correctCount = session.questions.filter((qq) => qq.status === "correct").length;
  session.partialCount = session.questions.filter((qq) => qq.status === "partial").length;
  session.incorrectCount = session.questions.filter((qq) => qq.status === "incorrect").length;
  session.unansweredCount = session.questions.filter((qq) => qq.status === "unanswered" || !qq.answer).length;

  const answered = session.questions.filter((qq) => qq.answer && qq.answer.length > 0);
  session.averageResponseTime = answered.length > 0
    ? Math.round(answered.reduce((s, qq) => s + (qq.duration || 0), 0) / answered.length) : 0;

  session.weakTopics = Object.entries(tagScores).filter(([, v]) => v.total / v.count < 5).map(([k]) => k);
  session.strongTopics = Object.entries(tagScores).filter(([, v]) => v.total / v.count >= 7).map(([k]) => k);
  session.status = "completed";
  session.completedAt = new Date();
  session.currentQuestionIndex = session.questions.length - 1;
}

export const submitAnswer = async (req, res) => {
  try {
    const { sessionId, questionIndex, answer, duration = 0 } = req.body;
    const session = await InterviewSession.findOne({ _id: sessionId, user: req.id });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (questionIndex >= session.questions.length) return res.status(400).json({ success: false, message: "Invalid question index" });

    const q = session.questions[questionIndex];
    if (!q.answer) q.answer = "";
    if (q.answer.length > 0) {
      return res.status(400).json({ success: false, message: "This question has already been answered" });
    }

    q.answer = answer || "";
    q.duration = duration || 0;

    const nextIndex = questionIndex + 1;
    const isLast = nextIndex >= session.questions.length;

    if (!isLast) {
      session.currentQuestionIndex = nextIndex;
      await session.save();

      const nextQ = session.questions[nextIndex];
      const nextQuestionPayload = nextQ ? {
        _id: nextQ._id,
        question: nextQ.question,
        difficulty: nextQ.difficulty,
        tags: nextQ.tags || [],
      } : null;

      return res.json({
        success: true,
        completed: false,
        currentQuestion: nextIndex + 1,
        totalQuestions: session.questions.length,
        remainingQuestions: Math.max(0, session.questions.length - nextIndex),
        nextQuestion: nextQuestionPayload,
      });
    }

    evaluateAllQuestions(session);
    await session.save();

    res.json({
      success: true,
      completed: true,
      sessionId: session._id,
      redirect: `/mock-interview/results/${session._id}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMySessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.id })
      .select("-questions.evaluation -questions.idealAnswer -questions.professionalAnswer -questions.detailedAnswer -questions.shortAnswer -questions.exampleCode -questions.suggestions -questions.strengths")
      .sort({ createdAt: -1 });
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

export const deleteSession = async (req, res) => {
  try {
    const session = await InterviewSession.findOneAndDelete({ _id: req.params.id, user: req.id });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    res.json({ success: true, message: "Session deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
