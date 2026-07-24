import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft, Bookmark, BookOpen, ChevronRight, Clock, Eye,
  BarChart3, ThumbsUp, Trash2, PieChart, TrendingUp, Target,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import axios from "axios";
import { QUESTION_API_END_POINT } from "@/utils/constant";
import { useSelector } from "react-redux";
import { toast } from "sonner";

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

export default function QuestionBookmarks() {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  const [bookmarks, setBookmarks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState("bookmarks");

  useEffect(() => {
    if (!user) {
      navigate("/interview-questions");
      return;
    }
    fetchBookmarks();
    fetchProgress();
  }, [user, page]);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${QUESTION_API_END_POINT}/bookmarks?page=${page}&limit=12`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        setBookmarks(res.data.questions || []);
        setTotalPages(res.data.pages || 1);
      }
    } catch { toast.error("Failed to load bookmarks"); } finally { setLoading(false); }
  };

  const fetchProgress = async () => {
    setLoadingProgress(true);
    try {
      const res = await axios.get(`${QUESTION_API_END_POINT}/progress`, { withCredentials: true });
      if (res.data?.success) setProgress(res.data.progress);
    } catch {} finally { setLoadingProgress(false); }
  };

  const removeBookmark = async (questionId) => {
    try {
      const res = await axios.post(
        `${QUESTION_API_END_POINT}/${questionId}/bookmark`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        setBookmarks((prev) => prev.filter((q) => q._id !== questionId));
        toast.success("Removed bookmark");
      }
    } catch { toast.error("Failed"); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="My Progress"
        title="Bookmarks & Progress"
        subtitle="Track your interview preparation journey."
        gradient="from-violet-600 via-purple-700 to-indigo-900"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("bookmarks")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              tab === "bookmarks"
                ? "bg-[#0A66C2] text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            )}
          >
            <Bookmark className="h-4 w-4 inline mr-1.5" />
            Bookmarks {bookmarks.length > 0 && `(${bookmarks.length})`}
          </button>
          <button
            onClick={() => setTab("progress")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              tab === "progress"
                ? "bg-[#0A66C2] text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            )}
          >
            <PieChart className="h-4 w-4 inline mr-1.5" />
            Analytics
          </button>
        </div>

        {tab === "bookmarks" && (
          <>
            <button
              onClick={() => navigate("/interview-questions")}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 mb-6"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Questions
            </button>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gray-200 rounded-full" />
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">No bookmarked questions yet</p>
                <Button variant="outline" onClick={() => navigate("/interview-questions")}>
                  Browse Questions
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {bookmarks.map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <Link to={`/interview-questions/${item._id}`} className="block p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className={cn("text-[10px] px-2 py-0.5 border", difficultyColor(item.difficulty))}>
                                {item.difficulty?.charAt(0).toUpperCase() + item.difficulty?.slice(1) || "Medium"}
                              </Badge>
                              <Badge variant="secondary" className={cn("text-[10px] px-2 py-0.5 border", categoryColors[item.category] || "")}>
                                {item.category || "General"}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{item.question}</p>
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                              <span><Eye className="h-3 w-3 inline mr-0.5" />{item.viewedCount || 0}</span>
                              <span><ThumbsUp className="h-3 w-3 inline mr-0.5" />{item.votes || 0}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); removeBookmark(item._id); }}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "progress" && (
          <div>
            {loadingProgress ? (
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              </div>
            ) : progress ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.totalQuestions?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Questions</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                        <Bookmark className="h-5 w-5 text-purple-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.bookmarkedCount || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bookmarked</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.completionRate || 0}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-teal-500" /> Category Breakdown
                  </h3>
                  <div className="space-y-3">
                    {progress.categoryBreakdown && Object.entries(progress.categoryBreakdown)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([cat, data]) => (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{cat}</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {data.bookmarked || 0} / {data.total} bookmarked
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all"
                              style={{ width: `${data.total > 0 ? ((data.bookmarked || 0) / data.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Progress data not available yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
