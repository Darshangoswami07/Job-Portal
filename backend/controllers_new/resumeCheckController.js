import { ResumeAnalysis } from "../models_new/ResumeAnalysis.js";

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Please upload a resume file" });

    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(req.file.mimetype)) return res.status(400).json({ success: false, message: "Only PDF and DOCX files are allowed" });

    const atsScore = Math.floor(Math.random() * 30) + 60;
    const formattingScore = Math.floor(Math.random() * 20) + 70;
    const keywordScore = Math.floor(Math.random() * 25) + 55;
    const overallScore = Math.round((atsScore + formattingScore + keywordScore) / 3);

    const missingKeywords = ["React", "TypeScript", "Node.js", "AWS", "Docker", "CI/CD", "Agile", "REST APIs", "GraphQL", "Testing"].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 4) + 3);
    const suggestions = [
      "Add a professional summary section at the top",
      "Quantify achievements with specific metrics",
      "Use action verbs to start each bullet point",
      "Tailor your resume for each job application",
      "Include relevant keywords from the job description",
      "Keep your resume to 1-2 pages maximum",
      "Add links to your portfolio and GitHub",
      "Include relevant certifications",
    ].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 3);

    const analysis = await ResumeAnalysis.create({
      user: req.id,
      originalFilename: req.file.originalname,
      fileUrl: req.file.path || "",
      fileType: req.file.mimetype.includes("pdf") ? "pdf" : "docx",
      fileSize: req.file.size,
      atsScore,
      formattingScore,
      keywordScore,
      overallScore,
      missingKeywords,
      suggestions,
      grammarIssues: [{ issue: "Consider using active voice", suggestion: "Replace passive phrases with active verbs", severity: "medium" }],
      strengths: ["Good use of bullet points", "Clear section headers", "Professional formatting"],
      weaknesses: ["Missing quantified achievements", "Could include more keywords", "Summary section could be stronger"],
    });
    res.status(201).json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyAnalyses = async (req, res) => {
  try {
    const analyses = await ResumeAnalysis.find({ user: req.id }).sort({ createdAt: -1 });
    res.json({ success: true, analyses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnalysisById = async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOne({ _id: req.params.id, user: req.id });
    if (!analysis) return res.status(404).json({ success: false, message: "Analysis not found" });
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
