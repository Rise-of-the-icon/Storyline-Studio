import { useEffect, useRef, useState, type ReactNode } from "react";

export interface TimelineRevealItemProps {
  children: ReactNode;
}

export function TimelineRevealItem({ children }: TimelineRevealItemProps) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      className={[
        "timeline-reveal",
        visible ? "timeline-reveal-visible" : "",
      ].join(" ")}
    >
      {children}
    </li>
  );
}
