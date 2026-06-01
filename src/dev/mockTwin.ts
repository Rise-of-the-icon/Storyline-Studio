import { SCHEMA_VERSION, type DigitalTwinProfile } from "../types/twin";

/** Minimal twin for storage harness tests (Prompt 0.2). */
export function createMockTwin(name = "Test Subject"): DigitalTwinProfile {
  const twinId = crypto.randomUUID();
  const now = new Date().toISOString();

  return {
    schemaVersion: SCHEMA_VERSION,
    twinId,
    consentAcknowledged: true,
    coreIdentity: { name },
    wikipedia: {
      pageId: "mock-page",
      title: name,
      summary: "Mock summary for storage test.",
      description: "Mock description.",
      sourceUrl: "https://en.wikipedia.org/wiki/Mock",
    },
    timeline: [],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: now,
  };
}
