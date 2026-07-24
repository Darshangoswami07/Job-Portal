import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { SALARY_API_END_POINT } from "@/utils/constant";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp, MapPin, Briefcase, BarChart3,
  Filter, Download, X, ChevronLeft, ChevronRight,
  Search, SlidersHorizontal, WifiOff, RefreshCw,
  ChevronDown, ChevronUp, Building2, GraduationCap,
  DollarSign, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Calculator, GitCompare, Lightbulb, Award, TrendingUp as TrendingUpIcon,
  Users, Zap, Globe, BookOpen, ChevronRight as ChevronRightIcon,
  Info, Loader2, Star, CheckCircle2,
} from "lucide-react";

const PIE_COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444"];
const LEVEL_ORDER = { entry: 0, mid: 1, senior: 2, lead: 3 };

const formatSalary = (salary) => {
  if (salary == null || isNaN(salary)) return "N/A";
  const lakhs = salary / 100000;
  return `\u20B9${lakhs.toFixed(1)} LPA`;
};

const formatNumber = (num) => {
  if (num == null || isNaN(num)) return "N/A";
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
};

const EXPERIENCE_LEVELS = [
  { value: "", label: "All Levels" },
  { value: "entry", label: "Entry (0-2 yrs)" },
  { value: "mid", label: "Mid (3-5 yrs)" },
  { value: "senior", label: "Senior (6-9 yrs)" },
  { value: "lead", label: "Lead (10+ yrs)" },
];

const SORT_OPTIONS = [
  { value: "-averageSalary", label: "Salary: High to Low" },
  { value: "averageSalary", label: "Salary: Low to High" },
  { value: "-totalCompensation", label: "Total Comp: High to Low" },
  { value: "-annualGrowth", label: "Growth: High to Low" },
  { value: "-createdAt", label: "Most Recent" },
];

const TABS = [
  { id: "explore", label: "Explore", icon: Search },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "compare", label: "Compare", icon: GitCompare },
  { id: "ai-insights", label: "AI Insights", icon: Lightbulb },
  { id: "calculator", label: "Calculator", icon: Calculator },
];

