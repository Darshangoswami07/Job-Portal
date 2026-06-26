import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import axios from "axios";
import { setSingleJob } from "@/store/slices/jobSlice";
import { APPLICATION_API_END_POINT, JOB_API_END_POINT } from "@/utils/constant.js";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

export default function JobDescription() {
  const params = useParams();
  const jobId = params.id;
  const { singleJob } = useSelector((store) => store.job);
  const { user } = useSelector((store) => store.auth);
  const isInitiallyApplied =
  singleJob?.applications?.some(
    (application) => String(application.applicant?._id || application.applicant) === String(user?._id)
  ) || false;
  const [isApplied, setIsApplied] = useState(isInitiallyApplied);
  const dispatch = useDispatch();

  const applyJobHandler = async () => {
    try {
      const res = await axios.get(
        `${APPLICATION_API_END_POINT}/apply/${jobId}`,
        {
          withCredentials: true,
        },
      );

      if (res.data.success) {
        setIsApplied(true);
        const updateSingleJob = {
          ...singleJob,
          applications: [...(singleJob?.applications || []), { applicant: user?._id }],
        };
        dispatch(setSingleJob(updateSingleJob));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  useEffect(() => {
    const fetchSingleJob = async () => {
      try {
        const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
          withCredentials: true,
        });
        if (res.data.success) {
          dispatch(setSingleJob(res.data.job));
          setIsApplied(
            res.data.job.applications.some(
              (application) =>
                String(application.applicant?._id || application.applicant) ===
                String(user?._id)
            )
          );
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load job");
      }
    };
    fetchSingleJob();
  }, [jobId, dispatch, user?._id]);

  return (
    <div className="max-w-7xl mx-auto my-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-slate-200 bg-white">
              <AvatarImage src={singleJob?.company?.logo} alt={singleJob?.company?.name || "Company logo"} />
              <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
                {singleJob?.company?.name?.[0]?.toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold text-xl ">{singleJob?.title || "Job Title"}</h1>
              <p className="text-sm text-slate-500">{singleJob?.company?.name || "Company name"}</p>
            </div>
          </div>
          <div className="felx items-center gap-2 mt-4">
            <Badge className="text-blue-500 font-bold" variant="ghost">
              {singleJob?.position} position
            </Badge>
            <Badge className="text-red-500 font-bold" variant="ghost">
              {singleJob?.jobType}
            </Badge>
            <Badge className="text-purple-600 font-bold" variant="ghost">
              {singleJob?.salary}LPA
            </Badge>
          </div>
        </div>
        <Button
          onClick={isApplied ? null : applyJobHandler}
          disabled={isApplied}
          className={`rounded-lg ${isApplied ? "bg-gray-600 cursor-not-allowed" : `bg-purple-500 hover:bg-purple-700`}`}
        >
          {isApplied ? "Already Applied" : "Apply Now"}
        </Button>
      </div>
      <h1 className="border-b-2 border-b-gray-300 font-medium py-4">
        Job Description
      </h1>
      <div className="my-4">
        <h1 className="font-bold my-1">
          Role:
          <span className="pl-4 font-normal text-gray-800">
            {singleJob?.title || "-"}
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Location:
          <span className="pl-4 font-normal text-gray-800">
            {singleJob?.location || "-"}
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Description:
          <span className="pl-4 font-normal text-gray-800">
            {singleJob?.description || "-"}
          </span>
        </h1>
        <h1 className="font-bold my-1">
          experience:
          <span className="pl-4 font-normal text-gray-800">
            {singleJob?.experienceLevel || "-"} yrs
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Salary:{" "}
          <span className="pl-4 font-normal text-gray-800">
            {singleJob?.salary}lpa
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Total Application:
          <span className="pl-4 font-normal text-gray-800">
            {singleJob?.applications?.length}
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Posted Date:
          <span className="pl-4 font-normal text-gray-800">
            {singleJob?.createdAt.split("T")[0]}
          </span>
        </h1>
      </div>
    </div>
  );
}
