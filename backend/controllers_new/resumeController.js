import { Resume } from "../models_new/Resume.js";
import { generateResumeSuggestions, generateResumeContent } from "../services/aiService.js";
import crypto from "crypto";

export const createResume = async (req, res) => {
  try {
    const resume = await Resume.create({ ...req.body, user: req.id });
    res.status(201).json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyResumes = async (req, res) => {
  try {
    const { status, favorite, page = 1, limit = 20 } = req.query;
    const query = { user: req.id };
    if (status) query.status = status;
    if (favorite === "true") query.isFavorite = true;
    const skip = (Number(page) - 1) * Number(limit);
    const [resumes, total] = await Promise.all([
      Resume.find(query).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Resume.countDocuments(query),
    ]);
    res.json({ success: true, resumes, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.id }).lean();
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.id },
      { $set: { ...req.body, lastAutoSaved: new Date() } },
      { new: true, runValidators: true }
    );
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const autoSaveResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.id },
      { $set: { ...req.body, lastAutoSaved: new Date() } },
      { new: true }
    );
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    res.json({ success: true, saved: true, lastAutoSaved: resume.lastAutoSaved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.id });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    res.json({ success: true, message: "Resume deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const duplicateResume = async (req, res) => {
  try {
    const original = await Resume.findOne({ _id: req.params.id, user: req.id });
    if (!original) return res.status(404).json({ success: false, message: "Resume not found" });
    const data = original.toObject();
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    data.title = `${data.title} (Copy)`;
    data.version = 1;
    data.isPublic = false;
    data.publicSlug = undefined;
    const resume = await Resume.create(data);
    res.status(201).json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.id });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    resume.isFavorite = !resume.isFavorite;
    await resume.save();
    res.json({ success: true, isFavorite: resume.isFavorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const togglePublic = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.id });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    resume.isPublic = !resume.isPublic;
    if (resume.isPublic && !resume.publicSlug) {
      resume.publicSlug = crypto.randomBytes(8).toString("hex");
    }
    await resume.save();
    res.json({ success: true, isPublic: resume.isPublic, publicSlug: resume.publicSlug });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ publicSlug: req.params.slug, isPublic: true }).lean();
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found or not public" });
    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResumeSuggestions = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.id });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    const result = generateResumeSuggestions(resume);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateResume = async (req, res) => {
  try {
    const { fullName, email, phone, location, headline, skills, experience, education, projects, certifications, languages, summary, website, linkedin, github, twitter, portfolio, template, templateId, sections } = req.body;

    const result = generateResumeContent({
      fullName, email, phone, location, headline, skills, experience, education,
      projects, certifications, languages, summary, website, linkedin, github, template,
    });

    const resume = await Resume.create({
      user: req.id,
      title: `${fullName || "Untitled"}'s Resume`,
      fullName: fullName || "",
      email: email || "",
      phone: phone || "",
      location: location || "",
      headline: headline || result.headline || "",
      summary: result.summary || summary || "",
      website: website || "",
      linkedin: linkedin || "",
      github: github || "",
      twitter: twitter || "",
      portfolio: portfolio || "",
      skills: result.skills || skills || [],
      experience: result.experience || experience || [],
      education: result.education || education || [],
      projects: result.projects || projects || [],
      certifications: certifications || [],
      languages: languages || [],
      achievements: result.achievements || [],
      template: template || "modern",
      templateId: templateId || null,
      sections: sections || [],
      isGenerated: true,
    });

    res.status(201).json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateResumeScore = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.id });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    const result = generateResumeSuggestions(resume);
    resume.atsScore = result.score.overall;
    resume.atsData = result.score;
    await resume.save();
    res.json({ success: true, atsScore: result.score.overall, score: result.score });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
