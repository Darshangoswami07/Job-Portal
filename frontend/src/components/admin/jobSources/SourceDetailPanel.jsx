import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, RefreshCw, Link2, Power, Loader2, Save, ShieldAlert, Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useJobSource, useJobSourceSyncRuns, useSyncPoll } from "@/hooks/useJobSources";
import {
  updateJobSource, syncJobSource, verifyJobSourceLinks, testJobSource,
} from "@/api/adminJobSourcesApi";
import SourceHealthBadge from "./SourceHealthBadge";

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-border/60 bg-background/60 p-3">
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
  </div>
);

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "—");
const fmtDur = (ms) => (ms ? `${(ms / 1000).toFixed(1)}s` : "—");

export default function SourceDetailPanel({ sourceId, onBack, onChanged }) {
  const { source, warnings, loading, refresh } = useJobSource(sourceId);
  const [runPage, setRunPage] = useState(1);
  const { runs, pagination, refresh: refreshRuns } = useJobSourceSyncRuns(sourceId, runPage, 10);

  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState(""); // "disable" | "verify"
  const [form, setForm] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const syncPoll = useSyncPoll({
    onDone: (d) => {
      refresh();
      refreshRuns();
      if (d?.lastRun?.status === "ok") toast.success("Sync complete");
      else if (d?.lastRun?.status) toast.warning(`Sync finished: ${d.lastRun.status}`);
    },
  });

  if (loading || !source) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading source…
      </div>
    );
  }

  const f = form || {
    name: source.name,
    schedule: source.schedule,
    rateLimitPerMin: source.rateLimitPerMin,
    credentialRef: "",
  };
  const setF = (patch) => setForm({ ...f, ...patch });

  const afterChange = async () => {
    await refresh();
    await refreshRuns();
    onChanged?.();
  };

  const doSync = async () => {
    setBusy("sync");
    try {
      await syncJobSource(source.id); // 202 accepted; runs in background
      toast.success("Sync started");
      await afterChange();
      syncPoll.begin(source.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Sync failed to start");
    } finally {
      setBusy("");
    }
  };

  const running = source.running || syncPoll.pollingId === source.id;

  const doToggle = async () => {
    if (source.enabled && confirm !== "disable") return setConfirm("disable");
    setConfirm("");
    setBusy("toggle");
    try {
      await updateJobSource(source.id, { enabled: !source.enabled });
      toast.success(source.enabled ? "Source disabled" : "Source enabled");
      await afterChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setBusy("");
    }
  };

  const doTest = async () => {
    setBusy("test");
    setTestResult(null);
    try {
      const res = await testJobSource(source.id);
      const d = res.data?.data || {};
      setTestResult(d);
      if (d.ok) toast.success(`Test OK — parsed ${d.parsed} of ${d.fetched} sample rows`);
      else toast.warning(d.error ? `Test failed: ${d.error}` : d.note || "Test returned no rows");
    } catch (err) {
      toast.error(err.response?.data?.message || "Test failed");
    } finally {
      setBusy("");
    }
  };

  const doVerify = async () => {
    if (confirm !== "verify") return setConfirm("verify");
    setConfirm("");
    setBusy("verify");
    try {
      const res = await verifyJobSourceLinks(source.id, { limit: 100 });
      const d = res.data?.data || {};
      toast.success(`Checked ${d.checked}: ${d.verified} ok, ${d.dead} dead, ${d.transient} transient`);
      await afterChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setBusy("");
    }
  };

  const doSave = async () => {
    setBusy("save");
    try {
      const body = {
        name: f.name,
        schedule: f.schedule,
        rateLimitPerMin: Number(f.rateLimitPerMin),
      };
      if (f.credentialRef?.trim()) body.credentialRef = f.credentialRef.trim();
      await updateJobSource(source.id, body);
      toast.success("Configuration saved");
      setForm(null);
      await afterChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setBusy("");
    }
  };

  const lr = source.lastRun;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All sources
      </button>

      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{source.name}</h2>
              <SourceHealthBadge status={running ? "running" : source.health?.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-mono">{source.key}</span> · {source.type} · adapter{" "}
              <span className="font-mono">{source.adapter}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-xl" onClick={doToggle} disabled={!!busy}>
              <Power className="mr-1.5 h-3.5 w-3.5" />
              {confirm === "disable" ? "Confirm disable" : source.enabled ? "Disable" : "Enable"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={doVerify}
              disabled={!!busy}
            >
              {busy === "verify" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {confirm === "verify" ? "Confirm verify (100)" : "Verify links"}
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={doTest} disabled={!!busy}>
              {busy === "test" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plug className="mr-1.5 h-3.5 w-3.5" />
              )}
              Test connection
            </Button>
            <Button size="sm" className="rounded-xl" onClick={doSync} disabled={!!busy || running || !source.enabled}>
              {busy === "sync" || running ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              {running ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        </div>

        {testResult && (
          <div className={cn(
            "mt-4 rounded-xl border p-3 text-xs",
            testResult.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          )}>
            <p className="font-semibold">
              Connection test: {testResult.ok ? "OK" : "no rows / failed"}
              {typeof testResult.durationMs === "number" ? ` (${(testResult.durationMs / 1000).toFixed(1)}s)` : ""}
            </p>
            {testResult.error && <p className="mt-0.5">{testResult.error}</p>}
            {testResult.note && <p className="mt-0.5">{testResult.note}</p>}
            {Array.isArray(testResult.sample) && testResult.sample.length > 0 && (
              <ul className="mt-1 list-inside list-disc">
                {testResult.sample.map((s, i) => (
                  <li key={i}>
                    {s.title || "(untitled)"} — {s.company || "?"} · {s.location || "?"}
                    {s.hasApplyUrl ? " · apply URL ✓" : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <p className="mb-1 flex items-center gap-1.5 font-semibold">
              <ShieldAlert className="h-3.5 w-3.5" /> {warnings.length} warning(s)
            </p>
            <ul className="list-inside list-disc space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Stat label="Active jobs" value={(source.jobs?.active ?? 0).toLocaleString()} />
          <Stat label="Expired" value={(source.jobs?.expired ?? 0).toLocaleString()} />
          <Stat label="Last fetched" value={running ? "—" : lr?.fetched ?? "—"} />
          <Stat label="Last inserted" value={running ? "—" : lr?.inserted ?? "—"} />
          <Stat label="Last updated" value={running ? "—" : lr?.updated ?? "—"} />
          <Stat label="Last expired" value={running ? "—" : lr?.deactivated ?? "—"} />
          <Stat label="Last errors" value={running ? "—" : lr?.errorCount ?? "—"} />
          <Stat label="Last duration" value={running ? "—" : fmtDur(source.lastSyncDurationMs)} />
        </div>
      </div>

      {/* configuration */}
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <h3 className="mb-3 text-sm font-bold text-foreground">Configuration</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Name</span>
            <input
              value={f.name}
              onChange={(e) => setF({ name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Schedule (cron)</span>
            <input
              value={f.schedule}
              onChange={(e) => setF({ schedule: e.target.value })}
              placeholder="0 */6 * * *"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Rate limit / min</span>
            <input
              type="number"
              min={0}
              max={1000}
              value={f.rateLimitPerMin}
              onChange={(e) => setF({ rateLimitPerMin: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Credential env-var name (leave blank to keep){" "}
              <span className={cn("font-semibold", source.credentials?.configured ? "text-emerald-600" : "text-rose-500")}>
                — {source.credentials?.configured ? "Configured" : "Not configured"}
              </span>
            </span>
            <input
              value={f.credentialRef}
              onChange={(e) => setF({ credentialRef: e.target.value })}
              placeholder="e.g. ADZUNA_APP_KEY"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </label>
        </div>

        {source.config && Object.keys(source.config).length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Source config (secret values are redacted)
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {JSON.stringify(source.config, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" className="rounded-xl" onClick={doSave} disabled={!form || !!busy}>
            {busy === "save" ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save changes
          </Button>
          {form && (
            <button onClick={() => setForm(null)} className="text-xs text-muted-foreground hover:text-foreground">
              Discard
            </button>
          )}
        </div>
      </div>

      {/* sync history */}
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <h3 className="mb-3 text-sm font-bold text-foreground">Recent sync runs</h3>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sync runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="py-2 pr-3 font-medium">Started</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Dur</th>
                  <th className="py-2 pr-3 font-medium">Fetch</th>
                  <th className="py-2 pr-3 font-medium">Ins</th>
                  <th className="py-2 pr-3 font-medium">Upd</th>
                  <th className="py-2 pr-3 font-medium">Exp</th>
                  <th className="py-2 pr-3 font-medium">Err</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {runs.map((r) => (
                  <tr key={String(r.id)} className="border-b border-border/40">
                    <td className="py-2 pr-3">{fmtDate(r.startedAt)}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 font-medium",
                          r.status === "ok" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
                          r.status === "partial" && "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                          r.status === "error" && "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
                          r.status === "running" && "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{fmtDur(r.durationMs)}</td>
                    <td className="py-2 pr-3">{r.fetched}</td>
                    <td className="py-2 pr-3">{r.inserted}</td>
                    <td className="py-2 pr-3">{r.updated}</td>
                    <td className="py-2 pr-3">{r.deactivated}</td>
                    <td className="py-2 pr-3">{r.errorCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={runPage <= 1}
                onClick={() => setRunPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={runPage >= pagination.totalPages}
                onClick={() => setRunPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
