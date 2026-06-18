import { SCHEMA_VERSION, type DigitalTwinProfile } from "@/types/twin";

const nowISO = "2026-06-10T00:00:00.000Z";

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
      "Walt Liquor is a Bay Area music artist and executive. This internal research profile is seeded from a producer-provided narrative moment for voice testing.",
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
        citation:
          "Producer-provided narrative: /data/WaltLiquor/Walt Liquor Narrative Story.docx; supporting media: AQM S5 trailer",
        notes:
          "Internal research use. Behind-the-scenes details are producer-provided; trailer supports the All The Queen's Men production context.",
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
