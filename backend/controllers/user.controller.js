import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../config/cloudinary.js";
import { pipeRemoteFile, isAllowedRemoteAsset } from "../utils/streamFile.js";
import { advancedProfileSchema, formatZodError } from "../validators/profile.validator.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAccessCookieOptions,
  getRefreshCookieOptions,
  getBaseCookieOptions,
} from "../utils/tokens.js";

const shouldDebugProfileUpdate = process.env.DEBUG_PROFILE_UPDATE === "true";

const normalizeUserResponse = (user) => ({
  _id: user._id,
  fullname: user.fullname,
  email: user.email,
  phoneNumber: user.phoneNumber,
  roles: user.roles || { jobSeeker: false, recruiter: false },
  currentRole: user.currentRole || null,
  profileCompleted: user.profileCompleted || false,
  profile: user.profile || {},
});

const getAuthCookieOptions = (req) => getBaseCookieOptions(req);

export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({
        message: "Full name, email, and password are required",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullname,
      email,
      phoneNumber: phoneNumber || 0,
      password: hashedPassword,
      roles: { jobSeeker: false, recruiter: false },
      currentRole: null,
      profileCompleted: false,
      profile: {
        profilePhoto: "",
      },
    });

    return res.status(201).json({
      message: "Account created successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in register:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    if (!process.env.SECRET_KEY) {
      return res.status(500).json({
        message: "Server authentication is not configured",
        success: false,
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        success: false,
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User does not exist with this email",
        success: false,
      });
    }
    const ispasswordMatch = await bcrypt.compare(password, user.password);
    if (!ispasswordMatch) {
      return res.status(400).json({
        message: "Incorrect password",
        success: false,
      });
    }

    const token = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    return res
      .status(200)
      .cookie("token", token, getAccessCookieOptions(getAuthCookieOptions(req)))
      .cookie("refreshToken", refreshToken, getRefreshCookieOptions(getAuthCookieOptions(req)))
      .json({
        message: `Welcome back ${user.fullname}`,
        user: normalizeUserResponse(user),
        token,
        success: true,
      });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided, please login again",
        code: "REFRESH_TOKEN_MISSING",
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      const code =
        error.name === "TokenExpiredError" ? "REFRESH_TOKEN_EXPIRED" : "REFRESH_TOKEN_INVALID";
      return res.status(401).json({
        success: false,
        message: "Session expired, please login again",
        code,
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session expired, please login again",
        code: "REFRESH_TOKEN_INVALID",
      });
    }

    const token = signAccessToken(user._id);

    return res
      .status(200)
      .cookie("token", token, getAccessCookieOptions(getAuthCookieOptions(req)))
      .json({
        success: true,
        token,
      });
  } catch (error) {
    console.error("Error in refresh:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", {
        ...getAuthCookieOptions(req),
        maxAge: 0,
      })
      .cookie("refreshToken", "", {
        ...getAuthCookieOptions(req),
        maxAge: 0,
      })
      .json({
        message: "Logged out successfully",
        success: true,
      });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (shouldDebugProfileUpdate) {
      console.log("updateProfile req.id:", req.id);
      console.log("updateProfile req.body:", req.body);
    }

    const {
      fullname, email, phoneNumber, bio,
      headline, dateOfBirth, gender, location,
      github, portfolio,
      preferredJobRole, preferredSalary, employmentType, workPreference,
      companyName, companyEmail, companyWebsite, designation,
      companySize, industry,
      roles, currentRole, profileCompleted,
      noticePeriod, availableFrom, willingToRelocate,
    } = req.body;

    const userId = req.id;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    user.profile = user.profile || {};

    if (fullname !== undefined) user.fullname = fullname.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (phoneNumber !== undefined && phoneNumber !== "") user.phoneNumber = phoneNumber;
    if (bio !== undefined) user.profile.bio = bio;
    if (headline !== undefined) user.profile.headline = headline;
    if (dateOfBirth !== undefined) user.profile.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.profile.gender = gender;
    if (location !== undefined) user.profile.location = location;
    if (github !== undefined) user.profile.github = github;
    if (portfolio !== undefined) user.profile.portfolio = portfolio;
    if (preferredJobRole !== undefined) user.profile.preferredJobRole = preferredJobRole;
    if (preferredSalary !== undefined) user.profile.preferredSalary = preferredSalary;
    if (employmentType !== undefined) user.profile.employmentType = employmentType;
    if (workPreference !== undefined) user.profile.workPreference = workPreference;
    if (companyName !== undefined) user.profile.companyName = companyName;
    if (companyEmail !== undefined) user.profile.companyEmail = companyEmail;
    if (companyWebsite !== undefined) user.profile.companyWebsite = companyWebsite;
    if (designation !== undefined) user.profile.designation = designation;
    if (companySize !== undefined) user.profile.companySize = companySize;
    if (industry !== undefined) user.profile.industry = industry;
    if (noticePeriod !== undefined) user.profile.noticePeriod = noticePeriod;
    if (availableFrom !== undefined) user.profile.availableFrom = availableFrom || null;
    if (willingToRelocate !== undefined) user.profile.willingToRelocate = willingToRelocate === "true" || willingToRelocate === true;

    if (roles !== undefined) {
      user.roles = typeof roles === "string" ? JSON.parse(roles) : roles;
      if (user.roles.recruiter && !user.roles.jobSeeker) {
        user.currentRole = "recruiter";
      } else if (user.roles.jobSeeker && !user.roles.recruiter) {
        user.currentRole = "jobSeeker";
      } else if (user.roles.jobSeeker && user.roles.recruiter) {
        user.currentRole = user.currentRole || "jobSeeker";
      } else {
        user.currentRole = null;
      }
    }

    if (currentRole !== undefined) {
      user.currentRole = currentRole === "null" || currentRole === "" ? null : currentRole;
    }

    if (profileCompleted !== undefined) {
      user.profileCompleted = profileCompleted;
    }

    const uploadedFiles = [
      ...(Array.isArray(req.files) ? req.files : []),
      ...(req.file ? [req.file] : []),
    ];

    const profilePhotoFile = uploadedFiles.find(
      (file) => file.fieldname === "profilePhoto" || (file.fieldname === "file" && file.mimetype !== "application/pdf")
    );

    if (profilePhotoFile) {
      if (!profilePhotoFile.buffer) {
        return res.status(400).json({
          message: "Uploaded profile photo is invalid",
          success: false,
        });
      }

      const fileUri = getDataUri(profilePhotoFile);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        resource_type: "image",
        format: "jpg",
        quality: "auto",
      });

      if (shouldDebugProfileUpdate) {
        console.log("updateProfile photo upload response:", cloudResponse);
      }

      user.profile.profilePhoto = cloudResponse.secure_url;
    }

    await user.save();

    if (shouldDebugProfileUpdate) {
      console.log("updateProfile MongoDB response:", user);
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: normalizeUserResponse(user),
      success: true,
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "Email is already in use",
        success: false,
      });
    }

    if (error?.name === "ValidationError" || error?.name === "CastError") {
      return res.status(400).json({
        message: error?.message || "Invalid profile data",
        success: false,
      });
    }

    return res.status(500).json({
      message: error?.message || "Server error",
      success: false,
    });
  }
};

