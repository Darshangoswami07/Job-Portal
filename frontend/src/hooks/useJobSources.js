import { useCallback, useEffect, useRef, useState } from "react";
import {
  listJobSources,
  getJobSource,
  getJobSourceSyncRuns,
  getAdapterCatalog,
  getAuditLog,
  getJobSourceHealth,
} from "@/api/adminJobSourcesApi";

/** List of job sources + a manual `refresh()`. */
export function useJobSources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listJobSources();
      setSources(res.data?.data?.sources || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load job sources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sources, loading, error, refresh, setSources };
}

/** One source's detail + warnings. */
export function useJobSource(id) {
  const [source, setSource] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getJobSource(id);
      setSource(res.data?.data?.source || null);
      setWarnings(res.data?.data?.warnings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load source");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { source, warnings, loading, error, refresh };
}

/** Paginated sync-run history for one source. */
export function useJobSourceSyncRuns(id, page = 1, limit = 10) {
  const [runs, setRuns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getJobSourceSyncRuns(id, { page, limit });
      setRuns(res.data?.data?.runs || []);
      setPagination(res.data?.data?.pagination || { page, limit, total: 0, totalPages: 0 });
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [id, page, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { runs, pagination, loading, refresh };
}

/** Registered adapters + their config field descriptors (for "Add Source"). */
export function useAdapterCatalog() {
  const [adapters, setAdapters] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    getAdapterCatalog()
      .then((res) => alive && setAdapters(res.data?.data?.adapters || []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  return { adapters, loading };
}

/** Paginated admin audit log with optional filters. */
export function useAdminAudit({ page = 1, limit = 15, action = "", targetKey = "" } = {}) {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (action) params.action = action;
      if (targetKey) params.targetKey = targetKey;
      const res = await getAuditLog(params);
      setEntries(res.data?.data?.entries || []);
      setPagination(res.data?.data?.pagination || { page, limit, total: 0, totalPages: 0 });
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, action, targetKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, pagination, loading, refresh };
}

/**
 * Bounded polling of a source's live sync state. Call `begin()` right after a
 * "Sync now" request; it polls health until the run leaves "running", then
 * calls `onDone` and stops. Also stops after ~2 minutes.
 */
export function useSyncPoll({ onDone } = {}) {
  const [pollingId, setPollingId] = useState(null);
  const timer = useRef(null);
  const stopped = useRef(false);

  const stop = useCallback(() => {
    stopped.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPollingId(null);
  }, []);

  const begin = useCallback(
    (sourceId) => {
      stopped.current = false;
      setPollingId(sourceId);
      const start = Date.now();
      let attempts = 0;

      const poll = async () => {
        if (stopped.current) return;
        attempts += 1;
        try {
          const res = await getJobSourceHealth(sourceId);
          const d = res.data?.data || {};
          if (!d.running || attempts > 40 || Date.now() - start > 120000) {
            stop();
            onDone?.(d);
            return;
          }
        } catch {
          stop();
          return;
        }
        timer.current = setTimeout(poll, 3000);
      };
      timer.current = setTimeout(poll, 1500);
    },
    [onDone, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { begin, stop, pollingId };
}
