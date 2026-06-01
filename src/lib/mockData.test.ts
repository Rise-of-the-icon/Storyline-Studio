import { describe, expect, it } from "vitest";
import {
  buildMichaelJordanTwin,
  buildThinProfileTwin,
  demoGuardrailFlagPresent,
} from "./mockData";

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
