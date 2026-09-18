import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReadReceipts({ message, isMine, className }) {
  if (!isMine) return null;

  const status = message?.status;
  const seen = (message.readBy || []).length > 1;
  const delivered = (message.deliveredTo || []).length > 1;

  let key;
  let title;
  let node;

  if (status === "sending") {
    key = "sending";
    title = "Sending";
    node = <Loader2 className="h-3 w-3 animate-spin text-white/80" />;
  } else if (status === "error") {
    key = "error";
    title = "Failed to send";
    node = <span className="text-[10px] font-bold leading-none text-rose-300">!</span>;
  } else if (seen) {
    key = "seen";
    title = "Seen";
    node = <CheckCheck className="h-3.5 w-3.5 text-sky-300" />;
  } else if (delivered) {
    key = "delivered";
    title = "Delivered";
    node = <CheckCheck className="h-3.5 w-3.5 text-white/75" />;
  } else {
    key = "sent";
    title = "Sent";
    node = <Check className="h-3.5 w-3.5 text-white/85" />;
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={key}
        initial={{ opacity: 0, scale: 0.4, y: 3 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.4 }}
        transition={{ type: "spring", stiffness: 520, damping: 28 }}
        className={cn("inline-flex", className)}
        aria-label={title}
        title={title}
      >
        {node}
      </motion.span>
    </AnimatePresence>
  );
}
