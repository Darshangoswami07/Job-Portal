import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, BookOpen, ThumbsUp, MessageSquare,
  ChevronLeft, ChevronRight, Bookmark, Clock, Eye, BarChart3,
  Filter, X, CheckCircle, Sparkles, ExternalLink, Share2,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import NewsletterSection from "@/components/sections/NewsletterSection";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import axios from "axios";
import { QUESTION_API_END_POINT } from "@/utils/constant";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const DIFFICULTIES = ["All", "easy", "medium", "hard"];
const CATEGORIES = [
  "All", "Frontend", "Backend", "Programming", "Database", "Cloud",
  "DevOps", "AI", "System Design", "DSA", "HR"
];
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "-popularity", label: "Most Popular" },
  { value: "-votes", label: "Most Votes" },
  { value: "-viewedCount", label: "Most Viewed" },
  { value: "difficulty", label: "Difficulty (Easy First)" },
  { value: "-difficulty", label: "Difficulty (Hard First)" },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
        </div>
      </div>
    </div>
  );
}

function QuestionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
    </div>
  );
}

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

export default function InterviewQuestions() {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeCat, setActiveCat] = useState(searchParams.get("category") || "All");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "All");
  const [sort, setSort] = useState("-createdAt");
  const [company, setCompany] = useState(searchParams.get("company") || "");

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [expanded, setExpanded] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const debounceRef = useRef(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 12, sort };
      if (activeCat !== "All") params.category = activeCat;
      if (difficulty !== "All") params.difficulty = difficulty;
      if (search.trim()) params.search = search.trim();
      if (company.trim()) params.company = company.trim();

      const res = await axios.get(QUESTION_API_END_POINT, { params, withCredentials: true });
      if (res.data?.success) {
        setQuestions(res.data.questions || []);
        setTotalPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      } else {
        setQuestions([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load questions");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [activeCat, difficulty, search, sort, company, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (activeCat !== "All") params.category = activeCat;
    if (difficulty !== "All") params.difficulty = difficulty;
    if (company) params.company = company;
    if (page > 1) params.page = page;
    setSearchParams(params, { replace: true });
  }, [search, activeCat, difficulty, company, page, setSearchParams]);

  const handleSearch = (val) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 300);
  };

  const handleCatChange = (cat) => {
    setActiveCat(cat);
    setPage(1);
  };

  const handleDifficultyChange = (d) => {
    setDifficulty(d);
    setPage(1);
  };

  const handleBookmark = async (questionId, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast.error("Please login to bookmark questions");
      return;
    }
    try {
      const res = await axios.post(
        `${QUESTION_API_END_POINT}/${questionId}/bookmark`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        setQuestions((prev) =>
          prev.map((q) =>
            q._id === questionId ? { ...q, bookmarks: res.data.bookmarks || q.bookmarks } : q
          )
        );
        toast.success(res.data.bookmarked ? "Bookmarked!" : "Removed bookmark");
      }
    } catch (err) {
      toast.error("Failed to toggle bookmark");
    }
  };

  const handleLike = async (questionId, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast.error("Please login to vote");
      return;
    }
    try {
      const res = await axios.post(
        `${QUESTION_API_END_POINT}/${questionId}/like`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        setQuestions((prev) =>
          prev.map((q) =>
            q._id === questionId ? { ...q, likes: res.data.likes, votes: res.data.votes } : q
          )
        );
      }
    } catch (err) {
      toast.error("Failed to vote");
    }
  };

  const isBookmarked = (bookmarks) => {
    if (!user || !bookmarks) return false;
    return bookmarks.includes(user._id);
  };

  const isLiked = (likes) => {
    if (!user || !likes) return false;
    return likes.includes(user._id);
  };

  const handleShare = async (question, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({
          title: question.question,
          text: `Check out this interview question: ${question.question}`,
          url: `${window.location.origin}/interview-questions/${question._id}`,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(
        `${window.location.origin}/interview-questions/${question._id}`
      );
      toast.success("Link copied to clipboard!");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setActiveCat("All");
    setDifficulty("All");
    setCompany("");
    setPage(1);
  };

  const hasActiveFilters = activeCat !== "All" || difficulty !== "All" || search || company;

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge={total > 0 ? `${total.toLocaleString()} Questions` : "Interview Questions"}
        title="Interview Questions"
        subtitle="Curated interview questions from top tech companies. Practice with real questions from Google, Amazon, Meta, and more."
        gradient="from-cyan-600 via-teal-700 to-emerald-900"
      >
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search questions, companies, categories, or technologies..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border-0 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-lg text-sm"
          />
        </div>
      </PageHero>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2 flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCatChange(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeCat === cat
                    ? "bg-[#0A66C2] text-white shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-teal-300"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-teal-500" />
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Filters
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Difficulty
                    </label>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d}
                          onClick={() => handleDifficultyChange(d)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            difficulty === d
                              ? "bg-[#0A66C2] text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          )}
                        >
                          {d === "All" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Company
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => { setCompany(e.target.value); setPage(1); }}
                      placeholder="e.g. Google, Amazon"
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Sort By
                    </label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  {user && (
                    <div className="flex items-end">
                      <Link
                        to="/interview-questions/bookmarks"
                        className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-sm font-medium hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
                      >
                        <Bookmark className="h-4 w-4" /> My Bookmarks
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <QuestionSkeleton />
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
              <BookOpen className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={fetchQuestions}>
              Try Again
            </Button>
          </motion.div>
        ) : questions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              No questions found. Try adjusting your filters.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {questions.length} of {total.toLocaleString()} questions
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {questions.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow overflow-hidden hover:shadow-md transition-shadow"
                >
                  <Link
                    to={`/interview-questions/${item._id}`}
                    className="block p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px] px-2 py-0.5 border font-medium", difficultyColor(item.difficulty))}
                          >
                            {item.difficulty?.charAt(0).toUpperCase() + item.difficulty?.slice(1) || "Medium"}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] px-2 py-0.5 border font-medium",
                              categoryColors[item.category] || "bg-gray-50 text-gray-600"
                            )}
                          >
                            {item.category || "General"}
                          </Badge>
                          {item.company && item.company !== "General" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 border-gray-200 dark:border-gray-700 text-gray-500"
                            >
                              {item.company}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed line-clamp-2">
                          {item.question}
                        </p>
                        {item.companies && item.companies.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.companies.slice(0, 4).map((c) => (
                              <span
                                key={c}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                              >
                                {c}
                              </span>
                            ))}
                            {item.companies.length > 4 && (
                              <span className="text-[10px] text-gray-400">
                                +{item.companies.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {item.viewedCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" /> {item.votes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {item.timeEstimate || 5} min
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" /> Pop {item.popularity || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        {user && (
                          <button
                            onClick={(e) => handleBookmark(item._id, e)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={isBookmarked(item.bookmarks) ? "Remove bookmark" : "Add bookmark"}
                          >
                            <Bookmark
                              className={cn(
                                "h-4 w-4 transition-colors",
                                isBookmarked(item.bookmarks)
                                  ? "fill-[#0A66C2] text-[#0A66C2]"
                                  : "text-gray-400 hover:text-[#0A66C2]"
                              )}
                            />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleLike(item._id, e)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={isLiked(item.likes) ? "Unlike" : "Like"}
                        >
                          <ThumbsUp
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isLiked(item.likes)
                                ? "text-[#0A66C2] fill-[#0A66C2]"
                                : "text-gray-400 hover:text-[#0A66C2]"
                            )}
                          />
                        </button>
                        <button
                          onClick={(e) => handleShare(item, e)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Share"
                        >
                          <Share2 className="h-4 w-4 text-gray-400 hover:text-teal-500" />
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p;
                  if (totalPages <= 7) {
                    p = i + 1;
                  } else if (page <= 4) {
                    p = i + 1;
                  } else if (page >= totalPages - 3) {
                    p = totalPages - 6 + i;
                  } else {
                    p = page - 3 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-9 h-9 rounded-xl text-sm font-medium transition-all",
                        page === p
                          ? "bg-[#0A66C2] text-white"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-teal-300"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CTABanner
        title="Practice Makes Perfect"
        subtitle="Try our mock interview simulator with real-time AI feedback."
        buttonText="Start Practicing"
        buttonLink="/mock-interview"
        gradient="from-cyan-600 via-teal-700 to-emerald-900"
      />
    </div>
  );
}
