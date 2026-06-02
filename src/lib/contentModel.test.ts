import { describe, expect, it } from "vitest";
import {
  applyBulkApprovalStatus,
  countApproved,
  customMomentSource,
  eligibleVoiceStudioEvents,
  getDisplayApprovalStatus,
  getDisplayConfidence,
  getDisplaySensitivity,
  getDisplayVisibility,
  getEventDisplay,
  getMomentDisplay,
  getSourceNotes,
  getSourceType,
  getSourceUrl,
  getSourceVerified,
  isApprovedForVoiceStudio,
  makeDemoSource,
  makeProducerSource,
  makeWikipediaSource,
  sourceObjectTypeToCanonical,
  toSourceReference,
} from "./contentModel";
import type {
  CustomMoment,
  SourceObject,
  TimelineEvent,
} from "../types/twin";

function event(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: "evt-x",
    title: "Event",
    description: "Description",
    year: 2010,
    decade: "2010s",
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 50,
    source: makeWikipediaSource("https://example.com/x"),
    ...overrides,
  };
}

function moment(overrides: Partial<CustomMoment> = {}): CustomMoment {
  return {
    id: "cm-x",
    title: "Moment",
    description: "Body",
    emotionalSignificance: "Sig",
    visibility: "Internal",
    sensitivity: "Low",
    sourceNotes: "",
    ...overrides,
  };
}

describe("sourceObjectTypeToCanonical()", () => {
  it("preserves canonical types", () => {
    for (const t of ["wikipedia", "producer", "demo", "manual", "unknown"] as const) {
      expect(sourceObjectTypeToCanonical(t)).toBe(t);
    }
  });
  it('maps legacy "custom" → "producer"', () => {
    expect(sourceObjectTypeToCanonical("custom")).toBe("producer");
  });
});

describe("toSourceReference()", () => {
  it("lifts a SourceObject to the canonical SourceReference", () => {
    const so: SourceObject = {
      type: "wikipedia",
      url: "https://en.wikipedia.org/wiki/Test",
      citation: "Wikipedia",
      notes: "Notes",
      verified: true,
      importedAtISO: "2026-01-01T00:00:00.000Z",
      revisionId: "rev-1",
    };
    const ref = toSourceReference(so);
    expect(ref.sourceType).toBe("wikipedia");
    expect(ref.sourceUrl).toBe(so.url);
    // sourceNotes falls back to `citation` when `notes` would otherwise
    // shadow it on a Wikipedia event — both round-trip.
    expect(ref.sourceNotes).toBe("Wikipedia");
    expect(ref.verified).toBe(true);
    expect(ref.revisionId).toBe("rev-1");
  });
});

describe("customMomentSource()", () => {
  it("prefers the explicit V2 source block when present", () => {
    const m = moment({
      source: makeProducerSource({
        sourceNotes: "Corroborated by two engineers.",
        verified: true,
      }),
    });
    const ref = customMomentSource(m);
    expect(ref.sourceType).toBe("producer");
    expect(ref.verified).toBe(true);
  });
  it("falls back to V1 inference: blank sourceNotes → unverified", () => {
    const ref = customMomentSource(moment({ sourceNotes: "" }));
    expect(ref.verified).toBe(false);
  });
  it("V1 inference treats rumor/speculation/hearsay text as unverified", () => {
    for (const note of [
      "unverified producer rumor",
      "industry speculation",
      "hearsay from a friend",
    ]) {
      const ref = customMomentSource(moment({ sourceNotes: note }));
      expect(ref.verified).toBe(false);
    }
  });
  it("V1 inference treats corroborated notes as verified", () => {
    const ref = customMomentSource(
      moment({ sourceNotes: "Corroborated by two on-record engineers." }),
    );
    expect(ref.verified).toBe(true);
  });
});

describe("universal accessors", () => {
  it("getSourceType discriminates events vs moments", () => {
    expect(getSourceType(event())).toBe("wikipedia");
    expect(getSourceType(moment())).toBe("producer");
  });
  it("getSourceUrl returns the persisted URL on events, undefined on bare moments", () => {
    expect(getSourceUrl(event())).toBe("https://example.com/x");
    expect(getSourceUrl(moment())).toBeUndefined();
  });
  it("getSourceNotes pulls the producer source-notes block", () => {
    const e = event({
      source: { ...makeWikipediaSource("https://x"), citation: "Wikipedia (rev 42)" },
    });
    expect(getSourceNotes(e)).toBe("Wikipedia (rev 42)");
    const m = moment({
      source: makeProducerSource({ sourceNotes: "Two engineers", verified: true }),
    });
    expect(getSourceNotes(m)).toBe("Two engineers");
  });
  it("getSourceVerified always returns a boolean", () => {
    expect(getSourceVerified(event())).toBe(true);
    expect(getSourceVerified(moment())).toBe(false);
  });
});

describe("display-enum mappings", () => {
  it("confidence", () => {
    expect(getDisplayConfidence("High")).toBe("high");
    expect(getDisplayConfidence("Medium")).toBe("medium");
    expect(getDisplayConfidence("Low")).toBe("low");
    expect(getDisplayConfidence(undefined)).toBe("unknown");
  });
  it("approval", () => {
    expect(getDisplayApprovalStatus("Reviewed")).toBe("approved");
    expect(getDisplayApprovalStatus("NeedsReview")).toBe("needsReview");
    expect(getDisplayApprovalStatus("Rejected")).toBe("rejected");
    expect(getDisplayApprovalStatus("Draft")).toBe("deferred");
  });
  it("visibility (undefined defaults to internal)", () => {
    expect(getDisplayVisibility("Public")).toBe("public");
    expect(getDisplayVisibility("Internal")).toBe("internal");
    expect(getDisplayVisibility("Private")).toBe("private");
    expect(getDisplayVisibility(undefined)).toBe("internal");
  });
  it("sensitivity", () => {
    expect(getDisplaySensitivity("High")).toBe("high");
    expect(getDisplaySensitivity("Medium")).toBe("medium");
    expect(getDisplaySensitivity("Low")).toBe("low");
  });
});

