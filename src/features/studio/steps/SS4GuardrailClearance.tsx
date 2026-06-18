import { useMemo, useState } from "react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { useTwin } from "@/app/providers/TwinContext";
import { useStudio } from "@/features/studio/StudioContext";
import { isReviewResolved } from "@/lib/guardrails";
import {
  evaluatePerformanceClearance,
  statusBadgeVariant,
} from "../clearance";
import { Phase2VisionModal } from "../Phase2VisionModal";
import { VoiceContextPreview } from "../VoiceContextPreview";
import { resolveTwinVoiceConfig } from "../twinVoiceConfig";

export function SS4GuardrailClearance() {
  const { draft, goTo, setStudioStep } = useTwin();
  const { selectedEventId, resolverOutput } = useStudio();
  const [finalized, setFinalized] = useState(false);
  const [phase2Open, setPhase2Open] = useState(false);

  const selectedEvent = draft?.timeline.find((e) => e.id === selectedEventId);
  const twinVoiceConfig = draft ? resolveTwinVoiceConfig(draft) : null;

  const clearance = useMemo(() => {
    if (!draft) {
      return {
        status: "block" as const,
        headline: "No twin loaded",
        details: [],
      };
    }
    return evaluatePerformanceClearance(
      draft,
      selectedEventId,
      resolverOutput,
    );
  }, [draft, selectedEventId, resolverOutput]);

  const canFinalize = clearance.status !== "block" && !finalized;
  const missingEvent = !selectedEvent;
  const missingResolver = Boolean(selectedEvent && !resolverOutput);
  const unresolvedGuardrails = draft
    ? !draft.guardrailReviews.every(isReviewResolved)
    : false;

  const handleFinalize = () => {
    if (!canFinalize) return;
    setFinalized(true);
  };

  if (!draft) {
    return (
      <p className="font-body text-sm text-textsub">No twin loaded.</p>
    );
  }

  if (finalized && selectedEvent && resolverOutput) {
    return (
      <div className="cinematic-enter space-y-8">
        <div className="flex items-center gap-3">
          <div
            className="cinematic-step-complete flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ok bg-okfaint font-display text-xl text-ok"
            aria-hidden="true"
          >
            ✓
          </div>
          <div>
            <p className="label-mono text-ok">
              Performance context locked
            </p>
            <p className="font-body text-sm text-textsub">
              Phase 1 (emotional resolution) is complete for this session.
            </p>
          </div>
        </div>

        <VoiceContextPreview
          draft={draft}
          event={selectedEvent}
          resolver={resolverOutput}
          defaultVoiceId={twinVoiceConfig?.defaultVoiceId}
          scriptOptions={twinVoiceConfig?.scriptOptions}
          onEditEmotionalContext={() => {
            setFinalized(false);
            setStudioStep("SS3");
          }}
        />

        <div className="border-t border-border pt-6">
          <Button variant="ghost" size="small" onClick={() => setPhase2Open(true)}>
            View Phase 2 roadmap
          </Button>
        </div>

        <Phase2VisionModal
          open={phase2Open}
          onClose={() => setPhase2Open(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-text">Guardrail clearance</h2>
      <p className="mt-2 font-body text-sm text-textsub">
        Before saving this voice direction, confirm the timeline moment,
        emotional settings, and producer-review flags. Locking the performance
        context keeps this resolver result for the current session.
      </p>

      <div className="cinematic-enter-soft mt-6 rounded-lg border border-border bg-panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-textmuted">
            Status
          </span>
          <Badge variant={statusBadgeVariant(clearance.status)}>
            {clearance.status.toUpperCase()}
          </Badge>
        </div>
        <p className="mt-3 font-body text-lg text-text">{clearance.headline}</p>
        <ul className="mt-4 space-y-2">
          {clearance.details.map((line) => (
            <li
              key={line}
              className="font-body text-sm text-textsub before:mr-2 before:text-gold before:content-['·']"
            >
              {line}
            </li>
          ))}
        </ul>
      </div>

      {clearance.status === "block" && (
        <div
          id="ss4-finalize-helper"
          className="mt-4 rounded-md border border-danger/40 bg-dangerfaint p-3"
          role="status"
        >
          <p className="font-body text-sm text-danger">
            Complete the required actions before finalizing.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {missingEvent && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => setStudioStep("SS1")}
              >
                Choose anchoring event
              </Button>
            )}
            {missingResolver && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => setStudioStep("SS2")}
              >
                Review scene context
              </Button>
            )}
            {unresolvedGuardrails && (
              <Button variant="secondary" size="small" onClick={() => goTo("S5")}>
                Review producer guardrails
              </Button>
            )}
          </div>
        </div>
      )}

      <Button
        className="mt-8"
        variant="primary"
        disabled={!canFinalize}
        onClick={handleFinalize}
        aria-describedby={!canFinalize ? "ss4-finalize-helper" : undefined}
      >
        {clearance.status === "warn"
          ? "Finalize with warnings"
          : "Finalize performance context"}
      </Button>

      {clearance.status === "warn" && (
        <p className="mt-2 font-mono text-xs text-textmuted">
          Warnings are recorded; you may still finalize for this demo.
        </p>
      )}
    </div>
  );
}
