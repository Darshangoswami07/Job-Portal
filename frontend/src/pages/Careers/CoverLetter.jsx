import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { COVER_LETTER_API_END_POINT } from "@/utils/constant";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, PageNumber } from "docx";
import { saveAs } from "file-saver";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileEdit, Wand2, Loader2, AlertCircle, Inbox, Trash2, Download,
  Copy, Plus, ArrowLeft, Sparkles, Briefcase, Eye, Settings2,
  ChevronDown, PenLine, Printer, Undo2, Redo2, Bold, Italic,
  Underline as UnderlineIcon, List, ListOrdered, AlignLeft,
  AlignCenter, AlignRight, Link, Heading1, Heading2, Quote, Save,
  History, RotateCcw, Shrink, Maximize2, Award, Smile, CheckCircle2,
  FileText, Shield, Tag
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

function MenuBar({ editor }) {
  if (!editor) return null;
  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive("bold") ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Bold"><Bold className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive("italic") ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Italic"><Italic className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive("underline") ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Underline"><UnderlineIcon className="h-4 w-4" /></button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive("heading", { level: 1 }) ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Heading 1"><Heading1 className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive("heading", { level: 2 }) ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Heading 2"><Heading2 className="h-4 w-4" /></button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive("bulletList") ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Bullet List"><List className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive("orderedList") ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Numbered List"><ListOrdered className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive("blockquote") ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Quote"><Quote className="h-4 w-4" /></button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive({ textAlign: "left" }) ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Align Left"><AlignLeft className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive({ textAlign: "center" }) ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Align Center"><AlignCenter className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive({ textAlign: "right" }) ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Align Right"><AlignRight className="h-4 w-4" /></button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button onClick={addLink} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition ${editor.isActive("link") ? "bg-gray-200 dark:bg-gray-700 text-indigo-600" : "text-gray-600 dark:text-gray-300"}`} title="Link"><Link className="h-4 w-4" /></button>
      <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button onClick={() => editor.chain().focus().undo().run()} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300" title="Undo"><Undo2 className="h-4 w-4" /></button>
      <button onClick={() => editor.chain().focus().redo().run()} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300" title="Redo"><Redo2 className="h-4 w-4" /></button>
    </div>
  );
}