const MAX_RESUMES = 5;

const pipeResume = (req, res, resumeUrl, resumeName) => pipeRemoteFile(req, res, resumeUrl, resumeName);

// Serves the primary resume (or the first one if none is marked primary), for
// callers that only care about "the" resume rather than a specific one.
export const getResume = async (req, res) => {
  try {
    const user = await User.findById(req.id);
    const resumes = user?.profile?.resumes || [];
    const resume = resumes.find((r) => r.isPrimary) || resumes[0];

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
        success: false,
      });
    }

    pipeResume(req, res, resume.url, resume.originalName || "resume");
  } catch (error) {
    console.error("Error in getResume:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

export const getResumeById = async (req, res) => {
  try {
    const user = await User.findById(req.id);
    const resume = user?.profile?.resumes?.id(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
        success: false,
      });
    }

    pipeResume(req, res, resume.url, resume.originalName || "resume");
  } catch (error) {
    console.error("Error in getResumeById:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

export const uploadResume = async (req, res) => {
  try {
    const user = await User.findById(req.id);
    if (!user) {
      return res.status(400).json({ message: "User not found", success: false });
    }

    const file = (Array.isArray(req.files) ? req.files : []).find((f) => f.fieldname === "resume") || req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ message: "No resume file was provided", success: false });
    }
    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Only PDF files are supported", success: false });
    }
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Resume must be 5MB or smaller", success: false });
    }

    user.profile.resumes = user.profile.resumes || [];
    if (user.profile.resumes.length >= MAX_RESUMES) {
      return res.status(400).json({
        message: `You can store up to ${MAX_RESUMES} resumes. Delete one before uploading another.`,
        success: false,
      });
    }

    const fileUri = getDataUri(file);
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content, { resource_type: "raw" });

    user.profile.resumes.push({
      url: cloudResponse.secure_url,
      originalName: file.originalname,
      size: cloudResponse.bytes,
      uploadedAt: new Date(),
      isPrimary: user.profile.resumes.length === 0,
    });

    await user.save();

    return res.status(201).json({
      message: "Resume uploaded successfully",
      resumes: user.profile.resumes,
      success: true,
    });
  } catch (error) {
    console.error("Error in uploadResume:", error);
    return res.status(500).json({ message: error?.message || "Server error", success: false });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const user = await User.findById(req.id);
    const resume = user?.profile?.resumes?.id(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found", success: false });
    }

    const wasPrimary = resume.isPrimary;
    resume.deleteOne();

    if (wasPrimary && user.profile.resumes.length > 0) {
      user.profile.resumes[0].isPrimary = true;
    }

    await user.save();

    return res.status(200).json({
      message: "Resume deleted",
      resumes: user.profile.resumes,
      success: true,
    });
  } catch (error) {
    console.error("Error in deleteResume:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const setPrimaryResume = async (req, res) => {
  try {
    const user = await User.findById(req.id);
    const resume = user?.profile?.resumes?.id(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found", success: false });
    }

    user.profile.resumes.forEach((r) => { r.isPrimary = false; });
    resume.isPrimary = true;

    await user.save();

    return res.status(200).json({
      message: "Primary resume updated",
      resumes: user.profile.resumes,
      success: true,
    });
  } catch (error) {
    console.error("Error in setPrimaryResume:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      user: normalizeUserResponse(user),
      success: true,
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

// Public-ish profile lookup by id: full detail for the owner, a visibility-
// filtered view (respecting profile/email visibility) for everyone else.
export const getProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "Profile not found", success: false });
    }

    const isSelf = req.id === String(user._id);
    const visibility = user.profile?.visibility || {};

    if (!isSelf && visibility.profileVisible === false) {
      return res.status(404).json({ message: "Profile not found", success: false });
    }

    const payload = normalizeUserResponse(user);
    if (!isSelf && !visibility.showEmail) {
      payload.email = null;
    }

    return res.status(200).json({ user: payload, success: true });
  } catch (error) {
    console.error("Error in getProfileById:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const updateAdvancedProfile = async (req, res) => {
  try {
    const parsed = advancedProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Please fix the highlighted fields",
        errors: formatZodError(parsed.error),
        success: false,
      });
    }

    const user = await User.findById(req.id);
    if (!user) {
      return res.status(400).json({ message: "User not found", success: false });
    }

    const { summary, experience, education, skills, projects, certifications, socialLinks, visibility } = parsed.data;

    user.profile = user.profile || {};
    user.profile.summary = summary || "";
    user.profile.experience = experience;
    user.profile.education = education;
    user.profile.skills = skills;
    user.profile.projects = projects;
    user.profile.certifications = certifications;
    user.profile.socialLinks = socialLinks;
    user.profile.visibility = {
      ...user.profile.visibility,
      ...visibility,
    };

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: normalizeUserResponse(user),
      success: true,
    });
  } catch (error) {
    console.error("Error in updateAdvancedProfile:", error);
    if (error?.name === "ValidationError" || error?.name === "CastError") {
      return res.status(400).json({ message: error?.message || "Invalid profile data", success: false });
    }
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const uploadProjectThumbnail = async (req, res) => {
  try {
    const file = (Array.isArray(req.files) ? req.files : []).find((f) => f.fieldname === "thumbnail") || req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ message: "No image file was provided", success: false });
    }
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Only image files are supported", success: false });
    }
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Image must be 5MB or smaller", success: false });
    }

    const fileUri = getDataUri(file);
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
      resource_type: "image",
      quality: "auto",
    });

    return res.status(201).json({ url: cloudResponse.secure_url, success: true });
  } catch (error) {
    console.error("Error in uploadProjectThumbnail:", error);
    return res.status(500).json({ message: error?.message || "Server error", success: false });
  }
};

