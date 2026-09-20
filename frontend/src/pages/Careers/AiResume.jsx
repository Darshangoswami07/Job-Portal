import { useState, useEffect, useCallback, useRef, Component } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { RESUME_API_END_POINT } from "@/utils/constant";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import Navbar from "@/components/shared/Navbar";
import { copyToClipboard } from "@/utils/clipboard";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117] flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{this.state.error?.message || "An unexpected error occurred while loading the resume builder."}</p>
            <Button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles, Plus, Trash2, Download, Eye, Edit3, Copy, Loader2,
  AlertCircle, Inbox, FileText, X, ChevronLeft,
  GraduationCap, Briefcase, Code, Award, Globe, Link, Languages,
  User, Mail, Phone, MapPin, BookOpen, Lightbulb, Target,
  CheckCircle2, Clock, Gauge, PlusCircle, Star, Printer, RotateCcw,
  FileJson, Palette, RefreshCw, Wand2,
} from "lucide-react";

const toDateInputValue = (d) => d ? d.split("T")[0] : "";

const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const scoreColor = (s) => {
  if (s >= 80) return "text-green-600 border-green-500 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
  if (s >= 50) return "text-yellow-600 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
  return "text-red-600 border-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
};

const scoreGauge = (s) => {
  const val = s || 0;
  const hue = val >= 80 ? 142 : val >= 50 ? 48 : 0;
  return `conic-gradient(hsl(${hue}, 70%, 50%) ${val}%, #e5e7eb ${val}%)`;
};

