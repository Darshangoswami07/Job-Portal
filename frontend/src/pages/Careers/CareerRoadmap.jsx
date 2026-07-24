import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { ROADMAP_API_END_POINT } from "@/utils/constant";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Route, Loader2, ArrowLeft, Trash2, CheckCircle, Circle, ChevronRight, BookOpen,
  Target, Clock, TrendingUp, ExternalLink, AlertCircle, Inbox, Zap, Medal, Award,
  Building2, GraduationCap, Lightbulb, Star, Users, GitCompare, Share2, Download,
  Copy, Archive, BarChart3, Calendar, FileText, Search, X, Lock, Sparkles, BrainCircuit,
  CheckCheck, Plus, Eye, Brain, Cpu, Send, Flag, LayoutGrid, Layers,
} from "lucide-react";

const SKILL_COLORS = {
  known: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200",
  improving: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200",
  missing: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200",
};

const SUB_TABS = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "steps", label: "Steps", icon: BookOpen },
  { id: "skill-gap", label: "Skill Gap", icon: GitCompare },
  { id: "weekly", label: "Weekly Plan", icon: Calendar },
  { id: "projects", label: "Projects", icon: Cpu },
  { id: "company", label: "Company Prep", icon: Building2 },
  { id: "certs", label: "Certifications", icon: Award },
  { id: "mentor", label: "AI Mentor", icon: BrainCircuit },
];

function SC() { return <div className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-3"><div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" /><div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" /><div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" /></div>; }

