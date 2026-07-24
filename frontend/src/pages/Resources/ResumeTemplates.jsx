import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Download, Eye, Star, Clock, ArrowRight } from "lucide-react";
import axios from "axios";
import { RESUME_TEMPLATE_API_END_POINT } from "@/utils/constant";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import NewsletterSection from "@/components/sections/NewsletterSection";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatDownloads(count) {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return String(count);
}

export default function ResumeTemplates() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    axios.get(`${RESUME_TEMPLATE_API_END_POINT}/categories`)
      .then((res) => {
        const cats = Array.isArray(res.data) ? res.data : (res.data.categories || []);
        setCategories(["All", ...cats]);
      })
      .catch(() => {});
  }, []);

  function loadTemplates() {
    setLoading(true);
    setError(null);
    const params = { page: 1, limit: 12 };
    if (activeCat !== "All") params.category = activeCat;
    if (debouncedSearch) params.search = debouncedSearch;
    axios.get(RESUME_TEMPLATE_API_END_POINT, { params })
      .then((res) => {
        setTemplates(res.data.templates || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to load templates. Please try again.");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadTemplates();
  }, [activeCat, debouncedSearch]);

  function handleDownload(id) {
    axios.post(`${RESUME_TEMPLATE_API_END_POINT}/${id}/download`)
      .then(() => {
        setTemplates((prev) =>
          prev.map((t) =>
            t._id === id ? { ...t, downloads: (t.downloads || 0) + 1 } : t
          )
        );
      })
      .catch(() => {});
  }

  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200 dark:bg-gray-700" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="flex justify-between pt-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="Professional Templates"
        title="Resume Templates"
        subtitle="Choose from expertly designed resume templates that pass ATS scans and impress recruiters."
        gradient="from-pink-600 via-rose-700 to-red-900"
      >
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border-0 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-lg text-sm"
          />
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCat === cat
                  ? "bg-[#0A66C2] text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-pink-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
            <Button
              onClick={loadTemplates}
              size="sm"
              className="rounded-lg bg-pink-600 hover:bg-pink-700 text-white"
            >
              Try Again
            </Button>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">No templates found</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((t, i) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow overflow-hidden hover:shadow-lg hover:border-pink-200 dark:hover:border-pink-800 transition-all group"
              >
                <div className="h-40 bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 flex items-center justify-center border-b border-gray-100 dark:border-gray-700">
                  <FileText className="h-16 w-16 text-pink-300 dark:text-pink-600" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t.name}</h3>
                    <span className="flex items-center gap-1 text-xs text-yellow-500">
                      <Star className="h-3.5 w-3.5 fill-current" /> {t.rating}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-0 text-xs mb-2">{t.category}</Badge>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Download className="h-3 w-3" /> {formatDownloads(t.downloads)} downloads</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg border-gray-200 dark:border-gray-700"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" className="rounded-lg bg-pink-600 hover:bg-pink-700 text-white" onClick={() => handleDownload(t._id)}><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CTABanner
        title="Build Your Resume in Minutes"
        subtitle="Choose a template and use our AI builder to create a professional resume."
        buttonText="Get Started"
        buttonLink="/ai-resume"
        gradient="from-pink-600 via-rose-700 to-red-900"
      />
    </div>
  );
}
