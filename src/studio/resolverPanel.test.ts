/**
 * Unit tests for the pure helpers backing the redesigned ResolverPanel.
 *
 * The component itself (`ResolverPanel.tsx`) is JSX-only; the logic worth
 * regression-testing lives in `whyThisFeeling.ts` and `studioCopy.ts`:
 *  - `buildWhyThisFeelingRationale` — the deterministic prose builder.
 *  - `arcPositionsFor` — Open / Build / Peak labelling for the arc viz.
 *  - `buildArcAccessibleSummary` — the SVG `aria-label` shape.
 *  - `studioCopy` exports — pinned microcopy used in tooltips + inline text.
 *
 * Keeping these tests at the helper level means we can run them in the
 * existing node-only vitest environment (no jsdom dependency) and can pin
 * the producer-facing copy so subsequent edits are intentional.
 */

import { describe, expect, it } from "vitest";
import type { ResolverBeat, ResolverOutput } from "../types/resolver";
import {
  ARC_POSITION_LABELS,
  CONFIDENCE_DESCRIPTION,
  EMOTIONAL_ARC_DESCRIPTION,
  EMOTIONAL_STATE_DESCRIPTION,
  INPUTS_LABEL,
  INTENSITY_DESCRIPTION,
  PACING_DESCRIPTION,
  RESOLVED_FEELING_EYEBROW,
  RESOLVER_DESCRIPTION,
  RESOLVER_INPUTS_LABEL,
  RESOLVER_LIVE_NOTE,
  STEERING_TAG_DESCRIPTION,
  STEERING_TAG_LABEL,
  WARMTH_DESCRIPTION,
  WHY_THIS_FEELING_LABEL,
  WINNING_FAMILY_LABEL,
} from "./studioCopy";
import {
  arcPositionsFor,
  buildArcAccessibleSummary,
  buildWhyThisFeelingRationale,
  narrativeGoalLabelFor,
} from "./whyThisFeeling";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function beat(
  role: string,
  state: string,
  intensity: number,
  steeringTag = "steady",
): ResolverBeat {
  return { role, state, steeringTag, intensity };
}

