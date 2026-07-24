import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum:['pending','reviewed','interviewing','accepted','rejected','hired'],
        default:'pending',
    },
    statusHistory: [{
        status: {
            type: String,
            required: true,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        }
    }],
}, { timestamps: true });

export const Application = mongoose.model("Application", applicationSchema);