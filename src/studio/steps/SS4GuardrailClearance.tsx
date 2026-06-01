import { useMemo, useState } from "react";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { useTwin } from "../../context/TwinContext";
import { useStudio } from "../../context/StudioContext";
import {
  evaluatePerformanceClearance,
  statusBadgeVariant,
} from "../clearance";
import { Phase2VisionModal } from "../Phase2VisionModal";

export function SS4GuardrailClearance() {
  const { draft } = useTwin();
  const { selectedEventId, resolverOutput } = useStudio();
  const [finalized, setFinalized] = useState(false);
  const [phase2Open, setPhase2Open] = useState(false);

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

  const handleFinalize = () => {
    if (!canFinalize) return;
    setFinalized(true);
  };

  if (!draft) {
    return (
      <p className="font-body text-sm text-textsub">No twin loaded.</p>
    );
  }

  if (finalized) {
    return (
      <div className="text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-ok bg-okfaint font-display text-3xl text-ok"
          aria-hidden="true"
        >
          ✓
        </div>
        <h2 className="mt-4 font-display text-3xl tracking-wide text-text">
          Voice generation ready
        </h2>
        <p className="mt-2 font-body text-sm text-textsub">
          Performance context is locked for this session. Phase 1 (emotional
          resolution) is complete in this build.
        </p>
        <p className="mt-4 font-mono text-xs text-textmuted">
          Resolved: {resolverOutput?.signatureState ?? "—"}
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" onClick={() => setPhase2Open(true)}>
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
        Final check of producer flags and resolver warnings before you lock the
        performance context.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-panel p-4">
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
        <p
          id="ss4-finalize-helper"
          className="mt-4 font-body text-sm text-danger"
          role="status"
        >
          Resolve blockers above (select an event, clear producer guardrails in
          onboarding) before finalizing.
        </p>
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
