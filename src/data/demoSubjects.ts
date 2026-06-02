/**
 * Curated demo profiles for the RICON Studio wizard.
 *
 * - Used as Wikipedia-search fallbacks when the live API is unreachable
 *   (see `src/features/search/wikipedia.ts` → `searchWikipedia`).
 * - Used directly via the explicit `useDemoSubject(id)` context action
 *   from S1's "Try a demo subject" pills.
 *
 * Demo subjects are visibly labelled "Demo profile" in the UI (S2, S6,
 * Voice Studio) so a viewer never mistakes seeded content for live
 * Wikipedia data. The contract for spotting a demo subject is a single
 * helper, `isDemoTwin(draft)`, that every surface uses.
 *
 * **Not for storage / harness tests.** That fixture lives in
 * `src/dev/mockTwin.ts` and is dev-only.
 */

import { makeProducerSource } from "@/lib/contentModel";
import { evaluateGuardrails } from "@/lib/guardrails";
import type { WikipediaSearchHit } from "@/features/search/wikipedia";
import {
  SCHEMA_VERSION,
  type CustomMoment,
  type DigitalTwinProfile,
  type TimelineEvent,
  type WikipediaProfile,
} from "@/types/twin";

export type DemoSubjectCategory = "Sports" | "Music";

export interface DemoVoiceProfile {
  /** Resolver voice archetype hint, e.g. `the-captain`, `the-poet`. */
  archetype: string;
  /** Initial audience for the Voice Studio scene controls. */
  defaultAudience: "Arena" | "Intimate" | "Broadcast" | "Peers";
  /** Initial conversation mode. */
  defaultMode: "Narrator" | "Q&A" | "Documentary";
  /** Initial narrative goal id (must match a `NARRATIVE_GOAL_OPTIONS` id). */
  defaultNarrativeGoal: "celebrate" | "honor" | "challenge" | "mourn" | "explain";
  /** One-line guidance for editorial review. */
  toneNote: string;
}

export interface DemoSubject {
  id: string;
  /** Words that map a search query to this subject (case-insensitive). */
  matchTerms: string[];
  /** Search-result row metadata (what S1 renders). */
  hit: WikipediaSearchHit;
  /** Category surfaced in the UI as a badge. */
  category: DemoSubjectCategory;
  /** Short editorial bio shown on S2 + S6. ≤ 200 chars. */
  bio: string;
  /** Voice / emotional profile defaults for the Voice Studio. */
  voiceProfile: DemoVoiceProfile;
  /** Builds a fresh `DigitalTwinProfile` template (twinId re-randomized on use). */
  buildTwin: () => DigitalTwinProfile;
}

const MJ_WIKI_URL = "https://en.wikipedia.org/wiki/Michael_Jordan";

function demoSource(
  url: string,
  revisionId?: string,
): TimelineEvent["source"] {
  return {
    // `demo` is the V2 canonical source type for curated fixture content;
    // it surfaces as a separate "Demo seed" badge so a viewer never confuses
    // it with a real Wikipedia import.
    type: "demo",
    url,
    citation: "Wikipedia (demo seed)",
    notes: "Curated demo fixture — not from a live Wikipedia fetch.",
    verified: true,
    importedAtISO: new Date().toISOString(),
    revisionId,
  };
}

function event(
  url: string,
  partial: Omit<TimelineEvent, "source" | "decade" | "category" | "summary"> & {
    decade?: string;
  },
): TimelineEvent {
  const decade = partial.decade ?? `${Math.floor(partial.year / 10) * 10}s`;
  return {
    ...partial,
    decade,
    source: demoSource(url),
    // V2 aliases — explicit so persisted demo drafts already match V2 shape.
    category: partial.eventType,
    summary: partial.description,
    visibility: partial.visibility ?? "Internal",
  };
}

// ---------- Michael Jordan (Sports) ----------

const MICHAEL_JORDAN_WIKI: WikipediaProfile = {
  pageId: "demo-michael-jordan",
  title: "Michael Jordan",
  summary:
    "American former professional basketball player and businessman. Widely regarded as one of the greatest players in history.",
  description: "American basketball player (born 1963)",
  sourceUrl: MJ_WIKI_URL,
};

