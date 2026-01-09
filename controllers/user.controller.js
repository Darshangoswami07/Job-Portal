import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;
    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "something is missing",
        sucess: false,
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "user already exists with this email",
        sucess: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
    });
    return res.status(201).json({
      message: "user registered successfully",
      sucess: true,
    });
  } catch (error) {
    console.log(error in register);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "something is missing",
        sucess: false,
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "user does not exist with this email",
        sucess: false,
      });
    }
    const ispasswordMatch = await bcrypt.compare(password, user.password);
    if (!ispasswordMatch) {
      return res.status(400).json({
        message: "incorrect password",
        sucess: false,
      });
    }
    if (user.role !== role) {
      return res.status(400).json({
        message: `user is not registered as ${role}`,
        sucess: false,
      });
    }
    const tokenData = {
      userId: user._id,
    };
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });
    
    user ={
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profile: user.profile
    }
    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `welcome back ${user.fullname}`,
        user,
        sucess: true,
      });
  } catch (error) {
    console.log(error in login);
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: "logged out successfully",
        sucess: true,
      });
  } catch (error) {
    console.log(error in logout);
  }
}

export const updateProfile = async (req, res) => {
    try {
        const {fullname,email,phoneNumber,bio,skills}=req.body;
        const file =req.file;
        if(!fullname || !email || !phoneNumber || !bio || !skills){
            return res.status(400).json({
                message:"something is missing",
                sucess:false
            });
        }

        //for cloudinary upload

        const skillsArray = skills.split(',');
        const userId =req.id;
        let user = await User.findById(userId);
        if(!user){
            return res.status(400).json({
                message:"user not found",
                sucess:false
            });
        }
        user.fullname=fullname;
        user.email=email;
        user.phoneNumber=phoneNumber;
        user.profile.bio=bio;
        user.profile.skills=skillsArray;

        await user.save();  

        user ={
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }
        return res.status(200).json({
            message:"profile updated successfully",
            user,
            sucess:true
        });

    } catch (error) {
        console.log(error in updateProfile);
    }
};