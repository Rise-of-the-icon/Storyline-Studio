import type { ScreenId, StudioStepId } from "@/types/navigation";

/** Primary forward transition per docs/04-SCREENS.md navigation map. */
export function getForwardScreen(screen: ScreenId): ScreenId | null {
  const map: Record<ScreenId, ScreenId | null> = {
    S1: "S2",
    S2: "S3",
    S3: "S4",
    S4: "S5",
    S5: "S6",
    S6: "S7",
    S7: null,
  };
  return map[screen];
}

/** Back transition (S6 returns to S3 per nav map). */
export function getBackScreen(screen: ScreenId): ScreenId | null {
  const map: Record<ScreenId, ScreenId | null> = {
    S1: null,
    S2: "S1",
    S3: "S2",
    S4: "S3",
    S5: "S4",
    S6: "S3",
    S7: "S6",
  };
  return map[screen];
}

/** S5 rejection loop → S4. */
export const GUARDRAIL_REJECTION_SCREEN: ScreenId = "S4";

export function getForwardStudioStep(step: StudioStepId): StudioStepId | null {
  const order: StudioStepId[] = ["SS1", "SS2", "SS3", "SS4"];
  const i = order.indexOf(step);
  return i < order.length - 1 ? order[i + 1] : null;
}

export function getBackStudioStep(step: StudioStepId): StudioStepId | null {
  const order: StudioStepId[] = ["SS1", "SS2", "SS3", "SS4"];
  const i = order.indexOf(step);
  return i > 0 ? order[i - 1] : null;
}
