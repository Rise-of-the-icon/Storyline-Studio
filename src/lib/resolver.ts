import type { Confidence, Sensitivity } from "@/types/twin";
import type {
  Domain,
  ResolverBeat,
  ResolverInput,
  ResolverOutput,
} from "@/types/resolver";

// ---------------------------------------------------------------------------
// RESOLVER_CONFIG — calibrated heuristics (not a trained model). Tune here.
// Domain switch swaps the entire domain block (sports | music).
// ---------------------------------------------------------------------------

export interface LeafState {
  name: string;
  energy: number;
  warmth: number;
  pace: number;
  steeringTag: string;
}

export interface EmotionFamily {
  id: string;
  label: string;
  assertive: boolean;
  uplifting: boolean;
  celebratory: boolean;
  playful: boolean;
  leaves: LeafState[];
}

export interface ArchetypeConfig {
  id: string;
  label: string;
  boostFamilies: string[];
  dampFamilies: string[];
  anchorLeaf: string;
  warmthDelta: number;
  confidenceDelta: number;
}

export interface DomainResolverConfig {
  families: EmotionFamily[];
  archetypes: ArchetypeConfig[];
  eventVectors: Record<string, Partial<Record<string, number>>>;
  intentVectors: Record<string, Partial<Record<string, number>>>;
  modeDeltas: Record<
    ResolverInput["mode"],
    { families: Partial<Record<string, number>>; warmth: number; pacing: number }
  >;
  openerPool: string[];
  buildPool: string[];
  breathPeakStates: Set<string>;
}

interface SharedResolverConfig {
  confidenceModifiers: Record<
    Confidence,
    { assertiveDamp: number; confidenceDamp: number; base: number }
  >;
  sensitivityModifiers: Record<
    Sensitivity,
    { celebratoryMult: number; pacingDelta: number; intensityDamp: number }
  >;
  archetypeBoostMult: number;
  archetypeDampMult: number;
  maxTagsPerSegment: number;
  maxNonVerbalPerSegment: number;
}

