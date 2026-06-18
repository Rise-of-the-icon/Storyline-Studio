import { buildDavidWestTwin } from "@/data/demoSubjects";
import type { VoiceScriptOption } from "./VoiceContextPreview";

export const DAVID_VOICE_ID = "default--z5zasdfwci5ofrt-gmsjw__david_west";
export const DAVID_VOICE_STUDIO_EVENT_ID = "evt-david-west-all-star";

export const DAVID_VOICE_STUDIO_DRAFT = {
  ...buildDavidWestTwin(),
  twinId: "david-west-research",
  consentAcknowledged: true,
  consentAcknowledgedAtISO: "2026-06-18T00:00:00.000Z",
  lastSavedAtISO: "2026-06-18T00:00:00.000Z",
};

export const DAVID_VOICE_SCRIPT_OPTIONS: VoiceScriptOption[] = [
  {
    id: "david-identity",
    question: "How would you describe your game identity?",
    sourceNote: "Curated demo profile; reviewed timeline event",
    answerScript:
      "My game was built on discipline, positioning, and doing the work that holds a team together. I wasn't chasing noise. I was trying to make reliable winning plays every night and set a standard for how we compete.",
  },
  {
    id: "david-recognition",
    question: "What did league recognition mean to you?",
    sourceNote: "Curated demo profile; reviewed timeline event",
    answerScript:
      "Recognition mattered because it confirmed that consistency still counts in this league. Those seasons were about staying steady, playing both ends, and proving that leadership can be quiet and still be undeniable.",
  },
  {
    id: "david-legacy",
    question: "What legacy are you most proud of?",
    sourceNote: "Curated demo profile; reviewed timeline event",
    answerScript:
      "I'm proud that people trusted me in hard moments. Late-game possessions, playoff pressure, locker-room decisions. The legacy is being dependable when it matters and helping younger players carry that forward.",
  },
];
