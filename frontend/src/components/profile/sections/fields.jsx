export function InputField({ label, name, value, onChange, onBlur, error, icon: Icon, type = "text", placeholder, optional }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {optional && <span className="text-muted-foreground font-normal">(optional)</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />}
        {type === "textarea" ? (
          <textarea name={name} value={value} onChange={onChange} onBlur={onBlur} rows={3} placeholder={placeholder}
            className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] resize-none ${Icon ? "pl-11" : ""} ${error ? "border-red-400" : "border-input"}`}
          />
        ) : (
          <input type={type} name={name} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder}
            className={`w-full rounded-xl border bg-background text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] ${Icon ? "pl-11 py-3 pr-4" : "px-4 py-3"} ${error ? "border-red-400" : "border-input"}`}
          />
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function SelectField({ label, name, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <select name={name} value={value} onChange={onChange}
        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] appearance-none"
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
        ))}
      </select>
    </div>
  )
}

export function IconButton({ label, onClick, icon: Icon, tone = "default" }) {
  const tones = {
    default: "text-muted-foreground hover:text-foreground hover:bg-muted",
    danger: "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30",
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${tones[tone]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

export function ToggleField({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-input bg-background/50 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, ctaLabel, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed border-input bg-background/50 py-12 px-6">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {ctaLabel && (
        <button
          type="button"
          onClick={onCta}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}

export function SectionHeader({ title, description, onSave, saving }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      )}
    </div>
  )
}
