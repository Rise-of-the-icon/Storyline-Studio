import { SCHEMA_VERSION, type DigitalTwinProfile } from "@/types/twin";

/**
 * Storage-harness fixture only. NEVER reach for this from a real user flow —
 * for an explicit demo subject in the wizard, use a `DEMO_SUBJECTS`
 * entry from `src/data/demoSubjects.ts` and `createDraftFromDemoSubject`.
 *
 * The intentionally hokey copy below ("Storage harness fixture") makes it
 * obvious in the UI if this ever leaks into a screen.
 */
export function createStorageTestTwin(
  name: string = "Storage Test Twin",
): DigitalTwinProfile {
  const twinId = crypto.randomUUID();
  const now = new Date().toISOString();

  return {
    schemaVersion: SCHEMA_VERSION,
    twinId,
    consentAcknowledged: true,
    coreIdentity: { name },
    wikipedia: {
      pageId: "storage-harness-fixture",
      title: name,
      summary: "Storage harness fixture — not a real subject.",
      description: "Storage harness fixture (dev-only)",
      sourceUrl: "https://en.wikipedia.org/wiki/Special:BlankPage",
    },
    timeline: [],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: now,
  };
}
