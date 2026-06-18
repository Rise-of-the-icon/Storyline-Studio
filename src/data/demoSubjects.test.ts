import { describe, expect, it } from "vitest";
import {
  buildMichaelJordanTwin,
  buildThinProfileTwin,
  buildDavidWestTwin,
  buildWaltTaylorTwin,
  DEMO_SUBJECTS,
  demoGuardrailFlagPresent,
  getDemoSubjectById,
  getDemoSubjectForTwin,
  INVESTOR_DEMO_SUBJECT_ID,
  isDemoTwin,
  searchDemoSubjects,
} from "./demoSubjects";

describe("demo seed data (B1)", () => {
  it("Michael Jordan twin includes intentional Private relationships guardrail", () => {
    const twin = buildMichaelJordanTwin();
    expect(twin.timeline.length).toBe(10);
    expect(twin.customMoments.length).toBe(1);
    expect(demoGuardrailFlagPresent(twin)).toBe(true);
    expect(
      twin.guardrailReviews.some((r) => r.status === "NeedsReview"),
    ).toBe(true);
  });

  it("Michael Jordan timeline includes both Reviewed and Draft statuses", () => {
    const twin = buildMichaelJordanTwin();
    const statuses = new Set(twin.timeline.map((e) => e.approvalStatus));
    expect(statuses.has("Reviewed")).toBe(true);
    expect(statuses.has("Draft")).toBe(true);
  });

  it("includes low-confidence edge-case timeline record", () => {
    const twin = buildMichaelJordanTwin();
    const rumor = twin.timeline.find((e) => e.confidence === "Low");
    expect(rumor?.title).toContain("Unverified");
  });

  it("thin profile has fewer than 5 events for S3 thin-timeline state", () => {
    const twin = buildThinProfileTwin();
    expect(twin.timeline.length).toBe(3);
    expect(twin.timeline.length).toBeLessThan(5);
  });
});

describe("demo subject metadata", () => {
  it("every demo subject ships category, bio, and voice profile defaults", () => {
    expect(DEMO_SUBJECTS.length).toBeGreaterThan(0);
    for (const subject of DEMO_SUBJECTS) {
      expect(subject.category === "Sports" || subject.category === "Music").toBe(
        true,
      );
      expect(subject.bio.trim().length).toBeGreaterThan(0);
      expect(subject.bio.length).toBeLessThanOrEqual(280);
      expect(subject.voiceProfile.archetype.trim().length).toBeGreaterThan(0);
      expect(subject.voiceProfile.toneNote.trim().length).toBeGreaterThan(0);
    }
  });

  it("each subject has a stable id resolvable via getDemoSubjectById", () => {
    for (const subject of DEMO_SUBJECTS) {
      const fetched = getDemoSubjectById(subject.id);
      expect(fetched?.id).toBe(subject.id);
    }
  });

  it("searchDemoSubjects matches case-insensitively across match terms", () => {
    expect(searchDemoSubjects("DAVID").length).toBeGreaterThan(0);
    expect(searchDemoSubjects("liquor").length).toBeGreaterThan(0);
    expect(searchDemoSubjects("a")).toEqual([]); // < 2 chars
  });

  it("registers exactly the three requested demo profiles", () => {
    expect(DEMO_SUBJECTS.map((subject) => subject.hit.title)).toEqual([
      "David West",
      "Tom Hoover",
      "Walt Liquor",
    ]);
  });
});

describe("producer-verified demo profile (Walt Liquor)", () => {
  it("INVESTOR_DEMO_SUBJECT_ID is registered and resolves to Walt Liquor", () => {
    expect(INVESTOR_DEMO_SUBJECT_ID).toBe("demo-walt-taylor");
    const subject = getDemoSubjectById(INVESTOR_DEMO_SUBJECT_ID);
    expect(subject).toBeDefined();
    expect(subject?.hit.title).toBe("Walt Liquor");
  });

  it("ships the producer-verified Walt Liquor narrative moment", () => {
    const twin = buildWaltTaylorTwin();
    expect(twin.coreIdentity.name).toBe("Walt Liquor");
    expect(twin.timeline).toHaveLength(1);

    const event = twin.timeline[0];
    expect(event?.id).toBe("walt-liquor-fake-it-till-you-make-it-2020");
    expect(event?.title).toBe("Fake It Till You Make It");
    expect(event?.eventType).toBe("Career");
    expect(event?.approvalStatus).toBe("Reviewed");
    expect(event?.source.type).toBe("producer");
    expect(event?.source.verified).toBe(true);
    expect(event?.source.url).toContain("youtube.com");
    expect(event?.source.notes).toContain("Walt Liquor Narrative Story.docx");
  });

  it("does not ship fabricated private or rumor moments", () => {
    const twin = buildWaltTaylorTwin();
    expect(twin.customMoments).toHaveLength(0);
    expect(twin.timeline.some((event) => event.confidence === "Low")).toBe(false);
  });

  it("does not manufacture guardrail flags for Walt", () => {
    const twin = buildWaltTaylorTwin();
    const pending = twin.guardrailReviews.filter(
      (r) => r.status === "NeedsReview",
    );
    expect(pending).toHaveLength(0);
  });

  it("keeps the Walt source as producer-backed medium confidence", () => {
    const twin = buildWaltTaylorTwin();
    const confidences = new Set(twin.timeline.map((e) => e.confidence));
    expect(confidences.has("Medium")).toBe(true);
    expect(confidences.has("Low")).toBe(false);
  });

  it("has an approved anchoring event for Voice Studio", () => {
    const twin = buildWaltTaylorTwin();
    const statuses = new Set(twin.timeline.map((e) => e.approvalStatus));
    expect(statuses.has("Reviewed")).toBe(true);
    expect(statuses.has("Draft")).toBe(false);

    const reviewedCount = twin.timeline.filter(
      (e) => e.approvalStatus === "Reviewed",
    ).length;
    expect(reviewedCount).toBe(1);
  });

  it("voice profile defaults make sense for an Intimate documentary tone", () => {
    const subject = getDemoSubjectById(INVESTOR_DEMO_SUBJECT_ID);
    expect(subject?.voiceProfile.archetype).toBe("the-poet");
    expect(subject?.voiceProfile.defaultAudience).toBe("Intimate");
    expect(subject?.voiceProfile.defaultMode).toBe("Documentary");
    expect(subject?.voiceProfile.defaultNarrativeGoal).toBe("honor");
    expect(subject?.voiceProfile.toneNote.length).toBeGreaterThan(0);
  });

  it("flagged as the headline pill in the DEMO_SUBJECTS catalog (appears first)", () => {
    expect(DEMO_SUBJECTS.some((subject) => subject.id === INVESTOR_DEMO_SUBJECT_ID)).toBe(true);
  });
});

describe("isDemoTwin / getDemoSubjectForTwin", () => {
  it("detects demo twins by their wikipedia.pageId prefix", () => {
    const twin = buildDavidWestTwin();
    expect(isDemoTwin(twin)).toBe(true);
    expect(getDemoSubjectForTwin(twin)?.id).toBe("demo-david-west");
  });

  it("does not flag a non-demo wikipedia profile", () => {
    expect(
      isDemoTwin({
        wikipedia: {
          pageId: "12345",
          title: "Live person",
          summary: "",
          description: "",
          sourceUrl: "",
        },
      }),
    ).toBe(false);
  });
});
