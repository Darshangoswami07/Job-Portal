import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BLOG_API_END_POINT } from "@/utils/constant";
import { ArrowLeft, Loader2 } from "lucide-react";

const CATEGORIES = [
  "Software Development", "React", "Next.js", "JavaScript", "TypeScript",
  "Python", "Java", "Go", "Node.js",
  "AI", "AI Engineering", "LLMs", "RAG", "MCP", "AI Agents", "LangGraph", "LangChain", "Prompt Engineering",
  "Career", "Resume Tips", "ATS Optimization", "Salary Negotiation", "Interview Preparation", "Remote Jobs", "Freelancing", "Career Growth",
  "Cloud", "AWS", "Azure", "Docker", "Kubernetes", "DevOps",
  "Data Science", "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
];

export default function AdminBlogCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", excerpt: "", content: "", coverImage: "",
    category: "Career", tags: "", status: "draft", featured: false,
    readTime: 5, seoTitle: "", seoDescription: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        readTime: Number(form.readTime),
      };
      await axios.post(BLOG_API_END_POINT, payload, { withCredentials: true });
      navigate("/admin/blogs");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create blog");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <button onClick={() => navigate("/admin/blogs")} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Blogs
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Blog</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <Input name="title" value={form.title} onChange={handleChange} required placeholder="Enter blog title" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select name="category" value={form.category} onChange={handleChange} required
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image URL</label>
              <Input name="coverImage" value={form.coverImage} onChange={handleChange} placeholder="https://..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Excerpt</label>
              <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm resize-none"
                placeholder="Brief description of the article" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (Markdown) *</label>
              <textarea name="content" value={form.content} onChange={handleChange} required rows={15}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-mono resize-y"
                placeholder="# Article Title&#10;&#10;Write your content here using markdown..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                <Input name="tags" value={form.tags} onChange={handleChange} placeholder="React, JavaScript, Web" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Read Time (minutes)</label>
                <Input name="readTime" type="number" value={form.readTime} onChange={handleChange} min={1} />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured Article</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SEO Title</label>
                <Input name="seoTitle" value={form.seoTitle} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SEO Description</label>
                <Input name="seoDescription" value={form.seoDescription} onChange={handleChange} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate("/admin/blogs")}>Cancel</Button>
              <Button type="submit" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {saving ? "Creating..." : "Create Blog"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}