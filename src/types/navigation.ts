export type ScreenId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";

export type StudioStepId = "SS1" | "SS2" | "SS3" | "SS4";

export const WIZARD_STEP_LABELS = [
  "Search",
  "Import",
  "Timeline",
  "Custom",
  "Guardrails",
  "Saved",
  "Studio",
] as const;

export const SCREEN_META: Record<
  ScreenId,
  { title: string; step: number; showWizardHeader: boolean }
> = {
  S1: { title: "Search", step: 1, showWizardHeader: false },
  S2: { title: "Profile Import", step: 2, showWizardHeader: true },
  S3: { title: "Timeline Review", step: 3, showWizardHeader: true },
  S4: { title: "Custom Moments", step: 4, showWizardHeader: true },
  S5: { title: "Guardrail Review", step: 5, showWizardHeader: true },
  S6: { title: "Draft Saved", step: 6, showWizardHeader: true },
  S7: { title: "Voice Studio", step: 7, showWizardHeader: false },
};

export const STUDIO_STEP_LABELS: Record<StudioStepId, string> = {
  SS1: "Event",
  SS2: "Scene",
  SS3: "Feeling",
  SS4: "Finalize",
};
