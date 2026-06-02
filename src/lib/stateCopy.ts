/**
 * Canonical copy for every loading / empty / error surface in RICON
 * Studio. Centralized here so:
 *  1. A copy change happens in one place + ships consistently.
 *  2. Tests can regress against the exact strings without grepping.
 *  3. Localization (later) has a single import target.
 *
 * Naming convention: `SCREEN_PHASE_KEY` — e.g. `SEARCH_EMPTY_DESCRIPTION`.
 * Per docs/05-STATES every error string must answer two questions:
 *   1. What happened?
 *   2. What should the user do next?
 *
 * Loading-title convention: titles end with a Unicode `…` so the editorial
 * voice carries through (it reads as a sentence, not a label). Renderers
 * (see `src/components/LoadingState.tsx`) detect the trailing ellipsis and
 * skip the decorative gold-animated `…` when present so we never get a
 * double-ellipsis "Searching public sources… …".
 */

// ---- Search (S1) ----
export const SEARCH_LOADING_TITLE = "Searching public sources…";
export const SEARCH_LOADING_DESCRIPTION =
  "Querying Wikipedia for matching public figures.";
export const SEARCH_EMPTY_TITLE = "No results";
export const SEARCH_EMPTY_DESCRIPTION =
  "No matching public figures found. Try a full name or adjust filters.";
export const SEARCH_ERROR_TITLE = "Search unavailable";
export const SEARCH_ERROR_DESCRIPTION =
  "Search is unavailable right now. Try again in a moment.";

// ---- Subject selection / Profile import (S2) ----
// `SUBJECT_LOADING_*` is the brief first-paint surface (the S2 mount races
// the draft hydrate from context). `IMPORT_LOADING_*` is the multi-second
// "building" surface that fires after the producer hits Import — its title
// is intentionally distinct from the subject-load title so the user can
// tell the import has actually started.
export const SUBJECT_LOADING_TITLE = "Loading profile";
export const SUBJECT_LOADING_DESCRIPTION =
  "Fetching the Wikipedia summary and metadata.";
export const IMPORT_LOADING_TITLE = "Building source profile…";
export const IMPORT_LOADING_DESCRIPTION =
  "Generating timeline from Wikipedia sources.";
export const IMPORT_ERROR_TITLE = "Import failed";
export const IMPORT_ERROR_DESCRIPTION =
  "We could not generate a timeline from this source. Retry, or pick a different subject.";

// ---- Timeline (S3) ----
export const TIMELINE_LOADING_TITLE = "Extracting timeline signals…";
export const TIMELINE_LOADING_DESCRIPTION =
  "Rebuilding the timeline from the imported source.";
export const TIMELINE_EMPTY_TITLE = "No events yet";
export const TIMELINE_EMPTY_DESCRIPTION =
  "No reliable timeline events were found. Add custom moments to continue.";

// ---- Custom moments (S4) ----
export const CUSTOM_EMPTY_DESCRIPTION =
  "No custom moments yet — add the behind-the-scenes beats databases miss.";

// ---- Guardrail review (S5) ----
export const GUARDRAIL_CLEAR_DESCRIPTION =
  "No guardrail flags — all items cleared automatically. Continue to save the draft.";

// ---- Draft save (S6) ----
export const SAVE_LOADING_TITLE = "Locking draft context…";
export const SAVE_LOADING_DESCRIPTION =
  "Writing the digital twin to local storage.";
export const SAVE_ERROR_TITLE = "Draft could not be saved";
export const SAVE_ERROR_DESCRIPTION =
  "Draft could not be saved locally. Try again before leaving this page.";
export const SAVE_CONSENT_BLOCKED_TITLE = "Consent required";
export const SAVE_CONSENT_BLOCKED_DESCRIPTION =
  "Acknowledge consent on profile import (S2) before saving a draft.";

// ---- Voice Studio (S7) ----
export const VOICE_STUDIO_EMPTY_TITLE = "No event selected";
export const VOICE_STUDIO_EMPTY_DESCRIPTION =
  "Pick a timeline event and set a scene to resolve the emotional state.";

// ---- Audio preview ----
export const AUDIO_UNAVAILABLE_TITLE = "Audio not connected";
export const AUDIO_UNAVAILABLE_DESCRIPTION =
  "Audio generation is not connected in this demo. The voice context is saved and ready for generation.";
export const AUDIO_ERROR_TITLE = "Audio preview · error";
export const AUDIO_ERROR_DESCRIPTION =
  "Could not load the audio asset. Verify the file is reachable and retry.";