/** Stable id so guardrail reviews survive demo resets. */
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
    source: makeProducerSource({
      sourceNotes: "Producer notes — not independently verified",
      verified: false,
    }),
  },
];

const MICHAEL_JORDAN_TIMELINE: TimelineEvent[] = [
  event(MJ_WIKI_URL, {
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
  event(MJ_WIKI_URL, {
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
  event(MJ_WIKI_URL, {
    id: "evt-mj-draft",
    title: "Drafted by the Chicago Bulls",
    description:
      "Selected third overall in the NBA Draft, beginning his Bulls career.",
    year: 1984,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 68,
  }),
  event(MJ_WIKI_URL, {
    id: "evt-mj-first-ring",
    title: "First NBA championship",
    description: "Leads Chicago to the first title of the 1990s dynasty.",
    year: 1991,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 88,
  }),
  event(MJ_WIKI_URL, {
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
  event(MJ_WIKI_URL, {
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
  event(MJ_WIKI_URL, {
    id: "evt-mj-finals98",
    title: "1998 Finals — winning shot",
    description: "Game-winning jumper in Game 6 clinches a sixth championship.",
    year: 1998,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 98,
  }),
  event(MJ_WIKI_URL, {
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
  event(MJ_WIKI_URL, {
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
  event(MJ_WIKI_URL, {
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

// ---------- Alex Rivera (Music, thin profile) ----------

const THIN_PROFILE_URL = "https://example.com/demo/thin-profile";

const THIN_PROFILE_WIKI: WikipediaProfile = {
  pageId: "demo-thin-profile",
  title: "Alex Rivera (demo)",
  summary:
    "Fictional demo subject with a deliberately thin public record — three verified-style events only.",
  description: "Demo artist (fictional) — thin timeline showcase",
  sourceUrl: THIN_PROFILE_URL,
};

const THIN_PROFILE_TIMELINE: TimelineEvent[] = [
  event(THIN_PROFILE_URL, {
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
  event(THIN_PROFILE_URL, {
    id: "evt-thin-breakout",
    title: "Breakout festival set",
    description: "Widely shared performance clip drives regional recognition.",
    year: 2018,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 78,
  }),
  event(THIN_PROFILE_URL, {
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

// ---------- Lina Solano (Music) — investor-ready end-to-end demo ----------

const LINA_WIKI_URL = "https://example.com/demo/lina-solano";

const LINA_SOLANO_WIKI: WikipediaProfile = {
  pageId: "demo-lina-solano",
  title: "Lina Solano (demo)",
  summary:
    "Fictional Colombian Latin-alternative singer-songwriter. Built as a polished end-to-end demo subject — every wizard step has meaningful, reviewable content without depending on the live Wikipedia API.",
  description:
    "Demo artist (fictional) — investor-ready end-to-end fixture covering breakthrough, achievement, legacy, personal loss, and a behind-the-scenes custom moment.",
  sourceUrl: LINA_WIKI_URL,
};

export const DEMO_CUSTOM_MOMENT_LINA_STUDIO_ID = "cm-lina-studio-quiet-hours";
export const DEMO_CUSTOM_MOMENT_LINA_PRIVATE_ID = "cm-lina-private-friend-story";

const LINA_SOLANO_CUSTOM_MOMENTS: CustomMoment[] = [
  {
    id: DEMO_CUSTOM_MOMENT_LINA_STUDIO_ID,
    title: "Quiet hours in the studio",
    date: "2010–2014",
    description:
      "Producer-sourced anecdote: Lina booked the room from 3am to dawn so she could write without label A&R in the building. The habit shaped the sparse mixes on her early records.",
    emotionalSignificance:
      "Defines the producer's mental model of her process — reserved, deliberate, allergic to performance.",
    visibility: "Internal",
    sensitivity: "Low",
    sourceNotes: "Producer notes — corroborated by two engineers on the album credits.",
    source: makeProducerSource({
      sourceNotes:
        "Producer notes — corroborated by two engineers on the album credits.",
      verified: true,
    }),
  },
  {
    id: DEMO_CUSTOM_MOMENT_LINA_PRIVATE_ID,
    title: "A friend's untold story",
    description:
      "A close collaborator's experience that the subject asked producers to keep private. Surfaces here so the guardrail review forces an editorial decision before any voicing.",
    emotionalSignificance:
      "Deeply private; the friend's name and details must never appear in narration.",
    visibility: "Private",
    sensitivity: "High",
    sourceNotes:
      "Producer notes — not independently verified, intentionally redacted in this fixture.",
    source: makeProducerSource({
      sourceNotes:
        "Producer notes — not independently verified, intentionally redacted in this fixture.",
      verified: false,
    }),
  },
];

const LINA_SOLANO_TIMELINE: TimelineEvent[] = [
  event(LINA_WIKI_URL, {
    id: "evt-lina-born",
    title: "Born in Bogotá",
    description:
      "Lina Solano is born in Bogotá, Colombia. Raised in the Teusaquillo neighborhood, the second of three siblings.",
    year: 1985,
    eventType: "Personal",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 35,
  }),
  event(LINA_WIKI_URL, {
    id: "evt-lina-residency",
    title: "Open-mic residency at La Caracola",
    description:
      "Holds a weekly residency at the La Caracola café in Chapinero. The two-year run is where her first collaborators are recorded as showing up — the seed of her band.",
    year: 2003,
    eventType: "Career",
    confidence: "Medium",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 58,
  }),
  event(LINA_WIKI_URL, {
    id: "evt-lina-debut",
    title: "Debut album 'Norte Sin Sur' released",
    description:
      "Self-funded debut album released independently. Praised by Bogotá's alt-press for its sparse arrangements and refusal of radio-friendly hooks.",
    year: 2008,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 78,
  }),
  event(LINA_WIKI_URL, {
    id: "evt-lina-grammy",
    title: "Latin Grammy — Best Alternative Album",
    description:
      "Wins the Latin Grammy for Best Alternative Album for 'Ceniza Tibia.' Acceptance speech credits her late grandmother and her La Caracola collaborators.",
    year: 2012,
    eventType: "Award",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 88,
  }),
  event(LINA_WIKI_URL, {
    id: "evt-lina-tour",
    title: "Norte/Sur Tour across Latin America",
    description:
      "Headlines a 22-date Latin American tour. Sold-out shows in Mexico City, Buenos Aires, Lima, and Santiago. Final night filmed for the 'Norte/Sur en Vivo' concert film.",
    year: 2016,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 82,
  }),
  event(LINA_WIKI_URL, {
    id: "evt-lina-brother",
    title: "Brother's death — writes 'Ceniza' in his memory",
    description:
      "Her younger brother dies unexpectedly. She writes the song 'Ceniza' the same week; it is later released as a single with proceeds to a Bogotá grief-support nonprofit.",
    year: 2019,
    eventType: "Legacy",
    confidence: "High",
    approvalStatus: "Draft",
    sensitivity: "High",
    emotionalSignificance: 96,
  }),
  event(LINA_WIKI_URL, {
    id: "evt-lina-producer",
    title: "Steps back to producer-only role",
    description:
      "Announces a pause on touring. Returns to small venues and shifts to a producer-only role on two of her label-mates' records.",
    year: 2022,
    eventType: "Career",
    confidence: "Medium",
    approvalStatus: "Draft",
    sensitivity: "Medium",
    emotionalSignificance: 64,
  }),
  event(LINA_WIKI_URL, {
    id: "evt-lina-rumor",
    title: "Unverified tabloid claim about a label dispute",
    description:
      "An anonymous trade-press post claims she walked out of a label meeting after a contract argument — not corroborated by named sources or the label.",
    year: 2024,
    eventType: "Historical",
    confidence: "Low",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 32,
  }),
];

export function buildLinaSolanoTwin(): DigitalTwinProfile {
  const customMoments = [...LINA_SOLANO_CUSTOM_MOMENTS];
  const timeline = [...LINA_SOLANO_TIMELINE];
  const guardrailReviews = evaluateGuardrails(timeline, customMoments);

  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: "demo-lina-solano-template",
    consentAcknowledged: false,
    coreIdentity: { name: "Lina Solano (demo)" },
    wikipedia: LINA_SOLANO_WIKI,
    timeline,
    customMoments,
    guardrailReviews,
    draftStatus: "draft",
    createdAtISO: new Date().toISOString(),
  };
}

// ---------- Requested demo profiles ----------

function buildDemoProfile(
  id: string,
  name: string,
  description: string,
  summary: string,
  timeline: TimelineEvent[],
  customMoments: CustomMoment[],
): DigitalTwinProfile {
  const wikipedia: WikipediaProfile = {
    pageId: id,
    title: name,
    summary,
    description,
    sourceUrl: `https://example.com/demo/${id.replace("demo-", "")}`,
  };
  const moments = [...customMoments];
  const events = [...timeline];
  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: `${id}-template`,
    consentAcknowledged: false,
    coreIdentity: { name },
    wikipedia,
    timeline: events,
    customMoments: moments,
    guardrailReviews: evaluateGuardrails(events, moments),
    draftStatus: "draft",
    createdAtISO: new Date().toISOString(),
  };
}

const DAVID_WEST_URL = "https://example.com/demo/david-west";
const DAVID_WEST_TIMELINE: TimelineEvent[] = [
  event(DAVID_WEST_URL, {
    id: "evt-david-west-foundations",
    title: "Builds his game on fundamentals",
    description:
      "David West develops a reputation for disciplined footwork, mid-range touch, and a team-first approach to basketball.",
    year: 1998,
    eventType: "Personal",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 45,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-college",
    title: "Emerges as a college leader",
    description:
      "A productive college run establishes West as a reliable frontcourt leader and a composed late-game option.",
    year: 2002,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 68,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-draft",
    title: "Begins professional career",
    description:
      "West enters professional basketball and earns rotation minutes through consistent defense and decision-making.",
    year: 2003,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 72,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-all-star",
    title: "Earns league-wide recognition",
    description:
      "Back-to-back standout seasons bring league-wide recognition for West's steady two-way play.",
    year: 2008,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 82,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-veteran",
    title: "Becomes a veteran stabilizer",
    description:
      "West takes on a veteran role, mentoring younger teammates while continuing to contribute in high-pressure games.",
    year: 2015,
    eventType: "Legacy",
    confidence: "Medium",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 70,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-championship",
    title: "Adds championship experience",
    description:
      "A championship-stage run adds a final team achievement to West's professional basketball story.",
    year: 2017,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 88,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-retirement",
    title: "Shifts focus beyond the court",
    description:
      "After basketball, West turns more attention toward mentorship, education, and long-term community impact.",
    year: 2018,
    eventType: "Legacy",
    confidence: "Medium",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 62,
  }),
];

export function buildDavidWestTwin(): DigitalTwinProfile {
  return buildDemoProfile(
    "demo-david-west",
    "David West",
    "Basketball player - curated demo profile",
    "Curated demo profile for David West, a basketball player whose storyline emphasizes leadership, consistency, and veteran perspective.",
    DAVID_WEST_TIMELINE,
    [],
  );
}

const TOM_HOOVER_URL = "https://example.com/demo/tom-hoover";
const TOM_HOOVER_TIMELINE: TimelineEvent[] = [
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-local-courts",
    title: "Finds an early rhythm on local courts",
    description:
      "Tom Hoover starts with a patient, defensive-minded game and an interest in the details that shape team chemistry.",
    year: 2006,
    eventType: "Personal",
    confidence: "Medium",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 42,
  }),
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-breakthrough",
    title: "Breakthrough season",
    description:
      "A breakout season puts Hoover on the radar as a dependable basketball player who can steady a close game.",
    year: 2011,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 75,
  }),
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-pro",
    title: "Steps into a professional rotation",
    description:
      "Hoover earns professional minutes and builds trust through preparation, communication, and efficient play.",
    year: 2013,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 70,
  }),
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-injury",
    title: "Works back from injury",
    description:
      "A difficult injury interrupts Hoover's momentum and reframes the next phase of his basketball career.",
    year: 2016,
    eventType: "Personal",
    confidence: "Medium",
    approvalStatus: "Draft",
    sensitivity: "Medium",
    emotionalSignificance: 84,
  }),
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-return",
    title: "Returns as a more vocal teammate",
    description:
      "Hoover returns to the court with a stronger emphasis on communication and supporting younger players.",
    year: 2017,
    eventType: "Career",
    confidence: "Medium",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 74,
  }),
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-clinic",
    title: "Starts an offseason skills clinic",
    description:
      "Hoover launches a small offseason clinic focused on decision-making, footwork, and sustainable development.",
    year: 2020,
    eventType: "Legacy",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 64,
  }),
];

export function buildTomHooverTwin(): DigitalTwinProfile {
  return buildDemoProfile(
    "demo-tom-hoover",
    "Tom Hoover",
    "Basketball player - curated demo profile",
    "Curated demo profile for Tom Hoover, a basketball player whose storyline covers resilience, team contribution, and mentorship.",
    TOM_HOOVER_TIMELINE,
    [],
  );
}

const WALT_TAYLOR_URL = "https://example.com/demo/walt-taylor";
const WALT_TAYLOR_TIMELINE: TimelineEvent[] = [
  event(WALT_TAYLOR_URL, {
    id: "evt-walt-taylor-first-shows",
    title: "Builds a multidisciplinary practice",
    description:
      "Walt Taylor, also known as Walt Liquor, begins combining music, visual work, and live experiences into one creative practice.",
    year: 2008,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 58,
  }),
  event(WALT_TAYLOR_URL, {
    id: "evt-walt-taylor-collective",
    title: "Forms an independent creative collective",
    description:
      "Taylor creates a collaborative platform for artists, producers, and designers working across music and culture.",
    year: 2012,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 76,
  }),
  event(WALT_TAYLOR_URL, {
    id: "evt-walt-taylor-executive",
    title: "Expands into music executive work",
    description:
      "Taylor takes on a broader executive role, shaping projects from early artist development through release strategy.",
    year: 2015,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 82,
  }),
  event(WALT_TAYLOR_URL, {
    id: "evt-walt-taylor-installation",
    title: "Stages a cross-medium installation",
    description:
      "A gallery-scale installation brings Taylor's music, artwork, and spatial storytelling into a single public experience.",
    year: 2018,
    eventType: "Achievement",
    confidence: "Medium",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 86,
  }),
  event(WALT_TAYLOR_URL, {
    id: "evt-walt-taylor-mentorship",
    title: "Deepens artist mentorship",
    description:
      "Taylor formalizes a mentorship approach centered on creative ownership, long-term development, and sustainable careers.",
    year: 2021,
    eventType: "Legacy",
    confidence: "Medium",
    approvalStatus: "Draft",
    sensitivity: "Low",
    emotionalSignificance: 72,
  }),
  event(WALT_TAYLOR_URL, {
    id: "evt-walt-taylor-rumor",
    title: "Unverified claim about an unreleased project",
    description:
      "An unattributed post speculates about a shelved collaboration; the claim is intentionally unverified for editorial review.",
    year: 2023,
    eventType: "Historical",
    confidence: "Low",
    approvalStatus: "Draft",
    sensitivity: "Medium",
    emotionalSignificance: 34,
  }),
];

const WALT_TAYLOR_CUSTOM_MOMENTS: CustomMoment[] = [
  {
    id: "cm-walt-taylor-private-relationship",
    title: "Private relationship boundary",
    description:
      "A private relationship influenced a creative transition, but the subject asked producers to keep the details out of public-facing narration.",
    emotionalSignificance:
      "Important context for the producer, but not cleared for story output.",
    visibility: "Private",
    sensitivity: "High",
    sourceNotes: "Producer note - intentionally private and not independently verified.",
    source: makeProducerSource({
      sourceNotes:
        "Producer note - intentionally private and not independently verified.",
      verified: false,
    }),
  },
];

export function buildWaltTaylorTwin(): DigitalTwinProfile {
  return buildDemoProfile(
    "demo-walt-taylor",
    "Walt Taylor (aka Walt Liquor)",
    "Multidisciplinary artist and music executive - curated demo profile",
    "Curated demo profile for Walt Taylor, also known as Walt Liquor, a multidisciplinary artist and music executive working across creative direction, artist development, and culture.",
    WALT_TAYLOR_TIMELINE,
    WALT_TAYLOR_CUSTOM_MOMENTS,
  );
}

// ---------- Catalog ----------

/**
 * Stable id for the richest editorial-review demo. Kept as a shared handle
 * for tests and any surfaces that need one polished end-to-end fixture.
 */
export const INVESTOR_DEMO_SUBJECT_ID = "demo-walt-taylor";

export const DEMO_SUBJECTS: DemoSubject[] = [
  {
    id: "demo-david-west",
    category: "Sports",
    bio: "Basketball player. A leadership-focused profile with a seven-event career arc from fundamentals to veteran mentorship.",
    matchTerms: ["david", "west", "basketball", "sports", "leadership"],
    hit: {
      pageId: "demo-david-west",
      title: "David West",
      description: "Basketball player - curated demo profile.",
      domain: "sports",
      demoSubjectId: "demo-david-west",
    },
    voiceProfile: {
      archetype: "the-captain",
      defaultAudience: "Arena",
      defaultMode: "Narrator",
      defaultNarrativeGoal: "honor",
      toneNote: "Calm, disciplined, team-first. Emphasize leadership and longevity.",
    },
    buildTwin: buildDavidWestTwin,
  },
  {
    id: "demo-tom-hoover",
    category: "Sports",
    bio: "Basketball player. A resilience-focused profile with a six-event arc covering breakthrough, injury, return, and mentorship.",
    matchTerms: ["tom", "hoover", "basketball", "sports", "resilience"],
    hit: {
      pageId: "demo-tom-hoover",
      title: "Tom Hoover",
      description: "Basketball player - curated demo profile.",
      domain: "sports",
      demoSubjectId: "demo-tom-hoover",
    },
    voiceProfile: {
      archetype: "the-captain",
      defaultAudience: "Peers",
      defaultMode: "Documentary",
      defaultNarrativeGoal: "explain",
      toneNote: "Direct and grounded. Frame setbacks with restraint and specificity.",
    },
    buildTwin: buildTomHooverTwin,
  },
  {
    id: "demo-walt-taylor",
    category: "Music",
    bio: "Also known as Walt Liquor. A multidisciplinary artist and music executive with a cross-medium creative arc and a seeded editorial-review moment.",
    matchTerms: ["walt", "taylor", "liquor", "artist", "music", "executive"],
    hit: {
      pageId: "demo-walt-taylor",
      title: "Walt Taylor (aka Walt Liquor)",
      description:
        "Multidisciplinary artist and music executive - curated demo profile.",
      domain: "music",
      demoSubjectId: "demo-walt-taylor",
    },
    voiceProfile: {
      archetype: "the-poet",
      defaultAudience: "Intimate",
      defaultMode: "Documentary",
      defaultNarrativeGoal: "honor",
      toneNote:
        "Reflective and precise. Connect creative work to leadership without speculating beyond approved material.",
    },
    buildTwin: buildWaltTaylorTwin,
  },
];

export function searchDemoSubjects(query: string): WikipediaSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  return DEMO_SUBJECTS.filter((subject) =>
    subject.matchTerms.some((term) => term.includes(q) || q.includes(term)),
  ).map((subject) => subject.hit);
}

export function getDemoSubjectById(id: string): DemoSubject | undefined {
  return DEMO_SUBJECTS.find((s) => s.id === id);
}

/** Single source of truth for "is this a demo profile?" across the UI. */
export function isDemoTwin(twin: Pick<DigitalTwinProfile, "wikipedia">): boolean {
  return twin.wikipedia.pageId.startsWith("demo-");
}

/** Looks up the demo metadata for a draft, if any. */
export function getDemoSubjectForTwin(
  twin: Pick<DigitalTwinProfile, "wikipedia">,
): DemoSubject | undefined {
  if (!isDemoTwin(twin)) return undefined;
  return getDemoSubjectById(twin.wikipedia.pageId);
}

/** Whether the seeded MJ twin still includes the intentional S5 guardrail flag. */
export function demoGuardrailFlagPresent(twin: DigitalTwinProfile): boolean {
  return twin.guardrailReviews.some(
    (r) =>
      r.trigger === "Private relationships" &&
      r.eventId === DEMO_CUSTOM_MOMENT_PRIVATE_ID,
  );
}
