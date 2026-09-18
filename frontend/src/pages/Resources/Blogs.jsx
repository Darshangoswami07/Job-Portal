import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, User, ArrowRight, Clock, ChevronLeft, ChevronRight, Eye, TrendingUp, Bookmark, Loader2 } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import NewsletterSection from "@/components/sections/NewsletterSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { BLOG_API_END_POINT } from "@/utils/constant";
import { useDebounce } from "@/hooks/useDebounce";

const POSTS_PER_PAGE = 12;

export default function Blogs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeCat, setActiveCat] = useState(searchParams.get("category") || "All");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trending, setTrending] = useState([]);

  const debouncedSearch = useDebounce(search, 400);

  const fetchBlogs = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit: POSTS_PER_PAGE,
        ...(activeCat !== "All" && { category: activeCat }),
        ...(debouncedSearch && { search: debouncedSearch }),
      };

      const paramsObj = new URLSearchParams();
      if (debouncedSearch) paramsObj.set("search", debouncedSearch);
      if (activeCat !== "All") paramsObj.set("category", activeCat);
      if (page > 1) paramsObj.set("page", String(page));
      setSearchParams(paramsObj, { replace: true });

      const { data } = await axios.get(BLOG_API_END_POINT, { params, withCredentials: true, signal });
      if (data.success) {
        setBlogs(data.blogs);
        setTotalPages(data.pages);
        setTotal(data.total);
        if (data.categories?.length) setCategories(["All", ...data.categories]);
      } else {
        setError("Failed to load blogs.");
        setBlogs([]);
      }
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        setError(err.response?.data?.message || "Something went wrong. Please try again.");
        setBlogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async (signal) => {
    try {
      const { data } = await axios.get(`${BLOG_API_END_POINT}/trending`, { withCredentials: true, signal });
      if (data.success) setTrending(data.blogs);
    } catch {}
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchBlogs(controller.signal);
    return () => controller.abort();
  }, [page, activeCat, debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTrending(controller.signal);
    return () => controller.abort();
  }, []);

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const featured = blogs.filter((b) => b.featured);
  const normal = blogs.filter((b) => !b.featured);

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="Career Insights"
        title="JobPilot Ai Blog"
        subtitle="Expert advice, career tips, and industry insights to help you navigate your career journey."
        gradient="from-sky-600 via-blue-700 to-indigo-900"
      >
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search articles by title, content, tags, or category..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border-0 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg text-sm"
          />
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trending.length > 0 && page === 1 && !debouncedSearch && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trending Now</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {trending.map((post) => (
                <div
                  key={post._id}
                  onClick={() => navigate(`/blogs/${post.slug}`)}
                  className="flex-shrink-0 w-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  {post.coverImage && (
                    <img src={post.coverImage} alt="" className="w-full h-32 object-cover" loading="lazy" />
                  )}
                  <div className="p-3">
                    <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0 text-xs mb-2">{post.category}</Badge>
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">{post.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCat(cat); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCat === cat
                  ? "bg-[#0A66C2] text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400 text-lg">{error}</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => fetchBlogs(new AbortController().signal)}>
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && blogs.length === 0 && (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No articles found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {debouncedSearch
                ? `No results for "${debouncedSearch}". Try different keywords or browse all categories.`
                : activeCat !== "All"
                ? `No articles in "${activeCat}" yet. Check back soon or explore other categories.`
                : "No blogs have been published yet."}
            </p>
            {(debouncedSearch || activeCat !== "All") && (
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => { setSearch(""); setActiveCat("All"); setPage(1); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {!loading && !error && blogs.length > 0 && (
          <>
            {featured.length > 0 && page === 1 && (
              <div className="mb-8">
                {featured.slice(0, 1).map((post) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => navigate(`/blogs/${post.slug}`)}
                    className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all group"
                  >
                    <div className="relative z-10 p-8 sm:p-10">
                      <Badge className="bg-white/20 text-white border-0 mb-3">{post.category}</Badge>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 group-hover:underline">{post.title}</h2>
                      <p className="text-blue-100/80 mb-4 line-clamp-2">{post.excerpt || "Featured Article"}</p>
                      <div className="flex items-center gap-4 text-sm text-blue-200">
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {post.author?.fullname || "Unknown"}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.createdAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.readTime} min</span>
                        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {post.views}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(page > 1 ? blogs : normal).map((post, i) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/blogs/${post.slug}`)}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer group"
                >
                  {post.coverImage && (
                    <div className="h-44 overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0 mb-3">{post.category}</Badge>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-[#0A66C2] dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author?.fullname || "Unknown"}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime} min</span>
                    </div>
                  </div>
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

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? "bg-[#0A66C2] text-white"
                            : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

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

            <div className="text-center text-sm text-gray-400 mt-4">
              Showing {blogs.length} of {total} articles
            </div>
          </>
        )}
      </div>

      <NewsletterSection title="Never Miss an Update" subtitle="Get the latest career tips and insights delivered to your inbox." />
    </div>
  );
}