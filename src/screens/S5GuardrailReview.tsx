import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EditorialReviewModal } from "../components/EditorialReviewModal";
import { canPersistDraft } from "../lib/consent";
import { useTwin } from "../context/TwinContext";
import {
  allGuardrailsResolved,
  evaluateGuardrails,
  GUARDRAIL_DISCLAIMER,
  isReviewResolved,
  listAutoClearedIds,
  markRejected,
  markReviewed,
  requiresEditorialNote,
} from "../lib/guardrails";
import type { DigitalTwinProfile, GuardrailReview } from "../types/twin";

function statusLabel(review: GuardrailReview): string {
  if (review.status === "Reviewed") return "Editorially reviewed";
  if (review.status === "Rejected") return "Rejected";
  return "Needs review";
}

function statusBadgeVariant(
  review: GuardrailReview,
): "ok" | "danger" | "gold" | "muted" {
  if (review.status === "Reviewed") return "ok";
  if (review.status === "Rejected") return "danger";
  if (review.severity === "High") return "gold";
  return "muted";
}

function resolveItemTitle(draft: DigitalTwinProfile, eventId: string): string {
  const event = draft.timeline.find((e) => e.id === eventId);
  if (event) return event.title;
  const moment = draft.customMoments.find((m) => m.id === eventId);
  if (moment) return moment.title;
  return "Unknown item";
}

function resolveSourceUrl(draft: DigitalTwinProfile, eventId: string): string {
  const event = draft.timeline.find((e) => e.id === eventId);
  if (event?.source.url) return event.source.url;
  return draft.wikipedia.sourceUrl;
}

