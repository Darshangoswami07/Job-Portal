import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, BookOpen, Clock, ChevronRight, ChevronLeft, GraduationCap, TrendingUp,
  Star, Heart, Bookmark, Eye, Filter, X, SlidersHorizontal, ArrowUpDown,
  Loader2, AlertCircle, Sparkles, User,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import NewsletterSection from "@/components/sections/NewsletterSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { CAREER_GUIDE_API_END_POINT } from "@/utils/constant";

const difficultyColors = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  all: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "trending", label: "Trending" },
  { value: "readtime", label: "Shortest" },
  { value: "bookmarks", label: "Most Bookmarked" },
  { value: "oldest", label: "Oldest" },
];

const CATEGORIES = [
  "All", "Software Development", "AI & Data", "Cloud & DevOps",
  "Career", "Product & Design", "System Design", "DSA",
];

const LEVELS = ["all", "beginner", "intermediate", "advanced"];

export default function CareerGuides() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeCat, setActiveCat] = useState(searchParams.get("category") || "All");
  const [activeLevel, setActiveLevel] = useState(searchParams.get("level") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [guides, setGuides] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({ total: 0, categories: 0, levels: [] });

  const fetchGuides = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pageNum, limit: 12, sort };
      if (activeCat !== "All") params.category = activeCat;
      if (activeLevel !== "all") params.level = activeLevel;
      if (search) params.search = search;
      const res = await axios.get(CAREER_GUIDE_API_END_POINT, { params });
      if (res.data.success) {
        setGuides(res.data.guides || []);
        setTotalPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
        setStats({
          total: res.data.total || 0,
          categories: res.data.categories?.length || 0,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load career guides.");
    } finally {
      setLoading(false);
    }
  }, [search, activeCat, activeLevel, sort]);

  useEffect(() => {
    setPage(1);
    fetchGuides(1);
  }, [fetchGuides]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (activeCat !== "All") params.category = activeCat;
    if (activeLevel !== "all") params.level = activeLevel;
    if (sort !== "newest") params.sort = sort;
    setSearchParams(params, { replace: true });
  }, [search, activeCat, activeLevel, sort, setSearchParams]);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
    fetchGuides(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const clearFilters = () => {
    setSearch("");
    setActiveCat("All");
    setActiveLevel("all");
    setSort("newest");
  };

  const hasActiveFilters = activeCat !== "All" || activeLevel !== "all" || sort !== "newest" || search;

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="Career Learning Platform"
        title="Career Guides"
        subtitle="In-depth guides to navigate every stage of your career journey, from first job to leadership and beyond."
        gradient="from-amber-600 via-orange-700 to-red-900"
      >
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search guides by title, category, tags, or keywords..."
            className="w-full h-12 pl-12 pr-10 rounded-xl border-0 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-lg text-sm"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && total > 0 && (
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {total} guides</span>
            <span className="flex items-center gap-1"><Sparkles className="h-4 w-4" /> {categories.length - 1} categories</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCat(cat); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCat === cat
                    ? "bg-amber-600 text-white shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-amber-300"
                }`}
              >
                {cat === "All" ? "All Guides" : cat}
              </button>
            ))}
            {CATEGORIES.length > 5 && (
              <div className="relative group">
                <button className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-amber-300">
                  More...
                </button>
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 hidden group-hover:block z-20 min-w-[160px]">
                  {CATEGORIES.slice(5).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCat(cat); setPage(1); }}
                      className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        activeCat === cat ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 border transition-all ${
                showFilters || hasActiveFilters
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-700 dark:text-amber-400"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-amber-500" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-6"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Level</label>
                <div className="flex gap-1">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      onClick={() => { setActiveLevel(l); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        activeLevel === l
                          ? "bg-amber-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {l === "all" ? "All" : l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 border-0 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-400"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 rounded-lg text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-200 dark:bg-gray-700" />
                <div className="p-5">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-3" />
                  <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => fetchGuides(1)} variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20">Try Again</Button>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No guides found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filter criteria.</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="text-amber-600 border-amber-300">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((g, i) => (
                <Link key={g._id} to={`/career-guides/${g.slug}`} className="block group">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-800 transition-all"
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={g.coverImage}
                        alt={g.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {g.featured && (
                          <Badge className="bg-amber-500 text-white border-0 text-xs flex items-center gap-1">
                            <Star className="h-3 w-3 fill-white" /> Featured
                          </Badge>
                        )}
                        {g.trending && (
                          <Badge className="bg-red-500 text-white border-0 text-xs flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Trending
                          </Badge>
                        )}
                        {g.beginnerFriendly && (
                          <Badge className="bg-green-500 text-white border-0 text-xs flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" /> Beginner
                          </Badge>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                        <Badge variant="secondary" className="bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 border-0 text-xs backdrop-blur-sm">
                          {g.category}
                        </Badge>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${
                          g.level === "beginner" ? "bg-green-500/80 text-white" :
                          g.level === "intermediate" ? "bg-amber-500/80 text-white" :
                          g.level === "advanced" ? "bg-red-500/80 text-white" : "bg-blue-500/80 text-white"
                        }`}>
                          {g.level}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                        {g.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{g.excerpt}</p>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {g.readTime} min</span>
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {g.views}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {g.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bookmark className="h-3 w-3" /> {g.bookmarks?.length || 0}
                          </span>
                        </div>
                      </div>

                      {g.author && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{g.author?.fullname || "Editorial Team"}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages} &middot; {total} guides total
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-300 hover:text-amber-600"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>

                  {getPageNumbers().map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        p === page
                          ? "bg-amber-600 text-white shadow-md"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-300 hover:text-amber-600"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-300 hover:text-amber-600"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <NewsletterSection title="Get Weekly Career Advice" subtitle="Join 50,000+ professionals who receive our career guide newsletter." />
    </div>
  );
}