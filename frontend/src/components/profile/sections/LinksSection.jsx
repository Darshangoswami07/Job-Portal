import { useState, useEffect } from "react"
import { Link as LinkIcon, Linkedin, Twitter, Globe, Github as GithubIcon } from "lucide-react"
import { SectionHeader, InputField } from "./fields"

const isValidHttpsUrl = (value) => !value || /^https:\/\/\S+/i.test(value.trim())
const isValidTwitterUrl = (value) => !value || /^https:\/\/(www\.)?(twitter|x)\.com\/\S+/i.test(value.trim())

export default function LinksSection({
  portfolio, github, formErrors, onLegacyChange,
  socialLinks, onSave, saving,
}) {
  const [draft, setDraft] = useState(socialLinks)
  const [errors, setErrors] = useState({})

  useEffect(() => { setDraft(socialLinks) }, [socialLinks])

  const validateField = (name, value) => {
    let message = ""
    if (name === "linkedin" && value && !/^https:\/\/(www\.)?linkedin\.com\/\S+/i.test(value.trim())) message = "Must be a linkedin.com URL"
    if (name === "twitter" && !isValidTwitterUrl(value)) message = "Must be a twitter.com or x.com URL"
    if (name === "website" && !isValidHttpsUrl(value)) message = "Must start with https://"
    setErrors((prev) => ({ ...prev, [name]: message }))
  }

  const handleSave = async () => {
    if (Object.values(errors).some(Boolean)) return
    await onSave(draft)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-foreground">Links</h3>
        <p className="text-sm text-muted-foreground mt-1">Where recruiters can find more of your work.</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Portfolio &amp; GitHub</h4>
        <div className="grid gap-5 sm:grid-cols-2">
          <InputField
            label="Portfolio URL" name="portfolio" value={portfolio}
            onChange={onLegacyChange} icon={LinkIcon} placeholder="https://..." error={formErrors?.portfolio} optional
          />
          <InputField
            label="GitHub URL" name="github" value={github}
            onChange={onLegacyChange} icon={GithubIcon} placeholder="https://github.com/..." error={formErrors?.github} optional
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Saved with the main "Save Changes" button.</p>
      </div>

      <div className="pt-2 border-t border-border">
        <SectionHeader title="Social Links" description="LinkedIn, X/Twitter, and personal website." onSave={handleSave} saving={saving} />
        <div className="grid gap-5 sm:grid-cols-2 mt-4">
          <InputField
            label="LinkedIn" value={draft.linkedin} icon={Linkedin} placeholder="https://linkedin.com/in/..."
            error={errors.linkedin} optional
            onChange={(e) => setDraft((prev) => ({ ...prev, linkedin: e.target.value }))}
            onBlur={(e) => validateField("linkedin", e.target.value)}
          />
          <InputField
            label="Twitter / X" value={draft.twitter} icon={Twitter} placeholder="https://x.com/..."
            error={errors.twitter} optional
            onChange={(e) => setDraft((prev) => ({ ...prev, twitter: e.target.value }))}
            onBlur={(e) => validateField("twitter", e.target.value)}
          />
          <InputField
            label="Personal Website" value={draft.website} icon={Globe} placeholder="https://..."
            error={errors.website} optional
            onChange={(e) => setDraft((prev) => ({ ...prev, website: e.target.value }))}
            onBlur={(e) => validateField("website", e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