const loadingSkeleton = (count) => (
  <div className={`grid grid-cols-1 ${count > 4 ? "md:grid-cols-2 lg:grid-cols-3" : `md:grid-cols-${Math.min(count, 4)}`} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    ))}
  </div>
);

export default function SalaryExplorer() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [activeTab, setActiveTab] = useState("explore");

  const [roles, setRoles] = useState([]);
  const [insights, setInsights] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [filters, setFilters] = useState({
    role: "", location: "", experienceLevel: "", skills: "", company: "",
    department: "", workMode: "", minSalary: "", maxSalary: "", sort: "-averageSalary",
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState("");

  const [trends, setTrends] = useState([]);
  const [roleTrends, setRoleTrends] = useState([]);

  const [compareRole1, setCompareRole1] = useState("");
  const [compareRole2, setCompareRole2] = useState("");
  const [comparison, setComparison] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  const [calcRole, setCalcRole] = useState("");
  const [calcLevel, setCalcLevel] = useState("");
  const [calcLocation, setCalcLocation] = useState("");
  const [calcSkills, setCalcSkills] = useState("");
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); }
  }, [user, navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [rolesRes, insightsRes, locationsRes, searchRes, deptRes] = await Promise.all([
        axios.get(`${SALARY_API_END_POINT}/roles`, { withCredentials: true }),
        axios.get(`${SALARY_API_END_POINT}/insights`, { withCredentials: true }),
        axios.get(`${SALARY_API_END_POINT}/locations`, { withCredentials: true }),
        axios.get(`${SALARY_API_END_POINT}/search?sort=-averageSalary&limit=20`, { withCredentials: true }),
        axios.get(`${SALARY_API_END_POINT}/departments`, { withCredentials: true }),
      ]);

      const roleNames = rolesRes.data?.roles || rolesRes.data || [];
      setRoles(roleNames);

      const locs = locationsRes.data?.locations || locationsRes.data || [];
      setLocations(locs);

      const depts = deptRes.data?.departments || deptRes.data || [];
      setDepartments(depts);

      const searchData = searchRes.data;
      const results = searchData?.results || searchData?.data || [];
      const total = searchData?.pagination?.total || searchData?.total || results.length;
      const pages = searchData?.pagination?.pages || searchData?.pages || Math.ceil(total / 20) || 1;
      setSearchResults(results);
      setTotalResults(total);
      setTotalPages(pages);
      setCurrentPage(1);

      const ins = insightsRes.data?.insights || insightsRes.data;
      if (ins && typeof ins === "object") {
        setInsights([
          { icon: TrendingUp, label: "Avg Salary", value: formatSalary(ins.averageSalary), sub: `${formatNumber(ins.totalDataPoints)} data points` },
          { icon: MapPin, label: "Top Paying City", value: ins.topCity || "N/A", sub: "Highest avg compensation" },
          { icon: Briefcase, label: "Highest Paid Role", value: ins.topPayingRole || "N/A", sub: ins.topPayingSalary ? formatSalary(ins.topPayingSalary) : "" },
          { icon: BarChart3, label: "Avg Salary Growth", value: `${ins.avgGrowth || 0}%`, sub: "Year-over-year" },
        ]);
      }
    } catch (err) {
      if (err.response?.status === 401) { toast.error("Session expired. Please login again."); navigate("/login"); return; }
      const msg = err.response?.data?.message || "Failed to load salary data";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const buildQueryString = useCallback((f, page) => {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set("page", String(page || 1));
    params.set("limit", "20");
    return params.toString();
  }, []);

  const fetchSearch = useCallback(async (filterOverrides, pageOverride) => {
    try {
      setSearchLoading(true);
      const active = filterOverrides || appliedFilters;
      const page = pageOverride || currentPage;
      const qs = buildQueryString(active, page);
      const res = await axios.get(`${SALARY_API_END_POINT}/search?${qs}`, { withCredentials: true });
      const data = res.data;
      const results = data?.results || data?.data || [];
      const total = data?.pagination?.total || data?.total || results.length;
      const pages = data?.pagination?.pages || data?.pages || Math.ceil(total / 20) || 1;
      setSearchResults(results); setTotalResults(total); setTotalPages(pages);
    } catch (err) {
      if (err.response?.status === 401) { toast.error("Session expired."); navigate("/login"); return; }
      toast.error(err.response?.data?.message || "Search failed");
    } finally { setSearchLoading(false); }
  }, [appliedFilters, currentPage, buildQueryString, navigate]);

  const applyFilters = () => {
    setAppliedFilters({ ...filters }); setCurrentPage(1); setFiltersVisible(false);
    fetchSearch(filters, 1);
  };

  const clearFilters = () => {
    const empty = { role: "", location: "", experienceLevel: "", skills: "", company: "", department: "", workMode: "", minSalary: "", maxSalary: "", sort: "-averageSalary" };
    setFilters(empty); setAppliedFilters({}); setCurrentPage(1);
    setSearchResults([]); setTotalResults(0); setTotalPages(1);
  };

  const removeFilterBadge = (key) => {
    const updated = { ...appliedFilters }; delete updated[key];
    setAppliedFilters(updated); setFilters(p => ({ ...p, [key]: "" })); setCurrentPage(1);
    if (Object.keys(updated).length === 0) { setSearchResults([]); setTotalResults(0); setTotalPages(1); }
    else fetchSearch(updated, 1);
  };

  const handlePageChange = (page) => { if (page < 1 || page > totalPages) return; setCurrentPage(page); fetchSearch(null, page); };

  const handleRoleSearch = useCallback((value) => {
    setFilters(p => ({ ...p, role: value }));
    if (value.trim().length > 0) {
      const matches = roles.filter(r => r.toLowerCase().includes(value.toLowerCase())).slice(0, 6);
      setSearchSuggestions(matches); setShowSuggestions(matches.length > 0);
    } else { setSearchSuggestions([]); setShowSuggestions(false); }
  }, [roles]);

  const selectSuggestion = (role) => {
    setFilters(p => ({ ...p, role })); setShowSuggestions(false); setSearchSuggestions([]);
  };

  const exportCSV = () => {
    if (searchResults.length === 0) { toast.error("No data to export"); return; }
    const headers = "Role,Company,Location,Experience,Avg Salary,Min Salary,Max Salary,Bonus,Stock,Total Comp,Work Mode,Skills";
    const rows = searchResults.map(r =>
      `"${r.role || ""}","${r.company || ""}","${r.location || ""}","${r.experienceLevel || ""}",${r.averageSalary || 0},${r.minSalary || 0},${r.maxSalary || 0},${r.bonus || 0},${r.stock || 0},${r.totalCompensation || 0},"${r.workMode || ""}","${(r.skills || []).join("; ")}"`
    );
    const blob = new Blob([headers, ...rows].join("\n"), { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `salary-explorer-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url); toast.success("CSV exported");
  };

  const fetchCompanies = useCallback(async (search) => {
    try {
      setCompaniesLoading(true);
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await axios.get(`${SALARY_API_END_POINT}/companies${params}`, { withCredentials: true });
      setCompanies(res.data?.companies || []);
    } catch (err) {
      if (err.response?.status === 401) { navigate("/login"); return; }
    } finally { setCompaniesLoading(false); }
  }, [navigate]);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await axios.get(`${SALARY_API_END_POINT}/trends`, { withCredentials: true });
      setTrends(res.data?.trends || []);
      setRoleTrends(res.data?.roleTrends || []);
    } catch (err) { /* ignore */ }
  }, []);

  const fetchComparison = useCallback(async () => {
    if (!compareRole1 && !compareRole2) return;
    try {
      setComparisonLoading(true);
      const rolesParam = [compareRole1, compareRole2].filter(Boolean).join(",");
      const res = await axios.get(`${SALARY_API_END_POINT}/trends?role=${encodeURIComponent(rolesParam)}`, { withCredentials: true });
      const roleData = res.data?.roleTrends || [];
      const trendData = res.data?.trends || [];

      const getStats = async (role) => {
        if (!role) return null;
        const r = await axios.get(`${SALARY_API_END_POINT}/search?role=${encodeURIComponent(role)}&limit=50`, { withCredentials: true });
        const results = r.data?.results || [];
        const salaries = results.map(x => x.averageSalary).filter(Boolean);
        const avg = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
        const max = salaries.length > 0 ? Math.max(...salaries) : 0;
        const companies = [...new Set(results.map(x => x.company).filter(Boolean))];
        const skills = [...new Set(results.flatMap(x => x.skills || []))].slice(0, 5);
        return { role, avgSalary: avg, maxSalary: max, companies, skills, count: results.length };
      };

      const [s1, s2] = await Promise.all([getStats(compareRole1), getStats(compareRole2)]);
      setComparison({ role1: s1, role2: s2, trends: trendData });
    } catch (err) { toast.error("Comparison failed"); }
    finally { setComparisonLoading(false); }
  }, [compareRole1, compareRole2, navigate]);

  const fetchCalculator = useCallback(async () => {
    if (!calcRole || !calcLevel) return;
    try {
      setCalcLoading(true);
      const params = new URLSearchParams({ role: calcRole, experienceLevel: calcLevel });
      if (calcLocation) params.set("location", calcLocation);
      if (calcSkills) params.set("skills", calcSkills);
      const res = await axios.get(`${SALARY_API_END_POINT}/calculator?${params}`, { withCredentials: true });
      setCalcResult(res.data?.calculator || null);
    } catch (err) { toast.error("Calculator failed"); }
    finally { setCalcLoading(false); }
  }, [calcRole, calcLevel, calcLocation, calcSkills, navigate]);

  useEffect(() => {
    if (activeTab === "companies") fetchCompanies(companySearch);
    if (activeTab === "explore") { if (trends.length === 0) fetchTrends(); }
  }, [activeTab]);

  const activeFilterEntries = Object.entries(appliedFilters).filter(([, v]) => v !== "");
  const filterBadgeLabels = { role: "Role", location: "Location", experienceLevel: "Experience", skills: "Skills", company: "Company", department: "Department", workMode: "Work Mode", minSalary: "Min Salary", maxSalary: "Max Salary", sort: "Sort" };
  const hasFilters = activeFilterEntries.length > 0;

  const chartData = searchResults.length > 0
    ? [...new Map(searchResults.map(r => [r.role, r])).values()].slice(0, 10).map(r => ({ name: r.role || "Unknown", salary: r.averageSalary ? Math.round(r.averageSalary / 100000) : 0 })).filter(r => r.salary > 0)
    : roles.slice(0, 15).map(r => ({ name: r, salary: 0 }));

  const expDist = searchResults.length > 0
    ? (() => { const m = {}; searchResults.forEach(r => { const l = r.experienceLevel || "Unknown"; m[l] = (m[l] || 0) + 1; }); return Object.entries(m).map(([name, value]) => ({ name, value })); })()
    : [];

  const deptDist = searchResults.length > 0
    ? (() => { const m = {}; searchResults.forEach(r => { const d = r.department || "Other"; m[d] = (m[d] || 0) + 1; }); return Object.entries(m).map(([name, value]) => ({ name, value })); })()
    : [];

  const growthChart = roleTrends.slice(0, 8).map(rt => {
    const levels = rt.levels || {};
    const sorted = Object.entries(levels).sort(([a], [b]) => LEVEL_ORDER[a] - LEVEL_ORDER[b]);
    return { role: rt.role, ...Object.fromEntries(sorted.map(([k, v]) => [k, v.avgSalary ? Math.round(v.avgSalary / 100000) : 0])) };
  });

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <PageHero badge="Data-Driven Insights" title="Salary Explorer" subtitle="Make informed career decisions with real salary data." gradient="from-green-600 via-emerald-700 to-teal-900" />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 mx-auto mb-3" />
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
              </div>
            ))}
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">{loadingSkeleton(6)}</section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <PageHero badge="Data-Driven Insights" title="Salary Explorer" subtitle="Make informed career decisions with real salary data." gradient="from-green-600 via-emerald-700 to-teal-900" />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <WifiOff className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to load data</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
            <Button onClick={fetchData} className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" /> Try Again</Button>
          </div>
        </section>
      </div>
    );
  }

  const noData = insights.length === 0 && searchResults.length === 0 && roles.length === 0;

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    if (start > 1) {
      pages.push(<Button key={1} variant="outline" size="sm" onClick={() => handlePageChange(1)} className="rounded-xl border-gray-200 dark:border-gray-700 min-w-[36px]">1</Button>);
      if (start > 2) pages.push(<span key="ds" className="text-gray-400 px-1">...</span>);
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <Button key={i} variant={i === currentPage ? "default" : "outline"} size="sm" onClick={() => handlePageChange(i)}
          className={`rounded-xl min-w-[36px] ${i === currentPage ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm" : "border-gray-200 dark:border-gray-700"}`}>{i}</Button>
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push(<span key="de" className="text-gray-400 px-1">...</span>);
      pages.push(<Button key={totalPages} variant="outline" size="sm" onClick={() => handlePageChange(totalPages)} className="rounded-xl border-gray-200 dark:border-gray-700 min-w-[36px]">{totalPages}</Button>);
    }
    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)} className="rounded-xl border-gray-200 dark:border-gray-700"><ChevronLeft className="h-4 w-4 mr-1" />Previous</Button>
        {pages}
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)} className="rounded-xl border-gray-200 dark:border-gray-700">Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero badge="Data-Driven Insights" title="Salary Explorer"
        subtitle="Make informed career decisions with real salary data. Compare compensation across roles, experience levels, and locations."
        gradient="from-green-600 via-emerald-700 to-teal-900"
      >
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => document.getElementById("salary-content")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-8 py-5 text-base font-semibold shadow-lg">
            <Search className="h-5 w-5 mr-2" />Explore Salaries
          </Button>
          <Button variant="outline" onClick={exportCSV}
            className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 py-5 text-base font-semibold">
            <Download className="h-5 w-5 mr-2" />Download Report
          </Button>
        </div>
      </PageHero>

      {noData ? (
        <section id="salary-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No salary data available</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">Salary data is being collected. Please check back later.</p>
            <Button onClick={fetchData} variant="outline" className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
          </div>
        </section>
      ) : (
        <>
          <section id="salary-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {insights.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 text-center">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>
                    {item.sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{item.sub}</p>}
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                    <Icon className="h-4 w-4" />{tab.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeTab === "explore" && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Salary by Role</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {hasFilters ? `Showing ${searchResults.length} of ${totalResults} result${totalResults !== 1 ? "s" : ""}` : "Average compensation across top tech roles"}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4 sm:mt-0">
                    <div className="relative">
                      <Input placeholder="Quick role search..." value={filters.role}
                        onChange={e => handleRoleSearch(e.target.value)}
                        onFocus={() => { if (searchSuggestions.length > 0) setShowSuggestions(true); }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="rounded-xl text-sm w-48 h-9" />
                      {showSuggestions && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                          {searchSuggestions.map(s => (
                            <button key={s} onMouseDown={() => selectSuggestion(s)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 transition-colors">{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setFiltersVisible(v => !v)}
                      className={`rounded-xl border-gray-200 dark:border-gray-700 transition-colors ${hasFilters ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : ""}`}>
                      <SlidersHorizontal className="h-4 w-4 mr-1" />Filters{hasFilters && <span className="ml-1.5 text-xs font-bold">({activeFilterEntries.length})</span>}{filtersVisible ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl border-gray-200 dark:border-gray-700">
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                  </div>
                </div>

                {hasFilters && activeFilterEntries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeFilterEntries.map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                        {filterBadgeLabels[key] || key}: {value}
                        <button onClick={() => removeFilterBadge(key)} className="ml-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                    {activeFilterEntries.length > 1 && <button onClick={clearFilters} className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 underline underline-offset-2 transition-colors">Clear all</button>}
                  </div>
                )}

                <motion.div initial={false} animate={{ height: filtersVisible ? "auto" : 0, opacity: filtersVisible ? 1 : 0 }} className="overflow-hidden mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Role</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input placeholder="e.g. Software Engineer" value={filters.role} onChange={e => setFilters(p => ({ ...p, role: e.target.value }))} className="pl-9 rounded-xl text-sm" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Location</Label>
                        <select value={filters.location} onChange={e => setFilters(p => ({ ...p, location: e.target.value }))} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30">
                          <option value="">All Locations</option>
                          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Experience</Label>
                        <select value={filters.experienceLevel} onChange={e => setFilters(p => ({ ...p, experienceLevel: e.target.value }))} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30">
                          {EXPERIENCE_LEVELS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Department</Label>
                        <select value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30">
                          <option value="">All Departments</option>
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Work Mode</Label>
                        <select value={filters.workMode} onChange={e => setFilters(p => ({ ...p, workMode: e.target.value }))} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30">
                          <option value="">All Modes</option>
                          <option value="on-site">On-Site</option>
                          <option value="remote">Remote</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Skills</Label>
                        <Input placeholder="e.g. React, Python" value={filters.skills} onChange={e => setFilters(p => ({ ...p, skills: e.target.value }))} className="rounded-xl text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Min Salary (LPA)</Label>
                        <Input placeholder="e.g. 5" value={filters.minSalary} onChange={e => setFilters(p => ({ ...p, minSalary: e.target.value }))} className="rounded-xl text-sm" type="number" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Sort By</Label>
                        <select value={filters.sort} onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30">
                          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Button onClick={applyFilters} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"><Filter className="h-4 w-4 mr-2" />Apply Filters</Button>
                      <Button variant="outline" onClick={clearFilters} className="rounded-xl border-gray-200 dark:border-gray-700">Clear Filters</Button>
                    </div>
                  </div>
                </motion.div>

                {searchLoading ? loadingSkeleton(6) : hasFilters && searchResults.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4"><Search className="h-8 w-8 text-gray-400" /></div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No matching results</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">Try adjusting your filters or search terms.</p>
                  </div>
                ) : hasFilters ? (
                  <>
                    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                            <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Role</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Company</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Location</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Level</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Avg Salary</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Total Comp</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Range</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {searchResults.map((r, idx) => (
                            <motion.tr key={`${r.role}-${r.company}-${r.location}-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                              className="bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.role || "\u2014"}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.company ? <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-gray-400" />{r.company}</span> : "\u2014"}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.location ? <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" />{r.location}</span> : "\u2014"}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{r.experienceLevel || "\u2014"}</td>
                              <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatSalary(r.averageSalary)}</td>
                              <td className="px-4 py-3 text-right font-medium text-blue-600 dark:text-blue-400">{r.totalCompensation ? formatSalary(r.totalCompensation) : "\u2014"}</td>
                              <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">{r.minSalary != null && r.maxSalary != null ? `${formatSalary(r.minSalary)} - ${formatSalary(r.maxSalary)}` : "\u2014"}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination()}
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.slice(0, 30).map((roleName, i) => {
                      const roleData = searchResults.filter(r => r.role === roleName);
                      const min = roleData.length > 0 ? Math.min(...roleData.map(r => r.minSalary)) : 0;
                      const max = roleData.length > 0 ? Math.max(...roleData.map(r => r.maxSalary)) : 0;
                      const growth = roleData.length > 0 ? Math.round(roleData.reduce((s, r) => s + (r.annualGrowth || 0), 0) / roleData.length) : null;
                      const demand = roleData.length > 0 ? Math.round(roleData.reduce((s, r) => s + (r.demandScore || 0), 0) / roleData.length) : null;
                      return (
                        <motion.div key={roleName} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer"
                          onClick={() => { setFilters(p => ({ ...p, role: roleName })); setAppliedFilters(p => ({ ...p, role: roleName })); fetchSearch({ ...appliedFilters, role: roleName }, 1); }}>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{roleName}</h3>
                            {growth != null && <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">+{growth}%</span>}
                          </div>
                          <p className="text-2xl font-bold text-[#0A66C2] dark:text-blue-400">{roleData.length > 0 ? `${formatSalary(min)} - ${formatSalary(max)}` : "Data loading..."}</p>
                          <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                            {demand != null && <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Demand: {demand}/100</span>}
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {roleData.length} reports</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {(chartData.length > 0 || expDist.length > 0 || growthChart.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
                    {chartData.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Top Paying Roles</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Average salary in lakhs per annum</p>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} angle={-35} textAnchor="end" interval={0} height={60} />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "12px", color: "#f9fafb", fontSize: "13px" }} formatter={(val) => [`\u20B9${val} LPA`, "Avg Salary"]} />
                            <Bar dataKey="salary" radius={[6, 6, 0, 0]}>{chartData.map((_, idx) => <Cell key={idx} fill={["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"][idx % 5]} />)}</Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}
                    {expDist.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Experience Distribution</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Salary data points by experience level</p>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie data={expDist} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>
                              {expDist.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "12px", color: "#f9fafb", fontSize: "13px" }} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}
                    {deptDist.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Department Distribution</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Salary data points by department</p>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie data={deptDist} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>
                              {deptDist.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "12px", color: "#f9fafb", fontSize: "13px" }} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}
                    {trends.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Salary Growth by Experience</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Average salary across experience levels</p>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={trends.map(t => ({ ...t, name: t.experienceLevel.charAt(0).toUpperCase() + t.experienceLevel.slice(1) }))} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                            <defs>
                              <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.3} /><stop offset="95%" stopColor="#059669" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "12px", color: "#f9fafb", fontSize: "13px" }} formatter={(val) => [formatSalary(val), "Avg Salary"]} />
                            <Area type="monotone" dataKey="avgSalary" stroke="#059669" fill="url(#colorSalary)" strokeWidth={2} dot={{ fill: "#059669", strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "companies" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Company Salary Explorer</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Compare compensation across top employers</p>
                  </div>
                  <Input placeholder="Search companies..." value={companySearch} onChange={e => { setCompanySearch(e.target.value); fetchCompanies(e.target.value); }}
                    className="rounded-xl text-sm w-64 mt-4 sm:mt-0" />
                </div>
                {companiesLoading ? loadingSkeleton(6) : companies.length === 0 ? (
                  <div className="text-center py-16">
                    <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No company data</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Seed salary data to see company information.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map((c, i) => (
                      <motion.div key={c.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                          <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-full">{c.industry}</Badge>
                        </div>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatSalary(c.averageSalary)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Base | Total: {c.totalCompensation ? formatSalary(c.totalCompensation) : "N/A"}</p>
                        <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.headquarters || "N/A"}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.dataPoints} reports</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {c.rating || "N/A"}</span>
                          {c.growth > 0 && <span className="flex items-center gap-1 text-green-600"><TrendingUpIcon className="h-3 w-3" /> +{c.growth}%</span>}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex flex-wrap gap-1.5">
                            {(c.departments || []).slice(0, 4).map(d => <Badge key={d} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">{d}</Badge>)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "compare" && (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                  <div className="flex-1 w-full">
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Role 1</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="e.g. Frontend Developer" value={compareRole1} onChange={e => setCompareRole1(e.target.value)} className="pl-9 rounded-xl text-sm" list="role-list-1" />
                      <datalist id="role-list-1">{roles.map(r => <option key={r} value={r} />)}</datalist>
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Role 2</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="e.g. Backend Developer" value={compareRole2} onChange={e => setCompareRole2(e.target.value)} className="pl-9 rounded-xl text-sm" list="role-list-2" />
                      <datalist id="role-list-2">{roles.map(r => <option key={r} value={r} />)}</datalist>
                    </div>
                  </div>
                  <Button onClick={fetchComparison} disabled={!compareRole1 || !compareRole2 || comparisonLoading} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 mt-5">
                    {comparisonLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <GitCompare className="h-4 w-4 mr-2" />}Compare
                  </Button>
                </div>
                {comparison && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[comparison.role1, comparison.role2].filter(Boolean).map((role, idx) => role ? (
                      <motion.div key={role.role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{role.role}</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Average Salary</span>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatSalary(role.avgSalary)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Max Salary</span>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">{formatSalary(role.maxSalary)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Data Points</span>
                            <span className="font-medium text-gray-900 dark:text-white">{role.count}</span>
                          </div>
                          <div className="py-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Top Companies</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(role.companies || []).slice(0, 5).map(c => <Badge key={c} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">{c}</Badge>)}
                            </div>
                          </div>
                          <div className="py-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Top Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(role.skills || []).slice(0, 5).map(s => <Badge key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">{s}</Badge>)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : null)}
                  </div>
                )}
              </div>
            )}

            {activeTab === "ai-insights" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Salary Insights</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Data-driven insights powered by aggregated salary reports</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5">
                    <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-3"><TrendingUpIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Highest Growth Roles</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Roles with fastest salary growth</p>
                    <div className="space-y-2">
                      {["AI Engineer", "Machine Learning Engineer", "DevOps Engineer", "Data Engineer", "Cloud Architect"].map((r, i) => (
                        <div key={r} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{i + 1}. {r}</span>
                          <span className="text-green-600 font-medium text-xs">{[22, 18, 14, 14, 15][i]}% YoY</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5">
                    <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-3"><Award className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Highest Paid Roles</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Top compensation packages</p>
                    <div className="space-y-2">
                      {["CTO", "VP of Engineering", "Principal Engineer", "Staff Engineer", "AI/ML Product Manager"].map((r, i) => (
                        <div key={r} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{i + 1}. {r}</span>
                          <span className="text-emerald-600 font-medium text-xs">{["L", "L", "L", "L", "L"][i]} Varies</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5">
                    <div className="h-10 w-10 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center mb-3"><Zap className="h-5 w-5 text-sky-600 dark:text-sky-400" /></div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Most In-Demand Skills</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Skills commanding salary premiums</p>
                    <div className="space-y-2">
                      {["AI/ML", "Cloud Architecture", "Kubernetes", "System Design", "Data Engineering"].map((s, i) => (
                        <div key={s} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{i + 1}. {s}</span>
                          <span className="text-green-600 font-medium text-xs">{[35, 30, 25, 28, 22][i]}% premium</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Salary by Experience Level</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">How experience impacts compensation</p>
                    <div className="space-y-4">
                      {["entry", "mid", "senior", "lead"].map((level, i) => {
                        const trend = trends.find(t => t.experienceLevel === level);
                        return (
                          <div key={level} className="flex items-center gap-4">
                            <div className="w-24 text-sm text-gray-700 dark:text-gray-300 capitalize">{level}</div>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full h-3 transition-all duration-500"
                                style={{ width: trend ? `${Math.min(100, (trend.avgSalary / 20000000) * 100)}%` : "0%" }} />
                            </div>
                            <div className="w-28 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">{trend ? formatSalary(trend.avgSalary) : "N/A"}</div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {roleTrends.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Role Salary Growth</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Salary progression by experience (in LPA)</p>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={growthChart.slice(0, 6)} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="role" tick={{ fontSize: 10, fill: "#6b7280" }} angle={-25} textAnchor="end" interval={0} height={50} />
                          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                          <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "12px", color: "#f9fafb", fontSize: "13px" }} />
                          <Legend />
                          {["entry", "mid", "senior", "lead"].filter(l => growthChart.some(g => g[l])).map((l, i) => (
                            <Bar key={l} dataKey={l} stackId="a" fill={PIE_COLORS[i]} name={l.charAt(0).toUpperCase() + l.slice(1)} radius={i === 3 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="mt-6 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-6 w-6 shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Key Takeaway</h3>
                      <p className="text-sm text-emerald-50">
                        The Indian tech salary market shows strong growth in AI/ML roles (22% YoY), with top-tier companies like Google and Meta paying 2x market average.
                        Remote work is becoming a significant factor, with remote roles averaging 10-15% higher compensation for senior positions.
                        Upskilling in cloud, AI, and system design can command 25-35% salary premiums.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === "calculator" && (
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Salary Calculator</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get your estimated market worth based on current data</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Role *</Label>
                      <Input placeholder="e.g. Frontend Developer" value={calcRole} onChange={e => setCalcRole(e.target.value)} className="rounded-xl text-sm" list="calc-roles" />
                      <datalist id="calc-roles">{roles.map(r => <option key={r} value={r} />)}</datalist>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Experience Level *</Label>
                      <select value={calcLevel} onChange={e => setCalcLevel(e.target.value)} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30">
                        <option value="">Select level</option>
                        {EXPERIENCE_LEVELS.slice(1).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Location</Label>
                      <select value={calcLocation} onChange={e => setCalcLocation(e.target.value)} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30">
                        <option value="">All Locations</option>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Skills (comma separated)</Label>
                      <Input placeholder="e.g. React, AWS, Python" value={calcSkills} onChange={e => setCalcSkills(e.target.value)} className="rounded-xl text-sm" />
                    </div>
                  </div>
                  <Button onClick={fetchCalculator} disabled={!calcRole || !calcLevel || calcLoading} className="mt-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 w-full sm:w-auto">
                    {calcLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}Calculate My Worth
                  </Button>
                </div>

                {calcResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Salary Range</p>
                      <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 my-2">{formatSalary(calcResult.predictedSalary)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Range: {formatSalary(calcResult.predictedRange?.min)} - {formatSalary(calcResult.predictedRange?.max)}
                        <span className="mx-2">|</span>
                        Top {calcResult.percentile}% of earners
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "Base Salary", value: formatSalary(calcResult.breakdown?.baseSalary), color: "text-emerald-600" },
                        { label: "Bonus", value: formatSalary(calcResult.breakdown?.bonus), color: "text-blue-600" },
                        { label: "Equity", value: formatSalary(calcResult.breakdown?.equity), color: "text-purple-600" },
                        { label: "Total Comp", value: formatSalary(calcResult.totalCompensation), color: "text-amber-600" },
                      ].map(item => (
                        <div key={item.label} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                        </div>
                      ))}
                    </div>

                    {calcResult.skillBonus > 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3 mb-4">
                        <CheckCircle2 className="h-4 w-4" />
                        Your skills command a premium of +{formatSalary(calcResult.skillBonus)} over base salary
                      </div>
                    )}

                    {calcResult.suggestedSkills?.length > 0 && (
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">High-Value Skills for this role:</p>
                        <div className="flex flex-wrap gap-2">
                          {calcResult.suggestedSkills.map(s => <Badge key={s} className="rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">{s}</Badge>)}
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4">
                      Based on {calcResult.dataPoints} data points. Estimates are indicative and should be used as a reference.
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </section>
        </>
      )}

      <CTABanner title="Know Your Worth" subtitle="Get personalized salary insights based on your skills, experience, and location."
        buttonText="Explore Now" buttonLink="/signup" gradient="from-green-600 via-emerald-700 to-teal-900" />
    </div>
  );
}
