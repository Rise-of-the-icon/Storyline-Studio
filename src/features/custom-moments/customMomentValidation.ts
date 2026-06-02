/**
 * Pure validation rules for the Custom Moment drawer.
 *
 * Lives outside the React component so it can be unit-tested in node without
 * `jsdom`, and so the same rules can be reused later from a server-side
 * validator (Phase 2). The drawer calls `validateCustomMomentForm(form)`
 * before save; if `isValid` is `false`, it surfaces each error inline under
 * the matching field.
 *
 * Three rules drive the UX:
 *
 *   1. **Hard-required fields** — title, date, description.
 *   2. **Conditional-required field** — `sourceNotes` becomes required when
 *      visibility is `Public`. The principle is "anything we may surface in
 *      the story output must carry an audit trail."
 *   3. **Recommended-but-optional** — `emotionalSignificance`. Empty produces
 *      a warning (`recommended`), not an error (`errors`). The drawer renders
 *      the warning in muted copy, not danger, and the form still saves.
 *
 * Hard character caps mirror the brief: title 80, description 600,
 * emotionalSignificance 400, sourceNotes 400. These are tighter than the
 * sanitizer's own `FIELD_MAX_LENGTH` (which is the *safety* ceiling for
 * persistence) — the UI caps are about producer-readable copy, not safety.
 */

import type { Visibility } from "@/types/twin";

export const CUSTOM_MOMENT_FIELD_LIMITS = {
  title: 80,
  description: 600,
  emotionalSignificance: 400,
  sourceNotes: 400,
} as const;

export const CUSTOM_MOMENT_HELPER_TEXT = {
  title: "Name the moment in plain language.",
  date: "Use a year or approximate date.",
  description: "Describe what happened.",
  emotionalSignificance:
    "Why this moment matters to the subject's voice or identity.",
  sourceNotes: "Where this came from or who verified it.",
  sourceUrl: "Optional — paste a single URL the team can open to corroborate.",
} as const;

export const VISIBILITY_GUIDANCE: Record<Visibility, string> = {
  Private: "Only visible in this draft. Default for sensitive material.",
  Internal: "Producer and team use. Never surfaced in story output.",
  Public:
    "May be shown in story output — source notes required so we can stand behind it.",
};

export const SENSITIVITY_GUIDANCE = {
  Low: "Public-record material. Safe for unrestricted use.",
  Medium: "Personal but not protected. Producer judgement applies.",
  High: "Sensitive or contested. Requires editorial review in S5.",
} as const;

/**
 * Shape the drawer maintains in local state. Mirrors
 * `CustomMomentFormValues` from `CustomMomentDrawer.tsx`, kept narrow here so
 * the validator stays decoupled from the component.
 */
export interface CustomMomentFormShape {
  title: string;
  date: string;
  description: string;
  emotionalSignificance: string;
  sourceNotes: string;
  sourceUrl: string;
  visibility: Visibility;
}

export type CustomMomentField =
  | "title"
  | "date"
  | "description"
  | "emotionalSignificance"
  | "sourceNotes"
  | "sourceUrl";

export interface CustomMomentValidationResult {
  isValid: boolean;
  errors: Partial<Record<CustomMomentField, string>>;
  /**
   * Soft, non-blocking warnings. The drawer still saves when this is the only
   * thing present, but renders the message under the field in muted copy.
   */
  recommended: Partial<Record<CustomMomentField, string>>;
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function isLikelyUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true; // empty URL is allowed (optional)
  // Pragmatic check — matches https://x, http://y, etc. Real validation is
  // delegated to the browser when the user clicks the rendered link, but we
  // catch obvious typos (e.g. "hps://" or trailing spaces) at save time.
  return /^https?:\/\/[^\s]+\.[^\s]+$/i.test(trimmed);
}

export function validateCustomMomentForm(
  form: CustomMomentFormShape,
): CustomMomentValidationResult {
  const errors: Partial<Record<CustomMomentField, string>> = {};
  const recommended: Partial<Record<CustomMomentField, string>> = {};

  if (isBlank(form.title)) {
    errors.title = "Title is required.";
  } else if (form.title.trim().length > CUSTOM_MOMENT_FIELD_LIMITS.title) {
    errors.title = `Title must be ${CUSTOM_MOMENT_FIELD_LIMITS.title} characters or fewer.`;
  }

  if (isBlank(form.date)) {
    errors.date = "Date or year is required.";
  }

  if (isBlank(form.description)) {
    errors.description = "Description is required.";
  } else if (
    form.description.trim().length > CUSTOM_MOMENT_FIELD_LIMITS.description
  ) {
    errors.description = `Description must be ${CUSTOM_MOMENT_FIELD_LIMITS.description} characters or fewer.`;
  }

  // Emotional significance is recommended, not required. If present, we still
  // enforce the cap; if absent, we surface a soft warning.
  if (isBlank(form.emotionalSignificance)) {
    recommended.emotionalSignificance =
      "Recommended — explain why this moment matters to the subject's voice.";
  } else if (
    form.emotionalSignificance.trim().length >
    CUSTOM_MOMENT_FIELD_LIMITS.emotionalSignificance
  ) {
    errors.emotionalSignificance = `Emotional significance must be ${CUSTOM_MOMENT_FIELD_LIMITS.emotionalSignificance} characters or fewer.`;
  }

  // Source notes: required when visibility is Public, optional otherwise. We
  // still enforce the cap regardless.
  if (form.visibility === "Public" && isBlank(form.sourceNotes)) {
    errors.sourceNotes =
      "Source notes are required for Public visibility — explain where this came from or who verified it.";
  } else if (
    !isBlank(form.sourceNotes) &&
    form.sourceNotes.trim().length > CUSTOM_MOMENT_FIELD_LIMITS.sourceNotes
  ) {
    errors.sourceNotes = `Source notes must be ${CUSTOM_MOMENT_FIELD_LIMITS.sourceNotes} characters or fewer.`;
  }

  if (!isBlank(form.sourceUrl) && !isLikelyUrl(form.sourceUrl)) {
    errors.sourceUrl = "Source URL must start with http:// or https://.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    recommended,
  };
}

/**
 * Returns the first field with an error, in form-display order. The drawer
 * uses this to drive focus on save-with-errors so screen-reader users land on
 * the offending field, not on the modal title.
 */
export function firstErrorField(
  errors: Partial<Record<CustomMomentField, string>>,
): CustomMomentField | undefined {
  const order: CustomMomentField[] = [
    "title",
    "date",
    "description",
    "emotionalSignificance",
    "sourceNotes",
    "sourceUrl",
  ];
  return order.find((f) => Boolean(errors[f]));
}
