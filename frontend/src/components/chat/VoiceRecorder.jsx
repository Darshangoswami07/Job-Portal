import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";
import { toast } from "sonner";
import { formatDuration } from "@/utils/chat";
import { cn } from "@/lib/utils";

const BAR_COUNT = 26;
const CANCEL_DISTANCE = 120;

export default function VoiceRecorder({ onCaptured, disabled }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [cancelActive, setCancelActive] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startXRef = useRef(0);
  const cancelRef = useRef(false);
  const [barHeights, setBarHeights] = useState(() =>
    Array.from({ length: BAR_COUNT }, () => 6)
  );

  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
      setBarHeights(
        Array.from({ length: BAR_COUNT }, () => 4 + Math.random() * 22)
      );
    }, 250);
    return () => clearInterval(interval);
  }, [recording]);

  const stopRecorder = useCallback(() => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks?.().forEach((t) => t.stop());
  }, []);

  const handlePointerDown = async (e) => {
    if (disabled) return;
    e.preventDefault();
    startXRef.current = e.clientX;
    cancelRef.current = false;
    setCancelActive(false);
    setSeconds(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const mime = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        setRecording(false);
        setSeconds((s) => {
          if (!cancelRef.current && s >= 1) {
            const url = URL.createObjectURL(blob);
            onCaptured(blob, s, url, mime);
          }
          return 0;
        });
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (error) {
      toast.error(error?.name === "NotAllowedError"
        ? "Microphone access denied. Please allow microphone access."
        : "Unable to start recording.");
    }
  };

  const handlePointerMove = (e) => {
    if (!recording) return;
    if (startXRef.current - e.clientX > CANCEL_DISTANCE) {
      cancelRef.current = true;
      setCancelActive(true);
    } else {
      cancelRef.current = false;
      setCancelActive(false);
    }
  };

  const handlePointerUp = () => {
    if (!recording) return;
    if (cancelRef.current) {
      setRecording(false);
      setSeconds(0);
      stopRecorder();
      toast.info("Voice message cancelled");
      return;
    }
    stopRecorder();
  };

  return (
    <div
      className="flex items-center"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      <button
        type="button"
        disabled={disabled}
        onPointerDown={handlePointerDown}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          recording
            ? "bg-rose-500 text-white"
            : "text-slate-500 hover:bg-slate-100 hover:text-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800",
          disabled && "opacity-40"
        )}
        aria-label={recording ? "Recording… release to send" : "Record voice message"}
      >
        <Mic className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, x: 8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.9 }}
            className={cn(
              "ml-1 flex items-center gap-2 rounded-2xl border px-3 py-1.5 shadow-lg",
              cancelActive
                ? "border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            )}
          >
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            <span className="flex h-6 items-end gap-[2px]">
              {barHeights.map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-indigo-500 transition-all duration-150"
                  style={{ height: `${h}px` }}
                />
              ))}
            </span>
            <span className="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
              {formatDuration(seconds)}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              {cancelActive ? <X className="h-3.5 w-3.5 text-rose-500" /> : "← Slide to cancel"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
