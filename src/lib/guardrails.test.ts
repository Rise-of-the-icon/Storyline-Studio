import { describe, expect, it } from "vitest";
import type { CustomMoment } from "../types/twin";
import {
  allGuardrailsResolved,
  canClearReview,
  evaluateGuardrails,
  requiresEditorialNote,
} from "./guardrails";

function privateRelationshipsMoment(
  overrides: Partial<CustomMoment> = {},
): CustomMoment {
  return {
    id: "cm-private-001",
    title: "Private relationships",
    description: "Behind-the-scenes romantic relationship kept out of press.",
    emotionalSignificance: "High personal stakes",
    visibility: "Private",
    sensitivity: "Medium",
    sourceNotes: "Producer interview notes (unverified)",
    ...overrides,
  };
}

describe("evaluateGuardrails()", () => {
  it('flags "Private relationships" custom moment as High severity', () => {
    const reviews = evaluateGuardrails([], [privateRelationshipsMoment()]);

    const flag = reviews.find((r) => r.trigger === "Private relationships");
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe("High");
    expect(flag!.eventId).toBe("cm-private-001");
    expect(flag!.status).toBe("NeedsReview");
    expect(requiresEditorialNote(flag!)).toBe(true);
    expect(canClearReview({ ...flag!, status: "Reviewed" })).toBe(false);
    expect(
      canClearReview({
        ...flag!,
        status: "Reviewed",
        editorialNote: "Reviewed for demo; not legal clearance.",
      }),
    ).toBe(true);
  });

  it("starts unresolved until all reviews are Reviewed or Rejected", () => {
    const reviews = evaluateGuardrails([], [privateRelationshipsMoment()]);
    expect(allGuardrailsResolved(reviews)).toBe(false);
  });
});
