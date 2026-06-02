import { describe, expect, it } from "vitest";
import {
  ANCHORING_EVENT_DESCRIPTION,
  ANCHORING_EVENT_INLINE_HELPER,
  ANCHORING_EVENT_LABEL,
  AUDIENCE_DESCRIPTION,
  AUDIENCE_LABEL,
  AXES_INLINE_HELPER,
  BROADCAST_NEUTRAL_DESCRIPTION,
  BROADCAST_NEUTRAL_LABEL,
  CONFIDENCE_DESCRIPTION,
  CONFIDENCE_LABEL,
  CONVERSATION_MODE_DESCRIPTION,
  CONVERSATION_MODE_LABEL,
  EMOTIONAL_ARC_DESCRIPTION,
  EMOTIONAL_ARC_LABEL,
  EMOTIONAL_STATE_DESCRIPTION,
  EMOTIONAL_STATE_INLINE_HELPER,
  EMOTIONAL_STATE_LABEL,
  HOW_IT_WORKS_INTRO,
  HOW_IT_WORKS_STEPS,
  HOW_IT_WORKS_TITLE,
  INTENSITY_DESCRIPTION,
  INTENSITY_LABEL,
  NARRATIVE_DIRECTION_DESCRIPTION,
  NARRATIVE_DIRECTION_LABEL,
  NARRATIVE_GOAL_DESCRIPTION,
  NARRATIVE_GOAL_LABEL,
  PACING_DESCRIPTION,
  PACING_LABEL,
  RESOLVER_DESCRIPTION,
  RESOLVER_INLINE_HELPER,
  RESOLVER_LABEL,
  SCENE_CONTEXT_DESCRIPTION,
  SCENE_CONTEXT_LABEL,
  SIGNATURE_STATE_DESCRIPTION,
  SIGNATURE_STATE_LABEL,
  STEERING_TAG_DESCRIPTION,
  STEERING_TAG_INLINE_HELPER,
  STEERING_TAG_LABEL,
  STUDIO_COPY_MAX_LENGTH,
  STUDIO_GLOSSARY,
  VOICE_CONTEXT_PREVIEW_DESCRIPTION,
  VOICE_CONTEXT_PREVIEW_LABEL,
  VOICE_REGISTER_DESCRIPTION,
  VOICE_REGISTER_LABEL,
  WARMTH_DESCRIPTION,
  WARMTH_LABEL,
  WINNING_FAMILY_DESCRIPTION,
  WINNING_FAMILY_LABEL,
} from "./studioCopy";

/**
 * Copy-pin suite for the Voice Studio glossary. Catches three classes of
 * regression:
 *   1. Accidental blanks — every term must have a non-empty label and
 *      description so info triggers and inline helpers never render empty.
 *   2. Cap drift — descriptions must stay ≤ 220 chars so they fit in tooltip
 *      bodies and inline helpers without wrapping awkwardly.
 *   3. Concept drift — the brief-mandated "How this works" steps must keep
 *      their exact 4-step shape and titles so the studio entry overview
 *      stays consistent with the docs and the glossary cross-references.
 */

const ALL_DESCRIPTIONS: Array<[string, string]> = [
  [RESOLVER_LABEL, RESOLVER_DESCRIPTION],
  [ANCHORING_EVENT_LABEL, ANCHORING_EVENT_DESCRIPTION],
  [SCENE_CONTEXT_LABEL, SCENE_CONTEXT_DESCRIPTION],
  [AUDIENCE_LABEL, AUDIENCE_DESCRIPTION],
  [CONVERSATION_MODE_LABEL, CONVERSATION_MODE_DESCRIPTION],
  [NARRATIVE_GOAL_LABEL, NARRATIVE_GOAL_DESCRIPTION],
  [VOICE_REGISTER_LABEL, VOICE_REGISTER_DESCRIPTION],
  [BROADCAST_NEUTRAL_LABEL, BROADCAST_NEUTRAL_DESCRIPTION],
  [EMOTIONAL_STATE_LABEL, EMOTIONAL_STATE_DESCRIPTION],
  [SIGNATURE_STATE_LABEL, SIGNATURE_STATE_DESCRIPTION],
  [WINNING_FAMILY_LABEL, WINNING_FAMILY_DESCRIPTION],
  [NARRATIVE_DIRECTION_LABEL, NARRATIVE_DIRECTION_DESCRIPTION],
  [STEERING_TAG_LABEL, STEERING_TAG_DESCRIPTION],
  [EMOTIONAL_ARC_LABEL, EMOTIONAL_ARC_DESCRIPTION],
  [INTENSITY_LABEL, INTENSITY_DESCRIPTION],
  [WARMTH_LABEL, WARMTH_DESCRIPTION],
  [PACING_LABEL, PACING_DESCRIPTION],
  [CONFIDENCE_LABEL, CONFIDENCE_DESCRIPTION],
  [VOICE_CONTEXT_PREVIEW_LABEL, VOICE_CONTEXT_PREVIEW_DESCRIPTION],
];

const INLINE_HELPERS: Array<[string, string]> = [
  ["RESOLVER_INLINE_HELPER", RESOLVER_INLINE_HELPER],
  ["STEERING_TAG_INLINE_HELPER", STEERING_TAG_INLINE_HELPER],
  ["EMOTIONAL_STATE_INLINE_HELPER", EMOTIONAL_STATE_INLINE_HELPER],
  ["AXES_INLINE_HELPER", AXES_INLINE_HELPER],
  ["ANCHORING_EVENT_INLINE_HELPER", ANCHORING_EVENT_INLINE_HELPER],
];

