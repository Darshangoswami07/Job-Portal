import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Software Engineer",
    company: "Google",
    text: "JobPilot Ai helped me find my dream role at Google. The platform made it incredibly easy to connect with recruiters.",
    avatar: "SJ",
  },
  {
    name: "Michael Chen",
    role: "Product Manager",
    company: "Microsoft",
    text: "I was impressed by the quality of job listings. Within two weeks of signing up, I had multiple interviews lined up.",
    avatar: "MC",
  },
  {
    name: "Emily Rodriguez",
    role: "UX Designer",
    company: "Apple",
    text: "The search filters and job recommendations were spot-on. Found a position that perfectly matched my skills.",
    avatar: "ER",
  },
  {
    name: "David Kim",
    role: "Data Scientist",
    company: "Amazon",
    text: "The application tracking feature saved me hours. I could see exactly where I stood in the hiring process.",
    avatar: "DK",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const t = testimonials[current];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What Our Users Say</h2>
        <p className="text-gray-500 mb-10 max-w-xl mx-auto">
          Hear from professionals who found their next opportunity through JobPilot Ai
        </p>

        <div className="relative min-h-[260px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="bg-white border border-gray-200 rounded-2xl card-shadow p-8 md:p-10"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {t.avatar}
                </div>
              </div>

              <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-6 italic">
                &ldquo;{t.text}&rdquo;
              </p>

              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">
                  {t.role} at {t.company}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-blue-600"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
