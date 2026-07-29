import { useState } from "react"
import { FileText } from "lucide-react"
import { SectionHeader, EmptyState } from "./fields"

const MAX_SUMMARY_LENGTH = 1000

export default function AboutSection({ summary, onSave, saving }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(summary || "")

  const startEditing = () => { setDraft(summary || ""); setEditing(true) }

  const handleSave = async () => {
    const result = await onSave(draft.trim())
    if (result?.success) setEditing(false)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="About"
        description="A short summary recruiters see at the top of your profile."
        onSave={editing ? handleSave : undefined}
        saving={saving}
      />

      {!editing && (
        <div className="flex justify-end -mt-4">
          <button
            type="button"
            onClick={startEditing}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {summary ? "Edit summary" : "Add summary"}
          </button>
        </div>
      )}

      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_SUMMARY_LENGTH))}
            rows={6}
            placeholder="Write 2-3 paragraphs about your background, what you're looking for, and what makes you stand out..."
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] resize-none"
          />
          <div className="flex items-center justify-between mt-1.5">
            <button type="button" onClick={() => { setEditing(false); setDraft(summary || "") }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <span className="text-xs text-muted-foreground">{draft.length}/{MAX_SUMMARY_LENGTH}</span>
          </div>
        </div>
      ) : summary ? (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed rounded-xl border border-input bg-background/50 p-4">
          {summary}
        </p>
      ) : (
        <EmptyState
          icon={FileText}
          title="No summary yet"
          description="Add a short summary so recruiters get a quick sense of who you are."
          ctaLabel="Add Summary"
          onCta={startEditing}
        />
      )}
    </div>
  )
}
