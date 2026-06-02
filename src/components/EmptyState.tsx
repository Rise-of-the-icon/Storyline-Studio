import type { ReactNode } from "react";

export type EmptyStateTone = "neutral" | "subtle";

export interface EmptyStateProps {
  /** Short headline. Optional — many empties are a single body line. */
  title?: string;
  /** Required descriptive copy. */
  description: ReactNode;
  /** Optional CTA button(s); pass the project's `<Button>` instances. */
  action?: ReactNode;
  /** Small mono uppercase eyebrow above the title (e.g. "S3 · No events"). */
  eyebrow?: string;
  /**
   * `neutral` — solid border, slightly stronger card surface. Used for terminal empties
   *   (e.g. "no results — try a different name").
   * `subtle` — dashed border, faded card surface. Used for "nothing yet, but you can add"
   *   states (e.g. "no custom moments yet — add the behind-the-scenes beats").
   * Defaults to `subtle`.
   */
  tone?: EmptyStateTone;
  /** Optional id for `aria-labelledby` wiring from a parent landmark. */
  id?: string;
  /** Extra utility classes to nudge spacing inside specific layouts. */
  className?: string;
}

const TONE_STYLES: Record<EmptyStateTone, string> = {
  subtle: "border-dashed border-border bg-card/40",
  neutral: "border-border bg-card",
};

/**
 * Reusable empty / missing-data surface for the RICON wizard + studio.
 * Matches existing design tokens — replaces ad-hoc inline empty blocks
 * that duplicated this pattern in S1, S3, S4, SS1, and ResolverPanel.
 */
export function EmptyState({
  title,
  description,
  action,
  eyebrow,
  tone = "subtle",
  id,
  className,
}: EmptyStateProps) {
  return (
    <div
      id={id}
      role="status"
      className={[
        "flex flex-col items-center gap-3 rounded-lg border px-6 py-10 text-center",
        TONE_STYLES[tone],
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      {eyebrow && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
          {eyebrow}
        </p>
      )}
      {title && (
        <h3 className="font-display text-xl text-text">{title}</h3>
      )}
      <p className="max-w-prose font-body text-sm text-textsub">{description}</p>
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
