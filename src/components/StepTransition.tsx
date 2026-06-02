/**
 * Subtle screen / step transition wrapper.
 *
 * Why this exists: screen swaps in the wizard used to snap — the new
 * surface appeared in a single paint with no perceptual lead-in, which
 * made the app feel "tab-switch fast" but not "cinematic intentional".
 * This wrapper adds a 160–180ms fade (with an optional 8px slide in the
 * direction of travel) so the producer's eye has a beat to follow the
 * content into place. Cinematic, but never slow.
 *
 * Re-firing the animation per transition is the caller's responsibility:
 * set a `key` prop on `<StepTransition>` that changes with the screen id
 * (e.g. `<StepTransition key={screen}>...</StepTransition>`). React will
 * unmount + remount the wrapper, which retriggers the CSS animation.
 *
 * Accessibility:
 *  - All three animations are gated by `motion-safe:` so users with
 *    `prefers-reduced-motion: reduce` see the children land instantly
 *    with no fade and no slide. The layout is identical in both modes —
 *    only the entry choreography differs.
 *  - The wrapper is a plain `<div>` with no role / aria attributes, so
 *    focus management, landmark structure, and live regions inside the
 *    wrapped children are unaffected.
 *  - Animations are short (≤ 180ms) and the wrapper does not set
 *    `overflow: hidden`, so focus rings on children that paint mid-
 *    animation remain visible.
 */

import type { ReactNode } from "react";

export interface StepTransitionProps {
  children: ReactNode;
  /**
   * Direction of travel — drives an 8px horizontal slide in addition to
   * the base fade. Omit for the default pure-fade transition (the right
   * default for most mounts where the direction isn't meaningful).
   *
   *  - `"forward"` — slide-in from the right (entering deeper into the
   *    wizard / studio flow).
   *  - `"back"` — slide-in from the left (returning to a prior step).
   */
  direction?: "forward" | "back";
  /** Extra utility classes for layout nudges. */
  className?: string;
}

export function StepTransition({
  children,
  direction,
  className = "",
}: StepTransitionProps) {
  const animationClass =
    direction === "forward"
      ? "motion-safe:animate-slide-in-right"
      : direction === "back"
        ? "motion-safe:animate-slide-in-left"
        : "motion-safe:animate-fade-in";

  return (
    <div className={[animationClass, className].join(" ").trim()}>
      {children}
    </div>
  );
}
