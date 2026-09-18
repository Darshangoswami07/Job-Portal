import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { formatDuration } from "@/utils/chat";
import { cn } from "@/lib/utils";

const BAR_COUNT = 24;

export default function VoiceMessagePlayer({ url, duration, isMine }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bubbleProgress, setBubbleProgress] = useState(0);
  const durationValue = duration || 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      const p = audio.duration ? audio.currentTime / audio.duration : 0;
      setProgress(p);
      setBubbleProgress(Math.floor(p * BAR_COUNT));
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      setBubbleProgress(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [url]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <audio ref={audioRef} src={url} preload="metadata" />
      <motion.button
        type="button"
        onClick={toggle}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-md transition-colors",
          isMine
            ? "bg-white text-indigo-600 hover:bg-slate-50"
            : "bg-gradient-to-br from-indigo-500 to-blue-600 text-white"
        )}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
      </motion.button>

      <div className="flex h-8 flex-1 items-center gap-[2px]">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-full transition-all duration-150",
              isMine
                ? "bg-white/80"
                : i % 3 === 0
                  ? "bg-indigo-300 dark:bg-indigo-500/60"
                  : "bg-indigo-100 dark:bg-indigo-500/25"
            )}
            style={{
              height: `${18 + ((i * 7) % 18)}px`,
              opacity: i <= bubbleProgress ? 1 : 0.45,
            }}
          />
        ))}
      </div>
      <span className={cn("shrink-0 text-[11px] font-semibold tabular-nums", isMine ? "text-white/80" : "text-slate-500 dark:text-slate-400")}>
        {formatDuration(durationValue * progress)} / {formatDuration(durationValue)}
      </span>
    </div>
  );
}
