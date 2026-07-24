import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { INTERVIEW_API_END_POINT } from "@/utils/constant";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Timer, ChevronLeft, ChevronRight, CheckCircle, XCircle, BarChart3, Clock, Send,
  RotateCcw, Loader2, AlertCircle, Inbox, Brain, Award, MessageSquare, History, Play,
  Settings, ChevronDown, Download, Trash2, BookOpen, Lightbulb, Sparkles,
  ArrowRight, HelpCircle,
} from "lucide-react";

const categoryColors = [
  "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
  "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
];

const difficultyLevels = ["easy", "medium", "hard"];
const questionCountOptions = [3, 5, 7];
const timeOptions = [
  { label: "60s", value: 60 },
  { label: "120s", value: 120 },
  { label: "180s", value: 180 },
];

function CircularProgress({ value, size = 140, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#10B981" : value >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200 dark:text-gray-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(value)}%</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overall</span>
      </div>
    </div>
  );
}

function TimerBar({ remaining, total }) {
  const pct = (remaining / total) * 100;
  const color = pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300 min-w-[4rem] text-right">{remaining}s</span>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "correct") return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0"><CheckCircle className="h-3 w-3 mr-1" />Correct</Badge>;
  if (status === "partial") return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0"><HelpCircle className="h-3 w-3 mr-1" />Partially Correct</Badge>;
  if (status === "incorrect") return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0"><XCircle className="h-3 w-3 mr-1" />Incorrect</Badge>;
  return <Badge variant="outline"><HelpCircle className="h-3 w-3 mr-1" />Unanswered</Badge>;
}