export default function CareerRoadmap() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [togglingStep, setTogglingStep] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmaps");
  const [subTab, setSubTab] = useState("overview");
  const [showWizard, setShowWizard] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorQ, setMentorQ] = useState("");
  const [mentorA, setMentorA] = useState("");
  const [mentorBusy, setMentorBusy] = useState(false);
  const [mentorHist, setMentorHist] = useState([]);
  const [availRoles, setAvailRoles] = useState([]);
  const [availSkills, setAvailSkills] = useState([]);
  const [wtLoading, setWtLoading] = useState(null);
  const [sq, setSq] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catFilter, setCatFilter] = useState("");
  const [catDif, setCatDif] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [addingTitle, setAddingTitle] = useState(null);
  const [addedTitles, setAddedTitles] = useState(new Set());
  const chatRef = useRef(null);

  const [wiz, setWiz] = useState({ cr: "", tr: "", yoe: 0, cs: "", pts: "", edu: "", tc: "", co: "India", wh: 10, tsal: "" });

  useEffect(() => { chatRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mentorHist]);
  useEffect(() => { if (!user) { navigate("/login"); return; } fetchR(); fetchAR(); fetchCatalog(); }, []);
  useEffect(() => { setAddedTitles(new Set(roadmaps.map(r => r.targetRole || r.title.replace("Roadmap: ", "")))); }, [roadmaps]);

  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try { const r = await axios.get(ROADMAP_API_END_POINT + "/catalog", { withCredentials: true }); setCatalog(r.data.catalog || []); }
    catch (e) { /* */ } finally { setCatalogLoading(false); }
  };
  const seedDefaults = async () => {
    setSeeding(true);
    try { const r = await axios.post(ROADMAP_API_END_POINT + "/seed-defaults", {}, { withCredentials: true }); toast.success(r.data.message); fetchR(); fetchD(); }
    catch (e) { const msg = e.response?.data?.message || "Failed to seed defaults"; toast.error(msg); } finally { setSeeding(false); }
  };
  const addDefault = async (roleTitle) => {
    if (addingTitle) return;
    setAddingTitle(roleTitle);
    try {
      const r = await axios.post(ROADMAP_API_END_POINT + "/add-default", { roleTitle }, { withCredentials: true });
      if (r.data.alreadyAdded) { toast.info("Already in your roadmaps"); }
      else { toast.success("Roadmap added!"); }
      setAddedTitles(prev => new Set([...prev, roleTitle]));
      fetchR(); fetchD();
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to add roadmap";
      toast.error(msg);
    } finally { setAddingTitle(null); }
  };

  const fetchR = async () => {
    setLoading(true); setError(null);
    try { const r = await axios.get(ROADMAP_API_END_POINT, { withCredentials: true }); setRoadmaps(r.data.roadmaps || []); }
    catch (e) { if (e.response?.status === 401) { toast.error("Session expired."); navigate("/login"); return; } setError(e.response?.data?.message || "Failed."); }
    finally { setLoading(false); }
  };
  const fetchAR = async () => {
    try { const r = await axios.get(ROADMAP_API_END_POINT + "/available-roles", { withCredentials: true }); setAvailRoles(r.data.roles || []); setAvailSkills(r.data.skills || []); } catch (e) { /* */ }
  };
  const fetchD = useCallback(async () => {
    try { setDashLoading(true); const r = await axios.get(ROADMAP_API_END_POINT + "/dashboard", { withCredentials: true }); setDashboard(r.data.dashboard); } catch (e) { /* */ } finally { setDashLoading(false); }
  }, []);
  useEffect(() => { if (!selectedRoadmap) fetchD(); }, []);

  const hGen = async () => {
    if (!wiz.tr) { toast.error("Target role required"); return; }
    setGenerating(true); setShowWizard(false);
    try {
      await axios.post(ROADMAP_API_END_POINT + "/generate", {
        currentRole: wiz.cr, targetRole: wiz.tr, yearsOfExperience: Number(wiz.yoe) || 0,
        currentSkills: wiz.cs.split(",").map(s => s.trim()).filter(Boolean),
        preferredTechStack: wiz.pts.split(",").map(s => s.trim()).filter(Boolean),
        education: wiz.edu, targetCompanies: wiz.tc.split(",").map(s => s.trim()).filter(Boolean),
        preferredCountry: wiz.co, weeklyStudyHours: Number(wiz.wh) || 10, targetSalary: wiz.tsal ? Number(wiz.tsal) * 100000 : null,
      }, { withCredentials: true });
      toast.success("AI Roadmap generated!"); fetchR();
    } catch (e) { if (e.response?.status === 401) { navigate("/login"); return; } toast.error(e.response?.data?.message || "Failed."); }
    finally { setGenerating(false); }
  };

  const hDel = async (id, e) => {
    e?.stopPropagation();
    try { await axios.delete(ROADMAP_API_END_POINT + "/" + id, { withCredentials: true }); toast.success("Deleted."); if (selectedRoadmap?._id === id) setSelectedRoadmap(null); fetchR(); }
    catch (e) { toast.error("Failed."); }
  };
  const hSel = async (id) => {
    setDetailLoading(true); setSelectedRoadmap(null); setSubTab("overview"); setMentorHist([]); setMentorA("");
    try { const r = await axios.get(ROADMAP_API_END_POINT + "/" + id, { withCredentials: true }); const d = r.data.roadmap || r.data; setSelectedRoadmap(d); setMentorHist(d.aiMentorChat || []); }
    catch (e) { if (e.response?.status === 401) { navigate("/login"); return; } toast.error("Failed."); setSelectedRoadmap(null); } finally { setDetailLoading(false); }
  };
  const hStep = async (idx) => {
    if (!selectedRoadmap) return; setTogglingStep(idx);
    try { const r = await axios.patch(ROADMAP_API_END_POINT + "/" + selectedRoadmap._id + "/step", { stepIndex: idx }, { withCredentials: true }); setSelectedRoadmap(r.data.roadmap || r.data); }
    catch (e) { toast.error(e.response?.data?.message || "Failed."); } finally { setTogglingStep(null); }
  };
  const hDup = async () => {
    if (!selectedRoadmap) return; try { await axios.post(ROADMAP_API_END_POINT + "/" + selectedRoadmap._id + "/duplicate", {}, { withCredentials: true }); toast.success("Duplicated!"); fetchR(); } catch (e) { toast.error("Failed."); }
  };
  const hArc = async () => {
    if (!selectedRoadmap) return; const ns = selectedRoadmap.status === "archived" ? "active" : "archived";
    try { await axios.patch(ROADMAP_API_END_POINT + "/" + selectedRoadmap._id, { status: ns }, { withCredentials: true }); toast.success(ns === "archived" ? "Archived" : "Restored"); setSelectedRoadmap(p => ({ ...p, status: ns })); fetchR(); }
    catch (e) { toast.error("Failed."); }
  };
  const hFav = async () => {
    if (!selectedRoadmap) return; try { await axios.patch(ROADMAP_API_END_POINT + "/" + selectedRoadmap._id, { isFavorite: !selectedRoadmap.isFavorite }, { withCredentials: true }); setSelectedRoadmap(p => ({ ...p, isFavorite: !p.isFavorite })); } catch (e) { toast.error("Failed."); }
  };
  const hWT = async (wi, ti, done) => {
    setWtLoading(wi + "-" + ti);
    try { const r = await axios.patch(ROADMAP_API_END_POINT + "/" + selectedRoadmap._id + "/weekly-plan/task", { weekIndex: wi, taskIndex: ti, completed: done }, { withCredentials: true }); setSelectedRoadmap(p => ({ ...p, weeklyPlan: r.data.weeklyPlan })); }
    catch (e) { toast.error("Failed."); } finally { setWtLoading(null); }
  };
  const hMentor = async () => {
    if (!mentorQ.trim()) return; setMentorBusy(true);
    try { const r = await axios.post(ROADMAP_API_END_POINT + "/ai-mentor", { question: mentorQ, roadmapId: selectedRoadmap?._id }, { withCredentials: true }); setMentorA(r.data.answer); setMentorHist(r.data.history || []); setMentorQ(""); }
    catch (e) { toast.error("Failed."); } finally { setMentorBusy(false); }
  };
  const hExp = async (fmt) => {
    if (!selectedRoadmap) return;
    try { const r = await axios.get(ROADMAP_API_END_POINT + "/" + selectedRoadmap._id + "/export?format=" + fmt, { withCredentials: true });
      if (fmt === "json") { const b = new Blob([JSON.stringify(r.data.export || r.data, null, 2)], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = selectedRoadmap.title.replace(/\s+/g, "-") + ".json"; a.click(); URL.revokeObjectURL(u); toast.success("Exported JSON"); }
      else if (fmt === "markdown") { const b = new Blob([r.data], { type: "text/markdown" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = selectedRoadmap.title.replace(/\s+/g, "-") + ".md"; a.click(); URL.revokeObjectURL(u); toast.success("Exported MD"); }
    } catch (e) { toast.error("Export failed."); }
  };

  if (!user) return null;
  const rm = selectedRoadmap;

  if (rm || detailLoading) {
    const steps = rm?.steps || [];
    const doneSteps = steps.filter(s => s.completed).length;
    const progress = rm?.progress || 0;
    const sg = rm?.skillGap || {};
    const wp = rm?.weeklyPlan || [];
    const certs = rm?.certifications || [];
    const cp = rm?.companyPreparation || {};
    const jm = rm?.jobMarket || {};

    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117] pb-24">
        <Navbar />
        <PageHero badge={rm?.category || "Roadmap"} title={rm?.title || "Loading..."} subtitle={rm?.description || ""} gradient="from-emerald-600 via-teal-700 to-green-900">
          <Button onClick={() => setSelectedRoadmap(null)} variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl px-6 py-5 text-base font-semibold"><ArrowLeft className="h-5 w-5 mr-2" />Back</Button>
        </PageHero>
        {detailLoading ? (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16"><div className="animate-pulse space-y-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div></section>
        ) : rm ? (
          <>
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary" className="capitalize bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700">{rm.targetRole}</Badge>
                {rm.difficulty && <Badge variant="secondary" className="capitalize bg-amber-50 dark:bg-amber-900/30 text-amber-700">{rm.difficulty}</Badge>}
                {rm.estimatedDuration && <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />{rm.estimatedDuration}</Badge>}
                <Badge variant="secondary" className="flex items-center gap-1"><Target className="h-3 w-3" />{steps.length} steps</Badge>
                <Badge variant="secondary" className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{doneSteps}/{steps.length}</Badge>
                <Badge variant="secondary" className={rm.status === "completed" ? "bg-green-100 text-green-700" : rm.status === "archived" ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"}>{rm.status}</Badge>
                <button onClick={hFav} className="p-1 rounded-lg hover:bg-yellow-50"><Star className={"h-4 w-4 " + (rm.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-gray-400")} /></button>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
                <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-500">Overall Progress</span><span className="text-2xl font-bold text-emerald-600">{progress}%</span></div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: progress + "%" }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" /></div>
                <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-500"><span><strong className="text-gray-900 dark:text-white">{rm.hoursLearned || 0}h</strong> learned</span><span><strong className="text-gray-900 dark:text-white">{doneSteps}/{steps.length}</strong> steps</span><span><strong className="text-gray-900 dark:text-white">{rm.weeklyStudyHours || 10}h/wk</strong> pace</span></div>
              </div>
              <div className="flex flex-wrap gap-1 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
                {SUB_TABS.map(t => { const Ic = t.icon; return <button key={t.id} onClick={() => setSubTab(t.id)} className={"flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 " + (subTab === t.id ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700")}><Ic className="h-3.5 w-3.5" />{t.label}</button>; })}
              </div>
              <div className="flex gap-2 mb-6 flex-wrap">
                <Button variant="outline" size="sm" onClick={hDup} className="rounded-xl text-xs h-8"><Copy className="h-3.5 w-3.5 mr-1" />Duplicate</Button>
                <Button variant="outline" size="sm" onClick={hArc} className="rounded-xl text-xs h-8"><Archive className="h-3.5 w-3.5 mr-1" />{rm.status === "archived" ? "Restore" : "Archive"}</Button>
                <Button variant="outline" size="sm" onClick={() => hExp("json")} className="rounded-xl text-xs h-8"><Download className="h-3.5 w-3.5 mr-1" />Export JSON</Button>
                <Button variant="outline" size="sm" onClick={() => hExp("markdown")} className="rounded-xl text-xs h-8"><FileText className="h-3.5 w-3.5 mr-1" />Export MD</Button>
                <Button variant="outline" size="sm" onClick={() => setMentorOpen(!mentorOpen)} className={"rounded-xl text-xs h-8 " + (mentorOpen ? "border-emerald-400 bg-emerald-50" : "")}><BrainCircuit className="h-3.5 w-3.5 mr-1" />AI Mentor</Button>
                <Button variant="outline" size="sm" onClick={(e) => hDel(rm._id, e)} className="rounded-xl text-xs h-8 text-red-500 border-red-200"><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
              </div>
            </section>
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              {subTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { ic: Target, lb: "Target Role", vl: rm.targetRole, sb: rm.currentRole ? "From " + rm.currentRole : "Start journey", cl: "bg-emerald-50 text-emerald-600" },
                      { ic: TrendingUp, lb: "Market Demand", vl: jm.demand || "N/A", sb: (jm.growthRate || 0) + "% growth YoY", cl: "bg-amber-50 text-amber-600" },
                      { ic: Medal, lb: "Avg Salary", vl: jm.averageSalary ? "\u20B9" + (jm.averageSalary / 100000).toFixed(1) + " LPA" : "N/A", sb: jm.competition || "N/A", cl: "bg-blue-50 text-blue-600" },
                      { ic: Users, lb: "Skill Match", vl: (sg.matchScore || 0) + "%", sb: (sg.known?.length || 0) + " of " + ((sg.known?.length || 0) + (sg.missing?.length || 0)) + " skills", cl: "bg-purple-50 text-purple-600" },
                    ].map((c, i) => {
                      const Ic = c.ic;
                      return <motion.div key={c.lb} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 card-shadow">
                        <div className={"h-9 w-9 rounded-lg " + c.cl + " dark:bg-opacity-20 flex items-center justify-center mb-3"}><Ic className="h-4.5 w-4.5" /></div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{c.vl}</p><p className="text-xs text-gray-500 mt-1">{c.sb}</p>
                      </motion.div>;
                    })}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Learning Progress</h3>
                      <div className="space-y-3">{steps.slice(0, 8).map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={"h-6 w-6 rounded-full flex items-center justify-center " + (s.completed ? "bg-emerald-100" : s.locked ? "bg-gray-100" : "bg-blue-100")}>
                            {s.completed ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : s.locked ? <Lock className="h-3.5 w-3.5 text-gray-400" /> : <Circle className="h-4 w-4 text-blue-600" />}
                          </div>
                          <span className={"text-sm flex-1 " + (s.completed ? "line-through text-gray-400" : "text-gray-700")}>{s.title}</span>
                        </div>
                      ))}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Hiring Companies</h3>
                      <p className="text-xs text-gray-500 mb-4">Top employers for {rm.targetRole}</p>
                      <div className="flex flex-wrap gap-2">
                        {(jm.hiringCompanies || rm.targetCompanies || []).slice(0, 8).map(c => <Badge key={c} variant="secondary" className="px-3 py-1.5 rounded-full text-xs bg-gray-50 dark:bg-gray-700"><Building2 className="h-3 w-3 mr-1" />{c}</Badge>)}
                        {(jm.hiringCompanies || []).length === 0 && (rm.targetCompanies || []).length === 0 && <p className="text-sm text-gray-400">No company data</p>}
                      </div>
                      {(jm.trendingSkills || []).length > 0 && <div className="mt-4"><p className="text-xs font-medium text-gray-500 mb-2">Trending Skills</p><div className="flex flex-wrap gap-1.5">{jm.trendingSkills.map(s => <Badge key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{s}</Badge>)}</div></div>}
                    </div>
                  </div>
                  {mentorOpen && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-emerald-500" />AI Career Mentor</h3>
                      <p className="text-xs text-gray-500 mb-4">Ask about your career path, skills gaps, interview prep, or salary goals</p>
                      <div className="max-h-64 overflow-y-auto mb-4 space-y-3">
                        {mentorHist.map((h, i) => (
                          <div key={i}>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-2.5 ml-8 mb-2"><p className="text-sm text-emerald-800"><strong>You:</strong> {h.question}</p></div>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2.5 mr-8"><p className="text-sm text-gray-700 whitespace-pre-line"><strong>AI Mentor:</strong> {h.answer}</p></div>
                          </div>
                        ))}
                        {mentorA && mentorHist.length === 0 && <div className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2.5 mr-8"><p className="text-sm text-gray-700 whitespace-pre-line"><strong>AI Mentor:</strong> {mentorA}</p></div>}
                        <div ref={chatRef} />
                      </div>
                      <div className="flex gap-2">
                        <Input value={mentorQ} onChange={e => setMentorQ(e.target.value)} placeholder="Ask anything..." onKeyDown={e => e.key === "Enter" && hMentor()} className="rounded-xl text-sm flex-1" />
                        <Button onClick={hMentor} disabled={mentorBusy || !mentorQ.trim()} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600">
                          {mentorBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {["What should I learn next?", "Am I ready for interviews?", "What skills am I missing?", "How to reach 25 LPA?"].map(q => (
                          <button key={q} onClick={() => { setMentorQ(q); setTimeout(hMentor, 100); }}
                            className="text-[10px] px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">{q}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {subTab === "steps" && (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-6">{steps.map((step, idx) => {
                    const done = step.completed; const locked = step.locked;
                    return <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className={"relative pl-14 " + (done ? "opacity-80" : "")}>
                      <button onClick={() => !locked && hStep(idx)} disabled={togglingStep === idx || locked} className="absolute left-2 top-1 p-0.5 rounded-full hover:scale-110 disabled:opacity-50">
                        {togglingStep === idx ? <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" /> : done ? <CheckCircle className="h-6 w-6 text-emerald-500" /> : locked ? <Lock className="h-6 w-6 text-gray-300" /> : <Circle className="h-6 w-6 text-gray-300 hover:text-emerald-400" />}
                      </button>
                      <div className={"bg-white dark:bg-gray-800 rounded-xl border p-5 shadow-sm hover:shadow-md " + (done ? "border-emerald-200" : locked ? "border-gray-100 opacity-60" : "border-gray-100")}>
                        <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Step {step.order || idx + 1}</span></div>
                        <h3 className={"text-base font-semibold " + (done ? "line-through text-gray-400" : "text-gray-900")}>{step.title}</h3>
                        {step.description && <p className="text-sm text-gray-500 mt-1">{step.description}</p>}
                        {step.skills?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{step.skills.map((sk, si) => <span key={si} className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-medium">{sk}</span>)}</div>}
                        {step.projects?.length > 0 && <div className="mt-3 pt-3 border-t border-gray-100"><p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1"><Cpu className="h-3 w-3" />Projects</p><div className="flex flex-wrap gap-2">{step.projects.slice(0, 3).map((p, pi) => <Badge key={pi} variant="secondary" className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700">{p.title}</Badge>)}</div></div>}
                        {step.resources?.length > 0 && <div className="mt-3 pt-3 border-t border-gray-100"><p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1"><BookOpen className="h-3 w-3" />Resources</p><div className="flex flex-wrap gap-1.5">{step.resources.slice(0, 4).map((r, ri) => <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"><ExternalLink className="h-2.5 w-2.5" />{r.platform || r.title?.slice(0, 20)}</a>)}</div></div>}
                      </div>
                    </motion.div>;
                  })}</div>
                </div>
              )}
              {subTab === "skill-gap" && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                      { key: "known", title: "Known", icon: CheckCheck, color: SKILL_COLORS.known, items: sg.known || [], iconBg: "bg-emerald-50 text-emerald-600" },
                      { key: "needsImprovement", title: "Needs Work", icon: Zap, color: SKILL_COLORS.improving, items: sg.needsImprovement || [], iconBg: "bg-amber-50 text-amber-600" },
                      { key: "missing", title: "Missing", icon: X, color: SKILL_COLORS.missing, items: sg.missing || [], iconBg: "bg-red-50 text-red-600" },
                    ].map((sec, i) => {
                      const Ic = sec.icon;
                      return <motion.div key={sec.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                        <div className="flex items-center gap-3 mb-3"><div className={"h-8 w-8 rounded-lg " + sec.iconBg + " dark:bg-opacity-20 flex items-center justify-center"}><Ic className="h-4 w-4" /></div><h3 className="font-semibold text-gray-900">{sec.title}</h3></div>
                        <div className="flex flex-wrap gap-1.5">{sec.items.slice(0, 20).map(s => <Badge key={s} className={"text-[10px] px-2 py-0.5 rounded-full " + sec.color}>{s}</Badge>)}</div>
                      </motion.div>;
                    })}
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill Match Analysis</h3>
                    <p className="text-sm text-gray-500 whitespace-pre-line">{sg.analysis || "No analysis available."}</p>
                    <div className="mt-4"><div className="flex items-center justify-between text-sm mb-1"><span>Match Score</span><span className="font-bold text-emerald-600">{sg.matchScore || 0}%</span></div>
                      <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: (sg.matchScore || 0) + "%" }} transition={{ duration: 1 }} className={"h-full rounded-full " + ((sg.matchScore || 0) >= 70 ? "bg-emerald-500" : (sg.matchScore || 0) >= 40 ? "bg-amber-500" : "bg-red-500")} /></div>
                    </div>
                  </div>
                </div>
              )}
              {subTab === "weekly" && (
                wp.length === 0 ? <div className="text-center py-12"><Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No weekly plan yet.</p></div> :
                <div className="space-y-4">{wp.map((week, wi) => (
                  <motion.div key={wi} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: wi * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Week {week.week}</span><h4 className="font-semibold text-sm text-gray-900">{week.title}</h4></div>
                      {week.completed && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Done</Badge>}
                    </div>
                    <div className="p-5 space-y-2">{week.tasks.map((task, ti) => (
                      <div key={ti} className="flex items-center gap-3 py-1.5">
                        <button onClick={() => hWT(wi, ti, !task.completed)} disabled={wtLoading === wi + "-" + ti} className="shrink-0">
                          {wtLoading === wi + "-" + ti ? <Loader2 className="h-4.5 w-4.5 text-emerald-500 animate-spin" /> : task.completed ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500" /> : <Circle className="h-4.5 w-4.5 text-gray-300 hover:text-emerald-400" />}
                        </button>
                        <div className="flex-1 min-w-0"><p className={"text-sm " + (task.completed ? "line-through text-gray-400" : "text-gray-700")}>{task.title}</p>{task.description && <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>}</div>
                        {task.estimatedHours && <span className="text-[10px] text-gray-400 shrink-0">{task.estimatedHours}h</span>}
                      </div>
                    ))}</div>
                  </motion.div>
                ))}</div>
              )}
              {subTab === "projects" && (
                steps.filter(s => s.projects?.length > 0).length === 0 ? <div className="text-center py-12"><Cpu className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No projects recommended.</p></div> :
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {steps.filter(s => s.projects?.length > 0).flatMap(s => s.projects).map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 hover:shadow-lg">
                      <div className="flex items-start justify-between mb-2"><h3 className="font-semibold text-gray-900 text-sm">{p.title}</h3>
                        <Badge variant="secondary" className={"text-[10px] px-2 py-0.5 " + (p.difficulty === "beginner" ? "bg-green-50 text-green-700" : p.difficulty === "intermediate" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>{p.difficulty}</Badge></div>
                      <p className="text-xs text-gray-500 mb-3">{p.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.estimatedTime || "N/A"}</span>{p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 hover:underline"><ExternalLink className="h-3 w-3" />GitHub</a>}</div>
                      {p.skills?.length > 0 && <div className="flex flex-wrap gap-1 mt-3">{p.skills.slice(0, 4).map(s => <Badge key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500">{s}</Badge>)}</div>}
                    </motion.div>
                  ))}
                </div>
              )}
              {subTab === "company" && (
                !cp?.companyName ? <div className="text-center py-12"><Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No company preparation data.</p></div> :
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{cp.companyName}</h3>
                    <p className="text-sm text-gray-500">{cp.overview || "Preparation guide"}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div><p className="text-xs font-medium text-gray-500 mb-2">DS&A Topics</p><div className="flex flex-wrap gap-1.5">{(cp.dsaTopics || []).map(t => <Badge key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{t}</Badge>)}</div></div>
                      <div><p className="text-xs font-medium text-gray-500 mb-2">System Design</p><div className="flex flex-wrap gap-1.5">{(cp.systemDesignTopics || []).map(t => <Badge key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{t}</Badge>)}</div></div>
                    </div>
                  </div>
                  <div className="space-y-3"><h4 className="font-semibold text-gray-900">Interview Rounds</h4>{(cp.interviewRounds || []).map((round, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                      <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Round {i + 1}</span><h5 className="font-semibold text-sm text-gray-900">{round.round}</h5></div>
                      <div className="flex flex-wrap gap-1.5 mb-2">{(round.topics || []).map(t => <Badge key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50">{t}</Badge>)}</div>
                      {(round.tips || []).length > 0 && <p className="text-xs text-gray-400 italic">Tip: {round.tips[0]}</p>}
                    </motion.div>
                  ))}</div>
                </div>
              )}
              {subTab === "certs" && (
                certs.length === 0 ? <div className="text-center py-12"><Award className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No certifications yet.</p></div> :
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{certs.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5">
                    <div className="flex items-center justify-between mb-2"><div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center"><Award className="h-4 w-4 text-amber-600" /></div>{c.recommended && <Badge className="text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-700">Recommended</Badge>}</div>
                    <h3 className="font-semibold text-sm text-gray-900">{c.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{c.provider}</p>
                    <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400"><span>{c.cost || "N/A"}</span><span>{c.duration || "N/A"}</span></div>
                    {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:underline"><ExternalLink className="h-2.5 w-2.5" />Details</a>}
                  </motion.div>
                ))}</div>
              )}
            </section>
          </>
        ) : null}
        <CTABanner title="Master Your Tech Career" subtitle="Stay consistent, track progress, and become job-ready." buttonText="Back" buttonLink="/careers/roadmap" gradient="from-emerald-600 via-teal-700 to-green-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero badge="Your Journey Starts Here" title="AI Career Roadmaps" subtitle="Generate personalized learning paths. Track progress. Get AI mentorship. Land your dream job." gradient="from-emerald-600 via-teal-700 to-green-900">
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => { if (!user) { navigate("/login"); return; } setShowWizard(true); }} disabled={generating}
            className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-8 py-5 text-base font-semibold shadow-lg">
            {generating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-5 w-5 mr-2" />Create My Roadmap</>}
          </Button>
        </div>
        {showWizard && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 text-left">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-emerald-500" />AI Roadmap Generator</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Current Role</Label><Input placeholder="e.g. Frontend Developer" value={wiz.cr} onChange={e => setWiz(p => ({ ...p, cr: e.target.value }))} list="rl" className="rounded-xl text-sm h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Target Role *</Label><Input placeholder="e.g. Full Stack Developer" value={wiz.tr} onChange={e => setWiz(p => ({ ...p, tr: e.target.value }))} list="rl" className="rounded-xl text-sm h-9" /></div>
              <datalist id="rl">{availRoles.map(r => <option key={r} value={r} />)}</datalist>
              <div className="space-y-1"><Label className="text-xs">Years of Experience</Label><Input type="number" min="0" value={wiz.yoe} onChange={e => setWiz(p => ({ ...p, yoe: e.target.value }))} className="rounded-xl text-sm h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Current Skills (comma sep.)</Label><Input placeholder="React, JavaScript" value={wiz.cs} onChange={e => setWiz(p => ({ ...p, cs: e.target.value }))} list="sl" className="rounded-xl text-sm h-9" /></div>
              <datalist id="sl">{availSkills.map(s => <option key={s} value={s} />)}</datalist>
              <div className="space-y-1"><Label className="text-xs">Tech Stack</Label><Input placeholder="React, Node.js, AWS" value={wiz.pts} onChange={e => setWiz(p => ({ ...p, pts: e.target.value }))} className="rounded-xl text-sm h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Education</Label><Input placeholder="B.Tech, MCA..." value={wiz.edu} onChange={e => setWiz(p => ({ ...p, edu: e.target.value }))} className="rounded-xl text-sm h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Target Companies</Label><Input placeholder="Google, Microsoft, Amazon" value={wiz.tc} onChange={e => setWiz(p => ({ ...p, tc: e.target.value }))} className="rounded-xl text-sm h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Target Salary (LPA)</Label><Input type="number" placeholder="e.g. 25" value={wiz.tsal} onChange={e => setWiz(p => ({ ...p, tsal: e.target.value }))} className="rounded-xl text-sm h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Weekly Study Hours</Label><Input type="number" min="2" value={wiz.wh} onChange={e => setWiz(p => ({ ...p, wh: e.target.value }))} className="rounded-xl text-sm h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Country</Label><Input value={wiz.co} onChange={e => setWiz(p => ({ ...p, co: e.target.value }))} className="rounded-xl text-sm h-9" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={hGen} disabled={generating || !wiz.tr} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 flex-1">
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}{generating ? "Generating..." : "Generate AI Roadmap"}
              </Button>
              <Button variant="outline" onClick={() => setShowWizard(false)} className="rounded-xl">Cancel</Button>
            </div>
          </motion.div>
        )}
      </PageHero>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {[{ id: "roadmaps", label: "My Roadmaps", icon: Route }, { id: "catalog", label: "Catalog", icon: LayoutGrid }, { id: "dashboard", label: "Dashboard", icon: BarChart3 }].map(tab => {
            const Ic = tab.icon;
            return <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === "dashboard") fetchD(); }}
              className={"flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 " + (activeTab === tab.id ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700")}>
              <Ic className="h-4 w-4" />{tab.label}
            </button>;
          })}
        </div>

        {activeTab === "roadmaps" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Roadmaps</h2><p className="text-sm text-gray-500 mt-1">{roadmaps.length} roadmap{roadmaps.length !== 1 ? "s" : ""}</p></div>
              <Button onClick={() => setShowWizard(true)} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"><Plus className="h-4 w-4 mr-2" />New Roadmap</Button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <SC key={i} />)}</div>
            ) : error ? (
              <div className="flex flex-col items-center py-16"><AlertCircle className="h-12 w-12 text-red-500 mb-4" /><p className="text-red-500 text-sm mb-4">{error}</p><Button onClick={fetchR} variant="outline" className="rounded-xl">Retry</Button></div>
            ) : roadmaps.length === 0 ? (
              <div className="flex flex-col items-center py-20">
                <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-6"><Route className="h-10 w-10 text-emerald-500" /></div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No roadmaps yet</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-md text-center">Create your first AI-powered career roadmap. Tell us your goals and we'll generate a personalized learning path.</p>
                <Button onClick={() => setShowWizard(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-5 text-base"><Sparkles className="h-5 w-5 mr-2" />Create My First Roadmap</Button>
              </div>
            ) : (
              <>
                <div className="mb-4"><Input placeholder="Search roadmaps..." value={sq} onChange={e => setSq(e.target.value)} className="rounded-xl text-sm max-w-md" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roadmaps.filter(r => !sq || r.title.toLowerCase().includes(sq.toLowerCase())).map((rm, i) => (
                    <motion.div key={rm._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                      className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
                      onClick={() => hSel(rm._id)}>
                      <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2"><h3 className="text-base font-semibold text-gray-900 truncate">{rm.title}</h3>
                          <button onClick={(e) => hDel(rm._id, e)} className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button></div>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-1">{rm.targetRole || "Career path"}</p>
                        <div className="mb-3"><div className="flex items-center justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span>{rm.progress || 0}%</span></div>
                          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: (rm.progress || 0) + "%" }} /></div></div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            {rm.category && <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 capitalize bg-emerald-50 text-emerald-700">{rm.category}</Badge>}
                            {rm.difficulty && <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 capitalize bg-amber-50 text-amber-700">{rm.difficulty}</Badge>}
                            {rm.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                          </div>
                          <div className="flex items-center text-emerald-600 text-xs font-medium group-hover:gap-2 transition-all">View<ChevronRight className="h-3 w-3 ml-0.5" /></div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "catalog" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Roadmap Catalog</h2><p className="text-sm text-gray-500 mt-1">{catalog.length} templates</p></div>
              <div className="flex gap-2">
                <Button onClick={seedDefaults} disabled={seeding} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm">
                  {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}{seeding ? "Adding..." : "Add All Defaults"}
                </Button>
                <Button onClick={() => setShowWizard(true)} variant="outline" className="rounded-xl"><Plus className="h-4 w-4 mr-2" />Custom</Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search roadmaps..." value={catSearch} onChange={e => setCatSearch(e.target.value)} className="rounded-xl text-sm pl-9" /></div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                <option value="">All Categories</option>
                {[...new Set(catalog.map(c => c.category))].sort().map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select value={catDif} onChange={e => setCatDif(e.target.value)} className="rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            {catalogLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <SC key={i} />)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalog.filter(c => {
                  if (catFilter && c.category !== catFilter) return false;
                  if (catDif && c.difficulty !== catDif) return false;
                  if (catSearch && !c.title.toLowerCase().includes(catSearch.toLowerCase()) && !c.description?.toLowerCase().includes(catSearch.toLowerCase())) return false;
                  return true;
                }).map((c, i) => {
                  const mkts = c.jobMarket || {};
                  return <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all group">
                    {c.isTrending && <div className="absolute top-3 right-3"><Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] px-2 py-0.5"><TrendingUp className="h-2.5 w-2.5 mr-1" />Trending</Badge></div>}
                    <div className={"h-2 bg-gradient-to-r " + (c.difficulty === "Beginner" ? "from-emerald-400 to-teal-500" : c.difficulty === "Intermediate" ? "from-amber-400 to-orange-500" : "from-red-400 to-rose-500")} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{c.title}</h3>
                          <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{c.category}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 capitalize">{c.difficulty}</Badge>
                        {(c.estimatedDuration || c.duration) && <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{c.estimatedDuration || c.duration}</Badge>}
                        {(c.modules || c.modulesCount) && <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 flex items-center gap-1"><Layers className="h-2.5 w-2.5" />{c.modules || c.modulesCount} modules</Badge>}
                      </div>
                      {mkts.averageSalary && <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Medal className="h-3 w-3 text-amber-500" />{mkts.averageSalary}</div>}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: ((c.demandScore || 3) * 20) + "%" }} /></div>
                        <span className="text-[10px] font-medium text-gray-500">Demand {(c.demandScore || 3) * 20}%</span>
                      </div>
                      {addedTitles.has(c.title) ? (
                        <Button disabled size="sm" className="w-full rounded-xl bg-emerald-100 text-emerald-700 text-xs h-8 cursor-default border border-emerald-200">
                          <CheckCheck className="h-3 w-3 mr-1" />Added
                        </Button>
                      ) : (
                        <Button onClick={() => addDefault(c.title)} disabled={addingTitle === c.title} size="sm" className={"w-full rounded-xl text-xs h-8 " + (addingTitle === c.title ? "bg-gray-400 cursor-wait" : "bg-emerald-600 hover:bg-emerald-700 text-white")}>
                          {addingTitle === c.title ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}{addingTitle === c.title ? "Adding..." : "Add to My Roadmaps"}
                        </Button>
                      )}
                    </div>
                  </motion.div>;
                })}
                {catalog.filter(c => {
                  if (catFilter && c.category !== catFilter) return false;
                  if (catDif && c.difficulty !== catDif) return false;
                  if (catSearch && !c.title.toLowerCase().includes(catSearch.toLowerCase()) && !c.description?.toLowerCase().includes(catSearch.toLowerCase())) return false;
                  return true;
                }).length === 0 && !catalogLoading && (
                  <div className="col-span-full flex flex-col items-center py-16"><Inbox className="h-12 w-12 text-gray-300 mb-4" /><p className="text-gray-500 text-sm">No roadmaps match your filters.</p></div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "dashboard" && (
          <div>
            {dashLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <SC key={i} />)}</div> :
            !dashboard ? <div className="text-center py-16"><BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No data yet. Create a roadmap first.</p></div> : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { lb: "Overall Progress", vl: dashboard.overallProgress + "%", ic: Target, cl: "text-emerald-600", bg: "bg-emerald-50" },
                    { lb: "Active Roadmaps", vl: dashboard.activeRoadmaps, ic: Route, cl: "text-blue-600", bg: "bg-blue-50" },
                    { lb: "Hours Learned", vl: dashboard.hoursLearned + "h", ic: Clock, cl: "text-amber-600", bg: "bg-amber-50" },
                    { lb: "Projects Done", vl: dashboard.projectsCompleted, ic: Cpu, cl: "text-purple-600", bg: "bg-purple-50" },
                    { lb: "Steps Completed", vl: dashboard.completedSteps + "/" + dashboard.totalSteps, ic: CheckCircle, cl: "text-green-600", bg: "bg-green-50" },
                    { lb: "Skills Known", vl: dashboard.knownSkills, ic: Brain, cl: "text-indigo-600", bg: "bg-indigo-50" },
                    { lb: "Interview Readiness", vl: dashboard.interviewReadiness + "%", ic: Award, cl: "text-pink-600", bg: "bg-pink-50" },
                    { lb: "Current Streak", vl: dashboard.currentStreak + " days", ic: Zap, cl: "text-orange-600", bg: "bg-orange-50" },
                  ].map((card, i) => {
                    const Ic = card.ic;
                    return <motion.div key={card.lb} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 card-shadow">
                      <div className={"h-8 w-8 rounded-lg " + card.bg + " flex items-center justify-center mb-2"}><Ic className={"h-4 w-4 " + card.cl} /></div>
                      <p className="text-xl font-bold text-gray-900">{card.vl}</p><p className="text-[10px] text-gray-500 mt-0.5">{card.lb}</p>
                    </motion.div>;
                  })}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Roadmaps</h3>
                  {(!dashboard.roadmaps || dashboard.roadmaps.length === 0) ? <p className="text-sm text-gray-400">No active roadmaps</p> : (
                    <div className="space-y-3">{dashboard.roadmaps.map(r => (
                      <div key={r._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{r.title}</p><p className="text-xs text-gray-500">{r.targetRole}</p></div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: r.progress + "%" }} /></div>
                          <span className="text-xs font-medium text-gray-500 w-8 text-right">{r.progress}%</span>
                          <Button variant="ghost" size="sm" onClick={() => hSel(r._id)} className="text-emerald-600 text-xs p-1 h-auto"><ChevronRight className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <CTABanner title="Chart Your Career Path" subtitle="Get a personalized roadmap tailored to your goals, skill level, and timeline." buttonText="Get Started" buttonLink="/signup" gradient="from-emerald-600 via-teal-700 to-green-900" />
    </div>
  );
}
