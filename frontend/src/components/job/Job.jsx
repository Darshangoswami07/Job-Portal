import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bookmark, MapPin } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

const daysAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
};

export default function Job({ job, isSaved = false, onToggleSaved = () => {} }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(isSaved);

  if (!job) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 text-center text-sm text-gray-500">
        Job data not available
      </div>
    );
  }

  const handleBookmark = (e) => {
    e.stopPropagation();
    setSaved(!saved);
    onToggleSaved(job._id, saved);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white border border-gray-200 rounded-lg card-shadow hover:card-shadow-hover hover:-translate-y-1.5 hover:border-[#0A66C2] transition-all duration-300"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-md group-hover:rotate-3 transition-transform duration-300">
              <AvatarImage src={job.company?.logo} alt={job.company?.name} />
            </Avatar>
            <div>
              <h3 className="font-medium text-sm text-gray-900">{job.company?.name}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin className="h-3 w-3" />
                <span>{job.location || job.company?.location || "Remote"}</span>
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-400 shrink-0">{daysAgo(job.createdAt)}</span>
        </div>

        <h2 className="font-semibold text-base text-gray-900 mb-2">{job.title}</h2>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{job.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 font-medium">
            {job.position} {job.position === 1 ? "position" : "positions"}
          </Badge>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
            {job.jobType}
          </Badge>
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 font-medium">
            {job.salary} LPA
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
        <Button
          onClick={() => navigate(`/description/${job._id}`)}
          variant="outline"
          size="sm"
          className="btn-secondary text-xs group-hover:translate-x-0.5 transition-transform duration-300"
        >
          View Details
        </Button>
        <button
          onClick={handleBookmark}
          className={cn(
            "p-1.5 rounded transition-all duration-200 group-hover:scale-110",
            saved ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
          )}
          aria-label={saved ? "Remove from saved" : "Save job"}
        >
          <Bookmark className={cn("h-4 w-4", saved && "fill-blue-600")} />
        </button>
      </div>
    </motion.div>
  );
}
