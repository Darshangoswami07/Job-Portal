import { useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAdminAudit } from "@/hooks/useJobSources";

const ACTION_LABEL = {
  "job-source.create": "created source",
  "job-source.update": "updated configuration for",
  "job-source.enable": "enabled",
  "job-source.disable": "disabled",
  "job-source.sync": "triggered sync for",
  "job-source.verify-links": "triggered link verification for",
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function AdminActivityPanel({ compact = false }) {
  const [page, setPage] = useState(1);
  const { entries, pagination, loading, refresh } = useAdminAudit({ page, limit: compact ? 6 : 15 });

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <History className="h-4 w-4" /> Recent admin activity
        </h3>
        <button onClick={refresh} className="text-muted-foreground hover:text-foreground" aria-label="Refresh">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{loading ? "Loading…" : "No activity yet."}</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={String(e.id)} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
              <span className="font-medium text-foreground">{e.actor?.name || e.actor?.email || "An admin"}</span>
              <span className="text-muted-foreground">{ACTION_LABEL[e.action] || e.action}</span>
              {e.targetKey && <span className="font-mono text-xs text-foreground">{e.targetKey}</span>}
              <span className="text-xs text-muted-foreground">· {timeAgo(e.at)}</span>
            </li>
          ))}
        </ul>
      )}

      {!compact && pagination.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-lg" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
