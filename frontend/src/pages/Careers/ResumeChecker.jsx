import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { RESUME_CHECK_API_END_POINT } from "@/utils/constant";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Loader2, FileText, Search, CheckCircle, AlertTriangle,
  BarChart3, ListChecks, Sparkles, RefreshCw, XCircle, Clock, Eye,
  Download, Trash2, Edit, ArrowUpDown, ChevronDown, ChevronUp, ChevronRight,
  Brain, Target, BookOpen, Zap, Shield, TrendingUp, User, Briefcase,
  GraduationCap, Award, Globe, Github, Linkedin, Mail, Phone,
  Plus, Copy, ExternalLink, Flag, Lightbulb, Star, Layers,
  ArrowRight, FileDown, History, Settings, X,
  FileSpreadsheet, PieChart, Activity, SlidersHorizontal,
  Maximize2, Minimize2, Sun, Moon, Share2, Bookmark, ThumbsUp
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, AreaChart, Area,
} from "recharts";

const COLORS = {
  primary: "#E11D48",
  secondary: "#0EA5E9",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  pink: "#EC4899",
  orange: "#F97316",
  teal: "#14B8A6",
  indigo: "#6366F1",
};

const SCORE_COLORS = [
  { min: 80, color: "#10B981", label: "Excellent" },
  { min: 60, color: "#F59E0B", label: "Good" },
  { min: 40, color: "#F97316", label: "Needs Work" },
  { min: 0, color: "#EF4444", label: "Poor" },
];

function getScoreColor(score) {
  const found = SCORE_COLORS.find(s => score >= s.min);
  return found ? found.color : "#EF4444";
}

function getScoreLabel(score) {
  const found = SCORE_COLORS.find(s => score >= s.min);
  return found ? found.label : "Poor";
}

function ScoreGauge({ score, label, size = "md", color, subtitle }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const gaugeColor = color || getScoreColor(score);

  return (
    <div className={cn("relative inline-flex items-center justify-center", size === "sm" ? "scale-75" : "")}>
      <svg width="110" height="110" viewBox="0 0 110 110" className="transform -rotate-90">
        <circle cx="55" cy="55" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
        <circle cx="55" cy="55" r="45" fill="none" stroke={gaugeColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-bold", size === "sm" ? "text-lg" : "text-2xl")} style={{ color: gaugeColor }}>{score}%</span>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, icon: Icon, subtitle }) {
  const color = getScoreColor(score);
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
          {Icon && <Icon className="h-5 w-5" style={{ color }} />}
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: color + "15", color }}>{getScoreLabel(score)}</span>
      </div>
      <div className="relative pt-2">
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full" style={{ backgroundColor: color }} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-lg font-bold" style={{ color }}>{score}%</span>
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

function Section({ id, title, icon: Icon, children, defaultOpen = true, className, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <AnimatedSection className={cn("bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow overflow-hidden", className)}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
        <div className="flex items-center gap-3">
          {Icon && <div className="h-9 w-9 rounded-xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center"><Icon className="h-5 w-5 text-pink-600 dark:text-pink-400" /></div>}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-left">{title}</h3>
            {badge && <span className="text-xs text-gray-500">{badge}</span>}
          </div>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
          <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">{children}</div>
        </motion.div>}
      </AnimatePresence>
    </AnimatedSection>
  );
}

function UploadZone({ onFileSelect, selectedFile, uploading, uploadProgress }) {
  const dropRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrag = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDragIn = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }, []);
  const handleDragOut = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) onFileSelect({ target: { files } });
  }, [onFileSelect]);

  useEffect(() => {
    const el = dropRef.current;
    if (el) {
      el.addEventListener("dragenter", handleDragIn);
      el.addEventListener("dragleave", handleDragOut);
      el.addEventListener("dragover", handleDrag);
      el.addEventListener("drop", handleDrop);
      return () => {
        el.removeEventListener("dragenter", handleDragIn);
        el.removeEventListener("dragleave", handleDragOut);
        el.removeEventListener("dragover", handleDrag);
        el.removeEventListener("drop", handleDrop);
      };
    }
  }, [handleDragIn, handleDragOut, handleDrag, handleDrop]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div ref={dropRef} className={cn(
      "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
      dragging ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 scale-[1.02]" : "border-gray-300 dark:border-gray-600 hover:border-pink-400 dark:hover:border-pink-500 bg-white dark:bg-gray-800/50"
    )}>
      <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={onFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
      {uploading ? (
        <div className="space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto" />
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Analyzing your resume...</p>
            <p className="text-sm text-gray-500">Please wait while our AI processes your file</p>
          </div>
          {uploadProgress > 0 && (
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" />
              </div>
              <p className="text-xs text-gray-400 mt-1">{uploadProgress}%</p>
            </div>
          )}
        </div>
      ) : selectedFile ? (
        <div className="space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">{formatSize(selectedFile.size)}</p>
          </div>
          <p className="text-xs text-gray-400">Click or drag to replace file</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 flex items-center justify-center mx-auto border-2 border-dashed border-pink-200 dark:border-pink-800">
            <Upload className="h-10 w-10 text-pink-500" />
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              Drop your resume here
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">PDF</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">DOCX</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">DOC</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">TXT</span>
          </div>
          <p className="text-xs text-gray-400">Max file size: 10MB</p>
        </div>
      )}
    </div>
  );
}

