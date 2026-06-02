/**
 * Runtime hook reporting whether the user prefers reduced motion.
 *
 * Prefer the Tailwind variants (`motion-safe:` / `motion-reduce:`) for
 * the vast majority of cases — they're zero-JS, compile to a single
 * media query, and cover every CSS-driven animation in the app
 * (the shimmer sweep on `<Skeleton>`, the fade/slide on
 * `<StepTransition>`, the reveal transitions in `src/index.css`).
 *
 * Reserve this hook for cases the CSS variant cannot express, namely:
 *  - conditionally rendering an entire wrapper component (e.g. skipping
 *    a portal or animation framework setup when reduced motion is on)
 *  - branching prop values (e.g. selecting a non-animated icon variant
 *    or disabling auto-advancing carousels)
 *  - coordinating JS-driven, multi-step animations (e.g. a
 *    requestAnimationFrame loop that needs to short-circuit)
 *
 * SSR-safe: returns `false` on the first render if `window` /
 * `matchMedia` is unavailable so server-rendered markup stays stable
 * with the client's first paint.
 */

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
