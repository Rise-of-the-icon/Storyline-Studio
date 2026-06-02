import type { DigitalTwinProfile } from "../types/twin";
import { SCREEN_META, type ScreenId } from "../types/navigation";

/**
 * Should an "Exit" / "Go home" action from `screen` show a confirm modal?
 *
 * Returns `true` when the user has in-flight work that the home action would
 * orphan from their current view — even though the draft itself is auto-persisted
 * to `localStorage` on every edit, leaving the wizard mid-flight is the user
 * intent we want to confirm (not the data-loss they technically don't have).
 *
 * Rules:
 *  - No draft → nothing to lose.
 *  - Draft on a screen flagged `exitConfirms: false` (S1, S6) → free exit.
 *  - Draft on any other screen → confirm.
 */
export function hasUnsavedProgress(
  draft: DigitalTwinProfile | null,
  screen: ScreenId,
): boolean {
  if (!draft) return false;
  return SCREEN_META[screen].exitConfirms;
}
