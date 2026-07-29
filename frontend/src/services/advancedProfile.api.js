import axios from "axios"
import { USER_API_END_POINT } from "@/utils/constant"

// The backend validates and persists summary/experience/education/skills/
// projects/certifications/socialLinks/visibility together as one document,
// so a per-section "Save" button still sends the full advanced-profile
// shape — only the just-edited section's values actually change.
export const saveAdvancedProfile = async (sections) => {
  const res = await axios.put(`${USER_API_END_POINT}/profile`, sections, { withCredentials: true })
  return res.data
}

export const uploadProjectThumbnail = async (file) => {
  const formData = new FormData()
  formData.append("thumbnail", file)
  const res = await axios.post(`${USER_API_END_POINT}/uploads/project-thumbnail`, formData, { withCredentials: true })
  return res.data
}

export const uploadCertificateFile = async (file) => {
  const formData = new FormData()
  formData.append("certificate", file)
  const res = await axios.post(`${USER_API_END_POINT}/uploads/certificate`, formData, { withCredentials: true })
  return res.data
}

export const assetViewUrl = (url, { download = false, filename, token } = {}) => {
  const params = new URLSearchParams({ url })
  if (download) params.set("download", "1")
  if (filename) params.set("filename", filename)
  if (token) params.set("token", token)
  return `${USER_API_END_POINT}/uploads/view?${params.toString()}`
}

// Maps backend Zod error paths like "experience.0.endDate" to
// { 0: { endDate: "..." } } so array-item forms can look up errors by index.
export const groupErrorsByIndex = (errors, prefix) => {
  const grouped = {}
  if (!errors) return grouped
  for (const [path, message] of Object.entries(errors)) {
    const match = path.match(new RegExp(`^${prefix}\\.(\\d+)\\.(.+)$`))
    if (!match) continue
    const [, index, field] = match
    grouped[index] = grouped[index] || {}
    grouped[index][field] = message
  }
  return grouped
}
