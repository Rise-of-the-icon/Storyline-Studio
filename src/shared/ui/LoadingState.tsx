import type { ReactNode } from "react";

export interface LoadingStateProps {
  /** Short headline shown to sighted users. Also announced via aria-live. */
  title: string;
  /** Optional supporting line — e.g. "Generating timeline from Wikipedia". */
  description?: string;
  /** Small mono uppercase eyebrow above the title (e.g. "S2 · Profile"). */
  eyebrow?: string;
  /**
   * Optional skeleton(s) shown below the copy. Per docs/05-STATES we prefer
   * domain-shaped skeletons (ProfileCardSkeleton, TimelineEventSkeleton,
   * SearchResultSkeleton) over generic spinners — they hint at the *shape*
   * of what's coming.
   */
  skeleton?: ReactNode;
  /** Optional id for `aria-labelledby` wiring from a parent landmark. */
  id?: string;
  /** Extra utility classes for layout nudges. */
  className?: string;
}

/**
 * Reusable loading surface used across the wizard + studio. Wraps the
 * `aria-busy` + `aria-live="polite"` choreography so individual screens
 * don't have to remember it.
 *
 * Use this for blocking-style loads where the user is waiting on the data:
 *  - S2 initial profile load
 *  - S2 import in flight
 *  - S3 timeline rehydrate
 *  - S6 draft save
 *
 * For inline result loading (typed query → search results streaming in)
 * keep the skeleton-only pattern in `S1Search` — the screen is still usable
 * and announcing every keystroke would be noisy.
 */
export function LoadingState({
  title,
  description,
  eyebrow,
  skeleton,
  id,
  className,
}: LoadingStateProps) {
  // Titles centralized in `src/lib/stateCopy.ts` end with a Unicode `…` as
  // part of the editorial voice ("Searching public sources…"). Detect that
  // and skip the decorative animated gold `…` we used to append, otherwise
  // we'd render a double-ellipsis ("Searching public sources… …"). When
  // the caller supplies a title without trailing ellipsis (legacy / ad-hoc
  // loaders), the gold pulse still fires so the surface keeps its motion.
  const trailingEllipsis = /…\s*$/.test(title);

  return (
    <section
      id={id}
      aria-busy="true"
      aria-live="polite"
      className={[
        "mx-auto max-w-[680px] px-4 py-12",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      {eyebrow && (
        <p className="label-mono">
          {eyebrow}
        </p>
      )}
      <p className="mt-1 font-display text-2xl tracking-wide text-text">
        {title}
        {!trailingEllipsis && (
          <span
            aria-hidden="true"
            className="ml-1 inline-block text-gold motion-safe:animate-pulse"
          >
            …
          </span>
        )}
      </p>
      {description && (
        <p className="mt-2 font-body text-sm text-textsub">{description}</p>
      )}
      {skeleton && <div className="mt-8 space-y-4">{skeleton}</div>}
    </section>
  );
}
