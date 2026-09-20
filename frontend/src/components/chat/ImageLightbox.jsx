import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setLightbox } from "@/store/slices/chatSlice";

function LightboxStage({ lightbox, onClose }) {
  const [scale, setScale] = useState(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(3, s + 0.25))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <a
          href={lightbox.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Download image"
        >
          <Download className="h-5 w-5" />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <motion.img
        src={lightbox.url}
        alt={lightbox.name || "Preview"}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
      />
    </motion.div>
  );
}

export default function ImageLightbox() {
  const dispatch = useDispatch();
  const lightbox = useSelector((s) => s.chat.lightbox);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "Escape") dispatch(setLightbox(null));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, dispatch]);

  return (
    <AnimatePresence>
      {lightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => dispatch(setLightbox(null))}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <LightboxStage key={lightbox.url} lightbox={lightbox} onClose={() => dispatch(setLightbox(null))} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
