import { useState, useRef } from "react"
import { FolderKanban, Plus, Trash2, ExternalLink, Github, ImageOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { SectionHeader, EmptyState, InputField } from "./fields"
import { uploadProjectThumbnail } from "@/services/advancedProfile.api"

const blankItem = () => ({ title: "", description: "", techStack: "", liveUrl: "", repoUrl: "", thumbnailUrl: "" })

const isValidHttpsUrl = (value) => !value || /^https:\/\/\S+/i.test(value.trim())

const validateItems = (items) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item.title.trim()) return { index: i, message: "Project title is required" }
    if (!isValidHttpsUrl(item.liveUrl)) return { index: i, message: "Live URL must start with https://" }
    if (!isValidHttpsUrl(item.repoUrl)) return { index: i, message: "Repo URL must start with https://" }
  }
  return null
}

function ProjectCard({ project }) {
  const techStack = Array.isArray(project.techStack) ? project.techStack : []
  return (
    <div className="rounded-xl border border-input bg-background/50 overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
      <div className="h-36 bg-muted flex items-center justify-center overflow-hidden">
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-foreground truncate">{project.title}</p>
        {project.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {techStack.map((tech) => (
              <span key={tech} className="text-[10px] font-medium rounded-full bg-primary/10 text-primary px-2 py-0.5">{tech}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 mt-3">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open live site for ${project.title}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            ><ExternalLink className="h-4 w-4" /></a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open repository for ${project.title}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            ><Github className="h-4 w-4" /></a>
          )}
        </div>
      </div>
    </div>
  )
}

function EditableItem({ item, onChange, onRemove }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleThumbnailChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be 5MB or smaller"); return }
    setUploading(true)
    try {
      const res = await uploadProjectThumbnail(file)
      if (res.success) onChange({ ...item, thumbnailUrl: res.url })
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl border border-input bg-background/50 p-4 relative">
      <button type="button" onClick={onRemove} aria-label="Remove project"
        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200"
      ><Trash2 className="h-3 w-3" /></button>

      <div className="flex items-center gap-3 mb-3">
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="h-16 w-24 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden cursor-pointer border border-dashed border-input"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-muted-foreground text-center px-1">Add thumbnail</span>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
        <p className="text-xs text-muted-foreground">Click the thumbnail to upload an image (max 5MB).</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Title" value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} placeholder="Project name" />
        <InputField label="Tech Stack" value={item.techStack} onChange={(e) => onChange({ ...item, techStack: e.target.value })} placeholder="React, Node.js, MongoDB" optional />
        <InputField label="Live URL" value={item.liveUrl} onChange={(e) => onChange({ ...item, liveUrl: e.target.value })} placeholder="https://..." optional />
        <InputField label="Repo URL" value={item.repoUrl} onChange={(e) => onChange({ ...item, repoUrl: e.target.value })} placeholder="https://github.com/..." optional />
      </div>
      <div className="mt-3">
        <InputField label="Description" type="textarea" value={item.description} onChange={(e) => onChange({ ...item, description: e.target.value })} placeholder="What does this project do?" optional />
      </div>
    </div>
  )
}

const toDraftItem = (project) => ({
  ...project,
  techStack: Array.isArray(project.techStack) ? project.techStack.join(", ") : "",
})

const toPayloadItem = (draftItem) => ({
  ...draftItem,
  techStack: draftItem.techStack.split(",").map((t) => t.trim()).filter(Boolean),
})

export default function ProjectsSection({ projects, onSave, saving }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState([])

  const startEditing = () => { setDraft(projects.map(toDraftItem)); setEditing(true) }

  const handleSave = async () => {
    const error = validateItems(draft)
    if (error) { toast.error(error.message); return }
    const result = await onSave(draft.map(toPayloadItem))
    if (result?.success) setEditing(false)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Projects"
        description="Showcase your work with links and a thumbnail."
        onSave={editing ? handleSave : undefined}
        saving={saving}
      />

      {!editing && (
        <div className="flex justify-end -mt-4">
          <button type="button" onClick={startEditing} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            {projects.length > 0 ? "Edit projects" : "Add a project"}
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
            <Plus className="h-3.5 w-3.5" /> Add Project
          </button>
          <div>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project, i) => <ProjectCard key={i} project={project} />)}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Showcase your work — add a project with a thumbnail and links."
          ctaLabel="Add Project"
          onCta={startEditing}
        />
      )}
    </div>
  )
}
