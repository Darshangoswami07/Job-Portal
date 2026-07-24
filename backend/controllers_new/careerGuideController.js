import { CareerGuide } from "../models_new/CareerGuide.js";

export const getGuides = async (req, res) => {
  try {
    const { category, search, level, page = 1, limit = 12 } = req.query;
    const query = { status: "published" };
    if (category && category !== "All") query.category = category;
    if (level) query.level = level;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [guides, total] = await Promise.all([
      CareerGuide.find(query).populate("author", "fullname email").sort({ featured: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      CareerGuide.countDocuments(query),
    ]);
    res.json({ success: true, guides, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGuideBySlug = async (req, res) => {
  try {
    const guide = await CareerGuide.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true }).populate("author", "fullname email");
    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
    res.json({ success: true, guide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGuide = async (req, res) => {
  try {
    const data = { ...req.body, author: req.id };
    data.slug = data.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
    const guide = await CareerGuide.create(data);
    res.status(201).json({ success: true, guide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGuide = async (req, res) => {
  try {
    const guide = await CareerGuide.findOneAndUpdate({ _id: req.params.id }, { $set: req.body }, { new: true });
    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
    res.json({ success: true, guide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGuide = async (req, res) => {
  try {
    await CareerGuide.findOneAndDelete({ _id: req.params.id });
    res.json({ success: true, message: "Guide deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleGuideBookmark = async (req, res) => {
  try {
    const guide = await CareerGuide.findById(req.params.id);
    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
    const idx = guide.bookmarks.indexOf(req.id);
    idx === -1 ? guide.bookmarks.push(req.id) : guide.bookmarks.splice(idx, 1);
    await guide.save();
    res.json({ success: true, bookmarks: guide.bookmarks, bookmarked: idx === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGuideCategories = async (req, res) => {
  try {
    const categories = await CareerGuide.distinct("category", { status: "published" });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
