import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Building2, MapPin, Globe, Calendar, Briefcase, ArrowLeft,
  ExternalLink, ChevronRight, Users, Clock
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Job from "@/components/job/Job";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPANY_API_END_POINT } from "@/utils/constant";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "about", label: "About Us", icon: Building2 },
  { id: "jobs", label: "Open Roles", icon: Briefcase },
];

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

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const [companyRes, jobsRes] = await Promise.all([
          axios.get(`${COMPANY_API_END_POINT}/get/${id}`, { withCredentials: true }),
          axios.get(`${COMPANY_API_END_POINT}/${id}/jobs`),
        ]);
        if (companyRes.data.success) setCompany(companyRes.data.company);
        if (jobsRes.data.success) setJobs(jobsRes.data.jobs || []);
      } catch (error) {
        console.error("Error fetching company details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
                  <Avatar className="h-full w-full rounded-2xl">
                    <AvatarImage src={company.logo} alt={company.name} />
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{company.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {company.location && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {company.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
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

              <div className="flex flex-wrap gap-3 mb-6">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 rounded-full px-4 py-1.5 text-sm font-medium">
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  {jobs.length} open {jobs.length === 1 ? "position" : "positions"}
                </Badge>
                {company.location && (
                  <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    {company.location}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>

          <div className="mt-6">
            <div className="flex gap-1 bg-white rounded-xl border border-gray-100 card-shadow p-1.5 mb-6">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#0A66C2] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.id === "jobs" && jobs.length > 0 && (
                      <span className={cn(
                        "ml-1 text-xs rounded-full px-2 py-0.5",
                        isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      )}>
                        {jobs.length}
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
                  className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 sm:p-8"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-4">About {company.name}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {company.description || "No description provided."}
                  </p>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {company.location && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-[#0A66C2] mb-2">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm font-semibold text-gray-700">Location</span>
                        </div>
                        <p className="text-sm text-gray-600">{company.location}</p>
                      </div>
                    )}
                    {company.website && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-[#0A66C2] mb-2">
                          <Globe className="h-4 w-4" />
                          <span className="text-sm font-semibold text-gray-700">Website</span>
                        </div>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#0A66C2] hover:underline"
                        >
                          {company.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-[#0A66C2] mb-2">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm font-semibold text-gray-700">Open Positions</span>
                      </div>
                      <p className="text-sm text-gray-600">{jobs.length} active job{jobs.length !== 1 ? "s" : ""}</p>
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
                  {jobs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-16 text-center">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                        <Briefcase className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">No open positions</h3>
                      <p className="text-sm text-gray-500">There are no active job openings at {company.name} right now.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {jobs.map((job, index) => (
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
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