export default function MockInterview() {
  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams();
  const { user } = useSelector((store) => store.auth);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);
  const resultsRef = useRef(null);
  const timerReadyRef = useRef(false);

  const [view, setView] = useState(paramSessionId ? "results" : "welcome");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(120);

  const [session, setSession] = useState(null);
  const [resultsSession, setResultsSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [completionLabel, setCompletionLabel] = useState("");

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingSessionDetail, setLoadingSessionDetail] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [loadingResults, setLoadingResults] = useState(false);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to access Mock Interview");
      navigate("/login");
      return;
    }
    if (paramSessionId) {
      fetchSessionResults(paramSessionId);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${INTERVIEW_API_END_POINT}/categories`, { withCredentials: true });
        setCategories(res.data.categories || res.data.data || res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          navigate("/login");
          return;
        }
        const msg = err.response?.data?.message || "Failed to load interview categories";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, navigate, paramSessionId]);

  useEffect(() => {
    if (view !== "interview" || !session || interviewCompleted) return;
    timerReadyRef.current = false;
    setAnswer("");
    setTimeLeft(session.timePerQuestion || timePerQuestion);
    setTimeout(() => textareaRef.current?.focus(), 100);
    scrollToTop();
  }, [view, currentIndex, session, interviewCompleted, timePerQuestion, scrollToTop]);

  useEffect(() => {
    if (view !== "interview" || !session || interviewCompleted) return;
    if (timeLeft <= 0) {
      if (timerReadyRef.current) {
        handleAutoSubmit();
      }
      return;
    }
    timerReadyRef.current = true;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    timerRef.current = id;
    return () => clearInterval(id);
  }, [view, session, currentIndex, interviewCompleted, timeLeft]);

  async function fetchSessionResults(sid) {
    try {
      setLoadingResults(true);
      const res = await axios.get(`${INTERVIEW_API_END_POINT}/sessions/${sid}`, { withCredentials: true });
      const data = res.data.session || res.data.data || res.data;
      setResultsSession(data);
      setView("results");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load results";
      toast.error(msg);
      navigate("/mock-interview");
    } finally {
      setLoadingResults(false);
    }
  }

  const advanceToNextQuestion = useCallback(() => {
    if (!session) return;
    const total = session.totalQuestions || session.questions?.length || 1;
    const nextIdx = currentIndex + 1;
    if (nextIdx < total) {
      setCurrentIndex(nextIdx);
      setAnswer("");
      setTimeLeft(session.timePerQuestion || timePerQuestion);
    }
  }, [currentIndex, session, timePerQuestion]);

  const handleStartInterview = async () => {
    if (!selectedCategory) { toast.error("Please select a category"); return; }
    try {
      setStarting(true);
      setInterviewCompleted(false);
      const res = await axios.post(
        `${INTERVIEW_API_END_POINT}/start`,
        { category: selectedCategory._id || selectedCategory.id, difficulty, timePerQuestion, questionCount },
        { withCredentials: true }
      );
      const data = res.data.session || res.data.data || res.data;
      setSession(data);
      setCurrentIndex(0);
      setAnswer("");
      setView("interview");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to start interview";
      toast.error(msg);
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) { toast.error("Please provide an answer"); return; }
    if (submitting || interviewCompleted) return;
    try {
      setSubmitting(true);
      const duration = (session.timePerQuestion || timePerQuestion) - timeLeft;
      const res = await axios.post(
        `${INTERVIEW_API_END_POINT}/submit-answer`,
        {
          sessionId: session._id || session.id,
          questionIndex: currentIndex,
          answer: answer.trim(),
          duration: Math.max(duration, 0),
        },
        { withCredentials: true }
      );

      const data = res.data;
      setSession((prev) => {
        if (!prev) return prev;
        const qs = [...(prev.questions || [])];
        qs[currentIndex] = { ...qs[currentIndex], answer: answer.trim() };
        return { ...prev, questions: qs };
      });

      if (data.completed) {
        setInterviewCompleted(true);
        setCompletionLabel("Interview completed. Analyzing your performance...");
        setTimeout(() => setCompletionLabel("Evaluating all answers..."), 1500);
        setTimeout(() => setCompletionLabel("Generating AI feedback..."), 3000);
        setTimeout(() => setCompletionLabel("Preparing interview report..."), 4500);
        setTimeout(() => {
          fetchSessionResults(data.sessionId || session._id || session.id);
        }, 6000);
      } else {
        advanceToNextQuestion();
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes("already been answered")) {
        advanceToNextQuestion();
        return;
      }
      const msg = err.response?.data?.message || "Failed to submit answer";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    if (interviewCompleted || submitting) return;
    if (!answer.trim()) {
      setSubmitting(true);
      const duration = (session?.timePerQuestion || timePerQuestion);
      axios.post(
        `${INTERVIEW_API_END_POINT}/submit-answer`,
        { sessionId: session?._id || session?.id, questionIndex: currentIndex, answer: "", duration: Math.max(duration, 0) },
        { withCredentials: true }
      ).then((res) => {
        const data = res.data;
        if (data.completed) {
          setInterviewCompleted(true);
          setCompletionLabel("Interview completed. Analyzing your performance...");
          setTimeout(() => setCompletionLabel("Evaluating all answers..."), 1500);
          setTimeout(() => setCompletionLabel("Generating AI feedback..."), 3000);
          setTimeout(() => setCompletionLabel("Preparing interview report..."), 4500);
          setTimeout(() => fetchSessionResults(data.sessionId || session._id || session.id), 6000);
        } else {
          advanceToNextQuestion();
        }
      }).catch(() => {}).finally(() => setSubmitting(false));
      return;
    }
    handleSubmitAnswer();
  };

  const handleViewHistory = async () => {
    try {
      setLoadingSessions(true);
      const res = await axios.get(`${INTERVIEW_API_END_POINT}/sessions`, { withCredentials: true });
      const data = res.data.sessions || res.data.data || res.data;
      setSessions(Array.isArray(data) ? data : []);
      setView("history");
      setSelectedSession(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load history";
      toast.error(msg);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleViewSessionDetail = async (sid) => {
    try {
      setLoadingSessionDetail(true);
      const res = await axios.get(`${INTERVIEW_API_END_POINT}/sessions/${sid}`, { withCredentials: true });
      const data = res.data.session || res.data.data || res.data;
      setSelectedSession(data);
      setReviewIndex(0);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load session detail";
      toast.error(msg);
    } finally {
      setLoadingSessionDetail(false);
    }
  };

  const handleDeleteSession = async (sid) => {
    if (!confirm("Delete this interview session?")) return;
    try {
      setDeleting(sid);
      await axios.delete(`${INTERVIEW_API_END_POINT}/sessions/${sid}`, { withCredentials: true });
      setSessions((prev) => prev.filter((s) => (s._id || s.id) !== sid));
      toast.success("Session deleted");
    } catch (err) {
      toast.error("Failed to delete session");
    } finally {
      setDeleting(null);
    }
  };

  const handleRetryIncorrect = () => {
    if (!selectedSession?.questions) return;
    const incorrect = selectedSession.questions.filter((q) => q.status === "incorrect" || q.status === "unanswered");
    if (incorrect.length === 0) { toast.success("No incorrect questions to retry!"); return; }
    setSession({
      ...selectedSession,
      questions: incorrect.map((q) => ({ _id: q._id, question: q.question, difficulty: q.difficulty, tags: q.tags })),
      totalQuestions: incorrect.length,
      timePerQuestion: selectedSession.timePerQuestion || 120,
    });
    setCurrentIndex(0);
    setAnswer("");
    setInterviewCompleted(false);
    setView("interview");
  };

  const generatePDF = async (sessionData) => {
    try {
      setGeneratingPdf(true);
      const element = document.getElementById("pdf-content");
      if (!element) { toast.error("PDF content not found"); return; }
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`interview-report-${sessionData?._id || "unknown"}.pdf`);
      toast.success("PDF report downloaded");
    } catch (err) {
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const getOverallPercent = (qList) => {
    if (!qList || qList.length === 0) return 0;
    const total = qList.reduce((sum, q) => sum + ((q.score ?? q.feedback?.score) || 0), 0);
    return (total / (qList.length * 10)) * 100;
  };

  const getTotalScore = (qList) => {
    if (!qList) return 0;
    return qList.reduce((sum, q) => sum + ((q.score ?? q.feedback?.score) || 0), 0);
  };

  const getStatusCounts = (qList) => {
    if (!qList) return { correct: 0, partial: 0, incorrect: 0, unanswered: 0 };
    return {
      correct: qList.filter((q) => q.status === "correct").length,
      partial: qList.filter((q) => q.status === "partial").length,
      incorrect: qList.filter((q) => q.status === "incorrect" || (!q.status && q.answer)).length,
      unanswered: qList.filter((q) => !q.answer).length,
    };
  };

  const renderCategories = () => {
    if (loading) return <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" /><p className="text-gray-500 dark:text-gray-400">Loading categories...</p></div>;
    if (error) return <div className="flex flex-col items-center justify-center py-20"><AlertCircle className="h-12 w-12 text-red-400 mb-4" /><p className="text-red-500 dark:text-red-400 font-medium mb-2">Failed to load categories</p><p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{error}</p><Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl"><RotateCcw className="h-4 w-4 mr-2" />Try Again</Button></div>;
    if (!categories || categories.length === 0) return <div className="flex flex-col items-center justify-center py-20"><Inbox className="h-12 w-12 text-gray-400 mb-4" /><p className="text-gray-500 dark:text-gray-400 font-medium">No categories available yet</p><p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Check back later for new interview categories.</p></div>;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, i) => {
          const isSelected = selectedCategory?._id === cat._id || selectedCategory?.id === cat.id;
          return (
            <motion.div key={cat._id || cat.name || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedCategory(cat)}
              className={`bg-white dark:bg-gray-800 rounded-2xl border-2 card-shadow p-6 text-center hover:shadow-lg transition-all cursor-pointer ${isSelected ? "border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20" : "border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800"}`}>
              <div className={`h-14 w-14 rounded-xl ${categoryColors[i % categoryColors.length]} flex items-center justify-center mx-auto mb-4`}><MessageSquare className="h-6 w-6" /></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
              {cat.skills && cat.skills.length > 0 && <div className="flex flex-wrap justify-center gap-1 mt-2">{cat.skills.slice(0, 3).map((skill) => <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">{skill}</Badge>)}{cat.skills.length > 3 && <span className="text-[10px] text-gray-400 dark:text-gray-500">+{cat.skills.length - 3}</span>}</div>}
              {isSelected && <div className="mt-3"><Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0"><CheckCircle className="h-3 w-3 mr-1" />Selected</Badge></div>}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderConfigPanel = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Settings className="h-5 w-5 text-emerald-500" />Interview Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
          <div className="flex gap-2">{difficultyLevels.map((d) => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${difficulty === d ? "bg-emerald-500 text-white shadow-md" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Questions</label>
          <div className="flex gap-2">{questionCountOptions.map((n) => (
            <button key={n} onClick={() => setQuestionCount(n)}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${questionCount === n ? "bg-emerald-500 text-white shadow-md" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
              {n}
            </button>
          ))}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time per Question</label>
          <div className="flex gap-2">{timeOptions.map((t) => (
            <button key={t.value} onClick={() => setTimePerQuestion(t.value)}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${timePerQuestion === t.value ? "bg-emerald-500 text-white shadow-md" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
              {t.label}
            </button>
          ))}</div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Button onClick={handleStartInterview} disabled={!selectedCategory || starting} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-5 text-base font-semibold shadow-lg">
          {starting ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Starting...</> : <><Play className="h-5 w-5 mr-2" />Start Interview</>}
        </Button>
        <Button variant="outline" onClick={handleViewHistory} className="rounded-xl px-6 py-5 text-base"><History className="h-5 w-5 mr-2" />View History</Button>
      </div>
    </motion.div>
  );

  const renderInterview = () => {
    if (!session || !session.questions || session.questions.length === 0) {
      return <div className="flex flex-col items-center justify-center py-20"><AlertCircle className="h-12 w-12 text-amber-400 mb-4" /><p className="text-gray-500 dark:text-gray-400">No questions loaded for this session.</p></div>;
    }

    const totalQuestions = session.totalQuestions || session.questions.length;
    const question = session.questions[currentIndex];
    const progress = (currentIndex / totalQuestions) * 100;

    if (interviewCompleted) {
      return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-16 w-16 text-emerald-500 animate-spin mb-8" />
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{completionLabel || "Interview completed. Analyzing your performance..."}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we evaluate your answers...</p>
            <div className="mt-8 w-72 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        </section>
      );
    }

    if (!question) return null;

    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1"><MessageSquare className="h-3.5 w-3.5 mr-1" />{session.category || "Interview"}</Badge>
                <Badge variant="secondary" className="text-sm"><Brain className="h-3.5 w-3.5 mr-1" />{question.difficulty || session.difficulty || "medium"}</Badge>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 text-sm">Question {currentIndex + 1} of {totalQuestions}</Badge>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <TimerBar remaining={timeLeft} total={session.timePerQuestion || timePerQuestion} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {typeof question === "string" ? question : question.question || `Question ${currentIndex + 1}`}
            </h2>
            <div className="space-y-4">
              <textarea ref={textareaRef} value={answer} onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..." disabled={submitting}
                className="w-full min-h-[180px] p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y text-base" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{answer.length} character{answer.length !== 1 ? "s" : ""}</span>
                <Button onClick={handleSubmitAnswer} disabled={submitting || !answer.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2">
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Answer
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    );
  };

  const renderResults = () => {
    const s = resultsSession;
    if (loadingResults) return <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" /><p className="text-gray-500 dark:text-gray-400">Loading results...</p></div>;
    if (!s || !s.questions) return <div className="flex flex-col items-center justify-center min-h-screen"><AlertCircle className="h-12 w-12 text-amber-400 mb-4" /><p className="text-gray-500 dark:text-gray-400">Results not available.</p></div>;

    const questions = s.questions || [];
    const overallPct = getOverallPercent(questions);
    const totalScore = getTotalScore(questions);
    const maxScore = questions.length * 10;
    const { correct, partial, incorrect, unanswered } = getStatusCounts(questions);
    const passed = overallPct >= 50;

    const questionResults = questions.map((q, i) => ({
      index: i, question: q.question, answer: q.answer, score: (q.score ?? q.feedback?.score) || 0,
      status: q.status || (q.answer ? "partial" : "incorrect"),
      feedback: q.feedback, feedbackText: typeof q.feedback === "string" ? q.feedback : "",
      idealAnswer: q.idealAnswer || "", suggestions: q.suggestions || [], strengths: q.strengths || [],
      evaluation: q.evaluation || {}, difficulty: q.difficulty, tags: q.tags,
    }));

    return (
      <section ref={resultsRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="pdf-content" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-8 text-center">
            <div className="flex justify-center mb-4"><CircularProgress value={overallPct} /></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{passed ? "Great Job!" : "Keep Practicing!"}</h2>
            <p className="text-gray-500 dark:text-gray-400">You scored {totalScore} out of {maxScore} points across {questions.length} questions</p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="text-center"><div className="text-2xl font-bold text-emerald-600">{correct}</div><div className="text-xs text-gray-500">Correct</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-amber-600">{partial}</div><div className="text-xs text-gray-500">Partial</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-red-600">{incorrect}</div><div className="text-xs text-gray-500">Incorrect</div></div>
              {unanswered > 0 && <div className="text-center"><div className="text-2xl font-bold text-gray-400">{unanswered}</div><div className="text-xs text-gray-500">Unanswered</div></div>}
            </div>
            {s.weakTopics?.length > 0 && (
              <div className="mt-4"><p className="text-xs text-gray-500 mb-1">Weak Areas: <span className="text-red-500 font-medium">{s.weakTopics.join(", ")}</span></p></div>
            )}
            {s.strongTopics?.length > 0 && (
              <div><p className="text-xs text-gray-500">Strong Areas: <span className="text-emerald-600 font-medium">{s.strongTopics.join(", ")}</span></p></div>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="outline" className="text-sm"><Brain className="h-3.5 w-3.5 mr-1" />{s.category || "Interview"}</Badge>
              <Badge variant="secondary" className="text-sm">{s.difficulty || "Medium"}</Badge>
              <Badge variant="secondary" className="text-sm">{questions.length} Questions</Badge>
            </div>
          </motion.div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-500" />Question Breakdown</h3>
            <div className="space-y-4">
              {questionResults.map((qr) => (
                <motion.div key={qr.index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: qr.index * 0.1 }}
                  className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={qr.status} />
                        <span className="text-xs text-gray-400">{qr.difficulty}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Q{qr.index + 1}. {qr.question}</p>
                    </div>
                    <div className="text-center shrink-0">
                      <div className={`text-xl font-bold ${qr.score >= 7 ? "text-emerald-600" : qr.score >= 4 ? "text-amber-600" : "text-red-600"}`}>{qr.score}/10</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Answer:</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{qr.answer || <span className="italic text-gray-400">No answer provided</span>}</p>
                    </div>
                    {qr.idealAnswer && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1"><Lightbulb className="h-3 w-3" />Ideal Answer:</p>
                        <p className="text-sm text-emerald-800 dark:text-emerald-200">{qr.idealAnswer}</p>
                      </div>
                    )}
                    {qr.feedback && typeof qr.feedback === "string" && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">AI Feedback:</p>
                        <p className="text-sm text-amber-800 dark:text-amber-200">{qr.feedback}</p>
                      </div>
                    )}
                    {qr.suggestions?.length > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" />Suggestions:</p>
                        <ul className="space-y-0.5">{qr.suggestions.map((s, i) => <li key={i} className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-2"><span className="text-purple-400">&#8226;</span>{s}</li>)}</ul>
                      </div>
                    )}
                    {qr.strengths?.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1"><Award className="h-3 w-3" />Strengths:</p>
                        <ul className="space-y-0.5">{qr.strengths.map((s, i) => <li key={i} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2"><span className="text-blue-400">&#8226;</span>{s}</li>)}</ul>
                      </div>
                    )}
                    {qr.evaluation && Object.values(qr.evaluation).some((v) => v > 0) && (
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(qr.evaluation).map(([key, val]) => (
                          <div key={key} className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{val}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-8 pb-8">
          <Button onClick={() => { setSelectedCategory(null); setSession(null); setResultsSession(null); setCurrentIndex(0); setAnswer(""); setInterviewCompleted(false); setView("welcome"); navigate("/mock-interview"); }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-5 text-base font-semibold shadow-lg">
            <RotateCcw className="h-5 w-5 mr-2" />Try Again
          </Button>
          <Button variant="outline" onClick={handleViewHistory} className="rounded-xl px-6 py-5 text-base"><History className="h-5 w-5 mr-2" />View History</Button>
          <Button variant="outline" onClick={() => generatePDF(s)} disabled={generatingPdf} className="rounded-xl px-6 py-5 text-base">
            {generatingPdf ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
            {generatingPdf ? "Generating PDF..." : "Download Report"}
          </Button>
        </div>
      </section>
    );
  };

  const renderHistory = () => (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Interview History</h2>
          <Button variant="outline" onClick={() => { setView("welcome"); setSelectedSession(null); }} className="rounded-xl"><ChevronLeft className="h-4 w-4 mr-2" />Back</Button>
        </div>
        {selectedSession ? renderSessionDetail() : (
          <>
            {loadingSessions ? (
              <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" /><p className="text-gray-500 dark:text-gray-400">Loading history...</p></div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20"><Inbox className="h-12 w-12 text-gray-400 mb-4" /><p className="text-gray-500 dark:text-gray-400 font-medium">No interview history yet</p><p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Complete an interview to see it here.</p></div>
            ) : (
              <div className="grid gap-4">
                {sessions.map((s) => {
                  const sScore = s.totalScore || s.questions?.reduce((sum, q) => sum + ((q.score ?? q.feedback?.score) || 0), 0) || 0;
                  const sMax = (s.questionCount || s.questions?.length || 1) * 10;
                  const sPct = sMax > 0 ? Math.round((sScore / sMax) * 100) : 0;
                  return (
                    <motion.div key={s._id || s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleViewSessionDetail(s._id || s.id)}>
                          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center"><MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{s.categoryName || s.category || "Interview"}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.difficulty || "Medium"} &middot; {s.questionCount || s.questions?.length || 0} questions{s.createdAt && ` \u00b7 ${new Date(s.createdAt).toLocaleDateString()}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={`text-lg font-bold ${sPct >= 50 ? "text-emerald-600" : "text-red-500"}`}>{sPct}%</div>
                          <Button variant="ghost" size="sm" onClick={() => handleViewSessionDetail(s._id || s.id)} className="rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteSession(s._id || s.id)} disabled={deleting === (s._id || s.id)} className="rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                            {deleting === (s._id || s.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </motion.div>
    </section>
  );

  const renderSessionDetail = () => {
    if (loadingSessionDetail) return <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" /><p className="text-gray-500 dark:text-gray-400">Loading session details...</p></div>;
    if (!selectedSession) return <div className="flex flex-col items-center justify-center py-20"><AlertCircle className="h-12 w-12 text-amber-400 mb-4" /><p className="text-gray-500 dark:text-gray-400">Session not found.</p></div>;

    const s = selectedSession;
    const questions = s.questions || [];
    const overallPct = getOverallPercent(questions);
    const totalScore = getTotalScore(questions);
    const maxScore = questions.length * 10;
    const { correct, partial, incorrect, unanswered } = getStatusCounts(questions);
    const q = questions[reviewIndex];

    if (!q) return <div className="flex flex-col items-center justify-center py-20"><AlertCircle className="h-12 w-12 text-amber-400 mb-4" /><p className="text-gray-500 dark:text-gray-400">No questions found.</p></div>;

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 text-center">
          <div className="flex justify-center mb-3"><CircularProgress value={overallPct} size={100} strokeWidth={8} /></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{s.categoryName || s.category || "Interview"}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{s.difficulty || "Medium"} &middot; {questions.length} questions{s.createdAt && ` \u00b7 ${new Date(s.createdAt).toLocaleDateString()}`}</p>
          <div className="flex justify-center gap-4 mt-3">
            <span className="text-sm"><span className="font-bold text-emerald-600">{correct}</span> Correct</span>
            <span className="text-sm"><span className="font-bold text-amber-600">{partial}</span> Partial</span>
            <span className="text-sm"><span className="font-bold text-red-600">{incorrect}</span> Incorrect</span>
            <span className="text-sm"><span className="font-bold text-gray-400">{totalScore}/{maxScore}</span> Score</span>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleRetryIncorrect} className="rounded-xl"><RotateCcw className="h-4 w-4 mr-1" />Retry Incorrect</Button>
            <Button variant="outline" size="sm" onClick={() => generatePDF(s)} disabled={generatingPdf} className="rounded-xl">
              {generatingPdf ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}PDF
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={q.status} />
              <span className="text-sm text-gray-500">Question {reviewIndex + 1} of {questions.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={reviewIndex === 0} onClick={() => setReviewIndex((p) => p - 1)} className="rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" disabled={reviewIndex >= questions.length - 1} onClick={() => setReviewIndex((p) => p + 1)} className="rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{q.question}</p>
          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Answer:</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{q.answer || <span className="italic text-gray-400">No answer provided</span>}</p>
            </div>
            {q.idealAnswer && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1"><Lightbulb className="h-3 w-3" />Ideal Answer:</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">{q.idealAnswer}</p>
              </div>
            )}
            {q.feedback && (typeof q.feedback === "string" ? q.feedback : q.feedback?.feedback) && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">AI Feedback:</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">{typeof q.feedback === "string" ? q.feedback : q.feedback?.feedback}</p>
              </div>
            )}
            {q.suggestions?.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" />Suggestions:</p>
                <ul className="space-y-0.5">{q.suggestions.map((s, i) => <li key={i} className="text-sm text-purple-700 dark:text-purple-300">{s}</li>)}</ul>
              </div>
            )}
            {q.strengths?.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1"><Award className="h-3 w-3" />Strengths:</p>
                <ul className="space-y-0.5">{q.strengths.map((s, i) => <li key={i} className="text-sm text-blue-700 dark:text-blue-300">{s}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!user) return null;
  if (view === "results") return renderResults();
  if (view === "interview") return renderInterview();
  if (view === "history") return renderHistory();

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero badge="Practice Makes Perfect" title="Mock Interview Simulator"
        subtitle="Ace your next interview with AI-powered practice sessions. Get real-time feedback and improve with every attempt."
        gradient="from-emerald-600 via-emerald-700 to-green-900">
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-8 py-5 text-base font-semibold shadow-lg">
            <Play className="h-5 w-5 mr-2" />Start Practice
          </Button>
          <Button variant="outline" onClick={handleViewHistory}
            className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 py-5 text-base font-semibold">
            <History className="h-5 w-5 mr-2" />View History
          </Button>
        </div>
      </PageHero>
      <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12"><h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Interview Categories</h2><p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Select a category and configure your practice session</p></div>
        {renderCategories()}
        {selectedCategory && renderConfigPanel()}
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI Feedback", desc: "Receive detailed AI analysis with 8-dimensional scoring across technical correctness, communication, and more." },
            { icon: Timer, title: "Timed Practice", desc: "Build confidence with real-time countdown timers that simulate actual interview pressure." },
            { icon: BarChart3, title: "Performance Scores", desc: "Track your improvement with correct/partial/incorrect status and per-question breakdowns." },
            { icon: MessageSquare, title: "Curated Questions", desc: "Practice with questions tailored to your selected category and difficulty level." },
            { icon: Sparkles, title: "Ideal Answers", desc: "Compare your responses with ideal answers, professional responses, and example code." },
            { icon: Download, title: "PDF Reports", desc: "Download comprehensive interview reports with full analysis and improvement suggestions." },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4"><Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
