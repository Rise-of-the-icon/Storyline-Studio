import { resolve } from "../lib/resolver";
import type { DigitalTwinProfile, TimelineEvent } from "../types/twin";
import type { Domain, ResolverInput, ResolverOutput } from "../types/resolver";

export type SceneAudience = "Arena" | "Intimate" | "Broadcast" | "Peers";

export type NarrativeGoalId =
  | "celebrate"
  | "honor"
  | "challenge"
  | "mourn"
  | "explain";

export const NARRATIVE_GOAL_OPTIONS: {
  id: NarrativeGoalId;
  label: string;
  intent: string;
}[] = [
  {
    id: "celebrate",
    label: "Celebrate",
    intent: "Celebrate the triumph and peak emotion of this moment",
  },
  {
    id: "honor",
    label: "Honor legacy",
    intent: "Honor the legacy with weight, respect, and emotional truth",
  },
  {
    id: "challenge",
    label: "Challenge",
    intent: "Channel competitive fire and prove the doubters wrong",
  },
  {
    id: "mourn",
    label: "Mourn",
    intent: "Hold space for loss, grief, and what was taken away",
  },
  {
    id: "explain",
    label: "Explain",
    intent: "Explain the context with documentary clarity and restraint",
  },
];

const ARCHETYPE_BY_AUDIENCE: Record<
  Domain,
  Record<SceneAudience, string>
> = {
  sports: {
    Arena: "the-closer",
    Intimate: "the-captain",
    Broadcast: "the-captain",
    Peers: "the-underdog",
  },
  music: {
    Arena: "the-icon",
    Intimate: "the-poet",
    Broadcast: "the-poet",
    Peers: "the-rebel",
  },
};

export interface StudioSceneSettings {
  domain: Domain;
  audience: SceneAudience;
  mode: ResolverInput["mode"];
  narrativeGoalId: NarrativeGoalId;
}

export function getNarrativeGoalText(id: NarrativeGoalId): string {
  return (
    NARRATIVE_GOAL_OPTIONS.find((o) => o.id === id)?.intent ??
    NARRATIVE_GOAL_OPTIONS[1].intent
  );
}

export function getArchetypeForScene(scene: StudioSceneSettings): string {
  return ARCHETYPE_BY_AUDIENCE[scene.domain][scene.audience];
}

export const DEFAULT_SCENE: StudioSceneSettings = {
  domain: "sports",
  audience: "Arena",
  mode: "Narrator",
  narrativeGoalId: "honor",
};

export function inferStudioDomain(draft: DigitalTwinProfile): Domain {
  const text =
    `${draft.coreIdentity.name} ${draft.wikipedia.description} ${draft.wikipedia.summary}`.toLowerCase();
  if (
    /\b(musician|singer|songwriter|album|grammy|band|orchestra|rapper)\b/.test(
      text,
    )
  ) {
    return "music";
  }
  return "sports";
}

export function buildResolverInput(
  event: TimelineEvent,
  scene: StudioSceneSettings,
): ResolverInput {
  const narrativeGoal = getNarrativeGoalText(scene.narrativeGoalId);
  const intent = `${narrativeGoal} — ${event.title}`;

  return {
    domain: scene.domain,
    archetype: getArchetypeForScene(scene),
    eventId: event.id,
    eventTitle: event.title,
    eventContext: `${event.eventType} ${event.description} ${scene.audience}`,
    emotionalSignificance: event.emotionalSignificance,
    intent,
    mode: scene.mode,
    sensitivity: event.sensitivity,
    confidence: event.confidence,
  };
}

export function runResolver(
  draft: DigitalTwinProfile,
  eventId: string | null,
  scene: StudioSceneSettings,
): ResolverOutput | null {
  if (!eventId) return null;
  const event = draft.timeline.find((e) => e.id === eventId);
  if (!event) return null;
  return resolve(buildResolverInput(event, scene));
}
