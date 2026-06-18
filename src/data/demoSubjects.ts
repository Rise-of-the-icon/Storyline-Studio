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
  const bdlUrl = url.includes("Tom_Hoover")
    ? "https://www.basketball-reference.com/players/h/hooveto01.html"
    : url.includes("David_West")
      ? "https://www.basketball-reference.com/players/w/westda01.html"
      : null;
  return {
    // `demo` is the V2 canonical source type for curated fixture content;
    // it surfaces as a separate "Demo seed" badge so a viewer never confuses
    // it with a real Wikipedia import.
    type: "demo",
    url,
    citation: "Verified source-backed demo seed",
    notes: bdlUrl
      ? `Curated fixture grounded in the linked Wikipedia source and BDL/Basketball-Reference cross-check: ${bdlUrl}.`
      : "Curated fixture grounded in the linked source; not from a live Wikipedia fetch.",
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

const DAVID_WEST_URL = "https://en.wikipedia.org/wiki/David_West_(basketball)";
const DAVID_WEST_TIMELINE: TimelineEvent[] = [
  event(DAVID_WEST_URL, {
    id: "evt-david-west-foundations",
    title: "Plays high school basketball in North Carolina and Virginia",
    description:
      "David West attends Garner Magnet High School in North Carolina and Hargrave Military Academy in Virginia before entering Xavier as a frontcourt prospect.",
    year: 1998,
    eventType: "Education",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 45,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-college",
    title: "Becomes a three-time Atlantic 10 Player of the Year",
    description:
      "At Xavier, West becomes the first three-time Atlantic 10 Player of the Year and finishes as one of the program's 2,000-point, 1,000-rebound players.",
    year: 2003,
    eventType: "Award",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 68,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-draft",
    title: "Drafted by New Orleans",
    description:
      "The New Orleans Hornets select West with the 18th overall pick in the 2003 NBA draft, beginning a 15-season NBA career.",
    year: 2003,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 72,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-all-star",
    title: "Earns back-to-back NBA All-Star selections",
    description:
      "West is selected as an NBA All-Star in 2008 and again in 2009 while playing for the New Orleans Hornets.",
    year: 2008,
    eventType: "Award",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 82,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-veteran",
    title: "Joins San Antonio as a veteran free agent",
    description:
      "After four seasons with Indiana, West signs with the San Antonio Spurs in 2015, adding veteran frontcourt depth to a title contender.",
    year: 2015,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 70,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-championship",
    title: "Wins first NBA championship with Golden State",
    description:
      "West joins the Golden State Warriors in 2016 and wins his first NBA championship with the team in 2017.",
    year: 2017,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 88,
  }),
  event(DAVID_WEST_URL, {
    id: "evt-david-west-retirement",
    title: "Retires after a second Warriors championship",
    description:
      "After Golden State wins the 2018 NBA Finals, West retires from the NBA following 15 seasons, two championships, and two All-Star selections.",
    year: 2018,
    eventType: "Legacy",
    confidence: "High",
    approvalStatus: "Reviewed",
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

const TOM_HOOVER_URL = "https://en.wikipedia.org/wiki/Tom_Hoover_(basketball)";
const TOM_HOOVER_TIMELINE: TimelineEvent[] = [
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-villanova",
    title: "Plays college basketball at Villanova",
    description:
      "Tom Hoover, a 6-foot-9 forward/center from Washington, D.C., plays college basketball for Villanova from 1960 to 1962.",
    year: 1960,
    eventType: "Education",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 42,
  }),
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-draft",
    title: "Selected sixth in the 1963 NBA draft",
    description:
      "Hoover is selected in the first round of the 1963 NBA draft with the sixth overall pick by the Syracuse Nationals.",
    year: 1963,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 75,
  }),
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-pro",
    title: "Plays for the New York Knicks",
    description:
      "Hoover begins his NBA career with the New York Knicks, appearing in 59 games in 1963-64 and averaging 4.8 points and 5.6 rebounds.",
    year: 1963,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 70,
  }),
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-epbl",
    title: "Wins EPBL titles with Wilmington",
    description:
      "Hoover plays for the Wilmington Blue Bombers and wins Eastern Professional Basketball League championships in 1966 and 1967.",
    year: 1966,
    eventType: "Achievement",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 84,
  }),
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-aba",
    title: "Moves into the ABA",
    description:
      "Hoover joins the American Basketball Association, playing for the Denver Rockets, Houston Mavericks, Minnesota Pipers, and New York Nets.",
    year: 1967,
    eventType: "Career",
    confidence: "High",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    emotionalSignificance: 74,
  }),
  event(TOM_HOOVER_URL, {
    id: "evt-tom-hoover-after-basketball",
    title: "Builds a wide-ranging post-basketball career",
    description:
      "After basketball, Hoover works with a teen employment program, moves into entertainment as a road manager, works in boxing with the New York State Athletic Commission, and helps run an Adopt-A-School program.",
    year: 1970,
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
    "Former NBA and ABA basketball player - verified demo profile",
    "Verified demo profile for Tom Hoover, a former NBA and ABA forward/center whose public record covers Villanova, the Knicks, EPBL titles, the ABA, and a wide-ranging post-basketball career.",
    TOM_HOOVER_TIMELINE,
    [
      {
        id: "cm-tom-hoover-self-voice-story",
        title: "Self-provided voice training recording",
        description:
          "Tom Hoover provided a voice training recording for this profile. The transcribed recording contains calibration passages for voice capture rather than a biographical interview, so it is used as a verified tone source, not as a public story source.",
        emotionalSignificance:
          "First-person source material from the subject for voice/tone grounding.",
        visibility: "Internal",
        sensitivity: "Low",
        sourceNotes:
          "Local source: /data/TomHoover/Tom Hoover Voice Training Recording.mp4 and cleaned reference audio files.",
        source: makeProducerSource({
          sourceNotes:
            "Self-provided Tom Hoover voice training recording; transcribed locally with OpenAI on 2026-06-18. Transcript contains voice calibration passages, not a biographical story interview.",
          verified: true,
        }),
      },
    ],
  );
}

