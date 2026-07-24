import { ResumeAnalysis } from "../models_new/ResumeAnalysis.js";
import {
  extractResumeData,
  calculateATSScore,
  analyzeGrammar,
  detectSpellingIssues,
  analyzeFormatting,
  analyzeKeywords,
  matchJobDescription,
  generateSectionFeedback,
  generateRewriteSuggestions,
  generateImprovedResume,
  generateCareerInsights,
} from "../services/aiService.js";

async function extractTextFromBuffer(buffer, mimetype, filename) {
  const fileInfo = `filename="${filename || "unknown"}", mimetype="${mimetype}", size=${buffer?.length || 0} bytes`;

  if (mimetype === "text/plain") {
    console.log(`[ResumeParser] Parsing TXT file: ${fileInfo}`);
    const text = buffer.toString("utf-8");
    console.log(`[ResumeParser] TXT extracted ${text.length} chars`);
    return text;
  }

  if (mimetype.includes("pdf")) {
    console.log(`[ResumeParser] Parsing PDF file: ${fileInfo}`);
    try {
      const mod = await import("pdf-parse");
      const PDFParse = mod.PDFParse;
      if (typeof PDFParse !== "function") {
        const errMsg = `pdf-parse export "PDFParse" is not a function. Available exports: ${Object.keys(mod).join(", ")}`;
        console.error(`[ResumeParser] ${errMsg}`);
        throw new Error(errMsg);
      }
      const uint8Array = new Uint8Array(buffer);
      const parser = new PDFParse({ data: uint8Array });
      const result = await parser.getText();
      const text = result?.text || "";
      console.log(`[ResumeParser] PDF extracted ${text.length} chars across ${result?.total || 0} pages`);
      return text;
    } catch (err) {
      console.error(`[ResumeParser] PDF parse FAILED for ${fileInfo}`);
      console.error(`[ResumeParser] Error name: ${err.name}`);
      console.error(`[ResumeParser] Error message: ${err.message}`);
      console.error(`[ResumeParser] Full stack trace:\n${err.stack}`);
      const isPassword = err.message?.toLowerCase().includes("password");
      const isCorrupted = err.message?.toLowerCase().includes("corrupt") || err.message?.toLowerCase().includes("invalid") || err.message?.toLowerCase().includes("format");
      const isEncrypted = err.message?.toLowerCase().includes("encrypt");
      const isProtected = isPassword || isEncrypted;

      if (isProtected) {
        throw new Error(`This PDF is password-protected or encrypted. Please upload an unprotected version. (Original error: ${err.message})`);
      }
      if (isCorrupted) {
        throw new Error(`The PDF file appears to be corrupted or invalid. Try re-exporting from your document editor as a clean PDF. (Original error: ${err.message})`);
      }
      const suggestion = buffer.length < 1000
        ? "The file appears to be empty or very small."
        : "This may be a scanned/image-based PDF. Try using a PDF with selectable text, or run OCR first.";
      throw new Error(`Failed to parse PDF: ${err.message}. ${suggestion}`);
    }
  }

  if (mimetype.includes("wordprocessingml") || mimetype.includes("docx") || mimetype === "application/msword" || mimetype === "application/doc") {
    console.log(`[ResumeParser] Parsing DOC/DOCX file: ${fileInfo}`);
    try {
      const mammoth = await import("mammoth");
      if (typeof mammoth.extractRawText !== "function") {
        const errMsg = `mammoth.extractRawText is not a function. Available exports: ${Object.keys(mammoth).join(", ")}`;
        console.error(`[ResumeParser] ${errMsg}`);
        throw new Error(errMsg);
      }
      const result = await mammoth.extractRawText({ buffer });
      const text = result?.value || "";
      const warnings = result?.messages?.filter(m => m.type === "warning") || [];
      if (warnings.length > 0) {
        console.warn(`[ResumeParser] DOCX warnings: ${warnings.map(w => w.message).join("; ")}`);
      }
      console.log(`[ResumeParser] DOCX extracted ${text.length} chars`);
      return text;
    } catch (err) {
      console.error(`[ResumeParser] DOCX parse FAILED for ${fileInfo}`);
      console.error(`[ResumeParser] Error name: ${err.name}`);
      console.error(`[ResumeParser] Error message: ${err.message}`);
      console.error(`[ResumeParser] Full stack trace:\n${err.stack}`);
      if (err.message?.includes("Corrupted zip") || err.message?.includes("End of data")) {
        throw new Error(`The DOCX file appears to be corrupted or is not a valid Word document. Try re-saving the file from Word. (Original error: ${err.message})`);
      }
      throw new Error(`Failed to parse DOCX: ${err.message}. Please ensure the file is a valid Word document and try again.`);
    }
  }

  const unsupportedMsg = `Unsupported file type "${mimetype}" for file "${filename}". Only PDF, DOCX, DOC, and TXT files are supported.`;
  console.error(`[ResumeParser] ${unsupportedMsg}`);
  throw new Error(unsupportedMsg);
}

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a resume file" });
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only PDF, DOCX, DOC, and TXT files are supported. Please upload a valid resume file.",
      });
    }

    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: "File size must be 10MB or less." });
    }

    console.log(`[ResumeCheck] Processing upload: filename="${req.file.originalname}", mimetype="${req.file.mimetype}", size=${req.file.size} bytes, buffer=${req.file.buffer?.length || 0} bytes`);

    let extractedText = "";
    try {
      extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    } catch (parseErr) {
      console.error(`[ResumeCheck] Parse FAILED for "${req.file.originalname}": ${parseErr.message}`);
      return res.status(400).json({ success: false, message: parseErr.message });
    }

    const extractedLength = extractedText?.trim().length || 0;
    console.log(`[ResumeCheck] Extracted ${extractedLength} chars from "${req.file.originalname}"`);

    if (extractedLength < 20) {
      const detail = extractedLength === 0
        ? "No text could be extracted."
        : `Only ${extractedLength} characters extracted.`;
      const hint = req.file.mimetype.includes("pdf")
        ? "This PDF may be a scanned image (no selectable text). Try uploading a PDF with selectable text or a DOCX file."
        : "The file may be empty or contain only images.";
      console.error(`[ResumeCheck] Extraction too short for "${req.file.originalname}": ${detail}`);
      return res.status(400).json({
        success: false,
        message: `Could not extract enough text from the resume. ${detail} ${hint}`,
      });
    }

    const parsedData = extractResumeData(extractedText);

    let jdText = req.body.jobDescription || "";
    if (!jdText && Array.isArray(req.files)) {
      const jdFile = req.files.find(f => f.fieldname === "jdFile");
      if (jdFile) {
        console.log(`[ResumeCheck] Parsing JD file: "${jdFile.originalname}", mimetype="${jdFile.mimetype}", size=${jdFile.size} bytes`);
        try {
          jdText = await extractTextFromBuffer(jdFile.buffer, jdFile.mimetype, jdFile.originalname);
          console.log(`[ResumeCheck] JD file extracted ${jdText.length} chars`);
        } catch (e) {
          console.warn(`[ResumeCheck] Failed to parse JD file "${jdFile.originalname}": ${e.message}`);
          jdText = "";
        }
      }
    }
    const { scores, details } = calculateATSScore(parsedData, extractedText, jdText);

    const grammarIssues = analyzeGrammar(extractedText);
    const spellingIssues = detectSpellingIssues(extractedText);
    const { issues: formattingIssues, details: formattingDetails } = analyzeFormatting(extractedText, parsedData);
    const {
      keywordAnalysis,
      missingKeywords,
      matchedKeywords,
      overusedKeywords,
      suggestedKeywords,
      keywordDensity,
    } = analyzeKeywords(parsedData, extractedText, jdText);

    const jdMatch = matchJobDescription(parsedData, extractedText, jdText);
    const sectionFeedback = generateSectionFeedback(parsedData, extractedText);
    const rewriteSuggestions = generateRewriteSuggestions(parsedData, extractedText);
    const improvedResume = generateImprovedResume(parsedData, extractedText);
    const careerInsights = generateCareerInsights(parsedData);

    const strengths = [];
    if (details.hasContactInfo) strengths.push("Contact information is complete");
    if (details.hasSections) strengths.push("All critical sections are present");
    if (details.hasQuantifiedAchievements) strengths.push("Uses quantified achievements to demonstrate impact");
    if (details.hasActionVerbs) strengths.push("Uses strong action verbs throughout");
    if (details.totalSkills >= 8) strengths.push(`Comprehensive skills section with ${details.totalSkills} skills`);
    if (details.sectionCount >= 5) strengths.push("Well-structured with clear section organization");
    if (details.experienceYears >= 3) strengths.push(`Strong experience track record (${details.experienceYears}+ years)`);
    if (parsedData.projects.length >= 2) strengths.push("Includes relevant project experience");
    if (parsedData.education.length > 0) strengths.push("Educational background is documented");
    if (extractedText && extractedText.split(/\s+/).length >= 300 && extractedText.split(/\s+/).length <= 800) strengths.push("Resume length is appropriate for ATS parsing");
    if (strengths.length === 0) strengths.push("Resume has basic structure");

    const weaknesses = [];
    if (!parsedData.email) weaknesses.push("Email address not found");
    if (!parsedData.phone) weaknesses.push("Phone number not found");
    if (!parsedData.summary || parsedData.summary.length < 50) weaknesses.push("Professional summary is missing or too brief");
    if (parsedData.skills.length < 5) weaknesses.push(`Only ${parsedData.skills.length} skills listed, consider adding more`);
    if (!details.hasQuantifiedAchievements) weaknesses.push("Missing quantified achievements - add metrics and numbers");
    if (!details.hasActionVerbs) weaknesses.push("Use more strong action verbs at the start of bullet points");
    if (parsedData.certifications.length === 0 && parsedData.experience.length > 2) weaknesses.push("No certifications listed - consider adding industry certifications");
    if (parsedData.languages.length === 0) weaknesses.push("Languages section not included");
    if (details.experienceYears < 2 && parsedData.experience.length > 0) weaknesses.push("Limited work experience - consider adding internships and projects");
    if (grammarIssues.length > 3) weaknesses.push(`${grammarIssues.length} grammar issues detected - review and fix them`);
    if (weaknesses.length === 0) weaknesses.push("Minor improvements could further optimize for ATS");

    const allSuggestions = [];
    if (!parsedData.summary || parsedData.summary.length < 50) allSuggestions.push("Add a compelling 2-3 sentence professional summary at the top");
    if (!details.hasActionVerbs) allSuggestions.push("Start every bullet point with a strong action verb");
    if (!details.hasQuantifiedAchievements) allSuggestions.push("Quantify achievements with specific numbers, percentages, and dollar amounts");
    if (parsedData.skills.length < 8) allSuggestions.push("Expand your skills section to include 10-15 relevant technologies");
    if (missingKeywords.length > 0) allSuggestions.push(`Add in-demand keywords: ${missingKeywords.slice(0, 5).join(", ")}`);
    if (jdText && jdMatch.matchPercentage < 60) allSuggestions.push("Tailor your resume to match the job description keywords more closely");
    allSuggestions.push("Use a clean, ATS-friendly format without tables or columns");
    allSuggestions.push("Include LinkedIn profile and portfolio/GitHub links");
    if (allSuggestions.length > 6) allSuggestions.length = 6;

    const analysis = await ResumeAnalysis.create({
      user: req.id,
      originalFilename: req.file.originalname,
      fileUrl: "",
      fileType: req.file.mimetype.includes("pdf") ? "pdf" : req.file.mimetype.includes("wordprocessing") ? "docx" : req.file.mimetype === "application/msword" ? "doc" : "txt",
      fileSize: req.file.size,
      atsScore: scores.atsScore,
      formattingScore: scores.formattingScore,
      keywordScore: scores.keywordScore,
      overallScore: scores.overallScore,
      readabilityScore: scores.readabilityScore,
      grammarScore: scores.grammarScore,
      skillsScore: scores.skillsScore,
      experienceScore: scores.experienceScore,
      projectsScore: scores.projectsScore,
      educationScore: scores.educationScore,
      certificationsScore: scores.certificationsScore,
      confidenceScore: scores.confidenceScore,
      extractedText,
      parsedData,
      scoreConfidence: scores.confidenceScore,
      missingKeywords: missingKeywords.slice(0, 20),
      matchedKeywords: matchedKeywords.slice(0, 30),
      keywordAnalysis: keywordAnalysis.sort((a, b) => b.density - a.density).slice(0, 50),
      keywordDensity,
      overusedKeywords: overusedKeywords.slice(0, 10),
      suggestedKeywords: suggestedKeywords.slice(0, 10),
      suggestions: allSuggestions,
      sectionFeedback,
      rewriteSuggestions,
      grammarIssues,
      spellingIssues: spellingIssues.slice(0, 20),
      formattingIssues,
      formattingDetails,
      strengths,
      weaknesses,
      improvedResume: {
        content: "",
        sections: improvedResume.sections,
        changes: improvedResume.changes,
      },
      jobDescriptionMatch: jdMatch,
      careerInsights: careerInsights.careerInsights,
      suitableRoles: careerInsights.suitableRoles,
      estimatedSalaryRange: careerInsights.estimatedSalaryRange,
      skillGaps: careerInsights.skillGaps.slice(0, 8),
      recommendedCertifications: careerInsights.recommendedCertifications,
      recommendedProjects: careerInsights.recommendedProjects,
      interviewReadinessScore: careerInsights.interviewReadinessScore,
      careerRoadmap: careerInsights.careerRoadmap,
    });

    res.status(201).json({ success: true, analysis });
  } catch (error) {
    console.error("Resume analysis error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred during resume analysis. Please try again.",
    });
  }
};

