import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CAREER_GUIDE_API_END_POINT } from "@/utils/constant";
import {
  Search, Plus, Edit3, Trash2, Eye, Clock, Loader2,
  ChevronLeft, ChevronRight, Star, TrendingUp, GraduationCap,
} from "lucide-react";

export default function AdminCareerGuides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sort: "newest" };
      if (search) params.search = search;
      const { data } = await axios.get(CAREER_GUIDE_API_END_POINT, { params });
      if (data.success) {
        setGuides(data.guides);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error("Failed to load guides:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuides(); }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this guide permanently?")) return;
    try {
      await axios.delete(`${CAREER_GUIDE_API_END_POINT}/${id}`);
      fetchGuides();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await axios.patch(`${CAREER_GUIDE_API_END_POINT}/${id}/featured`);
      fetchGuides();
    } catch {}
  };

  const handleToggleTrending = async (id) => {
    try {
      await axios.patch(`${CAREER_GUIDE_API_END_POINT}/${id}/trending`);
      fetchGuides();
    } catch {}
  };

  const filtered = guides.filter((g) =>
    !search || g.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Career Guides</h1>
            <p className="text-sm text-gray-500">Manage career guides</p>
          </div>
          <Button onClick={() => navigate("/admin/career-guides/create")} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> New Guide
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guides..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Level</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Views</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.map((g) => (
                    <tr key={g._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {g.coverImage && (
                            <img src={g.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{g.title}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {g.readTime} min
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0">
                          {g.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          g.level === "beginner" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          g.level === "intermediate" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          g.level === "advanced" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>{g.level}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{g.views}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          {g.featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          {g.trending && <TrendingUp className="h-4 w-4 text-red-500" />}
                          {g.beginnerFriendly && <GraduationCap className="h-4 w-4 text-green-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/career-guides/${g.slug}`)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-blue-600"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(g._id)}
                            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 ${g.featured ? "text-amber-500" : "text-gray-400 hover:text-amber-500"}`}
                            title="Toggle Featured"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleTrending(g._id)}
                            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 ${g.trending ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                            title="Toggle Trending"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(g._id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}