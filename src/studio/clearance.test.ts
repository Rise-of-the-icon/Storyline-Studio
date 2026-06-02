import { describe, expect, it } from "vitest";
import { resolve } from "../lib/resolver";
import { SCHEMA_VERSION, type DigitalTwinProfile, type TimelineEvent } from "../types/twin";
import { evaluatePerformanceClearance } from "./clearance";

function timelineEvent(id: string): TimelineEvent {
  return {
    id,
    title: "1998 NBA Finals — Game 6",
    description: "Championship-clinching performance.",
    year: 1998,
    decade: "1990s",
    eventType: "Achievement",
    source: {
      type: "wikipedia",
      verified: true,
      importedAtISO: new Date().toISOString(),
    },
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 90,
  };
}

function baseDraft(overrides: Partial<DigitalTwinProfile> = {}): DigitalTwinProfile {
  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: "twin-test",
    consentAcknowledged: true,
    coreIdentity: { name: "Test Athlete" },
    wikipedia: {
      pageId: "test",
      title: "Test",
      summary: "Summary",
      description: "Desc",
      sourceUrl: "https://example.com",
    },
    timeline: [timelineEvent("evt-1")],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "saved",
    createdAtISO: new Date().toISOString(),
    ...overrides,
  };
}

function resolverForEvent(eventId: string) {
  return resolve({
    domain: "sports",
    archetype: "the-closer",
    eventId,
    eventTitle: "1998 NBA Finals — Game 6",
    intent: "Celebrate the defining championship moment",
    mode: "Narrator",
    sensitivity: "Low",
    confidence: "High",
  });
}

describe("evaluatePerformanceClearance", () => {
  it("passes when context is clean", () => {
    const result = evaluatePerformanceClearance(
      baseDraft(),
      "evt-1",
      resolverForEvent("evt-1"),
    );
    expect(result.status).toBe("pass");
  });

  it("blocks without selected event", () => {
    const result = evaluatePerformanceClearance(
      baseDraft(),
      null,
      null,
    );
    expect(result.status).toBe("block");
    expect(result.details).toEqual([
      "Choose one approved timeline event. The resolver needs an event before it can create a performance context.",
    ]);
  });

  it("explains how to recover when the resolver has no output", () => {
    const result = evaluatePerformanceClearance(baseDraft(), "evt-1", null);
    expect(result.status).toBe("block");
    expect(result.details).toEqual([
      "The resolver could not create a performance context from the selected event. Return to Scene Context and review the settings.",
    ]);
  });

  it("warns when resolver has warnings", () => {
    const output = resolverForEvent("evt-1");
    output.guardrailWarnings.push("High sensitivity topic");
    const result = evaluatePerformanceClearance(baseDraft(), "evt-1", output);
    expect(result.status).toBe("warn");
  });

  it("blocks on unresolved guardrail reviews", () => {
    const draft = baseDraft({
      guardrailReviews: [
        {
          eventId: "evt-1",
          trigger: "Private relationships",
          severity: "High",
          status: "NeedsReview",
        },
      ],
    });
    const result = evaluatePerformanceClearance(
      draft,
      "evt-1",
      resolverForEvent("evt-1"),
    );
    expect(result.status).toBe("block");
    expect(result.details).toEqual([
      "1 producer guardrail flag still needs a decision. Review each flag in Step 5 before locking this context.",
    ]);
  });
});
