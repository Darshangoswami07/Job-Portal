import React, { useState, useRef, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { motion } from "framer-motion"
import Navbar from "@/components/shared/Navbar"
import {
  User, Mail, Phone, MapPin, Globe, Linkedin, Github as GithubIcon,
  Link, Briefcase, FileText, Upload, X, Image as ImageIcon, Check,
  Camera, Award, BookOpen, GraduationCap, DollarSign, Clock,
  Building2, Users as UsersIcon, BadgeCheck, ChevronDown, Loader2,
  Save, AlertCircle, ExternalLink, Sparkles
} from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { updateUser, setUser } from "@/store/slices/authSlice"
import { USER_API_END_POINT } from "@/utils/constant"

export default function Profile() {
  const { user } = useSelector((store) => store.auth)
  const dispatch = useDispatch()

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    fullname: "", email: "", phoneNumber: "", bio: "", headline: "",
    dateOfBirth: "", gender: "", location: "", website: "", linkedin: "",
    github: "", portfolio: "", skills: "", preferredJobRole: "", preferredSalary: "",
    employmentType: "", workPreference: "", certifications: "",
    companyName: "", companyEmail: "", companyWebsite: "", designation: "",
    companySize: "", industry: "",
  })

  const [roles, setRoles] = useState({ jobSeeker: false, recruiter: false })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeName, setResumeName] = useState("")
  const [experience, setExperience] = useState([])
  const [education, setEducation] = useState([])
  const photoInputRef = useRef(null)
  const resumeInputRef = useRef(null)
  const Motion = motion
  void Motion

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${USER_API_END_POINT}/profile`)
        if (res.data.success) {
          dispatch(setUser(res.data.user))
        }
      } catch (err) {
        console.error("Failed to fetch profile from DB:", err)
      }
    }
    fetchProfile()
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
      website: p.website || "",
      linkedin: p.linkedin || "",
      github: p.github || "",
      portfolio: p.portfolio || "",
      skills: (p.skills || []).join(", "),
      preferredJobRole: p.preferredJobRole || "",
      preferredSalary: p.preferredSalary || "",
      employmentType: p.employmentType || "",
      workPreference: p.workPreference || "",
      certifications: (p.certifications || []).join(", "),
      companyName: p.companyName || "",
      companyEmail: p.companyEmail || "",
      companyWebsite: p.companyWebsite || "",
      designation: p.designation || "",
      companySize: p.companySize || "",
      industry: p.industry || "",
    })
    setRoles(user.roles || { jobSeeker: false, recruiter: false })
    setExperience(p.experience || [])
    setEducation(p.education || [])
    setResumeName(p.resumeOriginalName || "")
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

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") { toast.error("Please upload a PDF"); return }
    setResumeFile(file)
    setResumeName(file.name)
  }

  const addExperience = () => {
    setExperience((prev) => [...prev, { title: "", company: "", startDate: "", endDate: "", current: false, description: "" }])
  }

  const updateExperience = (i, field, value) => {
    setExperience((prev) => {
      const updated = [...prev]
      updated[i] = { ...updated[i], [field]: value }
      return updated
    })
  }

  const removeExperience = (i) => {
    setExperience((prev) => prev.filter((_, idx) => idx !== i))
  }

  const addEducation = () => {
    setEducation((prev) => [...prev, { degree: "", institution: "", field: "", startDate: "", endDate: "", grade: "" }])
  }

  const updateEducation = (i, field, value) => {
    setEducation((prev) => {
      const updated = [...prev]
      updated[i] = { ...updated[i], [field]: value }
      return updated
    })
  }

  const removeEducation = (i) => {
    setEducation((prev) => prev.filter((_, idx) => idx !== i))
  }

  const submitHandler = async (e) => {
    e.preventDefault()
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
    formData.append("website", form.website)
    formData.append("linkedin", form.linkedin)
    formData.append("github", form.github)
    formData.append("portfolio", form.portfolio)
    formData.append("skills", form.skills)
    formData.append("preferredJobRole", form.preferredJobRole)
    formData.append("preferredSalary", form.preferredSalary)
    formData.append("employmentType", form.employmentType)
    formData.append("workPreference", form.workPreference)
    formData.append("certifications", form.certifications)
    formData.append("companyName", form.companyName)
    formData.append("companyEmail", form.companyEmail)
    formData.append("companyWebsite", form.companyWebsite)
    formData.append("designation", form.designation)
    formData.append("companySize", form.companySize)
    formData.append("industry", form.industry)
    formData.append("roles", JSON.stringify(roles))
    formData.append("currentRole", roles.recruiter && !roles.jobSeeker ? "recruiter" : roles.jobSeeker ? "jobSeeker" : null)
    formData.append("profileCompleted", "true")
    formData.append("experience", JSON.stringify(experience))
    formData.append("education", JSON.stringify(education))
    if (profilePhoto instanceof File) formData.append("profilePhoto", profilePhoto)
    if (resumeFile instanceof File) formData.append("resume", resumeFile)
    try {
      const res = await axios.post(`${USER_API_END_POINT}/updateprofile`, formData, { withCredentials: true })
      if (res.data.success) {
        dispatch(updateUser(res.data.user))
        toast.success("Profile saved successfully")
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
    roles.jobSeeker && !!form.skills,
    roles.jobSeeker && !!resumeName,
    roles.jobSeeker && experience.length > 0,
    roles.recruiter && !!form.companyName,
    roles.recruiter && !!form.designation,
  ].filter(Boolean).length

  const totalFields = 8 +
    (roles.jobSeeker ? 3 : 0) +
    (roles.recruiter ? 2 : 0)

  const completionPercent = Math.min(Math.round((completedFields / Math.max(totalFields, 1)) * 100), 100)

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "role", label: "Role & Skills", icon: Briefcase },
    { id: "resume", label: "Resume & Portfolio", icon: FileText },
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
                  { done: !roles.jobSeeker || !!resumeName, label: "Upload Resume" },
                  { done: !roles.jobSeeker || !!form.skills, label: "Add Skills" },
                  { done: !roles.jobSeeker || experience.length > 0, label: "Add Experience" },
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
              {activeTab === "role" && (
                <RoleTab
                  form={form} changeHandler={changeHandler}
                  roles={roles} setRoles={setRoles}
                  experience={experience} addExperience={addExperience}
                  updateExperience={updateExperience} removeExperience={removeExperience}
                  education={education} addEducation={addEducation}
                  updateEducation={updateEducation} removeEducation={removeEducation}
                />
              )}
              {activeTab === "resume" && (
                <ResumeTab
                  form={form} changeHandler={changeHandler}
                  resumeFile={resumeFile} resumeName={resumeName}
                  resumeInputRef={resumeInputRef} handleResumeChange={handleResumeChange}
                  onRemoveResume={() => { setResumeFile(null); setResumeName("") }}
                  resumeUrl={user?.profile?.resume || ""}
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

function InputField({ label, name, value, onChange, error, icon: Icon, type = "text", placeholder, optional }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {optional && <span className="text-muted-foreground font-normal">(optional)</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />}
        {type === "textarea" ? (
          <textarea name={name} value={value} onChange={onChange} rows={3} placeholder={placeholder}
            className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] resize-none ${Icon ? "pl-11" : ""} ${error ? "border-red-400" : "border-input"}`}
          />
        ) : (
          <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
            className={`w-full rounded-xl border bg-background text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] ${Icon ? "pl-11 py-3 pr-4" : "px-4 py-3"} ${error ? "border-red-400" : "border-input"}`}
          />
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function SelectField({ label, name, value, onChange, options, placeholder }) {
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

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Social Links</h4>
        <div className="grid gap-5 sm:grid-cols-2">
          <InputField label="Website" name="website" value={form.website} onChange={changeHandler} icon={Globe} placeholder="https://yoursite.com" optional />
          <InputField label="LinkedIn" name="linkedin" value={form.linkedin} onChange={changeHandler} icon={Linkedin} placeholder="https://linkedin.com/in/..." optional />
          <InputField label="GitHub" name="github" value={form.github} onChange={changeHandler} icon={GithubIcon} placeholder="https://github.com/..." optional />
          <InputField label="Portfolio" name="portfolio" value={form.portfolio} onChange={changeHandler} icon={Link} placeholder="https://..." optional />
        </div>
      </div>
    </div>
  )
}

