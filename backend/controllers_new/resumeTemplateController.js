import { ResumeTemplate } from "../models_new/ResumeTemplate.js";

export const getTemplates = async (req, res) => {
  try {
    const { category, subcategory, search, tags, sort = "-popularity", page = 1, limit = 30 } = req.query;
    const query = { isActive: true };

    if (category && category !== "All") query.category = { $regex: `^${category}$`, $options: "i" };
    if (subcategory) query.subcategory = { $regex: subcategory, $options: "i" };
    if (tags) query.tags = { $in: tags.split(",") };

    if (search) {
      const esc = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: esc, $options: "i" } },
        { description: { $regex: esc, $options: "i" } },
        { category: { $regex: esc, $options: "i" } },
        { subcategory: { $regex: esc, $options: "i" } },
        { tags: { $regex: esc, $options: "i" } },
      ];
    }

    const sortOptions = {
      "-popularity": { popularity: -1 },
      "popularity": { popularity: 1 },
      "-downloads": { downloads: -1 },
      "downloads": { downloads: 1 },
      "-rating": { rating: -1 },
      "rating": { rating: 1 },
      "-atsScore": { atsScore: -1 },
      "name": { name: 1 },
      "-createdAt": { createdAt: -1 },
    };
    const sortObj = sortOptions[sort] || { popularity: -1, downloads: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [templates, total] = await Promise.all([
      ResumeTemplate.find(query).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
      ResumeTemplate.countDocuments(query),
    ]);

    res.json({
      success: true, templates, total,
      page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await ResumeTemplate.findById(req.params.id).lean();
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    const related = await ResumeTemplate.find({
      _id: { $ne: template._id },
      $or: [{ category: template.category }, { subcategory: template.subcategory }],
    }).sort({ popularity: -1 }).limit(4).select("name slug category previewSvg colors isPremium atsScore").lean();
    res.json({ success: true, template, relatedTemplates: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await ResumeTemplate.create(req.body);
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await ResumeTemplate.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    await ResumeTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Template deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const incrementTemplateDownloads = async (req, res) => {
  try {
    const template = await ResumeTemplate.findByIdAndUpdate(
      req.params.id, { $inc: { downloads: 1 } }, { new: true }
    );
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplateCategories = async (req, res) => {
  try {
    const categories = await ResumeTemplate.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 }, subcategories: { $addToSet: "$subcategory" } } },
      { $sort: { count: -1 } },
      { $project: { name: "$_id", count: 1, subcategories: 1, _id: 0 } },
    ]);
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedTemplates = async (req, res) => {
  try {
    const templates = await ResumeTemplate.find({ isActive: true })
      .sort({ popularity: -1, downloads: -1 })
      .limit(8)
      .lean();
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchTemplates = async (req, res) => {
  try {
    const { q = "" } = req.query;
    if (!q.trim()) {
      return res.json({ success: true, suggestions: [] });
    }
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const templates = await ResumeTemplate.find({
      isActive: true,
      $or: [
        { name: { $regex: esc, $options: "i" } },
        { category: { $regex: esc, $options: "i" } },
        { subcategory: { $regex: esc, $options: "i" } },
        { tags: { $regex: esc, $options: "i" } },
      ],
    }).select("name slug category subcategory atsScore isPremium previewSvg colors")
      .limit(10)
      .lean();
    res.json({ success: true, suggestions: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
