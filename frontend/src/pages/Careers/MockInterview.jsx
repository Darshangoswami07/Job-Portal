import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { INTERVIEW_API_END_POINT } from "@/utils/constant";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Mic, ChevronLeft, ChevronRight, CheckCircle, XCircle, BarChart3, Clock, Send, RotateCcw, Loader2, AlertCircle, Inbox, Brain, Award, MessageSquare, Star, History, Play, Settings, ChevronDown } from "lucide-react";

const categoryColors = [
  "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
  "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
];

const difficultyLevels = ["Easy", "Medium", "Hard"];
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

export default function MockInterview() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  const [view, setView] = useState("welcome");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(120);

  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [starting, setStarting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingSessionDetail, setLoadingSessionDetail] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to access Mock Interview");
      navigate("/login");
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
  }, [user, navigate]);

  useEffect(() => {
    if (view === "interview" && session && session.questions && session.questions[currentIndex]) {
      setAnswer("");
      setFeedback(null);
      setTimeLeft(session.timePerQuestion);
      textareaRef.current?.focus();
    }
  }, [view, currentIndex, session]);

  useEffect(() => {
    if (view !== "interview" || !session || feedback) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    timerRef.current = id;
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, session, currentIndex, feedback, timeLeft]);

  const handleStartInterview = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }
    try {
      setStarting(true);
      const res = await axios.post(
        `${INTERVIEW_API_END_POINT}/start`,
        {
          category: selectedCategory._id || selectedCategory.id,
          difficulty,
          timePerQuestion,
          questionCount,
        },
        { withCredentials: true }
      );
      const data = res.data.session || res.data.data || res.data;
      setSession(data);
      setCurrentIndex(0);
      setView("interview");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to start interview";
      toast.error(msg);
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      toast.error("Please provide an answer");
      return;
    }
    try {
      setSubmitting(true);
      const duration = session.timePerQuestion - timeLeft;
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
      const fb = res.data.feedback || res.data.data || res.data;
      setFeedback(fb);
      setSession((prev) => {
        const qs = [...(prev.questions || [])];
        qs[currentIndex] = { ...qs[currentIndex], answer: answer.trim(), feedback: fb };
        return { ...prev, questions: qs };
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit answer";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    if (feedback) return;
    if (!answer.trim()) {
      handleSubmitAnswer();
      return;
    }
    handleSubmitAnswer();
  };

  const handleNextQuestion = () => {
    if (currentIndex < (session?.questions?.length || 1) - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setView("results");
      setCurrentIndex(0);
    }
  };

  const handleViewHistory = async () => {
    try {
      setLoadingSessions(true);
      const res = await axios.get(`${INTERVIEW_API_END_POINT}/sessions`, { withCredentials: true });
      const data = res.data.sessions || res.data.data || res.data;
      setSessions(Array.isArray(data) ? data : []);
      setView("history");
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
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load session detail";
      toast.error(msg);
    } finally {
      setLoadingSessionDetail(false);
    }
  };

  const getTotalScore = () => {
    if (!session?.questions) return 0;
    return session.questions.reduce((sum, q) => sum + (q.feedback?.score || 0), 0);
  };

  const getMaxScore = () => {
    if (!session?.questions) return 0;
    return session.questions.length * 10;
  };

  const getOverallPercent = () => {
    const max = getMaxScore();
    if (max === 0) return 0;
    return (getTotalScore() / max) * 100;
  };

  const getStrengthsAndWeaknesses = () => {
    if (!session?.questions) return { strengths: [], weaknesses: [] };
    const strengths = [];
    const weaknesses = [];
    session.questions.forEach((q, i) => {
      const s = q.feedback?.score || 0;
      if (s >= 7) {
        strengths.push({ index: i, question: q.question, score: s });
      } else if (s <= 4) {
        weaknesses.push({ index: i, question: q.question, score: s });
      }
    });
    return { strengths, weaknesses };
  };

  const renderCategories = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-red-500 dark:text-red-400 font-medium mb-2">Failed to load categories</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }
    if (!categories || categories.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Inbox className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No categories available yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Check back later for new interview categories.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, i) => {
          const isSelected = selectedCategory?._id === cat._id || selectedCategory?.id === cat.id;
          return (
            <motion.div
              key={cat._id || cat.name || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedCategory(cat)}
              className={`bg-white dark:bg-gray-800 rounded-2xl border-2 card-shadow p-6 text-center hover:shadow-lg transition-all cursor-pointer ${
                isSelected
                  ? "border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20"
                  : "border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800"
              }`}
            >
              <div className={`h-14 w-14 rounded-xl ${categoryColors[i % categoryColors.length]} flex items-center justify-center mx-auto mb-4`}>
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
              {cat.skills && cat.skills.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {cat.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {skill}
                    </Badge>
                  ))}
                  {cat.skills.length > 3 && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">+{cat.skills.length - 3}</span>
                  )}
                </div>
              )}
              {isSelected && (
                <div className="mt-3">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderConfigPanel = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 mt-8"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5 text-emerald-500" />
        Interview Settings
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
          <div className="flex gap-2">
            {difficultyLevels.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  difficulty === d
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Questions</label>
          <div className="flex gap-2">
            {questionCountOptions.map((n) => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  questionCount === n
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time per Question</label>
          <div className="flex gap-2">
            {timeOptions.map((t) => (
              <button
                key={t.value}
                onClick={() => setTimePerQuestion(t.value)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  timePerQuestion === t.value
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Button
          onClick={handleStartInterview}
          disabled={!selectedCategory || starting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-5 text-base font-semibold shadow-lg"
        >
          {starting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start Interview
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleViewHistory}
          className="rounded-xl px-6 py-5 text-base"
        >
          <History className="h-5 w-5 mr-2" />
          View History
        </Button>
      </div>
    </motion.div>
  );

  const renderInterview = () => {
    if (!session || !session.questions || session.questions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-amber-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No questions loaded for this session.</p>
        </div>
      );
    }

    const totalQuestions = session.questions.length;
    const question = session.questions[currentIndex];
    const progress = ((currentIndex + (feedback ? 1 : 0)) / totalQuestions) * 100;
    const hasFeedback = feedback !== null;

    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  {session.categoryName || session.category || "Interview"}
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <Brain className="h-3.5 w-3.5 mr-1" />
                  {session.difficulty || "Medium"}
                </Badge>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 text-sm">
                Question {currentIndex + 1} of {totalQuestions}
              </Badge>
            </div>

            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {!hasFeedback && (
              <TimerBar remaining={timeLeft} total={session.timePerQuestion || timePerQuestion} />
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {typeof question === "string" ? question : question.question || `Question ${currentIndex + 1}`}
            </h2>

            {!hasFeedback ? (
              <div className="space-y-4">
                <textarea
                  ref={textareaRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full min-h-[180px] p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y text-base"
                  disabled={submitting}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {answer.length} character{answer.length !== 1 ? "s" : ""}
                  </span>
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={submitting || !answer.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit Answer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Answer:</p>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{answer || feedback.userAnswer || feedback.answer}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Score", value: feedback.score, max: 10, color: feedback.score >= 7 ? "text-emerald-600" : feedback.score >= 4 ? "text-amber-600" : "text-red-600" },
                    { label: "Clarity", value: feedback.clarity, max: 10, color: feedback.clarity >= 7 ? "text-emerald-600" : feedback.clarity >= 4 ? "text-amber-600" : "text-red-600" },
                    { label: "Relevance", value: feedback.relevance, max: 10, color: feedback.relevance >= 7 ? "text-emerald-600" : feedback.relevance >= 4 ? "text-amber-600" : "text-red-600" },
                  ].map((metric) => (
                    <div key={metric.label} className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                      <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}/{metric.max}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {feedback.completeness !== undefined && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{feedback.completeness}/10</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completeness</div>
                  </div>
                )}

                {feedback.feedback && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">{feedback.feedback}</p>
                  </div>
                )}

                {feedback.aiEvaluation && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                    <p className="text-sm text-purple-800 dark:text-purple-200">{feedback.aiEvaluation}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2"
                  >
                    {currentIndex < totalQuestions - 1 ? (
                      <>
                        Next Question
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        View Results
                        <BarChart3 className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>
    );
  };

  const renderResults = () => {
    if (!session) return null;
    const totalQuestions = session.questions?.length || 0;
    const overallPct = getOverallPercent();
    const totalScore = getTotalScore();
    const maxScore = getMaxScore();
    const { strengths, weaknesses } = getStrengthsAndWeaknesses();
    const passed = overallPct >= 50;

    return (
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-8 text-center">
            <div className="flex justify-center mb-4">
              <CircularProgress value={overallPct} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {passed ? "Great Job!" : "Keep Practicing!"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              You scored {totalScore} out of {maxScore} points across {totalQuestions} questions
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="outline" className="text-sm px-3 py-1">
                <Brain className="h-3.5 w-3.5 mr-1" />
                {session.categoryName || session.category || "Interview"}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {session.difficulty || "Medium"}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {totalQuestions} Questions
              </Badge>
            </div>
          </div>

          {strengths.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-500" />
                Strengths
              </h3>
              <div className="space-y-3">
                {strengths.map((s) => (
                  <div key={s.index} className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{s.question}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Score: {s.score}/10</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weaknesses.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-500" />
                Areas to Improve
              </h3>
              <div className="space-y-3">
                {weaknesses.map((w) => (
                  <div key={w.index} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <XCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{w.question}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Score: {w.score}/10</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Question Breakdown</h3>
            <div className="space-y-4">
              {session.questions.map((q, i) => {
                const qScore = q.feedback?.score || 0;
                const qColor = qScore >= 7 ? "text-emerald-600" : qScore >= 4 ? "text-amber-600" : "text-red-600";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="border border-gray-100 dark:border-gray-700 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 mr-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Q{i + 1}. {typeof q === "string" ? q : q.question || `Question ${i + 1}`}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${qColor} shrink-0`}>{qScore}/10</div>
                    </div>
                    {q.answer && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        Answer: {q.answer}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {q.feedback?.clarity !== undefined && (
                        <Badge variant="outline" className="text-[10px]">Clarity: {q.feedback.clarity}/10</Badge>
                      )}
                      {q.feedback?.relevance !== undefined && (
                        <Badge variant="outline" className="text-[10px]">Relevance: {q.feedback.relevance}/10</Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pb-8">
            <Button
              onClick={() => {
                setSelectedCategory(null);
                setSession(null);
                setCurrentIndex(0);
                setAnswer("");
                setFeedback(null);
                setView("welcome");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-5 text-base font-semibold shadow-lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl px-8 py-5 text-base"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Save Results
            </Button>
            <Button
              variant="outline"
              onClick={handleViewHistory}
              className="rounded-xl px-8 py-5 text-base"
            >
              <History className="h-5 w-5 mr-2" />
              View History
            </Button>
          </div>
        </motion.div>
      </section>
    );
  };

  const renderHistory = () => (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Interview History</h2>
          <Button variant="outline" onClick={() => { setView("welcome"); setSelectedSession(null); }} className="rounded-xl">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {selectedSession ? (
          renderSessionDetail()
        ) : (
          <>
            {loadingSessions ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No interview history yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Complete an interview to see it here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {sessions.map((s) => {
                  const sScore = s.totalScore || s.questions?.reduce((sum, q) => sum + (q.feedback?.score || 0), 0) || 0;
                  const sMax = (s.questionCount || s.questions?.length || 1) * 10;
                  const sPct = sMax > 0 ? Math.round((sScore / sMax) * 100) : 0;
                  return (
                    <motion.div
                      key={s._id || s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleViewSessionDetail(s._id || s.id)}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{s.categoryName || s.category || "Interview"}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {s.difficulty || "Medium"} &middot; {s.questionCount || s.questions?.length || 0} questions
                              {s.createdAt && ` \u00b7 ${new Date(s.createdAt).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`text-lg font-bold ${sPct >= 50 ? "text-emerald-600" : "text-red-500"}`}>
                            {sPct}%
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
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
    if (loadingSessionDetail) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading session details...</p>
        </div>
      );
    }
    if (!selectedSession) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-amber-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Session not found.</p>
        </div>
      );
    }
    const s = selectedSession;
    const sScore = s.totalScore || s.questions?.reduce((sum, q) => sum + (q.feedback?.score || 0), 0) || 0;
    const sMax = (s.questionCount || s.questions?.length || 1) * 10;
    const sPct = sMax > 0 ? Math.round((sScore / sMax) * 100) : 0;
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 text-center">
          <div className="flex justify-center mb-3">
            <CircularProgress value={sPct} size={100} strokeWidth={8} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {s.categoryName || s.category || "Interview"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {s.difficulty || "Medium"} &middot; {s.questionCount || s.questions?.length || 0} questions
            {s.createdAt && ` \u00b7 ${new Date(s.createdAt).toLocaleDateString()}`}
          </p>
        </div>
        {s.questions && s.questions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Question Breakdown</h4>
            <div className="space-y-3">
              {s.questions.map((q, i) => {
                const qScore = q.feedback?.score || 0;
                return (
                  <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Q{i + 1}. {q.question || `Question ${i + 1}`}</p>
                      <span className={`text-sm font-bold shrink-0 ml-3 ${qScore >= 7 ? "text-emerald-600" : qScore >= 4 ? "text-amber-600" : "text-red-600"}`}>{qScore}/10</span>
                    </div>
                    {q.answer && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Answer: {q.answer}</p>}
                    {q.feedback?.feedback && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{q.feedback.feedback}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;

  if (view === "interview") return renderInterview();
  if (view === "results") return renderResults();
  if (view === "history") return renderHistory();

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="Practice Makes Perfect"
        title="Mock Interview Simulator"
        subtitle="Ace your next interview with AI-powered practice sessions. Get real-time feedback and improve with every attempt."
        gradient="from-emerald-600 via-emerald-700 to-green-900"
      >
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-8 py-5 text-base font-semibold shadow-lg"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Practice
          </Button>
          <Button
            variant="outline"
            onClick={handleViewHistory}
            className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 py-5 text-base font-semibold"
          >
            <History className="h-5 w-5 mr-2" />
            View History
          </Button>
        </div>
      </PageHero>

      <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Interview Categories</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Select a category and configure your practice session</p>
        </div>
        {renderCategories()}
        {selectedCategory && renderConfigPanel()}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI Feedback", desc: "Receive detailed AI analysis of your responses with clarity, relevance, and completeness scores." },
            { icon: Timer, title: "Timed Practice", desc: "Build confidence with real-time countdown timers that simulate actual interview pressure." },
            { icon: BarChart3, title: "Performance Scores", desc: "Track your improvement with detailed metrics and per-question breakdowns." },
            { icon: MessageSquare, title: "Curated Questions", desc: "Practice with questions tailored to your selected category and difficulty level." },
            { icon: Award, title: "Strengths Analysis", desc: "Identify your strengths and areas for improvement with AI-powered analysis." },
            { icon: History, title: "Session History", desc: "Review your past interviews and track your progress over time." },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <CTABanner
        title="Confidence Comes with Practice"
        subtitle="Join thousands of successful candidates who aced their interviews with our simulator."
        buttonText="Start Practicing"
        buttonLink="/login"
        gradient="from-emerald-600 via-emerald-700 to-green-900"
      />
    </div>
  );
}