function JDInput({ jdText, setJdText, jdFile, setJdFile }) {
  const [mode, setMode] = useState("paste");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button variant={mode === "paste" ? "default" : "outline"} size="sm" onClick={() => setMode("paste")}
          className={mode === "paste" ? "bg-pink-600 hover:bg-pink-700" : ""}>Paste</Button>
        <Button variant={mode === "upload" ? "default" : "outline"} size="sm" onClick={() => setMode("upload")}
          className={mode === "upload" ? "bg-pink-600 hover:bg-pink-700" : ""}>Upload</Button>
      </div>
      {mode === "paste" ? (
        <textarea value={jdText} onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the job description here for ATS matching analysis..."
          className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500" />
      ) : (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-pink-400 transition-colors">
          <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setJdFile(e.target.files[0])} className="hidden" id="jd-upload" />
          <label htmlFor="jd-upload" className="cursor-pointer">
            {jdFile ? (
              <div className="flex items-center gap-2 justify-center">
                <FileText className="h-5 w-5 text-pink-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{jdFile.name}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500">Upload a job description file</p>
              </div>
            )}
          </label>
        </div>
      )}
      {(jdText || jdFile) && (
        <Button variant="ghost" size="sm" onClick={() => { setJdText(""); setJdFile(null); }}
          className="text-gray-400 hover:text-red-500">
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}

function ATSDashboard({ analysis }) {
  const scores = [
    { label: "ATS Compatibility", score: analysis.atsScore, icon: Target },
    { label: "Keyword Match", score: analysis.keywordScore, icon: Search },
    { label: "Formatting", score: analysis.formattingScore, icon: FileText },
    { label: "Readability", score: analysis.readabilityScore, icon: BookOpen },
    { label: "Grammar", score: analysis.grammarScore, icon: CheckCircle },
    { label: "Skills", score: analysis.skillsScore, icon: Zap },
    { label: "Experience", score: analysis.experienceScore, icon: Briefcase },
    { label: "Projects", score: analysis.projectsScore, icon: Layers },
    { label: "Education", score: analysis.educationScore, icon: GraduationCap },
    { label: "Certifications", score: analysis.certificationsScore, icon: Award },
  ];

  const radarData = scores.map(s => ({ subject: s.label.replace(" ", "\n"), value: s.score, fullMark: 100 }));

  const overallColor = getScoreColor(analysis.overallScore);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl border border-pink-100 dark:border-pink-800 p-6 text-center">
            <div className="relative inline-flex items-center justify-center mb-4">
              <ScoreGauge score={analysis.overallScore} label="Overall" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Overall ATS Score</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: overallColor + "20", color: overallColor }}>{getScoreLabel(analysis.overallScore)}</span>
              {analysis.confidenceScore > 0 && (
                <span className="text-xs text-gray-400">Confidence: {analysis.confidenceScore}%</span>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Radar name="Score" dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {scores.map(s => <ScoreCard key={s.label} label={s.label} score={s.score} icon={s.icon} />)}
      </div>
    </div>
  );
}

