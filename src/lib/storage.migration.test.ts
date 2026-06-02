import { describe, expect, it } from "vitest";
import { migrateV1ToV2 } from "./storage";
import { SCHEMA_VERSION, type DigitalTwinProfile } from "../types/twin";

/**
 * V1 → V2 migration regression suite. The V1 wire format predates the
 * source-backed content model — these tests pin the exact defaults the
 * migration injects so a legacy draft round-trips through the new UI
 * without losing data or silently being treated as verified.
 */

function v1Draft(
  overrides: Partial<DigitalTwinProfile> = {},
): DigitalTwinProfile {
  return {
    schemaVersion: 1,
    twinId: "twin-v1",
    consentAcknowledged: true,
    coreIdentity: { name: "Legacy subject" },
    wikipedia: {
      pageId: "demo-legacy",
      title: "Legacy",
      summary: "Summary",
      description: "Description",
      sourceUrl: "https://en.wikipedia.org/wiki/Legacy",
    },
    timeline: [
      {
        id: "evt-legacy",
        title: "Legacy event",
        description: "Some event from a V1 draft.",
        year: 2010,
        decade: "2010s",
        eventType: "Career",
        confidence: "High",
        approvalStatus: "Reviewed",
        sensitivity: "Low",
        emotionalSignificance: 60,
        source: {
          type: "wikipedia",
          url: "https://en.wikipedia.org/wiki/Legacy",
          citation: "Wikipedia",
          verified: true,
          importedAtISO: "2025-12-31T00:00:00.000Z",
        },
      },
    ],
    customMoments: [
      {
        id: "cm-legacy-verified",
        title: "Verified producer note",
        description: "Producer note backed by named on-record sources.",
        emotionalSignificance: "Key context",
        visibility: "Internal",
        sensitivity: "Low",
        sourceNotes: "Two on-record engineers confirmed.",
      },
      {
        id: "cm-legacy-unverified",
        title: "Unverified rumor",
        description: "Trade-press speculation, no corroboration.",
        emotionalSignificance: "Possibly inflammatory",
        visibility: "Private",
        sensitivity: "High",
        sourceNotes: "Anonymous rumor — unverified",
      },
    ],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: "2025-12-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("migrateV1ToV2()", () => {
  it("bumps schemaVersion to 2", () => {
    const v2 = migrateV1ToV2(v1Draft());
    expect(v2.schemaVersion).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(2);
  });

  it("defaults TimelineEvent.visibility to 'Internal' when absent", () => {
    const v2 = migrateV1ToV2(v1Draft());
    expect(v2.timeline[0]!.visibility).toBe("Internal");
  });

  it("preserves an explicit TimelineEvent.visibility", () => {
    const draft = v1Draft();
    draft.timeline[0]!.visibility = "Public";
    const v2 = migrateV1ToV2(draft);
    expect(v2.timeline[0]!.visibility).toBe("Public");
  });

  it("aliases TimelineEvent.category = eventType and summary = description", () => {
    const v2 = migrateV1ToV2(v1Draft());
    expect(v2.timeline[0]!.category).toBe("Career");
    expect(v2.timeline[0]!.summary).toBe(v2.timeline[0]!.description);
  });

  it("mirrors source.citation into source.notes when notes is absent", () => {
    const v2 = migrateV1ToV2(v1Draft());
    expect(v2.timeline[0]!.source.notes).toBe("Wikipedia");
  });

  it("adds CustomMoment.source — verified inferred from sourceNotes", () => {
    const v2 = migrateV1ToV2(v1Draft());
    const [verified, unverified] = v2.customMoments;
    expect(verified!.source?.sourceType).toBe("producer");
    expect(verified!.source?.verified).toBe(true);
    expect(unverified!.source?.sourceType).toBe("producer");
    expect(unverified!.source?.verified).toBe(false);
  });

  it("does not mutate the input draft", () => {
    const draft = v1Draft();
    const beforeJson = JSON.stringify(draft);
    migrateV1ToV2(draft);
    expect(JSON.stringify(draft)).toBe(beforeJson);
  });

  it("is idempotent — re-running on its own output is a no-op", () => {
    const once = migrateV1ToV2(v1Draft());
    const twice = migrateV1ToV2({ ...once, schemaVersion: 1 });
    expect(JSON.stringify(once)).toBe(JSON.stringify(twice));
  });
});
