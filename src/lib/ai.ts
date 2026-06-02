/**
 * SINGLE AI SEAM (gate 1) — grounded mock today; Netlify Function later.
 * UI must call only `askTwin` / `askTwinScoped`. No network, no API keys in
 * this build.
 * @see docs/01-ARCHITECTURE.md · docs/08-AI-SAFETY.md
 */

import type { ResolverOutput } from "../types/resolver";
import type {
  CustomMoment,
  DigitalTwinProfile,
  GuardrailReview,
  TimelineEvent,
} from "../types/twin";
import type {
  ChatPromptCategory,
  ChatPromptChip,
} from "../studio/studioCopy";
import {
  CHAT_DEMO_DISCLAIMER,
  CHAT_INSUFFICIENT_SOURCE,
  CHAT_PROMPT_CHIPS,
} from "../studio/studioCopy";
import { eligibleVoiceStudioEvents } from "./contentModel";
import { sanitizeFreeText } from "./sanitize";
import type { StudioSceneSettings } from "../studio/studioResolver";
import { getNarrativeGoalText } from "../studio/studioResolver";

export const GROUNDED_REFUSAL =
  "I don't have a verified record of that." as const;

export interface TwinChatContext {
  twin: DigitalTwinProfile;
}

export type TwinReplyKind = "answer" | "refusal";

export interface TwinReply {
  kind: TwinReplyKind;
  text: string;
  /** Gate 4 — every twin response is AI-labelled in UI */
  aiGenerated: true;
  grounded: boolean;
}

