import { describe, expect, it } from "vitest";
import {
  appendSavedVoiceContext,
  badgeVariantForVoiceStatus,
  buildExportSummary,
  buildSampleScript,
  captureVoiceContext,
  exportSummaryFilename,
  VOICE_PROVIDER,
} from "./voiceContext";
import type { StudioSceneSettings } from "./studioResolver";
import type { ResolverOutput } from "@/types/resolver";
import type {
  DigitalTwinProfile,
  SavedVoiceContext,
  TimelineEvent,
} from "@/types/twin";

function fixtureEvent(): TimelineEvent {
  return {
    id: "evt-1998-finals",
    title: "1998 Finals — winning shot",
    description:
      "Game-winning jumper in Game 6 clinches a sixth championship.",
    year: 1998,
    decade: "1990s",
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 98,
    source: {
      type: "wikipedia",
      url: "https://en.wikipedia.org/wiki/Michael_Jordan",
      verified: true,
      importedAtISO: "2026-01-01T00:00:00.000Z",
    },
  };
}

function fixtureScene(
  overrides: Partial<StudioSceneSettings> = {},
): StudioSceneSettings {
  return {
    domain: "sports",
    audience: "Broadcast",
    mode: "Narrator",
    narrativeGoalId: "honor",
    ...overrides,
  };
}

function fixtureResolver(
  overrides: Partial<ResolverOutput> = {},
): ResolverOutput {
  return {
    domain: "sports",
    winningFamily: "Triumph",
    signatureState: "Quiet Triumph",
    direction: "settle",
    beats: [
      { role: "setup", state: "rise", steeringTag: "<rise:slow>", intensity: 60 },
      {
        role: "release",
        state: "settle",
        steeringTag: "<settle:warm>",
        intensity: 84,
      },
    ],
    intensity: 84,
    warmth: 70,
    pacing: 55,
    confidence: 92,
    reason:
      "1998 Finals — winning shot is the kind of moment the resolver leans into; restraint earned through dominance.",
    guardrailWarnings: [],
    ...overrides,
  };
}

function fixtureTwin(): DigitalTwinProfile {
  return {
    schemaVersion: 1,
    twinId: "twin-1",
    consentAcknowledged: true,
    consentAcknowledgedAtISO: "2026-01-01T00:00:00.000Z",
    coreIdentity: { name: "Michael Jordan" },
    wikipedia: {
      pageId: "demo-michael-jordan",
      title: "Michael Jordan",
      summary: "American former professional basketball player.",
      description: "American basketball player (born 1963)",
      sourceUrl: "https://en.wikipedia.org/wiki/Michael_Jordan",
    },
    timeline: [fixtureEvent()],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: "2026-01-01T00:00:00.000Z",
  };
}

describe("VOICE_PROVIDER honesty (gate 4 — no overpromise)", () => {
  it("ships as not-connected so the UI cannot claim live synthesis", () => {
    expect(VOICE_PROVIDER.status).toBe("not-connected");
    expect(VOICE_PROVIDER.label).toBe("Not connected");
    expect(VOICE_PROVIDER.description).toMatch(/Phase 2|not wired/i);
  });

  it("badge variant maps each status to a distinct token", () => {
    expect(badgeVariantForVoiceStatus("api-connected")).toBe("ok");
    expect(badgeVariantForVoiceStatus("demo-audio")).toBe("gold");
    expect(badgeVariantForVoiceStatus("not-connected")).toBe("muted");
  });
});

