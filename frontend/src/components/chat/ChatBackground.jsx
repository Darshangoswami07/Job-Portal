import { motion } from "framer-motion";

export default function ChatBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-600/10"
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-600/10"
      />
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, -25, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 -right-24 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-600/10"
      />
    </div>
  );
}