export const RESOLVER_CONFIG: {
  label: string;
  shared: SharedResolverConfig;
  domains: Record<Domain, DomainResolverConfig>;
} = {
  label:
    "Transparent scoring heuristics — not a trained model. Weights are tunable.",
  shared: {
    archetypeBoostMult: 1.35,
    archetypeDampMult: 0.7,
    maxTagsPerSegment: 3,
    maxNonVerbalPerSegment: 1,
    confidenceModifiers: {
      High: { assertiveDamp: 1, confidenceDamp: 1, base: 88 },
      Medium: { assertiveDamp: 0.82, confidenceDamp: 0.9, base: 72 },
      Low: { assertiveDamp: 0.55, confidenceDamp: 0.72, base: 52 },
    },
    sensitivityModifiers: {
      Low: { celebratoryMult: 1, pacingDelta: 0, intensityDamp: 1 },
      Medium: { celebratoryMult: 0.85, pacingDelta: -4, intensityDamp: 0.92 },
      High: { celebratoryMult: 0.55, pacingDelta: -10, intensityDamp: 0.8 },
    },
  },
  domains: {
    sports: {
      families: [
        {
          id: "triumphant",
          label: "Triumphant",
          assertive: true,
          uplifting: true,
          celebratory: true,
          playful: false,
          leaves: [
            {
              name: "Championship Surge",
              energy: 92,
              warmth: 58,
              pace: 78,
              steeringTag: "arena-triumph",
            },
            {
              name: "Legacy Crown",
              energy: 85,
              warmth: 62,
              pace: 70,
              steeringTag: "legacy-gold",
            },
          ],
        },
        {
          id: "competitive",
          label: "Competitive",
          assertive: true,
          uplifting: true,
          celebratory: false,
          playful: false,
          leaves: [
            {
              name: "Clutch Pressure",
              energy: 78,
              warmth: 42,
              pace: 82,
              steeringTag: "game-on",
            },
            {
              name: "Rival Edge",
              energy: 74,
              warmth: 38,
              pace: 76,
              steeringTag: "rival-fire",
            },
          ],
        },
        {
          id: "reflective",
          label: "Reflective",
          assertive: false,
          uplifting: false,
          celebratory: false,
          playful: false,
          leaves: [
            {
              name: "Quiet Locker Room",
              energy: 48,
              warmth: 68,
              pace: 42,
              steeringTag: "intimate-reflect",
            },
            {
              name: "Film Room",
              energy: 52,
              warmth: 55,
              pace: 48,
              steeringTag: "analytic-calm",
            },
          ],
        },
        {
          id: "somber",
          label: "Somber",
          assertive: false,
          uplifting: false,
          celebratory: false,
          playful: false,
          leaves: [
            {
              name: "Injury Weight",
              energy: 38,
              warmth: 52,
              pace: 36,
              steeringTag: "gravitas-slow",
            },
            {
              name: "What Might Have Been",
              energy: 42,
              warmth: 58,
              pace: 40,
              steeringTag: "regret-hush",
            },
          ],
        },
        {
          id: "documentary",
          label: "Documentary",
          assertive: false,
          uplifting: false,
          celebratory: false,
          playful: false,
          leaves: [
            {
              name: "Broadcast Neutral",
              energy: 55,
              warmth: 50,
              pace: 52,
              steeringTag: "doc-neutral",
            },
            {
              name: "Archival Narration",
              energy: 50,
              warmth: 48,
              pace: 46,
              steeringTag: "archive-voice",
            },
          ],
        },
      ],
      archetypes: [
        {
          id: "the-closer",
          label: "The Closer",
          boostFamilies: ["triumphant", "competitive"],
          dampFamilies: ["somber", "reflective"],
          anchorLeaf: "Clutch Pressure",
          warmthDelta: -6,
          confidenceDelta: 14,
        },
        {
          id: "the-underdog",
          label: "The Underdog",
          boostFamilies: ["competitive", "reflective"],
          dampFamilies: ["triumphant"],
          anchorLeaf: "Rival Edge",
          warmthDelta: 8,
          confidenceDelta: 4,
        },
        {
          id: "the-captain",
          label: "The Captain",
          boostFamilies: ["reflective", "documentary"],
          dampFamilies: ["competitive"],
          anchorLeaf: "Quiet Locker Room",
          warmthDelta: 12,
          confidenceDelta: 6,
        },
      ],
      eventVectors: {
        achievement: {
          triumphant: 4,
          competitive: 2,
          reflective: 1,
        },
        hardship: { somber: 5, reflective: 2, competitive: 1 },
        controversy: { somber: 3, documentary: 2, reflective: 2 },
        legacy: { triumphant: 3, reflective: 3, documentary: 2 },
        neutral: { documentary: 3, reflective: 2 },
      },
      intentVectors: {
        celebrate: { triumphant: 5, competitive: 2 },
        honor: { reflective: 4, triumphant: 2, documentary: 2 },
        challenge: { competitive: 5, triumphant: 1 },
        mourn: { somber: 5, reflective: 2 },
        explain: { documentary: 5, reflective: 2 },
        neutral: { documentary: 2, reflective: 2 },
      },
      modeDeltas: {
        Narrator: {
          families: { documentary: 2, reflective: 1 },
          warmth: 4,
          pacing: -2,
        },
        "Q&A": {
          families: { documentary: 3, competitive: 1 },
          warmth: 0,
          pacing: 4,
        },
        Documentary: {
          families: { documentary: 4, reflective: 2 },
          warmth: 2,
          pacing: -6,
        },
      },
      openerPool: ["OPEN", "SET"],
      buildPool: ["BUILD", "RISE"],
      breathPeakStates: new Set([
        "Championship Surge",
        "Legacy Crown",
        "Clutch Pressure",
      ]),
    },
    music: {
      families: [
        {
          id: "anthemic",
          label: "Anthemic",
          assertive: true,
          uplifting: true,
          celebratory: true,
          playful: false,
          leaves: [
            {
              name: "Stadium Anthem",
              energy: 90,
              warmth: 55,
              pace: 80,
              steeringTag: "crowd-lift",
            },
            {
              name: "Prophetic Chorus",
              energy: 86,
              warmth: 60,
              pace: 74,
              steeringTag: "prophetic-rise",
            },
          ],
        },
        {
          id: "soulful",
          label: "Soulful",
          assertive: false,
          uplifting: true,
          celebratory: false,
          playful: false,
          leaves: [
            {
              name: "Velvet Confession",
              energy: 62,
              warmth: 82,
              pace: 48,
              steeringTag: "soul-intimate",
            },
            {
              name: "Late-Night Groove",
              energy: 58,
              warmth: 78,
              pace: 52,
              steeringTag: "groove-warm",
            },
          ],
        },
        {
          id: "raw",
          label: "Raw",
          assertive: true,
          uplifting: false,
          celebratory: false,
          playful: false,
          leaves: [
            {
              name: "Unplugged Grit",
              energy: 72,
              warmth: 45,
              pace: 64,
              steeringTag: "raw-edge",
            },
            {
              name: "Breakdown Take",
              energy: 68,
              warmth: 42,
              pace: 58,
              steeringTag: "breakdown-honest",
            },
          ],
        },
        {
          id: "ethereal",
          label: "Ethereal",
          assertive: false,
          uplifting: false,
          celebratory: false,
          playful: true,
          leaves: [
            {
              name: "Dream Sequence",
              energy: 44,
              warmth: 64,
              pace: 38,
              steeringTag: "ethereal-float",
            },
            {
              name: "Studio Halo",
              energy: 48,
              warmth: 58,
              pace: 42,
              steeringTag: "halo-soft",
            },
          ],
        },
        {
          id: "melancholic",
          label: "Melancholic",
          assertive: false,
          uplifting: false,
          celebratory: false,
          playful: false,
          leaves: [
            {
              name: "Minor Key Farewell",
              energy: 36,
              warmth: 54,
              pace: 34,
              steeringTag: "minor-fade",
            },
            {
              name: "Empty Venue",
              energy: 40,
              warmth: 50,
              pace: 36,
              steeringTag: "venue-echo",
            },
          ],
        },
        {
          id: "celebratory",
          label: "Celebratory",
          assertive: true,
          uplifting: true,
          celebratory: true,
          playful: true,
          leaves: [
            {
              name: "Afterparty Spark",
              energy: 84,
              warmth: 70,
              pace: 86,
              steeringTag: "party-bright",
            },
            {
              name: "Chart Peak",
              energy: 80,
              warmth: 66,
              pace: 82,
              steeringTag: "chart-pop",
            },
          ],
        },
      ],
      archetypes: [
        {
          id: "the-icon",
          label: "The Icon",
          boostFamilies: ["anthemic", "celebratory"],
          dampFamilies: ["melancholic", "raw"],
          anchorLeaf: "Stadium Anthem",
          warmthDelta: 6,
          confidenceDelta: 16,
        },
        {
          id: "the-poet",
          label: "The Poet",
          boostFamilies: ["soulful", "ethereal"],
          dampFamilies: ["celebratory", "anthemic"],
          anchorLeaf: "Velvet Confession",
          warmthDelta: 14,
          confidenceDelta: 2,
        },
        {
          id: "the-rebel",
          label: "The Rebel",
          boostFamilies: ["raw", "melancholic"],
          dampFamilies: ["anthemic", "celebratory"],
          anchorLeaf: "Unplugged Grit",
          warmthDelta: -4,
          confidenceDelta: 8,
        },
      ],
      eventVectors: {
        achievement: { anthemic: 4, celebratory: 3, soulful: 1 },
        hardship: { melancholic: 5, raw: 2, soulful: 2 },
        controversy: { raw: 3, melancholic: 2, ethereal: 1 },
        legacy: { anthemic: 3, soulful: 3, ethereal: 1 },
        neutral: { ethereal: 2, soulful: 2 },
      },
      intentVectors: {
        celebrate: { celebratory: 5, anthemic: 3 },
        honor: { soulful: 5, anthemic: 2 },
        challenge: { raw: 5, anthemic: 1 },
        mourn: { melancholic: 5, soulful: 2 },
        explain: { ethereal: 3, soulful: 2 },
        neutral: { ethereal: 2, soulful: 2 },
      },
      modeDeltas: {
        Narrator: {
          families: { soulful: 2, ethereal: 1 },
          warmth: 6,
          pacing: -2,
        },
        "Q&A": {
          families: { soulful: 1, raw: 2 },
          warmth: 2,
          pacing: 6,
        },
        Documentary: {
          families: { ethereal: 3, melancholic: 1 },
          warmth: 0,
          pacing: -8,
        },
      },
      openerPool: ["OPEN", "INTRO"],
      buildPool: ["BUILD", "LIFT"],
      breathPeakStates: new Set([
        "Stadium Anthem",
        "Prophetic Chorus",
        "Afterparty Spark",
      ]),
    },
  },
};

