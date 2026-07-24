import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Search, X, MapPin, Briefcase, Building2, ArrowRight, Globe,
  SlidersHorizontal, ChevronDown, ChevronUp, Filter, Star,
  TrendingUp, Users, DollarSign, RefreshCw, Clock,
  Loader2, ChevronLeft, ChevronRight, Sparkles, Activity,
  Shield, Zap, BarChart3, Hash, Layers, Grid, List,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMPANY_PROFILE_API_END_POINT } from "@/utils/constant";
import { useDebounce } from "@/hooks/useDebounce";

function CompanySkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-2xl bg-gray-200 shrink-0" />
          <div className="space-y-2.5 flex-1">
            <div className="h-5 w-40 rounded-lg bg-gray-200" />
            <div className="h-4 w-28 rounded-lg bg-gray-200" />
          </div>
        </div>
        <div className="space-y-2.5 mb-5">
          <div className="h-3 w-full rounded-lg bg-gray-200" />
          <div className="h-3 w-3/4 rounded-lg bg-gray-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-28 rounded-full bg-gray-200" />
          <div className="h-7 w-24 rounded-full bg-gray-200" />
          <div className="h-7 w-20 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 w-full rounded-xl bg-gray-200" />
      ))}
    </div>
  );
}

const HIRING_BADGES = {
  actively_hiring: { label: "Actively Hiring", class: "bg-green-50 text-green-700 border-green-200" },
  selectively_hiring: { label: "Selectively Hiring", class: "bg-amber-50 text-amber-700 border-amber-200" },
  not_hiring: { label: "Not Hiring", class: "bg-gray-50 text-gray-500 border-gray-200" },
  unknown: { label: "Unknown", class: "bg-gray-50 text-gray-400 border-gray-200" },
};

const SORT_OPTIONS = [
  { value: "most_jobs", label: "Most Jobs", icon: Briefcase },
  { value: "newest", label: "Newest", icon: Clock },
  { value: "highest_rated", label: "Highest Rated", icon: Star },
  { value: "highest_paying", label: "Highest Paying", icon: DollarSign },
  { value: "growth_score", label: "Fastest Growing", icon: TrendingUp },
  { value: "recently_active", label: "Recently Active", icon: Activity },
  { value: "alphabetical", label: "Alphabetical", icon: BarChart3 },
];

const INDUSTRIES = [
  "Software Engineering", "Design", "Marketing", "Sales", "Finance",
  "Human Resources", "Healthcare", "Legal", "Consulting", "Education",
  "Customer Success", "Product Management", "Cybersecurity", "Data & Analytics",
  "Technology",
];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const companyCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 15 },
  },
};

