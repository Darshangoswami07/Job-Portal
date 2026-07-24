import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BLOG_API_END_POINT } from "@/utils/constant";
import { Search, Plus, Edit3, Trash2, Eye, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminBlogs() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter) params.status = filter;
      const { data } = await axios.get(`${BLOG_API_END_POINT}/admin`, { params, withCredentials: true });
      if (data.success) {
        setBlogs(data.blogs);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error("Failed to load blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlogs(); }, [page, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this blog permanently?")) return;
    try {
      await axios.delete(`${BLOG_API_END_POINT}/admin/${id}`, { withCredentials: true });
      fetchBlogs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const filtered = blogs.filter((b) =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s) => {
    switch (s) {
      case "published": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "draft": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "archived": return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Management</h1>
              <p className="text-sm text-gray-500 mt-1">Create, edit, and manage blog articles</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="w-full sm:w-60 rounded-lg pl-10"
                  placeholder="Search blogs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <Button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate("/admin/blogs/create")}>
                <Plus className="h-4 w-4 mr-1" /> New Blog
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Title</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 hidden sm:table-cell">Views</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 hidden md:table-cell">Author</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((blog) => (
                    <tr key={blog._id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {blog.coverImage && (
                            <img src={blog.coverImage} alt="" className="w-10 h-10 rounded object-cover hidden sm:block" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{blog.title}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {new Date(blog.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0 text-xs">{blog.category}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(blog.status)}`}>
                          {blog.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-500 hidden sm:table-cell">{blog.views}</td>
                      <td className="py-3 px-2 text-gray-500 hidden md:table-cell">{blog.author?.fullname || "Unknown"}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => window.open(`/blogs/${blog.slug}`, "_blank")}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/blogs/${blog._id}`)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-amber-600 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(blog._id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">No blogs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}