function fixtureOutput(overrides: Partial<ResolverOutput> = {}): ResolverOutput {
  return {
    domain: "sports",
    winningFamily: "Joy",
    signatureState: "Triumphant Resolve",
    direction: "ascending",
    beats: [
      beat("open", "Composed", 35),
      beat("build", "Lifting", 60),
      beat("peak", "Triumphant", 90, "peak-roar"),
    ],
    intensity: 72,
    warmth: 64,
    pacing: 58,
    confidence: 81,
    reason: "Triumphant resolution of the 1998 Finals — Game 6 moment.",
    guardrailWarnings: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildWhyThisFeelingRationale
// ---------------------------------------------------------------------------

describe("buildWhyThisFeelingRationale — deterministic plain-English prose", () => {
  it("references each of the four live inputs and the resolved state", () => {
    const out = buildWhyThisFeelingRationale({
      eventTitle: "1998 Finals — Game 6",
      eventDecade: "1990s",
      eventYear: 1998,
      audience: "Arena",
      mode: "Narrator",
      narrativeGoalId: "celebrate",
      signatureState: "Triumphant Resolve",
      winningFamily: "Joy",
    });

    // Every live input is named somewhere in the sentence.
    expect(out).toContain("1998 Finals — Game 6");
    expect(out).toContain("1998");
    expect(out).toContain("1990s");
    expect(out).toContain("Arena");
    expect(out).toContain("Narrator");
    expect(out).toContain("celebrate the moment");
    expect(out).toContain("Triumphant Resolve");
    expect(out).toContain("Joy family");
    expect(out.startsWith("Because the producer anchored")).toBe(true);
  });

  it("is deterministic — same inputs always produce the same prose", () => {
    const inputs = {
      eventTitle: "Tour de France crash",
      eventDecade: "2010s",
      eventYear: 2014,
      audience: "Intimate" as const,
      mode: "Documentary" as const,
      narrativeGoalId: "mourn" as const,
      signatureState: "Quiet Loss",
      winningFamily: "Grief",
    };
    const a = buildWhyThisFeelingRationale(inputs);
    const b = buildWhyThisFeelingRationale(inputs);
    expect(a).toBe(b);
  });

  it("falls back gracefully when decade is missing", () => {
    const out = buildWhyThisFeelingRationale({
      eventTitle: "Studio session",
      eventYear: 2007,
      audience: "Broadcast",
      mode: "Q&A",
      narrativeGoalId: "explain",
      signatureState: "Measured Recall",
      winningFamily: "Reflective",
    });
    expect(out).toContain("\"Studio session\" (2007)");
    expect(out).not.toContain("undefined");
    expect(out).not.toContain(", )");
  });

  it("falls back gracefully when both year and decade are missing", () => {
    const out = buildWhyThisFeelingRationale({
      eventTitle: "Backstage moment",
      audience: "Peers",
      mode: "Narrator",
      narrativeGoalId: "honor",
      signatureState: "Held Weight",
      winningFamily: "Reverence",
    });
    expect(out).toContain("\"Backstage moment\"");
    expect(out).not.toContain("()");
    expect(out).not.toContain("undefined");
  });

  it("uses a distinct verb phrase for every narrative goal", () => {
    const phrases = new Set<string>();
    (["celebrate", "honor", "challenge", "mourn", "explain"] as const).forEach(
      (goal) => {
        const out = buildWhyThisFeelingRationale({
          eventTitle: "T",
          audience: "Arena",
          mode: "Narrator",
          narrativeGoalId: goal,
          signatureState: "S",
          winningFamily: "F",
        });
        // Extract the verb phrase between "to " and ", the resolver".
        const m = out.match(/ to (.+?), the resolver picked/);
        expect(m).not.toBeNull();
        phrases.add(m![1]!);
      },
    );
    expect(phrases.size).toBe(5);
  });
});

describe("narrativeGoalLabelFor", () => {
  it("returns the canonical label for each goal id", () => {
    expect(narrativeGoalLabelFor("celebrate")).toBe("Celebrate");
    expect(narrativeGoalLabelFor("honor")).toBe("Honor legacy");
    expect(narrativeGoalLabelFor("challenge")).toBe("Challenge");
    expect(narrativeGoalLabelFor("mourn")).toBe("Mourn");
    expect(narrativeGoalLabelFor("explain")).toBe("Explain");
  });
});

// ---------------------------------------------------------------------------
// arcPositionsFor
// ---------------------------------------------------------------------------

describe("arcPositionsFor — Open / Build / Peak labelling", () => {
  it("returns an empty array for zero beats", () => {
    expect(arcPositionsFor([])).toEqual([]);
  });

  it("tags the single beat as 'peak' (it is the whole arc)", () => {
    expect(arcPositionsFor([beat("solo", "S", 50)])).toEqual(["peak"]);
  });

  it("tags two beats as open → peak", () => {
    const positions = arcPositionsFor([
      beat("open", "O", 20),
      beat("close", "C", 90),
    ]);
    expect(positions).toEqual(["open", "peak"]);
  });

  it("tags three beats as open / build / peak in order", () => {
    const positions = arcPositionsFor([
      beat("a", "A", 20),
      beat("b", "B", 50),
      beat("c", "C", 90),
    ]);
    expect(positions).toEqual(["open", "build", "peak"]);
  });

  it("returns one entry per beat for a six-beat arc", () => {
    const positions = arcPositionsFor([
      beat("a", "A", 10),
      beat("b", "B", 30),
      beat("c", "C", 50),
      beat("d", "D", 70),
      beat("e", "E", 85),
      beat("f", "F", 95),
    ]);
    expect(positions).toHaveLength(6);
    expect(positions[0]).toBe("open");
    expect(positions[positions.length - 1]).toBe("peak");
    expect(positions).toContain("build");
  });

  it("tags the absolute high-point as 'peak' even when it sits mid-arc (rise-then-breath)", () => {
    // A rise-then-breath arc: spike at index 2 (95), then settle to 40 by
    // the end. Even though index 2 is in the "build" third by position,
    // we want it tagged "peak" so the arc label tracks the actual high point.
    const positions = arcPositionsFor([
      beat("open", "O", 20),
      beat("mid", "M", 50),
      beat("spike", "S", 95),
      beat("settle1", "S", 60),
      beat("settle2", "S", 40),
    ]);
    expect(positions[2]).toBe("peak");
  });
});

// ---------------------------------------------------------------------------
// buildArcAccessibleSummary
// ---------------------------------------------------------------------------

describe("buildArcAccessibleSummary — SVG aria-label", () => {
  it("renders the full Open → Build → Peak shape with the resolved direction", () => {
    const summary = buildArcAccessibleSummary(fixtureOutput());
    expect(summary).toContain("Open low intensity");
    expect(summary).toContain("Build medium");
    expect(summary).toContain("Peak high");
    expect(summary).toContain("(ascending)");
    expect(summary.startsWith("Emotional arc:")).toBe(true);
  });

  it("omits absent positions on a one-beat arc", () => {
    const summary = buildArcAccessibleSummary(
      fixtureOutput({
        beats: [beat("only", "O", 80)],
        direction: "steady",
      }),
    );
    expect(summary).toContain("Peak high");
    expect(summary).not.toContain("Open");
    expect(summary).not.toContain("Build");
    expect(summary).toContain("(steady)");
  });

  it("falls back when the output has no beats", () => {
    const summary = buildArcAccessibleSummary(fixtureOutput({ beats: [] }));
    expect(summary).toBe("Emotional arc unavailable.");
  });

  it("uses the trailing settle value on a rise-then-breath arc", () => {
    // Spike of 95 in the middle, settle to 40 at the end. The summary
    // should still report the trailing intensity for the "Peak" slot so
    // producers reading the panel hear the arc's true ending, not just
    // its highest point.
    const summary = buildArcAccessibleSummary(
      fixtureOutput({
        beats: [
          beat("a", "A", 20),
          beat("b", "B", 50),
          beat("spike", "S", 95),
          beat("end", "E", 40),
        ],
        direction: "settle",
      }),
    );
    // 40 is the trailing intensity → "medium" bucket, not "high".
    expect(summary).toContain("Peak medium");
    expect(summary).toContain("(settle)");
  });
});

// ---------------------------------------------------------------------------
// studioCopy — copy pins
// ---------------------------------------------------------------------------

describe("studioCopy — pinned microcopy constants", () => {
  it("RESOLVER_DESCRIPTION describes the resolver as a deterministic engine", () => {
    expect(RESOLVER_DESCRIPTION).toMatch(
      /deterministic|pure[- ]function|scoring/i,
    );
    expect(RESOLVER_DESCRIPTION.trim()).not.toBe("");
  });

  it("every per-axis description is a non-empty sentence ending with a period", () => {
    for (const description of [
      INTENSITY_DESCRIPTION,
      WARMTH_DESCRIPTION,
      PACING_DESCRIPTION,
      CONFIDENCE_DESCRIPTION,
    ]) {
      expect(description.trim().length).toBeGreaterThan(20);
      expect(description.trim().endsWith(".")).toBe(true);
    }
  });

  it("each axis description fits the tooltip + inline helper cap", () => {
    // The shared cap is `STUDIO_COPY_MAX_LENGTH` (220 chars) so the same
    // string can render in a Tooltip body and an inline helper at every
    // breakpoint without truncation. Pin it here so a future copy edit
    // that overshoots is caught at test time.
    const CAP = 220;
    for (const description of [
      INTENSITY_DESCRIPTION,
      WARMTH_DESCRIPTION,
      PACING_DESCRIPTION,
      CONFIDENCE_DESCRIPTION,
    ]) {
      expect(description.length).toBeLessThanOrEqual(CAP);
    }
  });

  it("EMOTIONAL_ARC_DESCRIPTION mentions the three-stage shape", () => {
    expect(EMOTIONAL_ARC_DESCRIPTION.toLowerCase()).toContain("peak");
  });

  it("EMOTIONAL_STATE_DESCRIPTION + STEERING_TAG_DESCRIPTION are populated", () => {
    expect(EMOTIONAL_STATE_DESCRIPTION.trim()).not.toBe("");
    expect(STEERING_TAG_DESCRIPTION.trim()).not.toBe("");
  });

  it("labels match the pinned producer vocabulary", () => {
    expect(RESOLVED_FEELING_EYEBROW).toBe("Resolved feeling");
    expect(WINNING_FAMILY_LABEL).toBe("Emotional family");
    expect(STEERING_TAG_LABEL).toBe("Steering tag");
    expect(WHY_THIS_FEELING_LABEL).toBe("Why this feeling");
    expect(INPUTS_LABEL).toBe("Inputs");
    expect(RESOLVER_INPUTS_LABEL).toBe("Resolver inputs");
  });

  it("RESOLVER_LIVE_NOTE invites the producer to change an input", () => {
    expect(RESOLVER_LIVE_NOTE.toLowerCase()).toMatch(/change|input/);
    expect(RESOLVER_LIVE_NOTE.toLowerCase()).toMatch(/re-resolve|real time|live/);
  });

  it("ARC_POSITION_LABELS pins Open / Build / Peak verbatim", () => {
    expect(ARC_POSITION_LABELS).toEqual({
      open: "Open",
      build: "Build",
      peak: "Peak",
    });
  });
});
