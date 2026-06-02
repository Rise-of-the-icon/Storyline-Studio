import { useMemo, useState } from "react";
import { AudioPreview } from "@/shared/ui/AudioPreview";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ParamBar } from "@/shared/ui/ParamBar";
import { useStudio } from "@/features/studio/StudioContext";
import { useTwin } from "@/app/providers/TwinContext";
import type { DigitalTwinProfile, TimelineEvent } from "@/types/twin";
import type { ResolverOutput } from "@/types/resolver";
import { NARRATIVE_GOAL_OPTIONS } from "./studioResolver";
import { InfoTip } from "./InfoTip";
import {
  ANCHORING_EVENT_DESCRIPTION,
  ANCHORING_EVENT_LABEL,
  AUDIENCE_DESCRIPTION,
  AUDIENCE_LABEL,
  CONFIDENCE_DESCRIPTION,
  CONFIDENCE_LABEL,
  CONVERSATION_MODE_DESCRIPTION,
  CONVERSATION_MODE_LABEL,
  EMOTIONAL_STATE_DESCRIPTION,
  EMOTIONAL_STATE_LABEL,
  INTENSITY_DESCRIPTION,
  INTENSITY_LABEL,
  NARRATIVE_GOAL_DESCRIPTION,
  NARRATIVE_GOAL_LABEL,
  PACING_DESCRIPTION,
  PACING_LABEL,
  STEERING_TAG_DESCRIPTION,
  STEERING_TAG_LABEL,
  VOICE_CONTEXT_PREVIEW_DESCRIPTION,
  VOICE_CONTEXT_PREVIEW_LABEL,
  WARMTH_DESCRIPTION,
  WARMTH_LABEL,
} from "./studioCopy";
import {
  appendSavedVoiceContext,
  badgeVariantForVoiceStatus,
  buildExportSummary,
  buildSampleScript,
  captureVoiceContext,
  DEMO_AUDIO_SRC,
  exportSummaryFilename,
  VOICE_PROVIDER,
} from "./voiceContext";

interface VoiceContextPreviewProps {
  draft: DigitalTwinProfile;
  event: TimelineEvent;
  resolver: ResolverOutput;
  /** Jump back to SS3 for further iteration. */
  onEditEmotionalContext: () => void;
}

