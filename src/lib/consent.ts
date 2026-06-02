import type { DigitalTwinProfile } from "@/types/twin";

/**
 * Gate 4 — consent + ethical-use copy. Centralized so a single edit updates
 * every surface (S2 import, S5 guardrail review, S6 draft saved, tests).
 *
 * **Important:** this is producer-facing copy, not legal advice. Production
 * deployment must still go through counsel review for the specific jurisdictions
 * the product ships into (see `docs/08-AI-SAFETY.md`).
 */

/**
 * Primary consent label — shown next to the import-step checkbox on S2.
 * Spans authorization + the explicit internal-demo carve-out so the same gate
 * works for live-rights flows and producer/research usage in this POC.
 */
export const CONSENT_ACKNOWLEDGEMENT_LABEL =
  "I understand this draft uses public-source research only. I confirm I have authorization to create or evaluate this digital twin profile, or I am using it strictly for internal demo/research purposes.";

/**
 * Ambient disclosure shown beneath the checkbox. Always visible — the consent
 * gate is producer review, never implied legal clearance (gate 4).
 */
export const CONSENT_NOT_LEGAL_CLEARANCE_NOTE =
  "This step is not legal clearance. Production use of a person's voice, likeness, story, or persona requires appropriate rights, consent, and review.";

/** Bullets for the inline "Why this matters" expandable disclosure on S2. */
export const CONSENT_WHY_THIS_MATTERS: ReadonlyArray<{
  title: string;
  body: string;
}> = [
  {
    title: "Public sources may be incomplete",
    body: "Wikipedia and similar sources omit context, get edited, and can be wrong. Approve events you can stand behind; defer the rest.",
  },
  {
    title: "Custom and private moments require review",
    body: "Producer-supplied moments aren't independently verified. Mark anything sensitive — those flags drive the S5 editorial-review gate.",
  },
  {
    title: "Voice generation requires consent",
    body: "Synthesizing a person's voice for production use needs documented authorization. This POC stops at emotional resolution; voice synthesis is Phase 2.",
  },
  {
    title: "Guardrails are producer review, not legal clearance",
    body: "When the UI says 'Editorially reviewed', it means a producer signed off — it does not mean the rights conversation is closed.",
  },
];

/** Gate 4 — draft cannot be persisted without explicit consent. */
export function canPersistDraft(twin: DigitalTwinProfile): boolean {
  return twin.consentAcknowledged === true;
}

/**
 * Gate 4 — used by the import handler to refuse `Import & Generate Timeline`
 * when consent has not been acknowledged. Mirrors `canPersistDraft` but is
 * named for the import-time intent so call sites read clearly.
 */
export function canImportTimeline(twin: DigitalTwinProfile): boolean {
  return twin.consentAcknowledged === true;
}

/**
 * Stamp a consent acknowledgement onto a draft. Returns a new object — does
 * not mutate. When `acknowledged` is `false`, clears the timestamp so a future
 * re-acknowledgement is recorded fresh rather than reusing a stale one.
 */
export function withConsent(
  twin: DigitalTwinProfile,
  acknowledged: boolean,
  nowISO: string = new Date().toISOString(),
): DigitalTwinProfile {
  if (!acknowledged) {
    return {
      ...twin,
      consentAcknowledged: false,
      consentAcknowledgedAtISO: undefined,
    };
  }
  return {
    ...twin,
    consentAcknowledged: true,
    consentAcknowledgedAtISO: twin.consentAcknowledgedAtISO ?? nowISO,
  };
}
