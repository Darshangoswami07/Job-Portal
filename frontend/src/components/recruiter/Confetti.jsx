import { motion } from "framer-motion";

const COLORS = ["#4F46E5", "#0A66C2", "#7C3AED", "#F59E0B", "#10B981", "#EC4899", "#06B6D4"];

export default function Confetti({ show = false }) {
  if (!show) return null;

  const pieces = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: (i * 37) % 100,
    delay: (i % 12) * 0.05,
    color: COLORS[i % COLORS.length],
    rotation: (i % 5) * 90,
    size: 6 + (i % 4) * 2,
  }));

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ top: "-5%", left: `${p.x}%`, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{
            top: "105%",
            left: `${Math.min(95, Math.max(2, p.x + ((p.id % 3) - 1) * 18))}%`,
            opacity: [1, 1, 0.6, 0],
            rotate: p.rotation + 360 * (p.id % 2 === 0 ? 1 : -1),
            scale: 1,
          }}
          transition={{ duration: 2.4 + (p.id % 5) * 0.2, delay: p.delay, ease: "easeIn" }}
          className="absolute block rounded-[2px]"
          style={{
            width: p.size,
            height: p.size * 0.55,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

export function SuccessCheck({ show = false, className = "" }) {
  return (
    <motion.svg
      viewBox="0 0 52 52"
      className={`size-16 ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={show ? { scale: 1, opacity: 1 } : {}}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <motion.circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke="#10B981"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={show ? { pathLength: 1 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d="M14 27l8 8 16-17"
        fill="none"
        stroke="#10B981"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={show ? { pathLength: 1 } : {}}
        transition={{ delay: 0.45, duration: 0.4, ease: "easeOut" }}
      />
    </motion.svg>
  );
}
