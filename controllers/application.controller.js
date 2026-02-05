import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
export const applyjob = async (req, res) => {
  try {
    const userId = req.id;
    const jobId = req.params.id;
    if (!jobId) {
      return res.status(400).json({
        message: "Job ID is required",
        success: false,
      });
    }
    //check if the user has already applied for the job
    const existingApplication = await Application.findOne({
      applicant: userId,
      job: jobId,
    });
    if (existingApplication) {
      return res.status(400)({
        message: "you have already apply for this job",
        success: false,
      });
    }
    //check if the jobs exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    //create a new application
    const newApplication = await Application.create({
        job: jobId,
        applicant: userId,
    });
    job.applications.push(newApplication._id);
    await job.save();

    return res.status(201).json({
        message: "Applied successfully",
      success: true,
      application: newApplication,
    });
  } catch (error) {
    console.log("Error in applyjob:", error);
  }
};
    export const getAppliedjobs =async (req, res) => {
        try{
            const userId = req.id;
            const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
                path:"job",
               options:{sort:{createdAt:-1}},
               populate:{
                path:"company",
                options:{sort:{createdAt:-1}}
               }
            });
           if(!application){
            return res.status(404).json({
                message:"No applied jobs found",
                success:false,
            });
           }
              return res.status(200).json({
                application,
                success:true,                
              });
        }catch(error){
            console.log("Error in getAppliedjobs:", error);
        }
    }
//admin see how many applicants applied for a job

    export const getApplicants = async (req, res) => {
        try{
             const jobId = req.params.id;
             const job = await Job.findById(jobId).populate({
                path:"applications",
                options:{sort:{createdAt:-1}},
                populate:{
                    path:"applicant",
                }
             })
             if(!job){
                return res.status(404).json({
                    message:"Job not found",
                    success:false,
                });
             }
                return res.status(200).json({
                    job,
                    success:true,
                });
        }catch(error){
            console.log("Error in getApplicants:", error);
        }
    }

    export const updateStatus = async (req, res) => {
        try{
            const { status } = req.body || {};
            const applicationId = req.params.id;
            if(!status){
                return res.status(400).json({
                    message:"Status is required",
                    success:false,
                });
            };
            //find the application by application id
            const application = await Application.findOne({_id:applicationId});
            if(!application){
                return res.status(404).json({
                    message:"Application not found",
                    success:false,
                });
            }

            //update the status of the application
            application.status = status.toLowerCase();
            await application.save();

            return res.status(200).json({
                message:"Status updated successfully",
                success:true,
            });
        }catch(error){
            console.log("Error in updateStatus:", error);
        }
    }