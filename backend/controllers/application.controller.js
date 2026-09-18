import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { invalidateUser } from "../services/jobs/recoCache.js";
import { recordEvent } from "../services/analytics/events.js";
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
      return res.status(400).json({
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
    invalidateUser(userId); // applying changes recommendation signal
    recordEvent("job_apply_click", { userId, meta: { applyType: "internal" } });
    if (req.body?.fromRecommendation) recordEvent("recommendation_applied", { userId });

    return res.status(201).json({
        message: "Applied successfully",
      success: true,
      application: newApplication,
    });
  } catch (error) {
    console.error("Error in applyjob:", error);
    return res.status(500).json({
      message: "Server error while applying for job",
      success: false,
    });
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
            console.error("Error in getAppliedjobs:", error);
            return res.status(500).json({
                message: "Server error while fetching applied jobs",
                success: false,
            });
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
            console.error("Error in getApplicants:", error);
            return res.status(500).json({
                message: "Server error while fetching applicants",
                success: false,
            });
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
            const application = await Application.findOne({_id:applicationId});
            if(!application){
                return res.status(404).json({
                    message:"Application not found",
                    success:false,
                });
            }

            application.status = status.toLowerCase();
            application.statusHistory.push({
                status: status.toLowerCase(),
                updatedAt: new Date()
            });
            await application.save();

            return res.status(200).json({
                message:"Status updated successfully",
                success:true,
            });
        }catch(error){
            console.error("Error in updateStatus:", error);
            return res.status(500).json({
                message: "Server error while updating status",
                success: false,
            });
        }
    }