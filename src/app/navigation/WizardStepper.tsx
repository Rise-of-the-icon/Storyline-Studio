import { useEffect, useRef } from "react";
import { deriveStepperItems, type StepperItem } from "@/app/navigation/stepperState";
import type { ScreenId } from "@/types/navigation";

export interface WizardStepperProps {
  currentScreen: ScreenId;
  completedThroughStep: number;
  /** Called when the user clicks a navigable chip. */
  onSelect: (screen: ScreenId) => void;
}

/**
 * The full wizard breadcrumb. Renders Search → Import → Timeline → Custom →
 * Guardrails → Saved → Studio with state-aware chips.
 *
 * - `current`   gold pill, `aria-current="step"`, not clickable (you're there).
 * - `completed` ok-green pill with ✓; clickable, jumps back to that step.
 * - `visited`   ok-green outline, clickable (you've been to a later step
 *               and may want to revisit).
 * - `future`    muted, `disabled`, not clickable.
 *
 * Mobile (<sm): the row becomes a horizontal scroller and the current chip
 * scrolls itself into view so users always see where they are.
 */
export function WizardStepper({
  currentScreen,
  completedThroughStep,
  onSelect,
}: WizardStepperProps) {
  const items = deriveStepperItems(currentScreen, completedThroughStep);
  const currentRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [currentScreen]);

  return (
    <nav aria-label="Wizard progress" className="-mx-1">
      <ol className="wizard-stepper-scroll flex items-center gap-1 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:gap-2 sm:pb-0">
        {items.map((item, index) => (
          <li
            key={item.step}
            className="flex shrink-0 items-center gap-1 sm:gap-2"
          >
            <StepperChip
              item={item}
              onSelect={onSelect}
              ref={item.state === "current" ? currentRef : undefined}
            />
            {index < items.length - 1 && (
              <span
                className="hidden h-px w-3 shrink-0 bg-border sm:inline-block"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface StepperChipProps {
  item: StepperItem;
  onSelect: (screen: ScreenId) => void;
  ref?: React.Ref<HTMLButtonElement>;
}

function StepperChip({ item, onSelect, ref }: StepperChipProps) {
  const { state, label, step, ariaLabel, navigable, screenId } = item;

  // Chip number / ✓ swatch.
  const swatchClass =
    state === "current"
      ? "border-gold bg-goldfaint text-gold"
      : state === "completed" || state === "visited"
        ? "border-ok/40 bg-okfaint text-ok"
        : "border-border bg-panel text-textmuted";

  // Label color tracks state.
  const labelClass =
    state === "current"
      ? "text-gold"
      : state === "completed" || state === "visited"
        ? "text-textsub"
        : "text-textmuted";

  const isInteractive = navigable && state !== "current";

  return (
    <button
      ref={ref}
      type="button"
      aria-current={state === "current" ? "step" : undefined}
      aria-label={ariaLabel}
      disabled={!isInteractive}
      onClick={() => isInteractive && onSelect(screenId)}
      className={[
        // `min-h-touch` keeps the chip tappable per WCAG even though the
        // visual swatch stays compact. The padding scales up on `sm:` only
        // so the stepper doesn't dominate small viewports.
        "group flex min-h-touch items-center gap-1 rounded-full px-1 py-1 sm:min-h-0 sm:gap-2 sm:px-1.5",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        isInteractive
          ? "cursor-pointer hover:bg-hover"
          : "cursor-default",
        !navigable ? "opacity-60" : "",
      ].join(" ")}
    >
      <span
        className={[
          "flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full border font-mono text-[10px] sm:min-h-[32px] sm:min-w-[32px] sm:text-xs",
          state === "completed" ? "cinematic-step-complete" : "",
          swatchClass,
        ].join(" ")}
        aria-hidden="true"
      >
        {state === "completed" ? "✓" : step}
      </span>
      <span
        className={[
          "whitespace-nowrap font-mono text-[10px] uppercase tracking-widest sm:text-[11px]",
          labelClass,
        ].join(" ")}
        aria-hidden="true"
      >
        {label}
      </span>
    </button>
  );
}
