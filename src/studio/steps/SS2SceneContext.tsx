import { SegControl } from "../../components/SegControl";
import { useStudio } from "../../context/StudioContext";
import {
  getArchetypeForScene,
  NARRATIVE_GOAL_OPTIONS,
  type NarrativeGoalId,
  type SceneAudience,
} from "../studioResolver";
import type { ResolverInput } from "../../types/resolver";

const AUDIENCE_OPTIONS: SceneAudience[] = [
  "Arena",
  "Intimate",
  "Broadcast",
  "Peers",
];

const MODE_OPTIONS: ResolverInput["mode"][] = [
  "Narrator",
  "Q&A",
  "Documentary",
];

export function SS2SceneContext() {
  const { scene, setScene, selectedEventId, resolverOutput } = useStudio();

  const patchScene = (partial: Partial<typeof scene>) => {
    setScene((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div>
      <h2 className="font-display text-2xl text-text">Scene context</h2>
      <p className="mt-2 font-body text-sm text-textsub">
        Shape how the moment is voiced. Changes re-run the resolver live.
      </p>

      {!selectedEventId && (
        <p
          className="mt-4 rounded-md border border-gold/30 bg-goldfaint px-3 py-2 font-body text-sm text-gold"
          role="status"
        >
          Select an event on the Event step first — the resolver needs an
          anchoring moment.
        </p>
      )}

      <div className="mt-6 space-y-6">
        <SegControl<SceneAudience>
          label="Audience"
          value={scene.audience}
          onChange={(audience) => patchScene({ audience })}
          options={AUDIENCE_OPTIONS.map((a) => ({ value: a, label: a }))}
        />

        <SegControl<ResolverInput["mode"]>
          label="Conversation mode"
          value={scene.mode}
          onChange={(mode) => patchScene({ mode })}
          options={MODE_OPTIONS.map((m) => ({ value: m, label: m }))}
        />

        <SegControl<NarrativeGoalId>
          label="Narrative goal"
          value={scene.narrativeGoalId}
          onChange={(narrativeGoalId) => patchScene({ narrativeGoalId })}
          options={NARRATIVE_GOAL_OPTIONS.map((g) => ({
            value: g.id,
            label: g.label,
          }))}
        />
      </div>

      <p className="mt-6 font-mono text-xs text-textmuted">
        Voice register:{" "}
        <span className="text-textsub">{getArchetypeForScene(scene)}</span>
        {" · "}
        domain {scene.domain}
      </p>

      {selectedEventId && resolverOutput && (
        <p className="mt-2 font-body text-xs text-textsub" aria-live="polite">
          Live preview: {resolverOutput.signatureState} ({resolverOutput.winningFamily})
        </p>
      )}
    </div>
  );
}