const WALT_LIQUOR_SOURCE_URL = "internal://data/WaltLiquor/Walt Liquor Narrative Story.docx";
const WALT_LIQUOR_TRAILER_URL = "https://www.youtube.com/watch?v=VUQTNah_6MM";
const WALT_LIQUOR_IMPORTED_AT_ISO = "2026-06-10T00:00:00.000Z";
const WALT_TAYLOR_TIMELINE: TimelineEvent[] = [
  {
    id: "walt-liquor-fake-it-till-you-make-it-2020",
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
      url: WALT_LIQUOR_TRAILER_URL,
      citation: "Producer-provided Walt Liquor narrative story",
      notes: `Local source: ${WALT_LIQUOR_SOURCE_URL}; supporting media: All The Queen's Men S5 trailer.`,
      verified: true,
      importedAtISO: WALT_LIQUOR_IMPORTED_AT_ISO,
    },
    confidence: "Medium",
    approvalStatus: "Reviewed",
    sensitivity: "Low",
    visibility: "Internal",
    emotionalSignificance: 88,
  },
];

const WALT_TAYLOR_CUSTOM_MOMENTS: CustomMoment[] = [];

export function buildWaltTaylorTwin(): DigitalTwinProfile {
  return buildDemoProfile(
    "demo-walt-taylor",
    "Walt Liquor",
    "Bay Area music artist and executive - producer-verified demo profile",
    "Producer-verified demo profile for Walt Liquor, centered on a December 2020 career-defining music-supervision moment for All The Queen's Men.",
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
    bio: "Bay Area music artist and executive with a producer-verified All The Queen's Men music-supervision moment.",
    matchTerms: ["walt", "taylor", "liquor", "artist", "music", "executive"],
    hit: {
      pageId: "demo-walt-taylor",
      title: "Walt Liquor",
      description:
        "Bay Area music artist and executive - producer-verified demo profile.",
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
