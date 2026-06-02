import { describe, expect, it } from "vitest";
import {
  canImportTimeline,
  canPersistDraft,
  CONSENT_ACKNOWLEDGEMENT_LABEL,
  CONSENT_NOT_LEGAL_CLEARANCE_NOTE,
  CONSENT_WHY_THIS_MATTERS,
  withConsent,
} from "./consent";
import { SCHEMA_VERSION, type DigitalTwinProfile } from "../types/twin";

function fixtureTwin(overrides: Partial<DigitalTwinProfile> = {}): DigitalTwinProfile {
  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: "consent-test",
    consentAcknowledged: false,
    coreIdentity: { name: "Test Subject" },
    wikipedia: {
      pageId: "test",
      title: "Test Subject",
      summary: "summary",
      description: "description",
      sourceUrl: "https://example.com",
    },
    timeline: [],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("consent gate (gate 4)", () => {
  it("blocks persist when consent is not acknowledged", () => {
    expect(canPersistDraft(fixtureTwin({ consentAcknowledged: false }))).toBe(
      false,
    );
    expect(canPersistDraft(fixtureTwin({ consentAcknowledged: true }))).toBe(
      true,
    );
  });

  it("blocks import when consent is not acknowledged", () => {
    expect(canImportTimeline(fixtureTwin({ consentAcknowledged: false }))).toBe(
      false,
    );
    expect(canImportTimeline(fixtureTwin({ consentAcknowledged: true }))).toBe(
      true,
    );
  });

  it("rejects a tampered draft where consent is missing but other fields look real", () => {
    const tampered = fixtureTwin({
      consentAcknowledged: false,
      timeline: [
        {
          id: "evt-1",
          title: "Looks legitimate",
          description: "Has events but no consent",
          year: 2000,
          decade: "2000s",
          eventType: "Career",
          confidence: "High",
          approvalStatus: "Reviewed",
          sensitivity: "Low",
          emotionalSignificance: 60,
          source: {
            type: "wikipedia",
            verified: true,
            importedAtISO: "2026-06-01T00:00:00.000Z",
          },
        },
      ],
    });
    expect(canImportTimeline(tampered)).toBe(false);
    expect(canPersistDraft(tampered)).toBe(false);
  });
});

describe("withConsent", () => {
  it("stamps a fresh ISO timestamp on first acknowledgement", () => {
    const twin = fixtureTwin();
    const next = withConsent(twin, true, "2026-06-01T10:00:00.000Z");
    expect(next.consentAcknowledged).toBe(true);
    expect(next.consentAcknowledgedAtISO).toBe("2026-06-01T10:00:00.000Z");
  });

  it("preserves the original timestamp on re-affirm (does not overwrite)", () => {
    const twin = fixtureTwin({
      consentAcknowledged: true,
      consentAcknowledgedAtISO: "2026-05-30T08:00:00.000Z",
    });
    const next = withConsent(twin, true, "2026-06-01T10:00:00.000Z");
    expect(next.consentAcknowledgedAtISO).toBe("2026-05-30T08:00:00.000Z");
  });

  it("clears the timestamp when consent is unchecked", () => {
    const twin = fixtureTwin({
      consentAcknowledged: true,
      consentAcknowledgedAtISO: "2026-05-30T08:00:00.000Z",
    });
    const next = withConsent(twin, false);
    expect(next.consentAcknowledged).toBe(false);
    expect(next.consentAcknowledgedAtISO).toBeUndefined();
  });

  it("re-stamps fresh after a clear → re-check cycle", () => {
    const twin = fixtureTwin({
      consentAcknowledged: true,
      consentAcknowledgedAtISO: "2026-05-30T08:00:00.000Z",
    });
    const cleared = withConsent(twin, false);
    const reAffirmed = withConsent(cleared, true, "2026-06-01T10:00:00.000Z");
    expect(reAffirmed.consentAcknowledgedAtISO).toBe(
      "2026-06-01T10:00:00.000Z",
    );
  });

  it("does not mutate the input twin (immutability check)", () => {
    const twin = fixtureTwin();
    const next = withConsent(twin, true, "2026-06-01T10:00:00.000Z");
    expect(twin.consentAcknowledged).toBe(false);
    expect(twin.consentAcknowledgedAtISO).toBeUndefined();
    expect(next).not.toBe(twin);
  });
});

describe("consent copy regressions", () => {
  it("primary label matches the producer-approved consent string verbatim", () => {
    expect(CONSENT_ACKNOWLEDGEMENT_LABEL).toBe(
      "I understand this draft uses public-source research only. I confirm I have authorization to create or evaluate this digital twin profile, or I am using it strictly for internal demo/research purposes.",
    );
  });

  it("not-legal-clearance note matches verbatim", () => {
    expect(CONSENT_NOT_LEGAL_CLEARANCE_NOTE).toBe(
      "This step is not legal clearance. Production use of a person's voice, likeness, story, or persona requires appropriate rights, consent, and review.",
    );
  });

  it("'Why this matters' covers the four required disclosures", () => {
    expect(CONSENT_WHY_THIS_MATTERS).toHaveLength(4);
    const titles = CONSENT_WHY_THIS_MATTERS.map((item) =>
      item.title.toLowerCase(),
    );
    expect(titles.some((t) => t.includes("public sources"))).toBe(true);
    expect(
      titles.some((t) => t.includes("custom") && t.includes("private")),
    ).toBe(true);
    expect(
      titles.some(
        (t) => t.includes("voice generation") && t.includes("consent"),
      ),
    ).toBe(true);
    expect(
      titles.some(
        (t) => t.includes("guardrail") && t.includes("not legal clearance"),
      ),
    ).toBe(true);
  });

  it("none of the consent copy contains placeholder phrases", () => {
    const allCopy = [
      CONSENT_ACKNOWLEDGEMENT_LABEL,
      CONSENT_NOT_LEGAL_CLEARANCE_NOTE,
      ...CONSENT_WHY_THIS_MATTERS.map((b) => `${b.title} ${b.body}`),
    ].join("\n");
    expect(allCopy).not.toMatch(/demo placeholder/i);
    expect(allCopy).not.toMatch(/lorem/i);
    expect(allCopy).not.toMatch(/\bTBD\b/);
    expect(allCopy).not.toMatch(/coming soon/i);
  });
});
