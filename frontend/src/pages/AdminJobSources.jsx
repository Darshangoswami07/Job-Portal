import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Radio, RefreshCw, ServerCog, Activity, AlertTriangle, Plus, Clock, TrendingUp } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageHeader from "@/components/recruiter/PageHeader";
import StatCard from "@/components/recruiter/StatCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useJobSources, useSyncPoll } from "@/hooks/useJobSources";
import { syncJobSource, updateJobSource, getSourceCoverage } from "@/api/adminJobSourcesApi";
import SourceCard from "@/components/admin/jobSources/SourceCard";
import SourceDetailPanel from "@/components/admin/jobSources/SourceDetailPanel";
import AddSourceForm from "@/components/admin/jobSources/AddSourceForm";
import AdminActivityPanel from "@/components/admin/jobSources/AdminActivityPanel";

export default function AdminJobSources() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { sources, loading, error, refresh } = useJobSources();
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const syncPoll = useSyncPoll({ onDone: () => refresh() });
  const [coverage, setCoverage] = useState(null);

  const isAdmin = Boolean(user?.roles?.admin);

  useEffect(() => {
    let alive = true;
    getSourceCoverage()
      .then((res) => alive && setCoverage(res.data?.data || null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [sources.length]);

  const totals = useMemo(() => {
    const t = { active: 0, healthy: 0, warning: 0, errorN: 0 };
    for (const s of sources) {
      t.active += s.jobs?.active || 0;
      const st = s.health?.status;
      if (st === "healthy") t.healthy += 1;
      else if (st === "warning") t.warning += 1;
      else if (st === "error") t.errorN += 1;
    }
    return t;
  }, [sources]);

  if (user && !isAdmin) {
    return (
      <>
        <Navbar />
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <AlertTriangle className="mb-3 h-10 w-10 text-amber-500" />
          <h1 className="text-lg font-bold text-foreground">Admin access required</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This area is only available to administrators.
          </p>
          <Button className="mt-4 rounded-xl" onClick={() => navigate("/")}>
            Back home
          </Button>
        </div>
      </>
    );
  }

  const handleSync = async (source) => {
    setBusyId(source.id);
    try {
      await syncJobSource(source.id); // 202 accepted — runs in the background
      toast.success(`${source.name}: sync started`);
      await refresh();
      syncPoll.begin(source.id); // poll health until it leaves "running"
    } catch (err) {
      toast.error(err.response?.data?.message || "Sync failed to start");
    } finally {
      setBusyId("");
    }
  };

  const handleToggle = async (source) => {
    setBusyId(source.id);
    try {
      await updateJobSource(source.id, { enabled: !source.enabled });
      toast.success(source.enabled ? `${source.name} disabled` : `${source.name} enabled`);
      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Operations"
          title="Job Sources"
          subtitle="Monitor and control every job ingestion source. Manual sync, health, configuration and link verification."
          icon={ServerCog}
        >
          <Button variant="outline" className="rounded-xl" onClick={refresh} disabled={loading}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
          <Button className="rounded-xl" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Source
          </Button>
        </PageHeader>

        {showAdd && (
          <AddSourceForm
            onClose={() => setShowAdd(false)}
            onCreated={() => refresh()}
          />
        )}

        {selected ? (
          <div className="mt-6">
            <SourceDetailPanel
              sourceId={selected}
              onBack={() => {
                setSelected(null);
                refresh();
              }}
              onChanged={refresh}
            />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Active jobs" value={totals.active} icon={Activity} variant="indigo" index={0} />
              <StatCard label="Healthy" value={totals.healthy} icon={Radio} variant="emerald" index={1} />
              <StatCard label="Warnings" value={totals.warning} icon={AlertTriangle} variant="amber" index={2} />
              <StatCard label="Errors" value={totals.errorN} icon={AlertTriangle} variant="rose" index={3} />
            </div>

            {coverage?.health && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Configured" value={coverage.health.configuredSources ?? 0} icon={ServerCog} variant="violet" index={0} />
                <StatCard label="Enabled" value={coverage.health.enabled ?? 0} icon={Radio} variant="emerald" index={1} />
                <StatCard label="Overdue" value={coverage.health.overdue ?? 0} icon={Clock} variant="amber" index={2} />
                <StatCard label="Jobs added today" value={coverage.totals?.added ?? 0} icon={TrendingUp} variant="indigo" index={3} />
              </div>
            )}

            {coverage?.worker && (
              <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        coverage.worker.status === "running"
                          ? "bg-emerald-500"
                          : coverage.worker.status === "stopped"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                      )}
                    />
                    Sync worker:{" "}
                    {coverage.worker.status === "running"
                      ? "Running"
                      : coverage.worker.status === "stopped"
                        ? "Not running"
                        : "Unknown"}
                  </span>
                  <span className="text-muted-foreground">
                    Scheduled sources: <b className="text-foreground">{coverage.worker.scheduledSources ?? 0}</b>
                  </span>
                  <span className="text-muted-foreground">
                    Overdue: <b className="text-foreground">{coverage.worker.overdueScheduledSources?.length ?? 0}</b>
                  </span>
                  <span className="text-muted-foreground">
                    Last scheduled sync:{" "}
                    <b className="text-foreground">
                      {coverage.worker.lastScheduledSyncAt
                        ? new Date(coverage.worker.lastScheduledSyncAt).toLocaleString()
                        : "—"}
                    </b>
                  </span>
                  {coverage.worker.nextExpectedSyncAt && (
                    <span className="text-muted-foreground">
                      Next expected:{" "}
                      <b className="text-foreground">{new Date(coverage.worker.nextExpectedSyncAt).toLocaleString()}</b>
                    </span>
                  )}
                </div>
                {coverage.worker.status !== "running" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    "Unknown" / "Not running" is inferred from persisted SyncRun history — deploy a Render Background
                    Worker (<code className="rounded bg-muted px-1">npm run worker</code>) for autonomous scheduled syncs.
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 space-y-3">
              {loading && sources.length === 0 && (
                <div className="py-16 text-center text-sm text-muted-foreground">Loading sources…</div>
              )}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {error}
                </div>
              )}
              {!loading && !error && sources.length === 0 && (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  No job sources configured yet.
                </div>
              )}
              {sources.map((s, i) => (
                <SourceCard
                  key={String(s.id)}
                  source={s}
                  index={i}
                  busy={busyId === s.id || syncPoll.pollingId === s.id}
                  onManage={() => setSelected(s.id)}
                  onSync={handleSync}
                  onToggle={handleToggle}
                />
              ))}
            </div>

            <div className="mt-6">
              <AdminActivityPanel />
            </div>
          </>
        )}
      </div>
    </>
  );
}
