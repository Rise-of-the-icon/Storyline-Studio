/**
 * Pure read-only summary of a draft — the single source of truth for the
 * "Saved" surface on S6 and the "Resume draft" surface on S1.
 *
 * Lives outside React because:
 *  1. The same shape is consumed by two different screens at very different
 *     points in the lifecycle (post-save success and pre-import landing).
 *  2. Pure helpers are trivially unit-tested in node without `jsdom`.
 *  3. Schema-version evolution is centralized here — callers see only the
 *     summary contract, not the underlying field shape.
 *
 * Adding a field? Update `DraftSummary` here, populate it in
 * `getDraftSummary`, then expose it on the two consumers. Tests will fail
 * loudly if you forget the second consumer.
 */

import { isDemoTwin } from "@/data/demoSubjects";
import { canSaveDraft, summarizeReviews } from "@/lib/guardrails";
import type { DigitalTwinProfile } from "@/types/twin";

export type ConfidenceLabel =
  | "No events"
  | "High"
  | "Medium"
  | "Low"
  | "Mixed"
  | "Mixed (includes low confidence)";

/**
 * Snapshot summary of a draft. All fields are derived — never persisted —
 * so this can be re-computed cheaply on every render.
 */
export interface DraftSummary {
  twinId: string;
  subjectName: string;
  isDemo: boolean;
  /** Total events in the timeline (approved + deferred). */
  eventCount: number;
  /** Subset of `eventCount` with `approvalStatus === "Reviewed"`. */
  approvedEventCount: number;
  /**
   * Subset of `eventCount` that the producer has explicitly opted out of —
   * `approvalStatus === "Draft"` or `"Rejected"`. Useful in the saved-card
   * to show "12 events imported, 8 approved, 4 deferred".
   */
  deferredEventCount: number;
  /** Number of producer-authored custom moments on the draft. */
  customMomentCount: number;
  /** Aggregate confidence label across the entire timeline. */
  confidenceLabel: ConfidenceLabel;
  /**
   * Guardrail roll-up — the same one S5 renders in its summary card.
   * Surfaced on S6 so the producer remembers what they chose to defer.
   */
  guardrail: {
    total: number;
    cleared: number;
    unresolved: number;
    deferred: number;
    highBlocking: number;
    /** `canSaveDraft(reviews)` — already true here (we just saved), but
     *  carried for callers that want to gate downstream actions like
     *  "Open Voice Studio". */
    saveAllowed: boolean;
  };
  /** True when the user has acknowledged consent. Mirrors `consentAcknowledged`. */
  consentAcknowledged: boolean;
  /** ISO timestamp from `consentAcknowledged` flow. May be `undefined` for legacy drafts. */
  consentAcknowledgedAtISO?: string;
  /**
   * Number of finalized Voice Studio contexts captured via SS4's "Save
   * voice context" CTA. Optional because pre-SS4 drafts may have none.
   */
  savedVoiceContextCount: number;
  /**
   * ISO timestamp of the most recent persistence. Falls back to
   * `createdAtISO` for legacy drafts that pre-date `lastSavedAtISO`.
   */
  lastSavedAtISO: string;
  /** `lastSavedAtISO` was explicitly stamped (not falling back). */
  lastSavedAtISOIsExplicit: boolean;
  /**
   * `lastSavedAtISO` formatted for display. Uses
   * `toLocaleString()` so the viewer sees their local-time format.
   */
  lastSavedLabel: string;
  /** `"draft" | "saved"` from the underlying twin. */
  draftStatus: DigitalTwinProfile["draftStatus"];
}

function confidenceLabel(
  timeline: DigitalTwinProfile["timeline"],
): ConfidenceLabel {
  if (timeline.length === 0) return "No events";
  const levels = new Set(timeline.map((e) => e.confidence));
  if (levels.size === 1) {
    const [only] = [...levels];
    return only ?? "Mixed";
  }
  if (levels.has("Low")) return "Mixed (includes low confidence)";
  return "Mixed";
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function getDraftSummary(draft: DigitalTwinProfile): DraftSummary {
  const approvedEventCount = draft.timeline.filter(
    (e) => e.approvalStatus === "Reviewed",
  ).length;
  const deferredEventCount = draft.timeline.filter(
    (e) =>
      e.approvalStatus === "Draft" ||
      e.approvalStatus === "Deferred" ||
      e.approvalStatus === "Rejected",
  ).length;

  const guardrailSummary = summarizeReviews(draft.guardrailReviews);

  const lastSavedAtISO = draft.lastSavedAtISO ?? draft.createdAtISO;
  const lastSavedAtISOIsExplicit = Boolean(draft.lastSavedAtISO);

  return {
    twinId: draft.twinId,
    subjectName: draft.coreIdentity.name,
    isDemo: isDemoTwin(draft),
    eventCount: draft.timeline.length,
    approvedEventCount,
    deferredEventCount,
    customMomentCount: draft.customMoments.length,
    confidenceLabel: confidenceLabel(draft.timeline),
    guardrail: {
      ...guardrailSummary,
      saveAllowed: canSaveDraft(draft.guardrailReviews),
    },
    consentAcknowledged: draft.consentAcknowledged,
    consentAcknowledgedAtISO: draft.consentAcknowledgedAtISO,
    savedVoiceContextCount: draft.savedVoiceContexts?.length ?? 0,
    lastSavedAtISO,
    lastSavedAtISOIsExplicit,
    lastSavedLabel: formatTimestamp(lastSavedAtISO),
    draftStatus: draft.draftStatus,
  };
}
