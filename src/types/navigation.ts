export type ScreenId =
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "S6"
  | "S7";

export type StudioStepId = "SS1" | "SS2" | "SS3" | "SS4";

/**
 * Names that appear in the stepper / AppHeader breadcrumb. Order matters —
 * the index is the step number. Mirrors `SCREEN_META[*].step`.
 */
export const WIZARD_STEP_LABELS = [
  "Search",
  "Import",
  "Timeline",
  "Custom",
  "Guardrails",
  "Saved",
  "Studio",
] as const;

/** Ordered screen ids parallel to `WIZARD_STEP_LABELS`. */
export const WIZARD_SCREEN_ORDER: ScreenId[] = [
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
];

/**
 * Per-screen metadata used by the AppHeader and WizardStepper.
 *
 * - `title`           full title shown in the AppHeader subtitle row.
 * - `stepLabel`       short label used in the stepper chip.
 * - `step`            1-based step index for stepper math.
 * - `showWizardHeader` whether to render the stepper row.
 * - `exitConfirms`    whether a global "Exit" / logo-home from this screen
 *                     should pop the unsaved-changes confirm.
 */
export const SCREEN_META: Record<
  ScreenId,
  {
    title: string;
    stepLabel: string;
    step: number;
    showWizardHeader: boolean;
    exitConfirms: boolean;
  }
> = {
  S1: {
    title: "Search",
    stepLabel: "Search",
    step: 1,
    showWizardHeader: false,
    exitConfirms: false,
  },
  S2: {
    title: "Profile Import",
    stepLabel: "Import",
    step: 2,
    showWizardHeader: true,
    exitConfirms: true,
  },
  S3: {
    title: "Timeline Review",
    stepLabel: "Timeline",
    step: 3,
    showWizardHeader: true,
    exitConfirms: true,
  },
  S4: {
    title: "Custom Moments",
    stepLabel: "Custom",
    step: 4,
    showWizardHeader: true,
    exitConfirms: true,
  },
  S5: {
    title: "Guardrail Review",
    stepLabel: "Guardrails",
    step: 5,
    showWizardHeader: true,
    exitConfirms: true,
  },
  S6: {
    title: "Draft Saved",
    stepLabel: "Saved",
    step: 6,
    showWizardHeader: true,
    // Draft is explicitly committed at S6 — exiting is a normal handoff,
    // not a destructive action.
    exitConfirms: false,
  },
  S7: {
    title: "Voice Studio",
    stepLabel: "Studio",
    step: 7,
    showWizardHeader: false,
    // Studio scene state isn't persisted; warn before tossing it.
    exitConfirms: true,
  },
};

export const STUDIO_STEP_LABELS: Record<StudioStepId, string> = {
  SS1: "Event",
  SS2: "Scene",
  SS3: "Feeling",
  SS4: "Finalize",
};
