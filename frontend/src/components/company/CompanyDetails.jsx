import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Building2, MapPin, Globe, Calendar, Briefcase, ArrowLeft,
  ExternalLink, ChevronRight, Users, Clock, Star, TrendingUp,
  DollarSign, Shield, Zap, Activity, Award, Target, Heart,
  Linkedin, Twitter, Code2, BarChart3, Layers, Sparkles,
  CheckCircle2, GraduationCap, Coffee, Gamepad2, Dumbbell,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Job from "@/components/job/Job";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPANY_PROFILE_API_END_POINT } from "@/utils/constant";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "about", label: "About Us", icon: Building2 },
  { id: "jobs", label: "Open Roles", icon: Briefcase },
  { id: "tech", label: "Tech Stack", icon: Code2 },
  { id: "insights", label: "AI Insights", icon: Sparkles },
];

const benefitIcons = {
  "health": Heart, "medical": Heart, "insurance": Shield,
  "remote": Globe, "flexible": Clock, "equity": DollarSign,
  "stock": DollarSign, "bonus": DollarSign, "food": Coffee,
  "lunch": Coffee, "gym": Dumbbell, "fitness": Dumbbell,
  "games": Gamepad2, "education": GraduationCap, "learning": GraduationCap,
  "vacation": Clock, "pto": Clock, "parental": Heart,
};

function DetailsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-8 mb-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="h-20 w-20 rounded-2xl bg-gray-200" />
          <div className="space-y-3 flex-1">
            <div className="h-7 w-56 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-5/6 rounded bg-gray-200" />
          <div className="h-4 w-4/6 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function RatingBar({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function StatWidget({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900">{value ?? "—"}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SalaryChart({ salaries }) {
  if (!salaries || !salaries.avgSalary) return null;
  const maxVal = salaries.maxSalary || salaries.avgSalary * 1.5;
  const minPct = salaries.minSalary ? (salaries.minSalary / maxVal) * 100 : 0;
  const avgPct = (salaries.avgSalary / maxVal) * 100;
  const maxPct = 100;

  const fmt = (n) => n ? `$${(n / 1000).toFixed(0)}K` : "$0";
  return (
    <div className="mt-3">
      <div className="relative h-6 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300 rounded-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-medium text-blue-800">
          <span>{fmt(salaries.minSalary)}</span>
          <span className="font-bold">{fmt(salaries.avgSalary)}</span>
          <span>{fmt(salaries.maxSalary)}</span>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>Min</span>
        <span className="font-medium text-gray-600">Average</span>
        <span>Max</span>
      </div>
    </div>
  );
}

