/**
 * Pure helpers that normalize persisted shapes (`TimelineEvent`,
 * `CustomMoment`, `SourceObject`) into the canonical lowercase content-model
 * the UI and the resolver consume.
 *
 * These exist so:
 *  1. Display badges have one source of truth for source/confidence/approval/
 *     visibility/sensitivity colors + labels (no ad-hoc `event.confidence ===
 *     "High" ? "ok" : "muted"` checks scattered through screens).
 *  2. The persistence schema can keep its TitleCase enum format without
 *     leaking that detail to every render call site.
 *  3. Approved-only Voice Studio filtering happens in one place
 *     (`isApprovedForVoiceStudio` + `eligibleVoiceStudioEvents`).
 *
 * Pure functions only. No React, no side effects.
 */

import type {
  Confidence,
  CustomMoment,
  DisplayApprovalStatus,
  DisplayConfidence,
  DisplaySensitivity,
  DisplayVisibility,
  ReviewStatus,
  Sensitivity,
  SourceObject,
  SourceReference,
  SourceType,
  TimelineEvent,
  Visibility,
} from "@/types/twin";

// ===========================================================================
// Source-type mapping
// ===========================================================================

/**
 * Translate the persisted `SourceObject.type` ("wikipedia" | "custom" | …) to
 * the canonical lowercase `SourceType` taxonomy. The only non-identity
 * mapping is `"custom" → "producer"` (V1 used "custom"; V2 uses "producer").
 */
export function sourceObjectTypeToCanonical(
  type: SourceObject["type"],
): SourceType {
  if (type === "custom") return "producer";
  if (
    type === "wikipedia" ||
    type === "producer" ||
    type === "demo" ||
    type === "manual" ||
    type === "unknown"
  ) {
    return type;
  }
  return "unknown";
}

/**
 * Lift a persisted `SourceObject` into the canonical `SourceReference`. Use
 * this everywhere a `TimelineEvent.source` is rendered.
 */
export function toSourceReference(source: SourceObject): SourceReference {
  return {
    sourceType: sourceObjectTypeToCanonical(source.type),
    sourceUrl: source.url,
    sourceNotes: source.citation ?? source.notes,
    verified: source.verified,
    importedAtISO: source.importedAtISO,
    revisionId: source.revisionId,
  };
}

/**
 * Source reference for a `CustomMoment`. Prefers the explicit V2 `source`
 * block; falls back to the V1 inference (regex-scan `sourceNotes` for
 * `unverified|rumor|speculation|hearsay` to set `verified: false`). The
 * fallback is intentionally conservative — when in doubt, treat as
 * unverified, never as verified.
 */
export function customMomentSource(moment: CustomMoment): SourceReference {
  if (moment.source) return moment.source;
  const sourceNotes = moment.sourceNotes ?? "";
  const looksUnverified =
    !sourceNotes.trim() ||
    /\b(unverified|rumor|speculation|hearsay|n\/a)\b/i.test(sourceNotes);
  return {
    sourceType: "producer",
    sourceNotes,
    verified: !looksUnverified ? true : false,
  };
}

// ===========================================================================
// Universal accessors (works on both timeline events and custom moments)
// ===========================================================================

export type ContentItem = TimelineEvent | CustomMoment;

function isTimelineEvent(item: ContentItem): item is TimelineEvent {
  // `source` on a TimelineEvent is `SourceObject` (V1-shape, required).
  // `source` on a CustomMoment is `SourceReference` (V2-shape, optional).
  // We distinguish on the unique-to-TimelineEvent `year` field.
  return typeof (item as TimelineEvent).year === "number";
}

export function getSourceReference(item: ContentItem): SourceReference {
  return isTimelineEvent(item)
    ? toSourceReference(item.source)
    : customMomentSource(item);
}

export function getSourceType(item: ContentItem): SourceType {
  return getSourceReference(item).sourceType;
}

export function getSourceUrl(item: ContentItem): string | undefined {
  return getSourceReference(item).sourceUrl;
}

export function getSourceNotes(item: ContentItem): string | undefined {
  return getSourceReference(item).sourceNotes;
}

export function getSourceVerified(item: ContentItem): boolean {
  return getSourceReference(item).verified;
}

// ===========================================================================
// Display-enum mappings (TitleCase → lowercase)
// ===========================================================================

export function getDisplayConfidence(
  c: Confidence | undefined,
): DisplayConfidence {
  if (c === "High") return "high";
  if (c === "Medium") return "medium";
  if (c === "Low") return "low";
  return "unknown";
}

export function getDisplayApprovalStatus(
  status: ReviewStatus,
): DisplayApprovalStatus {
  if (status === "Reviewed") return "approved";
  if (status === "NeedsReview") return "needsReview";
  if (status === "Rejected") return "rejected";
  // Both the explicit `"Deferred"` guardrail status and the legacy `"Draft"`
  // timeline status surface as "deferred" in the display layer — they are
  // semantically "not yet acted on" from the producer's perspective.
  return "deferred";
}

