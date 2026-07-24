import { CoverLetter } from "../models_new/CoverLetter.js";
import { generateCoverLetterContent } from "../services/aiService.js";

export const createCoverLetter = async (req, res) => {
  try {
    const letter = await CoverLetter.create({ ...req.body, user: req.id });
    res.status(201).json({ success: true, letter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyCoverLetters = async (req, res) => {
  try {
    const letters = await CoverLetter.find({ user: req.id }).sort({ createdAt: -1 });
    res.json({ success: true, letters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCoverLetterById = async (req, res) => {
  try {
    const letter = await CoverLetter.findOne({ _id: req.params.id, user: req.id });
    if (!letter) return res.status(404).json({ success: false, message: "Cover letter not found" });
    res.json({ success: true, letter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoverLetter = async (req, res) => {
  try {
    const letter = await CoverLetter.findOneAndUpdate(
      { _id: req.params.id, user: req.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!letter) return res.status(404).json({ success: false, message: "Cover letter not found" });
    res.json({ success: true, letter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCoverLetter = async (req, res) => {
  try {
    const letter = await CoverLetter.findOneAndDelete({ _id: req.params.id, user: req.id });
    if (!letter) return res.status(404).json({ success: false, message: "Cover letter not found" });
    res.json({ success: true, message: "Cover letter deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateCoverLetter = async (req, res) => {
  try {
    const { jobTitle, companyName, yourName, skills, experienceLevel, tone } = req.body;
    const result = generateCoverLetterContent({ jobTitle, companyName, yourName, skills, experienceLevel, tone });

    const letter = await CoverLetter.create({
      user: req.id,
      title: `Cover Letter - ${companyName || jobTitle || "Untitled"}`,
      content: result.content,
      jobTitle: jobTitle || "",
      companyName: companyName || "",
      yourName: yourName || "",
      isGenerated: true,
      tone: result.tone,
      experienceLevel: experienceLevel || "mid",
    });
    res.status(201).json({ success: true, letter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
