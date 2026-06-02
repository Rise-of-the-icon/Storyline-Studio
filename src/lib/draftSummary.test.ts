import { describe, expect, it } from "vitest";
import { getDraftSummary } from "./draftSummary";
import { makeWikipediaSource } from "./contentModel";
import type {
  CustomMoment,
  DigitalTwinProfile,
  GuardrailReview,
  TimelineEvent,
} from "../types/twin";

/**
 * Pinning tests for the `DraftSummary` contract. The S6 saved-card and the
 * S1 ResumeDraftPanel both consume this shape — a regression in either
 * field would silently break the producer's "what did I save?" surface, so
 * we lock the field set here.
 */

function timelineEvent(
  overrides: Partial<TimelineEvent> = {},
): TimelineEvent {
  return {
    id: "evt-1",
    title: "Event",
    description: "Description",
    year: 2010,
    decade: "2010s",
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 50,
    source: makeWikipediaSource("https://en.wikipedia.org/wiki/X"),
    ...overrides,
  };
}

function customMoment(
  overrides: Partial<CustomMoment> = {},
): CustomMoment {
  return {
    id: "cm-1",
    title: "Moment",
    description: "Body",
    emotionalSignificance: "Why it matters",
    visibility: "Internal",
    sensitivity: "Low",
    sourceNotes: "Producer interview.",
    ...overrides,
  };
}

function guardrailReview(
  overrides: Partial<GuardrailReview> = {},
): GuardrailReview {
  return {
    eventId: "evt-1",
    trigger: "Low source confidence",
    severity: "Medium",
    status: "NeedsReview",
    ...overrides,
  };
}

function draft(
  overrides: Partial<DigitalTwinProfile> = {},
): DigitalTwinProfile {
  return {
    schemaVersion: 2,
    twinId: "twin-x",
    consentAcknowledged: true,
    consentAcknowledgedAtISO: "2026-06-01T19:00:00.000Z",
    coreIdentity: { name: "Lina Solano (demo)" },
    wikipedia: {
      pageId: "demo-lina-solano",
      title: "Lina Solano",
      summary: "Summary",
      description: "Description",
      sourceUrl: "https://example.com/demo/lina-solano",
    },
    timeline: [
      timelineEvent({ id: "e1", approvalStatus: "Reviewed", confidence: "High" }),
      timelineEvent({ id: "e2", approvalStatus: "Reviewed", confidence: "Medium" }),
      timelineEvent({ id: "e3", approvalStatus: "Draft", confidence: "High" }),
    ],
    customMoments: [customMoment({ id: "cm1" }), customMoment({ id: "cm2" })],
    guardrailReviews: [
      guardrailReview({ eventId: "e1", status: "Reviewed", severity: "High" }),
      guardrailReview({ eventId: "e2", status: "Deferred", severity: "Medium" }),
    ],
    draftStatus: "draft",
    createdAtISO: "2026-06-01T18:00:00.000Z",
    lastSavedAtISO: "2026-06-01T19:30:00.000Z",
    ...overrides,
  };
}

describe("getDraftSummary — core fields", () => {
  it("exposes subject name + twinId", () => {
    const s = getDraftSummary(draft());
    expect(s.subjectName).toBe("Lina Solano (demo)");
    expect(s.twinId).toBe("twin-x");
  });

  it("flags demo subjects via pageId prefix", () => {
    expect(getDraftSummary(draft()).isDemo).toBe(true);
    expect(
      getDraftSummary(
        draft({
          wikipedia: {
            ...draft().wikipedia,
            pageId: "12345",
          },
        }),
      ).isDemo,
    ).toBe(false);
  });

  it("counts events and breaks out approved vs deferred", () => {
    const s = getDraftSummary(draft());
    expect(s.eventCount).toBe(3);
    expect(s.approvedEventCount).toBe(2);
    // The lone "Draft" status event counts as deferred for display.
    expect(s.deferredEventCount).toBe(1);
  });

  it("counts custom moments", () => {
    expect(getDraftSummary(draft()).customMomentCount).toBe(2);
  });
});

