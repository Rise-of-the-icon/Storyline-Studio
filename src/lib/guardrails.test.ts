import { describe, expect, it } from "vitest";
import type {
  CustomMoment,
  GuardrailReview,
  TimelineEvent,
} from "@/types/twin";
import { makeProducerSource, makeWikipediaSource } from "./contentModel";
import {
  allGuardrailsResolved,
  canClearReview,
  canSaveDraft,
  evaluateGuardrailFlags,
  evaluateGuardrails,
  getRuleById,
  getRuleForTrigger,
  GUARDRAIL_RULES,
  isReviewResolved,
  markDeferred,
  markRejected,
  markReviewed,
  requiresEditorialNote,
  summarizeReviews,
} from "./guardrails";

function privateRelationshipsMoment(
  overrides: Partial<CustomMoment> = {},
): CustomMoment {
  return {
    id: "cm-private-001",
    title: "Private relationships",
    description: "Behind-the-scenes romantic relationship kept out of press.",
    emotionalSignificance: "High personal stakes",
    visibility: "Private",
    sensitivity: "Medium",
    sourceNotes: "Producer interview notes (unverified)",
    ...overrides,
  };
}

describe("evaluateGuardrails()", () => {
  it('flags "Private relationships" custom moment as High severity', () => {
    const reviews = evaluateGuardrails([], [privateRelationshipsMoment()]);

    const flag = reviews.find((r) => r.trigger === "Private relationships");
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe("High");
    expect(flag!.eventId).toBe("cm-private-001");
    expect(flag!.status).toBe("NeedsReview");
    expect(requiresEditorialNote(flag!)).toBe(true);
    expect(canClearReview({ ...flag!, status: "Reviewed" })).toBe(false);
    expect(
      canClearReview({
        ...flag!,
        status: "Reviewed",
        editorialNote: "Reviewed for demo; not legal clearance.",
      }),
    ).toBe(true);
  });

  it("starts unresolved until all reviews are Reviewed or Rejected", () => {
    const reviews = evaluateGuardrails([], [privateRelationshipsMoment()]);
    expect(allGuardrailsResolved(reviews)).toBe(false);
  });

  it("uses moment.source.verified when present (V2 path)", () => {
    // Same blank sourceNotes — but with an explicit verified=true source
    // block the unverified-custom-source rule must NOT fire.
    const verified = privateRelationshipsMoment({
      id: "cm-verified",
      sourceNotes: "",
      source: makeProducerSource({ verified: true }),
    });
    const reviews = evaluateGuardrails([], [verified]);
    expect(reviews.some((r) => r.trigger === "Unverified custom source")).toBe(
      false,
    );
  });

  it("flags Unverified custom source when source.verified=false (V2 path)", () => {
    const moment: CustomMoment = {
      id: "cm-unverified",
      title: "Tabloid rumor",
      description: "Anonymous trade-press whisper, no corroboration.",
      emotionalSignificance: "Possibly inflammatory",
      visibility: "Private",
      sensitivity: "Low",
      sourceNotes: "",
      source: makeProducerSource({ verified: false }),
    };
    const reviews = evaluateGuardrails([], [moment]);
    expect(reviews.some((r) => r.trigger === "Unverified custom source")).toBe(
      true,
    );
  });
});

