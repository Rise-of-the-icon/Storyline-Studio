import type {
  Confidence,
  DigitalTwinProfile,
  EventType,
  TimelineEvent,
  WikipediaProfile,
} from "../types/twin";
import { makeWikipediaSource } from "./contentModel";
import { evaluateGuardrails } from "./guardrails";
import { getDemoSubjectById } from "../data/demoSubjects";

export interface ImportBundle {
  timeline: TimelineEvent[];
  customMoments: DigitalTwinProfile["customMoments"];
  guardrailReviews: DigitalTwinProfile["guardrailReviews"];
}

const IMPORT_DELAY_MS = 1100;

function makeEvent(
  wikipedia: WikipediaProfile,
  partial: {
    title: string;
    description: string;
    year: number;
    eventType: EventType;
    confidence: Confidence;
    emotionalSignificance: number;
  },
): TimelineEvent {
  const decade = `${Math.floor(partial.year / 10) * 10}s`;
  return {
    id: crypto.randomUUID(),
    ...partial,
    decade,
    approvalStatus: "Draft",
    sensitivity: "Low",
    visibility: "Internal",
    category: partial.eventType,
    summary: partial.description,
    source: makeWikipediaSource(wikipedia.sourceUrl, wikipedia.revisionId),
  };
}

function extractBirthYear(wikipedia: WikipediaProfile): number | null {
  const text = `${wikipedia.description} ${wikipedia.summary}`;
  const born = text.match(/\(born\s+(\d{4})\)/i) ?? text.match(/\bborn\s+(\d{4})\b/i);
  if (born) return Number(born[1]);
  const b = text.match(/\(\s*b\.\s*(\d{4})\s*\)/i);
  if (b) return Number(b[1]);
  return null;
}

function inferEventType(sentence: string): EventType {
  const s = sentence.toLowerCase();
  if (/award|champion|won|medal|finals|title/.test(s)) return "Achievement";
  if (/married|divorc|relationship|spouse|family/.test(s)) return "Relationship";
  if (/university|college|school|graduat/.test(s)) return "Education";
  if (/founded|business|brand|company/.test(s)) return "Business";
  if (/died|death|retired|retirement/.test(s)) return "Career";
  if (/born|childhood|early life/.test(s)) return "Personal";
  return "Career";
}

/**
 * Heuristic timeline from Wikipedia summary text (no AI).
 *
 * Conservative: only emits events for sentences that yield a real birth year
 * or a 4-digit year embedded in the text. When extraction yields nothing,
 * returns an empty array — S3's timeline-empty surface ("No reliable timeline
 * events were found. Add custom moments to continue.") is the right place to
 * handle that, not a noisy "Wikipedia profile imported" filler row that
 * tricks the producer into thinking the import succeeded.
 *
 * For demo subjects we never reach this code path — `generateImportBundle`
 * dispatches to the curated demo fixtures in `src/data/demoSubjects.ts`
 * before falling through to the heuristic.
 */
function generateHeuristicTimeline(wikipedia: WikipediaProfile): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const birthYear = extractBirthYear(wikipedia);

  if (birthYear) {
    events.push(
      makeEvent(wikipedia, {
        title: `Born (${birthYear})`,
        description: `Birth year referenced in the Wikipedia summary for ${wikipedia.title}.`,
        year: birthYear,
        eventType: "Personal",
        confidence: "High",
        emotionalSignificance: 35,
      }),
    );
  }

  const sentences = wikipedia.summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24);

  let yearCursor = birthYear ? birthYear + 20 : 2000;

  for (const sentence of sentences.slice(0, 8)) {
    const yearMatch = sentence.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? Number(yearMatch[0]) : yearCursor;
    yearCursor = year + 2;

    const confidence: Confidence =
      sentence.length > 120 ? "Medium" : yearMatch ? "High" : "Medium";

    events.push(
      makeEvent(wikipedia, {
        title: sentence.slice(0, 72) + (sentence.length > 72 ? "…" : ""),
        description: sentence,
        year,
        eventType: inferEventType(sentence),
        confidence,
        emotionalSignificance: confidence === "High" ? 60 : 45,
      }),
    );
  }

  return events.sort((a, b) => a.year - b.year);
}

/**
 * Generate timeline (+ optional demo custom moments) for S2 import.
 * Uses seeded demo subjects (`src/data/demoSubjects.ts`) for demo profiles;
 * heuristic parsing for live Wikipedia.
 */
export async function generateImportBundle(
  draft: DigitalTwinProfile,
): Promise<ImportBundle> {
  await new Promise((resolve) => setTimeout(resolve, IMPORT_DELAY_MS));

  const { wikipedia } = draft;

  const demoSubject = getDemoSubjectById(wikipedia.pageId);
  if (demoSubject) {
    const twin = demoSubject.buildTwin();
    return {
      timeline: twin.timeline,
      customMoments: twin.customMoments,
      guardrailReviews: twin.guardrailReviews,
    };
  }

  if (draft.timeline.length >= 5 && wikipedia.pageId.startsWith("demo-")) {
    return {
      timeline: draft.timeline,
      customMoments: draft.customMoments,
      guardrailReviews: evaluateGuardrails(
        draft.timeline,
        draft.customMoments,
      ),
    };
  }

  const timeline = generateHeuristicTimeline(wikipedia);
  const customMoments = draft.customMoments;
  return {
    timeline,
    customMoments,
    guardrailReviews: evaluateGuardrails(timeline, customMoments),
  };
}