// ---------------------------------------------------------------------------
// Pure resolver
// ---------------------------------------------------------------------------

type FamilyScores = Record<string, number>;

const INTENT_KEYWORDS: Record<string, RegExp[]> = {
  celebrate: [/celebrat/i, /triumph/i, /win/i, /victory/i, /peak/i],
  honor: [/honor/i, /tribut/i, /respect/i, /legacy/i],
  challenge: [/challenge/i, /rival/i, /prove/i, /fight/i],
  mourn: [/loss/i, /mourn/i, /injur/i, /hardship/i, /setback/i],
  explain: [/explain/i, /document/i, /context/i, /breakdown/i],
};

const EVENT_KEYWORDS: Record<string, RegExp[]> = {
  achievement: [/champion/i, /award/i, /finals?\b/i, /record/i, /debut/i],
  hardship: [
    /injur/i,
    /loss/i,
    /retire/i,
    /failed/i,
    /setback/i,
    /career-ending/i,
    /hardship/i,
  ],
  controversy: [/scandal/i, /controvers/i, /suspend/i, /cancellation/i],
  legacy: [/legacy/i, /hall of fame/i],
};

/** Event tone from context first (hardship/controversy win over celebratory intent). */
const EVENT_CLASSIFY_ORDER = [
  "hardship",
  "controversy",
  "achievement",
  "legacy",
] as const;