describe("evaluateGuardrailFlags()", () => {
  it("returns producer-facing flags carrying the item's source reference", () => {
    const event: TimelineEvent = {
      id: "evt-low-confidence",
      title: "Low-confidence event",
      description: "Maybe true, maybe not.",
      year: 2020,
      decade: "2020s",
      eventType: "Historical",
      confidence: "Low",
      approvalStatus: "Draft",
      sensitivity: "Low",
      emotionalSignificance: 30,
      source: makeWikipediaSource("https://en.wikipedia.org/wiki/Example"),
    };
    const flags = evaluateGuardrailFlags([event], []);
    const low = flags.find((f) => f.ruleId === "low-source-confidence");
    expect(low).toBeDefined();
    expect(low!.itemKind).toBe("timeline");
    expect(low!.itemId).toBe("evt-low-confidence");
    expect(low!.source.sourceType).toBe("wikipedia");
    expect(low!.source.sourceUrl).toBe(
      "https://en.wikipedia.org/wiki/Example",
    );
  });

  it("includes producer source on custom-moment flags", () => {
    const moment: CustomMoment = {
      id: "cm-rumor",
      title: "Rumor",
      description: "Anonymous trade-press whisper.",
      emotionalSignificance: "Risky",
      visibility: "Internal",
      sensitivity: "Low",
      sourceNotes: "",
      source: makeProducerSource({ verified: false }),
    };
    const flags = evaluateGuardrailFlags([], [moment]);
    const flag = flags.find((f) => f.ruleId === "unverified-custom-source");
    expect(flag).toBeDefined();
    expect(flag!.source.sourceType).toBe("producer");
    expect(flag!.source.verified).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// New rule coverage
// ---------------------------------------------------------------------------

describe("rule: public-without-source-notes", () => {
  it("fires on Public visibility + blank source notes", () => {
    const moment: CustomMoment = {
      id: "cm-public-blank",
      title: "Backstage interaction",
      description: "Brief account of a backstage exchange.",
      emotionalSignificance: "Personal flavor",
      visibility: "Public",
      sensitivity: "Low",
      sourceNotes: "",
      source: makeProducerSource({ verified: true }),
    };
    const reviews = evaluateGuardrails([], [moment]);
    expect(
      reviews.find(
        (r) => r.trigger === "Public visibility without source notes",
      ),
    ).toBeDefined();
  });

  it("does NOT fire when Public visibility has source notes", () => {
    const moment: CustomMoment = {
      id: "cm-public-cited",
      title: "Documented quote",
      description: "Subject is on record describing the event in 2018.",
      emotionalSignificance: "Defining moment",
      visibility: "Public",
      sensitivity: "Low",
      sourceNotes: "Published interview, 2018.",
      source: makeProducerSource({ verified: true }),
    };
    const reviews = evaluateGuardrails([], [moment]);
    expect(
      reviews.find(
        (r) => r.trigger === "Public visibility without source notes",
      ),
    ).toBeUndefined();
  });

  it("severity is High and requires editorial note", () => {
    const rule = getRuleById("public-without-source-notes");
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe("High");
    expect(rule!.requiresEditorialNote).toBe(true);
  });
});

describe("rule: missing-date", () => {
  it("fires on a custom moment with blank date and no year mention", () => {
    const moment: CustomMoment = {
      id: "cm-no-date",
      title: "Forgotten anecdote",
      description: "Subject mentioned this once without anchoring it in time.",
      emotionalSignificance: "Color",
      visibility: "Internal",
      sensitivity: "Low",
      sourceNotes: "Casual interview reference.",
      date: "",
      source: makeProducerSource({ verified: true }),
    };
    const reviews = evaluateGuardrails([], [moment]);
    expect(reviews.find((r) => r.trigger === "Missing date")).toBeDefined();
  });

  it("does NOT fire when the description embeds a year", () => {
    const moment: CustomMoment = {
      id: "cm-implicit-year",
      title: "Anecdote with embedded year",
      description: "Subject recalled this happening sometime in 1999.",
      emotionalSignificance: "Color",
      visibility: "Internal",
      sensitivity: "Low",
      sourceNotes: "Cited 1999 interview.",
      date: "",
      source: makeProducerSource({ verified: true }),
    };
    const reviews = evaluateGuardrails([], [moment]);
    expect(reviews.find((r) => r.trigger === "Missing date")).toBeUndefined();
  });
});

describe("rule: missing-source", () => {
  it("fires on a custom moment with no URL and no notes", () => {
    const moment: CustomMoment = {
      id: "cm-no-source",
      title: "Brief moment description",
      description:
        "Subject is rumoured to have done this notable thing once in 2010.",
      emotionalSignificance: "Color",
      visibility: "Internal",
      sensitivity: "Low",
      sourceNotes: "",
      date: "2010",
      source: makeProducerSource({ verified: false }),
    };
    const reviews = evaluateGuardrails([], [moment]);
    expect(reviews.find((r) => r.trigger === "Missing source")).toBeDefined();
  });

  it("does NOT fire on a Wikipedia-sourced timeline event", () => {
    const event: TimelineEvent = {
      id: "evt-wiki",
      title: "Born",
      description: "Born in 1972 per Wikipedia summary.",
      year: 1972,
      decade: "1970s",
      eventType: "Personal",
      confidence: "High",
      approvalStatus: "Draft",
      sensitivity: "Low",
      emotionalSignificance: 30,
      source: makeWikipediaSource("https://en.wikipedia.org/wiki/X"),
    };
    const reviews = evaluateGuardrails([event], []);
    expect(reviews.find((r) => r.trigger === "Missing source")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// reason / suggestion fields on every rule
// ---------------------------------------------------------------------------

describe("GUARDRAIL_RULES — producer-facing copy", () => {
  it("every rule has a non-empty reason and suggestion", () => {
    for (const rule of GUARDRAIL_RULES) {
      expect(rule.reason.trim().length, `${rule.id} reason`).toBeGreaterThan(
        10,
      );
      expect(
        rule.suggestion.trim().length,
        `${rule.id} suggestion`,
      ).toBeGreaterThan(10);
    }
  });

  it("getRuleForTrigger round-trips for every rule", () => {
    for (const rule of GUARDRAIL_RULES) {
      expect(getRuleForTrigger(rule.trigger)?.id).toBe(rule.id);
    }
  });
});

// ---------------------------------------------------------------------------
// Defer + save gate
// ---------------------------------------------------------------------------

function review(overrides: Partial<GuardrailReview> = {}): GuardrailReview {
  return {
    eventId: "evt-x",
    trigger: "Low source confidence",
    severity: "Medium",
    status: "NeedsReview",
    ...overrides,
  };
}

describe("markDeferred + isReviewResolved", () => {
  it("Medium-severity NeedsReview → Deferred", () => {
    const next = markDeferred(review({ severity: "Medium" }));
    expect(next.status).toBe("Deferred");
    expect(next.reviewedAtISO).toBeDefined();
    expect(isReviewResolved(next)).toBe(true);
  });

  it("Low-severity NeedsReview → Deferred", () => {
    const next = markDeferred(review({ severity: "Low" }));
    expect(next.status).toBe("Deferred");
    expect(isReviewResolved(next)).toBe(true);
  });

  it("High-severity is a no-op — defer is unavailable", () => {
    const before = review({ severity: "High" });
    const next = markDeferred(before);
    expect(next.status).toBe("NeedsReview");
    expect(next).toEqual(before);
  });
});

describe("canSaveDraft — High-severity-only blocking", () => {
  it("empty list → save allowed", () => {
    expect(canSaveDraft([])).toBe(true);
  });

  it("all Reviewed → save allowed", () => {
    expect(
      canSaveDraft([
        review({ severity: "High", status: "Reviewed" }),
        review({ severity: "Medium", status: "Reviewed" }),
      ]),
    ).toBe(true);
  });

  it("Medium/Low unresolved → save still allowed", () => {
    expect(
      canSaveDraft([
        review({ severity: "Medium", status: "NeedsReview" }),
        review({ severity: "Low", status: "NeedsReview" }),
      ]),
    ).toBe(true);
  });

  it("any Medium/Low Deferred → save allowed", () => {
    expect(
      canSaveDraft([
        review({ severity: "Medium", status: "Deferred" }),
        review({ severity: "Low", status: "Deferred" }),
      ]),
    ).toBe(true);
  });

  it("any High NeedsReview → save BLOCKED", () => {
    expect(
      canSaveDraft([
        review({ severity: "High", status: "NeedsReview" }),
        review({ severity: "Medium", status: "Reviewed" }),
      ]),
    ).toBe(false);
  });

  it("High Reviewed (with note implied) → save allowed", () => {
    expect(
      canSaveDraft([
        review({
          severity: "High",
          status: "Reviewed",
          editorialNote: "Producer affirmed.",
        }),
      ]),
    ).toBe(true);
  });

  it("High Rejected → save allowed (rejection is a terminal action)", () => {
    expect(
      canSaveDraft([review({ severity: "High", status: "Rejected" })]),
    ).toBe(true);
  });
});

describe("summarizeReviews", () => {
  it("returns zeroes for an empty list", () => {
    expect(summarizeReviews([])).toEqual({
      total: 0,
      cleared: 0,
      deferred: 0,
      unresolved: 0,
      highBlocking: 0,
    });
  });

  it("counts Reviewed and Rejected as cleared", () => {
    const s = summarizeReviews([
      review({ status: "Reviewed" }),
      review({ status: "Rejected" }),
    ]);
    expect(s.cleared).toBe(2);
    expect(s.unresolved).toBe(0);
  });

  it("counts Deferred separately from cleared/unresolved", () => {
    const s = summarizeReviews([
      review({ status: "Deferred", severity: "Medium" }),
      review({ status: "Deferred", severity: "Low" }),
      review({ status: "Reviewed" }),
    ]);
    expect(s.deferred).toBe(2);
    expect(s.cleared).toBe(1);
    expect(s.unresolved).toBe(0);
  });

  it("highBlocking counts only High-severity NeedsReview", () => {
    const s = summarizeReviews([
      review({ status: "NeedsReview", severity: "High" }),
      review({ status: "NeedsReview", severity: "High" }),
      review({ status: "NeedsReview", severity: "Medium" }),
      review({ status: "Deferred", severity: "High" }), // not counted - is Deferred
    ]);
    expect(s.highBlocking).toBe(2);
    expect(s.unresolved).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// markReviewed + markRejected stay compatible
// ---------------------------------------------------------------------------

describe("markReviewed / markRejected (regression)", () => {
  it("markReviewed flips status and stamps reviewedAtISO when note not required", () => {
    const before = review({
      trigger: "Low source confidence",
      severity: "Medium",
    });
    const after = markReviewed(before);
    expect(after.status).toBe("Reviewed");
    expect(after.reviewedAtISO).toBeDefined();
  });

  it("markRejected returns terminal Rejected status", () => {
    const after = markRejected(review());
    expect(after.status).toBe("Rejected");
    expect(after.reviewedAtISO).toBeDefined();
    expect(isReviewResolved(after)).toBe(true);
  });

  it("allGuardrailsResolved treats Deferred as resolved", () => {
    expect(
      allGuardrailsResolved([
        review({ status: "Deferred", severity: "Medium" }),
        review({ status: "Reviewed" }),
      ]),
    ).toBe(true);
  });
});
