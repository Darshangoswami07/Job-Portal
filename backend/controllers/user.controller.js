import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import https from "https";
import http from "http";
import { URL } from "url";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../config/cloudinary.js";
import { getJwtSecret } from "../config/runtimeUrls.js";
import { invalidateUser } from "../services/jobs/recoCache.js";

const shouldDebugProfileUpdate = process.env.DEBUG_PROFILE_UPDATE === "true";

const normalizeUserResponse = (user) => ({
  _id: user._id,
  fullname: user.fullname,
  email: user.email,
  phoneNumber: user.phoneNumber,
  roles: {
    jobSeeker: Boolean(user.roles?.jobSeeker),
    recruiter: Boolean(user.roles?.recruiter),
    admin: Boolean(user.roles?.admin),
  },
  currentRole: user.currentRole || null,
  profileCompleted: user.profileCompleted || false,
  profile: user.profile || {},
});

const getAuthCookieOptions = (req) => {
  const origin = req.headers.origin;

  if (!origin) {
    return {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    };
  }

  try {
    const originHostname = new URL(origin).hostname;
    const requestHostname = req.hostname;
    const isCrossSite = originHostname !== requestHostname;

    return {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: isCrossSite ? "none" : "lax",
      secure: isCrossSite,
      path: "/",
    };
  } catch (error) {
    return {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    };
  }
};

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
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
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

    const tokenData = { userId: user._id };
    const token = jwt.sign(tokenData, jwtSecret, {
      expiresIn: "7d",
    });

    return res
      .status(200)
      .cookie("token", token, getAuthCookieOptions(req))
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

export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", {
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
      fullname, email, phoneNumber, bio, skills,
      headline, dateOfBirth, gender, location, website,
      linkedin, github, portfolio,
      preferredJobRole, preferredSalary, employmentType, workPreference,
      certifications, experience, education,
      companyName, companyEmail, companyWebsite, designation,
      companySize, industry,
      roles, currentRole, profileCompleted,
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
    if (website !== undefined) user.profile.website = website;
    if (linkedin !== undefined) user.profile.linkedin = linkedin;
    if (github !== undefined) user.profile.github = github;
    if (portfolio !== undefined) user.profile.portfolio = portfolio;
    if (preferredJobRole !== undefined) user.profile.preferredJobRole = preferredJobRole;
    if (preferredSalary !== undefined) user.profile.preferredSalary = preferredSalary;
    if (employmentType !== undefined) user.profile.employmentType = employmentType;
    if (workPreference !== undefined) user.profile.workPreference = workPreference;
    if (certifications !== undefined) {
      try { user.profile.certifications = typeof certifications === "string" ? JSON.parse(certifications) : certifications; }
      catch { user.profile.certifications = String(certifications).split(",").map(s => s.trim()).filter(Boolean); }
    }
    if (experience !== undefined) {
      try { user.profile.experience = typeof experience === "string" ? JSON.parse(experience) : experience; }
      catch { user.profile.experience = []; }
    }
    if (education !== undefined) {
      try { user.profile.education = typeof education === "string" ? JSON.parse(education) : education; }
      catch { user.profile.education = []; }
    }
    if (companyName !== undefined) user.profile.companyName = companyName;
    if (companyEmail !== undefined) user.profile.companyEmail = companyEmail;
    if (companyWebsite !== undefined) user.profile.companyWebsite = companyWebsite;
    if (designation !== undefined) user.profile.designation = designation;
    if (companySize !== undefined) user.profile.companySize = companySize;
    if (industry !== undefined) user.profile.industry = industry;

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
      const val = typeof currentRole === "string" && currentRole.toLowerCase() === "null" ? null : currentRole;
      user.currentRole = val;
    }

    if (profileCompleted !== undefined) {
      user.profileCompleted = profileCompleted;
    }

    if (skills !== undefined) {
      user.profile.skills = String(skills)
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    const uploadedFiles = [
      ...(Array.isArray(req.files) ? req.files : []),
      ...(req.file ? [req.file] : []),
    ];

    const profilePhotoFile = uploadedFiles.find(
      (file) => file.fieldname === "profilePhoto" || (file.fieldname === "file" && file.mimetype !== "application/pdf")
    );
    const resumeFile = uploadedFiles.find(
      (file) => file.fieldname === "resume" || (file.fieldname === "file" && file.mimetype === "application/pdf")
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

    if (resumeFile) {
      if (!resumeFile.buffer) {
        return res.status(400).json({
          message: "Uploaded resume is invalid",
          success: false,
        });
      }

      const fileUri = getDataUri(resumeFile);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        resource_type: "raw",
      });

      if (shouldDebugProfileUpdate) {
        console.log("updateProfile resume upload response:", cloudResponse);
      }

      user.profile.resume = cloudResponse.secure_url;
      user.profile.resumeOriginalName = resumeFile.originalname;
    }

    await user.save();
    invalidateUser(user._id); // profile changes recommendation signal

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

    return res.status(500).json({
      message: error?.message || "Server error",
      success: false,
    });
  }
};

export const getResume = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);

    if (!user || !user.profile?.resume) {
      return res.status(404).json({
        message: "Resume not found",
        success: false,
      });
    }

    const resumeUrl = user.profile.resume;
    const resumeName = user.profile.resumeOriginalName || "resume";
    const parsedUrl = new URL(resumeUrl);
    const client = parsedUrl.protocol === "http:" ? http : https;

    client
      .get(parsedUrl, (proxyRes) => {
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
          const redirectUrl = new URL(proxyRes.headers.location, parsedUrl);
          return client.get(redirectUrl, (redirectRes) => {
            res.setHeader(
              "Content-Type",
              redirectRes.headers["content-type"] || "application/pdf",
            );
            res.setHeader(
              "Content-Disposition",
              `inline; filename="${resumeName}"`,
            );
            redirectRes.pipe(res);
          });
        }

        res.setHeader(
          "Content-Type",
          proxyRes.headers["content-type"] || "application/pdf",
        );
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${resumeName}"`,
        );
        proxyRes.pipe(res);
      })
      .on("error", (err) => {
        console.error("Error proxying resume:", err);
        return res.status(500).json({
          message: "Unable to proxy resume",
          success: false,
        });
      });
  } catch (error) {
    console.error("Error in getResume:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
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
