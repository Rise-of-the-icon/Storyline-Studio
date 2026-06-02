import { Tooltip } from "../components/Tooltip";

export interface InfoTipProps {
  /**
   * Short uppercase eyebrow shown in the tooltip header (also used to build
   * the trigger's `aria-label`).
   */
  label: string;
  /** One-or-two-sentence explanation. Capped at ≤ 220 chars in `studioCopy`. */
  description: string;
  /** Optional override for the trigger's aria-label. Defaults to "Explain {label}". */
  triggerAriaLabel?: string;
  className?: string;
}

/**
 * Small focus-visible info trigger paired with the canonical `<Tooltip>`.
 *
 * Renders an inline `<button type="button">` with an "ⓘ" glyph (rendered as
 * `aria-hidden="true"` so screen readers hear `aria-label` instead). The
 * underlying Tooltip handles open/close on hover, focus, blur, mouseleave,
 * and Escape — and clones the button to set `aria-describedby` directly on
 * it while open, so AT announces the description for the focused trigger.
 *
 * Use beside any control label whose meaning isn't obvious to a first-time
 * producer (Audience, Steering tag, the resolver axes, etc.).
 */
export function InfoTip({
  label,
  description,
  triggerAriaLabel,
  className = "",
}: InfoTipProps) {
  const ariaLabel = triggerAriaLabel ?? `Explain ${label}`;

  return (
    <Tooltip label={label} content={description}>
      <button
        type="button"
        aria-label={ariaLabel}
        className={[
          "inline-flex h-5 w-5 items-center justify-center rounded-full border border-bordermid bg-card font-mono text-[10px] leading-none text-textsub",
          "transition-colors hover:border-gold hover:text-gold",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          className,
        ].join(" ")}
      >
        <span aria-hidden="true">i</span>
      </button>
    </Tooltip>
  );
}
