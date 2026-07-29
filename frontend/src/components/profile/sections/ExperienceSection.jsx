import { useState } from "react"
import { Briefcase, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { SectionHeader, EmptyState, InputField } from "./fields"

const blankItem = () => ({ title: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" })

const formatMonthYear = (value) => {
  if (!value) return "Present"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Present"
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short" })
}

const validateItems = (items) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item.title.trim()) return { index: i, message: "Title is required" }
    if (!item.company.trim()) return { index: i, message: "Company is required" }
    if (!item.isCurrent && item.startDate && item.endDate && item.endDate < item.startDate) {
      return { index: i, message: "End date can't be before start date" }
    }
  }
  return null
}

function TimelineView({ items }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="relative pl-8 pb-6 last:pb-0">
          {i < items.length - 1 && <span className="absolute left-[7px] top-3 bottom-0 w-px bg-border" />}
          <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-primary/15" />
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          <p className="text-sm text-muted-foreground">
            {item.company}{item.location ? ` · ${item.location}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatMonthYear(item.startDate)} - {item.isCurrent ? "Present" : formatMonthYear(item.endDate)}
          </p>
          {item.description && <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{item.description}</p>}
        </div>
      ))}
    </div>
  )
}

function EditableItem({ item, onChange, onRemove }) {
  return (
    <div className="rounded-xl border border-input bg-background/50 p-4 relative">
      <button type="button" onClick={onRemove} aria-label="Remove experience entry"
        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200"
      ><Trash2 className="h-3 w-3" /></button>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Title" value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} placeholder="Job title" />
        <InputField label="Company" value={item.company} onChange={(e) => onChange({ ...item, company: e.target.value })} placeholder="Company name" />
        <InputField label="Location" value={item.location} onChange={(e) => onChange({ ...item, location: e.target.value })} placeholder="City, Country" optional />
        <div />
        <InputField label="Start Date" type="date" value={item.startDate} onChange={(e) => onChange({ ...item, startDate: e.target.value })} />
        <InputField label="End Date" type="date" value={item.isCurrent ? "" : item.endDate} onChange={(e) => onChange({ ...item, endDate: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
        <input type="checkbox" checked={item.isCurrent} onChange={(e) => onChange({ ...item, isCurrent: e.target.checked, endDate: e.target.checked ? "" : item.endDate })}
          className="rounded border-input h-4 w-4 text-primary focus:ring-primary"
        /> I currently work here
      </label>
      <textarea value={item.description} onChange={(e) => onChange({ ...item, description: e.target.value })}
        rows={2} placeholder="Brief description of your role..."
        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
      />
    </div>
  )
}

export default function ExperienceSection({ experience, onSave, saving }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState([])

  const startEditing = () => { setDraft(experience.map((item) => ({ ...item }))); setEditing(true) }

  const handleSave = async () => {
    const error = validateItems(draft)
    if (error) { toast.error(error.message); return }
    const result = await onSave(draft)
    if (result?.success) setEditing(false)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Experience"
        description="Your work history, most recent first."
        onSave={editing ? handleSave : undefined}
        saving={saving}
      />

      {!editing && (
        <div className="flex justify-end -mt-4">
          <button type="button" onClick={startEditing} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            {experience.length > 0 ? "Edit experience" : "Add experience"}
          </button>
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          {draft.map((item, i) => (
            <EditableItem
              key={i}
              item={item}
              onChange={(next) => setDraft((prev) => prev.map((p, idx) => (idx === i ? next : p)))}
              onRemove={() => setDraft((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
          <button type="button" onClick={() => setDraft((prev) => [...prev, blankItem()])}
            className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Experience
          </button>
          <div>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : experience.length > 0 ? (
        <TimelineView items={experience} />
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No experience yet"
          description="Add your work history so recruiters can see your background."
          ctaLabel="Add Experience"
          onCta={startEditing}
        />
      )}
    </div>
  )
}
