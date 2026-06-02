import {
  customMomentSource,
  toSourceReference,
} from "./contentModel";
import type {
  CustomMoment,
  GuardrailFlag,
  GuardrailReview,
  ReviewStatus,
  Sensitivity,
  SourceReference,
  TimelineEvent,
  Visibility,
} from "@/types/twin";

/** Gate 4 — shown in S5 / studio guardrail areas. */
export const GUARDRAIL_DISCLAIMER =
  "Editorial review is not legal clearance. Flags indicate producer review only.";

// ---------------------------------------------------------------------------
// Trigger taxonomy — add rules here; avoid one-off conditionals in evaluators.
// ---------------------------------------------------------------------------

export interface GuardrailMatchContext {
  kind: "timeline" | "custom";
  id: string;
  text: string;
  sensitivity: Sensitivity;
  visibility?: Visibility;
  confidence?: TimelineEvent["confidence"];
  eventType?: TimelineEvent["eventType"];
  sourceVerified?: boolean;
  /** Empty string → counts as "missing date" for the `missing-date` rule. */
  date?: string;
  /** Empty string → counts as "missing source notes" for guardrail rules. */
  sourceNotes?: string;
  /** Optional URL to a primary source. Used by `missing-source` rule. */
  sourceUrl?: string;
  /** Sets `missing-source` to fire on timeline items with unknown provenance. */
  sourceType?: SourceReference["sourceType"];
}

export interface GuardrailRule {
  id: string;
  /** Display label in S5 flagged-event list (e.g. "Private relationships"). */
  trigger: string;
  severity: Sensitivity;
  /** Gate 4 — High-severity flags need an editorial note before clearing. */
  requiresEditorialNote: boolean;
  scope: "timeline" | "custom" | "both";
  /**
   * Producer-facing explanation — "why is this flagged?". One sentence,
   * surfaced inline on the S5 row so the producer doesn't have to guess
   * which condition tripped the rule.
   */
  reason: string;
  /**
   * Producer-facing remediation hint — "how do I resolve this?". One
   * sentence, surfaced inline beneath `reason` on the S5 row. Resolution
   * actions live in the screen (Resolve / Defer / Edit / Reject); this is
   * the editorial-judgement prompt that makes those choices meaningful.
   */
  suggestion: string;
  match: (ctx: GuardrailMatchContext) => boolean;
}