interface VerifiedFact {
  id: string;
  source: "timeline" | "customMoment";
  title: string;
  body: string;
  year?: number;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "is",
  "was",
  "were",
  "are",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "about",
  "what",
  "when",
  "where",
  "who",
  "why",
  "how",
  "tell",
  "me",
  "your",
  "you",
  "my",
  "i",
  "we",
  "they",
  "it",
  "that",
  "this",
  "with",
  "from",
  "as",
  "by",
  "did",
  "does",
  "do",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function isCustomMomentApproved(
  moment: CustomMoment,
  reviews: GuardrailReview[],
): boolean {
  const related = reviews.filter((r) => r.eventId === moment.id);
  if (related.length === 0) return true;
  if (related.some((r) => r.status === "NeedsReview")) return false;
  if (related.some((r) => r.status === "Rejected")) return false;
  return related.every((r) => r.status === "Reviewed");
}

function timelineToFact(event: TimelineEvent): VerifiedFact {
  return {
    id: event.id,
    source: "timeline",
    title: event.title,
    body: event.description,
    year: event.year,
  };
}

function customMomentToFact(moment: CustomMoment): VerifiedFact {
  return {
    id: moment.id,
    source: "customMoment",
    title: moment.title,
    body: [moment.description, moment.emotionalSignificance]
      .filter(Boolean)
      .join(" "),
  };
}

/** Facts the mock (and future server prompt) may cite — gate 2. */
export function collectVerifiedFacts(twin: DigitalTwinProfile): VerifiedFact[] {
  const timelineFacts = twin.timeline
    .filter((e) => e.approvalStatus === "Reviewed")
    .map(timelineToFact);

  const momentFacts = twin.customMoments
    .filter((m) => isCustomMomentApproved(m, twin.guardrailReviews))
    .map(customMomentToFact);

  return [...timelineFacts, ...momentFacts];
}

function scoreFactMatch(queryTokens: string[], fact: VerifiedFact): number {
  const haystack = tokenize(`${fact.title} ${fact.body}`);
  if (haystack.length === 0 || queryTokens.length === 0) return 0;

  let score = 0;
  for (const token of queryTokens) {
    if (haystack.some((h) => h.includes(token) || token.includes(h))) {
      score += 1;
    }
  }

  const titleTokens = tokenize(fact.title);
  for (const token of queryTokens) {
    if (titleTokens.includes(token)) score += 2;
  }

  return score;
}

function findBestMatchingFact(
  query: string,
  facts: VerifiedFact[],
): VerifiedFact | null {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return null;

  let best: VerifiedFact | null = null;
  let bestScore = 0;

  for (const fact of facts) {
    const score = scoreFactMatch(queryTokens, fact);
    if (score > bestScore) {
      bestScore = score;
      best = fact;
    }
  }

  const minScore = Math.min(2, queryTokens.length);
  return bestScore >= minScore ? best : null;
}

function buildGroundedAnswer(
  name: string,
  fact: VerifiedFact,
): string {
  const yearPhrase =
    fact.year !== undefined ? ` In ${fact.year},` : "";
  const excerpt =
    fact.body.length > 280 ? `${fact.body.slice(0, 277)}…` : fact.body;
  return `I'm ${name}.${yearPhrase} ${fact.title} — ${excerpt} That's what I have on my verified timeline.`;
}

function refusalReply(): TwinReply {
  return {
    kind: "refusal",
    text: GROUNDED_REFUSAL,
    aiGenerated: true,
    grounded: false,
  };
}

function answerReply(text: string): TwinReply {
  return {
    kind: "answer",
    text,
    aiGenerated: true,
    grounded: true,
  };
}

/**
 * Grounded mock twin chat. Sanitizes input (gate 3), answers only from verified
 * facts, refuses otherwise. Replace the body with fetch to twin-chat when connected.
 *
 * Retained for the legacy un-scoped chat surface + the `ai.test.ts` regression
 * suite. New surfaces should prefer `askTwinScoped` which carries source
 * attribution and a deterministic demo-response disclaimer.
 */
export async function askTwin(
  context: TwinChatContext,
  userMessage: string,
): Promise<TwinReply> {
  const sanitized = sanitizeFreeText(userMessage, "generic");
  if (!sanitized) {
    return refusalReply();
  }

  const facts = collectVerifiedFacts(context.twin);
  if (facts.length === 0) {
    return refusalReply();
  }

  const match = findBestMatchingFact(sanitized, facts);
  if (!match) {
    return refusalReply();
  }

  const name = context.twin.coreIdentity.name;
  return answerReply(buildGroundedAnswer(name, match));
}

// ===========================================================================
// Scoped Voice-Studio chat (extends the seam — still no network, still no key)
// ===========================================================================
//
// The left-rail chat in `TwinChat` is intentionally narrower than `askTwin`:
//  - It only voices against a single producer-selected anchoring event, not
//    the full collection of verified facts. The producer chose the event in
//    SS1; the chat must honour that scope.
//  - It returns a *clearly labelled demo response* — never pretends to be a
//    live assistant. The badge + disclaimer + "Source: <title>" tail are
//    rendered by the component from data this seam returns.
//  - Composition is deterministic. Same prompt + event + scene + resolver
//    state → same response. No randomness, no timing-derived state.
//
// The async wrapper `askTwinScoped` is what the component awaits; the pure
// `composeDemoChatResponse` is what the tests exercise.

/**
 * Producer-facing gate status for the chat input. Pure function of the draft
 * + the studio's `selectedEventId`. The component renders one of four UI
 * variants from this:
 *  - `ready`            — enabled input + chips, can send.
 *  - `noApprovedEvents` — disabled, CTA to S3 (timeline review).
 *  - `noEventSelected`  — disabled, CTA to SS1.
 *  - `eventNotApproved` — disabled (defensive — `selectedEventId` points at
 *                        an event whose status was demoted after selection).
 */
export type ChatGateStatus =
  | { status: "ready"; event: TimelineEvent }
  | { status: "noApprovedEvents" }
  | { status: "noEventSelected"; approvedCount: number }
  | { status: "eventNotApproved"; approvedCount: number };

export function getChatGate(
  draft: DigitalTwinProfile | null,
  selectedEventId: string | null,
): ChatGateStatus {
  if (!draft) return { status: "noApprovedEvents" };
  const approved = eligibleVoiceStudioEvents(draft.timeline);
  if (approved.length === 0) return { status: "noApprovedEvents" };
  if (!selectedEventId) {
    return { status: "noEventSelected", approvedCount: approved.length };
  }
  const event = approved.find((e) => e.id === selectedEventId);
  if (!event) {
    return { status: "eventNotApproved", approvedCount: approved.length };
  }
  return { status: "ready", event };
}

/**
 * Empty-input predicate used both by the form's `onSubmit` guard and the
 * disable-the-send-button check. Trims first so whitespace never reaches
 * the seam.
 */
export function isEmptyChatPrompt(input: string): boolean {
  return input.trim().length === 0;
}

/**
 * Classify the user prompt into one of the four composition modes. Falls
 * back to `"general"` (token-overlap match) when the prompt isn't one of
 * the three example chips.
 */
export function classifyChatPrompt(prompt: string): ChatPromptCategory {
  const normalized = prompt.trim().toLowerCase();
  for (const chip of CHAT_PROMPT_CHIPS as readonly ChatPromptChip[]) {
    if (chip.label.trim().toLowerCase() === normalized) {
      return chip.category;
    }
  }
  return "general";
}

export interface ScopedChatInput {
  /** Sanitized prompt — caller is responsible for `sanitizeFreeText`. */
  prompt: string;
  /** The producer-selected anchoring event. Required (component gates this). */
  event: TimelineEvent;
  /** Twin display name — used as the conversational frame ("As Lina, …"). */
  twinName: string;
  /** Optional scene context — only the voiceDirection path consumes it. */
  scene?: StudioSceneSettings;
  /** Optional resolver snapshot — only the voiceDirection path consumes it. */
  resolverOutput?: ResolverOutput | null;
}

export interface ScopedChatReply {
  kind: "answer" | "insufficient";
  /** The promoted prompt category (drives composition path + UI accents). */
  promptCategory: ChatPromptCategory;
  /**
   * Source-attribution payload — UI renders these as a "Source: <title>"
   * link beneath the bubble. `null` only when the gate would have blocked
   * (never returned by `composeDemoChatResponse` in this build).
   */
  sourceEventId: string;
  sourceEventTitle: string;
  /** Approved-event year if known — surfaced inline next to the title. */
  sourceEventYear?: number;
  /** Demo disclaimer prefix (always the brief-mandated string). */
  disclaimer: typeof CHAT_DEMO_DISCLAIMER;
  /** Main body the bubble renders. */
  body: string;
  /** Gate flag: every demo response is AI-labelled (matches gate 4). */
  aiGenerated: true;
  /** True iff `body === CHAT_INSUFFICIENT_SOURCE`. */
  insufficient: boolean;
}

function compactDescription(description: string, max = 220): string {
  const trimmed = description.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function describeEventTiming(event: TimelineEvent): string {
  if (event.date && event.date.trim().length > 0) return event.date.trim();
  if (typeof event.year === "number") return String(event.year);
  return event.decade;
}

function tokensInDescription(event: TimelineEvent): number {
  return tokenize(`${event.title} ${event.description}`).length;
}

function buildShapingBody(twinName: string, event: TimelineEvent): string {
  const timing = describeEventTiming(event);
  const detail = compactDescription(event.description);
  if (detail.length === 0) {
    return CHAT_INSUFFICIENT_SOURCE;
  }
  return `Per ${twinName}'s approved record from ${timing}, "${event.title}" was shaped by what's documented in the source: ${detail}`;
}

function buildMeaningBody(twinName: string, event: TimelineEvent): string {
  const timing = describeEventTiming(event);
  const significance = event.emotionalSignificance;
  const significanceLabel =
    significance >= 80
      ? "a peak emotional beat"
      : significance >= 60
        ? "a high-significance turn"
        : significance >= 40
          ? "a meaningful pivot"
          : "a quieter waypoint";
  const detail = compactDescription(event.description);
  if (detail.length === 0) {
    return CHAT_INSUFFICIENT_SOURCE;
  }
  return `${twinName}'s approved timeline marks "${event.title}" (${timing}) as ${significanceLabel} (significance ${significance}/100). The source frames it this way: ${detail}`;
}

function buildVoiceDirectionBody(
  twinName: string,
  event: TimelineEvent,
  scene?: StudioSceneSettings,
  resolverOutput?: ResolverOutput | null,
): string {
  const timing = describeEventTiming(event);
  if (!resolverOutput && !scene) {
    return `Voice direction for "${event.title}" (${timing}) needs a scene. Open SS2 to set audience and narrative goal, then SS3 will resolve a steering tag the voice engine can use for ${twinName}.`;
  }
  if (!resolverOutput && scene) {
    const goal = getNarrativeGoalText(scene.narrativeGoalId);
    return `Scene is set (${scene.audience} · ${scene.mode}, goal: ${goal}). The resolver hasn't run yet — continue to SS3 to read the signature state and steering tag for "${event.title}" (${timing}).`;
  }
  if (resolverOutput) {
    const audience = scene?.audience ?? "the current audience";
    const mode = scene?.mode ?? "the current mode";
    return `For "${event.title}" (${timing}), the resolver lands on ${resolverOutput.signatureState} in the ${resolverOutput.winningFamily} family, ${resolverOutput.direction}. Voicing for ${audience} in ${mode}: hold the steering tag and let ${twinName} settle into ${resolverOutput.signatureState.toLowerCase()}.`;
  }
  return CHAT_INSUFFICIENT_SOURCE;
}

function buildGeneralBody(
  twinName: string,
  event: TimelineEvent,
  prompt: string,
): string {
  const promptTokens = tokenize(prompt);
  const overlap = scoreFactMatch(promptTokens, timelineToFact(event));
  const minScore = Math.min(2, Math.max(1, promptTokens.length));
  // Special-case extremely short prompts: a single content word like
  // "championship" trivially matches; require at least the floor for any
  // grounded response so a vague "tell me" doesn't fabricate.
  if (promptTokens.length === 0 || overlap < minScore) {
    return CHAT_INSUFFICIENT_SOURCE;
  }
  const detail = compactDescription(event.description);
  const timing = describeEventTiming(event);
  if (detail.length === 0 || tokensInDescription(event) === 0) {
    return CHAT_INSUFFICIENT_SOURCE;
  }
  return `Staying inside ${twinName}'s approved record for "${event.title}" (${timing}): ${detail}`;
}

/**
 * Deterministic, source-backed demo composer. Pure — given the same input,
 * always returns the same `ScopedChatReply`. The component is responsible
 * for rendering the `Demo response` badge, the disclaimer line, and the
 * "Source: <title>" attribution; this function only carries the payload.
 *
 * Never invents quotes. Never names a person not present in the event's
 * own metadata. Falls back to `CHAT_INSUFFICIENT_SOURCE` when the event
 * doesn't carry enough material to answer the prompt category honestly.
 */
export function composeDemoChatResponse(
  input: ScopedChatInput,
): ScopedChatReply {
  const category = classifyChatPrompt(input.prompt);
  const { event, twinName, scene, resolverOutput } = input;

  let body: string;
  switch (category) {
    case "shaping":
      body = buildShapingBody(twinName, event);
      break;
    case "meaning":
      body = buildMeaningBody(twinName, event);
      break;
    case "voiceDirection":
      body = buildVoiceDirectionBody(twinName, event, scene, resolverOutput);
      break;
    case "general":
    default:
      body = buildGeneralBody(twinName, event, input.prompt);
      break;
  }

  const insufficient = body === CHAT_INSUFFICIENT_SOURCE;

  return {
    kind: insufficient ? "insufficient" : "answer",
    promptCategory: category,
    sourceEventId: event.id,
    sourceEventTitle: event.title,
    sourceEventYear: event.year,
    disclaimer: CHAT_DEMO_DISCLAIMER,
    body,
    aiGenerated: true,
    insufficient,
  };
}

export interface ScopedChatRequest {
  twin: DigitalTwinProfile;
  selectedEventId: string | null;
  scene?: StudioSceneSettings;
  resolverOutput?: ResolverOutput | null;
}

/**
 * Async seam the component awaits. Sanitizes the prompt (gate 3), enforces
 * the gate (no empty, no missing event), then delegates to the pure
 * composer. Returns `null` when the gate fails — the component renders
 * `ErrorState` for `null` so a future "real" seam can throw or return null
 * with the same UI fallthrough.
 */
export async function askTwinScoped(
  request: ScopedChatRequest,
  userMessage: string,
): Promise<ScopedChatReply | null> {
  const sanitized = sanitizeFreeText(userMessage, "generic");
  if (!sanitized) return null;

  const gate = getChatGate(request.twin, request.selectedEventId);
  if (gate.status !== "ready") return null;

  return composeDemoChatResponse({
    prompt: sanitized,
    event: gate.event,
    twinName: request.twin.coreIdentity.name,
    scene: request.scene,
    resolverOutput: request.resolverOutput ?? null,
  });
}
