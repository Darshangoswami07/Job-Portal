import { useState } from "react"
import { Sparkles, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { SectionHeader, EmptyState } from "./fields"

const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Expert"]
const PROFICIENCY_DOTS = { Beginner: 1, Intermediate: 2, Expert: 3 }
const PROFICIENCY_COLORS = {
  Beginner: "bg-amber-400",
  Intermediate: "bg-blue-500",
  Expert: "bg-green-500",
}

function ProficiencyDots({ level }) {
  const filled = PROFICIENCY_DOTS[level] || 1
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${level} proficiency`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= filled ? PROFICIENCY_COLORS[level] : "bg-muted"}`} />
      ))}
    </span>
  )
}

function SkillTag({ name, proficiency, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-input bg-background/50 pl-3 pr-2 py-1.5 text-sm hover:border-primary/40 hover:shadow-sm transition-all">
      <span className="text-foreground font-medium">{name}</span>
      <ProficiencyDots level={proficiency} />
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${name}`}
          className="h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}

export default function SkillsSection({ skills, onSave, saving }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState([])
  const [name, setName] = useState("")
  const [proficiency, setProficiency] = useState("Intermediate")

  const startEditing = () => { setDraft(skills.map((s) => ({ ...s }))); setEditing(true) }

  const addSkill = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (draft.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("That skill is already in your list")
      return
    }
    setDraft((prev) => [...prev, { name: trimmed, proficiency }])
    setName("")
  }

  const handleSave = async () => {
    const result = await onSave(draft)
    if (result?.success) setEditing(false)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Skills"
        description="Technical and professional skills, with your proficiency level."
        onSave={editing ? handleSave : undefined}
        saving={saving}
      />

      {!editing && (
        <div className="flex justify-end -mt-4">
          <button type="button" onClick={startEditing} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            {skills.length > 0 ? "Edit skills" : "Add skills"}
          </button>
        </div>
      )}

      {editing ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {draft.map((s, i) => (
              <SkillTag key={`${s.name}-${i}`} name={s.name} proficiency={s.proficiency}
                onRemove={() => setDraft((prev) => prev.filter((_, idx) => idx !== i))}
              />
            ))}
            {draft.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet.</p>}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-foreground mb-1">Skill</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }}
                placeholder="e.g. React"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Proficiency</label>
              <select value={proficiency} onChange={(e) => setProficiency(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                {PROFICIENCY_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
            <button type="button" onClick={addSkill}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((s, i) => <SkillTag key={`${s.name}-${i}`} name={s.name} proficiency={s.proficiency} />)}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No skills yet"
          description="Add skills with a proficiency level so recruiters know your strengths."
          ctaLabel="Add Skills"
          onCta={startEditing}
        />
      )}
    </div>
  )
}