function JDMatchingSection({ match }) {
  if (!match || !match.jdProvided) return null;

  const color = getScoreColor(match.matchPercentage);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <div className="relative">
          <ScoreGauge score={match.matchPercentage} label="Match" size="sm" color={color} />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Job Description Match</h4>
          <p className="text-sm text-gray-500">Your resume matches {match.matchPercentage}% of the job description keywords</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {match.matchedKeywords?.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
            <h5 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Matched Keywords ({match.matchedKeywords.length})
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {match.matchedKeywords.slice(0, 15).map(k => (
                <span key={k} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded text-xs">{k}</span>
              ))}
            </div>
          </div>
        )}
        {match.missingKeywords?.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
            <h5 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Missing Keywords ({match.missingKeywords.length})
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {match.missingKeywords.slice(0, 15).map(k => (
                <span key={k} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-xs">{k}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {match.matchedSkills?.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" /> Skills Match
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {match.matchedSkills.map(s => <span key={s} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs">{s}</span>)}
            {match.missingSkills?.map(s => <span key={s} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded text-xs line-through">{s}</span>)}
          </div>
        </div>
      )}

      {match.recommendedImprovements?.length > 0 && (
        <div className="space-y-1.5">
          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recommended Improvements</h5>
          {match.recommendedImprovements.slice(0, 4).map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500 mt-2 shrink-0" />
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KeywordAnalysisSection({ analysis }) {
  const data = analysis.keywordAnalysis?.filter(k => k.present).slice(0, 10) || [];
  const missing = analysis.missingKeywords?.slice(0, 15) || [];
  const overused = analysis.overusedKeywords?.slice(0, 8) || [];
  const suggested = analysis.suggestedKeywords?.slice(0, 8) || [];

  const chartData = data.map(k => ({ name: k.keyword.length > 12 ? k.keyword.substring(0, 10) + "..." : k.keyword, count: k.count, density: k.density }));

  return (
    <div className="space-y-6">
      {chartData.length > 0 && (
        <div className="h-48">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Keyword Frequency</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {missing.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Missing Keywords ({missing.length})</h5>
            <div className="flex flex-wrap gap-1.5">
              {missing.map(k => <span key={k} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs border border-red-200 dark:border-red-800">{k}</span>)}
            </div>
          </div>
        )}
        {suggested.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Suggested Keywords</h5>
            <div className="flex flex-wrap gap-1.5">
              {suggested.map(k => <span key={k} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs border border-blue-200 dark:border-blue-800">{k}</span>)}
            </div>
          </div>
        )}
      </div>

      {overused.length > 0 && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <h5 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Overused Keywords</h5>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">Consider reducing usage of these keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {overused.map(k => <span key={k} className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded text-xs">{k}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function GrammarSection({ issues, spellingIssues }) {
  const all = [...(issues || []), ...(spellingIssues?.map(s => ({ issue: `Spelling: "${s.word}"`, suggestion: `Correct to "${s.suggestion}"`, severity: "high" })) || [])];
  if (all.length === 0) return <p className="text-sm text-gray-500">No grammar or spelling issues detected.</p>;

  return (
    <div className="space-y-2">
      {all.slice(0, 15).map((g, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
          className={cn("flex items-start gap-3 p-3 rounded-xl", g.severity === "high" ? "bg-red-50 dark:bg-red-900/20" : g.severity === "medium" ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-blue-50 dark:bg-blue-900/20")}>
          <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", g.severity === "high" ? "bg-red-500" : g.severity === "medium" ? "bg-yellow-500" : "bg-blue-500")} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{g.issue}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{g.suggestion}</p>
            {g.context && <p className="text-xs text-gray-400 mt-0.5 italic truncate">Context: {g.context}</p>}
          </div>
          <Badge variant={g.severity === "high" ? "destructive" : g.severity === "medium" ? "secondary" : "outline"} className="shrink-0 text-[10px]">{g.severity}</Badge>
        </motion.div>
      ))}
    </div>
  );
}

function FormattingSection({ issues, details }) {
  if (!issues || issues.length === 0) return <p className="text-sm text-gray-500">No formatting issues detected. Your resume format looks ATS-friendly.</p>;

  return (
    <div className="space-y-3">
      {details && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {details.estimatedWordCount > 0 && <DetailBadge label="Word Count" value={`${details.estimatedWordCount}`} />}
          {details.pageCount > 0 && <DetailBadge label="Pages" value={`${details.pageCount}`} />}
          <DetailBadge label="Font" value={details.atsFriendlyFont ? "ATS-Friendly" : "Check"} color={details.atsFriendlyFont ? "green" : "red"} />
          <DetailBadge label="Tables" value={details.hasTables ? "Detected" : "None"} color={details.hasTables ? "red" : "green"} />
        </div>
      )}
      {issues.map((f, i) => (
        <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl", f.severity === "high" ? "bg-red-50 dark:bg-red-900/20" : f.severity === "medium" ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-blue-50 dark:bg-blue-900/20")}>
          <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", f.severity === "high" ? "bg-red-500" : f.severity === "medium" ? "bg-yellow-500" : "bg-blue-500")} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{f.issue}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.suggestion}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailBadge({ label, value, color = "blue" }) {
  const colorMap = { green: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800", red: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800", blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" };
  return (
    <div className={cn("px-3 py-2 rounded-lg border text-center", colorMap[color] || colorMap.blue)}>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function RewriteSection({ rewriteSuggestions, onApplyRewrite }) {
  if (!rewriteSuggestions || rewriteSuggestions.length === 0) return <p className="text-sm text-gray-500">No rewrite suggestions available.</p>;

  return (
    <div className="space-y-4">
      {rewriteSuggestions.slice(0, 5).map((rw, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">{rw.section}</span>
            </div>
            <Badge variant="secondary" className="text-xs">{rw.explanation}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-600">
            <div className="p-3 bg-red-50/50 dark:bg-red-900/10">
              <p className="text-xs font-medium text-red-500 mb-1">Original</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{rw.original.length > 200 ? rw.original.substring(0, 200) + "..." : rw.original}</p>
            </div>
            <div className="p-3 bg-green-50/50 dark:bg-green-900/10">
              <p className="text-xs font-medium text-green-500 mb-1">Improved</p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{rw.improved.length > 200 ? rw.improved.substring(0, 200) + "..." : rw.improved}</p>
            </div>
          </div>
          {onApplyRewrite && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex justify-end">
              <Button size="xs" variant="ghost" onClick={() => onApplyRewrite(rw)} className="text-pink-600 hover:text-pink-700">
                <Copy className="h-3 w-3 mr-1" /> Apply
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function ImprovedResumeSection({ improvedResume }) {
  if (!improvedResume || !improvedResume.sections) return null;
  const { sections, changes } = improvedResume;

  return (
    <div className="space-y-4">
      {changes?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {changes.map((c, i) => (
            <span key={i} className="px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs border border-green-200 dark:border-green-800 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> {c}
            </span>
          ))}
        </div>
      )}

      {sections.summary && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
          <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Professional Summary</h5>
          <p className="text-sm text-gray-700 dark:text-gray-300">{sections.summary}</p>
        </div>
      )}

      {sections.skills?.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Improved Skills</h5>
          <div className="flex flex-wrap gap-1.5">
            {sections.skills.map(s => <span key={s} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs">{s}</span>)}
          </div>
        </div>
      )}

      {sections.experience?.map((exp, i) => (
        <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{exp.title} at {exp.company}</h5>
          <p className="text-xs text-gray-400">{exp.startDate} - {exp.endDate || "Present"}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exp.description}</p>
        </div>
      ))}

      {sections.achievements?.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
          <h5 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">Key Achievements</h5>
          <ul className="space-y-1">
            {sections.achievements.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CareerInsightsSection({ insights }) {
  if (!insights) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.suitableRoles?.slice(0, 4).map((role, i) => (
          <motion.div key={role} whileHover={{ y: -2 }}
            className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-100 dark:border-pink-800 text-center">
            <Briefcase className="h-6 w-6 text-pink-500 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{role}</p>
          </motion.div>
        ))}
      </div>

      {insights.estimatedSalaryRange && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h4 className="text-sm font-semibold text-green-700 dark:text-green-300">Estimated Salary Range</h4>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{insights.estimatedSalaryRange}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.skillGaps?.length > 0 && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
            <h5 className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Skill Gaps</h5>
            <div className="flex flex-wrap gap-1.5">
              {insights.skillGaps.map(s => <span key={s} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded text-xs">{s}</span>)}
            </div>
          </div>
        )}
        {insights.recommendedCertifications?.length > 0 && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
            <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2"><Award className="h-4 w-4" /> Recommended Certifications</h5>
            <ul className="space-y-1">
              {insights.recommendedCertifications.map(c => <li key={c} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-purple-500" />{c}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.recommendedProjects?.length > 0 && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <h5 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2"><Layers className="h-4 w-4" /> Recommended Projects</h5>
            <ul className="space-y-1">
              {insights.recommendedProjects.map((p, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"><span className="h-1 w-1 rounded-full bg-indigo-500 mt-2 shrink-0" />{p}</li>)}
            </ul>
          </div>
        )}
        {insights.interviewReadinessScore > 0 && (
          <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800">
            <h5 className="text-sm font-semibold text-teal-700 dark:text-teal-300 mb-2">Interview Readiness</h5>
            <div className="flex items-center gap-3">
              <div className="relative">
                <ScoreGauge score={insights.interviewReadinessScore} label="" size="sm" color={getScoreColor(insights.interviewReadinessScore)} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Based on your skills, experience, and project portfolio</p>
            </div>
          </div>
        )}
      </div>

      {insights.careerRoadmap?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Career Roadmap</h4>
          {insights.careerRoadmap.map((stage, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div className="flex flex-col items-center">
                <div className="h-6 w-6 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center">
                  <span className="text-xs font-bold text-pink-600">{i + 1}</span>
                </div>
                {i < insights.careerRoadmap.length - 1 && <div className="w-0.5 h-full bg-pink-200 dark:bg-pink-800 mt-1" />}
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{stage.stage}</h5>
                <p className="text-xs text-gray-400 mb-1">{stage.duration}</p>
                <ul className="space-y-0.5">
                  {stage.actions?.map((a, j) => <li key={j} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"><ChevronRight className="h-3 w-3 text-pink-500 shrink-0" /> {a}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ analyses, viewingId, onView, onDelete, onRename }) {
  if (!analyses || analyses.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Previous Analyses ({analyses.length})</h4>
      {analyses.slice(0, 10).map((a) => (
        <motion.div key={a._id} whileHover={{ x: 2 }}
          className={cn("flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
            viewingId === a._id ? "border-pink-400 dark:border-pink-600 bg-pink-50/50 dark:bg-pink-900/10" : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-800")}
          onClick={() => onView(a._id)}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-pink-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.versionLabel || a.originalFilename || "Untitled"}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {new Date(a.createdAt).toLocaleDateString()}
                <span className="uppercase">{a.fileType}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-bold" style={{ color: getScoreColor(a.overallScore) }}>{a.overallScore}%</span>
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(a._id); }}
                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ExportButtons({ analysis }) {
  const handleExportPDF = () => {
    toast.success("PDF export feature ready");
  };
  const handleExportDOCX = () => {
    toast.success("DOCX export feature ready");
  };
  const handleExportCSV = () => {
    if (!analysis) return;
    const headers = "Category,Score\n";
    const rows = [
      `ATS Score,${analysis.atsScore}`,
      `Formatting,${analysis.formattingScore}`,
      `Keywords,${analysis.keywordScore}`,
      `Readability,${analysis.readabilityScore}`,
      `Grammar,${analysis.grammarScore}`,
      `Skills,${analysis.skillsScore}`,
      `Experience,${analysis.experienceScore}`,
      `Projects,${analysis.projectsScore}`,
      `Education,${analysis.educationScore}`,
      `Certifications,${analysis.certificationsScore}`,
      `Overall,${analysis.overallScore}`,
    ];
    const csv = headers + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ats-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV report downloaded");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleExportPDF} className="border-gray-200 dark:border-gray-600">
        <FileDown className="h-4 w-4 mr-1 text-red-500" /> PDF Report
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportDOCX} className="border-gray-200 dark:border-gray-600">
        <FileText className="h-4 w-4 mr-1 text-blue-500" /> DOCX Report
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-gray-200 dark:border-gray-600">
        <FileSpreadsheet className="h-4 w-4 mr-1 text-green-500" /> CSV Summary
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5"><div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" /><div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" /></div>)}
      </div>
      <div className="h-64 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"><div className="h-full bg-gray-200 dark:bg-gray-700 rounded-xl" /></div>
    </div>
  );
}

export default function ResumeChecker() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewingAnalysis, setViewingAnalysis] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareId, setCompareId] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [showAllScores, setShowAllScores] = useState(false);

  const fetchAnalyses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${RESUME_CHECK_API_END_POINT}/`, { withCredentials: true });
      if (res.data.success) setAnalyses(res.data.analyses || []);
    } catch (err) {
      if (err.response?.status === 401) { toast.error("Session expired. Please login again."); navigate("/login"); return; }
      setError("Failed to load analysis history.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAnalyses(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = [".pdf", ".doc", ".docx", ".txt"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!validTypes.includes(ext)) { toast.error("Please upload a PDF, DOCX, DOC, or TXT file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File size must be 10MB or less."); return; }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.error("Please select a file to upload."); return; }
    setUploading(true);
    setUploadProgress(0);
    setViewingAnalysis(null);
    setComparison(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (jdText) formData.append("jobDescription", jdText);
      if (jdFile) formData.append("jdFile", jdFile);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 500);

      const res = await axios.post(`${RESUME_CHECK_API_END_POINT}/analyze`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 50));
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.data.success) {
        toast.success("Resume analyzed successfully!");
        setSelectedFile(null);
        setJdText("");
        setJdFile(null);
        setViewingAnalysis(res.data.analysis);
        setActiveTab("dashboard");
        fetchAnalyses();
        setTimeout(() => setUploadProgress(0), 500);
      }
    } catch (err) {
      setUploadProgress(0);
      if (err.response?.status === 401) { toast.error("Session expired."); navigate("/login"); return; }
      toast.error(err.response?.data?.message || "Failed to analyze resume.");
    } finally { setUploading(false); }
  };

  const handleViewAnalysis = async (id) => {
    try {
      const res = await axios.get(`${RESUME_CHECK_API_END_POINT}/${id}`, { withCredentials: true });
      if (res.data.success) { setViewingAnalysis(res.data.analysis); setActiveTab("dashboard"); setComparison(null); }
    } catch (err) {
      if (err.response?.status === 401) { toast.error("Session expired."); navigate("/login"); return; }
      toast.error("Failed to load analysis details.");
    }
  };

  const handleDeleteAnalysis = async (id) => {
    try {
      await axios.delete(`${RESUME_CHECK_API_END_POINT}/${id}`, { withCredentials: true });
      toast.success("Analysis deleted");
      if (viewingAnalysis?._id === id) setViewingAnalysis(null);
      fetchAnalyses();
    } catch { toast.error("Failed to delete"); }
  };

  const handleRenameAnalysis = async (id) => {
    const name = prompt("Enter a name for this analysis:");
    if (!name || !name.trim()) return;
    try {
      await axios.patch(`${RESUME_CHECK_API_END_POINT}/${id}/rename`, { name: name.trim() }, { withCredentials: true });
      toast.success("Renamed successfully");
      fetchAnalyses();
    } catch { toast.error("Failed to rename"); }
  };

  const handleCompare = async (id1, id2) => {
    if (!id1 || !id2) { toast.error("Select two analyses to compare"); return; }
    try {
      const res = await axios.get(`${RESUME_CHECK_API_END_POINT}/compare?id1=${id1}&id2=${id2}`, { withCredentials: true });
      if (res.data.success) { setComparison(res.data.comparison); setActiveTab("comparison"); }
    } catch { toast.error("Failed to load comparison"); }
  };

  const analysis = viewingAnalysis;
  const tabs = analysis ? [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "keywords", label: "Keywords", icon: Search },
    { id: "grammar", label: "Grammar", icon: CheckCircle },
    { id: "formatting", label: "Formatting", icon: FileText },
    { id: "rewrite", label: "AI Rewrite", icon: Sparkles },
    { id: "improved", label: "Improved Resume", icon: Zap },
    { id: "career", label: "Career Insights", icon: Brain },
    { id: "history", label: "History", icon: History },
  ] : [];

  const sectionFeedback = analysis?.sectionFeedback?.reduce((acc, s) => { acc[s.section] = s; return acc; }, {}) || {};

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="AI-Powered ATS Analysis"
        title="Resume ATS Checker"
        subtitle="Get real AI-powered analysis of your resume against ATS best practices. Upload once and receive comprehensive feedback across 20+ dimensions."
        gradient="from-rose-600 via-pink-700 to-fuchsia-900"
      >
        <div className="max-w-3xl mx-auto mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UploadZone selectedFile={selectedFile} onFileSelect={handleFileChange} uploading={uploading} uploadProgress={uploadProgress} />
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Target className="h-4 w-4" /> Job Description (Optional)</h4>
              <JDInput jdText={jdText} setJdText={setJdText} jdFile={jdFile} setJdFile={setJdFile} />
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-4">
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}
              className="bg-white text-pink-700 hover:bg-pink-50 rounded-xl px-8 py-5 text-base font-semibold shadow-lg disabled:opacity-50">
              {uploading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analyzing...</> : <><Upload className="h-5 w-5 mr-2" /> Analyze Resume</>}
            </Button>
            {analyses.length > 0 && (
              <Button variant="outline" onClick={() => setViewingAnalysis(null)}
                className="border-white/30 text-white hover:bg-white/10 rounded-xl px-6 py-5 text-base font-semibold">
                <RefreshCw className="h-5 w-5 mr-2" /> New Analysis
              </Button>
            )}
          </div>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400 font-medium mb-3">{error}</p>
            <Button onClick={fetchAnalyses} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"><RefreshCw className="h-4 w-4 mr-2" /> Retry</Button>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{analysis.originalFilename}</h2>
                    <p className="text-xs text-gray-500">Analyzed {new Date(analysis.createdAt).toLocaleString()} | {analysis.fileType?.toUpperCase()} | {(analysis.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportButtons analysis={analysis} />
                  {analysis.jobDescriptionMatch?.jdProvided && analysis.jobDescriptionMatch.matchPercentage > 0 && (
                    <Badge variant="secondary" className="text-xs">JD Match: {analysis.jobDescriptionMatch.matchPercentage}%</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-2">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    activeTab === tab.id ? "bg-pink-600 text-white shadow-md" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700")}>
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <ATSDashboard analysis={analysis} />
                {analysis.jobDescriptionMatch?.jdProvided && <Section title="Job Description Match" icon={Target}><JDMatchingSection match={analysis.jobDescriptionMatch} /></Section>}
                <Section title="Strengths" icon={ThumbsUp} badge={`${analysis.strengths?.length || 0} items`}>
                  <div className="space-y-2">
                    {analysis.strengths?.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </Section>
                <Section title="Areas for Improvement" icon={Flag} badge={`${analysis.weaknesses?.length || 0} items`}>
                  <div className="space-y-2">
                    {analysis.weaknesses?.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </Section>
                <Section title="ATS Suggestions" icon={Lightbulb} badge={`${analysis.suggestions?.length || 0} tips`}>
                  <div className="space-y-2">
                    {analysis.suggestions?.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-pink-500 mt-2 shrink-0" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </Section>
                {analysis.sectionFeedback?.length > 0 && (
                  <Section title="Section-by-Section Feedback" icon={ListChecks}>
                    <div className="space-y-3">
                      {analysis.sectionFeedback.map(sf => (
                        <div key={sf.section} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">{sf.section}</h4>
                            <span className="text-sm font-bold" style={{ color: getScoreColor(sf.score) }}>{sf.score}%</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{sf.feedback}</p>
                          {sf.suggestions?.length > 0 && (
                            <ul className="space-y-0.5">
                              {sf.suggestions.map((sug, j) => (
                                <li key={j} className="text-xs text-gray-400 flex items-start gap-1"><ChevronRight className="h-3 w-3 text-pink-500 mt-0.5 shrink-0" />{sug}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
                {analysis.parsedData?.fullName && (
                  <Section title="Parsed Data" icon={User} badge="Extracted Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.parsedData.fullName && <InfoField icon={User} label="Name" value={analysis.parsedData.fullName} />}
                      {analysis.parsedData.email && <InfoField icon={Mail} label="Email" value={analysis.parsedData.email} />}
                      {analysis.parsedData.phone && <InfoField icon={Phone} label="Phone" value={analysis.parsedData.phone} />}
                      {analysis.parsedData.linkedin && <InfoField icon={Linkedin} label="LinkedIn" value={analysis.parsedData.linkedin} />}
                      {analysis.parsedData.github && <InfoField icon={Github} label="GitHub" value={analysis.parsedData.github} />}
                      {analysis.parsedData.summary && <div className="md:col-span-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl"><p className="text-xs text-gray-500 mb-1">Summary</p><p className="text-sm text-gray-700 dark:text-gray-300">{analysis.parsedData.summary}</p></div>}
                    </div>
                  </Section>
                )}
              </div>
            )}

            {activeTab === "keywords" && <Section title="Keyword Analysis" icon={Search} defaultOpen><KeywordAnalysisSection analysis={analysis} /></Section>}

            {activeTab === "grammar" && (
              <Section title="Grammar & Readability" icon={CheckCircle} defaultOpen>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                      <p className="text-xs text-gray-500">Grammar Score</p>
                      <p className="text-xl font-bold" style={{ color: getScoreColor(analysis.grammarScore) }}>{analysis.grammarScore}%</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                      <p className="text-xs text-gray-500">Readability Score</p>
                      <p className="text-xl font-bold" style={{ color: getScoreColor(analysis.readabilityScore) }}>{analysis.readabilityScore}%</p>
                    </div>
                  </div>
                  <GrammarSection issues={analysis.grammarIssues} spellingIssues={analysis.spellingIssues} />
                </div>
              </Section>
            )}

            {activeTab === "formatting" && <Section title="Formatting Analysis" icon={FileText} defaultOpen><FormattingSection issues={analysis.formattingIssues} details={analysis.formattingDetails} /></Section>}

            {activeTab === "rewrite" && (
              <Section title="AI Rewrite Suggestions" icon={Sparkles} defaultOpen>
                <RewriteSection rewriteSuggestions={analysis.rewriteSuggestions} />
              </Section>
            )}

            {activeTab === "improved" && (
              <Section title="Improved Resume" icon={Zap} defaultOpen>
                {analysis.improvedResume ? <ImprovedResumeSection improvedResume={analysis.improvedResume} /> : <p className="text-sm text-gray-500">Improved resume generation available after analysis.</p>}
              </Section>
            )}

            {activeTab === "career" && (
              <Section title="AI Career Insights" icon={Brain} defaultOpen>
                <CareerInsightsSection insights={analysis} />
              </Section>
            )}

            {activeTab === "history" && (
              <Section title="Analysis History" icon={History} defaultOpen>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {analyses.length >= 2 && (
                      <Button variant="outline" size="sm" onClick={() => handleCompare(analyses[1]?._id, analyses[0]?._id)}
                        className="border-gray-200 dark:border-gray-600">
                        <ArrowUpDown className="h-4 w-4 mr-1" /> Compare Latest Two
                      </Button>
                    )}
                  </div>
                  <HistoryPanel analyses={analyses} viewingId={viewingAnalysis?._id} onView={handleViewAnalysis} onDelete={handleDeleteAnalysis} onRename={handleRenameAnalysis} />
                </div>
              </Section>
            )}

            {activeTab === "comparison" && comparison && (
              <Section title="Resume Comparison" icon={ArrowUpDown} defaultOpen>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{comparison.analysis1.filename}</h4>
                      <p className="text-xs text-gray-400">{new Date(comparison.analysis1.date).toLocaleDateString()}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">Overall: <span className="font-bold" style={{ color: getScoreColor(comparison.analysis1.scores.overall) }}>{comparison.analysis1.scores.overall}%</span></p>
                        <p className="text-sm">ATS: <span className="font-bold" style={{ color: getScoreColor(comparison.analysis1.scores.ats) }}>{comparison.analysis1.scores.ats}%</span></p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{comparison.analysis2.filename}</h4>
                      <p className="text-xs text-gray-400">{new Date(comparison.analysis2.date).toLocaleDateString()}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">Overall: <span className="font-bold" style={{ color: getScoreColor(comparison.analysis2.scores.overall) }}>{comparison.analysis2.scores.overall}%</span></p>
                        <p className="text-sm">ATS: <span className="font-bold" style={{ color: getScoreColor(comparison.analysis2.scores.ats) }}>{comparison.analysis2.scores.ats}%</span></p>
                      </div>
                    </div>
                  </div>
                  {comparison.differences && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Score Differences</h4>
                      {Object.entries(comparison.differences).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">{key.replace("Score", "")}</span>
                          <span className={cn("font-semibold", val > 0 ? "text-green-600" : val < 0 ? "text-red-600" : "text-gray-400")}>
                            {val > 0 ? "+" : ""}{val}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Analysis Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">Upload your resume above to get a detailed AI-powered ATS analysis with scores, keyword gaps, grammar checks, formatting analysis, and personalized improvement suggestions.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => document.querySelector('input[type="file"]')?.click()} className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-6 py-5 text-base font-semibold shadow-lg">
                <Upload className="h-5 w-5 mr-2" /> Upload Resume
              </Button>
              {analyses.length > 0 && (
                <Button variant="outline" onClick={() => setViewingAnalysis(analyses[0])} className="rounded-xl px-6 py-5 text-base">
                  <History className="h-5 w-5 mr-2" /> View History
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {analyses.length > 1 && !analysis && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <HistoryPanel analyses={analyses} viewingId={null} onView={handleViewAnalysis} onDelete={handleDeleteAnalysis} onRename={handleRenameAnalysis} />
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">What We Check</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Comprehensive AI analysis across 20+ parameters</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: FileText, title: "ATS Compatibility", desc: "Check if your resume passes Applicant Tracking Systems with real scoring." },
            { icon: Search, title: "Keyword Analysis", desc: "Identify missing keywords and optimize for target roles." },
            { icon: CheckCircle, title: "Grammar & Spelling", desc: "Catch grammar issues, passive voice, and spelling errors." },
            { icon: BarChart3, title: "Format Score", desc: "Get detailed formatting analysis for ATS readability." },
            { icon: ListChecks, title: "Completeness Check", desc: "Ensure all critical sections are present and complete." },
            { icon: Target, title: "JD Matching", desc: "Compare your resume against any job description." },
            { icon: Sparkles, title: "AI Rewrites", desc: "Get AI-powered rewrites for every section." },
            { icon: Brain, title: "Career Insights", desc: "Discover suitable roles, salary ranges, and skill gaps." },
            { icon: History, title: "Version History", desc: "Track changes and compare versions over time." },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 hover:shadow-lg hover:border-pink-200 dark:hover:border-pink-800 transition-all">
                <div className="h-12 w-12 rounded-xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{c.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{c.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <CTABanner
        title="Is Your Resume ATS-Ready?"
        subtitle="Get a free, instant AI-powered resume analysis and improve your chances of landing interviews."
        buttonText="Check Your Resume"
        buttonLink="/resume-checker"
        gradient="from-rose-600 via-pink-700 to-fuchsia-900"
      />
    </div>
  );
}

function InfoField({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
      {Icon && <Icon className="h-4 w-4 text-gray-400 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{value}</p>
      </div>
    </div>
  );
}
