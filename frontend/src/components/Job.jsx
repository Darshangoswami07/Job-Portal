import React from "react";
import { Button } from "./ui/button";
import { Bookmark } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function Job({job}) {
  const navigate = useNavigate();
  const jobId="uhsufs";
  return (
    <div className="p-5 rounded-b-md shadow-xl bg-white border border-gray-200">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">2 Days Ago</p>
        <Button variant="outline" className="rounded-full" size="icon">
          <Bookmark />
        </Button>
      </div>
      <div className="flex items-center gap-2 my-2">
        <Button variant="outline" className="rounded-full p-5" size="icon">
          <Avatar>
            <AvatarImage src="https://tse1.mm.bing.net/th/id/OIP.Tlxk3lOkAZgk5_8_03A8MwAAAA?rs=1&pid=ImgDetMain&o=7&rm=3" />
          </Avatar>
        </Button>
        <div>
          <h1 className="font-medium text-lg">{job?.company?.name}</h1>
          <p className="text-sm text-gray-500">India</p>
        </div>
      </div>
      <div>
        <h1 className="font-bold text-lg my-2">{job?.title}</h1>
        <p className="text-sm text-gray-500 ">
          {job?.description}
        </p>
      </div>
      <div className="felx items-center gap-2 mt-4">
        <Badge className="text-blue-500 font-bold" variant="ghost">
          {job?.position} position
        </Badge>
        <Badge className="text-red-500 font-bold" variant="ghost">
          {job?.jobType}
        </Badge>
        <Badge className="text-purple-600 font-bold" variant="ghost">
          {job?.salary}LPA
        </Badge>
      </div>
      <div className="flex items-center gap-4 mt-5">
        <Button onClick={()=>navigate(`/description/${job?._id}`)} variant="outline">Details</Button>
        <Button className="bg-purple-800">Save for Later</Button>
      </div>
    </div>
  );
}
