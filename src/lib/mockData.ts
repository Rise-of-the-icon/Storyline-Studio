import { evaluateGuardrails } from "./guardrails";
import {
  SCHEMA_VERSION,
  type CustomMoment,
  type DigitalTwinProfile,
  type TimelineEvent,
  type WikipediaProfile,
} from "../types/twin";
import type { WikipediaSearchHit } from "./wikipedia";

const WIKI_URL = "https://en.wikipedia.org/wiki/Michael_Jordan";

function wikiSource(revisionId?: string) {
  return {
    type: "wikipedia" as const,
    url: WIKI_URL,
    citation: "Wikipedia (demo seed)",
    verified: true,
    importedAtISO: new Date().toISOString(),
    revisionId,
  };
}

function event(
  partial: Omit<TimelineEvent, "source" | "decade"> & { decade?: string },
): TimelineEvent {
  const decade = partial.decade ?? `${Math.floor(partial.year / 10) * 10}s`;
  return {
    ...partial,
    decade,
    source: wikiSource(),
  };
}

const MICHAEL_JORDAN_WIKI: WikipediaProfile = {
  pageId: "demo-michael-jordan",
  title: "Michael Jordan",
  summary:
    "American former professional basketball player and businessman. Widely regarded as one of the greatest players in history.",
  description: "American basketball player (born 1963)",
  sourceUrl: WIKI_URL,
};

/** Stable ids so guardrail reviews survive demo resets. */
export const DEMO_CUSTOM_MOMENT_PRIVATE_ID = "cm-mj-private-relationships";

const MICHAEL_JORDAN_CUSTOM_MOMENTS: CustomMoment[] = [
  {
    id: DEMO_CUSTOM_MOMENT_PRIVATE_ID,
    title: "Private relationships",
    description:
      "A relationship the subject asked producers to treat carefully and keep out of public-facing narration.",
    emotionalSignificance: "Deeply personal; shapes trust in interview settings",
    visibility: "Private",
    sensitivity: "High",
    sourceNotes: "Producer notes — not independently verified",
  },
];

const MICHAEL_JORDAN_TIMELINE: TimelineEvent[] = [
  event({
    id: "evt-mj-born",
    title: "Born in Brooklyn",
    description: "Michael Jeffrey Jordan is born in Brooklyn, New York.",
    year: 1963,
    eventType: "Personal",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 40,
  }),
  event({
    id: "evt-mj-unc",
    title: "UNC national title",
    description:
      "Hits the game-winning shot for North Carolina in the NCAA championship.",
    year: 1982,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 72,
  }),
  event({
    id: "evt-mj-draft",
    title: "Drafted by the Chicago Bulls",
    description:
      "Selected third overall in the NBA Draft, beginning his Bulls career.",
    year: 1984,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 68,
  }),
  event({
    id: "evt-mj-first-ring",
    title: "First NBA championship",
    description: "Leads Chicago to the first title of the 1990s dynasty.",
    year: 1991,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 88,
  }),
  event({
    id: "evt-mj-father",
    title: "Father James Jordan murdered",
    description: "His father is killed in a roadside incident in North Carolina.",
    year: 1993,
    eventType: "Personal",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "High",
    emotionalSignificance: 95,
  }),
  event({
    id: "evt-mj-retire1",
    title: "First retirement",
    description: "Steps away from basketball after his father's death.",
    year: 1993,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "Medium",
    emotionalSignificance: 80,
  }),
  event({
    id: "evt-mj-finals98",
    title: "1998 Finals — winning shot",
    description: "Game-winning jumper in Game 6 clinches a sixth championship.",
    year: 1998,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 98,
  }),
  event({
    id: "evt-mj-retire2",
    title: "Second retirement",
    description: "Retires again after the 1997–98 season.",
    year: 1999,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 70,
  }),
  event({
    id: "evt-mj-wizards",
    title: "Return with the Wizards",
    description: "Comes out of retirement to play for Washington.",
    year: 2001,
    eventType: "Career",
    confidence: "Medium",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 55,
  }),
  event({
    id: "evt-mj-rumor",
    title: "Unverified locker-room rumor",
    description:
      "Tabloid-sourced claim about a post-game confrontation — not corroborated in major biographies.",
    year: 1992,
    eventType: "Historical",
    confidence: "Low",
    approvalStatus: "Draft",
    sensitivity: "Medium",
    emotionalSignificance: 35,
  }),
];

