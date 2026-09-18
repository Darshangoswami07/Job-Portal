import { motion } from "framer-motion";
import { RefreshCw, Settings2, Power, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SourceHealthBadge from "./SourceHealthBadge";

const TYPE_LABEL = {
  internal: "Internal",
  ats: "ATS",
  aggregator: "Aggregator",
  feed: "Feed",
  partner: "Partner",
};

function timeAgo(date) {
  if (!date) return "never";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export default function SourceCard({ source, onManage, onSync, onToggle, busy, index = 0 }) {
  const running = busy || source.running;
  const health = source.health?.status || "warning";
  const counts = source.jobs || { active: 0 };
  const lastRun = source.lastRun;
  const alertState = source.alertState && source.alertState !== "ok" ? source.alertState : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">{source.name}</h3>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {TYPE_LABEL[source.type] || source.type}
            </span>
            <SourceHealthBadge status={running ? "running" : health} />
            {alertState && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {alertState === "failing" ? "repeated failures" : "job count drop"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {running ? (
              <span className="font-medium text-indigo-600 dark:text-indigo-400">Syncing…</span>
            ) : (
              <>
                <span className="font-mono">{source.key}</span> · {source.adapter}
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {(counts.active ?? 0).toLocaleString()} active
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> Last sync {timeAgo(source.lastSyncAt)}
            </span>
            {lastRun && (
              <span>
                {lastRun.inserted}+ / {lastRun.updated}~ / {lastRun.deactivated}−
                {lastRun.errorCount > 0 && (
                  <span className="text-rose-500"> · {lastRun.errorCount} err</span>
                )}
              </span>
            )}
            {source.lastSyncDurationMs > 0 && <span>{(source.lastSyncDurationMs / 1000).toFixed(1)}s</span>}
          </div>
          {!source.credentials?.configured && source.type === "aggregator" && (
            <p className="text-xs font-medium text-rose-500">Credential not configured</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => onToggle(source)}
            disabled={busy}
          >
            <Power className="mr-1.5 h-3.5 w-3.5" />
            {source.enabled ? "Disable" : "Enable"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => onSync(source)}
            disabled={running || !source.enabled}
          >
            {running ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Sync
          </Button>
          <Button size="sm" className="rounded-xl" onClick={() => onManage(source)} disabled={busy}>
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            Manage
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
