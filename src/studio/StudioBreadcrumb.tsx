import { STUDIO_STEP_LABELS, type StudioStepId } from "../types/navigation";

const STEPS: StudioStepId[] = ["SS1", "SS2", "SS3", "SS4"];

export interface StudioBreadcrumbProps {
  current: StudioStepId;
  onSelect: (step: StudioStepId) => void;
}

export function StudioBreadcrumb({ current, onSelect }: StudioBreadcrumbProps) {
  return (
    <nav aria-label="Studio steps" className="flex flex-wrap items-center gap-1">
      {STEPS.map((step, index) => {
        const isCurrent = step === current;
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
              className={[
                "min-h-[36px] rounded-md px-2 font-mono text-xs uppercase tracking-wide",
                "focus:outline-none focus:ring-2 focus:ring-gold",
                isCurrent
                  ? "text-gold"
                  : "text-textsub hover:text-text",
              ].join(" ")}
            >
              {STUDIO_STEP_LABELS[step]}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
