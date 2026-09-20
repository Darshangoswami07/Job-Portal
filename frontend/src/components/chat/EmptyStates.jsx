import { motion } from "framer-motion";
import { MessageSquare, Inbox, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyChatWindow() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/15 to-sky-500/15 text-indigo-500 dark:text-indigo-400"
      >
        <MessageSquare className="h-9 w-9" />
      </motion.div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Select a conversation</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400 dark:text-slate-500">
        Choose a chat from the list to start messaging about a job application.
      </p>
    </div>
  );
}

export function EmptyConversationList({ showNewChat }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-sky-500/15 text-indigo-500 dark:text-indigo-400"
      >
        <Inbox className="h-7 w-7" />
      </motion.div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No conversations yet</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400 dark:text-slate-500">
        Start chatting with a recruiter after applying to a job.
      </p>
      <div className="mt-5 flex flex-col items-center gap-2">
        {showNewChat && (
          <button
            type="button"
            onClick={showNewChat}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-[1.03]"
          >
            Start a new chat
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Browse jobs →
        </Link>
      </div>
    </div>
  );
}
