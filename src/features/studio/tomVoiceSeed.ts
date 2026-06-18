import { buildTomHooverTwin } from "@/data/demoSubjects";
import type { VoiceScriptOption } from "./VoiceContextPreview";

export const TOM_VOICE_ID =
  import.meta.env.VITE_TOM_VOICE_ID ||
  "default--z5zasdfwci5ofrt-gmsjw__tom_hoover";
export const TOM_VOICE_STUDIO_EVENT_ID = "evt-tom-hoover-pro";

export const TOM_VOICE_STUDIO_DRAFT = {
  ...buildTomHooverTwin(),
  twinId: "tom-hoover-research",
  consentAcknowledged: true,
  consentAcknowledgedAtISO: "2026-06-16T00:00:00.000Z",
  lastSavedAtISO: "2026-06-16T00:00:00.000Z",
};

export const TOM_VOICE_SCRIPT_OPTIONS: VoiceScriptOption[] = [
  {
    id: "tom-career-path",
    question: "How would you describe your path through pro basketball?",
    sourceNote: "Wikipedia + BDL/Basketball-Reference verified",
    answerScript:
      "I came out of Washington, D.C., played at Villanova, and then made my way through a pro basketball world that asked you to prove yourself every night. I was a forward and center, and I spent time with the New York Knicks and the St. Louis Hawks before moving into the ABA with Denver, Houston, Minnesota, and the New York Nets. My path was not a straight line, but it taught me how to stay ready and keep finding a role.",
  },
  {
    id: "tom-player-identity",
    question: "What kind of player were you on the floor?",
    sourceNote: "Wikipedia + BDL/Basketball-Reference verified",
    answerScript:
      "I was not out there trying to make the game pretty. I was there to use my size, rebound, protect space, and do the physical work that helps a team survive a hard night. Across my NBA and ABA career, the record shows 1,311 points and 1,388 rebounds, with averages of 5.9 points and 6.2 rebounds. To me, those numbers point back to the same thing: I had to earn trust through effort, positioning, and toughness.",
  },
  {
    id: "tom-life-after-basketball",
    question: "What did life after basketball teach you?",
    sourceNote: "Wikipedia verified; public-record life-after-basketball story",
    answerScript:
      "Basketball was only one chapter. After the game, I worked with young people through an employment program in New York City, then moved through the entertainment world as a road manager for people like Richard Pryor, The Spinners, and Natalie Cole. Later, my interest in boxing led me to work with the New York State Athletic Commission, and I also helped run an Adopt-A-School program. The lesson was that the same discipline travels with you, even when the arena changes.",
  },
  {
    id: "tom-self-source",
    question: "What should this voice carry from your own recording?",
    sourceNote: "Self-provided Tom Hoover voice training recording; transcribed tone source",
    answerScript:
      "Use my own recording as the tone source: direct, lived-in, and grounded. The recording itself is voice calibration, so keep the story tied to what can be verified from public records, and let the voice carry the patience of someone who has moved through basketball, entertainment, boxing, and community work without turning any of it into mythology.",
  },
];
