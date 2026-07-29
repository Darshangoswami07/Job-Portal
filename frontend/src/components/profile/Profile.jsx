import React, { useState, useRef, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { motion } from "framer-motion"
import Navbar from "@/components/shared/Navbar"
import {
  User, Mail, Phone, MapPin, Globe,
  Link, Briefcase, FileText, Image as ImageIcon, Check,
  Camera, Award, BookOpen, GraduationCap, DollarSign, Clock,
  Building2, Users as UsersIcon, BadgeCheck, ChevronDown, Loader2,
  Save, AlertCircle, Sparkles, Download, Trash2, Star, Plus, FolderKanban, Eye,
} from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { updateUser } from "@/store/slices/authSlice"
import { USER_API_END_POINT } from "@/utils/constant"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { InputField, SelectField, IconButton, ToggleField } from "./sections/fields"
import { saveAdvancedProfile, groupErrorsByIndex } from "@/services/advancedProfile.api"
import AboutSection from "./sections/AboutSection"
import ExperienceSection from "./sections/ExperienceSection"
import EducationSection from "./sections/EducationSection"
import SkillsSection from "./sections/SkillsSection"
import ProjectsSection from "./sections/ProjectsSection"
import CertificationsSection from "./sections/CertificationsSection"
import LinksSection from "./sections/LinksSection"

const emptyAdvancedProfile = {
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  socialLinks: { linkedin: "", twitter: "", website: "" },
  visibility: { profileVisible: true, resumeVisible: true, showEmail: false, openToWork: false },
}

const MAX_RESUME_SIZE = 5 * 1024 * 1024
const MAX_RESUMES = 5

const isValidHttpsUrl = (value) => !value || /^https:\/\/\S+/i.test(value.trim())
const isValidGithubUrl = (value) => !value || /^https:\/\/(www\.)?github\.com\/\S+/i.test(value.trim())

const validateResumeLinks = (form) => {
  const errs = {}
  if (form.portfolio && !isValidHttpsUrl(form.portfolio)) {
    errs.portfolio = "Portfolio URL must start with https://"
  }
  if (form.github && !isValidGithubUrl(form.github)) {
    errs.github = "GitHub URL must be a github.com link"
  }
  return errs
}

const formatBytes = (bytes) => {
  if (bytes === null || bytes === undefined) return null
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const formatDate = (date) => {
  if (!date) return null
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export default function Profile() {
  const { user, token } = useSelector((store) => store.auth)
  const dispatch = useDispatch()

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    fullname: "", email: "", phoneNumber: "", bio: "", headline: "",
    dateOfBirth: "", gender: "", location: "",
    github: "", portfolio: "", preferredJobRole: "", preferredSalary: "",
    employmentType: "", workPreference: "",
    companyName: "", companyEmail: "", companyWebsite: "", designation: "",
    companySize: "", industry: "",
    noticePeriod: "", availableFrom: "",
  })

  const [roles, setRoles] = useState({ jobSeeker: false, recruiter: false })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [resumes, setResumes] = useState([])
  const [uploadingResume, setUploadingResume] = useState(false)
  const [willingToRelocate, setWillingToRelocate] = useState(false)
  const [advancedProfile, setAdvancedProfile] = useState(emptyAdvancedProfile)
  const [savingSection, setSavingSection] = useState(null)
  const photoInputRef = useRef(null)
  const resumeInputRef = useRef(null)
  const Motion = motion
  void Motion

  useEffect(() => {
    axios.get(`${USER_API_END_POINT}/profile`, { withCredentials: true })
      .then((res) => {
        if (res.data.success) dispatch(updateUser(res.data.user))
      })
      .catch(() => {})
  }, [dispatch])

  useEffect(() => {
    if (!user) return
    const p = user.profile || {}
    setForm({
      fullname: user.fullname || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      bio: p.bio || "",
      headline: p.headline || "",
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
      gender: p.gender || "",
      location: p.location || "",
      github: p.github || "",
      portfolio: p.portfolio || "",
      preferredJobRole: p.preferredJobRole || "",
      preferredSalary: p.preferredSalary || "",
      employmentType: p.employmentType || "",
      workPreference: p.workPreference || "",
      companyName: p.companyName || "",
      companyEmail: p.companyEmail || "",
      companyWebsite: p.companyWebsite || "",
      designation: p.designation || "",
      companySize: p.companySize || "",
      industry: p.industry || "",
      noticePeriod: p.noticePeriod || "",
      availableFrom: p.availableFrom ? p.availableFrom.split("T")[0] : "",
    })
    setRoles(user.roles || { jobSeeker: false, recruiter: false })
    setResumes(p.resumes || [])
    setWillingToRelocate(Boolean(p.willingToRelocate))
    setAdvancedProfile({
      summary: p.summary || "",
      experience: p.experience || [],
      education: p.education || [],
      skills: p.skills || [],
      projects: p.projects || [],
      certifications: p.certifications || [],
      socialLinks: {
        linkedin: p.socialLinks?.linkedin || "",
        twitter: p.socialLinks?.twitter || "",
        website: p.socialLinks?.website || "",
      },
      visibility: {
        profileVisible: p.visibility?.profileVisible !== false,
        resumeVisible: p.visibility?.resumeVisible !== false,
        showEmail: Boolean(p.visibility?.showEmail),
        openToWork: Boolean(p.visibility?.openToWork),
      },
    })
  }, [user])

  const changeHandler = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return }
    setProfilePhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (resumeInputRef.current) resumeInputRef.current.value = ""

    if (file.type !== "application/pdf") { toast.error("Please upload a PDF file"); return }
    if (file.size > MAX_RESUME_SIZE) { toast.error("Resume must be 5MB or smaller"); return }
    if (resumes.length >= MAX_RESUMES) { toast.error(`You can store up to ${MAX_RESUMES} resumes. Delete one first.`); return }

    const uploadData = new FormData()
    uploadData.append("resume", file)

    setUploadingResume(true)
    try {
      const res = await axios.post(`${USER_API_END_POINT}/resumes`, uploadData, { withCredentials: true })
      if (res.data.success) {
        setResumes(res.data.resumes)
        dispatch(updateUser({ profile: { ...user.profile, resumes: res.data.resumes } }))
        toast.success("Resume uploaded")
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload resume")
    } finally {
      setUploadingResume(false)
    }
  }

  const deleteResumeById = async (resumeId) => {
    try {
      const res = await axios.delete(`${USER_API_END_POINT}/resumes/${resumeId}`, { withCredentials: true })
      if (res.data.success) {
        setResumes(res.data.resumes)
        dispatch(updateUser({ profile: { ...user.profile, resumes: res.data.resumes } }))
        toast.success("Resume deleted")
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete resume")
    }
  }

  const setPrimaryResumeById = async (resumeId) => {
    try {
      const res = await axios.patch(`${USER_API_END_POINT}/resumes/${resumeId}/primary`, {}, { withCredentials: true })
      if (res.data.success) {
        setResumes(res.data.resumes)
        dispatch(updateUser({ profile: { ...user.profile, resumes: res.data.resumes } }))
        toast.success("Primary resume updated")
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update primary resume")
    }
  }

  // Backend persists summary/experience/education/skills/projects/
  // certifications/socialLinks/visibility as one document, so a per-section
  // save still sends the full advanced-profile shape with only `sectionKey`
  // changed. Optimistic: apply locally first, roll back if the API fails.
  const saveSection = async (sectionKey, value) => {
    const previous = advancedProfile
    const next = { ...advancedProfile, [sectionKey]: value }
    setAdvancedProfile(next)
    setSavingSection(sectionKey)
    try {
      const res = await saveAdvancedProfile(next)
      if (res.success) {
        dispatch(updateUser({ profile: { ...user.profile, ...res.user.profile } }))
        toast.success("Saved", { description: "All changes are saved to your account." })
        return { success: true }
      }
      setAdvancedProfile(previous)
      return { success: false }
    } catch (err) {
      setAdvancedProfile(previous)
      const data = err.response?.data
      toast.error(data?.message || "Failed to save changes")
      return { success: false, fieldErrors: groupErrorsByIndex(data?.errors, sectionKey) }
    } finally {
      setSavingSection(null)
    }
  }

  const submitHandler = async (e) => {
    e.preventDefault()

    const linkErrors = validateResumeLinks(form)
    if (Object.keys(linkErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...linkErrors }))
      setActiveTab("links")
      toast.error("Please fix the highlighted links before saving")
      return
    }

    setSaving(true)
    const formData = new FormData()
    formData.append("fullname", form.fullname)
    formData.append("email", form.email)
    formData.append("phoneNumber", form.phoneNumber)
    formData.append("bio", form.bio)
    formData.append("headline", form.headline)
    formData.append("dateOfBirth", form.dateOfBirth)
    formData.append("gender", form.gender)
    formData.append("location", form.location)
    formData.append("github", form.github)
    formData.append("portfolio", form.portfolio)
    formData.append("preferredJobRole", form.preferredJobRole)
    formData.append("preferredSalary", form.preferredSalary)
    formData.append("employmentType", form.employmentType)
    formData.append("workPreference", form.workPreference)
    formData.append("companyName", form.companyName)
    formData.append("companyEmail", form.companyEmail)
    formData.append("companyWebsite", form.companyWebsite)
    formData.append("designation", form.designation)
    formData.append("companySize", form.companySize)
    formData.append("industry", form.industry)
    formData.append("noticePeriod", form.noticePeriod)
    formData.append("availableFrom", form.availableFrom)
    formData.append("willingToRelocate", String(willingToRelocate))
    formData.append("roles", JSON.stringify(roles))
    formData.append("currentRole", roles.recruiter && !roles.jobSeeker ? "recruiter" : roles.jobSeeker ? "jobSeeker" : null)
    formData.append("profileCompleted", "true")
    if (profilePhoto instanceof File) formData.append("profilePhoto", profilePhoto)
    try {
      const res = await axios.post(`${USER_API_END_POINT}/updateprofile`, formData, { withCredentials: true })
      if (res.data.success) {
        dispatch(updateUser(res.data.user))
        toast.success("Profile saved successfully", { description: "All changes are saved to your account." })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-gray-500">Please sign in to edit your profile</p>
        </div>
      </div>
    )
  }

  const profilePhotoUrl = photoPreview || user?.profile?.profilePhoto || null

  const completedFields = [
    !!form.fullname, !!form.email, !!form.phoneNumber,
    !!form.bio, !!form.headline, !!form.location,
    !!profilePhotoUrl,
    roles.jobSeeker || roles.recruiter,
    !!advancedProfile.summary,
    advancedProfile.skills.length > 0,
    advancedProfile.experience.length > 0,
    advancedProfile.education.length > 0,
    advancedProfile.projects.length > 0,
    advancedProfile.certifications.length > 0,
    roles.jobSeeker && resumes.length > 0,
    roles.recruiter && !!form.companyName,
    roles.recruiter && !!form.designation,
  ].filter(Boolean).length

  const totalFields = 13 +
    (roles.jobSeeker ? 1 : 0) +
    (roles.recruiter ? 2 : 0)

  const completionPercent = Math.min(Math.round((completedFields / Math.max(totalFields, 1)) * 100), 100)

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "about", label: "About", icon: FileText },
    { id: "role", label: "Role & Skills", icon: Briefcase },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "skills", label: "Skills", icon: Sparkles },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "certifications", label: "Certifications", icon: Award },
    { id: "resume", label: "Resume & Portfolio", icon: FileText },
    { id: "links", label: "Links", icon: Link },
    { id: "preferences", label: "Preferences", icon: Clock },
  ]

  if (roles.recruiter) tabs.push({ id: "company", label: "Company", icon: Building2 })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border shadow-sm p-6 text-center"
            >
              <div className="relative mx-auto mb-4 h-24 w-24">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="" className="h-24 w-24 rounded-full object-cover ring-2 ring-border" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <button onClick={() => photoInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{form.fullname || "Your Name"}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{form.headline || "Add a headline"}</p>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Profile</span>
                  <span className="font-semibold text-foreground">{completionPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${completionPercent}%` }}
                    className="h-full rounded-full bg-primary transition-all duration-500"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-left">
                {[
                  { done: !!form.fullname && !!form.email, label: "Basic Information" },
                  { done: !!profilePhotoUrl, label: "Profile Photo" },
                  { done: roles.jobSeeker || roles.recruiter, label: "Select Role" },
                  { done: !roles.jobSeeker || resumes.length > 0, label: "Upload Resume" },
                  { done: !roles.jobSeeker || advancedProfile.skills.length > 0, label: "Add Skills" },
                  { done: !roles.jobSeeker || advancedProfile.experience.length > 0, label: "Add Experience" },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-2 text-xs ${item.done ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center ${item.done ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"}`}>
                      {item.done ? <Check className="h-2.5 w-2.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </motion.div>

            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary dark:text-[#2F81F7]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <form onSubmit={submitHandler} className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
              {activeTab === "personal" && <PersonalTab form={form} changeHandler={changeHandler} errors={errors} />}
              {activeTab === "about" && (
                <AboutSection
                  summary={advancedProfile.summary}
                  onSave={(value) => saveSection("summary", value)}
                  saving={savingSection === "summary"}
                />
              )}
              {activeTab === "role" && (
                <RoleTab form={form} changeHandler={changeHandler} roles={roles} setRoles={setRoles} />
              )}
              {activeTab === "experience" && (
                <ExperienceSection
                  experience={advancedProfile.experience}
                  onSave={(value) => saveSection("experience", value)}
                  saving={savingSection === "experience"}
                />
              )}
              {activeTab === "education" && (
                <EducationSection
                  education={advancedProfile.education}
                  onSave={(value) => saveSection("education", value)}
                  saving={savingSection === "education"}
                />
              )}
              {activeTab === "skills" && (
                <SkillsSection
                  skills={advancedProfile.skills}
                  onSave={(value) => saveSection("skills", value)}
                  saving={savingSection === "skills"}
                />
              )}
              {activeTab === "projects" && (
                <ProjectsSection
                  projects={advancedProfile.projects}
                  onSave={(value) => saveSection("projects", value)}
                  saving={savingSection === "projects"}
                />
              )}
              {activeTab === "certifications" && (
                <CertificationsSection
                  certifications={advancedProfile.certifications}
                  onSave={(value) => saveSection("certifications", value)}
                  saving={savingSection === "certifications"}
                />
              )}
              {activeTab === "resume" && (
                <ResumeTab
                  resumes={resumes} uploadingResume={uploadingResume} token={token}
                  resumeInputRef={resumeInputRef} handleResumeChange={handleResumeChange}
                  onDeleteResume={deleteResumeById}
                  onSetPrimaryResume={setPrimaryResumeById}
                />
              )}
              {activeTab === "links" && (
                <LinksSection
                  portfolio={form.portfolio} github={form.github}
                  onLegacyChange={changeHandler} formErrors={errors}
                  socialLinks={advancedProfile.socialLinks}
                  onSave={(value) => saveSection("socialLinks", value)}
                  saving={savingSection === "socialLinks"}
                />
              )}
              {activeTab === "preferences" && (
                <PreferencesTab
                  form={form} changeHandler={changeHandler}
                  willingToRelocate={willingToRelocate} setWillingToRelocate={setWillingToRelocate}
                  visibility={advancedProfile.visibility}
                  onSaveVisibility={(value) => saveSection("visibility", value)}
                  savingVisibility={savingSection === "visibility"}
                />
              )}
              {activeTab === "company" && (
                <CompanyTab form={form} changeHandler={changeHandler} errors={errors} verificationStatus={user?.profile?.verificationStatus} />
              )}

              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  All changes are saved to your profile
                </p>
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}


function PersonalTab({ form, changeHandler, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
        <p className="text-sm text-muted-foreground mt-1">Update your personal details and contact information.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="Full Name" name="fullname" value={form.fullname} onChange={changeHandler} icon={User} error={errors.fullname} />
        <InputField label="Email" name="email" type="email" value={form.email} onChange={changeHandler} icon={Mail} error={errors.email} />
        <InputField label="Phone" name="phoneNumber" type="tel" value={form.phoneNumber} onChange={changeHandler} icon={Phone} optional />
        <InputField label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={changeHandler} optional />
        <SelectField label="Gender" name="gender" value={form.gender} onChange={changeHandler}
          options={["Male", "Female", "Other", "Prefer not to say"]} placeholder="Select gender"
        />
        <InputField label="Location" name="location" value={form.location} onChange={changeHandler} icon={MapPin} placeholder="City, Country" optional />
      </div>
      <InputField label="Headline" name="headline" value={form.headline} onChange={changeHandler} placeholder="e.g. Senior React Developer at Google" optional />
      <InputField label="Bio" name="bio" value={form.bio} onChange={changeHandler} type="textarea" placeholder="Write a short description about yourself..." optional />
      <p className="text-xs text-muted-foreground">Social links and portfolio/GitHub URLs live in the Links tab.</p>
    </div>
  )
}

function RoleTab({ form, changeHandler, roles, setRoles }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-foreground">How would you like to use JobHub?</h3>
        <p className="text-sm text-muted-foreground mt-1">You can change these preferences anytime.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => setRoles((prev) => ({ ...prev, jobSeeker: !prev.jobSeeker }))}
          className={`relative rounded-xl border-2 p-5 text-left transition-all ${
            roles.jobSeeker ? "border-primary bg-primary/5" : "border-input hover:border-muted-foreground/30"
          }`}
        >
          <div className={`absolute top-3 right-3 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
            roles.jobSeeker ? "border-primary bg-primary" : "border-muted-foreground/30"
          }`}>
            {roles.jobSeeker && <Check className="h-3 w-3 text-white" />}
          </div>
          <Briefcase className={`h-8 w-8 mb-2 ${roles.jobSeeker ? "text-primary" : "text-muted-foreground"}`} />
          <p className="font-semibold text-foreground">Job Seeker</p>
          <p className="text-sm text-muted-foreground mt-1">Find jobs, apply to positions, and grow your career.</p>
        </button>

        <button type="button" onClick={() => setRoles((prev) => ({ ...prev, recruiter: !prev.recruiter }))}
          className={`relative rounded-xl border-2 p-5 text-left transition-all ${
            roles.recruiter ? "border-primary bg-primary/5" : "border-input hover:border-muted-foreground/30"
          }`}
        >
          <div className={`absolute top-3 right-3 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
            roles.recruiter ? "border-primary bg-primary" : "border-muted-foreground/30"
          }`}>
            {roles.recruiter && <Check className="h-3 w-3 text-white" />}
          </div>
          <Building2 className={`h-8 w-8 mb-2 ${roles.recruiter ? "text-primary" : "text-muted-foreground"}`} />
          <p className="font-semibold text-foreground">Recruiter</p>
          <p className="text-sm text-muted-foreground mt-1">Post jobs, hire talent, and manage your company.</p>
        </button>
      </div>

      {roles.jobSeeker && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pt-4 border-t border-border">
          <div>
            <h4 className="font-semibold text-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" /> Job Seeker Details</h4>
            <p className="text-sm text-muted-foreground mt-0.5">Help employers find you by adding your career preferences.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <InputField label="Preferred Job Role" name="preferredJobRole" value={form.preferredJobRole} onChange={changeHandler} placeholder="e.g. Frontend Developer" optional />
            <SelectField label="Preferred Salary Range" name="preferredSalary" value={form.preferredSalary} onChange={changeHandler}
              options={["$0 - $30K", "$30K - $50K", "$50K - $80K", "$80K - $120K", "$120K - $150K", "$150K+"]}
            />
            <SelectField label="Employment Type" name="employmentType" value={form.employmentType} onChange={changeHandler}
              options={["Full-time", "Part-time", "Contract", "Internship", "Freelance"]}
            />
            <SelectField label="Work Preference" name="workPreference" value={form.workPreference} onChange={changeHandler}
              options={["Remote", "Hybrid", "On-site"]}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Manage your skills, experience, and education from their own tabs in the sidebar.
          </p>
        </motion.div>
      )}
    </div>
  )
}

