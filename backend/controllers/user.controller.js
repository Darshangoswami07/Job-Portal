import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

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
    console.log("Error in register:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
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
      .cookie("token", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      })
      .json({
        message: `welcome back ${user.fullname}`,
        user,
        success: true,
      });
  } catch (error) {
    console.log("Error in login:", error);
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: "none",
        secure: false,
      })
      .json({
        message: "logged out successfully",
        success: true,
      });
  } catch (error) {
    console.log("Error in logout:", error);
  }
};
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;

    const userId = req.id;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        message: "user not found",
        success: false,
      });
    }

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;

    if (skills) {
      user.profile.skills = skills.split(",");
    }

    const file = req.file;

    if (file) {
      const fileUri = getDataUri(file);

      // 🔹 Resume Upload (PDF)
      if (file.mimetype === "application/pdf") {
        const cloudResponse = await cloudinary.uploader.upload(
          fileUri.content,
          {
            resource_type: "raw",
          },
        );

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

        user.profile.profilePhoto = cloudResponse.secure_url;
      }
    }

    await user.save();

    return res.status(200).json({
      message: "profile updated successfully",
      user,
      success: true,
    });
  } catch (error) {
    console.log("Error in updateProfile:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};