describe("studioCopy · contract", () => {
  it("exposes the 220-char cap as a stable export", () => {
    expect(STUDIO_COPY_MAX_LENGTH).toBe(220);
  });

  it.each(ALL_DESCRIPTIONS)(
    "%s has a non-empty label and description",
    (label, description) => {
      expect(label.trim().length).toBeGreaterThan(0);
      expect(description.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(ALL_DESCRIPTIONS)(
    "%s description stays within the 220-char cap",
    (_label, description) => {
      expect(description.length).toBeLessThanOrEqual(STUDIO_COPY_MAX_LENGTH);
    },
  );

  it.each(INLINE_HELPERS)(
    "inline helper %s is non-empty and under the 220-char cap",
    (_name, copy) => {
      expect(copy.trim().length).toBeGreaterThan(0);
      expect(copy.length).toBeLessThanOrEqual(STUDIO_COPY_MAX_LENGTH);
    },
  );

  it("STUDIO_GLOSSARY mirrors every individual export", () => {
    const glossaryPairs = STUDIO_GLOSSARY.map(({ label, description }) => [
      label,
      description,
    ]);
    expect(glossaryPairs).toEqual(ALL_DESCRIPTIONS);
  });
});

describe("studioCopy · concept-drift guards", () => {
  it("Resolver description names the deterministic engine concept", () => {
    expect(RESOLVER_DESCRIPTION).toMatch(/pure-function|deterministic/i);
    expect(RESOLVER_DESCRIPTION).toMatch(/steering tag/i);
  });

  it("Steering tag description references a voice engine and the final beat", () => {
    expect(STEERING_TAG_DESCRIPTION).toMatch(/voice engine/i);
    expect(STEERING_TAG_DESCRIPTION).toMatch(/<.+:.+>/);
  });

  it("Anchoring event description requires producer review", () => {
    expect(ANCHORING_EVENT_DESCRIPTION).toMatch(/producer-approved|Reviewed/i);
  });

  it("Audience description names all four canonical values", () => {
    for (const value of ["Arena", "Intimate", "Broadcast", "Peers"]) {
      expect(AUDIENCE_DESCRIPTION).toMatch(new RegExp(value, "i"));
    }
  });

  it("Conversation mode description names all three canonical modes", () => {
    expect(CONVERSATION_MODE_DESCRIPTION).toMatch(/Narrator/);
    expect(CONVERSATION_MODE_DESCRIPTION).toMatch(/Q&A/);
    expect(CONVERSATION_MODE_DESCRIPTION).toMatch(/Documentary/);
  });

  it("Broadcast neutral description names the camera-ready trait", () => {
    expect(BROADCAST_NEUTRAL_DESCRIPTION).toMatch(/camera-ready|even pacing/i);
  });

  it.each([
    ["Intensity", INTENSITY_DESCRIPTION, /restrain|quiet|urgent|peak/i],
    ["Warmth", WARMTH_DESCRIPTION, /personal|gentle|cool|formal/i],
    ["Pacing", PACING_DESCRIPTION, /speed|patient|brisk/i],
    ["Confidence", CONFIDENCE_DESCRIPTION, /verified|source|record/i],
  ])(
    "%s description grounds in concrete behavior",
    (_axis, description, pattern) => {
      expect(description).toMatch(pattern);
    },
  );
});

describe("studioCopy · How this works overview", () => {
  it("ships exactly four steps, indexed 1..4", () => {
    expect(HOW_IT_WORKS_STEPS).toHaveLength(4);
    expect(HOW_IT_WORKS_STEPS.map((s) => s.index)).toEqual([1, 2, 3, 4]);
  });

  it("step titles match the brief-mandated phrasing", () => {
    expect(HOW_IT_WORKS_STEPS[0].title).toBe("Choose a verified event");
    expect(HOW_IT_WORKS_STEPS[1].title).toBe("Shape the scene");
    expect(HOW_IT_WORKS_STEPS[2].title).toBe("Resolve emotional state");
    expect(HOW_IT_WORKS_STEPS[3].title).toBe("Preview voice context");
  });

  it("every step has a description ≤ 220 chars", () => {
    for (const step of HOW_IT_WORKS_STEPS) {
      expect(step.description.trim().length).toBeGreaterThan(0);
      expect(step.description.length).toBeLessThanOrEqual(
        STUDIO_COPY_MAX_LENGTH,
      );
    }
  });

  it("title and intro are non-empty and capped", () => {
    expect(HOW_IT_WORKS_TITLE.trim().length).toBeGreaterThan(0);
    expect(HOW_IT_WORKS_INTRO.trim().length).toBeGreaterThan(0);
    expect(HOW_IT_WORKS_INTRO.length).toBeLessThanOrEqual(
      STUDIO_COPY_MAX_LENGTH,
    );
  });

  it("step 1 grounds in the verified-event concept (cross-refs Anchoring event term)", () => {
    expect(HOW_IT_WORKS_STEPS[0].description).toMatch(/Reviewed|approved/i);
  });

  it("step 2 grounds in the Scene context concept", () => {
    expect(HOW_IT_WORKS_STEPS[1].description).toMatch(/audience/i);
    expect(HOW_IT_WORKS_STEPS[1].description).toMatch(
      /conversation mode|narrative goal/i,
    );
  });

  it("step 3 grounds in the Resolver output", () => {
    expect(HOW_IT_WORKS_STEPS[2].description).toMatch(
      /signature state|steering tag/i,
    );
  });

  it("step 4 grounds in the Voice context preview", () => {
    expect(HOW_IT_WORKS_STEPS[3].description).toMatch(/sample script|export/i);
  });
});