function ResumePreviewModal({ open, onOpenChange, title, previewSrc, downloadHref, downloadFilename }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden sm:max-w-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="min-w-0 pr-4">
            <DialogTitle className="text-sm font-semibold truncate">{title}</DialogTitle>
            <DialogDescription className="sr-only">Resume preview</DialogDescription>
          </div>
          {downloadHref && (
            <a
              href={downloadHref}
              download={downloadFilename}
              aria-label="Download resume"
              title="Download resume"
              className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-8"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
        </div>
        <div className="h-[75vh] bg-muted/30">
          {previewSrc ? (
            <iframe src={previewSrc} title="Resume preview" className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Preview unavailable
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ResumeFileCard({ name, size, uploadedAt, isPrimary, onPreview, onDownload, onSetPrimary, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="group flex items-center gap-3 rounded-xl border border-input bg-background/50 p-4 transition-all hover:border-primary/40 hover:shadow-md"
    >
      <button
        type="button"
        onClick={onPreview || undefined}
        disabled={!onPreview}
        aria-label={onPreview ? `Preview ${name}` : name}
        className="flex min-w-0 flex-1 items-center gap-3 text-left rounded-lg outline-none disabled:cursor-default focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <div className="h-11 w-11 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {[size, uploadedAt].filter(Boolean).join(" - ")}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                isPrimary
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isPrimary ? "Primary" : "Saved"}
            </span>
          </div>
        </div>
      </button>
      <div className="flex items-center gap-1 shrink-0">
        {onPreview && <IconButton label="View resume" icon={Eye} onClick={onPreview} />}
        {onDownload && <IconButton label="Download resume" icon={Download} onClick={onDownload} />}
        {!isPrimary && onSetPrimary && (
          <IconButton label="Set as primary resume" icon={Star} onClick={onSetPrimary} />
        )}
        <IconButton label="Delete resume" icon={Trash2} tone="danger" onClick={onDelete} />
      </div>
    </motion.div>
  )
}

function ResumeDropzone({ resumeInputRef, handleResumeChange, uploading }) {
  const [dragActive, setDragActive] = useState(false)
  return (
    <div
      role="button"
      tabIndex={uploading ? -1 : 0}
      aria-disabled={uploading}
      onDragOver={(e) => { if (!uploading) { e.preventDefault(); setDragActive(true) } }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragActive(false)
        if (uploading) return
        const file = e.dataTransfer?.files?.[0]
        if (file) handleResumeChange({ target: { files: [file] } })
      }}
      onClick={() => { if (!uploading) resumeInputRef.current?.click() }}
      onKeyDown={(e) => { if (!uploading && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); resumeInputRef.current?.click() } }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
        uploading ? "cursor-wait opacity-70 border-input bg-background/50" :
        dragActive ? "border-primary bg-primary/5" : "border-input bg-background/50 hover:border-primary hover:bg-primary/5"
      }`}
    >
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
        {uploading ? (
          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
        ) : (
          <Plus className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm font-medium text-foreground">
        {uploading ? "Uploading resume..." : "Drop a resume here or click to browse"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">PDF only, max 5MB</p>
    </div>
  )
}

function ResumeTab({
  resumes, uploadingResume, token, resumeInputRef, handleResumeChange,
  onDeleteResume, onSetPrimaryResume,
}) {
  const [previewResumeId, setPreviewResumeId] = useState(null)

  const authedResumeUrl = (resumeId, extra = "") =>
    `${USER_API_END_POINT}/resumes/${resumeId}?token=${encodeURIComponent(token || "")}${extra}`

  const previewResume = resumes.find((r) => r._id === previewResumeId) || null
  const previewSrc = previewResume ? authedResumeUrl(previewResume._id) : null
  const downloadHref = previewResume ? authedResumeUrl(previewResume._id, "&download=1") : null

  const atCapacity = resumes.length >= MAX_RESUMES

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-foreground">Resume & Portfolio</h3>
        <p className="text-sm text-muted-foreground mt-1">Upload up to {MAX_RESUMES} resumes and mark one as primary for recruiters to see first.</p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">Resumes (PDF)</label>

        {resumes.length > 0 && (
          <div className="space-y-2">
            {resumes.map((resume) => (
              <ResumeFileCard
                key={resume._id}
                name={resume.originalName || "Resume"}
                size={formatBytes(resume.size)}
                uploadedAt={formatDate(resume.uploadedAt)}
                isPrimary={resume.isPrimary}
                onPreview={() => setPreviewResumeId(resume._id)}
                onDownload={() => { window.location.href = authedResumeUrl(resume._id, "&download=1") }}
                onSetPrimary={() => onSetPrimaryResume(resume._id)}
                onDelete={() => onDeleteResume(resume._id)}
              />
            ))}
          </div>
        )}

        {atCapacity ? (
          <p className="text-xs text-muted-foreground text-center py-3 bg-muted/30 rounded-xl border border-dashed border-input">
            Maximum of {MAX_RESUMES} resumes reached. Delete one to add another.
          </p>
        ) : (
          <ResumeDropzone resumeInputRef={resumeInputRef} handleResumeChange={handleResumeChange} uploading={uploadingResume} />
        )}
        <input ref={resumeInputRef} type="file" accept="application/pdf" onChange={handleResumeChange} className="hidden" />
      </div>

      <ResumePreviewModal
        open={Boolean(previewResumeId)}
        onOpenChange={(open) => { if (!open) setPreviewResumeId(null) }}
        title={previewResume?.originalName || "Resume preview"}
        previewSrc={previewSrc}
        downloadHref={downloadHref}
        downloadFilename={previewResume?.originalName}
      />
    </div>
  )
}

function PreferencesTab({
  form, changeHandler,
  willingToRelocate, setWillingToRelocate,
  visibility, onSaveVisibility, savingVisibility,
}) {
  const [visDraft, setVisDraft] = useState(visibility)

  useEffect(() => { setVisDraft(visibility) }, [visibility])

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-foreground">Preferences</h3>
        <p className="text-sm text-muted-foreground mt-1">Fine-tune your availability and who can see your profile.</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Job Preferences</h4>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Notice Period" name="noticePeriod" value={form.noticePeriod} onChange={changeHandler}
            options={["Immediate", "15 Days", "1 Month", "2 Months", "3+ Months"]}
          />
          <InputField label="Available From" name="availableFrom" type="date" value={form.availableFrom} onChange={changeHandler} optional />
        </div>
        <div className="mt-5">
          <ToggleField
            label="Willing to relocate"
            description="Let recruiters know you're open to relocating for the right role."
            checked={willingToRelocate}
            onChange={setWillingToRelocate}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">Saved with the main "Save Changes" button.</p>
      </div>

      <div className="pt-2 border-t border-border">
        <SectionHeaderInline
          title="Visibility"
          onSave={() => onSaveVisibility(visDraft)}
          saving={savingVisibility}
        />
        <div className="space-y-3 mt-4">
          <ToggleField
            label="Profile visible to recruiters"
            description="Turn off to hide your profile from recruiter search entirely."
            checked={visDraft.profileVisible}
            onChange={(value) => setVisDraft((prev) => ({ ...prev, profileVisible: value }))}
          />
          <ToggleField
            label="Resume visible to recruiters"
            description="Turn off to keep your resume private even if your profile is visible."
            checked={visDraft.resumeVisible}
            onChange={(value) => setVisDraft((prev) => ({ ...prev, resumeVisible: value }))}
          />
          <ToggleField
            label="Show email on public profile"
            description="Let recruiters see your email address without applying first."
            checked={visDraft.showEmail}
            onChange={(value) => setVisDraft((prev) => ({ ...prev, showEmail: value }))}
          />
          <ToggleField
            label="Open to work"
            description="Show an 'Open to Work' badge on your profile."
            checked={visDraft.openToWork}
            onChange={(value) => setVisDraft((prev) => ({ ...prev, openToWork: value }))}
          />
        </div>
      </div>
    </div>
  )
}

function SectionHeaderInline({ title, onSave, saving }) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  )
}

function CompanyTab({ form, changeHandler, errors, verificationStatus }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Company Information</h3>
        <p className="text-sm text-muted-foreground mt-1">Set up your company profile to start hiring.</p>
      </div>

      {verificationStatus && verificationStatus !== "verified" && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Recruiter Verification Required</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Complete your company details and wait for verification to post jobs and hire candidates.
                {verificationStatus === "pending" && " Your verification is currently pending review."}
              </p>
            </div>
          </div>
        </div>
      )}

      {verificationStatus === "verified" && (
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <div className="flex items-start gap-3">
            <BadgeCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">Verified Recruiter</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">Your recruiter account is verified. You can post jobs and hire candidates.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="Company Name" name="companyName" value={form.companyName} onChange={changeHandler} icon={Building2} error={errors.companyName} placeholder="Acme Inc." />
        <InputField label="Designation" name="designation" value={form.designation} onChange={changeHandler} icon={Award} placeholder="HR Manager / CTO" />
        <InputField label="Company Email" name="companyEmail" type="email" value={form.companyEmail} onChange={changeHandler} icon={Mail} placeholder="hr@company.com" optional />
        <InputField label="Company Website" name="companyWebsite" value={form.companyWebsite} onChange={changeHandler} icon={Globe} placeholder="https://company.com" optional />
        <SelectField label="Company Size" name="companySize" value={form.companySize} onChange={changeHandler}
          options={["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]}
        />
        <InputField label="Industry" name="industry" value={form.industry} onChange={changeHandler} placeholder="Technology, Healthcare..." optional />
      </div>
    </div>
  )
}