export function S5GuardrailReview() {
  const { draft, goTo, goBack, updateDraft, rejectToCustomMoments } = useTwin();
  const [modalReview, setModalReview] = useState<GuardrailReview | null>(null);

  useEffect(() => {
    if (!draft) return;
    updateDraft((prev) => ({
      ...prev,
      guardrailReviews: evaluateGuardrails(
        prev.timeline,
        prev.customMoments,
        prev.guardrailReviews,
      ),
    }));
    // Sync flags once when entering S5 (merge with existing review decisions).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reviews = draft?.guardrailReviews ?? [];
  const clearedIds = draft
    ? listAutoClearedIds(draft.timeline, draft.customMoments, reviews)
    : [];
  const allResolved = reviews.length === 0 || allGuardrailsResolved(reviews);
  const hasRejections = reviews.some((r) => r.status === "Rejected");
  const pendingCount = reviews.filter((r) => !isReviewResolved(r)).length;

  const clearedTitles = useMemo(() => {
    if (!draft) return [];
    return clearedIds.map((id) => resolveItemTitle(draft, id));
  }, [draft, clearedIds]);

  const updateReview = (updated: GuardrailReview) => {
    updateDraft((prev) => ({
      ...prev,
      guardrailReviews: prev.guardrailReviews.map((r) =>
        r.eventId === updated.eventId && r.trigger === updated.trigger
          ? updated
          : r,
      ),
    }));
  };

  const handleEditorialConfirm = (
    review: GuardrailReview,
    editorialNote: string,
  ) => {
    const next = markReviewed(review, editorialNote);
    if (next.status !== "Reviewed") return;
    updateReview(next);
  };

  const handleReject = (review: GuardrailReview) => {
    updateReview(markRejected(review));
  };

  const handleSaveDraft = () => {
    if (!draft || !allResolved || !canPersistDraft(draft)) return;
    goTo("S6");
  };

  const consentOk = draft ? canPersistDraft(draft) : false;

  if (!draft) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-text">Guardrail review</h1>
        <p className="mt-2 font-body text-sm text-textsub">
          No draft loaded — start from search.
        </p>
        <Button className="mt-4" variant="primary" onClick={() => goTo("S1")}>
          Go to search
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[680px] px-4 pb-32 pt-6">
      <h1 className="font-display text-3xl tracking-wide text-text">
        Guardrail review
      </h1>
      <p className="mt-2 font-body text-sm text-textsub">
        Resolve flagged items before saving.{" "}
        {pendingCount > 0 && (
          <span className="text-gold">{pendingCount} pending</span>
        )}
      </p>

      <p className="mt-4 rounded-md border border-bordermid bg-panel px-3 py-2 font-mono text-xs text-textmuted">
        {GUARDRAIL_DISCLAIMER}
      </p>

      {reviews.length === 0 ? (
        <div className="mt-8 rounded-lg border border-ok/30 bg-okfaint px-4 py-6 text-center">
          <p className="font-body text-sm text-ok">
            No guardrail flags — all items cleared automatically.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3" aria-label="Flagged items">
          {reviews.map((review) => (
            <li
              key={`${review.eventId}-${review.trigger}`}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-body font-medium text-text">
                    {resolveItemTitle(draft, review.eventId)}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-textsub">
                    {review.trigger}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={statusBadgeVariant(review)}>
                    {statusLabel(review)}
                  </Badge>
                  <Badge variant="muted">{review.severity}</Badge>
                </div>
              </div>

              {requiresEditorialNote(review) &&
                review.status === "NeedsReview" && (
                  <p className="mt-2 font-mono text-xs text-gold">
                    High severity — editorial note required before clearing.
                  </p>
                )}

              {review.status === "NeedsReview" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => setModalReview(review)}
                  >
                    Review
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleReject(review)}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {review.status === "Reviewed" && review.editorialNote && (
                <p className="mt-3 font-body text-xs text-textsub">
                  Note: {review.editorialNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {clearedTitles.length > 0 && (
        <section className="mt-10" aria-labelledby="cleared-heading">
          <h2
            id="cleared-heading"
            className="font-mono text-xs uppercase tracking-widest text-textmuted"
          >
            {clearedTitles.length} event
            {clearedTitles.length === 1 ? "" : "s"} cleared automatically
          </h2>
          <ul className="mt-3 space-y-1 font-body text-sm text-textsub">
            {clearedTitles.map((title) => (
              <li key={title}>· {title}</li>
            ))}
          </ul>
        </section>
      )}

      {hasRejections && (
        <div className="mt-8 rounded-lg border border-danger/30 bg-dangerfaint px-4 py-3">
          <p className="font-body text-sm text-danger">
            One or more items were rejected — update custom moments and try
            again.
          </p>
          <Button
            className="mt-3"
            variant="secondary"
            size="small"
            onClick={rejectToCustomMoments}
          >
            Return to custom moments (S4)
          </Button>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[680px] flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Button variant="ghost" onClick={goBack}>
            ← Back
          </Button>
          <p className="font-mono text-xs text-textsub">
            {!consentOk
              ? "Consent required (S2)"
              : !allResolved
                ? "Resolve all flags to save"
                : "Ready to save draft"}
          </p>
          <Button
            variant="primary"
            disabled={!allResolved || !consentOk}
            onClick={handleSaveDraft}
            aria-describedby={
              !allResolved || !consentOk ? "s5-save-helper" : undefined
            }
          >
            Save draft
          </Button>
          {(!allResolved || !consentOk) && (
            <span id="s5-save-helper" className="sr-only">
              {!consentOk
                ? "Acknowledge consent on profile import before saving"
                : "Resolve all guardrail flags before saving"}
            </span>
          )}
        </div>
      </footer>

      <EditorialReviewModal
        open={modalReview !== null}
        review={modalReview}
        itemTitle={
          modalReview ? resolveItemTitle(draft, modalReview.eventId) : ""
        }
        sourceUrl={
          modalReview ? resolveSourceUrl(draft, modalReview.eventId) : ""
        }
        onClose={() => setModalReview(null)}
        onConfirm={handleEditorialConfirm}
      />
    </div>
  );
}