function AiInsightCard({ icon: Icon, label, value, color, tip }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${color} shrink-0`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-gray-900">{value ?? "—"}</p>
          {tip && <p className="text-[10px] text-gray-400 mt-1">{tip}</p>}
        </div>
      </div>
    </div>
  );
}

function ScoreGauge({ label, score, color }) {
  const getColor = () => {
    if (score >= 70) return "from-green-400 to-emerald-500";
    if (score >= 40) return "from-amber-400 to-orange-500";
    return "from-red-400 to-rose-500";
  };
  return (
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-1.5">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
          <circle
            cx="18" cy="18" r="15.5" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeDasharray={`${(score / 100) * 97.4} 97.4`}
            strokeLinecap="round"
            className={`bg-gradient-to-r ${getColor()} text-transparent`}
            style={{ color: score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444" }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${score >= 70 ? "text-green-600" : score >= 40 ? "text-amber-600" : "text-red-600"}`}>
          {score}
        </span>
      </div>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const res = await axios.get(`${COMPANY_PROFILE_API_END_POINT}/${id}`, { timeout: 15000 });
        if (res.data.success) setCompany(res.data.company);
      } catch (error) {
        console.error("Error fetching company details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const linkedJobs = company?.linkedJobs || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DetailsSkeleton />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#F3F2EF]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Company not found</h2>
          <p className="text-gray-500 mt-2">This company may have been removed or doesn't exist.</p>
          <Button onClick={() => navigate("/browse-companies")} className="mt-6 btn-primary rounded-xl">
            Browse Companies
          </Button>
        </div>
      </div>
    );
  }

  const hiringBadge = {
    actively_hiring: { label: "Actively Hiring", class: "bg-green-50 text-green-700 border-green-200" },
    selectively_hiring: { label: "Selectively Hiring", class: "bg-amber-50 text-amber-700 border-amber-200" },
    not_hiring: { label: "Not Hiring", class: "bg-gray-50 text-gray-500 border-gray-200" },
    unknown: { label: "Unknown", class: "bg-gray-50 text-gray-400 border-gray-200" },
  }[company.hiringStatus] || { label: "Unknown", class: "bg-gray-50 text-gray-400 border-gray-200" };

  const avgSalary = company.salaries?.avgSalary;
  const fmtSalary = avgSalary ? `$${(avgSalary / 1000).toFixed(0)}K` : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#F3F2EF]"
    >
      <Navbar />

      <div className="relative bg-gradient-to-br from-[#0A66C2]/5 via-white to-[#0A66C2]/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden"
          >
            <div className="relative h-32 sm:h-40 bg-gradient-to-r from-[#0A66C2] via-[#004182] to-[#002244]">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
            </div>

            <div className="px-6 sm:px-8 pb-6 sm:pb-8">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
                <div className="h-24 w-24 rounded-2xl overflow-hidden border-4 border-white bg-white shadow-lg shrink-0">
                  <CompanyLogo name={company.name} logo={company.logo} className="h-full w-full rounded-2xl" />
                </div>
                <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{company.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {company.industry && (
                      <span className="text-sm text-gray-500 capitalize">{company.industry}</span>
                    )}
                    {company.headquarters && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {company.headquarters}
                      </span>
                    )}
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {new Date(company.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {company.website && (
                    <Button
                      variant="outline"
                      className="rounded-xl border-gray-200 text-sm"
                      onClick={() => window.open(company.website, "_blank")}
                    >
                      <Globe className="h-4 w-4 mr-1.5" />
                      Visit Website
                      <ExternalLink className="h-3 w-3 ml-1.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className={`${hiringBadge.class} rounded-full px-4 py-1.5 text-sm font-medium`}>
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  {hiringBadge.label}
                </Badge>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 rounded-full px-4 py-1.5 text-sm font-medium">
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  {linkedJobs.length} open {linkedJobs.length === 1 ? "position" : "positions"}
                </Badge>
                {fmtSalary && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 rounded-full px-4 py-1.5 text-sm font-medium">
                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                    {fmtSalary}/yr avg
                  </Badge>
                )}
                {company.companySize && company.companySize !== "Unknown" && (
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 rounded-full px-4 py-1.5 text-sm font-medium">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {company.companySize}
                  </Badge>
                )}
                {company.locations?.length > 0 && (
                  <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {company.locations.length > 1 ? `${company.locations.length} locations` : company.locations[0]}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>

          <div className="mt-6">
            <div className="flex gap-1 bg-white rounded-xl border border-gray-100 card-shadow p-1.5 mb-6 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                      isActive
                        ? "bg-[#0A66C2] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.id === "jobs" && linkedJobs.length > 0 && (
                      <span className={cn(
                        "ml-1 text-xs rounded-full px-2 py-0.5",
                        isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      )}>
                        {linkedJobs.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "about" && (
                <motion.div
                  key="about"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">About {company.name}</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {company.description || "No description provided."}
                    </p>

                    {(company.mission || company.vision) && (
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {company.mission && (
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 text-[#0A66C2] mb-2">
                              <Target className="h-4 w-4" />
                              <span className="text-sm font-semibold">Mission</span>
                            </div>
                            <p className="text-sm text-gray-600">{company.mission}</p>
                          </div>
                        )}
                        {company.vision && (
                          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                            <div className="flex items-center gap-2 text-purple-600 mb-2">
                              <Award className="h-4 w-4" />
                              <span className="text-sm font-semibold">Vision</span>
                            </div>
                            <p className="text-sm text-gray-600">{company.vision}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatWidget icon={Building2} label="Industry" value={company.industry || "Technology"} color="bg-blue-500" />
                    <StatWidget icon={Users} label="Company Size" value={company.companySize || "Unknown"} color="bg-purple-500" />
                    <StatWidget icon={Briefcase} label="Open Positions" value={linkedJobs.length} sub={company.hiringStatus === "actively_hiring" ? "Actively hiring" : ""} color="bg-green-500" />
                    <StatWidget icon={DollarSign} label="Avg Salary" value={fmtSalary || "—"} sub={company.salaries?.currency || "USD/year"} color="bg-amber-500" />
                  </div>

                  {company.ratings?.overall > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8 mb-6">
                      <div className="flex items-center gap-3 mb-5">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <h3 className="text-lg font-bold text-gray-900">Ratings</h3>
                        <span className="text-2xl font-bold text-gray-900 ml-auto">{company.ratings.overall.toFixed(1)}</span>
                      </div>
                      <div className="space-y-2.5">
                        <RatingBar label="Culture" value={company.ratings.culture || 0} />
                        <RatingBar label="Work-Life Balance" value={company.ratings.workLifeBalance || 0} />
                        <RatingBar label="Compensation" value={company.ratings.compensation || 0} />
                        <RatingBar label="Career Growth" value={company.ratings.careerGrowth || 0} />
                        <RatingBar label="Management" value={company.ratings.management || 0} />
                      </div>
                    </div>
                  )}

                  {company.salaries?.avgSalary > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8 mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <h3 className="text-lg font-bold text-gray-900">Salary Insights</h3>
                      </div>
                      <SalaryChart salaries={company.salaries} />
                      {company.salaryPercentiles && (
                        <div className="grid grid-cols-5 gap-2 mt-4">
                          {[
                            { label: "P10", value: company.salaryPercentiles.p10 },
                            { label: "P25", value: company.salaryPercentiles.p25 },
                            { label: "P50", value: company.salaryPercentiles.p50 },
                            { label: "P75", value: company.salaryPercentiles.p75 },
                            { label: "P90", value: company.salaryPercentiles.p90 },
                          ].map((p) => (
                            <div key={p.label} className="text-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                              <p className="text-[10px] text-gray-400">{p.label}</p>
                              <p className="text-xs font-bold text-gray-700">{p.value ? `$${(p.value / 1000).toFixed(0)}K` : "—"}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {company.culture && (
                    <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8 mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Heart className="h-5 w-5 text-rose-500" />
                        <h3 className="text-lg font-bold text-gray-900">Culture</h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{company.culture}</p>
                    </div>
                  )}

                  {company.benefits?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8 mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Award className="h-5 w-5 text-purple-500" />
                        <h3 className="text-lg font-bold text-gray-900">Benefits & Perks</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {company.benefits.map((benefit) => {
                          const text = benefit.toLowerCase();
                          const Icon = Object.entries(benefitIcons).find(([k]) => text.includes(k))?.[1] || Award;
                          return (
                            <div key={benefit} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                              <Icon className="h-4 w-4 text-[#0A66C2] shrink-0" />
                              <span className="text-sm text-gray-700">{benefit}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {company.locations?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8 mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="h-5 w-5 text-[#0A66C2]" />
                        <h3 className="text-lg font-bold text-gray-900">Office Locations</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {company.locations.map((loc) => (
                          <Badge key={loc} variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                            <MapPin className="h-3 w-3 mr-1" />
                            {loc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="h-5 w-5 text-[#0A66C2]" />
                      <h3 className="text-lg font-bold text-gray-900">Links</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {company.website && (
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200" onClick={() => window.open(company.website, "_blank")}>
                          <Globe className="h-4 w-4 mr-1.5" /> Website
                        </Button>
                      )}
                      {company.socialLinks?.linkedin && (
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200" onClick={() => window.open(company.socialLinks.linkedin, "_blank")}>
                          <Linkedin className="h-4 w-4 mr-1.5" /> LinkedIn
                        </Button>
                      )}
                      {company.socialLinks?.twitter && (
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200" onClick={() => window.open(company.socialLinks.twitter, "_blank")}>
                          <Twitter className="h-4 w-4 mr-1.5" /> Twitter
                        </Button>
                      )}
                      {company.socialLinks?.glassdoor && (
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200" onClick={() => window.open(company.socialLinks.glassdoor, "_blank")}>
                          <Star className="h-4 w-4 mr-1.5" /> Glassdoor
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "jobs" && (
                <motion.div
                  key="jobs"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {linkedJobs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-16 text-center">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                        <Briefcase className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">No open positions</h3>
                      <p className="text-sm text-gray-500">There are no active job openings at {company.name} right now.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {linkedJobs.map((job, index) => (
                        <motion.div
                          key={job._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                          <Job job={job} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "tech" && (
                <motion.div
                  key="tech"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Code2 className="h-5 w-5 text-[#0A66C2]" />
                      <h3 className="text-lg font-bold text-gray-900">Technology Stack</h3>
                      <span className="text-sm text-gray-400 ml-auto">{company.techStack?.length || 0} technologies</span>
                    </div>
                    {company.techStack?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {company.techStack.map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium hover:border-[#0A66C2]/30 hover:bg-blue-50/50 transition-colors"
                          >
                            <Code2 className="h-3 w-3 mr-1.5 text-[#0A66C2]" />
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No technology stack information available.</p>
                    )}
                  </div>

                  {company.aiInsights?.techStackAnalysis && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 card-shadow p-6 sm:p-8">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">Tech Stack Analysis</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{company.aiInsights.techStackAnalysis}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "insights" && (
                <motion.div
                  key="insights"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <ScoreGauge label="Growth Score" score={company.aiInsights?.growthScore || 0} />
                    <ScoreGauge label="Stability Score" score={company.aiInsights?.stabilityScore || 0} />
                    <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-16 h-16 mx-auto mb-1.5 flex items-center justify-center">
                        <TrendingUp className={`h-8 w-8 ${company.aiInsights?.hiringTrend === "growing" ? "text-green-500" : company.aiInsights?.hiringTrend === "declining" ? "text-red-500" : "text-amber-500"}`} />
                      </div>
                      <p className="text-sm font-bold text-gray-900 capitalize">{company.aiInsights?.hiringTrend || "Unknown"}</p>
                      <p className="text-[10px] text-gray-500">Hiring Trend</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-16 h-16 mx-auto mb-1.5 flex items-center justify-center">
                        <Zap className={`h-8 w-8 ${company.aiInsights?.hiringVelocity === "fast" ? "text-green-500" : company.aiInsights?.hiringVelocity === "slow" ? "text-red-500" : "text-amber-500"}`} />
                      </div>
                      <p className="text-sm font-bold text-gray-900 capitalize">{company.aiInsights?.hiringVelocity || "Unknown"}</p>
                      <p className="text-[10px] text-gray-500">Hiring Velocity</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <AiInsightCard
                      icon={DollarSign}
                      label="Salary Prediction"
                      value={company.aiInsights?.salaryPrediction || "Insufficient data"}
                      color="bg-green-500"
                    />
                    <AiInsightCard
                      icon={Shield}
                      label="Competition Level"
                      value={company.aiInsights?.competitionLevel ? `${company.aiInsights.competitionLevel.charAt(0).toUpperCase() + company.aiInsights.competitionLevel.slice(1)} competition` : "Unknown"}
                      color="bg-blue-500"
                    />
                    <AiInsightCard
                      icon={GraduationCap}
                      label="Interview Difficulty"
                      value={company.aiInsights?.interviewDifficulty ? `${company.aiInsights.interviewDifficulty.charAt(0).toUpperCase() + company.aiInsights.interviewDifficulty.slice(1)}` : "Unknown"}
                      color="bg-purple-500"
                      tip="Based on job posting volume and seniority levels"
                    />
                    <AiInsightCard
                      icon={Activity}
                      label="Last Analyzed"
                      value={company.aiInsights?.lastAnalyzedAt ? new Date(company.aiInsights.lastAnalyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not yet analyzed"}
                      color="bg-amber-500"
                    />
                  </div>

                  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 text-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                      <h3 className="text-lg font-bold">AI-Powered Company Analysis</h3>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed mb-4">
                      Our AI analyzes {company.name}'s job postings, salary data, and market presence to generate insights.
                      Scores are calculated based on hiring activity, salary competitiveness, location diversity,
                      technology adoption, and overall market presence.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                      <span className="bg-white/10 rounded-lg px-3 py-1.5">Updated in real-time</span>
                      <span className="bg-white/10 rounded-lg px-3 py-1.5">Based on {company.totalJobCount || 0} job postings</span>
                      <span className="bg-white/10 rounded-lg px-3 py-1.5">{company.techStack?.length || 0} technologies tracked</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
