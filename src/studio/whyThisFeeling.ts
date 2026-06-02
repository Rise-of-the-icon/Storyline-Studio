/**
 * Pure helpers backing the "Why this feeling?" surface in the resolver panel.
 *
 * Kept side-effect-free so the rationale builder and the arc-position
 * labelling logic can be regression-tested without React. The actual rendering
 * lives in `ResolverPanel.tsx` and `EmotionalArcViz.tsx`.
 */

import type { ResolverBeat, ResolverOutput } from "../types/resolver";
import {
  NARRATIVE_GOAL_OPTIONS,
  type NarrativeGoalId,
  type StudioSceneSettings,
} from "./studioResolver";
import { ARC_POSITION_LABELS, type ArcPosition } from "./studioCopy";

export type { ArcPosition };

// ---------------------------------------------------------------------------
// Rationale — the deterministic "we picked X because Y" sentence.
// ---------------------------------------------------------------------------

export interface WhyThisFeelingInputs {
  eventTitle: string;
  /** e.g. "1990s" from `TimelineEvent.decade`. Optional — we omit if blank. */
  eventDecade?: string;
  /** e.g. 1998 from `TimelineEvent.year`. Optional — we omit if absent. */
  eventYear?: number;
  audience: StudioSceneSettings["audience"];
  mode: StudioSceneSettings["mode"];
  narrativeGoalId: NarrativeGoalId;
  /** The resolved `signatureState` (e.g. "Triumphant Resolve"). */
  signatureState: string;
  /** The resolved `winningFamily` (e.g. "Joy"). */
  winningFamily: string;
}

/** Map narrative goal id → producer-friendly verb phrase used in the prose. */
const GOAL_VERB_PHRASE: Record<NarrativeGoalId, string> = {
  celebrate: "celebrate the moment",
  honor: "honor what this meant",
  challenge: "channel the competitive fire of this moment",
  mourn: "sit with the loss",
  explain: "explain the moment with documentary restraint",
};

/** Pull the producer-facing label out of the canonical narrative-goal list. */
export function narrativeGoalLabelFor(id: NarrativeGoalId): string {
  return (
    NARRATIVE_GOAL_OPTIONS.find((g) => g.id === id)?.label ??
    NARRATIVE_GOAL_OPTIONS[0].label
  );
}

/**
 * Build a single, deterministic plain-English paragraph explaining why the
 * resolver settled on this emotional state for this scene. Same inputs always
 * produce the same prose — no AI variance, easy to regression-test.
 *
 * Designed to be readable aloud by a producer to a stakeholder: every clause
 * names one of the live inputs (event title, audience, conversation mode,
 * narrative goal), so the explanation is grounded in something the producer
 * actually chose.
 */
export function buildWhyThisFeelingRationale(
  inputs: WhyThisFeelingInputs,
): string {
  const {
    eventTitle,
    eventDecade,
    eventYear,
    audience,
    mode,
    narrativeGoalId,
    signatureState,
    winningFamily,
  } = inputs;

  const goalPhrase = GOAL_VERB_PHRASE[narrativeGoalId];

  // Compose the event clause. We prefer "in 1998 (1990s)" when both year and
  // decade are available; otherwise we fall back gracefully so a custom
  // moment with only a decade still produces clean prose.
  let eventClause = `"${eventTitle}"`;
  if (typeof eventYear === "number" && eventDecade) {
    eventClause = `"${eventTitle}" (${eventYear}, ${eventDecade})`;
  } else if (typeof eventYear === "number") {
    eventClause = `"${eventTitle}" (${eventYear})`;
  } else if (eventDecade) {
    eventClause = `"${eventTitle}" (${eventDecade})`;
  }

  return (
    `Because the producer anchored this moment to ${eventClause} ` +
    `and is speaking to an ${audience} audience in ${mode} mode to ${goalPhrase}, ` +
    `the resolver picked ${signatureState} from the ${winningFamily} family.`
  );
}

