export const postJob = async(req,res)=>{
    try{
        const {title,description,requirements,location,jobType,salary,experience,position,companyId}=req.body;
        const userId=req.id;

        if(!title || !description || !requirements || !location || !jobType || !salary || !experience || !position || !companyId){
            return res.status(400).json({
                message:"something is missing",
                success:false,
            });
        }
        const job=await Job.create({
            title,
            description,
            requirements:requirements.split(","),
            location,
            jobType,
            salary:Number(salary),
            experienceLevel:experience,
            position,
            company:companyId,
            created_by:userId,
        });
        return res.status(201).json({
            message:"New Job posted successfully",
            success:true,
            job,
        });
    }catch(error){
        console.log("Error in Post_Job:", error);
    }
}
