import { motion, AnimatePresence } from "framer-motion";
import { Briefcase } from "lucide-react";

export default function PageLoader({ isLoading = true }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="size-16 rounded-full border-[3px] border-muted border-t-brand border-r-brand-accent"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Briefcase className="size-6 text-brand" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold text-gradient">JobPilot Ai</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Finding the perfect opportunity...
              </p>
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 1.5, ease: "easeInOut" }}
              className="h-1.5 w-48 overflow-hidden rounded-full bg-muted"
              style={{ transformOrigin: "left" }}
            >
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-1/2 rounded-full bg-gradient-to-r from-brand via-brand-accent to-brand"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