// ---------------------------------------------------------------------------
// Arc-position labelling — Open / Build / Peak across the beats array.
// ---------------------------------------------------------------------------

/**
 * Map every beat in a `ResolverOutput` to one of three logical positions:
 *
 *  - **Open** — earliest position(s). The first third of the beats.
 *  - **Build** — middle position(s).
 *  - **Peak** — final position(s) OR the single most-intense beat when the
 *    last beat isn't also the most intense (some narrative arcs settle after
 *    a midpoint peak, e.g. "rise then breath").
 *
 * Returns an array parallel to `beats` so the caller can render labels at
 * the same x-coordinates as the arc points.
 *
 * Edge cases:
 *  - 0 beats → empty array.
 *  - 1 beat → that beat is "Peak" (it's the entire arc; nothing precedes it).
 *  - 2 beats → "Open", "Peak".
 *  - 3+ beats → first third "Open", middle third "Build", last third "Peak".
 *    The single most-intense beat is also tagged "Peak" if it falls outside
 *    the last third; this prevents a "rise then breath" arc from labelling
 *    the actual peak as "Build".
 */
export function arcPositionsFor(beats: readonly ResolverBeat[]): ArcPosition[] {
  if (beats.length === 0) return [];
  if (beats.length === 1) return ["peak"];
  if (beats.length === 2) return ["open", "peak"];

  const n = beats.length;
  const openCutoff = Math.ceil(n / 3); // 3 → 1, 4 → 2, 5 → 2, 6 → 2, 7 → 3 …
  const peakCutoff = n - Math.ceil(n / 3); // mirror from the right

  const positions: ArcPosition[] = beats.map((_, i) => {
    if (i < openCutoff) return "open";
    if (i >= peakCutoff) return "peak";
    return "build";
  });

  // If the absolute most-intense beat sits outside the trailing "peak" band,
  // also tag *that* beat as peak so the visual label tracks the actual high
  // point. (Tie-breaks pick the latest index, matching the arc's read order.)
  let maxIdx = 0;
  for (let i = 1; i < n; i++) {
    if (beats[i].intensity >= beats[maxIdx].intensity) maxIdx = i;
  }
  if (positions[maxIdx] !== "peak") {
    positions[maxIdx] = "peak";
  }

  return positions;
}

/**
 * One-line accessible summary of the trajectory for the SVG's `aria-label`.
 * Shape: "Emotional arc: Open <low> intensity → Build <medium> → Peak <high>."
 *
 * Uses the resolved direction (ascending / settle / steady) and the actual
 * intensity values to keep the summary grounded in the live data, not in a
 * generic template.
 */
export function buildArcAccessibleSummary(output: ResolverOutput): string {
  const beats = output.beats;
  if (beats.length === 0) return "Emotional arc unavailable.";

  const positions = arcPositionsFor(beats);

  // Pull the *representative* beat for each tag (the first one we see). For
  // single-beat arcs the open/build slots are absent — say so.
  const openBeat = beats[positions.indexOf("open")];
  const buildBeat = beats[positions.indexOf("build")];
  // For peak, pick the last "peak"-tagged beat so a "rise then breath" arc
  // still reports the trailing settle value, not the midpoint spike.
  const peakIdx = positions.lastIndexOf("peak");
  const peakBeat = beats[peakIdx];

  const intensityWord = (value: number): string => {
    if (value >= 70) return "high";
    if (value >= 40) return "medium";
    return "low";
  };

  const segments: string[] = [];
  if (openBeat) {
    segments.push(
      `${ARC_POSITION_LABELS.open} ${intensityWord(openBeat.intensity)} intensity`,
    );
  }
  if (buildBeat) {
    segments.push(
      `${ARC_POSITION_LABELS.build} ${intensityWord(buildBeat.intensity)}`,
    );
  }
  if (peakBeat) {
    segments.push(
      `${ARC_POSITION_LABELS.peak} ${intensityWord(peakBeat.intensity)}`,
    );
  }

  return `Emotional arc: ${segments.join(" → ")} (${output.direction}).`;
}
