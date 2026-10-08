import { useEffect, useRef, useState } from "react";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

// Slides its content up softly when it scrolls into view.
// Content is always visible: only elements that start below the screen get the small offset.
export default function Reveal({ as = "div", className = "", children, ...rest }) {
  const Tag = as;
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (reduced || !el || el.getBoundingClientRect().top < window.innerHeight) return;

    setWaiting(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWaiting(false);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <Tag
      ref={ref}
      className={`transition-[transform,opacity] duration-[1200ms] ease-soft ${waiting ? "translate-y-7 opacity-35" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
