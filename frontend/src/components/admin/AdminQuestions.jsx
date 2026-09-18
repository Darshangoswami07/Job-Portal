import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Plus, Edit3, Trash2, ChevronLeft, ChevronRight,
  BookOpen, Eye, ThumbsUp, CheckCircle, XCircle, Sparkles,
  ListChecks, CircleCheck, Code2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { QUESTION_API_END_POINT } from "@/utils/constant";
import PageHeader from "@/components/recruiter/PageHeader";
import StatCard from "@/components/recruiter/StatCard";
import EmptyState from "@/components/recruiter/EmptyState";
import { SkeletonCard } from "@/components/recruiter/Skeleton";
import { motion, AnimatePresence } from "framer-motion";

const difficultyStyles = {
  easy: { label: "Easy", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  medium: { label: "Medium", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  hard: { label: "Hard", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
};

const CATEGORIES = ["Frontend", "Backend", "Programming", "Database", "Cloud", "DevOps", "AI", "System Design", "DSA", "HR"];

const emptyForm = {
  question: "", answer: "", explanation: "", category: "Frontend",
  subcategory: "", difficulty: "medium", company: "", tags: "",
  codeSnippet: "", commonMistakes: "", bestPractices: "", isPublished: true,
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, isPublished: undefined };
      if (search.trim()) params.search = search;
      const res = await axios.get(QUESTION_API_END_POINT, { params, withCredentials: true });
      if (res.data?.success) {
        setQuestions(res.data.questions || []);
        setTotalPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      }
    } catch { toast.error("Failed to load questions"); } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 350);
    return () => clearTimeout(t);
  }, [search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };

  const openEdit = (q) => {
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
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`${QUESTION_API_END_POINT}/${editing}`, payload, { withCredentials: true });
        toast.success("Question updated");
      } else {
        await axios.post(QUESTION_API_END_POINT, payload, { withCredentials: true });
        toast.success("Question created");
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchQuestions();
    } catch { toast.error("Failed to save question"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this question?")) return;
    try {
      await axios.delete(`${QUESTION_API_END_POINT}/${id}`, { withCredentials: true });
      toast.success("Question deleted");
      fetchQuestions();
    } catch { toast.error("Failed to delete"); }
  };

  const publishedCount = questions.filter((q) => q.isPublished !== false).length;
  const hardCount = questions.filter((q) => q.difficulty === "hard").length;

  const FormField = ({ label, required, children }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Interview Library"
          title="Interview Questions"
          subtitle="Build and manage your question bank with categories, difficulty levels, and sample answers."
          icon={BookOpen}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="w-52 rounded-xl pl-9 sm:w-64"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              onClick={openCreate}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-blue-700"
            >
              <Plus className="size-4" /> Add Question
            </Button>
          </div>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Questions" value={total} icon={ListChecks} variant="indigo" index={0} />
          <StatCard label="This Page" value={questions.length} icon={Code2} variant="sky" index={1} />
          <StatCard label="Published" value={publishedCount} icon={CircleCheck} variant="emerald" index={2} />
          <StatCard label="Hard" value={hardCount} icon={Sparkles} variant="rose" index={3} />
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : questions.length === 0 ? (
          <EmptyState
            variant="question"
            title={search ? "No questions match your search" : "No questions yet"}
            description={search ? "Try a different search term." : "Create your first interview question to start building your library."}
            action={<Button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25"><Plus className="size-4" /> Add Question</Button>}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {questions.map((q, i) => {
                const diff = difficultyStyles[q.difficulty?.toLowerCase?.()] || difficultyStyles.medium;
                return (
                  <motion.div
                    layout
                    key={q._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    whileHover={{ y: -4 }}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:border-indigo-400/30 hover:shadow-[0_24px_56px_-32px_rgba(79,70,229,0.35)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Badge className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                        {q.category || "General"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(q)}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                          aria-label="Edit question"
                        >
                          <Edit3 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q._id)}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500"
                          aria-label="Delete question"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-foreground">
                      {q.question}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", diff.cls)}>{diff.label}</span>
                      {q.subcategory && (
                        <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {q.subcategory}
                        </span>
                      )}
                      {q.company && (
                        <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {q.company}
                        </span>
                      )}
                    </div>

                    {(q.tags || []).slice(0, 4).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(q.tags || []).slice(0, 4).map((t) => (
                          <span key={t} className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                            {t}
                          </span>
                        ))}
                        {(q.tags || []).length > 4 && (
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            +{(q.tags || []).length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Eye className="size-3.5" /> {q.viewedCount || 0}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="size-3.5" /> {q.votes || 0}</span>
                      </span>
                      <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                        q.isPublished !== false ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                        {q.isPublished !== false ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />}
                        {q.isPublished !== false ? "Published" : "Draft"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" className="rounded-xl" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-semibold text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" className="rounded-xl" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl border-border/70 sm:max-w-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold text-foreground">
              {editing ? "Edit Question" : "Create Question"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Question" required>
              <Textarea
                required
                className="min-h-20 rounded-xl"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </FormField>

            <FormField label="Answer">
              <Textarea
                className="min-h-24 rounded-xl"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
              />
            </FormField>

            <FormField label="Explanation">
              <Textarea
                className="min-h-20 rounded-xl"
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Subcategory">
                <Input
                  className="h-10 rounded-xl"
                  placeholder="e.g. React, Node.js"
                  value={form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                />
              </FormField>
              <FormField label="Difficulty">
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Company">
                <Input
                  className="h-10 rounded-xl"
                  placeholder="e.g. Google"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </FormField>
              <FormField label="Tags (comma separated)">
                <Input
                  className="h-10 rounded-xl"
                  placeholder="react, javascript, hooks"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Common Mistakes">
                <Textarea
                  className="min-h-16 rounded-xl"
                  value={form.commonMistakes}
                  onChange={(e) => setForm({ ...form, commonMistakes: e.target.value })}
                />
              </FormField>
              <FormField label="Best Practices">
                <Textarea
                  className="min-h-16 rounded-xl"
                  value={form.bestPractices}
                  onChange={(e) => setForm({ ...form, bestPractices: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="Code Snippet">
              <Textarea
                className="min-h-20 font-mono text-xs rounded-xl"
                value={form.codeSnippet}
                onChange={(e) => setForm({ ...form, codeSnippet: e.target.value })}
              />
            </FormField>

            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="size-4 rounded accent-indigo-600"
              />
              <span className="text-sm font-semibold text-foreground">Publish this question</span>
            </label>

            <DialogFooter className="sm:justify-end">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-blue-700"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
