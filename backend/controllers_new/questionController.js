import { InterviewQuestion } from "../models_new/InterviewQuestion.js";

export const getQuestions = async (req, res) => {
  try {
    const {
      category, subcategory, difficulty, search, company, technology,
      role, experienceLevel, tags, sort = "-createdAt",
      page = 1, limit = 12, isPublished
    } = req.query;

    const query = {};

    if (category && category !== "All") query.category = { $regex: `^${category}$`, $options: "i" };
    if (subcategory) query.subcategory = { $regex: subcategory, $options: "i" };
    if (difficulty) query.difficulty = { $in: difficulty.split(",") };
    if (company) query.companies = { $in: company.split(",").map(c => new RegExp(c, "i")) };
    if (technology) query.technology = { $regex: technology, $options: "i" };
    if (role) query.role = { $regex: role, $options: "i" };
    if (experienceLevel) query.experienceLevel = { $in: experienceLevel.split(",") };
    if (tags) query.tags = { $in: tags.split(",") };
    if (isPublished !== undefined) query.isPublished = isPublished === "true";
    else query.isPublished = true;

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { question: { $regex: escaped, $options: "i" } },
        { answer: { $regex: escaped, $options: "i" } },
        { explanation: { $regex: escaped, $options: "i" } },
        { company: { $regex: escaped, $options: "i" } },
        { tags: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
        { subcategory: { $regex: escaped, $options: "i" } },
        { technology: { $regex: escaped, $options: "i" } },
      ];
    }

    const sortOptions = {
      "-createdAt": { createdAt: -1 },
      "createdAt": { createdAt: 1 },
      "-votes": { votes: -1 },
      "votes": { votes: 1 },
      "-popularity": { popularity: -1 },
      "popularity": { popularity: 1 },
      "-viewedCount": { viewedCount: -1 },
      "viewedCount": { viewedCount: 1 },
      "-difficulty": { difficulty: -1 },
      "difficulty": { difficulty: 1 },
    };
    const sortObj = sortOptions[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [questions, total] = await Promise.all([
      InterviewQuestion.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InterviewQuestion.countDocuments(query),
    ]);

    res.json({
      success: true,
      questions,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuestionById = async (req, res) => {
  try {
    const question = await InterviewQuestion.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewedCount: 1 } },
      { new: true }
    ).lean();

    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const related = await InterviewQuestion.find({
      _id: { $ne: question._id },
      $or: [
        { category: question.category },
        { tags: { $in: question.tags } },
        { difficulty: question.difficulty },
      ],
    })
      .sort({ popularity: -1 })
      .limit(5)
      .select("question difficulty category company popularity")
      .lean();

    res.json({ success: true, question, relatedQuestions: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const question = await InterviewQuestion.create({
      ...req.body,
      isPublished: true,
      source: "admin",
    });
    res.status(201).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const question = await InterviewQuestion.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const question = await InterviewQuestion.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    res.json({ success: true, message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const q = await InterviewQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found" });
    const idx = q.bookmarks.indexOf(req.id);
    if (idx === -1) {
      q.bookmarks.push(req.id);
    } else {
      q.bookmarks.splice(idx, 1);
    }
    await q.save();
    res.json({
      success: true,
      bookmarks: q.bookmarks,
      bookmarked: idx === -1,
      count: q.bookmarks.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const q = await InterviewQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: "Question not found" });
    const idx = q.likes.indexOf(req.id);
    if (idx === -1) {
      q.likes.push(req.id);
      q.votes = (q.votes || 0) + 1;
    } else {
      q.likes.splice(idx, 1);
      q.votes = Math.max(0, (q.votes || 0) - 1);
    }
    await q.save();
    res.json({ success: true, likes: q.likes, votes: q.votes, liked: idx === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkCreateQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "questions array required" });
    }
    const enriched = questions.map(q => ({ ...q, isPublished: true, source: "admin" }));
    const created = await InterviewQuestion.insertMany(enriched);
    res.status(201).json({ success: true, count: created.length, questions: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await InterviewQuestion.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { name: "$_id", count: 1, _id: 0 } },
    ]);
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompanies = async (req, res) => {
  try {
    const companies = await InterviewQuestion.aggregate([
      { $match: { isPublished: true } },
      { $unwind: "$companies" },
      { $group: { _id: "$companies", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { name: "$_id", count: 1, _id: 0 } },
    ]);
    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserBookmarks = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [questions, total] = await Promise.all([
      InterviewQuestion.find({ bookmarks: req.id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InterviewQuestion.countDocuments({ bookmarks: req.id }),
    ]);
    res.json({
      success: true,
      questions,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserProgress = async (req, res) => {
  try {
    const userId = req.id;
    const allQuestions = await InterviewQuestion.find({
      isPublished: true,
    }).select("category subcategory difficulty").lean();

    const bookmarked = await InterviewQuestion.find({
      bookmarks: userId,
    }).select("category subcategory difficulty").lean();

    const liked = await InterviewQuestion.find({
      likes: userId,
    }).select("category subcategory difficulty").lean();

    const total = allQuestions.length;
    const bookmarkedCount = bookmarked.length;
    const likedCount = liked.length;

    const categoryBreakdown = {};
    for (const q of allQuestions) {
      const cat = q.category || "Other";
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, bookmarked: 0, liked: 0 };
      categoryBreakdown[cat].total++;
    }
    for (const q of bookmarked) {
      const cat = q.category || "Other";
      if (categoryBreakdown[cat]) categoryBreakdown[cat].bookmarked++;
    }
    for (const q of liked) {
      const cat = q.category || "Other";
      if (categoryBreakdown[cat]) categoryBreakdown[cat].liked++;
    }

    res.json({
      success: true,
      progress: {
        totalQuestions: total,
        bookmarkedCount,
        likedCount,
        completionRate: total > 0 ? Math.round((bookmarkedCount / total) * 100) : 0,
        categoryBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordSolved = async (req, res) => {
  try {
    const q = await InterviewQuestion.findByIdAndUpdate(
      req.params.id,
      { $inc: { solvedCount: 1 } },
      { new: true }
    );
    if (!q) return res.status(404).json({ success: false, message: "Question not found" });
    res.json({ success: true, solvedCount: q.solvedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
