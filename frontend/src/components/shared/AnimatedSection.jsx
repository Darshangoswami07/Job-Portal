import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const variants = {
  "fade-up": {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-left": {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },
  "fade-right": {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  },
  "scale-in": {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
};

export default function AnimatedSection({
  children,
  animation = "fade-up",
  duration = 0.5,
  delay = 0,
  className = "",
  as: Tag = motion.div,
}) {
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.1 });

  return (
    <Tag
      ref={ref}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={variants[animation] || variants["fade-up"]}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </Tag>
  );
}