export const uploadCertificateFile = async (req, res) => {
  try {
    const file = (Array.isArray(req.files) ? req.files : []).find((f) => f.fieldname === "certificate") || req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ message: "No certificate file was provided", success: false });
    }
    if (file.mimetype !== "application/pdf" && !file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Only PDF or image files are supported", success: false });
    }
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "File must be 5MB or smaller", success: false });
    }

    const fileUri = getDataUri(file);
    const isImage = file.mimetype.startsWith("image/");
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
      resource_type: isImage ? "image" : "raw",
    });

    return res.status(201).json({ url: cloudResponse.secure_url, success: true });
  } catch (error) {
    console.error("Error in uploadCertificateFile:", error);
    return res.status(500).json({ message: error?.message || "Server error", success: false });
  }
};

// Streams a previously-uploaded Cloudinary asset (e.g. a certificate PDF)
// back inline instead of forcing a download, mirroring the resume proxy fix.
export const viewUploadedAsset = async (req, res) => {
  try {
    const { url, filename } = req.query;
    if (!url || !isAllowedRemoteAsset(url)) {
      return res.status(400).json({ message: "Invalid or unsupported file URL", success: false });
    }

    pipeRemoteFile(req, res, url, filename || "file");
  } catch (error) {
    console.error("Error in viewUploadedAsset:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};