function clamp0to100(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

function classifyByKeywords(
  text: string,
  table: Record<string, RegExp[]>,
  fallback: string,
): string {
  const lower = text.toLowerCase();
  for (const [key, patterns] of Object.entries(table)) {
    if (patterns.some((re) => re.test(lower))) return key;
  }
  return fallback;
}

function classifyEventKey(input: ResolverInput): string {
  const context = (input.eventContext ?? "").toLowerCase();
  if (context.length > 0) {
    for (const key of EVENT_CLASSIFY_ORDER) {
      const patterns = EVENT_KEYWORDS[key];
      if (patterns.some((re) => re.test(context))) return key;
    }
  }
  return classifyByKeywords(input.intent, EVENT_KEYWORDS, "neutral");
}

function applyConflictDampening(
  scores: FamilyScores,
  families: EmotionFamily[],
  intentKey: string,
  eventKey: string,
  sensitivity: Sensitivity,
): void {
  const somberEvent =
    eventKey === "hardship" || eventKey === "controversy";
  if (intentKey === "celebrate" && somberEvent && sensitivity === "High") {
    for (const family of families) {
      if (family.celebratory || family.uplifting) {
        scores[family.id] *= 0.2;
      }
    }
  }
}

function initScores(families: EmotionFamily[]): FamilyScores {
  return Object.fromEntries(families.map((f) => [f.id, 0]));
}

function addVector(
  scores: FamilyScores,
  vector: Partial<Record<string, number>> | undefined,
): void {
  if (!vector) return;
  for (const [familyId, points] of Object.entries(vector)) {
    if (scores[familyId] !== undefined && points !== undefined) {
      scores[familyId] += points;
    }
  }
}

function findArchetype(
  config: DomainResolverConfig,
  archetypeId: string,
): ArchetypeConfig {
  const normalized = archetypeId.toLowerCase().trim();
  return (
    config.archetypes.find(
      (a) =>
        a.id === normalized ||
        a.label.toLowerCase() === normalized ||
        normalized.includes(a.id),
    ) ?? config.archetypes[0]
  );
}

function findFamily(
  config: DomainResolverConfig,
  familyId: string,
): EmotionFamily {
  return (
    config.families.find((f) => f.id === familyId) ?? config.families[0]
  );
}

function applyArchetypeAnchor(
  scores: FamilyScores,
  archetype: ArchetypeConfig,
  shared: SharedResolverConfig,
): void {
  for (const id of archetype.boostFamilies) {
    if (scores[id] !== undefined) {
      scores[id] *= shared.archetypeBoostMult;
    }
  }
  for (const id of archetype.dampFamilies) {
    if (scores[id] !== undefined) {
      scores[id] *= shared.archetypeDampMult;
    }
  }
}

function applyConfidenceSensitivity(
  scores: FamilyScores,
  families: EmotionFamily[],
  confidence: Confidence,
  sensitivity: Sensitivity,
  shared: SharedResolverConfig,
): void {
  const conf = shared.confidenceModifiers[confidence];
  const sens = shared.sensitivityModifiers[sensitivity];

  for (const family of families) {
    const id = family.id;
    if (scores[id] === undefined) continue;
    if (family.assertive || family.uplifting) {
      scores[id] *= conf.assertiveDamp;
    }
    if (family.celebratory || family.playful) {
      scores[id] *= sens.celebratoryMult;
    }
  }
}

function argmaxFamily(scores: FamilyScores): string {
  let bestId = Object.keys(scores)[0];
  let best = scores[bestId] ?? 0;
  for (const [id, score] of Object.entries(scores)) {
    if (score > best) {
      best = score;
      bestId = id;
    }
  }
  return bestId;
}

function intentEnergy(intentKey: string): number {
  const map: Record<string, number> = {
    celebrate: 82,
    honor: 58,
    challenge: 74,
    mourn: 32,
    explain: 50,
    neutral: 55,
  };
  return map[intentKey] ?? 55;
}

function selectLeaf(
  family: EmotionFamily,
  archetype: ArchetypeConfig,
  intentKey: string,
): LeafState {
  const anchored = family.leaves.find((l) => l.name === archetype.anchorLeaf);
  if (anchored && family.leaves.some((l) => l.name === archetype.anchorLeaf)) {
    return anchored;
  }
  const targetEnergy = intentEnergy(intentKey);
  return family.leaves.reduce((best, leaf) => {
    const bestDelta = Math.abs(best.energy - targetEnergy);
    const leafDelta = Math.abs(leaf.energy - targetEnergy);
    return leafDelta < bestDelta ? leaf : best;
  });
}

function buildArc(
  signature: LeafState,
  config: DomainResolverConfig,
): { direction: ResolverOutput["direction"]; beats: ResolverBeat[] } {
  const energy = signature.energy;
  let direction: ResolverOutput["direction"];
  let intensities: [number, number, number];

  if (energy >= 60) {
    direction = "ascending";
    intensities = [45, 72, 100];
  } else if (energy <= 40) {
    direction = "settle";
    intensities = [100, 88, 76];
  } else {
    direction = "steady";
    intensities = [70, 75, 80];
  }

  const roles = [
    config.openerPool[0] ?? "OPEN",
    config.buildPool[0] ?? "BUILD",
    "PEAK",
  ];
  const needsBreath = config.breathPeakStates.has(signature.name);

  const openState =
    direction === "settle"
      ? config.families.flatMap((f) => f.leaves).find((l) => l.energy <= 55)
          ?.name ?? signature.name
      : signature.name;

  const buildState = signature.name;

  const beats: ResolverBeat[] = [
    {
      role: roles[0],
      state: openState,
      steeringTag: signature.steeringTag,
      intensity: clamp0to100(intensities[0]),
    },
    {
      role: roles[1],
      state: buildState,
      steeringTag: signature.steeringTag,
      intensity: clamp0to100(intensities[1]),
    },
  ];

  if (needsBreath) {
    beats.push({
      role: "BREATHE",
      state: "[breathe]",
      steeringTag: "transition-pause",
      intensity: clamp0to100(Math.round((intensities[1] + intensities[2]) / 2)),
    });
  }

  beats.push({
    role: roles[2],
    state: signature.name,
    steeringTag: signature.steeringTag,
    intensity: clamp0to100(intensities[2]),
  });

  return { direction, beats };
}

function validateBeats(beats: ResolverBeat[]): string[] {
  const warnings: string[] = [];
  for (const beat of beats) {
    const tagCount = beat.steeringTag.split(/[\s,]+/).filter(Boolean).length;
    if (tagCount > RESOLVER_CONFIG.shared.maxTagsPerSegment) {
      warnings.push(
        `Beat "${beat.role}" exceeds max steering tags per segment.`,
      );
    }
    if (beat.state === "[breathe]") {
      const nonVerbal = beats.filter((b) => b.state.startsWith("[")).length;
      if (nonVerbal > RESOLVER_CONFIG.shared.maxNonVerbalPerSegment) {
        warnings.push("Multiple non-verbal transitions in one arc.");
      }
    }
  }
  return warnings;
}

function buildGuardrailWarnings(
  input: ResolverInput,
  family: EmotionFamily,
  intensity: number,
  intentKey: string,
  eventKey: string,
): string[] {
  const warnings: string[] = [];

  if (
    input.sensitivity === "High" &&
    family.uplifting &&
    (family.celebratory || family.assertive)
  ) {
    warnings.push(
      "High sensitivity with an uplifting family — flag for editorial review.",
    );
  }

  if (input.confidence === "Low" && intensity > 65) {
    warnings.push("Low source confidence with peak intensity — temper or verify.");
  }

  if (
    (intentKey === "mourn" ||
      eventKey === "hardship" ||
      eventKey === "controversy") &&
    intensity > 60
  ) {
    warnings.push("Hardship/controversy context with elevated intensity — review for tone.");
  }

  if (input.confidence === "Low" && family.assertive) {
    warnings.push("Low confidence with assertive winner — verify before performance.");
  }

  return warnings;
}

function inferEventSignificance(intent: string, intentKey: string): number {
  if (/legendary|defining|greatest|iconic/i.test(intent)) return 88;
  if (/minor|small|brief/i.test(intent)) return 28;
  const base: Record<string, number> = {
    celebrate: 78,
    honor: 65,
    challenge: 70,
    mourn: 55,
    explain: 45,
    neutral: 50,
  };
  return base[intentKey] ?? 50;
}

function buildReason(
  input: ResolverInput,
  archetype: ArchetypeConfig,
  family: EmotionFamily,
  signature: LeafState,
  direction: ResolverOutput["direction"],
  eventLabel: string,
): string {
  const directionPhrase =
    direction === "ascending"
      ? "triumphant, ascending delivery"
      : direction === "settle"
        ? "measured, settling delivery"
        : "steady, controlled delivery";

  return [
    `Anchored on ${eventLabel} and voiced through ${archetype.label}'s register,`,
    `the resolver lands in ${family.label.toLowerCase()} — ${signature.name} —`,
    `a ${directionPhrase} (${input.mode} mode, ${input.domain}).`,
  ].join(" ");
}

function eventLabelFromInput(input: ResolverInput): string {
  if (input.eventTitle?.trim()) return `"${input.eventTitle.trim()}"`;
  if (input.intent.trim().length > 12) {
    const snippet = input.intent.trim().slice(0, 80);
    return snippet.endsWith(".") ? snippet : `${snippet}`;
  }
  return `the selected moment (${input.eventId.slice(0, 8)}…)`;
}

export function resolve(input: ResolverInput): ResolverOutput {
  const domainConfig = RESOLVER_CONFIG.domains[input.domain];
  const shared = RESOLVER_CONFIG.shared;

  const intentKey = classifyByKeywords(
    input.intent,
    INTENT_KEYWORDS,
    "neutral",
  );
  const eventKey = classifyEventKey(input);

  const scores = initScores(domainConfig.families);
  addVector(scores, domainConfig.eventVectors[eventKey]);
  addVector(scores, domainConfig.intentVectors[intentKey]);
  addVector(scores, domainConfig.modeDeltas[input.mode].families);

  const archetype = findArchetype(domainConfig, input.archetype);
  applyArchetypeAnchor(scores, archetype, shared);
  applyConfidenceSensitivity(
    scores,
    domainConfig.families,
    input.confidence,
    input.sensitivity,
    shared,
  );
  applyConflictDampening(
    scores,
    domainConfig.families,
    intentKey,
    eventKey,
    input.sensitivity,
  );

  const winningFamilyId = argmaxFamily(scores);
  const family = findFamily(domainConfig, winningFamilyId);
  const signature = selectLeaf(family, archetype, intentKey);

  const { direction, beats } = buildArc(signature, domainConfig);
  const validationWarnings = validateBeats(beats);

  const confMod = shared.confidenceModifiers[input.confidence];
  const sensMod = shared.sensitivityModifiers[input.sensitivity];
  const modeMod = domainConfig.modeDeltas[input.mode];
  const significance =
    input.emotionalSignificance ??
    inferEventSignificance(input.intent, intentKey);

  const intensity = clamp0to100(
    (significance * 0.35 +
      signature.energy * 0.5 +
      intentEnergy(intentKey) * 0.15) *
      sensMod.intensityDamp *
      confMod.confidenceDamp,
  );

  const warmth = clamp0to100(
    signature.warmth +
      archetype.warmthDelta +
      modeMod.warmth,
  );

  const pacing = clamp0to100(
    signature.pace + sensMod.pacingDelta + modeMod.pacing,
  );

  let confidence = clamp0to100(
    confMod.base * 0.65 + signature.energy * 0.15 + archetype.confidenceDelta + 12,
  );
  if (input.confidence === "Low") {
    confidence = Math.min(confidence, 68);
  }

  const guardrailWarnings = [
    ...buildGuardrailWarnings(
      input,
      family,
      intensity,
      intentKey,
      eventKey,
    ),
    ...validationWarnings,
  ];

  const label = eventLabelFromInput(input);

  return {
    domain: input.domain,
    winningFamily: family.label,
    signatureState: signature.name,
    direction,
    beats,
    intensity,
    warmth,
    pacing,
    confidence,
    reason: buildReason(input, archetype, family, signature, direction, label),
    guardrailWarnings,
  };
}
