import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Search, X, MapPin, Briefcase, Building2, ArrowRight, Globe } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPANY_API_END_POINT } from "@/utils/constant";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

function CompanySkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-16 w-16 rounded-2xl bg-gray-200" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
        </div>
        <div className="space-y-2 mb-5">
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-3/4 rounded bg-gray-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-28 rounded-full bg-gray-200" />
          <div className="h-7 w-20 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const companyCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 80, damping: 15 },
  },
};

export default function BrowseCompanies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [heroRef, isHeroVisible] = useScrollAnimation({ threshold: 0.1 });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`${COMPANY_API_END_POINT}/all`);
        if (res.data.success) {
          setCompanies(res.data.companies || []);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    if (!searchInput.trim()) return companies;
    const q = searchInput.toLowerCase();
    return companies.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q)
    );
  }, [companies, searchInput]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#F3F2EF]"
    >
      <Navbar />

      <div ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-[#0A66C2] via-[#004182] to-[#002244]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-300/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 right-10 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={isHeroVisible ? { scale: 1 } : {}}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-6"
            >
              <Building2 className="h-4 w-4 text-blue-200" />
              <span className="text-sm font-medium text-blue-100">{companies.length} companies on JobHub</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Discover Great
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
                Places to Work
              </span>
            </h1>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-10">
              Explore company profiles, culture, and open positions to find your next career move.
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#0A66C2] transition-colors" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search companies by name, description, or location..."
                  className="w-full h-14 pl-14 pr-12 rounded-2xl border-0 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-xl text-base"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F3F2EF] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {searchInput ? `Results for "${searchInput}"` : "All Companies"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredCompanies.length} company{filteredCompanies.length !== 1 ? "ies" : "y"} found
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2 card-shadow">
            <Building2 className="h-4 w-4 text-[#0A66C2]" />
            <span className="text-sm font-semibold text-gray-700">{filteredCompanies.length} companies</span>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CompanySkeleton key={i} />
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
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
              We couldn't find any companies matching your search. Try different keywords.
            </p>
            <Button
              onClick={() => setSearchInput("")}
              variant="outline"
              className="rounded-xl border-gray-300"
            >
              Clear search
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCompanies.map((company) => (
              <motion.div
                key={company._id}
                variants={companyCardVariants}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 300 } }}
                onClick={() => navigate(`/company/${company._id}`)}
                className="bg-white rounded-2xl border border-gray-100 card-shadow hover:card-shadow-hover hover:border-[#0A66C2]/30 cursor-pointer transition-all duration-300 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 group-hover:scale-105 transition-transform duration-300 shrink-0">
                      <Avatar className="h-full w-full rounded-2xl">
                        <AvatarImage src={company.logo} alt={company.name} />
                      </Avatar>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-[#0A66C2] transition-colors">
                        {company.name}
                      </h3>
                      {company.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{company.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                    {company.description || "No description provided."}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {company.openJobs > 0 && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 font-medium text-xs rounded-full px-3 py-1">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {company.openJobs} open {company.openJobs === 1 ? "position" : "positions"}
                      </Badge>
                    )}
                    {company.website && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs rounded-full px-3 py-1">
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="px-6 py-3 border-t border-gray-100 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">View Company</span>
                    <ArrowRight className="h-4 w-4 text-[#0A66C2] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