export default function BrowseCompanies() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ industries: [], hiringStatuses: [], locations: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const searchInput = searchParams.get("search") || "";
  const [searchText, setSearchText] = useState(searchInput);
  const debouncedSearch = useDebounce(searchText, 300);

  const [activeFilters, setActiveFilters] = useState({
    industry: searchParams.get("industry") || "",
    hiringStatus: searchParams.get("hiringStatus") || "",
    location: searchParams.get("location") || "",
    minSalary: searchParams.get("minSalary") || "",
    maxSalary: searchParams.get("maxSalary") || "",
    minRating: searchParams.get("minRating") || "",
  });

  const sortBy = searchParams.get("sort") || "most_jobs";
  const page = Number(searchParams.get("page")) || 1;

  const sentinelRef = useRef(null);
  const initialFetchDone = useRef(false);

  const fetchCompanies = useCallback(async (pageNum, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (activeFilters.industry) params.set("industry", activeFilters.industry);
      if (activeFilters.hiringStatus) params.set("hiringStatus", activeFilters.hiringStatus);
      if (activeFilters.location) params.set("location", activeFilters.location);
      if (activeFilters.minSalary) params.set("minSalary", activeFilters.minSalary);
      if (activeFilters.maxSalary) params.set("maxSalary", activeFilters.maxSalary);
      if (activeFilters.minRating) params.set("minRating", activeFilters.minRating);
      if (sortBy) params.set("sort", sortBy);
      params.set("page", String(pageNum));
      params.set("limit", "12");

      const res = await axios.get(`${COMPANY_PROFILE_API_END_POINT}?${params.toString()}`, {
        timeout: 15000,
      });

      if (res.data.success) {
        if (append) {
          setCompanies((prev) => [...prev, ...res.data.companies]);
        } else {
          setCompanies(res.data.companies);
        }
        setPagination(res.data.pagination);
        if (res.data.filters) {
          setFilters((prev) => ({
            industries: res.data.filters.industries || prev.industries,
            hiringStatuses: res.data.filters.hiringStatuses || prev.hiringStatuses,
            locations: res.data.filters.locations || prev.locations,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, activeFilters, sortBy]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${COMPANY_PROFILE_API_END_POINT}/stats`, { timeout: 10000 });
      if (res.data.success) setStats(res.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    initialFetchDone.current = false;
  }, [debouncedSearch, activeFilters, sortBy]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchCompanies(1);
      initialFetchDone.current = true;
    }
  }, [fetchCompanies]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (activeFilters.industry) params.set("industry", activeFilters.industry);
    if (activeFilters.hiringStatus) params.set("hiringStatus", activeFilters.hiringStatus);
    if (activeFilters.location) params.set("location", activeFilters.location);
    if (activeFilters.minSalary) params.set("minSalary", activeFilters.minSalary);
    if (activeFilters.maxSalary) params.set("maxSalary", activeFilters.maxSalary);
    if (activeFilters.minRating) params.set("minRating", activeFilters.minRating);
    if (sortBy && sortBy !== "most_jobs") params.set("sort", sortBy);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, activeFilters, sortBy, setSearchParams]);

  useEffect(() => {
    if (!sentinelRef.current || !pagination?.hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !loadingMore && !loading) {
          fetchCompanies(pagination.page + 1, true);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [pagination, loadingMore, loading, fetchCompanies]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    if (!val && debouncedSearch !== val) {
      initialFetchDone.current = false;
    }
  };

  const clearFilters = () => {
    setActiveFilters({
      industry: "", hiringStatus: "", location: "",
      minSalary: "", maxSalary: "", minRating: "",
    });
    setSearchText("");
    initialFetchDone.current = false;
  };

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== "");
  const activeFilterCount = Object.values(activeFilters).filter((v) => v !== "").length;

  const totalDisplayed = pagination?.total || companies.length;

  const formatSalary = (num) => {
    if (!num) return null;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num}`;
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 px-4 py-3 flex items-center gap-3"
    >
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
        <p className="text-xs text-blue-200">{label}</p>
      </div>
    </motion.div>
  );

  const FilterPanel = ({ mobile }) => {
    const content = (
      <div className={mobile ? "space-y-4" : "space-y-5"}>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Industry
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {(filters.industries.length > 0 ? filters.industries : INDUSTRIES).map((ind) => (
              <button
                key={ind}
                onClick={() => setActiveFilters((p) => ({ ...p, industry: p.industry === ind ? "" : ind }))}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  activeFilters.industry === ind
                    ? "bg-[#0A66C2]/10 text-[#0A66C2] font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Hiring Status
          </h4>
          <div className="space-y-1">
            {["actively_hiring", "selectively_hiring", "not_hiring"].map((status) => {
              const badge = HIRING_BADGES[status];
              return (
                <button
                  key={status}
                  onClick={() => setActiveFilters((p) => ({ ...p, hiringStatus: p.hiringStatus === status ? "" : status }))}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    activeFilters.hiringStatus === status
                      ? "ring-2 ring-[#0A66C2]/30 bg-blue-50"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Badge variant="outline" className={`${badge.class} text-xs px-2 py-0.5 rounded-full border`}>
                    {badge.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Location
          </h4>
          <input
            type="text"
            value={activeFilters.location}
            onChange={(e) => setActiveFilters((p) => ({ ...p, location: e.target.value }))}
            placeholder="Filter by location..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2]"
          />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> Salary Range
          </h4>
          <div className="flex gap-2">
            <input
              type="number"
              value={activeFilters.minSalary}
              onChange={(e) => setActiveFilters((p) => ({ ...p, minSalary: e.target.value }))}
              placeholder="Min"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2]"
            />
            <input
              type="number"
              value={activeFilters.maxSalary}
              onChange={(e) => setActiveFilters((p) => ({ ...p, maxSalary: e.target.value }))}
              placeholder="Max"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2]"
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" /> Min. Rating
          </h4>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setActiveFilters((p) => ({ ...p, minRating: p.minRating === String(r) ? "" : String(r) }))}
                className={`p-1.5 rounded-lg transition-colors ${
                  activeFilters.minRating === String(r)
                    ? "bg-amber-100 text-amber-600"
                    : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"
                }`}
              >
                <Star className={`h-4 w-4 ${Number(activeFilters.minRating) >= r ? "fill-amber-400 text-amber-400" : ""}`} />
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-gray-200 text-xs"
          >
            <X className="h-3 w-3 mr-1.5" />
            Clear All Filters
          </Button>
        )}
      </div>
    );

    if (mobile) return content;

    return (
      <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#0A66C2]" />
            Filters
          </h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-[#0A66C2]/10 text-[#0A66C2] text-xs rounded-full px-2.5">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {content}
      </div>
    );
  };

  const renderCompanyCard = (company, index) => {
    const hiringBadge = HIRING_BADGES[company.hiringStatus] || HIRING_BADGES.unknown;
    return (
      <motion.div
        key={company._id}
        variants={companyCardVariants}
        whileHover={{ y: -6, transition: { type: "spring", stiffness: 300 } }}
        onClick={() => navigate(`/company/${company._id}`)}
        className="bg-white rounded-2xl border border-gray-100 card-shadow hover:card-shadow-hover hover:border-[#0A66C2]/30 cursor-pointer transition-all duration-300 overflow-hidden group"
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <Avatar className="h-full w-full rounded-2xl">
                <AvatarImage src={company.logo} alt={company.name} />
              </Avatar>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-[#0A66C2] transition-colors">
                {company.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{company.industry || "Technology"}</p>
              {company.locations?.length > 0 && (
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{company.locations.slice(0, 2).join(", ")}{company.locations.length > 2 ? ` +${company.locations.length - 2}` : ""}</span>
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed min-h-[2.5rem]">
            {company.description || "No description provided."}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <Badge variant="secondary" className={`${hiringBadge.class} font-medium text-xs rounded-full px-2.5 py-0.5`}>
              {hiringBadge.label}
            </Badge>
            {company.openJobCount > 0 && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs rounded-full px-2.5 py-0.5">
                <Briefcase className="h-3 w-3 mr-1" />
                {company.openJobCount} {company.openJobCount === 1 ? "job" : "jobs"}
              </Badge>
            )}
            {company.salaries?.avgSalary > 0 && (
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 font-medium text-xs rounded-full px-2.5 py-0.5">
                <DollarSign className="h-3 w-3 mr-0.5" />
                {formatSalary(company.salaries.avgSalary)}/yr
              </Badge>
            )}
          </div>

          {company.techStack?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-0">
              {company.techStack.slice(0, 4).map((tech) => (
                <span key={tech} className="text-[10px] bg-gray-50 text-gray-500 border border-gray-100 rounded-md px-1.5 py-0.5">
                  {tech}
                </span>
              ))}
              {company.techStack.length > 4 && (
                <span className="text-[10px] text-gray-400">+{company.techStack.length - 4}</span>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {company.ratings?.overall > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {company.ratings.overall.toFixed(1)}
                </span>
              )}
              {company.aiInsights?.growthScore > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Score {company.aiInsights.growthScore}
                </span>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-[#0A66C2] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#F3F2EF]"
    >
      <Navbar />

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A66C2] via-[#004182] to-[#002244] pb-8 sm:pb-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-300/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 right-10 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-6"
            >
              <Building2 className="h-4 w-4 text-blue-200" />
              <span className="text-sm font-medium text-blue-100">
                {stats?.totalCompanies
                  ? `${stats.totalCompanies.toLocaleString()} companies on JobHub`
                  : "Explore great companies"}
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Discover Great
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
                Places to Work
              </span>
            </h1>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-8">
              Explore company profiles, culture, salaries, and open positions to find your next career move.
            </p>

            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#0A66C2] transition-colors" />
                <input
                  type="text"
                  value={searchText}
                  onChange={handleSearchChange}
                  placeholder="Search companies by name, industry, location, or technology..."
                  className="w-full h-14 pl-14 pr-12 rounded-2xl border-0 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-xl text-base"
                />
                {searchText && (
                  <button
                    onClick={() => { setSearchText(""); initialFetchDone.current = false; }}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <StatCard icon={Building2} label="Companies" value={stats?.totalCompanies} color="bg-blue-500" />
              <StatCard icon={Briefcase} label="Open Jobs" value={stats?.totalOpenJobs} color="bg-green-500" />
              <StatCard icon={Users} label="Actively Hiring" value={stats?.activelyHiring} color="bg-purple-500" />
              <StatCard icon={TrendingUp} label="Industries" value={stats?.topIndustries?.length || "—"} color="bg-amber-500" />
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F3F2EF] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 relative z-20">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterPanel mobile={false} />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-4 mb-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {debouncedSearch ? `Results for "${debouncedSearch}"` : "All Companies"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {totalDisplayed} {totalDisplayed === 1 ? "company" : "companies"} found
                      {pagination?.totalPages > 1 && ` · Page ${pagination.page} of ${pagination.totalPages}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge className="bg-[#0A66C2] text-white text-xs rounded-full px-1.5 py-0 ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </button>

                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-[#0A66C2]" : "text-gray-400 hover:text-gray-600"}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-[#0A66C2]" : "text-gray-400 hover:text-gray-600"}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        const params = new URLSearchParams(searchParams);
                        params.set("sort", e.target.value);
                        setSearchParams(params);
                        initialFetchDone.current = false;
                      }}
                      className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2] cursor-pointer"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl border border-gray-100 card-shadow p-5 mb-6 lg:hidden"
              >
                <FilterPanel mobile />
              </motion.div>
            )}

            {loading && companies.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CompanySkeleton key={i} />
                ))}
              </div>
            ) : companies.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-gray-200 card-shadow p-16 text-center"
              >
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 mb-6">
                  <Building2 className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No companies found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {hasActiveFilters || debouncedSearch
                    ? "Try adjusting your search or filters to find more companies."
                    : "There are no companies yet. Companies will appear here once jobs are posted."}
                </p>
                <div className="flex gap-3 justify-center">
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline" className="rounded-xl border-gray-300">
                      Clear filters
                    </Button>
                  )}
                  <Button onClick={() => navigate("/jobs")} className="btn-primary rounded-xl">
                    Browse Jobs
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {companies.map((company, index) => renderCompanyCard(company, index))}
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {companies.map((company) => (
                      <motion.div
                        key={company._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ x: 4 }}
                        onClick={() => navigate(`/company/${company._id}`)}
                        className="bg-white rounded-2xl border border-gray-100 card-shadow hover:card-shadow-hover hover:border-[#0A66C2]/30 cursor-pointer transition-all duration-300 p-5 flex items-center gap-5"
                      >
                        <div className="h-14 w-14 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 shrink-0">
                          <Avatar className="h-full w-full rounded-xl">
                            <AvatarImage src={company.logo} alt={company.name} />
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
                            <Badge variant="secondary" className={`${(HIRING_BADGES[company.hiringStatus] || HIRING_BADGES.unknown).class} text-[10px] rounded-full px-2 py-0`}>
                              {(HIRING_BADGES[company.hiringStatus] || HIRING_BADGES.unknown).label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{company.industry || "Technology"}</span>
                            {company.openJobCount > 0 && <span>· {company.openJobCount} jobs</span>}
                            {company.salaries?.avgSalary > 0 && <span>· {formatSalary(company.salaries.avgSalary)}/yr</span>}
                            {company.locations?.length > 0 && <span>· {company.locations[0]}</span>}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#0A66C2] transition-colors shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                )}

                <div ref={sentinelRef} className="flex justify-center py-8">
                  {loadingMore && (
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin text-[#0A66C2]" />
                      Loading more companies...
                    </div>
                  )}
                  {!pagination?.hasMore && companies.length > 6 && (
                    <p className="text-sm text-gray-400">Showing all {totalDisplayed} companies</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
