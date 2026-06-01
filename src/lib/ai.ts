/**
 * SINGLE AI SEAM (gate 1) — grounded mock today; Netlify Function later.
 * UI must call only `askTwin`. No network, no API keys in this build.
 * @see docs/01-ARCHITECTURE.md · docs/08-AI-SAFETY.md
 */

import type {
  CustomMoment,
  DigitalTwinProfile,
  GuardrailReview,
  TimelineEvent,
} from "../types/twin";
import { sanitizeFreeText } from "./sanitize";

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
