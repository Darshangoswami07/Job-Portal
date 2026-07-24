import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, User, ArrowRight, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import NewsletterSection from "@/components/sections/NewsletterSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BLOG_API_END_POINT } from "@/utils/constant";

const POSTS_PER_PAGE = 6;

export default function Blogs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [page, setPage] = useState(1);
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBlogs = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit: POSTS_PER_PAGE,
        ...(activeCat !== "All" && { category: activeCat }),
        ...(search && { search }),
      };
      const { data } = await axios.get(BLOG_API_END_POINT, { params, withCredentials: true, signal });
      if (data.success) {
        setBlogs(data.blogs);
        setTotalPages(data.pages);
        const cats = [...new Set(data.blogs.map((b) => b.category).filter(Boolean))];
        setCategories(["All", ...cats]);
      } else {
        setError("Failed to load blogs.");
        setBlogs([]);
      }
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(err.response?.data?.message || "Something went wrong. Please try again.");
        setBlogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchBlogs(controller.signal);
    return () => controller.abort();
  }, [page, activeCat, search]);

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const featured = blogs.filter((b) => b.featured);
  const normal = blogs.filter((b) => !b.featured);

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="Career Insights"
        title="JobHub Blog"
        subtitle="Expert advice, career tips, and industry insights to help you navigate your career journey."
        gradient="from-sky-600 via-blue-700 to-indigo-900"
      >
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search articles..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border-0 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg text-sm"
          />
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400 text-lg">{error}</p>
          </div>
        )}

        {!loading && !error && blogs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No articles found.</p>
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
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white cursor-pointer hover:shadow-xl transition-all"
                  >
                    <Badge className="bg-white/20 text-white border-0 mb-3">{post.category}</Badge>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">{post.title}</h2>
                    <p className="text-blue-100 mb-4">Featured Article</p>
                    <div className="flex items-center gap-4 text-sm text-blue-200">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {post.author?.fullname || "Unknown"}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.createdAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.readTime} min</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(page > 1 ? blogs : normal).map((post, i) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer group"
                >
                  <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0 mb-3">{post.category}</Badge>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-[#0A66C2] dark:group-hover:text-blue-400 transition-colors">{post.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-4">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author?.fullname || "Unknown"}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime} min</span>
                  </div>
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

      <NewsletterSection title="Never Miss an Update" subtitle="Get the latest career tips and insights delivered to your inbox." />
    </div>
  );
}
