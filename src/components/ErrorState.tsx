import type { ReactNode } from "react";

export type ErrorStateTone = "danger" | "warning";

export interface ErrorStateProps {
  /** Short headline (e.g. "Save failed", "Search unavailable"). */
  title: string;
  /**
   * Required descriptive copy. Per docs/05-STATES every error must answer
   * two questions: *what happened* and *what to do next*.
   */
  description: ReactNode;
  /**
   * Optional CTA(s) — pass `<Button>` instances. The most common shape is a
   * primary "Retry" + a ghost secondary. For the canonical retry layout
   * prefer `<RetryPanel>` which composes this one with a default Retry.
   */
  action?: ReactNode;
  /**
   * Small mono uppercase eyebrow above the title
   * (e.g. "S6 · Save error", "Search unavailable").
   */
  eyebrow?: string;
  /**
   * `danger`  — used for outright failures the producer must address before
   *             they can continue (e.g. save failed, import failed).
   * `warning` — used for "degraded but recoverable" surfaces (e.g. live API
   *             unavailable, falling back to demo subjects).
   * Defaults to `danger`.
   */
  tone?: ErrorStateTone;
  /** Optional id for `aria-labelledby` wiring from a parent landmark. */
  id?: string;
  /** Extra utility classes for layout nudges. */
  className?: string;
}

const TONE_STYLES: Record<ErrorStateTone, { surface: string; accent: string }> = {
  danger: {
    surface: "border-danger/40 bg-dangerfaint",
    accent: "text-danger",
  },
  warning: {
    surface: "border-gold/30 bg-goldfaint",
    accent: "text-gold",
  },
};

/**
 * Reusable error / failure surface for the RICON wizard + studio.
 *
 * - `role="alert"` so assistive tech immediately announces the failure.
 * - `tone="danger"` (default) for blocking failures; `tone="warning"` for
 *   degraded-but-usable states (e.g. search API down, demo fallback).
 *
 * Pairs with `<RetryPanel>` when the recovery action is "try again".
 */
export function ErrorState({
  title,
  description,
  action,
  eyebrow,
  tone = "danger",
  id,
  className,
}: ErrorStateProps) {
  const { surface, accent } = TONE_STYLES[tone];

  return (
    <div
      id={id}
      role="alert"
      className={[
        "flex flex-col items-center gap-3 rounded-lg border px-6 py-8 text-center",
        surface,
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      {eyebrow && (
        <p className={["font-mono text-[10px] uppercase tracking-widest", accent].join(" ")}>
          {eyebrow}
        </p>
      )}
      <h3 className={["font-display text-2xl", accent].join(" ")}>{title}</h3>
      <div className="max-w-prose font-body text-sm text-textsub">{description}</div>
      {action && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>
      )}
    </div>
  );
}
