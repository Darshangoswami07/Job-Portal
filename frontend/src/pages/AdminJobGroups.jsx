import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Layers, RefreshCw, Scissors, ExternalLink, AlertTriangle, ChevronLeft } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageHeader from "@/components/recruiter/PageHeader";
import { Button } from "@/components/ui/button";
import { listJobGroups, getJobGroup, splitJobGroup } from "@/api/adminJobSourcesApi";

function SourceRow({ member, canSplit, onSplit, splitting }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{member.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{member.sourceName || "—"}</span>
          <span>· {member.location || "location n/a"}</span>
          <span>· {member.remoteType}</span>
          <span>· {member.status}</span>
          {member.externalId && <span>· id {member.externalId}</span>}
        </p>
        {member.applyUrl && (
          <a
            href={member.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <ExternalLink className="size-3" /> source posting
          </a>
        )}
      </div>
      {canSplit && (
        <Button
          size="sm"
          variant="outline"
          disabled={splitting}
          onClick={() => onSplit(member)}
          className="shrink-0 gap-1.5 rounded-lg text-xs"
        >
          <Scissors className="size-3.5" />
          Separate this posting
        </Button>
      )}
    </div>
  );
}

export default function AdminJobGroups() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isAdmin = Boolean(user?.roles?.admin);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyMerged, setOnlyMerged] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [splittingId, setSplittingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listJobGroups({ autoMerged: onlyMerged ? "true" : undefined, q: q || undefined, limit: 50 });
      setGroups(data?.data?.groups || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load job groups");
    } finally {
      setLoading(false);
    }
  }, [onlyMerged, q]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const openGroup = async (group) => {
    setSelected(group);
    setDetail(null);
    try {
      const { data } = await getJobGroup(group.id);
      setDetail(data?.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load group");
    }
  };

  const handleSplit = async (member) => {
    if (!selected) return;
    setSplittingId(member.jobId);
    try {
      await splitJobGroup(selected.id, { jobId: member.jobId });
      toast.success("Group split — the posting now stands on its own");
      await load();
      await openGroup(selected);
    } catch (err) {
      toast.error(err.response?.data?.message || "Split failed");
    } finally {
      setSplittingId("");
    }
  };

  if (user && !isAdmin) {
    return (
      <>
        <Navbar />
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <AlertTriangle className="mb-3 h-10 w-10 text-amber-500" />
          <h1 className="text-lg font-bold text-foreground">Admin access required</h1>
          <Button className="mt-4 rounded-xl" onClick={() => navigate("/")}>Back home</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <PageHeader
          eyebrow="Admin"
          title="Job Groups"
          subtitle="Review deduped vacancies and split a group the similarity assist merged by mistake."
          icon={Layers}
        >
          <Button variant="outline" className="gap-2 rounded-xl" onClick={load} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </PageHeader>

        {!selected && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={onlyMerged} onChange={(e) => setOnlyMerged(e.target.checked)} />
                Only auto-merged groups
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                placeholder="Search title / company…"
                className="h-9 flex-1 min-w-[12rem] rounded-lg border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
              {!loading && groups.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No groups match.</p>
              )}
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => openGroup(g)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 text-left transition-colors hover:border-indigo-300"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{g.title || "Untitled"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {g.company || "—"} · {g.location || "location n/a"} · {g.remoteType}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {g.autoMerged && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                        auto-merged ×{g.memberHashes.length}
                      </span>
                    )}
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {g.sourceCount} {g.sourceCount === 1 ? "source" : "sources"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {selected && (
          <div className="space-y-4">
            <button
              onClick={() => { setSelected(null); setDetail(null); }}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" /> All groups
            </button>

            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <h2 className="text-base font-bold text-foreground">{selected.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.company} · {selected.location || "location n/a"} · {selected.remoteType}
              </p>
              {selected.autoMerged && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  This group folds {selected.memberHashes.length} distinct postings together via the
                  similarity assist. Separating one records a permanent block so it is not re-merged.
                </p>
              )}
            </div>

            <div className="space-y-2">
              {!detail && <p className="py-6 text-center text-sm text-muted-foreground">Loading postings…</p>}
              {detail?.members?.map((m) => (
                <SourceRow
                  key={m.jobId}
                  member={m}
                  canSplit={(detail.members || []).length > 1 && new Set((detail.members || []).map((x) => x.dedupeHash)).size > 1}
                  splitting={splittingId === m.jobId}
                  onSplit={handleSplit}
                />
              ))}
              {detail && (detail.members || []).length > 0 &&
                new Set((detail.members || []).map((x) => x.dedupeHash)).size === 1 && (
                  <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    Every posting here shares the same deterministic identity — nothing to split.
                  </p>
                )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
