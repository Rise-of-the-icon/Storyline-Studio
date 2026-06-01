import type { DigitalTwinProfile } from "../types/twin";

/**
 * Gate 4 — placeholder legal copy in one swappable constant (docs/08-AI-SAFETY.md).
 * Replace with counsel-approved wording before any production use.
 */
export const CONSENT_ACKNOWLEDGEMENT_LABEL =
  "I confirm this digital twin is authorized by the subject or their estate (demo placeholder — not legal advice).";

/** Gate 4 — draft cannot be persisted without explicit consent. */
export function canPersistDraft(twin: DigitalTwinProfile): boolean {
  return twin.consentAcknowledged === true;
}
