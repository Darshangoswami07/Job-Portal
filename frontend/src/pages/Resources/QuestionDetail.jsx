import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft, Bookmark, ThumbsUp, Clock, Eye, BarChart3,
  AlertTriangle, CheckCircle2, Lightbulb, Target, ArrowRight,
  Sparkles, MessageSquare, Share2, Send, Loader2, BookOpen,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import axios from "axios";
import { QUESTION_API_END_POINT } from "@/utils/constant";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { copyToClipboard } from "@/utils/clipboard";

const difficultyColor = (d) => {
  const val = d?.toLowerCase?.() || "";
  if (val === "easy") return "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
  if (val === "medium") return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
  return "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800";
};

const categoryColors = {
  "Frontend": "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "Backend": "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Programming": "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "Database": "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  "Cloud": "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  "DevOps": "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  "AI": "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  "System Design": "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  "DSA": "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  "HR": "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
};

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);

  const [question, setQuestion] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  const fetchQuestion = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${QUESTION_API_END_POINT}/${id}`, { withCredentials: true });
      if (res.data?.success) {
        setQuestion(res.data.question);
        setRelated(res.data.relatedQuestions || []);
      } else {
        setError("Question not found");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) { toast.error("Please login"); return; }
    try {
      const res = await axios.post(
        `${QUESTION_API_END_POINT}/${id}/bookmark`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        setQuestion((prev) => ({ ...prev, bookmarks: res.data.bookmarks }));
        toast.success(res.data.bookmarked ? "Bookmarked!" : "Removed bookmark");
      }
    } catch { toast.error("Failed"); }
  };

  const handleLike = async () => {
    if (!user) { toast.error("Please login"); return; }
    try {
      const res = await axios.post(
        `${QUESTION_API_END_POINT}/${id}/like`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        setQuestion((prev) => ({ ...prev, likes: res.data.likes, votes: res.data.votes }));
      }
    } catch { toast.error("Failed"); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: question?.question || "", url: window.location.href });
      } catch {}
    } else {
      await copyToClipboard(window.location.href);
      toast.success("Link copied!");
    }
  };

  const handleAIExplain = async () => {
    setAiLoading(true);
    setAiResponse("");
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const q = question.question;
      const a = question.answer?.substring(0, 200) || "";

      const explanations = {
        easy: `This is a fundamental concept that every developer should understand. The key insight is that it forms the building block for more advanced topics. Think of it as a foundational pattern that appears repeatedly in real-world applications.`,
        medium: `This requires a deeper understanding of the underlying principles. The challenge here is connecting multiple concepts together. A good approach is to first understand the core mechanism, then consider how it interacts with other system components.`,
        hard: `This is an advanced topic that tests your depth of knowledge and ability to reason about complex systems. The key is to break down the problem into smaller parts, understand the trade-offs involved, and articulate a clear mental model.`,
      };

      const diff = question.difficulty || "medium";
      setAiResponse(
        `**AI Explanation**\n\n${explanations[diff] || explanations.medium}\n\n**Key Points**\n1. Focus on understanding the core concept first\n2. Practice with real-world examples\n3. Consider edge cases and performance implications\n\n**Related:** This connects to ${(question.tags || []).slice(0, 3).join(", ") || "multiple topics in the same category"}.`
      );
    } catch {} finally {
      setAiLoading(false);
    }
  };

  const handleMarkSolved = async () => {
    if (!user) { toast.error("Please login"); return; }
    try {
      await axios.post(`${QUESTION_API_END_POINT}/${id}/solved`, {}, { withCredentials: true });
      toast.success("Marked as solved!");
    } catch { toast.error("Failed"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error || "Question not found"}</p>
          <Button variant="outline" onClick={() => navigate("/interview-questions")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Questions
          </Button>
        </div>
      </div>
    );
  }

  const isBookmarked = user && question.bookmarks?.includes(user._id);
  const isLiked = user && question.likes?.includes(user._id);

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/interview-questions")}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Questions
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn("text-xs px-3 py-1 border font-medium", difficultyColor(question.difficulty))}
                  >
                    {question.difficulty?.charAt(0).toUpperCase() + question.difficulty?.slice(1) || "Medium"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs px-3 py-1 border font-medium", categoryColors[question.category] || "")}
                  >
                    {question.category || "General"}
                  </Badge>
                  {question.subcategory && (
                    <Badge variant="outline" className="text-xs px-3 py-1 border-gray-200 dark:border-gray-700 text-gray-500">
                      {question.subcategory}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleBookmark}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Bookmark className={cn("h-5 w-5", isBookmarked ? "fill-[#0A66C2] text-[#0A66C2]" : "text-gray-400")} />
                  </button>
                  <button
                    onClick={handleLike}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ThumbsUp className={cn("h-5 w-5", isLiked ? "fill-[#0A66C2] text-[#0A66C2]" : "text-gray-400")} />
                  </button>
                  <button onClick={handleShare} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Share2 className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <h1 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed mb-4">
                {question.question}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {question.viewedCount?.toLocaleString() || 0} views</span>
                <span className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4" /> {question.votes || 0} votes</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {question.timeEstimate || 5} min estimated</span>
                <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> Popularity: {question.popularity || 0}</span>
              </div>

              {question.company && question.company !== "General" && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Company</p>
                  <Badge variant="secondary" className="text-sm px-4 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600">
                    {question.company}
                  </Badge>
                </div>
              )}

              {question.companies && question.companies.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Asked by {question.companies.length} companies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {question.companies.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs px-2 py-1 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {question.tags && question.tags.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {question.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="rounded-xl bg-[#0A66C2] hover:bg-[#0A66C2]/90"
                >
                  {showAnswer ? "Hide Answer" : "View Answer"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAIExplain}
                  disabled={aiLoading}
                  className="rounded-xl gap-2"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Explain
                </Button>
                {user && (
                  <Button variant="outline" onClick={handleMarkSolved} className="rounded-xl gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Mark Solved
                  </Button>
                )}
              </div>
            </motion.div>

            {showAnswer && question.answer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
              >
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" /> Answer
                </h2>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {question.answer.split("\n").map((line, i) => (
                    <p key={i} className={line.match(/^\d\./) ? "mb-2" : "mb-1"}>{line}</p>
                  ))}
                </div>
                {question.codeSnippet && (
                  <pre className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700">
                    {question.codeSnippet}
                  </pre>
                )}
              </motion.div>
            )}

            {showAnswer && question.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
              >
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" /> Explanation
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{question.explanation}</p>
              </motion.div>
            )}

            {showAnswer && question.commonMistakes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
              >
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" /> Common Mistakes
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{question.commonMistakes}</p>
              </motion.div>
            )}

            {showAnswer && question.bestPractices && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
              >
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-teal-500" /> Best Practices
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{question.bestPractices}</p>
              </motion.div>
            )}

            {showAnswer && question.followUpQuestions && question.followUpQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
              >
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" /> Follow-up Questions
                </h2>
                <ul className="space-y-2">
                  {question.followUpQuestions.map((fq, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <ArrowRight className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                      <span>{fq}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl border border-violet-200 dark:border-violet-800 p-6"
              >
                <h2 className="text-base font-semibold text-violet-900 dark:text-violet-300 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> AI Explanation
                </h2>
                <div className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed whitespace-pre-line">
                  {aiResponse}
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-4">
            {question.companyFrequency && Object.keys(question.companyFrequency).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Company Frequency</h3>
                <div className="space-y-2">
                  {Object.entries(question.companyFrequency)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([c, count]) => (
                      <div key={c} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{c}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${Math.min(100, (count / Math.max(...Object.values(question.companyFrequency))) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {related.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Related Questions</h3>
                <div className="space-y-2">
                  {related.map((r) => (
                    <Link
                      key={r._id}
                      to={`/interview-questions/${r._id}`}
                      className="block p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">{r.question}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0.5", difficultyColor(r.difficulty))}>
                          {r.difficulty}
                        </Badge>
                        {r.company && r.company !== "General" && (
                          <span className="text-[10px] text-gray-400">{r.company}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
