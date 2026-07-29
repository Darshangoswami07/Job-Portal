import { useState, useRef } from "react"
import { useSelector } from "react-redux"
import { Award, Plus, Trash2, ExternalLink, Loader2, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { SectionHeader, EmptyState, InputField } from "./fields"
import { uploadCertificateFile, assetViewUrl } from "@/services/advancedProfile.api"

const blankItem = () => ({ name: "", issuingOrg: "", issueDate: "", credentialUrl: "", certificateFileUrl: "" })

const isValidHttpsUrl = (value) => !value || /^https:\/\/\S+/i.test(value.trim())

const validateItems = (items) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item.name.trim()) return { index: i, message: "Certification name is required" }
    if (!isValidHttpsUrl(item.credentialUrl)) return { index: i, message: "Credential URL must start with https://" }
  }
  return null
}

const formatDate = (date) => {
  if (!date) return null
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short" })
}

function CertificationRow({ cert, token }) {
  const viewHref = cert.certificateFileUrl
    ? assetViewUrl(cert.certificateFileUrl, { filename: cert.name, token })
    : cert.credentialUrl || null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-input bg-background/50 p-4 transition-all hover:border-primary/40 hover:shadow-md">
      <div className="h-11 w-11 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
        <Award className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{cert.name}</p>
        <p className="text-xs text-muted-foreground">
          {[cert.issuingOrg, formatDate(cert.issueDate)].filter(Boolean).join(" · ")}
        </p>
      </div>
      {viewHref && (
        <a href={viewHref} target="_blank" rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View credential
        </a>
      )}
    </div>
  )
}

function EditableItem({ item, onChange, onRemove }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) { toast.error("Please upload a PDF or image"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be 5MB or smaller"); return }
    setUploading(true)
    try {
      const res = await uploadCertificateFile(file)
      if (res.success) onChange({ ...item, certificateFileUrl: res.url })
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl border border-input bg-background/50 p-4 relative">
      <button type="button" onClick={onRemove} aria-label="Remove certification"
        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200"
      ><Trash2 className="h-3 w-3" /></button>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Certification Name" value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} placeholder="AWS Certified Solutions Architect" />
        <InputField label="Issuing Organization" value={item.issuingOrg} onChange={(e) => onChange({ ...item, issuingOrg: e.target.value })} placeholder="Amazon Web Services" optional />
        <InputField label="Issue Date" type="date" value={item.issueDate} onChange={(e) => onChange({ ...item, issueDate: e.target.value })} optional />
        <InputField label="Credential URL" value={item.credentialUrl} onChange={(e) => onChange({ ...item, credentialUrl: e.target.value })} placeholder="https://..." optional />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={() => !uploading && fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-input px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary transition-colors"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
          {item.certificateFileUrl ? "Replace certificate file" : "Attach certificate file"}
        </button>
        <input ref={fileInputRef} type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="hidden" />
        {item.certificateFileUrl && <span className="text-xs text-muted-foreground">File attached</span>}
      </div>
    </div>
  )
}

export default function CertificationsSection({ certifications, onSave, saving }) {
  const { token } = useSelector((store) => store.auth)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState([])

  const startEditing = () => { setDraft(certifications.map((item) => ({ ...item }))); setEditing(true) }

  const handleSave = async () => {
    const error = validateItems(draft)
    if (error) { toast.error(error.message); return }
    const result = await onSave(draft)
    if (result?.success) setEditing(false)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Certifications"
        description="Credentials and certificates you've earned."
        onSave={editing ? handleSave : undefined}
        saving={saving}
      />

      {!editing && (
        <div className="flex justify-end -mt-4">
          <button type="button" onClick={startEditing} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            {certifications.length > 0 ? "Edit certifications" : "Add certification"}
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
            <Plus className="h-3.5 w-3.5" /> Add Certification
          </button>
          <div>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : certifications.length > 0 ? (
        <div className="space-y-2">
          {certifications.map((cert, i) => <CertificationRow key={i} cert={cert} token={token} />)}
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No certifications yet"
          description="Add certifications to highlight your credentials."
          ctaLabel="Add Certification"
          onCta={startEditing}
        />
      )}
    </div>
  )
}