export const GUARDRAIL_RULES: GuardrailRule[] = [
  {
    id: "private-relationships",
    trigger: "Private relationships",
    severity: "High",
    requiresEditorialNote: true,
    scope: "custom",
    reason:
      "Moment names a private relationship that the subject may not have made public.",
    suggestion:
      "Confirm the subject (or estate) has consented to surfacing this relationship; otherwise reject or keep visibility Private.",
    match: (ctx) =>
      ctx.kind === "custom" &&
      (/private\s+relationship/i.test(ctx.text) ||
        (ctx.visibility === "Private" &&
          /\b(relationship|partner|marriage|affair|romantic|divorce|spouse)\b/i.test(
            ctx.text,
          ))),
  },
  {
    id: "high-sensitivity-moment",
    trigger: "High sensitivity content",
    severity: "High",
    requiresEditorialNote: true,
    scope: "both",
    reason:
      "Item is tagged High sensitivity — likely contested, traumatic, or legally exposed material.",
    suggestion:
      "Add an editorial note explaining why this material is safe to include before clearing.",
    match: (ctx) => ctx.sensitivity === "High",
  },
  {
    id: "low-source-confidence",
    trigger: "Low source confidence",
    severity: "Medium",
    requiresEditorialNote: false,
    scope: "timeline",
    reason:
      "Heuristic extraction couldn't anchor this event to a clear year or citation.",
    suggestion:
      "Cross-check the claim against the linked source, raise confidence after verification, or defer.",
    match: (ctx) => ctx.kind === "timeline" && ctx.confidence === "Low",
  },
  {
    id: "unverified-custom-source",
    trigger: "Unverified custom source",
    severity: "Medium",
    requiresEditorialNote: false,
    scope: "custom",
    reason:
      "Producer did not affirm \"I have corroborated this source\" on the custom moment.",
    suggestion:
      "Open the moment, verify against a primary source, and check the corroboration box before clearing.",
    match: (ctx) =>
      ctx.kind === "custom" &&
      (ctx.sourceVerified === false ||
        /\b(unverified|rumor|speculation|hearsay)\b/i.test(ctx.text)),
  },
  {
    id: "missing-custom-citation",
    trigger: "Missing or weak citation",
    severity: "Medium",
    requiresEditorialNote: false,
    scope: "custom",
    reason:
      "Source notes are very short or explicitly say the source is unknown.",
    suggestion:
      "Edit the moment and paste a substantive citation (who said it, where, when).",
    match: (ctx) =>
      ctx.kind === "custom" &&
      (ctx.text.length < 40 ||
        /\b(no source|unknown source|n\/a)\b/i.test(ctx.text)),
  },
  {
    id: "public-without-source-notes",
    trigger: "Public visibility without source notes",
    severity: "High",
    requiresEditorialNote: true,
    scope: "custom",
    reason:
      "Moment is marked Public (may surface in story output) but has no source notes — there is nothing to stand behind.",
    suggestion:
      "Add source notes, switch visibility to Internal, or reject the moment.",
    match: (ctx) =>
      ctx.kind === "custom" &&
      ctx.visibility === "Public" &&
      (ctx.sourceNotes ?? "").trim().length === 0,
  },
  {
    id: "missing-date",
    trigger: "Missing date",
    severity: "Medium",
    requiresEditorialNote: false,
    scope: "both",
    reason:
      "Item has no date or year — story output can't anchor it on the timeline.",
    suggestion:
      "Edit the item and add an approximate year (or full date).",
    match: (ctx) =>
      (ctx.date ?? "").trim().length === 0 && !/\b(19|20)\d{2}\b/.test(ctx.text),
  },
  {
    id: "missing-source",
    trigger: "Missing source",
    severity: "Medium",
    requiresEditorialNote: false,
    scope: "both",
    reason:
      "No source citation or URL is attached to this item.",
    suggestion:
      "Edit the item and attach either a Source URL or descriptive source notes.",
    match: (ctx) =>
      ctx.sourceType === "unknown" ||
      ((ctx.sourceUrl ?? "").trim().length === 0 &&
        (ctx.sourceNotes ?? "").trim().length === 0 &&
        // Wikipedia-sourced timeline items always carry the subject's
        // sourceUrl, so they implicitly satisfy this rule — guard against
        // false positives.
        ctx.sourceType !== "wikipedia"),
  },
  {
    id: "public-exposure-private-topic",
    trigger: "Public visibility on sensitive topic",
    severity: "High",
    requiresEditorialNote: true,
    scope: "custom",
    reason:
      "Public-visibility custom moment touches a topic class (family, health, mental, addiction, legal) that often requires explicit consent.",
    suggestion:
      "Confirm consent in writing, lower visibility, or reject.",
    match: (ctx) =>
      ctx.kind === "custom" &&
      ctx.visibility === "Public" &&
      ctx.sensitivity !== "Low" &&
      /\b(private|personal|family|health|mental|addiction|legal)\b/i.test(ctx.text),
  },
  {
    id: "relationship-timeline-event",
    trigger: "Relationship event flagged",
    severity: "Medium",
    requiresEditorialNote: false,
    scope: "timeline",
    reason:
      "Timeline event is categorised Relationship at non-Low sensitivity — relationship narratives carry rights and consent obligations.",
    suggestion:
      "Verify the event is part of the public record before approving; defer if unsure.",
    match: (ctx) =>
      ctx.kind === "timeline" &&
      ctx.eventType === "Relationship" &&
      ctx.sensitivity !== "Low",
  },
  {
    id: "personal-life-timeline",
    trigger: "Personal life exposure",
    severity: "Medium",
    requiresEditorialNote: false,
    scope: "timeline",
    reason:
      "Personal-type event marked High sensitivity — likely a private-life detail.",
    suggestion:
      "Approve only if the detail is well-documented public record; otherwise defer.",
    match: (ctx) =>
      ctx.kind === "timeline" &&
      ctx.eventType === "Personal" &&
      ctx.sensitivity === "High",
  },
  {
    id: "controversial-topic",
    trigger: "Controversial or legal topic",
    severity: "High",
    requiresEditorialNote: true,
    scope: "both",
    reason:
      "Item references a scandal, lawsuit, allegation, or other legally exposed topic.",
    suggestion:
      "Get explicit producer + (where applicable) legal sign-off before clearing.",
    match: (ctx) =>
      /\b(scandal|lawsuit|arrest|indictment|controversy|allegation|accusation)\b/i.test(
        ctx.text,
      ),
  },
  {
    id: "minor-involved",
    trigger: "Minor involved",
    severity: "High",
    requiresEditorialNote: true,
    scope: "both",
    reason:
      "Item references a minor or underage subject at non-Low sensitivity.",
    suggestion:
      "Confirm guardian / legal consent before clearing; reject if consent isn't in place.",
    match: (ctx) =>
      /\b(minor|child|underage|teenager)\b/i.test(ctx.text) &&
      ctx.sensitivity !== "Low",
  },
];

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

