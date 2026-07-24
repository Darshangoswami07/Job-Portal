import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RESUME_TEMPLATE_API_END_POINT } from "@/utils/constant";
import {
  Search, Plus, Edit3, Trash2, Crown, Star, Download,
  ChevronLeft, ChevronRight, Eye, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export default function AdminResumeTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "", description: "", category: "Professional", subcategory: "",
    isPremium: false, isActive: true, atsScore: 85, layout: "standard",
    font: "Inter", tags: "", features: "", sections: "",
    colors: { primary: "#0A66C2", secondary: "#1F2937", accent: "#E5E7EB", background: "#FFFFFF", text: "#111827" },
  });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search;
      const res = await axios.get(RESUME_TEMPLATE_API_END_POINT, { params });
      if (res.data?.success) {
        setTemplates(res.data.templates || []);
        setTotalPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      }
    } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      features: form.features.split(",").map((f) => f.trim()).filter(Boolean),
      sections: form.sections.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        await axios.put(`${RESUME_TEMPLATE_API_END_POINT}/${editing}`, payload, { withCredentials: true });
        toast.success("Template updated");
      } else {
        await axios.post(RESUME_TEMPLATE_API_END_POINT, payload, { withCredentials: true });
        toast.success("Template created");
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      fetchTemplates();
    } catch { toast.error("Failed to save"); }
  };

  const handleEdit = (t) => {
    setForm({
      name: t.name || "",
      description: t.description || "",
      category: t.category || "Professional",
      subcategory: t.subcategory || "",
      isPremium: t.isPremium || false,
      isActive: t.isActive !== false,
      atsScore: t.atsScore || 85,
      layout: t.layout || "standard",
      font: t.font || "Inter",
      tags: (t.tags || []).join(", "),
      features: (t.features || []).join(", "),
      sections: (t.sections || []).join(", "),
      colors: t.colors || { primary: "#0A66C2", secondary: "#1F2937", accent: "#E5E7EB", background: "#FFFFFF", text: "#111827" },
    });
    setEditing(t._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this template?")) return;
    try {
      await axios.delete(`${RESUME_TEMPLATE_API_END_POINT}/${id}`, { withCredentials: true });
      toast.success("Deleted");
      fetchTemplates();
    } catch { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setForm({
      name: "", description: "", category: "Professional", subcategory: "",
      isPremium: false, isActive: true, atsScore: 85, layout: "standard",
      font: "Inter", tags: "", features: "", sections: "",
      colors: { primary: "#0A66C2", secondary: "#1F2937", accent: "#E5E7EB", background: "#FFFFFF", text: "#111827" },
    });
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white card-shadow rounded-lg p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Resume Templates</h1>
              <p className="mt-1 text-sm text-gray-500">{total.toLocaleString()} templates</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="w-full min-w-60 rounded-lg border-gray-200 pl-10 pr-4 py-2.5 text-sm"
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Button className="rounded-lg gap-2" onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="h-4 w-4" /> Add Template
              </Button>
            </div>
          </div>

          {showForm && (
            <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? "Edit Template" : "Create Template"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      {["Professional", "Modern", "Technology", "AI Engineer", "Creative", "Student", "Business",
                        "Finance", "Healthcare", "Sales", "HR", "Product Manager", "Project Manager", "Consultant",
                        "Freelancer", "Academic", "International Resume", "Legal"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory</label>
                    <input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Layout</label>
                    <select value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      {["standard", "two-column", "minimal", "creative", "executive"].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ATS Score</label>
                    <input type="number" min="0" max="100" value={form.atsScore}
                      onChange={(e) => setForm({ ...form, atsScore: Number(e.target.value) })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Font</label>
                    <input value={form.font} onChange={(e) => setForm({ ...form, font: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma separated)</label>
                    <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={form.isPremium}
                        onChange={(e) => setForm({ ...form, isPremium: e.target.checked })} />
                      Premium
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                      Active
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="rounded-lg">{editing ? "Update" : "Create"}</Button>
                  <Button type="button" variant="outline" className="rounded-lg" onClick={() => { setShowForm(false); resetForm(); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Category</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-600">ATS</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-600">Rating</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-600">Downloads</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-600">Premium</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-600">Active</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-13 bg-gray-100 rounded border overflow-hidden flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: t.previewSvg?.substring(0, 200) || "" }} />
                          <span className="font-medium text-gray-900">{t.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3"><Badge variant="secondary" className="text-xs">{t.category}</Badge></td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="outline" className={cn("text-xs", t.atsScore >= 95 ? "text-green-600 border-green-200" : t.atsScore >= 85 ? "text-yellow-600 border-yellow-200" : "text-red-600 border-red-200")}>
                          {t.atsScore}%
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center text-gray-600">
                        <span className="flex items-center justify-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{t.rating}</span>
                      </td>
                      <td className="py-3 px-3 text-center text-gray-600">{formatCount(t.downloads)}</td>
                      <td className="py-3 px-3 text-center">{t.isPremium ? <Crown className="h-4 w-4 text-amber-500 inline" /> : "—"}</td>
                      <td className="py-3 px-3 text-center">
                        <div className={cn("w-2 h-2 rounded-full mx-auto", t.isActive !== false ? "bg-green-500" : "bg-red-400")} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(t)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit3 className="h-4 w-4 text-gray-500" /></button>
                          <button onClick={() => handleDelete(t._id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
