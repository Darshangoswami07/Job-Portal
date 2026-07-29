import { useState } from "react"
import { GraduationCap, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { SectionHeader, EmptyState, InputField } from "./fields"

const blankItem = () => ({ institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "", grade: "" })

const validateItems = (items) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item.institution.trim()) return { index: i, message: "Institution is required" }
    if (!item.degree.trim()) return { index: i, message: "Degree is required" }
    if (item.startYear && item.endYear && Number(item.endYear) < Number(item.startYear)) {
      return { index: i, message: "End year can't be before start year" }
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
          <p className="text-sm font-semibold text-foreground">{item.institution}</p>
          <p className="text-sm text-muted-foreground">
            {item.degree}{item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.startYear || "?"} - {item.endYear || "Present"}{item.grade ? ` · ${item.grade}` : ""}
          </p>
        </div>
      ))}
    </div>
  )
}

function EditableItem({ item, onChange, onRemove }) {
  return (
    <div className="rounded-xl border border-input bg-background/50 p-4 relative">
      <button type="button" onClick={onRemove} aria-label="Remove education entry"
        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200"
      ><Trash2 className="h-3 w-3" /></button>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Institution" value={item.institution} onChange={(e) => onChange({ ...item, institution: e.target.value })} placeholder="University name" />
        <InputField label="Degree" value={item.degree} onChange={(e) => onChange({ ...item, degree: e.target.value })} placeholder="B.S. Computer Science" />
        <InputField label="Field of Study" value={item.fieldOfStudy} onChange={(e) => onChange({ ...item, fieldOfStudy: e.target.value })} placeholder="Computer Science" optional />
        <InputField label="Grade" value={item.grade} onChange={(e) => onChange({ ...item, grade: e.target.value })} placeholder="GPA / Percentage" optional />
        <InputField label="Start Year" type="number" value={item.startYear} onChange={(e) => onChange({ ...item, startYear: e.target.value })} placeholder="2018" />
        <InputField label="End Year" type="number" value={item.endYear} onChange={(e) => onChange({ ...item, endYear: e.target.value })} placeholder="2022" optional />
      </div>
    </div>
  )
}

export default function EducationSection({ education, onSave, saving }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState([])

  const startEditing = () => { setDraft(education.map((item) => ({ ...item }))); setEditing(true) }

  const handleSave = async () => {
    const error = validateItems(draft)
    if (error) { toast.error(error.message); return }
    const result = await onSave(draft)
    if (result?.success) setEditing(false)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Education"
        description="Your academic background."
        onSave={editing ? handleSave : undefined}
        saving={saving}
      />

      {!editing && (
        <div className="flex justify-end -mt-4">
          <button type="button" onClick={startEditing} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            {education.length > 0 ? "Edit education" : "Add education"}
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
            <Plus className="h-3.5 w-3.5" /> Add Education
          </button>
          <div>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : education.length > 0 ? (
        <TimelineView items={education} />
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No education yet"
          description="Add your academic background."
          ctaLabel="Add Education"
          onCta={startEditing}
        />
      )}
    </div>
  )
}
