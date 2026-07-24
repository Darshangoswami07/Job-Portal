import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { SALARY_API_END_POINT } from "@/utils/constant";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
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
} from "lucide-react";

const PIE_COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

const formatSalary = (salary) => {
  if (salary == null || isNaN(salary)) return "N/A";
  const lakhs = salary / 100000;
  return `\u20B9${lakhs.toFixed(1)} LPA`;
};

const formatNumber = (num) => {
  if (num == null || isNaN(num)) return "N/A";
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
  return String(num);
};

const EXPERIENCE_LEVELS = [
  { value: "", label: "All Levels" },
  { value: "Entry", label: "Entry" },
  { value: "Mid", label: "Mid" },
  { value: "Senior", label: "Senior" },
  { value: "Lead", label: "Lead" },
];

const SORT_OPTIONS = [
  { value: "-averageSalary", label: "Salary: High to Low" },
  { value: "averageSalary", label: "Salary: Low to High" },
  { value: "-createdAt", label: "Most Recent" },
];

export default function SalaryExplorer() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);

  const [roles, setRoles] = useState([]);
  const [insights, setInsights] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);

  const [filtersVisible, setFiltersVisible] = useState(false);

  const [filters, setFilters] = useState({
    role: "",
    location: "",
    experienceLevel: "",
    skills: "",
    company: "",
    sort: "-averageSalary",
  });

  const [appliedFilters, setAppliedFilters] = useState({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [rolesRes, insightsRes, locationsRes, searchRes] = await Promise.all([
        axios.get(`${SALARY_API_END_POINT}/roles`, { withCredentials: true }),
        axios.get(`${SALARY_API_END_POINT}/insights`, { withCredentials: true }),
        axios.get(`${SALARY_API_END_POINT}/locations`, { withCredentials: true }),
        axios.get(`${SALARY_API_END_POINT}/search?sort=-averageSalary&limit=20`, { withCredentials: true }),
      ]);

      let roleNames = [];
      if (Array.isArray(rolesRes.data)) {
        roleNames = rolesRes.data;
      } else if (rolesRes.data?.roles) {
        roleNames = rolesRes.data.roles;
      }

      const locs = [];
      if (Array.isArray(locationsRes.data)) {
        locs.push(...locationsRes.data);
      } else if (locationsRes.data?.locations) {
        locs.push(...locationsRes.data.locations);
      }
      setLocations(locs);

      const searchData = searchRes.data;
      const results = searchData?.results || searchData?.data || [];
      const total = searchData?.total || searchData?.totalResults || results.length;
      const pages = searchData?.totalPages || searchData?.pages || Math.ceil(total / 20) || 1;

      setSearchResults(results);
      setTotalResults(total);
      setTotalPages(pages);
      setCurrentPage(1);

      const roleMap = {};
      results.forEach((item) => {
        const r = item.role;
        if (!r) return;
        if (!roleMap[r]) {
          roleMap[r] = { totalSalary: 0, count: 0, minSal: Infinity, maxSal: 0 };
        }
        roleMap[r].totalSalary += item.averageSalary || 0;
        roleMap[r].count += 1;
        if (item.minSalary != null) roleMap[r].minSal = Math.min(roleMap[r].minSal, item.minSalary);
        if (item.maxSalary != null) roleMap[r].maxSal = Math.max(roleMap[r].maxSal, item.maxSalary);
      });

      const processedRoles = roleNames.map((name) => {
        const data = roleMap[name];
        if (data && data.count > 0) {
          const spread = data.maxSal - data.minSal;
          const growthPct = data.minSal > 0 ? ((spread / data.minSal) * 100).toFixed(0) : "15";
          return {
            title: name,
            range: `${formatSalary(data.minSal)} - ${formatSalary(data.maxSal)}`,
            growth: `+${growthPct}%`,
          };
        }
        return {
          title: name,
          range: "Data not available",
          growth: "\u2014",
        };
      });

      const finalRoles = processedRoles.length > 0
        ? processedRoles
        : Object.entries(roleMap)
            .filter(([, v]) => v.count > 0)
            .sort(([, a], [, b]) => (b.totalSalary / b.count) - (a.totalSalary / a.count))
            .map(([name, data]) => ({
              title: name,
              range: `${formatSalary(data.minSal)} - ${formatSalary(data.maxSal)}`,
              growth: data.minSal > 0 ? `+${(((data.maxSal - data.minSal) / data.minSal) * 100).toFixed(0)}%` : "\u2014",
            }));

      setRoles(finalRoles);

      const ins = insightsRes.data;
      if (ins && typeof ins === "object") {
        const dataPointsStr = ins.totalDataPoints != null
          ? formatNumber(ins.totalDataPoints)
          : "N/A";
        const avgGrowthStr = ins.avgGrowth != null ? `${ins.avgGrowth}%` : "N/A";
        setInsights([
          { icon: TrendingUp, label: "Avg. Salary Growth", value: avgGrowthStr },
          { icon: MapPin, label: "Top Paying City", value: ins.topCity || "N/A" },
          { icon: Briefcase, label: "In-Demand Role", value: ins.topRole || "N/A" },
          { icon: BarChart3, label: "Data Points", value: dataPointsStr },
        ]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      const msg = err.response?.data?.message || "Failed to load salary data";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buildQueryString = useCallback((f, page) => {
    const params = new URLSearchParams();
    if (f.role) params.set("role", f.role);
    if (f.location) params.set("location", f.location);
    if (f.experienceLevel) params.set("experienceLevel", f.experienceLevel);
    if (f.skills) params.set("skills", f.skills);
    if (f.company) params.set("company", f.company);
    params.set("sort", f.sort || "-averageSalary");
    params.set("page", String(page || 1));
    params.set("limit", "20");
    return params.toString();
  }, []);

  const fetchSearch = useCallback(async (filterOverrides, pageOverride) => {
    try {
      setSearchLoading(true);
      const activeFilters = filterOverrides || appliedFilters;
      const page = pageOverride || currentPage;
      const qs = buildQueryString(activeFilters, page);
      const res = await axios.get(`${SALARY_API_END_POINT}/search?${qs}`, { withCredentials: true });
      const data = res.data;
      const results = data?.results || data?.data || [];
      const total = data?.total || data?.totalResults || results.length;
      const pages = data?.totalPages || data?.pages || Math.ceil(total / 20) || 1;
      setSearchResults(results);
      setTotalResults(total);
      setTotalPages(pages);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      toast.error(err.response?.data?.message || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }, [appliedFilters, currentPage, buildQueryString, navigate]);

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
    setFiltersVisible(false);
    fetchSearch(filters, 1);
  };

  const clearFilters = () => {
    const empty = { role: "", location: "", experienceLevel: "", skills: "", company: "", sort: "-averageSalary" };
    setFilters(empty);
    setAppliedFilters({});
    setCurrentPage(1);
    setSearchResults([]);
    setTotalResults(0);
    setTotalPages(1);
  };

  const removeFilterBadge = (key) => {
    const updated = { ...appliedFilters };
    delete updated[key];
    setAppliedFilters(updated);
    setFilters((prev) => ({ ...prev, [key]: "" }));
    setCurrentPage(1);
    if (Object.keys(updated).length === 0) {
      setSearchResults([]);
      setTotalResults(0);
      setTotalPages(1);
    } else {
      fetchSearch(updated, 1);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchSearch(null, page);
  };

  const exportCSV = () => {
    if (searchResults.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Role", "Company", "Location", "Experience", "Avg Salary", "Min Salary", "Max Salary"];
    const rows = searchResults.map((r) => [
      r.role || "",
      r.company || "",
      r.location || "",
      r.experienceLevel || "",
      r.averageSalary || "",
      r.minSalary || "",
      r.maxSalary || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary-explorer-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const activeFilterEntries = Object.entries(appliedFilters).filter(([, v]) => v !== "");

  const filterBadgeLabels = {
    role: "Role",
    location: "Location",
    experienceLevel: "Experience",
    skills: "Skills",
    company: "Company",
    sort: "Sort",
  };

  const hasFilters = activeFilterEntries.length > 0;

  const chartData = searchResults.length > 0
    ? [...new Map(searchResults.map((r) => [r.role, r])).values()]
        .slice(0, 10)
        .map((r) => ({
          name: r.role || "Unknown",
          salary: r.averageSalary ? Math.round(r.averageSalary / 1000) : 0,
        }))
        .filter((r) => r.salary > 0)
    : roles.slice(0, 10).map((r) => ({
        name: r.title,
        salary: (() => {
          const match = r.range.match(/[\d.]+/);
          return match ? Math.round(parseFloat(match[0]) * 10) : 0;
        })(),
      })).filter((r) => r.salary > 0);

  const experienceDist = searchResults.length > 0
    ? (() => {
        const map = {};
        searchResults.forEach((r) => {
          const level = r.experienceLevel || "Unknown";
          map[level] = (map[level] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
      })()
    : [];

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <PageHero
          badge="Data-Driven Insights"
          title="Salary Explorer"
          subtitle="Make informed career decisions with real salary data."
          gradient="from-green-600 via-emerald-700 to-teal-900"
        />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 mx-auto mb-3" />
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
              </div>
            ))}
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <PageHero
          badge="Data-Driven Insights"
          title="Salary Explorer"
          subtitle="Make informed career decisions with real salary data."
          gradient="from-green-600 via-emerald-700 to-teal-900"
        />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <WifiOff className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to load data</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
            <Button onClick={fetchData} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const noData = roles.length === 0 && insights.length === 0 && searchResults.length === 0;

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="Data-Driven Insights"
        title="Salary Explorer"
        subtitle="Make informed career decisions with real salary data. Compare compensation across roles, experience levels, and locations."
        gradient="from-green-600 via-emerald-700 to-teal-900"
      >
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => {
              const section = document.getElementById("salary-content");
              if (section) section.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-8 py-5 text-base font-semibold shadow-lg"
          >
            <Search className="h-5 w-5 mr-2" />
            Explore Salaries
          </Button>
          <Button
            variant="outline"
            onClick={exportCSV}
            className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 py-5 text-base font-semibold"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Report
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
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Salary data is being collected. Please check back later.
            </p>
            <Button onClick={fetchData} variant="outline" className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section id="salary-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {insights.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 text-center"
                  >
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Salary by Role</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {hasFilters
                    ? `Showing ${searchResults.length} of ${totalResults} result${totalResults !== 1 ? "s" : ""}`
                    : "Average compensation across top tech roles"}
                </p>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersVisible((v) => !v)}
                  className={`rounded-xl border-gray-200 dark:border-gray-700 transition-colors ${hasFilters ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : ""}`}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  Filters
                  {hasFilters && <span className="ml-1.5 text-xs font-bold">({activeFilterEntries.length})</span>}
                  {filtersVisible ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCSV}
                  disabled={!hasFilters || searchResults.length === 0}
                  className="rounded-xl border-gray-200 dark:border-gray-700"
                >
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
              </div>
            </div>

            {hasFilters && activeFilterEntries.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilterEntries.map(([key, value]) => (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  >
                    {filterBadgeLabels[key] || key}: {value}
                    <button
                      onClick={() => removeFilterBadge(key)}
                      className="ml-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {activeFilterEntries.length > 1 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 underline underline-offset-2 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            <motion.div
              initial={false}
              animate={{ height: filtersVisible ? "auto" : 0, opacity: filtersVisible ? 1 : 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fr-role" className="text-xs text-gray-600 dark:text-gray-400">Role</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="fr-role"
                        placeholder="e.g. Software Engineer"
                        value={filters.role}
                        onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}
                        className="pl-9 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fr-location" className="text-xs text-gray-600 dark:text-gray-400">Location</Label>
                    <select
                      id="fr-location"
                      value={filters.location}
                      onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
                      className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
                    >
                      <option value="">All Locations</option>
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fr-exp" className="text-xs text-gray-600 dark:text-gray-400">Experience</Label>
                    <select
                      id="fr-exp"
                      value={filters.experienceLevel}
                      onChange={(e) => setFilters((p) => ({ ...p, experienceLevel: e.target.value }))}
                      className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
                    >
                      {EXPERIENCE_LEVELS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fr-skills" className="text-xs text-gray-600 dark:text-gray-400">Skills</Label>
                    <Input
                      id="fr-skills"
                      placeholder="e.g. React, Python"
                      value={filters.skills}
                      onChange={(e) => setFilters((p) => ({ ...p, skills: e.target.value }))}
                      className="rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fr-company" className="text-xs text-gray-600 dark:text-gray-400">Company</Label>
                    <Input
                      id="fr-company"
                      placeholder="e.g. Google"
                      value={filters.company}
                      onChange={(e) => setFilters((p) => ({ ...p, company: e.target.value }))}
                      className="rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fr-sort" className="text-xs text-gray-600 dark:text-gray-400">Sort By</Label>
                    <select
                      id="fr-sort"
                      value={filters.sort}
                      onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
                      className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    onClick={applyFilters}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="rounded-xl border-gray-200 dark:border-gray-700"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </motion.div>

            {searchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                    <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            ) : hasFilters && searchResults.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No matching results</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                  Try adjusting your filters or search terms to find more salary data.
                </p>
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
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Experience</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Avg Salary</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {searchResults.map((r, idx) => (
                        <motion.tr
                          key={`${r.role}-${r.company}-${r.location}-${idx}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.role || "\u2014"}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {r.company ? (
                              <span className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                {r.company}
                              </span>
                            ) : "\u2014"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {r.location ? (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                {r.location}
                              </span>
                            ) : "\u2014"}
                          </td>
                          <td className="px-4 py-3">
                            {r.experienceLevel ? (
                              <span className="flex items-center gap-1.5">
                                <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                                {r.experienceLevel}
                              </span>
                            ) : "\u2014"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatSalary(r.averageSalary)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">
                            {r.minSalary != null && r.maxSalary != null
                              ? `${formatSalary(r.minSalary)} - ${formatSalary(r.maxSalary)}`
                              : "\u2014"}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="rounded-xl border-gray-200 dark:border-gray-700"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                      let end = Math.min(totalPages, start + maxVisible - 1);
                      if (end - start + 1 < maxVisible) {
                        start = Math.max(1, end - maxVisible + 1);
                      }
                      if (start > 1) {
                        pages.push(
                          <Button key={1} variant="outline" size="sm" onClick={() => handlePageChange(1)} className="rounded-xl border-gray-200 dark:border-gray-700 min-w-[36px]">
                            1
                          </Button>
                        );
                        if (start > 2) {
                          pages.push(<span key="dots-start" className="text-gray-400 px-1">...</span>);
                        }
                      }
                      for (let i = start; i <= end; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={i === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(i)}
                            className={`rounded-xl min-w-[36px] ${i === currentPage ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm" : "border-gray-200 dark:border-gray-700"}`}
                          >
                            {i}
                          </Button>
                        );
                      }
                      if (end < totalPages) {
                        if (end < totalPages - 1) {
                          pages.push(<span key="dots-end" className="text-gray-400 px-1">...</span>);
                        }
                        pages.push(
                          <Button key={totalPages} variant="outline" size="sm" onClick={() => handlePageChange(totalPages)} className="rounded-xl border-gray-200 dark:border-gray-700 min-w-[36px]">
                            {totalPages}
                          </Button>
                        );
                      }
                      return pages;
                    })()}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="rounded-xl border-gray-200 dark:border-gray-700"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role, i) => (
                  <motion.div
                    key={role.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{role.title}</h3>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                        {role.growth}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-[#0A66C2] dark:text-blue-400">{role.range}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {chartData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Top Paying Roles</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Average salary in thousands</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "none",
                          borderRadius: "12px",
                          color: "#f9fafb",
                          fontSize: "13px",
                        }}
                        formatter={(val) => [`\u20B9${val}K`, "Avg Salary"]}
                      />
                      <Bar dataKey="salary" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, idx) => (
                          <Cell key={idx} fill={["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"][idx % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {experienceDist.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Salary Distribution by Experience</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Number of data points per level</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={experienceDist}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine
                        >
                          {experienceDist.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "none",
                            borderRadius: "12px",
                            color: "#f9fafb",
                            fontSize: "13px",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </div>
            )}
          </section>
        </>
      )}

      <CTABanner
        title="Know Your Worth"
        subtitle="Get personalized salary insights based on your skills, experience, and location."
        buttonText="Explore Now"
        buttonLink="/signup"
        gradient="from-green-600 via-emerald-700 to-teal-900"
      />
    </div>
  );
}
