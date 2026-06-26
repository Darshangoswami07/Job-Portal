import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import https from "https";
import http from "http";
import { URL } from "url";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../config/cloudinary.js";

const shouldDebugProfileUpdate = process.env.DEBUG_PROFILE_UPDATE === "true";

const normalizeUserResponse = (user) => ({
  _id: user._id,
  fullname: user.fullname,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  profile: user.profile,
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
    const { fullname, email, phoneNumber, password, role } = req.body;

    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "something is missing",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "user already exists with this email",
        success: false,
      });
    }

    const file = req.file;
    let profilePhotoUrl = "";

    if (file) {
      const fileUri = getDataUri(file);

      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        resource_type: "image",
        format: "jpg",
        quality: "auto",
      });

      profilePhotoUrl = cloudResponse.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      profile: {
        profilePhoto: profilePhotoUrl, // safe
      },
    });

    return res.status(201).json({
      message: "user registered successfully",
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

    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "something is missing",
        success: false,
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "user does not exist with this email",
        success: false,
      });
    }
    const ispasswordMatch = await bcrypt.compare(password, user.password);
    if (!ispasswordMatch) {
      return res.status(400).json({
        message: "incorrect password",
        success: false,
      });
    }
    if (user.role !== role) {
      return res.status(400).json({
        message: `user is not registered as ${role}`,
        success: false,
      });
    }
    const tokenData = {
      userId: user._id,
    };
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };
    return res
      .status(200)
      .cookie("token", token, getAuthCookieOptions(req))
      .json({
        message: `welcome back ${user.fullname}`,
        user,
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
        message: "logged out successfully",
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
      console.log("updateProfile req.file:", req.file);
      console.log("updateProfile req.files:", req.files);
    }

    const { fullname, email, phoneNumber, bio, skills } = req.body;

    const userId = req.id;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        message: "user not found",
        success: false,
      });
    }

    user.profile = user.profile || {};

    if (fullname !== undefined) user.fullname = fullname.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (phoneNumber !== undefined && phoneNumber !== "") user.phoneNumber = phoneNumber;
    if (bio !== undefined) user.profile.bio = bio;

    if (skills !== undefined) {
      user.profile.skills = String(skills)
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    const file = req.file;

    if (file) {
      if (!file.buffer) {
        return res.status(400).json({
          message: "Uploaded file is invalid",
          success: false,
        });
      }

      const fileUri = getDataUri(file);

      // 🔹 Resume Upload (PDF)
      if (file.mimetype === "application/pdf") {
        const cloudResponse = await cloudinary.uploader.upload(
          fileUri.content,
          {
            resource_type: "raw",
          },
        );

        if (shouldDebugProfileUpdate) {
          console.log("updateProfile Cloudinary response:", cloudResponse);
        }

        user.profile.resume = cloudResponse.secure_url;
        user.profile.resumeOriginalName = file.originalname;
      } else {
        // 🔹 Profile Image Upload (Convert to JPG)
        const cloudResponse = await cloudinary.uploader.upload(
          fileUri.content,
          {
            resource_type: "image",
            format: "jpg", // 🔥 force convert HEIC to JPG
            quality: "auto",
          },
        );

        if (shouldDebugProfileUpdate) {
          console.log("updateProfile Cloudinary response:", cloudResponse);
        }

        user.profile.profilePhoto = cloudResponse.secure_url;
      }
    }

    await user.save();

    if (shouldDebugProfileUpdate) {
      console.log("updateProfile MongoDB response:", user);
    }

    return res.status(200).json({
      message: "profile updated successfully",
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
