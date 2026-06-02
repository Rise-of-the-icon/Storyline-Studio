import { describe, expect, it } from "vitest";
import { buildWaltTaylorTwin } from "@/data/demoSubjects";
import { generateImportBundle } from "./timelineGenerator";
import type { DigitalTwinProfile, WikipediaProfile } from "@/types/twin";

/**
 * Tests the contract between `generateImportBundle` and S3:
 *
 *   1. Curated demo subjects always return a rich, structured timeline.
 *   2. Real Wikipedia imports return only events the heuristic could
 *      reasonably extract — no "Wikipedia profile imported" filler row.
 *      If extraction yields nothing, the timeline is empty and S3's
 *      empty-state handles the producer-facing copy.
 */

function realWikipediaDraft(
  wiki: Partial<WikipediaProfile> = {},
): DigitalTwinProfile {
  return {
    schemaVersion: 2,
    twinId: "real-twin",
    consentAcknowledged: false,
    coreIdentity: { name: "Real Subject" },
    wikipedia: {
      pageId: "12345", // not prefixed with "demo-"
      title: "Real Subject",
      description: "An obscure person",
      summary: "Real Subject is a person without a useful biography.",
      sourceUrl: "https://en.wikipedia.org/wiki/Real_Subject",
      ...wiki,
    },
    timeline: [],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: "2025-01-01T00:00:00.000Z",
  };
}

describe("generateImportBundle — curated demo path", () => {
  it("returns the Walt Taylor demo timeline verbatim", async () => {
    const seed = buildWaltTaylorTwin();
    const draft: DigitalTwinProfile = {
      ...seed,
      timeline: [],
      customMoments: [],
      guardrailReviews: [],
    };
    const bundle = await generateImportBundle(draft);
    expect(bundle.timeline.length).toBeGreaterThanOrEqual(5);
    expect(bundle.customMoments.length).toBeGreaterThan(0);
    // Every event from a curated demo carries a `demo` source.
    expect(
      bundle.timeline.every((e) => e.source.type === "demo"),
    ).toBe(true);
  });
});

describe("generateImportBundle — heuristic path", () => {
  it("emits zero events when the summary has no extractable sentences", async () => {
    // Every sentence is below the 24-char threshold the heuristic uses to
    // filter noise, so nothing gets extracted.
    const draft = realWikipediaDraft({
      summary: "Short. Tiny. None.",
    });
    const bundle = await generateImportBundle(draft);
    expect(bundle.timeline).toEqual([]);
    // No "Wikipedia profile imported" filler row. S3's TIMELINE_EMPTY surface
    // takes over from here.
  });

  it("extracts events when the summary contains explicit years", async () => {
    const draft = realWikipediaDraft({
      summary:
        "Real Subject (born 1972) is a person. In 1995 they founded a company. In 2010 they won an award.",
    });
    const bundle = await generateImportBundle(draft);
    expect(bundle.timeline.length).toBeGreaterThanOrEqual(2);
    // Year extraction populated `year` on each event.
    for (const event of bundle.timeline) {
      expect(event.year).toBeGreaterThan(1900);
      expect(event.year).toBeLessThan(2100);
    }
  });

  it("every heuristic event is sourced from Wikipedia (not demo)", async () => {
    const draft = realWikipediaDraft({
      summary:
        "Real Subject is from Earth. They were born in 1980 and graduated in 2002.",
    });
    const bundle = await generateImportBundle(draft);
    expect(bundle.timeline.length).toBeGreaterThan(0);
    expect(
      bundle.timeline.every((e) => e.source.type === "wikipedia"),
    ).toBe(true);
  });
});
