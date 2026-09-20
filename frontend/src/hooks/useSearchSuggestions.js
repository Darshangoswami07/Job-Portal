import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useDebounce } from "./useDebounce";
import { getSearchSuggestions } from "@/api/jobsApi";

const isAbort = (err) =>
  axios.isCancel?.(err) || err?.name === "CanceledError" || err?.code === "ERR_CANCELED";

const MIN_LEN = 2;

/**
 * Debounced, aborted autocomplete for the job search box. Never calls the API
 * on every keystroke: the value is debounced (250ms) and only queried when it
 * is >= 2 chars and the dropdown is `enabled` (input focused / open).
 *
 * `loading` is derived (resolved term !== current term) so the effect never
 * calls setState synchronously.
 */
export default function useSearchSuggestions(query = "", enabled = true) {
  const debounced = useDebounce(query.trim(), 250);
  const [resolved, setResolved] = useState({ term: "", suggestions: [] });
  const abortRef = useRef(null);
  const active = enabled && debounced.length >= MIN_LEN;

  useEffect(() => {
    if (!active) return undefined;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    getSearchSuggestions(debounced, { signal: controller.signal })
      .then((res) => {
        setResolved({
          term: debounced,
          suggestions: Array.isArray(res.data?.suggestions) ? res.data.suggestions : [],
        });
      })
      .catch((err) => {
        if (!isAbort(err)) setResolved({ term: debounced, suggestions: [] });
      });

    return () => controller.abort();
  }, [active, debounced]);

  const fresh = active && resolved.term === debounced;
  return {
    suggestions: fresh ? resolved.suggestions : [],
    loading: active && !fresh,
  };
}