function timelineContext(event: TimelineEvent): GuardrailMatchContext {
  const source = toSourceReference(event.source);
  return {
    kind: "timeline",
    id: event.id,
    text: [event.title, event.description, event.eventType].join(" "),
    sensitivity: event.sensitivity,
    visibility: event.visibility,
    confidence: event.confidence,
    eventType: event.eventType,
    sourceVerified: source.verified,
    date: event.date ?? String(event.year ?? ""),
    sourceUrl: source.sourceUrl,
    sourceNotes: source.sourceNotes,
    sourceType: source.sourceType,
  };
}

function customContext(moment: CustomMoment): GuardrailMatchContext {
  // In V2 the structured `moment.source` block is the source of truth for
  // verification. `customMomentSource()` falls back to the V1 regex
  // inference for legacy drafts that pre-date the source block.
  const source = customMomentSource(moment);
  return {
    kind: "custom",
    id: moment.id,
    text: [
      moment.title,
      moment.description,
      moment.emotionalSignificance,
      moment.sourceNotes,
      moment.visibility,
    ].join(" "),
    sensitivity: moment.sensitivity,
    visibility: moment.visibility,
    sourceVerified: source.verified,
    date: moment.date ?? "",
    sourceUrl: source.sourceUrl,
    sourceNotes: moment.sourceNotes ?? source.sourceNotes,
    sourceType: source.sourceType,
  };
}

function rulesForKind(kind: "timeline" | "custom"): GuardrailRule[] {
  return GUARDRAIL_RULES.filter(
    (rule) => rule.scope === "both" || rule.scope === kind,
  );
}

function reviewKey(eventId: string, trigger: string): string {
  return `${eventId}::${trigger}`;
}

function mergeExistingReview(
  eventId: string,
  trigger: string,
  severity: Sensitivity,
  existing?: GuardrailReview,
): GuardrailReview {
  if (existing) {
    return {
      ...existing,
      severity,
      trigger,
      eventId,
    };
  }
  return {
    eventId,
    trigger,
    severity,
    status: "NeedsReview",
  };
}

/**
 * Evaluate timeline events and custom moments; return guardrail flags to surface in S5.
 */
export function evaluateGuardrails(
  timeline: TimelineEvent[],
  customMoments: CustomMoment[],
  existingReviews: GuardrailReview[] = [],
): GuardrailReview[] {
  const existingByKey = new Map(
    existingReviews.map((r) => [reviewKey(r.eventId, r.trigger), r]),
  );
  const flagged = new Map<string, GuardrailReview>();

  const evaluateItem = (
    ctx: GuardrailMatchContext,
    kind: "timeline" | "custom",
  ) => {
    for (const rule of rulesForKind(kind)) {
      if (!rule.match(ctx)) continue;
      const key = reviewKey(ctx.id, rule.trigger);
      if (flagged.has(key)) continue;
      flagged.set(
        key,
        mergeExistingReview(
          ctx.id,
          rule.trigger,
          rule.severity,
          existingByKey.get(key),
        ),
      );
    }
  };

  for (const event of timeline) {
    evaluateItem(timelineContext(event), "timeline");
  }
  for (const moment of customMoments) {
    evaluateItem(customContext(moment), "custom");
  }

  return Array.from(flagged.values());
}

export function getRuleForTrigger(trigger: string): GuardrailRule | undefined {
  return GUARDRAIL_RULES.find((r) => r.trigger === trigger);
}

export function getRuleById(id: string): GuardrailRule | undefined {
  return GUARDRAIL_RULES.find((r) => r.id === id);
}

/**
 * Detection-time flags — the producer-facing view that includes the source
 * reference of the offending item. Unlike `evaluateGuardrails()` (which
 * returns the persisted `GuardrailReview[]`), this is for live UI surfaces
 * (S5 row decoration, AppHeader warning chip, future "Why was this flagged?"
 * tooltip).
 */
export function evaluateGuardrailFlags(
  timeline: TimelineEvent[],
  customMoments: CustomMoment[],
): GuardrailFlag[] {
  const flags: GuardrailFlag[] = [];
  const sourceByEvent = new Map<string, SourceReference>(
    timeline.map((e) => [e.id, toSourceReference(e.source)]),
  );
  const sourceByMoment = new Map<string, SourceReference>(
    customMoments.map((m) => [m.id, customMomentSource(m)]),
  );

  const evaluate = (ctx: GuardrailMatchContext) => {
    for (const rule of rulesForKind(ctx.kind)) {
      if (!rule.match(ctx)) continue;
      const source =
        ctx.kind === "timeline"
          ? sourceByEvent.get(ctx.id)
          : sourceByMoment.get(ctx.id);
      flags.push({
        itemId: ctx.id,
        itemKind: ctx.kind,
        ruleId: rule.id,
        trigger: rule.trigger,
        severity: rule.severity,
        requiresEditorialNote: rule.requiresEditorialNote,
        source: source ?? {
          sourceType: "unknown",
          verified: false,
        },
      });
    }
  };

  for (const event of timeline) {
    evaluate(timelineContext(event));
  }
  for (const moment of customMoments) {
    evaluate(customContext(moment));
  }
  return flags;
}

