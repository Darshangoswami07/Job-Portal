import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Play, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MediaGallery({ media = [], onLightbox, lightboxOpen, onCloseLightbox }) {
  const [index, setIndex] = useState(0);
  const images = media.filter((m) => m.type === "image");

  if (media.length === 0) return null;

  const gridClass =
    media.length === 1
      ? "grid-cols-1"
      : media.length === 2
        ? "grid-cols-2"
        : media.length === 3
          ? "grid-cols-2 grid-rows-2"
          : "grid-cols-2 grid-rows-3";

  const item = media[Math.min(index, media.length - 1)];
  const isVideo = item?.type === "video";
  const isDocument = item?.type === "document" || item?.type === "pdf" || item?.type === "docx" || item?.type === "ppt";

  return (
    <>
      <div className={cn("grid gap-1.5 overflow-hidden", gridClass)}>
        {media.map((m, i) => {
          const last = i === media.length - 1;
          const isDoc = m.type === "document" || m.type === "pdf" || m.type === "docx" || m.type === "ppt";
          return (
            <motion.button
              key={m.url + i}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => onLightbox(i)}
              className={cn(
                "relative group overflow-hidden bg-muted/40 focus:outline-none",
                media.length === 3 ? (i === 0 ? "row-span-2" : "col-span-1") : "",
                media.length === 4 ? (i === 0 ? "row-span-2" : "") : "",
                last && media.length > 4 ? "col-span-2 row-span-1" : ""
              )}
              aria-label={`Open media ${i + 1}`}
            >
              {m.type === "image" ? (
                <img
                  src={m.url}
                  alt={m.name || `Media ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover aspect-[4/3] transition-transform duration-500 group-hover:scale-105"
                />
              ) : isDoc ? (
                <div className="flex aspect-[4/3] h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <FileText className="size-8 text-orange-500" />
                  <span className="px-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 line-clamp-2">
                    {m.name || "Document"}
                  </span>
                </div>
              ) : (
                <div className="relative flex aspect-[4/3] h-full w-full items-center justify-center bg-black">
                  <video src={m.url} muted playsInline preload="metadata" className="h-full w-full object-cover opacity-90" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-black/50 backdrop-blur">
                      <Play className="size-5 fill-white text-white" />
                    </span>
                  </span>
                </div>
              )}
              {last && media.length > 4 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
                  +{media.length - 4}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {lightboxOpen && media[lightboxOpen] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseLightbox}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          >
            <button
              onClick={onCloseLightbox}
              className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <div className="max-h-[85vh] max-w-4xl w-full overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
              {media[lightboxOpen].type === "image" ? (
                <img src={media[lightboxOpen].url} alt="Preview" className="max-h-[85vh] w-full object-contain" />
              ) : media[lightboxOpen].type === "video" ? (
                <video src={media[lightboxOpen].url} controls autoPlay className="max-h-[85vh] w-full" />
              ) : (
                <div className="flex h-[60vh] flex-col items-center justify-center gap-3 bg-slate-900 text-white">
                  <FileText className="size-12 text-orange-400" />
                  <p className="max-w-md truncate px-4 text-center text-sm">{media[lightboxOpen].name}</p>
                  <a
                    href={media[lightboxOpen].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                  >
                    Open document
                  </a>
                </div>
              )}
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => setIndex((lightboxOpen - 1 + media.length) % media.length)}
                  className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label="Previous"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="text-sm font-semibold text-white">
                  {lightboxOpen + 1} / {media.length}
                </span>
                <button
                  onClick={() => setIndex((lightboxOpen + 1) % media.length)}
                  className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label="Next"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}