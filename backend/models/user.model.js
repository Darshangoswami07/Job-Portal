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
        default: 0,
    },
    password: {
        type: String,
        required: true,
    },
    roles: {
        jobSeeker: { type: Boolean, default: false },
        recruiter: { type: Boolean, default: false },
        admin: { type: Boolean, default: false },
    },
    currentRole: {
        type: String,
        enum: ['jobSeeker', 'recruiter', null],
        default: null,
    },
    profileCompleted: {
        type: Boolean,
        default: false,
    },
    // Seeded editorial/demo contributor account (not a real signup).
    isSeedAccount: {
        type: Boolean,
        default: false,
    },
    profileCompletionScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    profile: {
        bio: { type: String },
        skills: [String],
        resume: { type: String },
        resumeOriginalName: { type: String },
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
        profilePhoto: { type: String, default: "" },
        headline: { type: String },
        dateOfBirth: { type: Date },
        gender: { type: String },
        location: { type: String },
        website: { type: String },
        linkedin: { type: String },
        github: { type: String },
        portfolio: { type: String },
        experience: [{
            title: String,
            company: String,
            startDate: Date,
            endDate: Date,
            current: Boolean,
            description: String,
        }],
        education: [{
            degree: String,
            institution: String,
            field: String,
            startDate: Date,
            endDate: Date,
            grade: String,
        }],
        preferredJobRole: { type: String },
        preferredSalary: { type: String },
        employmentType: { type: String },
        workPreference: { type: String },
        certifications: [String],
        companyName: { type: String },
        companyEmail: { type: String },
        companyWebsite: { type: String },
        designation: { type: String },
        companySize: { type: String },
        industry: { type: String },
        companyLogo: { type: String },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending',
        },
    },
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
