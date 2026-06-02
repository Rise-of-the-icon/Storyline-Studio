/**
 * Branded skeleton placeholders for RICON Studio.
 *
 * Per docs/05-STATES we prefer domain-shaped skeletons over generic spinners
 * — they hint at the *shape* of the real content that's about to land.
 *
 * Visual recipe (the brief — "cinematic, branded, intentional"):
 *  - dark `bg-card` surface with a hairline `border-border` outline + `rounded-lg`
 *  - a single low-contrast gold shimmer band sweeps left → right (~1.6s loop)
 *  - inner placeholder bars are flat `bg-panel` (no per-bar pulse — the
 *    shimmer is the only motion, so the card reads as one cohesive surface)
 *  - optional one-line mono caption (e.g. "Searching public sources…") that
 *    fades in from `opacity-0` so each branded loader can carry its own
 *    editorial copy when used outside a parent `<LoadingState>`
 *
 * Accessibility:
 *  - the shimmer band is `aria-hidden="true"` decorative — the audible
 *    "we're working on it" announcement is owned by the caller (`LoadingState`
 *    sets `aria-busy="true"` + `aria-live="polite"` on its wrapping section).
 *  - every animation is `motion-safe:`-gated so reduced-motion users see a
 *    static frame (border + caption stay; only the sweep is suppressed).
 *
 * Variants compose the base `<Skeleton>` so swapping a skeleton for the real
 * card preserves the same rounded-lg + border + padding rhythm — zero layout
 * shift when the data arrives.
 */

import type { ReactNode } from "react";

export interface SkeletonProps {
  /** Extra utility classes (layout nudges, width overrides). */
  className?: string;
  /**
   * Optional one-line caption rendered below the placeholder bars. Use
   * the centralized `src/lib/stateCopy.ts` constants — never inline strings
   * here so a copy change ships from a single edit.
   */
  caption?: string;
  /**
   * Inner shapes — typically `<SkeletonLine />` bars + small `bg-panel`
   * squares that hint at the layout of the real card.
   */
  children?: ReactNode;
}

/**
 * Base branded skeleton card. All other skeleton variants compose this so
 * the chrome (border, surface, shimmer, caption) stays consistent.
 */
export function Skeleton({ className = "", caption, children }: SkeletonProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-lg border border-border bg-card p-4",
        className,
      ]
        .join(" ")
        .trim()}
    >
      {/* Decorative shimmer sweep. Sits on top of the card surface but below
          the content layer. Pointer-events disabled so it can't intercept
          clicks; aria-hidden because the loading announcement is the
          caller's responsibility (see file-level comment). */}
      <div
        aria-hidden="true"
        className="skeleton-shimmer pointer-events-none absolute inset-0 motion-safe:animate-shimmer"
      />
      <div className="relative">{children}</div>
      {caption && (
        <p
          aria-hidden="true"
          className="relative mt-3 font-mono text-[11px] uppercase tracking-widest text-textmuted opacity-0 motion-safe:animate-fade-in motion-reduce:opacity-100"
        >
          {caption}
        </p>
      )}
    </div>
  );
}

/**
 * Small placeholder bar used inside the branded card. Intentionally
 * un-animated — the parent `<Skeleton>` carries the only motion (the
 * shimmer sweep) so the loading surface reads as one cohesive object,
 * not a strobe of pulsing dashes.
 */
export function SkeletonLine({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={["rounded bg-panel", className].join(" ")}
      aria-hidden="true"
    />
  );
}

/**
 * Search result row shape — matches the S1 `<button role="option">`
 * geometry (avatar + title + 2-line description).
 */
export function SearchResultSkeleton({
  caption,
}: {
  caption?: string;
} = {}) {
  return (
    <Skeleton caption={caption}>
      <div className="flex gap-3">
        <div className="h-14 w-14 rounded-md bg-panel" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-2/3" />
          <SkeletonLine className="h-3 w-full" />
        </div>
      </div>
    </Skeleton>
  );
}

/**
 * Timeline event card shape — matches the S3 `<EventRow>` geometry
 * (title, meta line, body, two action buttons).
 */
export function TimelineEventSkeleton({
  caption,
}: {
  caption?: string;
} = {}) {
  return (
    <Skeleton caption={caption}>
      <SkeletonLine className="h-4 w-1/2" />
      <SkeletonLine className="mt-3 h-3 w-full" />
      <SkeletonLine className="mt-2 h-3 w-4/5" />
      <div className="mt-4 flex gap-2">
        <SkeletonLine className="h-9 w-20" />
        <SkeletonLine className="h-9 w-16" />
      </div>
    </Skeleton>
  );
}

/**
 * Profile card shape — matches the S2 / S6 profile readout (24×24
 * thumbnail + name + 2-line description).
 */
export function ProfileCardSkeleton({
  caption,
}: {
  caption?: string;
} = {}) {
  return (
    <Skeleton caption={caption}>
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 rounded-lg bg-panel" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-5 w-1/2" />
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-3/4" />
        </div>
      </div>
    </Skeleton>
  );
}

/**
 * Right-panel / resolver shape — matches the Voice Studio side panels
 * (heading + body lines + 3 stacked param bars). Studio worker territory
 * is read-only here; this variant is exported so studio screens can opt
 * in to the branded loader once their refactor lands.
 */
export function StudioPanelSkeleton({
  caption,
}: {
  caption?: string;
} = {}) {
  return (
    <Skeleton caption={caption}>
      <SkeletonLine className="h-4 w-1/3" />
      <SkeletonLine className="mt-3 h-3 w-full" />
      <SkeletonLine className="mt-2 h-3 w-3/4" />
      <div className="mt-5 space-y-2">
        <SkeletonLine className="h-2 w-full" />
        <SkeletonLine className="h-2 w-full" />
        <SkeletonLine className="h-2 w-1/2" />
      </div>
    </Skeleton>
  );
}