const THIN_PROFILE_WIKI: WikipediaProfile = {
  pageId: "demo-thin-profile",
  title: "Alex Rivera (demo)",
  summary:
    "Fictional demo subject with a deliberately thin public record — three verified-style events only.",
  description: "Demo artist (fictional) — thin timeline showcase",
  sourceUrl: "https://example.com/demo/thin-profile",
};

const THIN_PROFILE_TIMELINE: TimelineEvent[] = [
  event({
    id: "evt-thin-debut",
    title: "Independent debut release",
    description: "Self-released first EP; limited press coverage.",
    year: 2014,
    eventType: "Career",
    confidence: "Medium",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 55,
  }),
  event({
    id: "evt-thin-breakout",
    title: "Breakout festival set",
    description: "Widely shared performance clip drives regional recognition.",
    year: 2018,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 78,
  }),
  event({
    id: "evt-thin-rumor",
    title: "Unverified industry rumor",
    description:
      "Anonymous forum post about a label dispute — not corroborated in trade press.",
    year: 2020,
    eventType: "Historical",
    confidence: "Low",
    approvalStatus: "Draft",
    sensitivity: "Medium",
    emotionalSignificance: 30,
  }),
];

export function buildMichaelJordanTwin(): DigitalTwinProfile {
  const customMoments = [...MICHAEL_JORDAN_CUSTOM_MOMENTS];
  const timeline = [...MICHAEL_JORDAN_TIMELINE];
  const guardrailReviews = evaluateGuardrails(timeline, customMoments);

  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: "demo-michael-jordan-template",
    consentAcknowledged: false,
    coreIdentity: { name: "Michael Jordan" },
    wikipedia: MICHAEL_JORDAN_WIKI,
    timeline,
    customMoments,
    guardrailReviews,
    draftStatus: "draft",
    createdAtISO: new Date().toISOString(),
  };
}

export function buildThinProfileTwin(): DigitalTwinProfile {
  const timeline = [...THIN_PROFILE_TIMELINE];
  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: "demo-thin-profile-template",
    consentAcknowledged: false,
    coreIdentity: { name: "Alex Rivera (demo)" },
    wikipedia: THIN_PROFILE_WIKI,
    timeline,
    customMoments: [],
    guardrailReviews: evaluateGuardrails(timeline, []),
    draftStatus: "draft",
    createdAtISO: new Date().toISOString(),
  };
}

export interface DemoSearchSubject {
  id: string;
  matchTerms: string[];
  hit: WikipediaSearchHit;
  buildTwin: () => DigitalTwinProfile;
}

export const DEMO_SEARCH_SUBJECTS: DemoSearchSubject[] = [
  {
    id: "demo-michael-jordan",
    matchTerms: ["michael", "jordan", "mj", "bulls", "basketball"],
    hit: {
      pageId: "demo-michael-jordan",
      title: "Michael Jordan",
      description:
        "Full demo — 10 events, guardrail flag on “Private relationships”, low-confidence rumor.",
      demoSubjectId: "demo-michael-jordan",
    },
    buildTwin: buildMichaelJordanTwin,
  },
  {
    id: "demo-thin-profile",
    matchTerms: ["thin", "alex", "rivera", "limited", "sparse"],
    hit: {
      pageId: "demo-thin-profile",
      title: "Alex Rivera (demo)",
      description:
        "Thin timeline demo — only 3 public events (triggers S3 thin-timeline guidance).",
      demoSubjectId: "demo-thin-profile",
    },
    buildTwin: buildThinProfileTwin,
  },
];

export function searchDemoSubjects(query: string): WikipediaSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  return DEMO_SEARCH_SUBJECTS.filter((subject) =>
    subject.matchTerms.some((term) => term.includes(q) || q.includes(term)),
  ).map((subject) => subject.hit);
}

export function getDemoSubjectById(id: string): DemoSearchSubject | undefined {
  return DEMO_SEARCH_SUBJECTS.find((s) => s.id === id);
}

/** Whether the seeded MJ twin includes the intentional S5 guardrail flag. */
export function demoGuardrailFlagPresent(twin: DigitalTwinProfile): boolean {
  return twin.guardrailReviews.some(
    (r) =>
      r.trigger === "Private relationships" &&
      r.eventId === DEMO_CUSTOM_MOMENT_PRIVATE_ID,
  );
}