export default function CoverLetter() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const autoSaveTimer = useRef(null);
  const editorContentRef = useRef("");

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
  const [improving, setImproving] = useState(false);

  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("coverLetterFormData");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {
      jobTitle: "",
      companyName: "",
      yourName: "",
      skills: "",
      experienceLevel: "mid",
      tone: "formal",
    };
  });
  const [generatedContent, setGeneratedContent] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [lastSaved, setLastSaved] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Edit your cover letter here..." }),
    ],
    content: "",
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      editorContentRef.current = html;
      scheduleAutoSave(html);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[420px] px-4 py-3 text-gray-900 dark:text-white",
      },
    },
  });

  const scheduleAutoSave = useCallback((content) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        const draft = {
          content,
          formData,
          editId,
          timestamp: Date.now(),
        };
        localStorage.setItem("coverLetterDraft", JSON.stringify(draft));
      } catch { /* storage full */ }
    }, 2000);
  }, [formData, editId]);

  useEffect(() => {
    try {
      const draft = localStorage.getItem("coverLetterDraft");
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.content && parsed.formData) {
          const draftAge = Date.now() - (parsed.timestamp || 0);
          if (draftAge < 86400000) {
            setGeneratedContent(parsed.content);
            setEditId(parsed.editId || null);
            if (editor && parsed.content) {
              editor.commands.setContent(parsed.content);
            }
          }
        }
      }
    } catch { /* ignore */ }
  }, [editor]);

  useEffect(() => {
    try {
      localStorage.setItem("coverLetterFormData", JSON.stringify(formData));
    } catch { /* ignore */ }
  }, [formData]);

  useEffect(() => {
    if (editor && generatedContent && !editor.getText()) {
      editor.commands.setContent(generatedContent);
    }
  }, [editor, generatedContent]);

  const fetchCoverLetters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(COVER_LETTER_API_END_POINT, { withCredentials: true });
      const data = res.data?.letters || res.data?.data?.letters || [];
      setCoverLetters(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Failed to fetch cover letters.");
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
    
    if (editor) editor.commands.setContent("");
    editorContentRef.current = "";
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
      const content = res.data?.letter?.content || "";
      if (!content) {
        toast.error("Generated content is empty. Please try again.");
        setGenerating(false);
        return;
      }
      setGeneratedContent(content);
      editorContentRef.current = content;
      if (editor) editor.commands.setContent(content);
      const newId = res.data?.letter?._id;
      if (newId) setEditId(newId);
      setView("editor");
      toast.success("Cover letter generated successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to generate cover letter.";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!formData.jobTitle.trim() || !formData.companyName.trim()) {
      toast.error("Job Title and Company Name are required.");
      return;
    }
    setGenerating(true);
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
      const content = res.data?.letter?.content || "";
      if (content) {
        setGeneratedContent(content);
        editorContentRef.current = content;
        if (editor) editor.commands.setContent(content);
        const newId = res.data?.letter?._id;
        if (newId) setEditId(newId);
        toast.success("Cover letter regenerated!");
      }
    } catch {
      toast.error("Failed to regenerate.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    const content = editor ? editor.getHTML() : editorContentRef.current;
    if (!content || !content.replace(/<[^>]*>/g, "").trim()) {
      toast.error("Content cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: `Cover Letter - ${formData.companyName || "Company"}`,
        content,
        companyName: formData.companyName.trim(),
        jobTitle: formData.jobTitle.trim(),
        yourName: formData.yourName.trim() || user?.name || "",
        isGenerated: true,
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        experienceLevel: formData.experienceLevel,
        tone: formData.tone,
      };

      if (editId) {
        await axios.put(`${COVER_LETTER_API_END_POINT}/${editId}`, payload, { withCredentials: true });
        toast.success("Cover letter updated!");
      } else {
        const res = await axios.post(COVER_LETTER_API_END_POINT, payload, { withCredentials: true });
        const newId = res.data?.letter?._id || res.data?.data?._id;
        if (newId) setEditId(newId);
        toast.success("Cover letter saved!");
      }
      setLastSaved(new Date().toLocaleTimeString());
      localStorage.removeItem("coverLetterDraft");
      fetchCoverLetters();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save cover letter.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${COVER_LETTER_API_END_POINT}/${id}`, { withCredentials: true });
      const cl = res.data?.letter || res.data?.data || res.data;
      setFormData({
        jobTitle: cl.jobTitle || "",
        companyName: cl.companyName || "",
        yourName: cl.yourName || "",
        skills: Array.isArray(cl.skills) ? cl.skills.join(", ") : "",
        experienceLevel: cl.experienceLevel || "mid",
        tone: cl.tone || "formal",
      });
      const content = cl.content || "";
      setGeneratedContent(content);
      editorContentRef.current = content;
      if (editor) editor.commands.setContent(content);
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

  const handleCopy = async () => {
    const content = editor ? editor.getHTML() : editorContentRef.current;
    const plainText = content ? content.replace(/<[^>]*>/g, "") : "";
    try {
      await navigator.clipboard.writeText(plainText);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy.");
    }
  };

  const getPlainContent = () => {
    const content = editor ? editor.getHTML() : editorContentRef.current;
    return content ? content.replace(/<[^>]*>/g, "") : "";
  };

  const handleDownloadPDF = async () => {
    try {
      const content = getPlainContent();
      const lines = content.split("\n").filter(Boolean);
      const doc = new jsPDF({ format: "a4", unit: "mm" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 25;
      const maxWidth = pageWidth - 2 * margin;
      let y = margin;
      const company = formData.companyName || "";
      const name = formData.yourName || user?.name || "";
      const job = formData.jobTitle || "";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      if (name) {
        doc.text(name, margin, y);
        y += 7;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), margin, y);
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      if (company) {
        doc.text("Hiring Manager", margin, y);
        y += 6;
        doc.text(company, margin, y);
        y += 6;
      }
      y += 4;

      if (job) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Re: ${job}`, margin, y);
        y += 10;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      for (const line of lines) {
        if (!line.trim()) { y += 4; continue; }
        const wrapped = doc.splitTextToSize(line, maxWidth);
        for (const w of wrapped) {
          if (y + 6 > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(w, margin, y);
          y += 6;
        }
      }

      const filename = `CoverLetter_${(company || "Draft").replace(/\s+/g, "")}.pdf`;
      doc.save(filename);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to download PDF.");
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const content = getPlainContent();
      const lines = content.split("\n").filter(Boolean);
      const company = formData.companyName || "";
      const name = formData.yourName || user?.name || "";
      const job = formData.jobTitle || "";
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      const children = [];

      if (name) {
        children.push(new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 28 })], spacing: { after: 200 } }));
      }
      children.push(new Paragraph({ children: [new TextRun({ text: dateStr, size: 18, color: "505050" })], spacing: { after: 400 } }));

      if (company) {
        children.push(new Paragraph({ children: [new TextRun({ text: "Hiring Manager", bold: true, size: 22 })], spacing: { after: 100 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: company, size: 22 })], spacing: { after: 200 } }));
      }

      if (job) {
        children.push(new Paragraph({ children: [new TextRun({ text: `Re: ${job}`, size: 20 })] }));
        children.push(new Paragraph({ spacing: { after: 200 } }));
      }

      for (const line of lines) {
        if (!line.trim()) {
          children.push(new Paragraph({ spacing: { after: 200 } }));
          continue;
        }
        children.push(new Paragraph({
          children: [new TextRun({ text: line, size: 20 })],
          spacing: { after: 120 },
        }));
      }

      const doc = new Document({
        sections: [{
          properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const filename = `CoverLetter_${(company || "Draft").replace(/\s+/g, "")}.docx`;
      saveAs(blob, filename);
      toast.success("Word document downloaded!");
    } catch {
      toast.error("Failed to download Word document.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleImprove = async (action) => {
    setImproving(true);
    try {
      const currentContent = getPlainContent();
      let improved = currentContent;

      const lines = currentContent.split("\n").filter(Boolean);

      switch (action) {
        case "professional": {
          improved = lines.map(l => {
            if (l.match(/^(hi|hey|hello)/i)) return "Dear Hiring Manager,";
            if (l.match(/^best/i)) return "Sincerely";
            if (l.match(/^thanks/i)) return "Thank you for your time and consideration.";
            return l;
          }).join("\n");
          break;
        }
        case "friendly": {
          improved = lines.map(l => {
            if (l.match(/^dear/i)) return "Hi there,";
            if (l.match(/^sincerely/i)) return "Best regards";
            return l;
          }).join("\n");
          break;
        }
        case "shorten": {
          improved = lines.filter((l, i) => {
            if (i === 0 || i === lines.length - 1) return true;
            return l.split(" ").length > 5;
          }).slice(0, Math.max(6, Math.ceil(lines.length * 0.7))).join("\n");
          break;
        }
        case "expand": {
          const middle = Math.floor(lines.length / 2);
          const insertIdx = middle > 0 ? middle : lines.length;
          const expansion = `\n\nI am particularly excited about this opportunity because my background in ${formData.skills || "relevant technologies"} aligns perfectly with the requirements of this role. I have consistently delivered results that exceed expectations, and I am confident I can bring the same level of dedication and expertise to ${formData.companyName || "your organization"}.`;
          lines.splice(insertIdx, 0, expansion);
          improved = lines.join("\n");
          break;
        }
        case "ats": {
          const keywords = (formData.skills || "").split(",").map(s => s.trim()).filter(Boolean);
          if (keywords.length > 0) {
            const atsLine = `\n\nCore competencies include: ${keywords.join(", ")}.`;
            improved = currentContent + atsLine;
          }
          break;
        }
        case "grammar": {
          improved = currentContent
            .replace(/\bi\b/g, "I")
            .replace(/\bi'm\b/g, "I'm")
            .replace(/\bi've\b/g, "I've")
            .replace(/\bi'll\b/g, "I'll")
            .replace(/\bi'd\b/g, "I'd")
            .replace(/\bcan't\b/g, "cannot")
            .replace(/\bwont\b/g, "won't")
            .replace(/\bdont\b/g, "don't");
          break;
        }
        case "rewrite": {
          await handleRegenerate();
          setImproving(false);
          return;
        }
        default:
          break;
      }

      setGeneratedContent(improved);
      editorContentRef.current = improved;
      if (editor) editor.commands.setContent(improved);
      toast.success("Content improved!");
    } catch {
      toast.error("Failed to improve content.");
    } finally {
      setImproving(false);
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

  const previewContent = editor ? editor.getHTML() : editorContentRef.current;
  const hasContent = generatedContent && (editor ? editor.getText().trim() : true);

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
                editorContentRef.current = "";
                if (editor) editor.commands.setContent("");
                
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
                <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-base mb-1">No cover letters yet.</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Create your first one to get started.</p>
                <Button
                  onClick={() => {
                    setEditId(null);
                    setFormData({ jobTitle: "", companyName: "", yourName: "", skills: "", experienceLevel: "mid", tone: "formal" });
                    setGeneratedContent("");
                    editorContentRef.current = "";
                    if (editor) editor.commands.setContent("");
                    
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
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(cl._id)} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                        <FileEdit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => {
                          setFormData({
                            jobTitle: cl.jobTitle || "",
                            companyName: cl.companyName || "",
                            yourName: cl.yourName || "",
                            skills: Array.isArray(cl.skills) ? cl.skills.join(", ") : "",
                            experienceLevel: cl.experienceLevel || "mid",
                            tone: cl.tone || "formal",
                          });
                          setGeneratedContent(cl.content || "");
                          editorContentRef.current = cl.content || "";
                          if (editor) editor.commands.setContent(cl.content || "");
                          setEditId(cl._id);
                          setView("editor");
                        }}
                        className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Duplicate
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(cl._id)} disabled={deletingId === cl._id} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                        {deletingId === cl._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
              editorContentRef.current = "";
              if (editor) editor.commands.setContent("");
              
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={formData.yourName}
                      onChange={(e) => setFormData({ ...formData, yourName: e.target.value })}
                      placeholder={user?.name || "Your name"}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="React, Node.js, TypeScript"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience Level</label>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tone</label>
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
                      <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating your personalized cover letter...</>
                    ) : (
                      <><Wand2 className="h-5 w-5 mr-2" /> Generate Cover Letter</>
                    )}
                  </Button>
                </form>
              </div>

              {hasContent && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    AI Improvements
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" disabled={improving} onClick={() => handleImprove("professional")} className="rounded-xl text-xs">
                      <Award className="h-3.5 w-3.5 mr-1" /> Professional
                    </Button>
                    <Button size="sm" variant="outline" disabled={improving} onClick={() => handleImprove("friendly")} className="rounded-xl text-xs">
                      <Smile className="h-3.5 w-3.5 mr-1" /> Friendly
                    </Button>
                    <Button size="sm" variant="outline" disabled={improving} onClick={() => handleImprove("shorten")} className="rounded-xl text-xs">
                      <Shrink className="h-3.5 w-3.5 mr-1" /> Shorten
                    </Button>
                    <Button size="sm" variant="outline" disabled={improving} onClick={() => handleImprove("expand")} className="rounded-xl text-xs">
                      <Maximize2 className="h-3.5 w-3.5 mr-1" /> Expand
                    </Button>
                    <Button size="sm" variant="outline" disabled={improving} onClick={() => handleImprove("ats")} className="rounded-xl text-xs">
                      <Shield className="h-3.5 w-3.5 mr-1" /> ATS Optimized
                    </Button>
                    <Button size="sm" variant="outline" disabled={improving} onClick={() => handleImprove("grammar")} className="rounded-xl text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Grammar Fix
                    </Button>
                    <Button size="sm" variant="outline" disabled={improving} onClick={() => handleImprove("rewrite")} className="rounded-xl text-xs col-span-2">
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Rewrite
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab("editor")}
                      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition ${activeTab === "editor" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                      <PenLine className="h-4 w-4" /> Editor
                    </button>
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition ${activeTab === "preview" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                      <Eye className="h-4 w-4" /> Preview
                    </button>
                  </div>
                  {lastSaved && (
                    <span className="text-xs text-gray-400 hidden sm:block">
                      <Save className="h-3 w-3 inline mr-1" />
                      Saved {lastSaved}
                    </span>
                  )}
                </div>

                <div className="min-h-[500px]">
                  {!hasContent && !generating ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <FileEdit className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-base mb-1">No content yet</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm">
                        Fill in the details and click "Generate Cover Letter"
                      </p>
                    </div>
                  ) : generating && !hasContent ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Loader2 className="h-12 w-12 text-indigo-500 mb-4 animate-spin" />
                      <p className="text-indigo-600 dark:text-indigo-400 text-base font-medium">
                        Generating your personalized cover letter...
                      </p>
                    </div>
                  ) : activeTab === "preview" ? (
                    <div className="p-8 sm:p-10 bg-white print:bg-white" id="cover-letter-preview">
                      <div className="max-w-[210mm] mx-auto" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <div className="text-center mb-6">
                          {(formData.yourName || user?.name) && (
                            <h1 className="text-xl font-bold text-gray-900 mb-1">{formData.yourName || user?.name}</h1>
                          )}
                          <p className="text-sm text-gray-500">
                            {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>

                        <div className="mb-6">
                          {formData.companyName && (
                            <>
                              <p className="text-sm font-semibold text-gray-800">Hiring Manager</p>
                              <p className="text-sm text-gray-700">{formData.companyName}</p>
                              {formData.companyName && <p className="text-sm text-gray-700">{formData.companyName}</p>}
                            </>
                          )}
                        </div>

                        {formData.jobTitle && (
                          <p className="text-sm font-medium text-gray-800 mb-6">
                            Re: <span className="italic">{formData.jobTitle}</span>
                          </p>
                        )}

                        <div
                          className="text-sm text-gray-800 leading-relaxed space-y-3 preview-content"
                          dangerouslySetInnerHTML={{ __html: previewContent }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <MenuBar editor={editor} />
                      <EditorContent editor={editor} />
                    </>
                  )}
                </div>

                {hasContent && (
                  <div className="flex flex-wrap items-center gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                      {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> {editId ? "Update" : "Save"}</>}
                    </Button>
                    <Button variant="outline" onClick={handleRegenerate} disabled={generating} className="rounded-xl">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RotateCcw className="h-4 w-4 mr-2" /> Regenerate</>}
                    </Button>
                    <Button variant="outline" onClick={handleCopy} className="rounded-xl">
                      <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPDF} className="rounded-xl">
                      <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" onClick={handleDownloadDocx} className="rounded-xl">
                      <FileText className="h-4 w-4 mr-2" /> Word
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="rounded-xl">
                      <Printer className="h-4 w-4 mr-2" /> Print
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cover-letter-preview, #cover-letter-preview * { visibility: visible; }
          #cover-letter-preview { position: absolute; left: 0; top: 0; width: 100%; }
          nav, footer, .no-print { display: none !important; }
        }
        .preview-content p { margin-bottom: 0.75rem; }
        .preview-content ul, .preview-content ol { margin: 0.5rem 0; padding-left: 1.5rem; }
        .preview-content li { margin-bottom: 0.25rem; }
        .preview-content h1, .preview-content h2, .preview-content h3 { margin: 1rem 0 0.5rem; font-weight: 600; }
        .preview-content blockquote { border-left: 3px solid #e5e7eb; padding-left: 1rem; color: #6b7280; margin: 0.75rem 0; }
        .preview-content a { color: #4f46e5; text-decoration: underline; }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror ul { padding-left: 1.5rem; list-style-type: disc; }
        .ProseMirror ol { padding-left: 1.5rem; list-style-type: decimal; }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
        .ProseMirror blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 0.75rem 0; }
        .ProseMirror a { color: #4f46e5; cursor: pointer; }
        .ProseMirror a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}