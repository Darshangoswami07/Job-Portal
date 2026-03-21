import React from "react";
import { Badge } from "./ui/Badge";
import { useNavigate } from "react-router-dom";

export default function LatestJobCard({job}) {
  const navigate=useNavigate();
  return (
    <div onClick={()=>navigate(`/description/${job._id}`)} className="p-6 rounded-lg shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow bg-white">
      <div className="mb-4">
        <h1 className="font-semibold text-lg text-slate-800">{job?.company?.name || "Company"}</h1>
        <p className="text-gray-500 text-sm">{job?.location || "Location"}</p>
      </div>
      <div className="mb-4">
        <h1 className="font-bold text-xl my-2 text-slate-900">{job?.title || "Job Title"}</h1>
        <p className="text-sm text-gray-600 line-clamp-2">{job?.description || "Job description"}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Badge className="text-blue-600 font-medium bg-blue-50" variant="ghost">{job?.position || 0} positions</Badge>
        <Badge className="text-red-600 font-medium bg-red-50" variant="ghost">{job?.jobType || "Type"}</Badge>
        <Badge className="text-purple-600 font-medium bg-purple-50" variant="ghost">{job?.salary || 0} LPA</Badge>
      </div>
    </div>
  );
}
