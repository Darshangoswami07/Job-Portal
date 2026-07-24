import mongoose from "mongoose";

const jobSchema =new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    requirements:{
        type:[String],
    },
    salary:{
        type:Number,
        required:true,
    },
    experienceLevel:{
        type:Number,
        required:true,
    },
    location:{
        type:String,
        required:true,
    },
    jobType:{
        type:String,
        required:true,
    },
    position:{
        type:Number,
        required:true,
    },
    company:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Company',
        required:true,
    },
    created_by:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    applications:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Application',
    }],
    views: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
},{timestamps:true});

// Add text index for search
jobSchema.index({ title: 'text', description: 'text' });

export const Job =mongoose.model("Job",jobSchema)