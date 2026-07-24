import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, BookOpen, ThumbsUp, MessageSquare, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
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

const categories = ["All", "Frontend", "Backend", "System Design", "Behavioral", "Data Structures", "HR"];

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-5">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

function QuestionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function InterviewQuestions() {
  const { user } = useSelector((store) => store.auth);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 6 };
      if (activeCat !== "All") params.category = activeCat.toLowerCase();
      if (search.trim()) params.search = search.trim();
      const res = await axios.get(QUESTION_API_END_POINT, { params, withCredentials: true });
      if (res.data?.success) {
        setQuestions(res.data.questions || []);
        setTotalPages(res.data.pages || 1);
      } else {
        setQuestions([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load questions. Please try again.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [activeCat, search, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleBookmark = async (questionId, e) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await axios.post(`${QUESTION_API_END_POINT}/${questionId}/bookmark`, {}, { withCredentials: true });
      if (res.data?.success) {
        setQuestions((prev) =>
          prev.map((q) =>
            q._id === questionId ? { ...q, bookmarks: res.data.bookmarks || q.bookmarks } : q
          )
        );
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  const isBookmarked = (bookmarks) => {
    if (!user || !bookmarks) return false;
    return bookmarks.includes(user._id);
  };

  const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const difficultyColor = (d) => {
    const val = d?.toLowerCase?.() || "";
    if (val === "easy") return "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
    if (val === "medium") return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    return "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800";
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="5,000+ Questions"
        title="Interview Questions"
        subtitle="Curated interview questions from top tech companies. Practice with real questions asked by Google, Amazon, Meta, and more."
        gradient="from-cyan-600 via-teal-700 to-emerald-900"
      >
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search questions or companies..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border-0 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-lg text-sm"
          />
        </div>
      </PageHero>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCat(cat); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCat === cat
                  ? "bg-[#0A66C2] text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-teal-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

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
            <p className="text-gray-500 dark:text-gray-400 text-sm">No questions found. Try adjusting your filters.</p>
          </motion.div>
        ) : (
          <>
            <div className="space-y-3">
              {questions.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.question}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className={cn("text-xs border", difficultyColor(item.difficulty))}>{capitalize(item.difficulty)}</Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.company || "General"}</span>
                        {user && (
                          <button onClick={(e) => handleBookmark(item._id, e)} className="ml-auto">
                            <Bookmark className={cn("h-4 w-4 transition-colors", isBookmarked(item.bookmarks) ? "fill-[#0A66C2] text-[#0A66C2]" : "text-gray-400 hover:text-[#0A66C2]")} />
                          </button>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 text-gray-400 shrink-0 transition-transform", expanded === i && "rotate-180")} />
                  </button>
                  {expanded === i && (
                    <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-gray-700">
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> 24 likes</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> 8 answers</span>
                        <Button variant="outline" size="sm" className="ml-auto rounded-lg text-xs border-gray-200 dark:border-gray-700">View Answer</Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button variant="outline" size="sm" className="rounded-xl" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" className="rounded-xl" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
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
