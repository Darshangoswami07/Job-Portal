import { motion } from "framer-motion";
import { useMemo } from "react";

export default function AnimatedBackground() {
  const dots = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 2.5 + 1,
        delay: Math.random() * 8,
        duration: Math.random() * 8 + 18,
      })),
    []
  );

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 20px) scale(0.9); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 30px) scale(1.15); }
          66% { transform: translate(30px, -50px) scale(0.85); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, 40px) scale(0.9); }
          66% { transform: translate(-40px, -40px) scale(1.1); }
        }
      `}</style>
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.05] dark:opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, #0A66C2 0%, transparent 70%)",
          animation: "blob1 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/4 -right-40 w-[450px] h-[450px] rounded-full opacity-[0.08] dark:opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, #6B7280 0%, transparent 70%)",
          animation: "blob2 25s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, #60A5FA 0%, transparent 70%)",
          animation: "blob3 18s ease-in-out infinite",
        }}
      />
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          initial={{ opacity: 0 }}
          className="absolute rounded-full bg-gray-400/40 dark:bg-gray-500/30"
          style={{
            left: `${dot.x}%`,
            bottom: "-10px",
            width: `${dot.size}px`,
            height: `${dot.size}px`,
          }}
          animate={{
            y: [0, -1200],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
