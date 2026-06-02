/**
 * Pure helpers for the Voice Context Preview output panel.
 *
 * Everything here is side-effect free and unit-testable. The component
 * (`VoiceContextPreview.tsx`) does the rendering and the audio element;
 * decisions about copy, status, persisted shape, and export format live here
 * so they can be regression-tested without React.
 */

import type {
  DigitalTwinProfile,
  SavedVoiceContext,
  TimelineEvent,
} from "@/types/twin";
import type { ResolverOutput } from "@/types/resolver";
import {
  NARRATIVE_GOAL_OPTIONS,
  type NarrativeGoalId,
  type StudioSceneSettings,
} from "./studioResolver";

// ---------------------------------------------------------------------------
// Voice provider status — drives the badge in the panel header.
// ---------------------------------------------------------------------------

export type VoiceProviderStatus = "demo-audio" | "api-connected" | "not-connected";

export interface VoiceProviderInfo {
  status: VoiceProviderStatus;
  label: string;
  description: string;
}

/**
 * The single source of truth for "what voice backend is wired up?".
 *
 * This build ships with no audio asset and no synthesis API — we report
 * `not-connected` honestly so the UI never overpromises. If a demo asset
 * is later dropped in `public/`, or a real provider is wired through
 * `src/lib/ai.ts`, flip this constant; the badge + audio block update.
 */
export const VOICE_PROVIDER: VoiceProviderInfo = {
  status: "not-connected",
  label: "Not connected",
  description:
    "Voice synthesis is not wired up in this build. The resolver locks the emotional context; audio generation is Phase 2 (see roadmap).",
};

/** Replace with a real path under `/public` when a demo clip is dropped in. */
export const DEMO_AUDIO_SRC: string | null = null;

export function badgeVariantForVoiceStatus(
  status: VoiceProviderStatus,
): "ok" | "gold" | "muted" {
  if (status === "api-connected") return "ok";
  if (status === "demo-audio") return "gold";
  return "muted";
}

// ---------------------------------------------------------------------------
// Sample-script generator — deterministic, grounded in the resolved context.
// ---------------------------------------------------------------------------

/** Audience word stems used to colour the script's tone phrase. */
const AUDIENCE_TONE: Record<string, string> = {
  Arena: "broadcast-scale",
  Intimate: "close-mic, low-room",
  Broadcast: "broadcast-neutral",
  Peers: "peer-to-peer",
};

const MODE_VOICE: Record<StudioSceneSettings["mode"], string> = {
  Narrator: "narration",
  "Q&A": "first-person response",
  Documentary: "reflective documentary delivery",
};

const GOAL_OPENERS: Record<NarrativeGoalId, string> = {
  celebrate: "Lifting the moment without ornament.",
  honor: "Holding the weight of what this meant.",
  challenge: "Sharpening into the doubt and answering it.",
  mourn: "Sitting with what was lost.",
  explain: "Walking the listener through it, calmly.",
};

function narrativeGoalLabel(id: NarrativeGoalId): string {
  return (
    NARRATIVE_GOAL_OPTIONS.find((g) => g.id === id)?.label ??
    NARRATIVE_GOAL_OPTIONS[0].label
  );
}