/** Gate 4 — High-severity flags require an editorial note before clearing. */
export function requiresEditorialNote(review: GuardrailReview): boolean {
  const rule = getRuleForTrigger(review.trigger);
  if (rule?.requiresEditorialNote) return true;
  return review.severity === "High";
}

export function canClearReview(review: GuardrailReview): boolean {
  if (review.status === "Rejected") return true;
  if (review.status !== "Reviewed") return false;
  if (!requiresEditorialNote(review)) return true;
  return Boolean(review.editorialNote?.trim());
}

/**
 * A review is "resolved" when the producer has acted on it in any
 * terminal way — cleared (Reviewed), removed (Rejected), or explicitly
 * acknowledged + postponed (Deferred). Used by the S5 summary card and
 * the existing `allGuardrailsResolved()` helper.
 */
export function isReviewResolved(review: GuardrailReview): boolean {
  return (
    review.status === "Reviewed" ||
    review.status === "Rejected" ||
    review.status === "Deferred"
  );
}

export function allGuardrailsResolved(reviews: GuardrailReview[]): boolean {
  return reviews.every(isReviewResolved);
}

/**
 * Gate 4 — final save policy.
 *
 * Save is allowed when **no High-severity review is still NeedsReview**.
 * Medium and Low severity flags may remain unresolved or deferred; the
 * producer is explicitly accepting downstream risk for those. Rejected and
 * Reviewed (with editorial note where required) always clear.
 *
 * Older code used `allGuardrailsResolved()` which blocked save on *any*
 * unresolved flag — too strict for a workflow tool. The new contract pushes
 * the policy boundary to "what would expose the production to liability if
 * left unaddressed" (High severity only).
 */
export function canSaveDraft(reviews: GuardrailReview[]): boolean {
  return !reviews.some(
    (r) => r.severity === "High" && r.status === "NeedsReview",
  );
}

/**
 * Summary counts for the S5 header card.
 *
 *  - `cleared` — explicitly Reviewed (with note where required) or Rejected
 *  - `deferred` — explicitly Deferred (acknowledged, not addressed yet)
 *  - `unresolved` — still NeedsReview (any severity)
 *  - `highBlocking` — subset of `unresolved` with severity = High; this is
 *    the number that prevents `canSaveDraft()` from returning true
 */
export interface GuardrailSummary {
  total: number;
  cleared: number;
  deferred: number;
  unresolved: number;
  highBlocking: number;
}

export function summarizeReviews(reviews: GuardrailReview[]): GuardrailSummary {
  let cleared = 0;
  let deferred = 0;
  let unresolved = 0;
  let highBlocking = 0;
  for (const r of reviews) {
    if (r.status === "Reviewed" || r.status === "Rejected") cleared++;
    else if (r.status === "Deferred") deferred++;
    else {
      unresolved++;
      if (r.severity === "High") highBlocking++;
    }
  }
  return {
    total: reviews.length,
    cleared,
    deferred,
    unresolved,
    highBlocking,
  };
}

export function markReviewed(
  review: GuardrailReview,
  editorialNote?: string,
): GuardrailReview {
  if (requiresEditorialNote(review) && !editorialNote?.trim()) {
    return review;
  }
  return {
    ...review,
    status: "Reviewed" satisfies ReviewStatus,
    editorialNote: editorialNote?.trim() || review.editorialNote,
    reviewedAtISO: new Date().toISOString(),
  };
}

export function markRejected(review: GuardrailReview): GuardrailReview {
  return {
    ...review,
    status: "Rejected",
    reviewedAtISO: new Date().toISOString(),
  };
}

/**
 * Move a review to Deferred. Allowed for Medium/Low severity flags only —
 * a producer cannot defer a High-severity flag because High flags block
 * `canSaveDraft()` regardless of status. (Defer-then-save would silently
 * bypass the gate.) For High severity, the producer must Resolve (with
 * editorial note) or Reject. Caller is expected to disable the Defer button
 * for High flags; this helper is a defense in depth.
 */
export function markDeferred(review: GuardrailReview): GuardrailReview {
  if (review.severity === "High") return review;
  return {
    ...review,
    status: "Deferred",
    reviewedAtISO: new Date().toISOString(),
  };
}

/** Items with no matching rule (for S5 "cleared automatically" copy). */
export function listAutoClearedIds(
  timeline: TimelineEvent[],
  customMoments: CustomMoment[],
  reviews: GuardrailReview[],
): string[] {
  const flaggedIds = new Set(reviews.map((r) => r.eventId));
  const allIds = [
    ...timeline.map((e) => e.id),
    ...customMoments.map((m) => m.id),
  ];
  return allIds.filter((id) => !flaggedIds.has(id));
}
