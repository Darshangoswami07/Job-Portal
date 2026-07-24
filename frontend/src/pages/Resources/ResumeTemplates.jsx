import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Heart, Download, Eye, Star, Clock, Sparkles, Filter, X,
  ChevronLeft, ChevronRight, Crown, FileText, Grid3X3, LayoutList,
  ArrowRight, AlertCircle, ExternalLink, Palette, Zap, Shield,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { RESUME_TEMPLATE_API_END_POINT } from "@/utils/constant";
import { useSelector } from "react-redux";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SORT_OPTIONS = [
  { value: "-popularity", label: "Popular" },
  { value: "-downloads", label: "Most Downloaded" },
  { value: "-rating", label: "Highest Rated" },
  { value: "-atsScore", label: "Best ATS Score" },
  { value: "name", label: "Name A-Z" },
  { value: "-createdAt", label: "Newest" },
];

const CATEGORIES = [
  "All", "Professional", "Modern", "Technology", "AI Engineer",
  "Creative", "Student", "Business", "Finance", "Healthcare",
  "Sales", "HR", "Product Manager", "Project Manager", "Consultant",
  "Freelancer", "Academic", "International Resume", "Legal",
];

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

const atsColor = (score) => {
  if (score >= 95) return "text-green-600 dark:text-green-400";
  if (score >= 85) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

const atsBg = (score) => {
  if (score >= 95) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
  if (score >= 85) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
  return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
};

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-52 bg-gray-200 dark:bg-gray-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TemplatePreview({ template, open, onClose }) {
  if (!open || !template) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{template.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div
                className="w-full aspect-[3/4] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: template.previewSvg || "" }}
              />
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Template Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Category</span>
                    <span className="font-medium text-gray-900 dark:text-white">{template.category}</span>
                  </div>
                  {template.subcategory && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Subcategory</span>
                      <span className="font-medium text-gray-900 dark:text-white">{template.subcategory}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">ATS Score</span>
                    <span className={cn("font-bold", atsColor(template.atsScore))}>{template.atsScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Downloads</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCount(template.downloads)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Rating</span>
                    <span className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {template.rating}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Layout</span>
                    <span className="font-medium capitalize text-gray-900 dark:text-white">{template.layout}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Font</span>
                    <span className="font-medium text-gray-900 dark:text-white">{template.font}</span>
                  </div>
                </div>
              </div>

              {template.features && template.features.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Features</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {template.features.map((f) => (
                      <Badge key={f} variant="secondary" className="text-[10px] px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Color Theme</h3>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600" style={{ backgroundColor: template.colors?.primary }} title="Primary" />
                  <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600" style={{ backgroundColor: template.colors?.secondary }} title="Secondary" />
                  <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600" style={{ backgroundColor: template.colors?.accent }} title="Accent" />
                  <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600" style={{ backgroundColor: template.colors?.background }} title="Background" />
                  <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600" style={{ backgroundColor: template.colors?.text }} title="Text" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-xl gap-2 bg-[#0A66C2] hover:bg-[#0A66C2]/90"
                  onClick={() => {
                    onClose();
                    window.location.href = `/ai-resume?template=${template.slug}`;
                  }}
                >
                  <FileText className="h-4 w-4" /> Use Template
                </Button>
                <Button variant="outline" className="rounded-xl gap-2">
                  <Heart className="h-4 w-4" /> Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ResumeTemplates() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCat, setActiveCat] = useState(searchParams.get("category") || "All");
  const [sort, setSort] = useState("-popularity");
  const [layout, setLayout] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    if (search) setPage(1);
  }, [debouncedSearch]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, sort };
      if (activeCat !== "All") params.category = activeCat;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await axios.get(RESUME_TEMPLATE_API_END_POINT, { params });
      if (res.data?.success) {
        setTemplates(res.data.templates || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [activeCat, debouncedSearch, sort, page]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  useEffect(() => {
    axios.get(`${RESUME_TEMPLATE_API_END_POINT}/categories`).then((res) => {
      if (res.data?.success) {
        setCategories(res.data.categories || []);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${RESUME_TEMPLATE_API_END_POINT}/featured`).then((res) => {
      if (res.data?.success) setFeatured(res.data.templates || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (activeCat !== "All") params.category = activeCat;
    setSearchParams(params, { replace: true });
  }, [search, activeCat, setSearchParams]);

  const handleDownload = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await axios.post(`${RESUME_TEMPLATE_API_END_POINT}/${id}/download`);
      if (res.data?.success) {
        setTemplates((prev) =>
          prev.map((t) => t._id === id ? { ...t, downloads: (t.downloads || 0) + 1 } : t)
        );
        toast.success("Download tracked!");
      }
    } catch {}
  };

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleUseTemplate = (template) => {
    navigate(`/ai-resume?template=${template.slug}`);
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge={`${total > 0 ? total.toLocaleString() : "100+"} Templates`}
        title="Resume Templates"
        subtitle="Choose from 100+ ATS-friendly, professionally designed resume templates. Each template is optimized to pass ATS scans and impress recruiters."
        gradient="from-pink-600 via-rose-700 to-red-900"
      >
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by name, category, or style..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border-0 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-lg text-sm"
          />
        </div>
      </PageHero>

      {featured.length > 0 && activeCat === "All" && !debouncedSearch && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" /> Featured Templates
            </h2>
            <div className="flex gap-1">
              {featured.map((t) => (
                <div key={t._id} className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {featured.slice(0, 8).map((t) => (
              <motion.button
                key={t._id}
                whileHover={{ y: -4 }}
                onClick={() => setPreviewTemplate(t)}
                className="text-left group"
              >
                <div
                  className="aspect-[3/4] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 p-2 flex items-center justify-center hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-700 transition-all"
                  dangerouslySetInnerHTML={{ __html: t.previewSvg || "" }}
                />
                <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mt-1.5 truncate">{t.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400">{t.category}</span>
                  {t.isPremium && <Crown className="h-2.5 w-2.5 text-amber-500" />}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="flex flex-wrap gap-1.5 flex-1">
            {categories.slice(0, 10).map((c) => (
              <button
                key={c.name || c}
                onClick={() => { setActiveCat(c.name || c); setPage(1); }}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  activeCat === (c.name || c)
                    ? "bg-[#0A66C2] text-white shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-pink-300"
                )}
              >
                {c.name || c}
                {c.count && ` (${c.count})`}
              </button>
            ))}
            {categories.length > 10 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                  showFilters
                    ? "bg-[#0A66C2] text-white border-[#0A66C2]"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                )}
              >
                +{categories.length - 10} more
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-8 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setLayout("grid")}
                className={cn("p-1.5", layout === "grid" ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600" : "bg-white dark:bg-gray-800 text-gray-400")}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLayout("list")}
                className={cn("p-1.5", layout === "list" ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600" : "bg-white dark:bg-gray-800 text-gray-400")}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 h-8"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">All Categories</h3>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c.name || c}
                      onClick={() => { setActiveCat(c.name || c); setPage(1); setShowFilters(false); }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        activeCat === (c.name || c)
                          ? "bg-[#0A66C2] text-white"
                          : "bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      {c.name || c}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total > 0 ? `Showing ${templates.length} of ${total.toLocaleString()} templates` : "Loading templates..."}
          </p>
          {activeCat !== "All" && (
            <button
              onClick={() => { setActiveCat("All"); setPage(1); }}
              className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear filter
            </button>
          )}
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No templates found</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">Try adjusting your search or filters</p>
            <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => { setSearch(""); setActiveCat("All"); }}>
              Reset Filters
            </Button>
          </div>
        ) : layout === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {templates.map((t, i) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-pink-200 dark:hover:border-pink-800 transition-all group cursor-pointer"
                onClick={() => setPreviewTemplate(t)}
              >
                <div className="relative">
                  <div
                    className="aspect-[3/4] bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-3 border-b border-gray-100 dark:border-gray-700"
                    dangerouslySetInnerHTML={{ __html: t.previewSvg || "" }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUseTemplate(t); }}
                      className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      <Eye className="h-4 w-4 inline mr-1.5" /> Preview
                    </button>
                  </div>
                  {t.isPremium && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-amber-500 text-white border-0 text-[10px] px-2 py-0.5 flex items-center gap-1">
                        <Crown className="h-3 w-3" /> Premium
                      </Badge>
                    </div>
                  )}
                  <button
                    onClick={(e) => toggleFavorite(t._id, e)}
                    className={cn(
                      "absolute top-2 right-2 p-1.5 rounded-lg transition-all",
                      favorites.has(t._id)
                        ? "bg-pink-50 dark:bg-pink-900/30"
                        : "bg-white/80 dark:bg-gray-800/80 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4 transition-colors",
                        favorites.has(t._id) ? "fill-pink-500 text-pink-500" : "text-gray-400 hover:text-pink-500"
                      )}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{t.name}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{t.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800">
                      {t.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0.5 border font-medium", atsBg(t.atsScore), atsColor(t.atsScore))}
                    >
                      ATS {t.atsScore}%
                    </Badge>
                    {t.subcategory && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{t.subcategory}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1"><Download className="h-3 w-3" />{formatCount(t.downloads)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 rounded-lg text-xs bg-pink-600 hover:bg-pink-700 text-white gap-1"
                      onClick={(e) => { e.stopPropagation(); handleUseTemplate(t); }}
                    >
                      Use <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setPreviewTemplate(t)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4 hover:shadow-md cursor-pointer transition-all"
              >
                <div
                  className="w-16 h-20 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: t.previewSvg || "" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</h3>
                    {t.isPremium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{t.category}</span>
                    <span>ATS {t.atsScore}%</span>
                    <span>★ {t.rating}</span>
                    <span>{formatCount(t.downloads)} downloads</span>
                  </div>
                </div>
                <Button size="sm" className="h-8 rounded-lg text-xs bg-pink-600 hover:bg-pink-700" onClick={(e) => { e.stopPropagation(); handleUseTemplate(t); }}>
                  Use Template
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button variant="outline" size="sm" className="rounded-xl" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                      page === p ? "bg-pink-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-pink-300"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <Button variant="outline" size="sm" className="rounded-xl" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <CTABanner
        title="Build Your Resume in Minutes"
        subtitle="Choose a template and use our AI-powered builder to create a professional, ATS-optimized resume."
        buttonText="Get Started"
        buttonLink="/ai-resume"
        gradient="from-pink-600 via-rose-700 to-red-900"
      />

      <AnimatePresence>
        {previewTemplate && (
          <TemplatePreview
            template={previewTemplate}
            open={!!previewTemplate}
            onClose={() => setPreviewTemplate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