describe("getDraftSummary — confidence label", () => {
  it("'No events' for empty timeline", () => {
    expect(
      getDraftSummary(draft({ timeline: [] })).confidenceLabel,
    ).toBe("No events");
  });

  it("single confidence level surfaces as-is", () => {
    expect(
      getDraftSummary(
        draft({
          timeline: [timelineEvent({ confidence: "High" })],
        }),
      ).confidenceLabel,
    ).toBe("High");
  });

  it("mixed High + Medium → 'Mixed'", () => {
    expect(
      getDraftSummary(
        draft({
          timeline: [
            timelineEvent({ id: "a", confidence: "High" }),
            timelineEvent({ id: "b", confidence: "Medium" }),
          ],
        }),
      ).confidenceLabel,
    ).toBe("Mixed");
  });

  it("any Low → 'Mixed (includes low confidence)'", () => {
    expect(
      getDraftSummary(
        draft({
          timeline: [
            timelineEvent({ id: "a", confidence: "High" }),
            timelineEvent({ id: "b", confidence: "Low" }),
          ],
        }),
      ).confidenceLabel,
    ).toBe("Mixed (includes low confidence)");
  });
});

describe("getDraftSummary — guardrail roll-up", () => {
  it("zeroes for no reviews", () => {
    const s = getDraftSummary(draft({ guardrailReviews: [] }));
    expect(s.guardrail.total).toBe(0);
    expect(s.guardrail.cleared).toBe(0);
    expect(s.guardrail.deferred).toBe(0);
    expect(s.guardrail.unresolved).toBe(0);
    expect(s.guardrail.highBlocking).toBe(0);
    expect(s.guardrail.saveAllowed).toBe(true);
  });

  it("counts Reviewed as cleared, Deferred separately, NeedsReview as unresolved", () => {
    const s = getDraftSummary(draft());
    // From the fixture: 1 Reviewed + 1 Deferred.
    expect(s.guardrail.total).toBe(2);
    expect(s.guardrail.cleared).toBe(1);
    expect(s.guardrail.deferred).toBe(1);
    expect(s.guardrail.unresolved).toBe(0);
  });

  it("blocks save when any High-severity NeedsReview is present", () => {
    const s = getDraftSummary(
      draft({
        guardrailReviews: [
          guardrailReview({ severity: "High", status: "NeedsReview" }),
        ],
      }),
    );
    expect(s.guardrail.highBlocking).toBe(1);
    expect(s.guardrail.saveAllowed).toBe(false);
  });
});

describe("getDraftSummary — voice contexts + consent", () => {
  it("counts savedVoiceContexts (defaults to 0 when absent)", () => {
    expect(getDraftSummary(draft()).savedVoiceContextCount).toBe(0);
    expect(
      getDraftSummary(
        draft({
          savedVoiceContexts: [
            {
              id: "vc-1",
              savedAtISO: "2026-06-01T19:30:00.000Z",
              eventId: "e1",
              eventTitle: "Anchor event",
              audience: "Producer",
              mode: "Reflective",
              narrativeGoalId: "ng",
              narrativeGoalLabel: "Goal",
              signatureState: "state",
              winningFamily: "family",
              direction: "warm",
              intensity: 60,
              warmth: 70,
              pacing: 50,
              confidence: 75,
              reason: "n/a",
              steeringTag: "tag",
              sampleScript: "Sample.",
            },
          ],
        }),
      ).savedVoiceContextCount,
    ).toBe(1);
  });

  it("surfaces consent acknowledgement bits", () => {
    const s = getDraftSummary(draft());
    expect(s.consentAcknowledged).toBe(true);
    expect(s.consentAcknowledgedAtISO).toBe("2026-06-01T19:00:00.000Z");
  });
});

describe("getDraftSummary — last saved label", () => {
  it("uses lastSavedAtISO when present", () => {
    const s = getDraftSummary(draft());
    expect(s.lastSavedAtISO).toBe("2026-06-01T19:30:00.000Z");
    expect(s.lastSavedAtISOIsExplicit).toBe(true);
    expect(s.lastSavedLabel.length).toBeGreaterThan(0);
  });

  it("falls back to createdAtISO when lastSavedAtISO is absent", () => {
    const s = getDraftSummary(
      draft({ lastSavedAtISO: undefined }),
    );
    expect(s.lastSavedAtISO).toBe("2026-06-01T18:00:00.000Z");
    expect(s.lastSavedAtISOIsExplicit).toBe(false);
  });
});
