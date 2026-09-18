import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Loader2, User, Building2, Hash, FileText, GraduationCap } from "lucide-react";
import { globalSearch } from "@/api/socialApi";
import PostList from "./PostList";
import { useSelector } from "react-redux";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/Navbar";

const TABS = ["all", "posts", "people", "companies", "hashtags", "projects", "certificates"];

export default function SearchPage() {
  const currentUser = useSelector((s) => s.auth.user);
  const viewerId = currentUser ? String(currentUser._id) : '';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [tab, setTab] = useState(searchParams.get("type") || "all");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const runSearch = useCallback(async (query, type) => {
    if (!query.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await globalSearch({ q: query, type, limit: 20 });
      setResults(res.data.results);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => runSearch(q, tab), 350);
    return () => clearTimeout(timer.current);
  }, [q, tab, runSearch]);

  const counts = {
    posts: results?.posts?.length || 0,
    people: results?.people?.length || 0,
    companies: results?.companies?.length || 0,
    hashtags: results?.hashtags?.length || 0,
    projects: results?.projects?.length || 0,
    certificates: results?.certificates?.length || 0,
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Search JobPilot</h1>
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="Search posts, people, companies, hashtags, projects..."
            className="w-full rounded-full border border-border bg-card py-3.5 pl-12 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30"
          />
        </div>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold capitalize transition", tab === t ? "border-[#0A66C2] bg-[#0A66C2] text-white" : "border-border bg-card text-muted-foreground hover:text-foreground")}
            >
              {t === "all" ? "All" : t}
              {t !== "all" && counts[t] ? <span className="ml-1 text-[10px] opacity-70">({counts[t]})</span> : null}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-[#0A66C2]" /></div>
      ) : !results ? (
        <p className="py-16 text-center text-muted-foreground">Type something to search across JobPilot.</p>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {["people", "companies"].some((t) => tab === "all" || tab === t) && ((results.people || []).length > 0 || (results.companies || []).length > 0) && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground"><User className="size-4 text-[#0A66C2]" /> People & Companies</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {(tab === "all" ? [...(results.people || []), ...(results.companies || [])] : tab === "people" ? results.people || [] : results.companies || []).slice(0, 8).map((p) => (
                  <button key={String(p._id)} onClick={() => navigate(`/feed/people/${String(p._id)}`)} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition hover:border-[#0A66C2]/40 hover:shadow-md">
                    <Avatar className="size-10">
                      <AvatarImage src={p.profile?.profilePhoto} alt={p.fullname} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white">{(p.fullname || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-foreground">{p.fullname}</span>
                      <span className="block truncate text-xs text-muted-foreground">{p.profile?.headline || p.profile?.companyName || (p.profile?.industry ? `${p.profile.industry} company` : "Professional")}</span>
                    </span>
                    {p.profile?.companyName && <Building2 className="ml-auto size-4 shrink-0 text-muted-foreground" />}
                  </button>
                ))}
              </div>
            </section>
          )}

          {(tab === "all" || tab === "hashtags") && (results.hashtags || []).length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground"><Hash className="size-4 text-violet-500" /> Hashtags</h2>
              <div className="flex flex-wrap gap-2">
                {results.hashtags.map((h) => (
                  <button key={h.name} onClick={() => navigate(`/feed/hashtag/${h.name}`)} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600 transition hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400">
                    #{h.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {(tab === "all" || tab === "posts" || tab === "projects" || tab === "certificates") && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                {tab === "projects" ? <><FileText className="size-4 text-violet-500" /> Projects</> : tab === "certificates" ? <><GraduationCap className="size-4 text-amber-500" /> Certificates</> : <><FileText className="size-4 text-slate-500" /> Posts</>}
              </h2>
              <PostList
                posts={tab === "projects" ? results.projects || [] : tab === "certificates" ? results.certificates || [] : results.posts || []}
                loading={false}
                viewerId={viewerId}
                emptyTitle="No results in this category"
              />
            </section>
          )}
        </motion.div>
      )}
    </div>
    </>
  );
}