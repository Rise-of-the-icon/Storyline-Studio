import { useEffect, useState } from "react";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ParamBar } from "../../components/ParamBar";
import { useTwin } from "../../context/TwinContext";
import { useStudio } from "../../context/StudioContext";
import { EmotionalArcViz } from "../EmotionalArcViz";
import { GuardrailWarningDetailModal } from "../GuardrailWarningDetailModal";
import { InfoTip } from "../InfoTip";
import {
  AXES_INLINE_HELPER,
  CONFIDENCE_DESCRIPTION,
  CONFIDENCE_LABEL,
  EMOTIONAL_ARC_DESCRIPTION,
  EMOTIONAL_ARC_LABEL,
  EMOTIONAL_STATE_DESCRIPTION,
  EMOTIONAL_STATE_INLINE_HELPER,
  EMOTIONAL_STATE_LABEL,
  INTENSITY_DESCRIPTION,
  INTENSITY_LABEL,
  NARRATIVE_DIRECTION_DESCRIPTION,
  NARRATIVE_DIRECTION_LABEL,
  PACING_DESCRIPTION,
  PACING_LABEL,
  SIGNATURE_STATE_DESCRIPTION,
  SIGNATURE_STATE_LABEL,
  WARMTH_DESCRIPTION,
  WARMTH_LABEL,
  WINNING_FAMILY_DESCRIPTION,
  WINNING_FAMILY_LABEL,
} from "../studioCopy";

export function SS3EmotionalPreview() {
  const { draft } = useTwin();
  const { selectedEventId, resolverOutput } = useStudio();
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const selectedEvent = draft?.timeline.find((e) => e.id === selectedEventId);

  useEffect(() => {
    if (!resolverOutput) {
      setRevealed(false);
      return;
    }
    setRevealed(false);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setRevealed(true);
      return;
    }
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, [resolverOutput?.signatureState, resolverOutput?.intensity]);

  if (!selectedEventId || !resolverOutput || !selectedEvent) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl text-text">Emotional preview</h2>
          <InfoTip
            label={EMOTIONAL_STATE_LABEL}
            description={EMOTIONAL_STATE_DESCRIPTION}
          />
        </div>
        <p className="mt-4 font-body text-sm text-textsub">
          Select an event and set scene context first — the resolved state
          appears here.
        </p>
      </div>
    );
  }

  const reasonReferencesEvent = resolverOutput.reason.includes(
    selectedEvent.title,
  );

  /** Gate 4 — only when copy comes from generative AI (twin chat). Resolver uses scoring model. */
  const showAiGeneratedLabel = false;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-gold">
          Emotional state preview
        </p>
        <InfoTip
          label={EMOTIONAL_STATE_LABEL}
          description={EMOTIONAL_STATE_DESCRIPTION}
        />
      </div>

      <div
        className={[
          "resolver-reveal mt-4",
          revealed ? "resolver-reveal-visible" : "",
        ].join(" ")}
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-4xl leading-none tracking-wide text-text">
            {resolverOutput.signatureState}
          </h2>
          <InfoTip
            label={SIGNATURE_STATE_LABEL}
            description={SIGNATURE_STATE_DESCRIPTION}
          />
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-sm text-textsub">
          <span>{resolverOutput.winningFamily}</span>
          <InfoTip
            label={WINNING_FAMILY_LABEL}
            description={WINNING_FAMILY_DESCRIPTION}
          />
          <span>·</span>
          <span>{resolverOutput.direction}</span>
          <InfoTip
            label={NARRATIVE_DIRECTION_LABEL}
            description={NARRATIVE_DIRECTION_DESCRIPTION}
          />
        </p>
        <p className="mt-2 font-body text-xs leading-snug text-textsub">
          {EMOTIONAL_STATE_INLINE_HELPER}
        </p>

        <div className="mt-6 rounded-lg border border-border bg-panel p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
              Why this feeling
            </p>
            {showAiGeneratedLabel && (
              <Badge variant="blue">AI-generated</Badge>
            )}
            {!showAiGeneratedLabel && (
              <Badge variant="muted">Scoring model</Badge>
            )}
          </div>
          <p className="mt-3 font-serif text-lg italic leading-relaxed text-text">
            {resolverOutput.reason}
          </p>
          {!reasonReferencesEvent && (
            <p className="mt-2 font-mono text-xs text-danger" role="alert">
              Reason should reference “{selectedEvent.title}”.
            </p>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <ParamBar
            label="Intensity"
            value={resolverOutput.intensity}
            labelTrailing={
              <InfoTip
                label={INTENSITY_LABEL}
                description={INTENSITY_DESCRIPTION}
              />
            }
          />
          <ParamBar
            label="Warmth"
            value={resolverOutput.warmth}
            labelTrailing={
              <InfoTip label={WARMTH_LABEL} description={WARMTH_DESCRIPTION} />
            }
          />
          <ParamBar
            label="Pacing"
            value={resolverOutput.pacing}
            labelTrailing={
              <InfoTip label={PACING_LABEL} description={PACING_DESCRIPTION} />
            }
          />
          <ParamBar
            label="Confidence"
            value={resolverOutput.confidence}
            labelTrailing={
              <InfoTip
                label={CONFIDENCE_LABEL}
                description={CONFIDENCE_DESCRIPTION}
              />
            }
          />
          <p className="font-body text-xs leading-snug text-textsub">
            {AXES_INLINE_HELPER}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
            {EMOTIONAL_ARC_LABEL}
          </span>
          <InfoTip
            label={EMOTIONAL_ARC_LABEL}
            description={EMOTIONAL_ARC_DESCRIPTION}
          />
        </div>
        <EmotionalArcViz output={resolverOutput} />

        {(resolverOutput.guardrailWarnings.length > 0 ||
          selectedEvent.sensitivity === "High") && (
          <div
            className="mt-6 rounded-md border border-gold/30 bg-goldfaint px-3 py-2"
            role="status"
          >
            <p className="font-body text-sm text-gold">
              {resolverOutput.guardrailWarnings.length > 0
                ? `${resolverOutput.guardrailWarnings.length} resolver warning(s) for this context.`
                : "High-sensitivity moment — review before performance."}
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          size="small"
          className="mt-4"
          onClick={() => setWarningModalOpen(true)}
        >
          What triggers a warning?
        </Button>
      </div>

      <GuardrailWarningDetailModal
        open={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        resolverWarnings={resolverOutput.guardrailWarnings}
      />
    </div>
  );
}