function RoleTab({ form, changeHandler, roles, setRoles, experience, addExperience, updateExperience, removeExperience, education, addEducation, updateEducation, removeEducation }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-foreground">How would you like to use JobPilot Ai?</h3>
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
          <InputField label="Skills" name="skills" value={form.skills} onChange={changeHandler} placeholder="React, Node.js, TypeScript..." optional />
          {form.skills && <p className="text-xs text-muted-foreground -mt-3">Separate skills with commas</p>}
          <InputField label="Certifications" name="certifications" value={form.certifications} onChange={changeHandler} placeholder="AWS Certified, Google Analytics..." optional />

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold text-foreground">Experience</h5>
              <button type="button" onClick={addExperience}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >+ Add Experience</button>
            </div>
            <div className="space-y-3">
              {experience.map((exp, i) => (
                <div key={i} className="rounded-xl border border-input bg-background/50 p-4 relative">
                  <button type="button" onClick={() => removeExperience(i)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200"
                  ><X className="h-3 w-3" /></button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InputField label="Title" name={`exp-title-${i}`} value={exp.title} onChange={(e) => updateExperience(i, "title", e.target.value)} placeholder="Job title" />
                    <InputField label="Company" name={`exp-company-${i}`} value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} placeholder="Company name" />
                    <InputField label="Start Date" name={`exp-start-${i}`} type="date" value={exp.startDate} onChange={(e) => updateExperience(i, "startDate", e.target.value)} />
                    <InputField label="End Date" name={`exp-end-${i}`} type="date" value={exp.endDate} onChange={(e) => updateExperience(i, "endDate", e.target.value)} disabled={exp.current} />
                  </div>
                  <label className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(i, "current", e.target.checked)}
                      className="rounded border-input h-4 w-4 text-primary focus:ring-primary"
                    /> I currently work here
                  </label>
                  <textarea name={`exp-desc-${i}`} value={exp.description} onChange={(e) => updateExperience(i, "description", e.target.value)}
                    rows={2} placeholder="Brief description of your role..."
                    className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
                  />
                </div>
              ))}
              {experience.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-xl border border-dashed border-input">
                  No experience added yet. Click "Add Experience" to get started.
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold text-foreground">Education</h5>
              <button type="button" onClick={addEducation}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >+ Add Education</button>
            </div>
            <div className="space-y-3">
              {education.map((edu, i) => (
                <div key={i} className="rounded-xl border border-input bg-background/50 p-4 relative">
                  <button type="button" onClick={() => removeEducation(i)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200"
                  ><X className="h-3 w-3" /></button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InputField label="Degree" name={`edu-degree-${i}`} value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} placeholder="B.S. Computer Science" />
                    <InputField label="Institution" name={`edu-inst-${i}`} value={edu.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} placeholder="University name" />
                    <InputField label="Field of Study" name={`edu-field-${i}`} value={edu.field} onChange={(e) => updateEducation(i, "field", e.target.value)} placeholder="Computer Science" />
                    <InputField label="Grade" name={`edu-grade-${i}`} value={edu.grade} onChange={(e) => updateEducation(i, "grade", e.target.value)} placeholder="GPA / Percentage" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 mt-3">
                    <InputField label="Start Date" name={`edu-start-${i}`} type="date" value={edu.startDate} onChange={(e) => updateEducation(i, "startDate", e.target.value)} />
                    <InputField label="End Date" name={`edu-end-${i}`} type="date" value={edu.endDate} onChange={(e) => updateEducation(i, "endDate", e.target.value)} />
                  </div>
                </div>
              ))}
              {education.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-xl border border-dashed border-input">
                  No education added yet. Click "Add Education" to get started.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function ResumeTab({ form, changeHandler, resumeFile, resumeName, resumeInputRef, handleResumeChange, onRemoveResume, resumeUrl }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Resume & Portfolio</h3>
        <p className="text-sm text-muted-foreground mt-1">Upload your resume to let recruiters know about your experience.</p>
      </div>

      {resumeUrl && !resumeFile && (
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-800 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{resumeName || "Resume"}</p>
                <p className="text-xs text-muted-foreground">Uploaded and saved</p>
              </div>
            </div>
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View CV
            </a>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Resume (PDF)</label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer?.files?.[0]
            if (file && file.type === "application/pdf") {
              const event = { target: { files: [file] } }
              handleResumeChange(event)
            } else if (file) {
              toast.error("Please upload a PDF file")
            }
          }}
          onClick={() => resumeInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-input bg-background/50 p-8 transition-all hover:border-primary hover:bg-primary/5"
        >
          {resumeFile || resumeName ? (
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{resumeFile?.name || resumeName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {resumeFile ? `${(resumeFile.size / 1024).toFixed(0)} KB` : "Uploaded"}
                  </p>
                </div>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveResume() }}
                className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              ><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Drop your resume here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF only, max 5MB</p>
            </>
          )}
          <input ref={resumeInputRef} type="file" accept="application/pdf" onChange={handleResumeChange} className="hidden" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="Portfolio URL" name="portfolio" value={form.portfolio} onChange={changeHandler} icon={Link} placeholder="https://..." optional />
        <InputField label="GitHub URL" name="github" value={form.github} onChange={changeHandler} icon={GithubIcon} placeholder="https://github.com/..." optional />
      </div>

      <InputField label="Certifications" name="certifications" value={form.certifications} onChange={changeHandler} type="textarea" placeholder="AWS Certified Solutions Architect, Google Analytics Individual Qualification..." optional />
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
