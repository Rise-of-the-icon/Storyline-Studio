import type {
  CustomMoment,
  GuardrailReview,
  ReviewStatus,
  Sensitivity,
  TimelineEvent,
  Visibility,
} from "../types/twin";

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
}

export interface GuardrailRule {
  id: string;
  /** Display label in S5 flagged-event list (e.g. "Private relationships"). */
  trigger: string;
  severity: Sensitivity;
  /** Gate 4 — High-severity flags need an editorial note before clearing. */
  requiresEditorialNote: boolean;
  scope: "timeline" | "custom" | "both";
  match: (ctx: GuardrailMatchContext) => boolean;
}

export const GUARDRAIL_RULES: GuardrailRule[] = [
  {
    id: "private-relationships",
    trigger: "Private relationships",
    severity: "High",
    requiresEditorialNote: true,
    scope: "custom",
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
    match: (ctx) => ctx.sensitivity === "High",
  },
  {
    id: "low-source-confidence",
    trigger: "Low source confidence",
    severity: "Medium",
    requiresEditorialNote: false,
    scope: "timeline",
    match: (ctx) => ctx.kind === "timeline" && ctx.confidence === "Low",
  },
  {
    id: "unverified-custom-source",
    trigger: "Unverified custom source",
    severity: "Medium",
    requiresEditorialNote: false,
    scope: "custom",
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
    match: (ctx) =>
      ctx.kind === "custom" &&
      (ctx.text.length < 40 ||
        /\b(no source|unknown source|n\/a)\b/i.test(ctx.text)),
  },
  {
    id: "public-exposure-private-topic",
    trigger: "Public visibility on sensitive topic",
    severity: "High",
    requiresEditorialNote: true,
    scope: "custom",
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
    match: (ctx) =>
      /\b(minor|child|underage|teenager)\b/i.test(ctx.text) &&
      ctx.sensitivity !== "Low",
  },
];

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

function timelineContext(event: TimelineEvent): GuardrailMatchContext {
  return {
    kind: "timeline",
    id: event.id,
    text: [event.title, event.description, event.eventType].join(" "),
    sensitivity: event.sensitivity,
    confidence: event.confidence,
    eventType: event.eventType,
    sourceVerified: event.source.verified,
  };
}

function customContext(moment: CustomMoment): GuardrailMatchContext {
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
    sourceVerified: !/\b(unverified|rumor|speculation)\b/i.test(moment.sourceNotes),
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

export function isReviewResolved(review: GuardrailReview): boolean {
  return review.status === "Reviewed" || review.status === "Rejected";
}

export function allGuardrailsResolved(reviews: GuardrailReview[]): boolean {
  return reviews.every(isReviewResolved);
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
