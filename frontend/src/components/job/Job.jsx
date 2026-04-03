import React from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MotionDiv = motion.div;

export default function Job({ job, isSaved = false, onToggleSaved = () => {} }) {
  const navigate = useNavigate();
  // const jobId="uhsufs";
  const daysAgoFunction =(mongodbTime)=>{
      const createdAt=new Date(mongodbTime);
      const currentTime =new Date();
      const timeDifference=currentTime-createdAt;
      return Math.floor(timeDifference/(1000*24*60*60));
  }

  if (!job) {
    return <div className="p-5 border border-red-200 bg-red-50 rounded">Job data not available</div>;
  }

  return (
    <MotionDiv
      className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.18)] transition-all duration-300"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
          {daysAgoFunction(job?.createdAt) == 0 ? "Today" : `${daysAgoFunction(job?.createdAt)} days ago`}
        </p>
        <Button
          variant="outline"
          className="rounded-full border-slate-200 bg-white text-slate-700 shadow-sm"
          size="icon"
          onClick={() => onToggleSaved(job?._id, isSaved)}
          aria-label={isSaved ? "Unsave job" : "Save job"}
        >
          <Bookmark className={isSaved ? "text-indigo-600" : "text-slate-600"} />
        </Button>
      </div>
      <div className="border-b border-slate-200/80 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 shadow-sm">
            <Avatar>
              <AvatarImage src={job?.company?.logo} />
            </Avatar>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{job?.company?.name}</h2>
            <p className="text-sm text-slate-500">{job?.location || job?.company?.location || "Remote"}</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 px-5 py-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{job?.title}</h1>
          <p className="mt-2 max-h-24 overflow-hidden text-sm leading-6 text-slate-500">
            {job?.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700" variant="ghost">
            {job?.position} position
          </Badge>
          <Badge className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700" variant="ghost">
            {job?.jobType}
          </Badge>
          <Badge className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700" variant="ghost">
            {job?.salary} LPA
          </Badge>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          onClick={() => navigate(`/description/${job?._id}`)}
          variant="outline"
          className="rounded-2xl px-4 py-2 text-sm font-semibold"
        >
          Details
        </Button>
        <Button
          className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700"
          onClick={() => onToggleSaved(job?._id, isSaved)}
        >
          {isSaved ? "Saved" : "Save Job"}
        </Button>
      </div>
    </MotionDiv>
  );
}
