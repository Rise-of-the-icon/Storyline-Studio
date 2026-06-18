import { SCHEMA_VERSION, type DigitalTwinProfile } from "@/types/twin";
import type { VoiceScriptOption } from "./VoiceContextPreview";

const nowISO = "2026-06-10T00:00:00.000Z";
export const WALT_VOICE_ID =
  import.meta.env.VITE_WALT_VOICE_ID || "default--z5zasdfwci5ofrt-gmsjw__walt";

export const WALT_VOICE_STUDIO_EVENT_ID = "walt-liquor-fake-it-till-you-make-it-2020";

export const WALT_VOICE_STUDIO_DRAFT: DigitalTwinProfile = {
  schemaVersion: SCHEMA_VERSION,
  twinId: "walt-liquor-research",
  consentAcknowledged: true,
  consentAcknowledgedAtISO: nowISO,
  coreIdentity: {
    name: "Walt Liquor",
  },
  wikipedia: {
    pageId: "walt-liquor-internal",
    title: "Walt Liquor",
    description: "Bay Area music artist and executive",
    summary:
      "Producer-verified profile for Walt Liquor, centered on a December 2020 career-defining music-supervision moment for All The Queen's Men.",
    sourceUrl: "internal://data/WaltLiquor/Walt Liquor Narrative Story.docx",
  },
  timeline: [
    {
      id: WALT_VOICE_STUDIO_EVENT_ID,
      title: "Fake It Till You Make It",
      description:
        "In December 2020, Walt Liquor was given his first opportunity to music supervise a major television production. He had not done it before, but told the producers he knew what he was doing. One producer liked the unconventional sound enough to give Walt room to fix mistakes before they became visible. The work fit the show, and All The Queen's Men went on to become one of Tyler Perry Studios' top-performing titles.",
      summary:
        "Walt Liquor's first major music-supervision opportunity became a career-defining test of self-belief, unconventional taste, and learning in motion.",
      date: "2020-12",
      year: 2020,
      decade: "2020s",
      eventType: "Career",
      category: "Career",
      source: {
        type: "producer",
        url: "https://www.youtube.com/watch?v=VUQTNah_6MM",
        citation: "Producer-provided Walt Liquor narrative story",
        notes:
          "Local source: /data/WaltLiquor/Walt Liquor Narrative Story.docx; supporting media: All The Queen's Men S5 trailer.",
        verified: true,
        importedAtISO: nowISO,
      },
      confidence: "Medium",
      approvalStatus: "Reviewed",
      sensitivity: "Low",
      visibility: "Internal",
      emotionalSignificance: 88,
    },
  ],
  customMoments: [],
  guardrailReviews: [],
  savedVoiceContexts: [],
  draftStatus: "draft",
  createdAtISO: nowISO,
  lastSavedAtISO: nowISO,
};

export const WALT_VOICE_SCRIPT_OPTIONS: VoiceScriptOption[] = [
  {
    id: "walt-breakthrough",
    question: "What made that 2020 moment a breakthrough?",
    sourceNote: "Producer-provided narrative and reviewed timeline event",
    answerScript:
      "In December 2020, I got my first major chance to music supervise a television production. I had never done it at that scale, but I trusted my instincts, moved quickly, and kept refining the sound until it landed. That pressure became proof.",
  },
  {
    id: "walt-approach",
    question: "How do you describe your creative approach?",
    sourceNote: "Producer-provided narrative and reviewed timeline event",
    answerScript:
      "I work from feeling first, then structure. I listen for tone, story, and where the audience should lean in. The goal is to make the sound carry the truth of the scene without over-explaining it.",
  },
  {
    id: "walt-lesson",
    question: "What lesson do you keep from that experience?",
    sourceNote: "Producer-provided narrative and reviewed timeline event",
    answerScript:
      "Preparation matters, but belief matters just as much. That moment taught me to step into opportunities before they feel fully comfortable and then do the detailed work to earn the trust that follows.",
  },
];
