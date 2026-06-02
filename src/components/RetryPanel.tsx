import type { ReactNode } from "react";
import { Button } from "./Button";
import { ErrorState, type ErrorStateTone } from "./ErrorState";

export interface RetryPanelProps {
  /** Short headline (e.g. "Save failed"). */
  title: string;
  /** What happened + what to do next. */
  description: ReactNode;
  /** Mono uppercase eyebrow above the title. */
  eyebrow?: string;
  /** Required: the retry handler. Wires the primary CTA. */
  onRetry: () => void;
  /** Optional override for the retry button copy. Defaults to "Retry". */
  retryLabel?: string;
  /**
   * Optional secondary action (e.g. "Back to guardrails"). Rendered as a
   * ghost button to the right of Retry.
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Disable the retry button — useful when a precondition still fails. */
  retryDisabled?: boolean;
  /** Tone forwarded to `ErrorState`. */
  tone?: ErrorStateTone;
  /** Optional id for `aria-labelledby` wiring. */
  id?: string;
  /** Extra utility classes for layout nudges. */
  className?: string;
}

/**
 * Convenience composition of `<ErrorState>` with a built-in Retry CTA.
 *
 * Use this whenever the recovery action is "try the same operation again"
 * — search API failure, draft save failure, import failure. For errors
 * that can't be retried (e.g. consent required → "Go to import"), use
 * `<ErrorState>` directly with a custom `action`.
 */
export function RetryPanel({
  title,
  description,
  eyebrow,
  onRetry,
  retryLabel = "Retry",
  secondaryAction,
  retryDisabled = false,
  tone,
  id,
  className,
}: RetryPanelProps) {
  return (
    <ErrorState
      id={id}
      title={title}
      description={description}
      eyebrow={eyebrow}
      tone={tone}
      className={className}
      action={
        <>
          <Button
            variant="primary"
            onClick={onRetry}
            disabled={retryDisabled}
          >
            {retryLabel}
          </Button>
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </>
      }
    />
  );
}
