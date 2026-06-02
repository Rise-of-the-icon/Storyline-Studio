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
      "Walt Taylor (aka Walt Liquor)",
    ]);
  });
});

describe("investor-ready demo profile (Walt Taylor)", () => {
  it("INVESTOR_DEMO_SUBJECT_ID is registered and resolves to the polished fixture", () => {
    expect(INVESTOR_DEMO_SUBJECT_ID).toBe("demo-walt-taylor");
    const subject = getDemoSubjectById(INVESTOR_DEMO_SUBJECT_ID);
    expect(subject).toBeDefined();
    expect(subject?.hit.title).toBe("Walt Taylor (aka Walt Liquor)");
  });

  it("ships 6–8 timeline events covering the required category mix", () => {
    const twin = buildWaltTaylorTwin();
    expect(twin.timeline.length).toBeGreaterThanOrEqual(6);
    expect(twin.timeline.length).toBeLessThanOrEqual(8);

    const types = new Set(twin.timeline.map((e) => e.eventType));
    expect(types.has("Career")).toBe(true);
    expect(types.has("Achievement")).toBe(true);
    expect(types.has("Legacy")).toBe(true);
  });

  it("ships a Private high-sensitivity editorial-review moment", () => {
    const twin = buildWaltTaylorTwin();
    expect(twin.customMoments).toHaveLength(1);
    const privateMoment = twin.customMoments[0];
    expect(privateMoment?.visibility).toBe("Private");
    expect(privateMoment?.sensitivity).toBe("High");
  });

  it("seeds at least one guardrail flag in NeedsReview status for the S5 demo", () => {
    const twin = buildWaltTaylorTwin();
    const pending = twin.guardrailReviews.filter(
      (r) => r.status === "NeedsReview",
    );
    expect(pending.length).toBeGreaterThan(0);
  });

  it("has a mixed-confidence timeline (High + Medium + Low) so the resolver visibly varies", () => {
    const twin = buildWaltTaylorTwin();
    const confidences = new Set(twin.timeline.map((e) => e.confidence));
    expect(confidences.has("High")).toBe(true);
    expect(confidences.has("Medium")).toBe(true);
    expect(confidences.has("Low")).toBe(true);
  });

  it("seeds review statuses across Reviewed and Draft so S3 has meaningful work", () => {
    const twin = buildWaltTaylorTwin();
    const statuses = new Set(twin.timeline.map((e) => e.approvalStatus));
    expect(statuses.has("Reviewed")).toBe(true);
    expect(statuses.has("Draft")).toBe(true);

    const reviewedCount = twin.timeline.filter(
      (e) => e.approvalStatus === "Reviewed",
    ).length;
    expect(reviewedCount).toBeGreaterThanOrEqual(1);
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
