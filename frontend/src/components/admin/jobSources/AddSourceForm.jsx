import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdapterCatalog } from "@/hooks/useJobSources";
import { createJobSource, getSourceCapabilities } from "@/api/adminJobSourcesApi";

const AVAILABILITY_LABEL = {
  "requires-partnership": "Requires partnership / commercial agreement",
  "not-verified": "Not verified for permitted bulk retrieval",
};

const SCHEDULE_PRESETS = [
  { label: "Every 15 minutes", cron: "*/15 * * * *" },
  { label: "Every 30 minutes", cron: "*/30 * * * *" },
  { label: "Hourly", cron: "0 * * * *" },
  { label: "Every 6 hours", cron: "0 */6 * * *" },
  { label: "Daily (03:00 UTC)", cron: "0 3 * * *" },
  { label: "Custom…", cron: "__custom__" },
];

const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

const Field = ({ label, hint, children }) => (
  <label className="block text-sm">
    <span className="mb-1 block text-xs font-medium text-muted-foreground">
      {label}
      {hint && <span className="ml-1 text-muted-foreground/70">{hint}</span>}
    </span>
    {children}
  </label>
);

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

export default function AddSourceForm({ onClose, onCreated }) {
  const { adapters, loading } = useAdapterCatalog();

  const [name, setName] = useState("");
  const [adapter, setAdapter] = useState("");
  const [key, setKey] = useState("");
  const [config, setConfig] = useState({});
  const [credentialRef, setCredentialRef] = useState("");
  const [preset, setPreset] = useState("0 */6 * * *");
  const [customCron, setCustomCron] = useState("");
  const [rateLimitPerMin, setRateLimitPerMin] = useState(30);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState([]);

  useEffect(() => {
    let alive = true;
    getSourceCapabilities()
      .then((res) => {
        if (!alive) return;
        const rows = res.data?.data?.sources || [];
        setUnavailable(rows.filter((s) => s.availability !== "implemented"));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const spec = useMemo(() => adapters.find((a) => a.adapter === adapter), [adapters, adapter]);

  const onAdapterChange = (value) => {
    setAdapter(value);
    setConfig({});
    setCredentialRef("");
    if (name) setKey(`${value}:${slug(name)}`);
  };
  const onNameChange = (value) => {
    setName(value);
    if (adapter) setKey(`${adapter}:${slug(value)}`);
  };

  const schedule = preset === "__custom__" ? customCron.trim() : preset;

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !adapter || !key.trim()) {
      toast.error("Name, adapter and key are required");
      return;
    }
    setBusy(true);
    try {
      const body = {
        key: key.trim(),
        name: name.trim(),
        adapter,
        type: spec?.type || "aggregator",
        enabled,
        schedule,
        rateLimitPerMin: Number(rateLimitPerMin) || 30,
        config: { ...config },
      };
      if (credentialRef.trim()) body.credentialRef = credentialRef.trim();
      const res = await createJobSource(body);
      toast.success("Source created successfully");
      onCreated?.(res.data?.data?.source);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create source");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Add Job Source</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading adapters…
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Source name">
              <input className={inputCls} value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Acme (Greenhouse)" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Adapter">
                <select className={inputCls} value={adapter} onChange={(e) => onAdapterChange(e.target.value)}>
                  <option value="">Select an adapter…</option>
                  {adapters.map((a) => (
                    <option key={a.adapter} value={a.adapter}>
                      {a.adapter} ({a.type})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Key" hint="(auto)">
                <input className={`${inputCls} font-mono`} value={key} onChange={(e) => setKey(e.target.value)} placeholder="greenhouse:acme" />
              </Field>
            </div>

            {spec?.configFields?.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Adapter configuration</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {spec.configFields.map((f) => (
                    <Field key={f.key} label={f.label} hint={f.required ? "*" : ""}>
                      <input
                        className={`${inputCls} ${f.secret ? "font-mono" : ""}`}
                        value={config[f.key] ?? ""}
                        onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                      />
                    </Field>
                  ))}
                </div>
                {spec.configFields.some((f) => f.secret) && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Secret-backed fields take an environment variable <em>name</em>, never the value itself.
                  </p>
                )}
              </div>
            )}

            {spec?.needsCredential && (
              <Field label="Credential env-var name" hint="(optional — the *Ref fields above usually cover this)">
                <input className={`${inputCls} font-mono`} value={credentialRef} onChange={(e) => setCredentialRef(e.target.value)} placeholder="e.g. ADZUNA_APP_KEY" />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Schedule">
                <select className={inputCls} value={preset} onChange={(e) => setPreset(e.target.value)}>
                  {SCHEDULE_PRESETS.map((p) => (
                    <option key={p.cron} value={p.cron}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {preset === "__custom__" && (
                  <input
                    className={`${inputCls} mt-2 font-mono`}
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    placeholder="min hour dom mon dow"
                  />
                )}
              </Field>
              <Field label="Rate limit / min">
                <input type="number" min={0} max={1000} className={inputCls} value={rateLimitPerMin} onChange={(e) => setRateLimitPerMin(e.target.value)} />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <span className="text-foreground">Enable immediately</span>
              <span className="text-xs text-muted-foreground">(off = create, then sync manually)</span>
            </label>

            {unavailable.length > 0 && (
              <details className="rounded-xl border border-border/60 bg-background/50 p-3 text-xs">
                <summary className="cursor-pointer font-semibold text-muted-foreground">
                  {unavailable.length} sources evaluated but not available for direct integration
                </summary>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {unavailable.map((s) => (
                    <li key={s.key}>
                      <span className="font-medium text-foreground">{s.name}</span> —{" "}
                      {AVAILABILITY_LABEL[s.availability] || s.availability}
                      {s.reason ? `: ${s.reason}` : ""}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={busy}>
                {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                Create source
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
