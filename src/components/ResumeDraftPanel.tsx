import { useState } from "react";
import { useTwin } from "../context/TwinContext";
import { getDraftSummary } from "../lib/draftSummary";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Surface that appears on S1 when a draft exists in `localStorage`. Two
 * actions: Resume (returns the producer to S2 with the existing draft) and
 * Clear (destructive — wipes the persisted draft after confirmation).
 *
 * Rendered above the search input so a producer who is mid-session sees
 * "where they were" before the search box invites them to start fresh.
 *
 * The panel is intentionally compact — full details live on S6 — so it
 * doesn't compete with the search hero. Auto-hides when no draft is
 * present (it returns `null` and renders nothing).
 */
export function ResumeDraftPanel() {
  const { draft, goTo, clearDraft } = useTwin();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!draft) return null;

  const summary = getDraftSummary(draft);

  return (
    <>
      <section
        aria-label="Saved draft"
        className="mt-6 rounded-lg border border-bordermid bg-panel/40 p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
              Saved draft
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl tracking-wide text-text">
                {summary.subjectName}
              </h2>
              {summary.isDemo && <Badge variant="gold">Demo profile</Badge>}
              {summary.guardrail.highBlocking > 0 && (
                <Badge variant="danger">
                  {summary.guardrail.highBlocking} high blocking
                </Badge>
              )}
            </div>
            <p className="mt-2 font-mono text-[11px] text-textsub">
              {summary.eventCount} event
              {summary.eventCount === 1 ? "" : "s"} ·{" "}
              {summary.approvedEventCount} approved ·{" "}
              {summary.customMomentCount} custom moment
              {summary.customMomentCount === 1 ? "" : "s"}
            </p>
            <p className="mt-1 font-mono text-[11px] text-textmuted">
              {summary.lastSavedAtISOIsExplicit
                ? `Last saved ${summary.lastSavedLabel}`
                : `Created ${summary.lastSavedLabel}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant="primary"
              size="small"
              onClick={() => goTo("S2")}
              aria-label={`Resume saved draft for ${summary.subjectName}`}
            >
              Resume draft
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={() => setConfirmClear(true)}
              aria-label={`Clear saved draft for ${summary.subjectName}`}
            >
              Clear draft
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmClear}
        title="Clear saved draft?"
        description={
          <>
            <p>
              This will permanently delete the draft for{" "}
              <span className="font-medium text-text">
                {summary.subjectName}
              </span>{" "}
              from this browser — including {summary.approvedEventCount} approved
              event{summary.approvedEventCount === 1 ? "" : "s"},{" "}
              {summary.customMomentCount} custom moment
              {summary.customMomentCount === 1 ? "" : "s"}, and{" "}
              {summary.savedVoiceContextCount} saved voice context
              {summary.savedVoiceContextCount === 1 ? "" : "s"}.
            </p>
            <p className="mt-2 text-textmuted">
              This cannot be undone.
            </p>
          </>
        }
        confirmLabel="Clear draft"
        cancelLabel="Keep draft"
        destructive
        onConfirm={() => {
          clearDraft();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}
