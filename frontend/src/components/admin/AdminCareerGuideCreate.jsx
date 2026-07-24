import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { CAREER_GUIDE_API_END_POINT } from "@/utils/constant";
import { ArrowLeft, Loader2, Save } from "lucide-react";

const CATEGORIES = ["Software Development", "AI & Data", "Cloud & DevOps", "Career", "Product & Design", "System Design", "DSA"];

export default function AdminCareerGuideCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "Software Development",
    level: "beginner",
    content: "",
    excerpt: "",
    coverImage: "",
    tags: "",
    readTime: 10,
    completionTime: 0,
    featured: false,
    trending: false,
    beginnerFriendly: false,
    isPremium: false,
  });

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        difficulty: form.level === "beginner" ? 3 : form.level === "intermediate" ? 5 : 8,
      };
      await axios.post(CAREER_GUIDE_API_END_POINT, data);
      navigate("/admin/career-guides");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create guide");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate("/admin/career-guides")} className="flex items-center gap-2 text-gray-500 hover:text-amber-600 transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Guides
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Career Guide</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={handleChange("title")} required
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select value={form.category} onChange={handleChange("category")}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                <select value={form.level} onChange={handleChange("level")}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all">All Levels</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reading Time (min)</label>
                <input type="number" value={form.readTime} onChange={handleChange("readTime")} min={1}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Excerpt</label>
              <textarea value={form.excerpt} onChange={handleChange("excerpt")} rows={2}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image URL</label>
              <input type="url" value={form.coverImage} onChange={handleChange("coverImage")}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
              <input type="text" value={form.tags} onChange={handleChange("tags")} placeholder="React, JavaScript, Frontend"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (Markdown)</label>
              <textarea value={form.content} onChange={handleChange("content")} rows={16}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.featured} onChange={handleChange("featured")} className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.trending} onChange={handleChange("trending")} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                Trending
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.beginnerFriendly} onChange={handleChange("beginnerFriendly")} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                Beginner Friendly
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/career-guides")} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.title} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Create Guide
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}