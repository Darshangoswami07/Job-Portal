import React from "react";
import { Badge } from "./ui/Badge";

export default function LatestJobCard({job}) {
  return (
    <div className="p-5 rounded-b-md shadow-xl border border-gray-100 cursor-pointer"> 
      <div>
        <h1 className="font-medium text-lg">{job?.company?.name}</h1>
        <p className="text-gray-500 text-sm">India</p>
      </div>
      <div>
        <h1 className="font-bold text-lg my-2">{job?.title}</h1>
        <p className="text-sm text-gray-500 ">{job?.description}</p>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Badge className="text-blue-500 font-bold" variant="ghost">{job?.position} position</Badge>
        <Badge className="text-red-500 font-bold" variant="ghost">{job?.jobType}</Badge>
        <Badge className="text-purple-600 font-bold" variant="ghost">{job?.salary}LPA</Badge>
      </div>
    </div>
  );
}
