import { InterviewQuestion } from "../models_new/InterviewQuestion.js";

export const getQuestions = async (req, res) => {
  try {
    const { category, difficulty, search, company, page = 1, limit = 12 } = req.query;
    const query = {};
    if (category) query.category = { $regex: category, $options: "i" };
    if (difficulty) query.difficulty = difficulty;
    if (company) query.company = { $regex: company, $options: "i" };
    if (search) query.question = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [questions, total] = await Promise.all([
      InterviewQuestion.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      InterviewQuestion.countDocuments(query),
    ]);
    res.json({ success: true, questions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const question = await InterviewQuestion.create(req.body);
    res.status(201).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleQuestionBookmark = async (req, res) => {
  try {
    const q = await InterviewQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found" });
    const idx = q.bookmarks.indexOf(req.id);
    idx === -1 ? q.bookmarks.push(req.id) : q.bookmarks.splice(idx, 1);
    await q.save();
    res.json({ success: true, bookmarks: q.bookmarks, bookmarked: idx === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