describe("buildSampleScript", () => {
  const subjectName = "Michael Jordan";

  it("starts with the spec lead-in shape and references the event title", () => {
    const script = buildSampleScript({
      subjectName,
      event: fixtureEvent(),
      scene: fixtureScene(),
      resolver: fixtureResolver(),
    });

    expect(script).toMatch(/^Based on the approved moment "1998 Finals/);
    expect(script).toContain(subjectName);
    expect(script).toContain("broadcast-neutral"); // Audience → tone phrase
    expect(script).toContain("Quiet Triumph");
  });

  it("changes the tone phrase when the audience changes", () => {
    const intimate = buildSampleScript({
      subjectName,
      event: fixtureEvent(),
      scene: fixtureScene({ audience: "Intimate" }),
      resolver: fixtureResolver(),
    });
    const arena = buildSampleScript({
      subjectName,
      event: fixtureEvent(),
      scene: fixtureScene({ audience: "Arena" }),
      resolver: fixtureResolver(),
    });

    expect(intimate).toContain("close-mic");
    expect(arena).toContain("broadcast-scale");
    expect(intimate).not.toEqual(arena);
  });

  it("changes the opener for each narrative goal", () => {
    const goals = [
      "celebrate",
      "honor",
      "challenge",
      "mourn",
      "explain",
    ] as const;
    const scripts = goals.map((goal) =>
      buildSampleScript({
        subjectName,
        event: fixtureEvent(),
        scene: fixtureScene({ narrativeGoalId: goal }),
        resolver: fixtureResolver(),
      }),
    );
    const uniqueOpeners = new Set(scripts.map((s) => s.split("\n\n")[1]));
    expect(uniqueOpeners.size).toBe(goals.length);
  });

  it("is deterministic for identical inputs", () => {
    const a = buildSampleScript({
      subjectName,
      event: fixtureEvent(),
      scene: fixtureScene(),
      resolver: fixtureResolver(),
    });
    const b = buildSampleScript({
      subjectName,
      event: fixtureEvent(),
      scene: fixtureScene(),
      resolver: fixtureResolver(),
    });
    expect(a).toBe(b);
  });

  it("includes the final beat's steering tag and the four param values", () => {
    const script = buildSampleScript({
      subjectName,
      event: fixtureEvent(),
      scene: fixtureScene(),
      resolver: fixtureResolver(),
    });
    expect(script).toContain("<settle:warm>");
    expect(script).toContain("Intensity 84");
    expect(script).toContain("warmth 70");
    expect(script).toContain("pacing 55");
    expect(script).toContain("source-confidence 92");
  });
});

describe("captureVoiceContext + appendSavedVoiceContext", () => {
  it("captures every field needed by the export summary and persists immutably", () => {
    const event = fixtureEvent();
    const scene = fixtureScene();
    const resolver = fixtureResolver();
    const sampleScript = buildSampleScript({
      subjectName: "Michael Jordan",
      event,
      scene,
      resolver,
    });

    const snapshot = captureVoiceContext({
      event,
      scene,
      resolver,
      sampleScript,
      nowISO: "2026-06-01T17:42:00.000Z",
      id: "svc-test-1",
    });

    expect(snapshot).toMatchObject({
      id: "svc-test-1",
      savedAtISO: "2026-06-01T17:42:00.000Z",
      eventId: "evt-1998-finals",
      eventTitle: "1998 Finals — winning shot",
      audience: "Broadcast",
      mode: "Narrator",
      narrativeGoalId: "honor",
      narrativeGoalLabel: "Honor legacy",
      signatureState: "Quiet Triumph",
      winningFamily: "Triumph",
      direction: "settle",
      intensity: 84,
      warmth: 70,
      pacing: 55,
      confidence: 92,
      steeringTag: "<settle:warm>",
      sampleScript,
    });

    const twin = fixtureTwin();
    const updated = appendSavedVoiceContext(twin, snapshot);
    expect(updated).not.toBe(twin);
    expect(updated.savedVoiceContexts).toEqual([snapshot]);
    expect(twin.savedVoiceContexts).toBeUndefined();

    const updated2 = appendSavedVoiceContext(updated, {
      ...snapshot,
      id: "svc-test-2",
    });
    expect(updated2.savedVoiceContexts).toHaveLength(2);
    expect(updated2.savedVoiceContexts?.[1].id).toBe("svc-test-2");
  });
});

describe("buildExportSummary + exportSummaryFilename", () => {
  function makeContext(): SavedVoiceContext {
    return captureVoiceContext({
      event: fixtureEvent(),
      scene: fixtureScene(),
      resolver: fixtureResolver(),
      sampleScript: "Sample script body.",
      nowISO: "2026-06-01T17:42:00.000Z",
      id: "svc-test-1",
    });
  }

  it("renders a plain-text summary with required sections and the disclaimer", () => {
    const body = buildExportSummary({
      subjectName: "Michael Jordan",
      context: makeContext(),
      voiceStatus: "not-connected",
    });

    expect(body).toContain("RICON Studio — Voice Context Summary");
    expect(body).toContain("Subject: Michael Jordan");
    expect(body).toContain("Voice provider: not-connected");
    expect(body).toContain("Anchoring event: 1998 Finals — winning shot");
    expect(body).toContain("Audience: Broadcast");
    expect(body).toContain("Resolved feeling: Quiet Triumph");
    expect(body).toContain("Sample script (illustrative — not synthesized audio):");
    expect(body).toMatch(/not legal clearance/i);
  });

  it("builds a safe filename slug from the subject name and timestamp", () => {
    const ctx = makeContext();
    expect(
      exportSummaryFilename({ subjectName: "Michael Jordan", context: ctx }),
    ).toBe("ricon-voice-context__michael-jordan__2026-06-01T17-42-00.txt");
  });

  it("falls back to a generic slug when the subject name has no safe chars", () => {
    const ctx = makeContext();
    const filename = exportSummaryFilename({
      subjectName: "$$$$",
      context: ctx,
    });
    expect(filename.startsWith("ricon-voice-context__voice-context__")).toBe(
      true,
    );
  });
});
