import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function LatestJobCard({ job }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate(`/description/${job._id}`)}
      className="group bg-white border border-gray-200 rounded-lg card-shadow hover:card-shadow-hover hover:-translate-y-1 hover:border-[#0A66C2] transition-all duration-300 p-5 cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-10 w-10 rounded-md group-hover:rotate-3 transition-transform duration-300">
          <AvatarImage src={job?.company?.logo} alt={job?.company?.name} />
          <AvatarFallback className="rounded-md bg-blue-100 text-blue-700 text-xs font-bold">
            {(job?.company?.name || "C")[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-sm text-gray-900">
            {job?.company?.name || "Company"}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job?.location || "Location"}
          </p>
        </div>
      </div>

      <h4 className="font-semibold text-base text-gray-900 mb-2">
        {job?.title || "Job Title"}
      </h4>

      <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
        {job?.description || "No description available"}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 font-medium">
          {job?.position || 0} positions
        </Badge>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
          {job?.jobType || "Type"}
        </Badge>
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 font-medium">
          {job?.salary || 0} LPA
        </Badge>
      </div>
    </motion.div>
  )
}
