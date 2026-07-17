import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, Briefcase, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F2EF] px-4">
      <div className="text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
              <SearchX className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Page not found</h2>
          <p className="text-sm text-gray-500 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium btn-primary"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium btn-secondary"
            >
              <Briefcase className="w-4 h-4" />
              Browse Jobs
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
