import { STUDIO_STEP_LABELS, type StudioStepId } from "../types/navigation";

const STEPS: StudioStepId[] = ["SS1", "SS2", "SS3", "SS4"];

export interface StudioBreadcrumbProps {
  current: StudioStepId;
  onSelect: (step: StudioStepId) => void;
}

export function StudioBreadcrumb({ current, onSelect }: StudioBreadcrumbProps) {
  return (
    <nav aria-label="Studio sub-steps" className="flex flex-wrap items-center gap-1">
      {STEPS.map((step, index) => {
        const isCurrent = step === current;
        const label = STUDIO_STEP_LABELS[step];
        // Screen reader announcement format:
        //   "Studio sub-step 2 of 4, Scene context, current step"
        //   "Studio sub-step 3 of 4, Emotional preview"
        const ariaLabel = isCurrent
          ? `Studio sub-step ${index + 1} of ${STEPS.length}, ${label}, current step`
          : `Studio sub-step ${index + 1} of ${STEPS.length}, ${label}`;
        return (
          <span key={step} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-textmuted" aria-hidden="true">
                ›
              </span>
            )}
            <button
              type="button"
              onClick={() => onSelect(step)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={ariaLabel}
              className={[
                "min-h-touch rounded-md px-2 font-mono text-xs uppercase tracking-wide sm:min-h-[36px]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                isCurrent
                  ? "text-gold"
                  : "text-textsub hover:text-text",
              ].join(" ")}
            >
              {label}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
