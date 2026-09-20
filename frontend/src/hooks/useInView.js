import { useEffect, useRef, useState } from "react";

export function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && options.once) observer.unobserve(el);
      },
      { rootMargin: options.rootMargin || "0px", threshold: options.threshold || 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options.once, options.rootMargin, options.threshold]);

  return [ref, inView];
}
