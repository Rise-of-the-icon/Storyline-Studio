import { WIZARD_STEP_LABELS } from "../types/navigation";

export interface ProgressBarProps {
  /** 1-based index of the active wizard step */
  currentStep: number;
  /** Highest step the user has reached (for completed styling) */
  completedThrough: number;
}

export function ProgressBar({ currentStep, completedThrough }: ProgressBarProps) {
  return (
    <nav aria-label="Wizard progress">
      <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
        {WIZARD_STEP_LABELS.map((label, index) => {
          const step = index + 1;
          const isCurrent = step === currentStep;
          const isComplete = step < currentStep;
          const isVisited =
            !isCurrent && !isComplete && step <= completedThrough;

          return (
            <li key={label} className="flex items-center gap-1 sm:gap-2">
              <span
                className={[
                  "flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full border font-mono text-[10px] sm:text-xs",
                  isCurrent
                    ? "border-gold bg-goldfaint text-gold"
                    : isComplete || isVisited
                      ? "border-ok/40 bg-okfaint text-ok"
                      : "border-border bg-panel text-textmuted",
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? (
                  <span aria-hidden="true">✓</span>
                ) : (
                  <span aria-hidden="true">{step}</span>
                )}
                <span className="sr-only">
                  {label}
                  {isCurrent ? ", current step" : isComplete ? ", completed" : ""}
                </span>
              </span>
              <span
                className={[
                  "hidden font-mono text-[10px] uppercase tracking-wider sm:inline",
                  isCurrent
                    ? "text-gold"
                    : isComplete || isVisited
                      ? "text-textsub"
                      : "text-textmuted",
                ].join(" ")}
                aria-hidden="true"
              >
                {label}
              </span>
              {index < WIZARD_STEP_LABELS.length - 1 && (
                <span
                  className="mx-0.5 hidden h-px w-3 bg-border sm:inline-block"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
