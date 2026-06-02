import { SegControl } from "../../components/SegControl";
import { useStudio } from "../../context/StudioContext";
import {
  getArchetypeForScene,
  NARRATIVE_GOAL_OPTIONS,
  type NarrativeGoalId,
  type SceneAudience,
} from "../studioResolver";
import type { ResolverInput } from "../../types/resolver";
import { InfoTip } from "../InfoTip";
import {
  AUDIENCE_DESCRIPTION,
  AUDIENCE_LABEL,
  BROADCAST_NEUTRAL_DESCRIPTION,
  BROADCAST_NEUTRAL_LABEL,
  CONVERSATION_MODE_DESCRIPTION,
  CONVERSATION_MODE_LABEL,
  NARRATIVE_GOAL_DESCRIPTION,
  NARRATIVE_GOAL_LABEL,
  SCENE_CONTEXT_DESCRIPTION,
  SCENE_CONTEXT_LABEL,
  VOICE_REGISTER_DESCRIPTION,
  VOICE_REGISTER_LABEL,
} from "../studioCopy";

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
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl text-text">Scene context</h2>
        <InfoTip
          label={SCENE_CONTEXT_LABEL}
          description={SCENE_CONTEXT_DESCRIPTION}
        />
      </div>
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
          labelTrailing={
            <InfoTip label={AUDIENCE_LABEL} description={AUDIENCE_DESCRIPTION} />
          }
          helper={
            <>
              Who the subject is speaking to. Arena projects to a crowd;
              Intimate sits close-mic; Broadcast holds a camera-ready frame
              (see{" "}
              <span className="inline-flex items-baseline gap-1">
                <span className="font-mono text-textmuted">
                  {BROADCAST_NEUTRAL_LABEL}
                </span>
                <InfoTip
                  label={BROADCAST_NEUTRAL_LABEL}
                  description={BROADCAST_NEUTRAL_DESCRIPTION}
                />
              </span>
              ); Peers is conversational with equals.
            </>
          }
        />

        <SegControl<ResolverInput["mode"]>
          label="Conversation mode"
          value={scene.mode}
          onChange={(mode) => patchScene({ mode })}
          options={MODE_OPTIONS.map((m) => ({ value: m, label: m }))}
          labelTrailing={
            <InfoTip
              label={CONVERSATION_MODE_LABEL}
              description={CONVERSATION_MODE_DESCRIPTION}
            />
          }
          helper="The speaking register the moment is delivered in: Narrator (third-person framing), Q&A (first-person response), or Documentary (reflective recall)."
        />

        <SegControl<NarrativeGoalId>
          label="Narrative goal"
          value={scene.narrativeGoalId}
          onChange={(narrativeGoalId) => patchScene({ narrativeGoalId })}
          options={NARRATIVE_GOAL_OPTIONS.map((g) => ({
            value: g.id,
            label: g.label,
          }))}
          labelTrailing={
            <InfoTip
              label={NARRATIVE_GOAL_LABEL}
              description={NARRATIVE_GOAL_DESCRIPTION}
            />
          }
          helper="What the producer wants the moment to communicate. Steers the resolver toward celebration, honoring, challenge, mourning, or calm explanation."
        />
      </div>

      <p className="mt-6 flex flex-wrap items-center gap-1.5 font-mono text-xs text-textmuted">
        <span>Voice register:</span>
        <span className="text-textsub">{getArchetypeForScene(scene)}</span>
        <InfoTip
          label={VOICE_REGISTER_LABEL}
          description={VOICE_REGISTER_DESCRIPTION}
        />
        <span>· domain {scene.domain}</span>
      </p>

      {selectedEventId && resolverOutput && (
        <p className="mt-2 font-body text-xs text-textsub" aria-live="polite">
          Live preview: {resolverOutput.signatureState} ({resolverOutput.winningFamily})
        </p>
      )}
    </div>
  );
}