function downloadTextFile(filename: string, body: string) {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function VoiceContextPreview({
  draft,
  event,
  resolver,
  onEditEmotionalContext,
}: VoiceContextPreviewProps) {
  const { scene } = useStudio();
  const { updateDraft } = useTwin();
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const sampleScript = useMemo(
    () =>
      buildSampleScript({
        subjectName: draft.coreIdentity.name,
        event,
        scene,
        resolver,
      }),
    [draft.coreIdentity.name, event, scene, resolver],
  );

  const narrativeGoalLabel =
    NARRATIVE_GOAL_OPTIONS.find((g) => g.id === scene.narrativeGoalId)?.label ??
    scene.narrativeGoalId;
  const steeringTag =
    resolver.beats[resolver.beats.length - 1]?.steeringTag ?? "—";

  const handleSave = () => {
    const snapshot = captureVoiceContext({
      event,
      scene,
      resolver,
      sampleScript,
    });
    updateDraft((prev) => appendSavedVoiceContext(prev, snapshot));
    setSaveState("saved");
  };

  const handleExport = () => {
    const snapshot = captureVoiceContext({
      event,
      scene,
      resolver,
      sampleScript,
    });
    const body = buildExportSummary({
      subjectName: draft.coreIdentity.name,
      context: snapshot,
      voiceStatus: VOICE_PROVIDER.status,
    });
    const filename = exportSummaryFilename({
      subjectName: draft.coreIdentity.name,
      context: snapshot,
    });
    downloadTextFile(filename, body);
  };

  return (
    <section
      aria-labelledby="voice-context-preview-heading"
      className="space-y-6 text-left"
    >
      <header className="flex flex-wrap items-center gap-3">
        <h2
          id="voice-context-preview-heading"
          className="font-display text-2xl tracking-wide text-text"
        >
          Voice Context Preview
        </h2>
        <InfoTip
          label={VOICE_CONTEXT_PREVIEW_LABEL}
          description={VOICE_CONTEXT_PREVIEW_DESCRIPTION}
        />
        <Badge variant={badgeVariantForVoiceStatus(VOICE_PROVIDER.status)}>
          {VOICE_PROVIDER.label}
        </Badge>
      </header>

      <p className="font-body text-sm text-textsub">
        {VOICE_PROVIDER.description}
      </p>

      <AudioPreview
        src={DEMO_AUDIO_SRC}
        title={`${draft.coreIdentity.name} — ${event.title}`}
      />

      <div
        className="rounded-lg border border-border bg-panel p-5"
        aria-labelledby="vcp-context-heading"
      >
        <p
          id="vcp-context-heading"
          className="label-mono"
        >
          Resolved performance context
        </p>

        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Selected event</span>
              <InfoTip
                label={ANCHORING_EVENT_LABEL}
                description={ANCHORING_EVENT_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1 font-body text-text">
              {event.title}{" "}
              <span className="text-textsub">({event.year})</span>
            </dd>
          </div>
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Audience</span>
              <InfoTip
                label={AUDIENCE_LABEL}
                description={AUDIENCE_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1 font-body text-text">{scene.audience}</dd>
          </div>
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Conversation mode</span>
              <InfoTip
                label={CONVERSATION_MODE_LABEL}
                description={CONVERSATION_MODE_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1 font-body text-text">{scene.mode}</dd>
          </div>
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Narrative goal</span>
              <InfoTip
                label={NARRATIVE_GOAL_LABEL}
                description={NARRATIVE_GOAL_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1 font-body text-text">{narrativeGoalLabel}</dd>
          </div>
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Emotional state</span>
              <InfoTip
                label={EMOTIONAL_STATE_LABEL}
                description={EMOTIONAL_STATE_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1 font-body text-text">
              {resolver.signatureState}
              <span className="ml-2 font-mono text-xs text-textsub">
                {resolver.winningFamily} · {resolver.direction}
              </span>
            </dd>
          </div>
          <div>
            <dt className="flex flex-wrap items-center gap-1.5 label-mono">
              <span>Steering tag</span>
              <InfoTip
                label={STEERING_TAG_LABEL}
                description={STEERING_TAG_DESCRIPTION}
              />
            </dt>
            <dd className="mt-1">
              <Badge variant="gold">{steeringTag}</Badge>
            </dd>
          </div>
        </dl>

        <div className="mt-5 space-y-3">
          <ParamBar
            label="Intensity"
            value={resolver.intensity}
            labelTrailing={
              <InfoTip
                label={INTENSITY_LABEL}
                description={INTENSITY_DESCRIPTION}
              />
            }
          />
          <ParamBar
            label="Warmth"
            value={resolver.warmth}
            labelTrailing={
              <InfoTip label={WARMTH_LABEL} description={WARMTH_DESCRIPTION} />
            }
          />
          <ParamBar
            label="Pacing"
            value={resolver.pacing}
            labelTrailing={
              <InfoTip label={PACING_LABEL} description={PACING_DESCRIPTION} />
            }
          />
          <ParamBar
            label="Confidence"
            value={resolver.confidence}
            labelTrailing={
              <InfoTip
                label={CONFIDENCE_LABEL}
                description={CONFIDENCE_DESCRIPTION}
              />
            }
          />
        </div>
      </div>

      <div
        className="rounded-lg border-l-2 border-gold bg-card p-5"
        aria-labelledby="vcp-script-heading"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p
            id="vcp-script-heading"
            className="label-mono text-gold"
          >
            Sample script
          </p>
          <Badge variant="muted">Illustrative — not synthesized</Badge>
        </div>
        <p className="mt-3 whitespace-pre-line font-serif text-base italic leading-relaxed text-text">
          {sampleScript}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onEditEmotionalContext}>
          Edit emotional context
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          aria-live="polite"
          disabled={saveState === "saved"}
        >
          {saveState === "saved" ? "Saved ✓" : "Save voice context"}
        </Button>
        <Button variant="ghost" onClick={handleExport}>
          Export summary
        </Button>
      </div>

      {saveState === "saved" && (
        <p className="font-mono text-xs text-textsub" role="status">
          Snapshot added to the draft ({draft.savedVoiceContexts?.length ?? 0}{" "}
          total). Export downloads always reflect the current resolver output.
        </p>
      )}
    </section>
  );
}