describe("getEventDisplay()", () => {
  it("packs everything a badge row needs", () => {
    const d = getEventDisplay(
      event({ approvalStatus: "Reviewed", confidence: "Medium" }),
    );
    expect(d).toEqual({
      sourceType: "wikipedia",
      sourceUrl: "https://example.com/x",
      sourceVerified: true,
      confidence: "medium",
      approvalStatus: "approved",
      visibility: "internal",
      sensitivity: "low",
    });
  });
});

describe("getMomentDisplay()", () => {
  it("derives sourceType=producer and verified=false for legacy moments", () => {
    const d = getMomentDisplay(moment({ sourceNotes: "unverified producer notes" }));
    expect(d.sourceType).toBe("producer");
    expect(d.sourceVerified).toBe(false);
  });
  it("respects an explicit verified=true V2 source block", () => {
    const d = getMomentDisplay(
      moment({
        source: makeProducerSource({ verified: true, sourceUrl: "https://x" }),
      }),
    );
    expect(d.sourceVerified).toBe(true);
    expect(d.sourceUrl).toBe("https://x");
  });
});

describe("Voice Studio eligibility", () => {
  const approved = event({ id: "a", approvalStatus: "Reviewed" });
  const deferred = event({ id: "b", approvalStatus: "Draft" });
  const flagged = event({ id: "c", approvalStatus: "NeedsReview" });
  const rejected = event({ id: "d", approvalStatus: "Rejected" });

  it("isApprovedForVoiceStudio is strict on Reviewed", () => {
    expect(isApprovedForVoiceStudio(approved)).toBe(true);
    expect(isApprovedForVoiceStudio(deferred)).toBe(false);
    expect(isApprovedForVoiceStudio(flagged)).toBe(false);
    expect(isApprovedForVoiceStudio(rejected)).toBe(false);
  });
  it("eligibleVoiceStudioEvents filters in order", () => {
    const events = [approved, deferred, flagged, rejected];
    const got = eligibleVoiceStudioEvents(events).map((e) => e.id);
    expect(got).toEqual(["a"]);
  });
});

describe("source builders", () => {
  it("makeWikipediaSource → verified=true, type=wikipedia", () => {
    const s = makeWikipediaSource("https://en.wikipedia.org/wiki/X", "rev-1");
    expect(s.type).toBe("wikipedia");
    expect(s.verified).toBe(true);
    expect(s.url).toBe("https://en.wikipedia.org/wiki/X");
    expect(s.revisionId).toBe("rev-1");
  });
  it("makeDemoSource → type=demo, verified=true", () => {
    const s = makeDemoSource("https://demo");
    expect(s.type).toBe("demo");
    expect(s.verified).toBe(true);
  });
  it("makeProducerSource defaults to unverified", () => {
    expect(makeProducerSource().verified).toBe(false);
    expect(makeProducerSource({ verified: true }).verified).toBe(true);
  });
});

describe("countApproved", () => {
  it("returns 0 for empty list", () => {
    expect(countApproved([])).toBe(0);
  });
  it("counts only Reviewed status", () => {
    const list = [
      event({ id: "a", approvalStatus: "Draft" }),
      event({ id: "b", approvalStatus: "Reviewed" }),
      event({ id: "c", approvalStatus: "Reviewed" }),
      event({ id: "d", approvalStatus: "Flagged" }),
    ];
    expect(countApproved(list)).toBe(2);
  });
});

describe("applyBulkApprovalStatus", () => {
  const base = [
    event({ id: "a", approvalStatus: "Draft" }),
    event({ id: "b", approvalStatus: "Draft" }),
    event({ id: "c", approvalStatus: "Reviewed" }),
  ];

  it("returns the same list when no ids are supplied", () => {
    const result = applyBulkApprovalStatus(base, [], "Reviewed");
    expect(result).toBe(base);
  });

  it("updates only the targeted ids and preserves the rest", () => {
    const result = applyBulkApprovalStatus(base, ["a", "b"], "Reviewed");
    expect(result[0].approvalStatus).toBe("Reviewed");
    expect(result[1].approvalStatus).toBe("Reviewed");
    // Untargeted event still 'Reviewed' (unchanged identity preserved).
    expect(result[2]).toBe(base[2]);
  });

  it("is pure — does not mutate the input list", () => {
    const snapshot = base.map((e) => e.approvalStatus);
    applyBulkApprovalStatus(base, ["a"], "Reviewed");
    expect(base.map((e) => e.approvalStatus)).toEqual(snapshot);
  });

  it("can defer events that were already approved", () => {
    const result = applyBulkApprovalStatus(base, ["c"], "Draft");
    expect(result[2].approvalStatus).toBe("Draft");
  });

  it("silently ignores unknown ids without mutating the list", () => {
    const result = applyBulkApprovalStatus(
      base,
      ["zzz", "a"],
      "Reviewed",
    );
    expect(result[0].approvalStatus).toBe("Reviewed");
    expect(countApproved(result)).toBe(2); // 'a' newly + 'c' already
  });
});
