import { useState, useEffect } from "react";
import axios from "axios";
import { RESUME_CHECK_API_END_POINT } from "@/utils/constant";
import { motion } from "framer-motion";
import { Search, CheckCircle, AlertTriangle, FileText, BarChart3, ListChecks, Sparkles, RefreshCw, Upload, Loader2, XCircle, Clock, Eye } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const checks = [
  { icon: FileText, title: "ATS Compatibility", desc: "Check if your resume passes Applicant Tracking Systems." },
  { icon: Search, title: "Keyword Analysis", desc: "Identify missing keywords from target job descriptions." },
  { icon: CheckCircle, title: "Grammar & Spelling", desc: "Catch typos and grammar issues before recruiters do." },
  { icon: BarChart3, title: "Format Score", desc: "Get a score on layout, length, and visual appeal." },
  { icon: ListChecks, title: "Completeness Check", desc: "Ensure all critical sections are included and complete." },
  { icon: AlertTriangle, title: "Red Flag Detection", desc: "Identify potential issues that might hurt your chances." },
];

export default function ResumeChecker() {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewingAnalysis, setViewingAnalysis] = useState(null);

  const fetchAnalyses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${RESUME_CHECK_API_END_POINT}/`, { withCredentials: true });
      if (res.data.success) {
        setAnalyses(res.data.analyses || []);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      setError("Failed to load analysis history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await axios.post(`${RESUME_CHECK_API_END_POINT}/analyze`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        toast.success("Resume analyzed successfully!");
        setSelectedFile(null);
        setViewingAnalysis(res.data.analysis);
        fetchAnalyses();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      toast.error(err.response?.data?.message || "Failed to analyze resume. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleViewAnalysis = async (id) => {
    try {
      const res = await axios.get(`${RESUME_CHECK_API_END_POINT}/${id}`, { withCredentials: true });
      if (res.data.success) {
        setViewingAnalysis(res.data.analysis);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      toast.error("Failed to load analysis details.");
    }
  };

  const latestAnalysis = viewingAnalysis || analyses[0];

  const scoreCards = latestAnalysis
    ? [
        { label: "ATS Score", value: `${latestAnalysis.atsScore || 0}%`, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/30" },
        { label: "Format", value: `${latestAnalysis.formattingScore || 0}%`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30" },
        { label: "Keywords", value: `${latestAnalysis.keywordScore || 0}%`, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/30" },
        { label: "Overall", value: `${latestAnalysis.overallScore || 0}%`, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/30" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="Free Resume Analysis"
        title="Resume Checker"
        subtitle="Get instant feedback on your resume. Our AI analyzes your resume against industry standards and provides actionable improvements."
        gradient="from-rose-600 via-pink-700 to-fuchsia-900"
      >
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="text-sm text-white file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-pink-700 hover:file:bg-pink-50 cursor-pointer"
            />
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-white text-pink-700 hover:bg-pink-50 rounded-xl px-6 py-5 text-base font-semibold shadow-lg disabled:opacity-50"
            >
              {uploading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <><Upload className="h-5 w-5 mr-2" /> Upload</>
              )}
            </Button>
          </div>
          <Button variant="outline" onClick={() => setViewingAnalysis(null)} className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 py-5 text-base font-semibold">
            <RefreshCw className="h-5 w-5 mr-2" />
            Sample Report
          </Button>
        </div>
      </PageHero>

      {loading ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 text-center animate-pulse">
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
              </div>
            ))}
          </div>
        </section>
      ) : error ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400 font-medium mb-3">{error}</p>
            <Button onClick={fetchAnalyses} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        </section>
      ) : latestAnalysis ? (
        <>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {scoreCards.map((sc, i) => (
                <motion.div
                  key={sc.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 text-center"
                >
                  <p className={`text-3xl font-bold ${sc.color}`}>{sc.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sc.label}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {latestAnalysis.missingKeywords?.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {latestAnalysis.missingKeywords.map((kw) => (
                    <span key={kw} className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {latestAnalysis.suggestions?.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  Suggestions
                </h3>
                <ul className="space-y-2">
                  {latestAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {latestAnalysis.strengths?.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {latestAnalysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {latestAnalysis.weaknesses?.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Weaknesses
                </h3>
                <ul className="space-y-2">
                  {latestAnalysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {latestAnalysis.grammarIssues?.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Grammar Issues
                </h3>
                <div className="space-y-3">
                  {latestAnalysis.grammarIssues.map((g, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${g.severity === "high" ? "bg-red-500" : g.severity === "medium" ? "bg-yellow-500" : "bg-blue-500"}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{g.issue}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Suggestion: {g.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Analysis Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">Upload your resume above to get a detailed AI-powered analysis with scores, keyword gaps, and personalized suggestions.</p>
            <Button onClick={() => document.querySelector('input[type="file"]')?.click()} className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-6 py-5 text-base font-semibold shadow-lg">
              <Upload className="h-5 w-5 mr-2" />
              Upload Your Resume
            </Button>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">What We Check</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Comprehensive analysis across 20+ parameters</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checks.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 hover:shadow-lg hover:border-pink-200 dark:hover:border-pink-800 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{c.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{c.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {analyses.length > 1 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Past Analyses</h2>
            <p className="text-gray-500 dark:text-gray-400">View your previous resume analysis results</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.slice(0).reverse().map((a) => (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`bg-white dark:bg-gray-800 rounded-2xl border card-shadow p-5 cursor-pointer transition-all hover:shadow-md ${viewingAnalysis?._id === a._id ? "border-pink-400 dark:border-pink-600 ring-2 ring-pink-200 dark:ring-pink-800" : "border-gray-100 dark:border-gray-700"}`}
                onClick={() => handleViewAnalysis(a._id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{a.overallScore || 0}%</span>
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.originalFilename || "Resume"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400 uppercase">{a.fileType}</span>
                  <span className="flex items-center gap-1 text-xs text-pink-600 dark:text-pink-400 ml-auto">
                    <Eye className="h-3 w-3" /> View
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <CTABanner
        title="Is Your Resume Ready?"
        subtitle="Get a free, instant resume analysis and improve your chances of landing interviews."
        buttonText="Check Now"
        buttonLink="/signup"
        gradient="from-rose-600 via-pink-700 to-fuchsia-900"
      />
    </div>
  );
}
