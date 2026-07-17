import CountUp from "react-countup";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function AnimatedCounter({ end, suffix = "", duration = 2, label = "" }) {
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.3 });

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-bold text-gray-900">
        {isVisible ? (
          <CountUp end={end} duration={duration} suffix={suffix} separator="," />
        ) : (
          "0"
        )}
      </div>
      {label && <p className="mt-1 text-sm text-gray-500">{label}</p>}
    </div>
  );
}
