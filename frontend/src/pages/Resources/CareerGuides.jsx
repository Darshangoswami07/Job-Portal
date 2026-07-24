import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, ArrowRight, Clock, ChevronRight, GraduationCap, Target, Users, TrendingUp, AlertCircle, BookOpenCheck } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import NewsletterSection from "@/components/sections/NewsletterSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CAREER_GUIDE_API_END_POINT } from "@/utils/constant";

const topics = [
  { icon: GraduationCap, label: "Beginner", desc: "Start your journey", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  { icon: Target, label: "Intermediate", desc: "Level up skills", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
  { icon: TrendingUp, label: "Advanced", desc: "Expert insights", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/30" },
  { icon: Users, label: "All Levels", desc: "For everyone", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/30" },
];

export default function CareerGuides() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [guides, setGuides] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGuides = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: 1, limit: 12 };
      if (activeCat !== "All") params.category = activeCat;
      if (search) params.search = search;
      const res = await axios.get(CAREER_GUIDE_API_END_POINT, { params });
      if (res.data.success) {
        setGuides(res.data.guides || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load career guides.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${CAREER_GUIDE_API_END_POINT}/categories`);
      if (res.data.success && res.data.categories) {
        setCategories(["All", ...res.data.categories]);
      }
    } catch (err) {
      // keep default ["All"]
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGuides();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, activeCat]);

  const handleCardClick = (slug) => {
    if (slug) navigate(`/resources/career-guides/${slug}`);
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="Expert Knowledge"
        title="Career Guides"
        subtitle="In-depth guides to help you navigate every stage of your career journey, from first job to leadership."
        gradient="from-amber-600 via-orange-700 to-red-900"
      >
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border-0 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-lg text-sm"
          />
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {topics.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-4 text-center"
            >
              <div className={`h-10 w-10 rounded-xl ${t.bg} flex items-center justify-center mx-auto mb-2`}>
                <t.icon className={`h-5 w-5 ${t.color}`} />
              </div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCat === cat
                  ? "bg-[#0A66C2] text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-amber-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 animate-pulse">
                <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-3" />
                <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchGuides} variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20">Try Again</Button>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-16">
            <BookOpenCheck className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No guides found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter to find what you&apos;re looking for.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((g, i) => (
              <motion.div
                key={g._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleCardClick(g.slug)}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-800 transition-all cursor-pointer group"
              >
                <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 mb-3">{g.category}</Badge>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{g.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{g.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {g.readTime} min read</span>
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <NewsletterSection title="Get Weekly Career Advice" subtitle="Join 50,000+ professionals who receive our career guide newsletter." />
    </div>
  );
}