export const getMyAnalyses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      ResumeAnalysis.find({ user: req.id })
        .select("-extractedText -keywordAnalysis -grammarIssues -spellingIssues -formattingIssues")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ResumeAnalysis.countDocuments({ user: req.id }),
    ]);

    res.json({
      success: true,
      analyses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnalysisById = async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOne({ _id: req.params.id, user: req.id });
    if (!analysis) {
      return res.status(404).json({ success: false, message: "Analysis not found. It may have been deleted or you may not have permission to view it." });
    }
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAnalysis = async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOneAndDelete({ _id: req.params.id, user: req.id });
    if (!analysis) {
      return res.status(404).json({ success: false, message: "Analysis not found." });
    }
    res.json({ success: true, message: "Analysis deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const renameAnalysis = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Please provide a valid name." });
    }
    const analysis = await ResumeAnalysis.findOneAndUpdate(
      { _id: req.params.id, user: req.id },
      { versionLabel: name.trim() },
      { new: true }
    );
    if (!analysis) {
      return res.status(404).json({ success: false, message: "Analysis not found." });
    }
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getComparison = async (req, res) => {
  try {
    const { id1, id2 } = req.query;
    if (!id1 || !id2) {
      return res.status(400).json({ success: false, message: "Please provide two analysis IDs to compare." });
    }

    const [analysis1, analysis2] = await Promise.all([
      ResumeAnalysis.findOne({ _id: id1, user: req.id }),
      ResumeAnalysis.findOne({ _id: id2, user: req.id }),
    ]);

    if (!analysis1 || !analysis2) {
      return res.status(404).json({ success: false, message: "One or both analyses not found." });
    }

    const comparison = {
      analysis1: { id: analysis1._id, filename: analysis1.originalFilename, date: analysis1.createdAt, scores: getScoreSummary(analysis1), strengths: analysis1.strengths, weaknesses: analysis1.weaknesses, missingKeywords: analysis1.missingKeywords },
      analysis2: { id: analysis2._id, filename: analysis2.originalFilename, date: analysis2.createdAt, scores: getScoreSummary(analysis2), strengths: analysis2.strengths, weaknesses: analysis2.weaknesses, missingKeywords: analysis2.missingKeywords },
      differences: {
        atsScore: analysis2.atsScore - analysis1.atsScore,
        overallScore: analysis2.overallScore - analysis1.overallScore,
        keywordScore: analysis2.keywordScore - analysis1.keywordScore,
        formattingScore: analysis2.formattingScore - analysis1.formattingScore,
        readabilityScore: analysis2.readabilityScore - analysis1.readabilityScore,
      },
    };

    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function getScoreSummary(analysis) {
  return {
    ats: analysis.atsScore,
    overall: analysis.overallScore,
    keyword: analysis.keywordScore,
    formatting: analysis.formattingScore,
    readability: analysis.readabilityScore,
    grammar: analysis.grammarScore,
    skills: analysis.skillsScore,
    experience: analysis.experienceScore,
    projects: analysis.projectsScore,
    education: analysis.educationScore,
    certifications: analysis.certificationsScore,
  };
}
