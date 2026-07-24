import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CTABanner({
  title,
  subtitle,
  buttonText = "Get Started",
  buttonLink = "/signup",
  gradient = "from-[#0A66C2] via-[#004182] to-[#002244]",
  className,
}) {
  const navigate = useNavigate();

  return (
    <section className={cn("relative overflow-hidden bg-gradient-to-br", gradient, className)}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{title}</h2>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-8">{subtitle}</p>
          <Button
            onClick={() => navigate(buttonLink)}
            className="bg-white text-[#0A66C2] hover:bg-blue-50 rounded-xl px-8 py-5 text-base font-semibold shadow-lg"
          >
            {buttonText}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