function clampLine(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/**
 * Build a short, grounded sample script the producer can read aloud to feel
 * the resolved context. Deterministic — same inputs always produce the same
 * output, so reviewers can compare runs without dealing with AI variance.
 *
 * NOT a substitute for real synthesis; explicitly labelled "Sample script"
 * in the UI.
 */
export function buildSampleScript(args: {
  subjectName: string;
  event: TimelineEvent;
  scene: StudioSceneSettings;
  resolver: ResolverOutput;
}): string {
  const { subjectName, event, scene, resolver } = args;
  const audienceTone = AUDIENCE_TONE[scene.audience] ?? "broadcast-neutral";
  const modeVoice = MODE_VOICE[scene.mode];
  const opener = GOAL_OPENERS[scene.narrativeGoalId];
  const steeringTag = resolver.beats[resolver.beats.length - 1]?.steeringTag ?? "—";

  const lead = clampLine(
    `Based on the approved moment "${event.title}" (${event.year}), the voice twin of ${subjectName} would respond in a ${audienceTone} tone for ${modeVoice}.`,
  );

  const body = clampLine(
    `Resolved feeling: ${resolver.signatureState} (${resolver.winningFamily}, ${resolver.direction}). ${opener}`,
  );

  const close = clampLine(
    `Steering: ${steeringTag}. Intensity ${resolver.intensity}, warmth ${resolver.warmth}, pacing ${resolver.pacing}, source-confidence ${resolver.confidence}.`,
  );

  return `${lead}\n\n${body}\n\n${close}`;
}

// ---------------------------------------------------------------------------
// SavedVoiceContext — capture / persist / export
// ---------------------------------------------------------------------------

/** Build a snapshot suitable for persisting in the draft and for export. */
export function captureVoiceContext(args: {
  event: TimelineEvent;
  scene: StudioSceneSettings;
  resolver: ResolverOutput;
  sampleScript: string;
  nowISO?: string;
  id?: string;
}): SavedVoiceContext {
  const { event, scene, resolver, sampleScript } = args;
  const nowISO = args.nowISO ?? new Date().toISOString();
  const id =
    args.id ??
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `svc-${Date.now()}`);
  const steeringTag = resolver.beats[resolver.beats.length - 1]?.steeringTag ?? "—";

  return {
    id,
    savedAtISO: nowISO,
    eventId: event.id,
    eventTitle: event.title,
    audience: scene.audience,
    mode: scene.mode,
    narrativeGoalId: scene.narrativeGoalId,
    narrativeGoalLabel: narrativeGoalLabel(scene.narrativeGoalId),
    signatureState: resolver.signatureState,
    winningFamily: resolver.winningFamily,
    direction: resolver.direction,
    intensity: resolver.intensity,
    warmth: resolver.warmth,
    pacing: resolver.pacing,
    confidence: resolver.confidence,
    reason: resolver.reason,
    steeringTag,
    sampleScript,
  };
}

/** Returns a new twin with the saved context appended. Pure. */
export function appendSavedVoiceContext(
  twin: DigitalTwinProfile,
  context: SavedVoiceContext,
): DigitalTwinProfile {
  const existing = twin.savedVoiceContexts ?? [];
  return { ...twin, savedVoiceContexts: [...existing, context] };
}

/**
 * Build a human-readable plain-text summary of a saved context. This is what
 * the "Export summary" CTA downloads. Plain text (not JSON) so producers
 * can paste it directly into a brief.
 */
export function buildExportSummary(args: {
  subjectName: string;
  context: SavedVoiceContext;
  voiceStatus: VoiceProviderStatus;
}): string {
  const { subjectName, context, voiceStatus } = args;
  const stamp = context.savedAtISO;
  return [
    `RICON Studio — Voice Context Summary`,
    ``,
    `Subject: ${subjectName}`,
    `Saved: ${stamp}`,
    `Voice provider: ${voiceStatus}`,
    ``,
    `Anchoring event: ${context.eventTitle} (${context.eventId})`,
    `Audience: ${context.audience}`,
    `Conversation mode: ${context.mode}`,
    `Narrative goal: ${context.narrativeGoalLabel} (${context.narrativeGoalId})`,
    ``,
    `Resolved feeling: ${context.signatureState}`,
    `Family: ${context.winningFamily}`,
    `Direction: ${context.direction}`,
    `Steering tag: ${context.steeringTag}`,
    ``,
    `Intensity: ${context.intensity}/100`,
    `Warmth: ${context.warmth}/100`,
    `Pacing: ${context.pacing}/100`,
    `Source confidence: ${context.confidence}/100`,
    ``,
    `Reason:`,
    context.reason,
    ``,
    `Sample script (illustrative — not synthesized audio):`,
    context.sampleScript,
    ``,
    `Disclaimer: Producer-facing voice context only. Not legal clearance.`,
    `Production use of a person's voice, likeness, story, or persona requires`,
    `appropriate rights, consent, and review.`,
    ``,
  ].join("\n");
}

/** Builds a safe filename slug for the download. */
export function exportSummaryFilename(args: {
  subjectName: string;
  context: SavedVoiceContext;
}): string {
  const slug = args.subjectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "voice-context";
  const stamp = args.context.savedAtISO.replace(/[:.]/g, "-").slice(0, 19);
  return `ricon-voice-context__${slug}__${stamp}.txt`;
}