export function getDisplayVisibility(
  v: Visibility | undefined,
): DisplayVisibility {
  if (v === "Public") return "public";
  if (v === "Private") return "private";
  return "internal";
}

export function getDisplaySensitivity(s: Sensitivity): DisplaySensitivity {
  if (s === "High") return "high";
  if (s === "Medium") return "medium";
  return "low";
}

// ===========================================================================
// Convenience: per-event display bundle
// ===========================================================================

export interface EventDisplay {
  sourceType: SourceType;
  sourceUrl?: string;
  sourceVerified: boolean;
  confidence: DisplayConfidence;
  approvalStatus: DisplayApprovalStatus;
  visibility: DisplayVisibility;
  sensitivity: DisplaySensitivity;
}

/** One-call summary of every badge-relevant field on a timeline event. */
export function getEventDisplay(event: TimelineEvent): EventDisplay {
  const source = toSourceReference(event.source);
  return {
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    sourceVerified: source.verified,
    confidence: getDisplayConfidence(event.confidence),
    approvalStatus: getDisplayApprovalStatus(event.approvalStatus),
    visibility: getDisplayVisibility(event.visibility),
    sensitivity: getDisplaySensitivity(event.sensitivity),
  };
}

export interface MomentDisplay {
  sourceType: SourceType;
  sourceUrl?: string;
  sourceVerified: boolean;
  visibility: DisplayVisibility;
  sensitivity: DisplaySensitivity;
}

/** One-call summary of every badge-relevant field on a custom moment. */
export function getMomentDisplay(moment: CustomMoment): MomentDisplay {
  const source = customMomentSource(moment);
  return {
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    sourceVerified: source.verified,
    visibility: getDisplayVisibility(moment.visibility),
    sensitivity: getDisplaySensitivity(moment.sensitivity),
  };
}

// ===========================================================================
// Voice Studio eligibility (acceptance criteria: approved-only)
// ===========================================================================

/**
 * Voice Studio only voices events the producer has explicitly approved.
 * "Deferred" / "Draft" / "NeedsReview" / "Rejected" all excluded.
 *
 * This is the *single* source of truth for which events the studio can
 * anchor on. Update here, not in individual studio screens.
 */
export function isApprovedForVoiceStudio(event: TimelineEvent): boolean {
  return event.approvalStatus === "Reviewed";
}

export function eligibleVoiceStudioEvents(
  timeline: TimelineEvent[],
): TimelineEvent[] {
  return timeline.filter(isApprovedForVoiceStudio);
}

// ===========================================================================
// Source builders (for new content)
// ===========================================================================

export function makeWikipediaSource(
  url: string,
  revisionId?: string,
): SourceObject {
  return {
    type: "wikipedia",
    url,
    citation: "Wikipedia",
    verified: true,
    importedAtISO: new Date().toISOString(),
    revisionId,
  };
}

export function makeDemoSource(
  url?: string,
  citation = "Wikipedia (demo seed)",
): SourceObject {
  return {
    type: "demo",
    url,
    citation,
    verified: true,
    importedAtISO: new Date().toISOString(),
  };
}

/**
 * Producer-sourced moments default to `verified: false` — the
 * acceptance-criteria "Avoid presenting unverified custom content as fact"
 * lives here. Callers must explicitly pass `verified: true` after the
 * producer affirms a corroborated source.
 */
export function makeProducerSource(
  opts: { sourceUrl?: string; sourceNotes?: string; verified?: boolean } = {},
): SourceReference {
  return {
    sourceType: "producer",
    sourceUrl: opts.sourceUrl,
    sourceNotes: opts.sourceNotes,
    verified: opts.verified ?? false,
    importedAtISO: new Date().toISOString(),
  };
}

// ===========================================================================
// Bulk timeline operations
// ===========================================================================

/**
 * Returns a new timeline with `setApprovalStatus` applied to every event in
 * `eventIds`. Pure — does not mutate `timeline`. Used by S3's bulk action bar
 * ("Approve all visible", "Defer all visible") so the producer can clear an
 * entire filtered subset in one click without losing the approval state of
 * events that fall outside the filter.
 */
export function applyBulkApprovalStatus(
  timeline: TimelineEvent[],
  eventIds: ReadonlyArray<string>,
  status: TimelineEvent["approvalStatus"],
): TimelineEvent[] {
  if (eventIds.length === 0) return timeline;
  const idSet = new Set(eventIds);
  return timeline.map((event) =>
    idSet.has(event.id) ? { ...event, approvalStatus: status } : event,
  );
}

/**
 * Count of approved events in a sub-list — used by S3's per-decade heading
 * ("3 of 5 approved"). Cheap; safe to call in render.
 */
export function countApproved(events: TimelineEvent[]): number {
  return events.reduce(
    (n, event) => (event.approvalStatus === "Reviewed" ? n + 1 : n),
    0,
  );
}
