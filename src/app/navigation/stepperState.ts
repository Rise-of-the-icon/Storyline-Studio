import {
  SCREEN_META,
  WIZARD_SCREEN_ORDER,
  WIZARD_STEP_LABELS,
  type ScreenId,
} from "@/types/navigation";

export type StepState = "current" | "completed" | "visited" | "future";

export interface StepperItem {
  /** 1-based step index. */
  step: number;
  /** Screen id this step navigates to. */
  screenId: ScreenId;
  /** Short label rendered in the chip. */
  label: string;
  state: StepState;
  /** True when the user is allowed to navigate to this step. */
  navigable: boolean;
  /** Pre-built ARIA label for the chip. */
  ariaLabel: string;
}

/**
 * Derive the stepper item array from the current screen and the highest
 * step the user has reached.
 *
 * State rules:
 *  - `current` — the active step (always navigable: it's where you are).
 *  - `completed` — any step strictly before `current`.
 *  - `visited` — non-current step at index ≤ `completedThroughStep` (e.g.
 *    you've been to S6 and came back; S6 is still reachable).
 *  - `future` — anything beyond `completedThroughStep` — not navigable.
 *
 * `navigable === true` for current + completed + visited.
 */
export function deriveStepperItems(
  currentScreen: ScreenId,
  completedThroughStep: number,
): StepperItem[] {
  const currentStep = SCREEN_META[currentScreen].step;

  return WIZARD_STEP_LABELS.map((label, index): StepperItem => {
    const step = index + 1;
    const screenId = WIZARD_SCREEN_ORDER[index];

    let state: StepState;
    if (step === currentStep) state = "current";
    else if (step < currentStep) state = "completed";
    else if (step <= completedThroughStep) state = "visited";
    else state = "future";

    const navigable = state !== "future";

    const stateNote =
      state === "current"
        ? ", current step"
        : state === "completed"
          ? ", completed"
          : state === "visited"
            ? ", visited"
            : ", not available yet";

    return {
      step,
      screenId,
      label,
      state,
      navigable,
      ariaLabel: `Step ${step} of ${WIZARD_STEP_LABELS.length}, ${label}${stateNote}`,
    };
  });
}