function TagInput({ tags, onChange, placeholder }) {
  const [val, setVal] = useState("");

  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setVal("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-blue-600 dark:hover:text-blue-200">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder || "Add..."}
        />
        <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

const emptyResume = {
  title: "Untitled Resume",
  template: "modern",
  fullName: "", email: "", phone: "", location: "", headline: "", summary: "",
  website: "", linkedin: "", github: "", photo: "",
  education: [],
  experience: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  achievements: [],
  atsScore: 0,
};

const templates = [
  { id: "modern", name: "Modern", color: "#0A66C2" },
  { id: "professional", name: "Professional", color: "#1f2937" },
  { id: "minimal", name: "Minimal", color: "#6b7280" },
  { id: "executive", name: "Executive", color: "#1e3a5f" },
  { id: "creative", name: "Creative", color: "#7c3aed" },
  { id: "ats-friendly", name: "ATS Friendly", color: "#059669" },
  { id: "corporate", name: "Corporate", color: "#1d4ed8" },
  { id: "elegant", name: "Elegant", color: "#881337" },
];

function AiResume() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [view, setView] = useState("list");
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedResume, setSelectedResume] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...emptyResume });
  const [saving, setSaving] = useState(false);
  const isInitialLoadRef = useRef(true);
  const saveTimerRef = useRef(null);

  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [scoreCalculating, setScoreCalculating] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resumePreviewRef = useRef(null);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(RESUME_API_END_POINT, { withCredentials: true });
      setResumes(res.data.resumes || res.data.data || []);
    } catch (err) {
      if (err.response?.status === 401) { navigate("/login"); return; }
      setError(err.response?.data?.message || "Failed to load resumes");
      toast.error("Failed to load resumes");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchResumes();
  }, [user, navigate, fetchResumes]);

  const fetchResumeById = async (id) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await axios.get(`${RESUME_API_END_POINT}/${id}`, { withCredentials: true });
      const data = res.data.resume || res.data.data || res.data;
      setSelectedResume(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load resume";
      setDetailError(msg);
      toast.error(msg);
      return null;
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchSuggestions = async (id) => {
    setSuggestionsLoading(true);
    try {
      const res = await axios.get(`${RESUME_API_END_POINT}/${id}/suggestions`, { withCredentials: true });
      setSuggestions(res.data.data || res.data);
    } catch {
      setSuggestions(null);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const openResume = async (id, mode) => {
    const data = await fetchResumeById(id);
    if (!data) return;
    setView("detail");
    if (mode === "edit") {
      isInitialLoadRef.current = true;
      setForm({
        title: data.title || "Untitled Resume",
        template: data.template || "modern",
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        headline: data.headline || "",
        summary: data.summary || "",
        website: data.website || "",
        linkedin: data.linkedin || "",
        github: data.github || "",
        photo: data.photo || "",
        education: data.education || [],
        experience: data.experience || [],
        skills: data.skills || [],
        projects: data.projects || [],
        certifications: data.certifications || [],
        languages: data.languages || [],
        achievements: data.achievements || [],
        atsScore: data.atsScore || 0,
        _id: data._id,
      });
      setEditing(true);
    } else {
      setEditing(false);
      setSuggestions(null);
      fetchSuggestions(id);
    }
  };

  const createResume = async () => {
    try {
      const res = await axios.post(RESUME_API_END_POINT, { title: "Untitled Resume" }, { withCredentials: true });
      const data = res.data.resume || res.data.data || res.data;
      toast.success("New resume created");
      setResumes((prev) => [data, ...prev]);
      isInitialLoadRef.current = true;
      setForm({
        ...emptyResume,
        title: "Untitled Resume",
        _id: data._id,
      });
      setSelectedResume(data);
      setEditing(true);
      setView("detail");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create resume");
    }
  };

  const saveResume = useCallback(async () => {
    if (!form._id) return;
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload._id;
      const res = await axios.put(`${RESUME_API_END_POINT}/${form._id}`, payload, { withCredentials: true });
      const updated = res.data.resume || res.data.data || res.data;
      setSelectedResume(updated);
      setResumes((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch {
      toast.error("Auto-save failed");
    } finally {
      setSaving(false);
    }
  }, [form]);

  useEffect(() => {
    if (!editing || !form._id) return;
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { saveResume(); }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [form, editing, saveResume]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const duplicateResume = async (id) => {
    try {
      const res = await axios.post(`${RESUME_API_END_POINT}/${id}/duplicate`, {}, { withCredentials: true });
      const data = res.data.resume || res.data.data || res.data;
      setResumes((prev) => [data, ...prev]);
      toast.success("Resume duplicated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to duplicate");
    }
  };

  const confirmDelete = (id) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const deleteResume = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${RESUME_API_END_POINT}/${deleteTarget}`, { withCredentials: true });
      setResumes((prev) => prev.filter((r) => r._id !== deleteTarget));
      toast.success("Resume deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const calculateScore = async () => {
    if (!selectedResume?._id) return;
    setScoreCalculating(true);
    try {
      const res = await axios.post(`${RESUME_API_END_POINT}/${selectedResume._id}/score`, {}, { withCredentials: true });
      const data = res.data.data || res.data;
      const newScore = data.atsScore ?? 0;
      setSelectedResume((prev) => ({ ...prev, atsScore: newScore }));
      setForm((prev) => ({ ...prev, atsScore: newScore }));
      setResumes((prev) => prev.map((r) => (r._id === selectedResume._id ? { ...r, atsScore: newScore } : r)));
      toast.success(`ATS Score: ${newScore}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to calculate score");
    } finally {
      setScoreCalculating(false);
    }
  };

  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!form.fullName.trim() && !form.headline.trim()) {
      toast.error("Please fill in your name or headline first.");
      return;
    }
    setGenerating(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        headline: form.headline.trim(),
        summary: form.summary.trim(),
        skills: form.skills,
        experience: form.experience,
        education: form.education,
        projects: form.projects,
        certifications: form.certifications,
        languages: form.languages,
        website: form.website.trim(),
        linkedin: form.linkedin.trim(),
        github: form.github.trim(),
        template: form.template || "modern",
      };
      const res = await axios.post(`${RESUME_API_END_POINT}/generate`, payload, { withCredentials: true });
      const data = res.data.resume || res.data.data || res.data;
      const newId = data._id;
      setForm((prev) => ({
        ...prev,
        _id: newId,
        summary: data.summary || prev.summary,
        headline: data.headline || prev.headline,
        skills: data.skills || prev.skills,
        experience: data.experience || prev.experience,
        education: data.education || prev.education,
        projects: data.projects || prev.projects,
        achievements: data.achievements || prev.achievements,
        title: data.title || prev.title,
      }));
      setSelectedResume(data);
      setResumes((prev) => [data, ...prev.filter((r) => r._id !== newId)]);
      setEditing(true);
      isInitialLoadRef.current = true;
      toast.success("Resume generated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate resume.");
    } finally {
      setGenerating(false);
    }
  };

  const handleTemplateChange = (templateId) => {
    handleFormChange("template", templateId);
    setSelectedResume((prev) => prev ? { ...prev, template: templateId } : prev);
  };

  const handleDownloadDocx = async () => {
    const r = selectedResume || form;
    const children = [];
    children.push(new Paragraph({ children: [new TextRun({ text: r.fullName || "Your Name", bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
    if (r.headline) children.push(new Paragraph({ children: [new TextRun({ text: r.headline, size: 22, color: "555555" })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
    const contact = [r.email, r.phone, r.location].filter(Boolean).join(" | ");
    if (contact) children.push(new Paragraph({ children: [new TextRun({ text: contact, size: 18, color: "666666" })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }));
    if (r.summary) {
      children.push(new Paragraph({ children: [new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true, size: 20 })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: r.summary, size: 20 })], spacing: { after: 300 } }));
    }
    (r.experience || []).forEach((exp) => {
      children.push(new Paragraph({ children: [new TextRun({ text: "EXPERIENCE", bold: true, size: 20 })], spacing: { before: 300, after: 100 } }));
      children.push(new Paragraph({ children: [new TextRun({ text: exp.title || "", bold: true, size: 20 })], spacing: { after: 50 } }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${exp.company || ""}${exp.location ? ` — ${exp.location}` : ""}`, size: 18, color: "555555" })], spacing: { after: 50 } }));
      if (exp.description) children.push(new Paragraph({ children: [new TextRun({ text: exp.description, size: 20 })], spacing: { after: 200 } }));
    });
    (r.education || []).forEach((edu) => {
      children.push(new Paragraph({ children: [new TextRun({ text: "EDUCATION", bold: true, size: 20 })], spacing: { before: 300, after: 100 } }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${edu.institution || ""}${edu.degree ? ` — ${edu.degree}` : ""}`, size: 20 })], spacing: { after: 50 } }));
      if (edu.field) children.push(new Paragraph({ children: [new TextRun({ text: edu.field, size: 18, color: "555555" })], spacing: { after: 200 } }));
    });
    if (r.skills?.length > 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: "SKILLS", bold: true, size: 20 })], spacing: { before: 300, after: 100 } }));
      children.push(new Paragraph({ children: [new TextRun({ text: r.skills.join(" • "), size: 20 })], spacing: { after: 200 } }));
    }
    const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${(r.title || "resume").replace(/\s+/g, "_")}.docx`);
    toast.success("Word document downloaded!");
  };

  const handlePrint = () => window.print();

  const handleCopyText = () => {
    const r = selectedResume || form;
    const parts = [r.fullName, r.headline, r.email, r.phone, r.location, "", r.summary ? `Summary:\n${r.summary}\n` : ""];
    if (r.experience?.length > 0) {
      parts.push("Experience:");
      r.experience.forEach((exp) => parts.push(`  ${exp.title} at ${exp.company}\n  ${exp.description || ""}`));
    }
    if (r.education?.length > 0) {
      parts.push("Education:");
      r.education.forEach((edu) => parts.push(`  ${edu.degree} in ${edu.field} - ${edu.institution}`));
    }
    if (r.skills?.length > 0) parts.push(`Skills: ${r.skills.join(", ")}`);
    copyToClipboard(parts.filter(Boolean).join("\n"));
    toast.success("Copied to clipboard!");
  };

  const handleDownloadJson = () => {
    const data = selectedResume || form;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    saveAs(blob, `${(data.title || "resume").replace(/\s+/g, "_")}.json`);
    toast.success("JSON downloaded!");
  };

  const handleDownloadPDF = async () => {
    if (!resumePreviewRef.current) return;
    setPdfExporting(true);
    try {
      const canvas = await html2canvas(resumePreviewRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      if (pdfH > pdf.internal.pageSize.getHeight()) {
        const pageH = pdf.internal.pageSize.getHeight();
        let pos = 0;
        const ratio = pdfW / canvas.width;
        const pageCanvasH = pageH / ratio;
        while (pos < canvas.height) {
          const chunkCanvas = document.createElement("canvas");
          chunkCanvas.width = canvas.width;
          chunkCanvas.height = Math.min(pageCanvasH, canvas.height - pos);
          const ctx = chunkCanvas.getContext("2d");
          ctx.drawImage(canvas, 0, pos, canvas.width, chunkCanvas.height, 0, 0, canvas.width, chunkCanvas.height);
          const chunkData = chunkCanvas.toDataURL("image/png");
          if (pos > 0) pdf.addPage();
          pdf.addImage(chunkData, "PNG", 0, 0, pdfW, chunkCanvas.height * ratio);
          pos += pageCanvasH;
        }
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      }
      pdf.save(`${selectedResume?.title || "resume"}.pdf`);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setPdfExporting(false);
    }
  };

  const goToList = () => {
    setView("list");
    setSelectedResume(null);
    setEditing(false);
    setSuggestions(null);
    setDetailError(null);
  };

  const handleArrayItem = (field, index, key, value) => {
    setForm((prev) => {
      const arr = [...(prev[field] || [])];
      if (!arr[index]) return prev;
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (field, template) => {
    setForm((prev) => ({ ...prev, [field]: [...(prev[field] || []), { ...template }] }));
  };

  const removeArrayItem = (field, index) => {
    setForm((prev) => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) }));
  };

  const fieldClass = "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm";

  const renderListView = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading your resumes...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>
          <Button onClick={fetchResumes} variant="outline" className="rounded-xl">Retry</Button>
        </div>
      );
    }
    if (resumes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Inbox className="h-10 w-10 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No resumes yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-4">Create your first one to get started.</p>
          <Button onClick={createResume} className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl px-6">
            <Sparkles className="h-4 w-4 mr-2" />
            Build Your Resume
          </Button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumes.map((r, i) => (
          <motion.div
            key={r._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{r.title || "Untitled"}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatDate(r.updatedAt || r.createdAt)}
                  </p>
                </div>
              </div>
              {typeof r.atsScore === "number" && r.atsScore > 0 && (
                <Badge className={`shrink-0 ${scoreColor(r.atsScore)}`}>{r.atsScore}</Badge>
              )}
            </div>
            {(r.headline || r.fullName) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-4">
                {r.fullName ? r.fullName : r.headline}
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              <Button size="sm" variant="outline" onClick={() => openResume(r._id, "view")} className="rounded-lg"><Eye className="h-3.5 w-3.5 mr-1" />View
              </Button>
              <Button size="sm" variant="outline" onClick={() => openResume(r._id, "edit")} className="rounded-lg"><Edit3 className="h-3.5 w-3.5 mr-1" />Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => duplicateResume(r._id)} className="rounded-lg"><Copy className="h-3.5 w-3.5 mr-1" />Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => confirmDelete(r._id)} className="rounded-lg text-red-500 hover:text-red-600 hover:border-red-200"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: resumes.length * 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 p-6 flex flex-col items-center justify-center min-h-[200px] hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
          onClick={createResume}
        >
          <PlusCircle className="h-8 w-8 text-gray-300 dark:text-gray-500 mb-2" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Create New Resume</p>
        </motion.div>
      </div>
    );
  };

  const renderEditorForm = () => (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Palette className="h-5 w-5 text-blue-600" />Template</h3>
          {!form._id && (
            <Button onClick={handleGenerate} disabled={generating} className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl">
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate with AI</>}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTemplateChange(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                form.template === t.id
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: t.color }} />
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><User className="h-5 w-5 text-blue-600" />Personal Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={(e) => handleFormChange("fullName", e.target.value)} placeholder="John Doe" />
          </div>
          <div className="space-y-1.5">
            <Label>Title / Headline</Label>
            <Input value={form.headline} onChange={(e) => handleFormChange("headline", e.target.value)} placeholder="Full Stack Developer" />
          </div>
          <div className="space-y-1.5">
            <Label><Mail className="h-3.5 w-3.5 inline mr-1" />Email</Label>
            <Input value={form.email} onChange={(e) => handleFormChange("email", e.target.value)} placeholder="john@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label><Phone className="h-3.5 w-3.5 inline mr-1" />Phone</Label>
            <Input value={form.phone} onChange={(e) => handleFormChange("phone", e.target.value)} placeholder="+1 234 567 890" />
          </div>
          <div className="space-y-1.5">
            <Label><MapPin className="h-3.5 w-3.5 inline mr-1" />Location</Label>
            <Input value={form.location} onChange={(e) => handleFormChange("location", e.target.value)} placeholder="San Francisco, CA" />
          </div>
          <div className="space-y-1.5">
            <Label>Resume Title</Label>
            <Input value={form.title} onChange={(e) => handleFormChange("title", e.target.value)} placeholder="My Resume" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Summary</Label>
          <textarea value={form.summary} onChange={(e) => handleFormChange("summary", e.target.value)} rows={3} className={fieldClass + " resize-y"} placeholder="Brief professional summary..." />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Link className="h-5 w-5 text-blue-600" />Social Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label><Globe className="h-3.5 w-3.5 inline mr-1" />Website</Label>
            <Input value={form.website} onChange={(e) => handleFormChange("website", e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>LinkedIn</Label>
            <Input value={form.linkedin} onChange={(e) => handleFormChange("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="space-y-1.5">
            <Label>GitHub</Label>
            <Input value={form.github} onChange={(e) => handleFormChange("github", e.target.value)} placeholder="https://github.com/..." />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-600" />Education</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => addArrayItem("education", { institution: "", degree: "", field: "", startDate: "", endDate: "", grade: "", current: false })}>
            <Plus className="h-4 w-4 mr-1" />Add
          </Button>
        </div>
        {form.education.length === 0 && <p className="text-sm text-gray-400">No education entries added.</p>}
        {form.education.map((edu, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 relative">
            <button type="button" onClick={() => removeArrayItem("education", i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Institution</Label><Input value={edu.institution} onChange={(e) => handleArrayItem("education", i, "institution", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Degree</Label><Input value={edu.degree} onChange={(e) => handleArrayItem("education", i, "degree", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Field of Study</Label><Input value={edu.field} onChange={(e) => handleArrayItem("education", i, "field", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Grade / GPA</Label><Input value={edu.grade} onChange={(e) => handleArrayItem("education", i, "grade", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={toDateInputValue(edu.startDate)} onChange={(e) => handleArrayItem("education", i, "startDate", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={toDateInputValue(edu.endDate)} onChange={(e) => handleArrayItem("education", i, "endDate", e.target.value)} disabled={edu.current} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={edu.current || false} onChange={(e) => handleArrayItem("education", i, "current", e.target.checked)} className="rounded border-gray-300" />
              Currently studying here
            </label>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-600" />Experience</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => addArrayItem("experience", { company: "", title: "", location: "", startDate: "", endDate: "", current: false, description: "" })}>
            <Plus className="h-4 w-4 mr-1" />Add
          </Button>
        </div>
        {form.experience.length === 0 && <p className="text-sm text-gray-400">No experience entries added.</p>}
        {form.experience.map((exp, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 relative">
            <button type="button" onClick={() => removeArrayItem("experience", i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Company</Label><Input value={exp.company} onChange={(e) => handleArrayItem("experience", i, "company", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Job Title</Label><Input value={exp.title} onChange={(e) => handleArrayItem("experience", i, "title", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Location</Label><Input value={exp.location} onChange={(e) => handleArrayItem("experience", i, "location", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={toDateInputValue(exp.startDate)} onChange={(e) => handleArrayItem("experience", i, "startDate", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={toDateInputValue(exp.endDate)} onChange={(e) => handleArrayItem("experience", i, "endDate", e.target.value)} disabled={exp.current} /></div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={exp.current || false} onChange={(e) => handleArrayItem("experience", i, "current", e.target.checked)} className="rounded border-gray-300" />
              I currently work here
            </label>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea value={exp.description || ""} onChange={(e) => handleArrayItem("experience", i, "description", e.target.value)} rows={3} className={fieldClass + " resize-y"} placeholder="Describe your responsibilities and achievements..." />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Code className="h-5 w-5 text-blue-600" />Projects</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => addArrayItem("projects", { name: "", description: "", url: "", technologies: [] })}>
            <Plus className="h-4 w-4 mr-1" />Add
          </Button>
        </div>
        {form.projects.length === 0 && <p className="text-sm text-gray-400">No projects added.</p>}
        {form.projects.map((proj, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 relative">
            <button type="button" onClick={() => removeArrayItem("projects", i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Project Name</Label><Input value={proj.name} onChange={(e) => handleArrayItem("projects", i, "name", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>URL</Label><Input value={proj.url} onChange={(e) => handleArrayItem("projects", i, "url", e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea value={proj.description || ""} onChange={(e) => handleArrayItem("projects", i, "description", e.target.value)} rows={2} className={fieldClass + " resize-y"} />
            </div>
            <div className="space-y-1.5">
              <Label>Technologies</Label>
              <TagInput tags={proj.technologies || []} onChange={(v) => handleArrayItem("projects", i, "technologies", v)} placeholder="Add technology..." />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Award className="h-5 w-5 text-blue-600" />Certifications</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => addArrayItem("certifications", { name: "", issuer: "", date: "", url: "" })}>
            <Plus className="h-4 w-4 mr-1" />Add
          </Button>
        </div>
        {form.certifications.length === 0 && <p className="text-sm text-gray-400">No certifications added.</p>}
        {form.certifications.map((cert, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 relative">
            <button type="button" onClick={() => removeArrayItem("certifications", i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name</Label><Input value={cert.name} onChange={(e) => handleArrayItem("certifications", i, "name", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Issuer</Label><Input value={cert.issuer} onChange={(e) => handleArrayItem("certifications", i, "issuer", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={toDateInputValue(cert.date)} onChange={(e) => handleArrayItem("certifications", i, "date", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>URL</Label><Input value={cert.url} onChange={(e) => handleArrayItem("certifications", i, "url", e.target.value)} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Code className="h-5 w-5 text-blue-600" />Skills</h3>
        <TagInput tags={form.skills} onChange={(v) => handleFormChange("skills", v)} placeholder="Add skill..." />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Languages className="h-5 w-5 text-blue-600" />Languages</h3>
        <TagInput tags={form.languages} onChange={(v) => handleFormChange("languages", v)} placeholder="Add language..." />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Star className="h-5 w-5 text-blue-600" />Achievements</h3>
        <TagInput tags={form.achievements} onChange={(v) => handleFormChange("achievements", v)} placeholder="Add achievement..." />
      </div>
    </div>
  );

  const renderResumePreview = () => {
    const r = selectedResume;
    if (!r) return null;
    return (
      <div ref={resumePreviewRef} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] px-8 py-6 text-white">
          <h2 className="text-2xl font-bold">{r.fullName || "Your Name"}</h2>
          {r.headline && <p className="text-blue-200 mt-1">{r.headline}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-blue-100">
            {r.email && <span><Mail className="h-3.5 w-3.5 inline mr-1" />{r.email}</span>}
            {r.phone && <span><Phone className="h-3.5 w-3.5 inline mr-1" />{r.phone}</span>}
            {r.location && <span><MapPin className="h-3.5 w-3.5 inline mr-1" />{r.location}</span>}
            {r.website && <span><Globe className="h-3.5 w-3.5 inline mr-1" /><a href={r.website} className="underline underline-offset-2" target="_blank">{r.website}</a></span>}
            {r.linkedin && <span><Link className="h-3.5 w-3.5 inline mr-1" /><a href={r.linkedin} className="underline underline-offset-2" target="_blank">LinkedIn</a></span>}
            {r.github && <span><Code className="h-3.5 w-3.5 inline mr-1" /><a href={r.github} className="underline underline-offset-2" target="_blank">GitHub</a></span>}
          </div>
        </div>
        <div className="px-8 py-6 space-y-6">
          {r.summary && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Professional Summary</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{r.summary}</p>
            </div>
          )}
          {r.experience && r.experience.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4" />Experience</h3>
              <div className="space-y-4">
                {r.experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{exp.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{exp.company}{exp.location ? ` — ${exp.location}` : ""}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0 ml-4">{formatDate(exp.startDate)} — {exp.current ? "Present" : formatDate(exp.endDate)}</p>
                    </div>
                    {exp.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {r.education && r.education.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4" />Education</h3>
              <div className="space-y-3">
                {r.education.map((edu, i) => (
                  <div key={i}>
                    <p className="font-semibold text-gray-900 dark:text-white">{edu.institution}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.grade ? ` — ${edu.grade}` : ""}</p>
                    <p className="text-xs text-gray-400">{formatDate(edu.startDate)} — {edu.current ? "Present" : formatDate(edu.endDate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {r.skills && r.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {r.skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">{s}</span>
                ))}
              </div>
            </div>
          )}
          {r.projects && r.projects.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-3 flex items-center gap-2"><Code className="h-4 w-4" />Projects</h3>
              <div className="space-y-3">
                {r.projects.map((proj, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">{proj.name}</p>
                      {proj.url && <a href={proj.url} className="text-xs text-blue-600 hover:underline" target="_blank"><Link className="h-3 w-3 inline" /></a>}
                    </div>
                    {proj.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{proj.description}</p>}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {proj.technologies.map((t, j) => (
                          <span key={j} className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {r.certifications && r.certifications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2 flex items-center gap-2"><Award className="h-4 w-4" />Certifications</h3>
              <div className="space-y-2">
                {r.certifications.map((cert, i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{cert.name}</p>
                      <p className="text-xs text-gray-500">{cert.issuer}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-gray-400">{formatDate(cert.date)}</p>
                      {cert.url && <a href={cert.url} className="text-xs text-blue-600 hover:underline" target="_blank">View</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {r.languages && r.languages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2 flex items-center gap-2"><Languages className="h-4 w-4" />Languages</h3>
              <div className="flex flex-wrap gap-2">
                {r.languages.map((l, i) => (
                  <span key={i} className="text-sm text-gray-700 dark:text-gray-300">{l}</span>
                ))}
              </div>
            </div>
          )}
          {r.achievements && r.achievements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2 flex items-center gap-2"><Star className="h-4 w-4" />Achievements</h3>
              <ul className="list-disc list-inside space-y-1">
                {r.achievements.map((a, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300">{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSuggestionsPanel = () => {
    if (suggestionsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Analyzing your resume...</span>
        </div>
      );
    }
    if (!suggestions) return null;
    const { atsScore, suggestions: sugList, missingKeywords } = suggestions;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Target className="h-5 w-5 text-blue-600" />AI Analysis</h3>
        {typeof atsScore === "number" && (
          <div className="flex items-center gap-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
            <div className="relative h-20 w-20 shrink-0">
              <div className="h-20 w-20 rounded-full" style={{ background: scoreGauge(atsScore) }} />
              <div className="absolute inset-1.5 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{atsScore}</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">ATS Score</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {atsScore >= 80 ? "Great! Your resume is well-optimized." : atsScore >= 50 ? "Room for improvement." : "Needs significant optimization."}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={calculateScore} disabled={scoreCalculating} className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl">
            {scoreCalculating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Gauge className="h-4 w-4 mr-1" />}
            Calculate ATS Score
          </Button>
        </div>
        {sugList && sugList.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-500" />Suggestions</h4>
            <div className="space-y-3">
              {sugList.map((sug, i) => (
                <div key={i} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{sug.section || "General"}</Badge>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sug.type === "improvement" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" : sug.type === "critical" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"}`}>
                      {sug.type || "info"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{sug.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {missingKeywords && missingKeywords.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-500" />Missing Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map((kw, i) => (
                <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 border border-orange-200 dark:border-orange-800">{kw}</span>
              ))}
            </div>
          </div>
        )}
        {!sugList && !missingKeywords && typeof atsScore !== "number" && (
          <p className="text-sm text-gray-400">Click "Calculate ATS Score" to get AI-powered suggestions.</p>
        )}
      </div>
    );
  };

  const renderDetailView = () => {
    if (detailLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading resume...</p>
        </div>
      );
    }
    if (detailError) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <p className="text-red-500 dark:text-red-400 text-sm mb-4">{detailError}</p>
          <Button onClick={goToList} variant="outline" className="rounded-xl">Go Back</Button>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={goToList} className="rounded-xl"><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedResume?.title || "Resume"}</h2>
            {selectedResume?.atsScore > 0 && (
              <Badge className={scoreColor(selectedResume.atsScore)}>{selectedResume.atsScore}</Badge>
            )}
            {saving && <span className="text-xs text-blue-600 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Saving...</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <>
                <Button size="sm" variant="outline" onClick={() => openResume(selectedResume._id, "edit")} className="rounded-xl"><Edit3 className="h-4 w-4 mr-1" />Edit</Button>
                <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={pdfExporting} className="rounded-xl">
                  {pdfExporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadDocx} className="rounded-xl">
                  <FileText className="h-4 w-4 mr-1" />Word
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopyText} className="rounded-xl">
                  <Copy className="h-4 w-4 mr-1" />Copy
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrint} className="rounded-xl">
                  <Printer className="h-4 w-4 mr-1" />Print
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadJson} className="rounded-xl">
                  <FileJson className="h-4 w-4 mr-1" />JSON
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); saveResume().then(() => { setEditing(false); setSuggestions(null); fetchSuggestions(selectedResume._id); }); }} className="rounded-xl">
                <CheckCircle2 className="h-4 w-4 mr-1" />Done Editing
              </Button>
            )}
          </div>
        </div>

        {editing ? renderEditorForm() : renderResumePreview()}

        {!editing && renderSuggestionsPanel()}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      {view === "list" ? (
        <PageHero
          badge="AI-Powered"
          title="AI Resume Builder"
          subtitle="Create ATS-optimized resumes that land interviews. Our AI analyzes job descriptions and tailors your resume for each application."
        >
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={createResume} className="bg-white text-[#0A66C2] hover:bg-blue-50 rounded-xl px-8 py-5 text-base font-semibold shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              New Resume
            </Button>
            <Button
              onClick={() => {
                setForm({ ...emptyResume });
                setView("detail");
                setEditing(true);
              }}
              className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl px-8 py-5 text-base font-semibold shadow-lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Create Resume with AI
            </Button>
          </div>
        </PageHero>
      ) : (
        <PageHero
          badge={editing ? "Editing" : "Preview"}
          title={selectedResume?.title || "Resume"}
          subtitle={editing ? "Fill in your details below. Changes are auto-saved." : "Review your resume and get AI-powered suggestions."}
        >
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl px-6 py-4 text-sm font-semibold" onClick={goToList}>
              <ChevronLeft className="h-4 w-4 mr-1" />Back to Resumes
            </Button>
          </div>
        </PageHero>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {view === "list" ? renderListView() : renderDetailView()}
      </section>

      {view === "list" && (
        <CTABanner
          title="Ready to Land Your Dream Job?"
          subtitle="Join thousands of professionals who've improved their resumes with our AI-powered builder."
          buttonText="Get Started Free"
          buttonLink="/signup"
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>Are you sure you want to delete this resume? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={deleteResume} className="rounded-xl">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:bg-white, [class*="preview"] { visibility: visible; }
          .print\\:bg-white *, [class*="preview"] * { visibility: visible; }
          nav, footer, .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function AiResumePage() {
  return (
    <ErrorBoundary>
      <AiResume />
    </ErrorBoundary>
  );
}