import { z } from "zod";

const urlField = z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal(""));
const dateField = z.coerce.date({ invalid_type_error: "Must be a valid date" }).optional().nullable();

const experienceItem = z.object({
  title: z.string().trim().min(1, "Title is required").max(150),
  company: z.string().trim().min(1, "Company is required").max(150),
  location: z.string().trim().max(150).optional().or(z.literal("")),
  startDate: dateField,
  endDate: dateField,
  isCurrent: z.boolean().optional().default(false),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
}).refine(
  (item) => item.isCurrent || !item.startDate || !item.endDate || item.endDate >= item.startDate,
  { message: "End date can't be before start date", path: ["endDate"] }
);

const educationItem = z.object({
  institution: z.string().trim().min(1, "Institution is required").max(150),
  degree: z.string().trim().min(1, "Degree is required").max(150),
  fieldOfStudy: z.string().trim().max(150).optional().or(z.literal("")),
  startYear: z.coerce.number().int().min(1950).max(2100).optional().nullable(),
  endYear: z.coerce.number().int().min(1950).max(2100).optional().nullable(),
  grade: z.string().trim().max(50).optional().or(z.literal("")),
}).refine(
  (item) => !item.startYear || !item.endYear || item.endYear >= item.startYear,
  { message: "End year can't be before start year", path: ["endYear"] }
);

const skillItem = z.object({
  name: z.string().trim().min(1, "Skill name is required").max(60),
  proficiency: z.enum(["Beginner", "Intermediate", "Expert"]).default("Intermediate"),
});

const projectItem = z.object({
  title: z.string().trim().min(1, "Project title is required").max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  techStack: z.array(z.string().trim().max(40)).max(20).optional().default([]),
  liveUrl: urlField,
  repoUrl: urlField,
  thumbnailUrl: urlField,
});

const certificationItem = z.object({
  name: z.string().trim().min(1, "Certification name is required").max(150),
  issuingOrg: z.string().trim().max(150).optional().or(z.literal("")),
  issueDate: dateField,
  credentialUrl: urlField,
  certificateFileUrl: urlField,
});

export const advancedProfileSchema = z.object({
  summary: z.string().trim().max(1000, "Summary must be 1000 characters or fewer").optional().or(z.literal("")),
  experience: z.array(experienceItem).max(30).optional().default([]),
  education: z.array(educationItem).max(30).optional().default([]),
  skills: z.array(skillItem).max(60).optional().default([]),
  projects: z.array(projectItem).max(30).optional().default([]),
  certifications: z.array(certificationItem).max(30).optional().default([]),
  socialLinks: z.object({
    linkedin: urlField,
    twitter: urlField,
    website: urlField,
  }).optional().default({}),
  visibility: z.object({
    profileVisible: z.boolean().optional().default(true),
    resumeVisible: z.boolean().optional().default(true),
    showEmail: z.boolean().optional().default(false),
    openToWork: z.boolean().optional().default(false),
  }).optional().default({}),
});

export const formatZodError = (error) => {
  const fieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) fieldErrors[path] = issue.message;
  }
  return fieldErrors;
};
