import { describe, expect, it } from "vitest";
import { hasUnsavedProgress } from "./unsavedChanges";
import { SCHEMA_VERSION, type DigitalTwinProfile } from "../types/twin";
import type { ScreenId } from "../types/navigation";

function makeDraft(): DigitalTwinProfile {
  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: "test-twin",
    consentAcknowledged: false,
    coreIdentity: { name: "Test Subject" },
    wikipedia: {
      pageId: "p-1",
      title: "Test Subject",
      summary: "",
      description: "",
      sourceUrl: "https://example.com/test",
    },
    timeline: [],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: new Date().toISOString(),
  };
}

describe("hasUnsavedProgress", () => {
  it("returns false when there is no draft, regardless of screen", () => {
    const screens: ScreenId[] = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
    for (const screen of screens) {
      expect(hasUnsavedProgress(null, screen)).toBe(false);
    }
  });

  it("returns false on S1 even with a draft (you are already home)", () => {
    expect(hasUnsavedProgress(makeDraft(), "S1")).toBe(false);
  });

  it("returns false on S6 — draft is explicitly committed there", () => {
    expect(hasUnsavedProgress(makeDraft(), "S6")).toBe(false);
  });

  it("returns true on every in-flight wizard screen (S2–S5, S7)", () => {
    const draft = makeDraft();
    const guarded: ScreenId[] = ["S2", "S3", "S4", "S5", "S7"];
    for (const screen of guarded) {
      expect(hasUnsavedProgress(draft, screen)).toBe(true);
    }
  });
});
