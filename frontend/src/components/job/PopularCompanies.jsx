import { motion, useAnimationControls } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const companies = [
  "Google", "Microsoft", "Amazon", "Netflix", "Adobe",
  "Apple", "Meta", "IBM", "Oracle", "Spotify",
];

export default function PopularCompanies() {
  const controls = useAnimationControls();
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    let mounted = true;

    const animate = async () => {
      while (mounted) {
        if (isPausedRef.current) {
          controls.stop();
          await new Promise((r) => setTimeout(r, 50));
          continue;
        }
        await controls.start({
          x: "-50%",
          transition: { duration: 30, ease: "linear" },
        });
        if (mounted && !isPausedRef.current) {
          controls.set({ x: "0%" });
        }
      }
    };

    animate();
    return () => {
      mounted = false;
    };
  }, [controls]);

  return (
    <section className="py-12 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Trusted By Industry Leaders</h2>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto">
          Top companies trust JobHub to find exceptional talent
        </p>
      </div>

      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="overflow-hidden"
      >
        <motion.div
          animate={controls}
          className="flex items-center gap-16 w-max"
        >
          {[...companies, ...companies].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="shrink-0 w-40 h-16 bg-gray-100 rounded-xl flex items-center justify-center px-4"
            >
              <span className="text-sm font-semibold text-gray-400 tracking-wide uppercase select-none">
                {name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
