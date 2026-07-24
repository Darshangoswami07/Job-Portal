import { Resume } from "../models_new/Resume.js";
import { generateResumeSuggestions, generateResumeContent } from "../services/aiService.js";

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
    const resumes = await Resume.find({ user: req.id }).sort({ createdAt: -1 });
    res.json({ success: true, resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.id });
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
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    res.json({ success: true, resume });
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
    const resume = await Resume.create(data);
    res.status(201).json({ success: true, resume });
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
    const { fullName, email, phone, location, headline, skills, experience, education, projects, certifications, languages, summary, website, linkedin, github, template } = req.body;

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
      skills: result.skills || skills || [],
      experience: result.experience || experience || [],
      education: result.education || education || [],
      projects: result.projects || projects || [],
      certifications: certifications || [],
      languages: languages || [],
      achievements: result.achievements || [],
      template: template || "modern",
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
    await resume.save();
    res.json({ success: true, atsScore: result.score.overall, score: result.score });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
