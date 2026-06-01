import { useEffect, useState } from "react";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ParamBar } from "../../components/ParamBar";
import { useTwin } from "../../context/TwinContext";
import { useStudio } from "../../context/StudioContext";
import { EmotionalArcViz } from "../EmotionalArcViz";
import { GuardrailWarningDetailModal } from "../GuardrailWarningDetailModal";

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
        <h2 className="font-display text-2xl text-text">Emotional preview</h2>
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
      <p className="font-mono text-xs uppercase tracking-widest text-gold">
        Emotional state preview
      </p>

      <div
        className={[
          "resolver-reveal mt-4",
          revealed ? "resolver-reveal-visible" : "",
        ].join(" ")}
        aria-live="polite"
      >
        <h2 className="font-display text-4xl leading-none tracking-wide text-text">
          {resolverOutput.signatureState}
        </h2>
        <p className="mt-2 font-mono text-sm text-textsub">
          {resolverOutput.winningFamily} · {resolverOutput.direction}
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
          <ParamBar label="Intensity" value={resolverOutput.intensity} />
          <ParamBar label="Warmth" value={resolverOutput.warmth} />
          <ParamBar label="Pacing" value={resolverOutput.pacing} />
          <ParamBar label="Confidence" value={resolverOutput.confidence} />
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
