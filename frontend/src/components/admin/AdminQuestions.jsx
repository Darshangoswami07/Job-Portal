import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Edit3, Trash2, ChevronLeft, ChevronRight,
  BookOpen, Eye, ThumbsUp, CheckCircle, XCircle, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { QUESTION_API_END_POINT } from "@/utils/constant";

const difficultyColor = (d) => {
  const val = d?.toLowerCase?.() || "";
  if (val === "easy") return "bg-green-50 text-green-600 border-green-200";
  if (val === "medium") return "bg-yellow-50 text-yellow-600 border-yellow-200";
  return "bg-red-50 text-red-600 border-red-200";
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    question: "", answer: "", explanation: "", category: "Frontend",
    subcategory: "", difficulty: "medium", company: "", tags: "",
    codeSnippet: "", commonMistakes: "", bestPractices: "",
    isPublished: true,
  });

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, isPublished: undefined };
      if (search.trim()) params.search = search;
      const res = await axios.get(QUESTION_API_END_POINT, { params, withCredentials: true });
      if (res.data?.success) {
        setQuestions(res.data.questions || []);
        setTotalPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      }
    } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        await axios.put(`${QUESTION_API_END_POINT}/${editing}`, payload, { withCredentials: true });
        toast.success("Question updated");
      } else {
        await axios.post(QUESTION_API_END_POINT, payload, { withCredentials: true });
        toast.success("Question created");
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      fetchQuestions();
    } catch { toast.error("Failed to save"); }
  };

  const handleEdit = (q) => {
    setForm({
      question: q.question || "",
      answer: q.answer || "",
      explanation: q.explanation || "",
      category: q.category || "Frontend",
      subcategory: q.subcategory || "",
      difficulty: q.difficulty || "medium",
      company: q.company || "",
      tags: (q.tags || []).join(", "),
      codeSnippet: q.codeSnippet || "",
      commonMistakes: q.commonMistakes || "",
      bestPractices: q.bestPractices || "",
      isPublished: q.isPublished !== false,
    });
    setEditing(q._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this question?")) return;
    try {
      await axios.delete(`${QUESTION_API_END_POINT}/${id}`, { withCredentials: true });
      toast.success("Deleted");
      fetchQuestions();
    } catch { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setForm({
      question: "", answer: "", explanation: "", category: "Frontend",
      subcategory: "", difficulty: "medium", company: "", tags: "",
      codeSnippet: "", commonMistakes: "", bestPractices: "", isPublished: true,
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
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Interview Questions</h1>
              <p className="mt-1 text-sm text-gray-500">Manage {total.toLocaleString()} questions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="w-full min-w-60 rounded-lg border-gray-200 pl-10 pr-4 py-2.5 text-sm"
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Button
                className="rounded-lg gap-2"
                onClick={() => { resetForm(); setShowForm(true); }}
              >
                <Plus className="h-4 w-4" /> Add Question
              </Button>
            </div>
          </div>

          {showForm && (
            <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editing ? "Edit Question" : "Create Question"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Question *</label>
                    <textarea
                      required
                      value={form.question}
                      onChange={(e) => setForm({ ...form, question: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2] h-20"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Answer</label>
                    <textarea
                      value={form.answer}
                      onChange={(e) => setForm({ ...form, answer: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2] h-24"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      {["Frontend", "Backend", "Programming", "Database", "Cloud", "DevOps", "AI", "System Design", "DSA", "HR"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory</label>
                    <input
                      value={form.subcategory}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. React, Node.js"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty</label>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                    <input
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. Google"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma separated)</label>
                    <input
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="react, javascript, hooks"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="rounded-lg">
                    {editing ? "Update" : "Create"}
                  </Button>
                  <Button type="button" variant="outline" className="rounded-lg" onClick={() => { setShowForm(false); resetForm(); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Question</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Category</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Difficulty</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Company</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-600">Views</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-600">Votes</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <p className="font-medium text-gray-900 line-clamp-1 max-w-md">{q.question}</p>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="secondary" className={cn("text-xs border", difficultyColor(q.difficulty))}>
                          {q.difficulty?.charAt(0).toUpperCase() + q.difficulty?.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{q.company || "-"}</td>
                      <td className="py-3 px-3 text-center text-gray-600">{q.viewedCount || 0}</td>
                      <td className="py-3 px-3 text-center text-gray-600">{q.votes || 0}</td>
                      <td className="py-3 px-3 text-center">
                        {q.isPublished !== false ? (
                          <CheckCircle className="h-4 w-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 inline" />
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(q)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                            <Edit3 className="h-4 w-4 text-gray-500" />
                          </button>
                          <button onClick={() => handleDelete(q._id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
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
