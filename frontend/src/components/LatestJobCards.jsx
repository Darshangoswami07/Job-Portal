import React from "react";
import { Badge } from "./ui/Badge";

export default function LatestJobCard() {
  return (
    <div className="p-5 rounded-b-md shadow-xl border border-gray-100 cursor-pointer"> 
      <div>
        <h1 className="font-medium text-lg">Company Name</h1>
        <p className="text-gray-500 text-sm">India</p>
      </div>
      <div>
        <h1 className="font-bold text-lg my-2">Job Title</h1>
        <p className="text-sm text-gray-500 ">Software Engineer with 5+ years of experience</p>
      </div>
      <div className="felx items-center gap-2 mt-4">
        <Badge className="text-blue-500 font-bold" variant="ghost">12 position</Badge>
        <Badge className="text-red-500 font-bold" variant="ghost">Part-Time</Badge>
        <Badge className="text-purple-600 font-bold" variant="ghost">24LPA</Badge>
      </div>
    </div>
  );
}
