import { ResumeTemplate } from "../models_new/ResumeTemplate.js";

export const getTemplates = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };
    if (category && category !== "All") query.category = category;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [templates, total] = await Promise.all([
      ResumeTemplate.find(query).sort({ downloads: -1, rating: -1 }).skip(skip).limit(Number(limit)),
      ResumeTemplate.countDocuments(query),
    ]);
    res.json({ success: true, templates, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await ResumeTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, template });
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
    const template = await ResumeTemplate.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
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
    const template = await ResumeTemplate.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplateCategories = async (req, res) => {
  try {
    const categories = await ResumeTemplate.distinct("category", { isActive: true });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
