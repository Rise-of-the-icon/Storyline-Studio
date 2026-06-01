import type {
  Confidence,
  DigitalTwinProfile,
  EventType,
  TimelineEvent,
  WikipediaProfile,
} from "../types/twin";
import { evaluateGuardrails } from "./guardrails";
import { buildMichaelJordanTwin, buildThinProfileTwin } from "./mockData";

export interface ImportBundle {
  timeline: TimelineEvent[];
  customMoments: DigitalTwinProfile["customMoments"];
  guardrailReviews: DigitalTwinProfile["guardrailReviews"];
}

const IMPORT_DELAY_MS = 1100;

function wikiSource(wikipedia: WikipediaProfile) {
  return {
    type: "wikipedia" as const,
    url: wikipedia.sourceUrl,
    citation: "Wikipedia",
    verified: true,
    importedAtISO: new Date().toISOString(),
    revisionId: wikipedia.revisionId,
  };
}

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
    source: wikiSource(wikipedia),
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

/** Heuristic timeline from Wikipedia summary text (no AI). */
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

  if (events.length === 0) {
    events.push(
      makeEvent(wikipedia, {
        title: `Wikipedia profile imported`,
        description: wikipedia.summary || wikipedia.description,
        year: new Date().getFullYear() - 5,
        eventType: "Historical",
        confidence: "Medium",
        emotionalSignificance: 40,
      }),
    );
  }

  return events.sort((a, b) => a.year - b.year);
}

/**
 * Generate timeline (+ optional demo custom moments) for S2 import.
 * Uses seeded mockData for demo subjects; heuristic parsing for live Wikipedia.
 */
export async function generateImportBundle(
  draft: DigitalTwinProfile,
): Promise<ImportBundle> {
  await new Promise((resolve) => setTimeout(resolve, IMPORT_DELAY_MS));

  const { wikipedia } = draft;

  if (wikipedia.pageId === "demo-michael-jordan") {
    const twin = buildMichaelJordanTwin();
    return {
      timeline: twin.timeline,
      customMoments: twin.customMoments,
      guardrailReviews: twin.guardrailReviews,
    };
  }

  if (wikipedia.pageId === "demo-thin-profile") {
    const twin = buildThinProfileTwin();
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
