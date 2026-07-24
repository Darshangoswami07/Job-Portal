import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { COVER_LETTER_API_END_POINT } from "@/utils/constant";
import jsPDF from "jspdf";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileEdit, Wand2, Loader2, AlertCircle, Inbox, Trash2, Download,
  Copy, Plus, ArrowLeft, Sparkles, Briefcase, Eye, Settings2,
  ChevronDown, Tag, PenLine
} from "lucide-react";

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
    </div>
  );
}

const toneOptions = [
  { value: "formal", label: "Formal" },
  { value: "conversational", label: "Conversational" },
  { value: "enthusiastic", label: "Enthusiastic" },
];

const experienceOptions = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
];

export default function CoverLetter() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to access Cover Letter Generator.");
      navigate("/login");
    }
  }, [user, navigate]);

  const [view, setView] = useState("list");
  const [coverLetters, setCoverLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    yourName: "",
    skills: "",
    experienceLevel: "mid",
    tone: "formal",
  });
  const [generatedContent, setGeneratedContent] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCoverLetters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(COVER_LETTER_API_END_POINT, { withCredentials: true });
      const data = res.data?.data?.coverLetters || res.data?.coverLetters || res.data?.data || [];
      setCoverLetters(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Failed to fetch cover letters.");
      toast.error("Failed to load cover letters.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (user) fetchCoverLetters();
  }, [user, fetchCoverLetters]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.jobTitle.trim() || !formData.companyName.trim()) {
      toast.error("Job Title and Company Name are required.");
      return;
    }
    setGenerating(true);
    setGeneratedContent("");
    setEditorContent("");
    setShowPreview(false);
    try {
      const payload = {
        jobTitle: formData.jobTitle.trim(),
        companyName: formData.companyName.trim(),
        yourName: formData.yourName.trim() || user?.name || "",
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        experienceLevel: formData.experienceLevel,
        tone: formData.tone,
      };
      const res = await axios.post(`${COVER_LETTER_API_END_POINT}/generate`, payload, { withCredentials: true });
      const content = res.data?.data?.content || res.data?.content || "";
      setGeneratedContent(content);
      setEditorContent(content);
      setEditId(null);
      setView("editor");
      toast.success("Cover letter generated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate cover letter.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!editorContent.trim()) {
      toast.error("Content cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: `Cover Letter - ${formData.companyName || "Company"}`,
        content: editorContent,
        companyName: formData.companyName.trim(),
        jobTitle: formData.jobTitle.trim(),
        yourName: formData.yourName.trim() || user?.name || "",
        isGenerated: true,
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };

      if (editId) {
        await axios.put(`${COVER_LETTER_API_END_POINT}/${editId}`, payload, { withCredentials: true });
        toast.success("Cover letter updated!");
      } else {
        const res = await axios.post(COVER_LETTER_API_END_POINT, payload, { withCredentials: true });
        toast.success("Cover letter saved!");
        const newId = res.data?.data?._id || res.data?._id;
        if (newId) setEditId(newId);
      }
      fetchCoverLetters();
      setView("list");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save cover letter.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${COVER_LETTER_API_END_POINT}/${id}`, { withCredentials: true });
      const cl = res.data?.data || res.data?.coverLetter || res.data;
      setFormData({
        jobTitle: cl.jobTitle || "",
        companyName: cl.companyName || "",
        yourName: cl.yourName || "",
        skills: Array.isArray(cl.skills) ? cl.skills.join(", ") : "",
        experienceLevel: cl.experienceLevel || "mid",
        tone: cl.tone || "formal",
      });
      setEditorContent(cl.content || "");
      setGeneratedContent(cl.content || "");
      setEditId(id);
      setView("editor");
    } catch {
      toast.error("Failed to load cover letter.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this cover letter?")) return;
    setDeletingId(id);
    try {
      await axios.delete(`${COVER_LETTER_API_END_POINT}/${id}`, { withCredentials: true });
      toast.success("Cover letter deleted.");
      fetchCoverLetters();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy.");
    }
  };

  const handleDownloadPDF = (cl) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      doc.setFontSize(18);
      doc.text(cl.title || "Cover Letter", pageWidth / 2, y, { align: "center" });
      y += 12;

      if (cl.yourName) {
        doc.setFontSize(11);
        doc.text(cl.yourName, 20, y);
        y += 6;
      }
      if (cl.yourEmail) {
        doc.text(cl.yourEmail, 20, y);
        y += 6;
      }
      if (cl.yourPhone) {
        doc.text(cl.yourPhone, 20, y);
        y += 6;
      }
      if (cl.yourAddress) {
        doc.text(cl.yourAddress, 20, y);
        y += 6;
      }
      y += 6;

      if (cl.companyName) {
        doc.setFontSize(12);
        doc.text("Hiring Manager", 20, y);
        y += 6;
        doc.text(cl.companyName, 20, y);
        y += 6;
        if (cl.companyAddress) {
          doc.text(cl.companyAddress, 20, y);
          y += 6;
        }
        y += 6;
      }

      if (cl.jobTitle) {
        doc.text(`Re: ${cl.jobTitle}`, 20, y);
        y += 10;
      }

      doc.setFontSize(11);
      const lines = doc.splitTextToSize(cl.content || "", pageWidth - 40);
      for (const line of lines) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
      }

      doc.save(`${(cl.title || "cover-letter").replace(/\s+/g, "-").toLowerCase()}.pdf`);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to download PDF.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="AI-Assisted Writing"
        title="Cover Letter Generator"
        subtitle="Craft compelling cover letters that hiring managers actually read. Our AI helps you tell your story professionally."
        gradient="from-indigo-600 via-purple-700 to-violet-900"
      >
        <div className="flex flex-wrap justify-center gap-4">
          {view === "list" ? (
            <Button
              onClick={() => {
                setEditId(null);
                setFormData({ jobTitle: "", companyName: "", yourName: "", skills: "", experienceLevel: "mid", tone: "formal" });
                setGeneratedContent("");
                setEditorContent("");
                setShowPreview(false);
                setView("editor");
              }}
              className="bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl px-8 py-5 text-base font-semibold shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Cover Letter
            </Button>
          ) : (
            <Button
              onClick={() => setView("list")}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 py-5 text-base font-semibold"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to List
            </Button>
          )}
        </div>
      </PageHero>

      {view === "list" && (
        <>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {loading ? (
              <ListSkeleton />
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>
                <Button onClick={fetchCoverLetters} variant="outline" className="rounded-xl">
                  Retry
                </Button>
              </motion.div>
            ) : coverLetters.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Inbox className="h-14 w-14 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-base mb-1">No cover letters yet.</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Create your first one to get started.</p>
                <Button
                  onClick={() => {
                    setEditId(null);
                    setFormData({ jobTitle: "", companyName: "", yourName: "", skills: "", experienceLevel: "mid", tone: "formal" });
                    setGeneratedContent("");
                    setEditorContent("");
                    setShowPreview(false);
                    setView("editor");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {coverLetters.map((cl, i) => (
                  <motion.div
                    key={cl._id || i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1 mr-2">
                        {cl.title || "Untitled"}
                      </h3>
                      {cl.isGenerated && (
                        <Badge variant="secondary" className="shrink-0 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 mb-4 flex-1">
                      {cl.companyName && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {cl.companyName}
                        </p>
                      )}
                      {cl.jobTitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {cl.jobTitle}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                        <PenLine className="h-3 w-3" />
                        {formatDate(cl.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(cl._id)}
                        className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      >
                        <FileEdit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadPDF(cl)}
                        className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(cl.content || "")}
                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(cl._id)}
                        disabled={deletingId === cl._id}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {deletingId === cl._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>

          <CTABanner
            title="Make Your Application Stand Out"
            subtitle="Create a personalized cover letter that showcases your unique value."
            buttonText="Start Writing"
            buttonLink="#"
            onClick={() => {
              setEditId(null);
              setFormData({ jobTitle: "", companyName: "", yourName: "", skills: "", experienceLevel: "mid", tone: "formal" });
              setGeneratedContent("");
              setEditorContent("");
              setShowPreview(false);
              setView("editor");
            }}
            gradient="from-indigo-600 via-purple-700 to-violet-900"
          />
        </>
      )}

      {view === "editor" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-5 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-indigo-500" />
                  Details
                </h2>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="e.g. Software Engineer"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Acme Corp"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.yourName}
                      onChange={(e) => setFormData({ ...formData, yourName: e.target.value })}
                      placeholder={user?.name || "Your name"}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="React, Node.js, TypeScript"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Experience Level
                    </label>
                    <div className="relative">
                      <select
                        value={formData.experienceLevel}
                        onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      >
                        {experienceOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tone
                    </label>
                    <div className="relative">
                      <select
                        value={formData.tone}
                        onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      >
                        {toneOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={generating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 text-base font-semibold shadow-lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5 mr-2" />
                        Generate Cover Letter
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {showPreview ? <Eye className="h-5 w-5 text-indigo-500" /> : <PenLine className="h-5 w-5 text-indigo-500" />}
                    {showPreview ? "Preview" : "Editor"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-gray-500 dark:text-gray-400"
                    >
                      {showPreview ? (
                        <><PenLine className="h-4 w-4 mr-1" /> Edit</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-1" /> Preview</>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  {!generatedContent ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <FileEdit className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-base mb-1">No content yet</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm">
                        Fill in the details and click "Generate Cover Letter"
                      </p>
                    </div>
                  ) : showPreview ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                        {editorContent}
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      className="w-full min-h-[400px] rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y"
                      placeholder="Edit your cover letter here..."
                    />
                  )}
                </div>

                {generatedContent && (
                  <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                    >
                      {saving ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        <><FileEdit className="h-4 w-4 mr-2" /> {editId ? "Update" : "Save"}</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCopy(editorContent)}
                      className="rounded-xl"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        try {
                          const doc = new jsPDF();
                          const pageWidth = doc.internal.pageSize.getWidth();
                          let y = 20;
                          doc.setFontSize(18);
                          doc.text(formData.companyName || "Cover Letter", pageWidth / 2, y, { align: "center" });
                          y += 12;
                          if (formData.yourName || user?.name) {
                            doc.setFontSize(11);
                            doc.text(formData.yourName || user?.name, 20, y);
                            y += 8;
                          }
                          y += 4;
                          doc.text(`Re: ${formData.jobTitle || "Position"}`, 20, y);
                          y += 10;
                          doc.setFontSize(11);
                          const lines = doc.splitTextToSize(editorContent, pageWidth - 40);
                          for (const line of lines) {
                            if (y > 280) { doc.addPage(); y = 20; }
                            doc.text(line, 20, y);
                            y += 7;
                          }
                          doc.save(`cover-letter-${formData.companyName.replace(/\s+/g, "-").toLowerCase() || "draft"}.pdf`);
                          toast.success("PDF downloaded!");
                        } catch {
                          toast.error("Failed to download PDF.");
                        }
                      }}
                      className="rounded-xl"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}
