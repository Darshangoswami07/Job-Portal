import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { BarChart3, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageHeader from "@/components/recruiter/PageHeader";
import { Button } from "@/components/ui/button";
import { getAdminAnalytics, runAiQualityCheck, clearAiQualityGuard } from "@/api/adminJobSourcesApi";

const pct = (n) => (n === null || n === undefined ? "—" : `${Math.round(n * 100)}%`);
const num = (n) => (n === null || n === undefined ? "—" : n);

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Section({ title, children, note }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </div>
      {children}
    </div>
  );
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isAdmin = Boolean(user?.roles?.admin);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminAnalytics({ days: 30 });
      setData(res.data?.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const checkQuality = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
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

  const o = data?.overview;
  const s = data?.search;
  const r = data?.recommendations;
  const cfg = data?.config;
  const bench = data?.offlineBenchmark;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <PageHeader eyebrow="Admin" title="Platform Analytics" subtitle="Last 30 days · aggregate operational metrics only" icon={BarChart3}>
          <Button variant="outline" className="gap-2 rounded-xl" onClick={load} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </PageHeader>

        {loading && !data ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
        ) : !data ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No data available.</p>
        ) : data.error ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Analytics is partially unavailable — showing what could be loaded.
          </p>
        ) : (
          <>
            <Section title="Platform overview">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Active jobs" value={num(o?.activeJobs)} />
                <Stat label="Active groups" value={num(o?.activeGroups)} sub={`${num(o?.autoMergedGroups)} auto-merged`} />
                <Stat label="Sources" value={`${num(o?.enabledSources)}/${num(o?.sources)}`} sub="enabled / total" />
                <Stat
                  label="Source health"
                  value={`${o?.sourceHealth?.healthy ?? 0} ✓`}
                  sub={`${o?.sourceHealth?.warning ?? 0} warn · ${o?.sourceHealth?.error ?? 0} err`}
                />
              </div>
            </Section>

            <Section title="Search funnel" note={s?.sample === "ok" ? `${s.searches} searches` : "insufficient traffic"}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Searches" value={num(s?.searches)} />
                <Stat label="Zero-result rate" value={pct(s?.zeroResultRate)} />
                <Stat label="Detail opens" value={num(s?.detailOpens)} />
                <Stat label="Detail → apply" value={pct(s?.detailToApplyRate)} />
              </div>
              {s?.topQueries?.length > 0 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Top queries</p>
                    <ul className="space-y-0.5 text-sm">
                      {s.topQueries.slice(0, 6).map((q) => (
                        <li key={q.query} className="flex justify-between"><span className="truncate">{q.query || "(blank)"}</span><span className="text-muted-foreground">{q.count}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Zero-result queries</p>
                    <ul className="space-y-0.5 text-sm">
                      {(s.zeroResultQueries || []).slice(0, 6).map((q) => (
                        <li key={q.query} className="flex justify-between"><span className="truncate">{q.query}</span><span className="text-muted-foreground">{q.count}</span></li>
                      ))}
                      {!s.zeroResultQueries?.length && <li className="text-muted-foreground">none</li>}
                    </ul>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Recommendation funnel" note={r?.sample === "ok" ? `${r.impressions} impressions` : "insufficient impression traffic"}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Requests" value={num(r?.requests)} sub={`${r?.strategy?.["deterministic+ai"] ?? 0} used AI`} />
                <Stat label="Cache hit rate" value={pct(r?.cache?.hitRate)} />
                <Stat label="CTR" value={pct(r?.ctr)} />
                <Stat label="Apply-through" value={pct(r?.applyThroughRate)} />
                <Stat label="Save rate" value={pct(r?.saveRate)} />
                <Stat label="Dismiss rate" value={pct(r?.dismissRate)} />
                <Stat label="AI success" value={pct(r?.ai?.successRate)} sub={`${r?.ai?.attempts ?? 0} attempts`} />
                <Stat label="AI fallback" value={pct(r?.ai?.fallbackRate)} sub={Object.keys(r?.ai?.errors || {}).join(", ") || "—"} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Reco latency (avg)" value={r?.latencyMs?.totalAvg != null ? `${r.latencyMs.totalAvg} ms` : "—"} />
                <Stat label="Reco latency (p95)" value={r?.latencyMs?.totalP95 != null ? `${r.latencyMs.totalP95} ms` : "—"} />
                <Stat label="AI latency (avg)" value={r?.latencyMs?.aiAvg != null ? `${r.latencyMs.aiAvg} ms` : "—"} />
                <Stat label="AI latency (p95)" value={r?.latencyMs?.aiP95 != null ? `${r.latencyMs.aiP95} ms` : "—"} />
              </div>
            </Section>

            <Section title="AI configuration & quality guard">
              <div className="flex flex-wrap items-center gap-4">
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${cfg?.featureEnabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  AI {cfg?.featureEnabled ? "enabled" : "disabled"}
                </span>
                <span className="text-xs text-muted-foreground">
                  provider: {cfg?.providerName} · configured: {String(cfg?.providerConfigured)} · prompt: {cfg?.promptVersion} · precompute: {String(cfg?.precomputeEnabled)}
                </span>
                {cfg?.aiQuality?.tripped ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600"><ShieldAlert className="size-4" /> quality guard TRIPPED — deterministic preferred</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><ShieldCheck className="size-4" /> quality guard open</span>
                )}
              </div>
              {bench && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Offline benchmark ({bench.personas} personas): P@5 {bench.precisionAt5} · HitRate@5 {bench.hitRateAt5} · MRR {bench.mrr} · NDCG@5 {bench.ndcgAt5}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="rounded-lg text-xs" disabled={busy} onClick={() => checkQuality(runAiQualityCheck, "Quality check complete")}>
                  Run quality check
                </Button>
                {cfg?.aiQuality?.tripped && (
                  <Button size="sm" variant="outline" className="rounded-lg text-xs" disabled={busy} onClick={() => checkQuality(clearAiQualityGuard, "Guard cleared")}>
                    Clear guard
                  </Button>
                )}
              </div>
            </Section>

            <Section title="Sources">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-3">Source</th><th className="pr-3">Status</th><th className="pr-3">Last sync</th>
                      <th className="pr-3">Imported</th><th className="pr-3">Updated</th><th className="pr-3">Fails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.sources || []).map((src) => (
                      <tr key={src.key} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-medium">{src.name}</td>
                        <td className="pr-3">
                          <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                            src.status === "healthy" ? "bg-emerald-50 text-emerald-700"
                            : src.status === "warning" ? "bg-amber-50 text-amber-700"
                            : src.status === "error" ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-500"}`}>{src.status}</span>
                        </td>
                        <td className="pr-3 text-muted-foreground">{src.lastSyncAt ? new Date(src.lastSyncAt).toLocaleString() : "—"}</td>
                        <td className="pr-3">{src.imported}</td>
                        <td className="pr-3">{src.updated}</td>
                        <td className="pr-3">{src.consecutiveFailures}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}
      </div>
    </>
  );
}
