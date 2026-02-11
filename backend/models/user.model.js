import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {    
        type: String,
        required: true,
        unique: true,
    },
    phoneNumber: {
        type: Number,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'recruiter'],
        required: true,
    },
    profile:{
        bio: { type: String },
        skills: [String],
        resume: { type: String }, // URL or file path
        resumeOriginalName: { type: String },
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company'},
        profilePhoto: { type: String ,default:""}, // URL or file path
    },

}, { timestamps: true });

export const User = mongoose.model("User", userSchema);

