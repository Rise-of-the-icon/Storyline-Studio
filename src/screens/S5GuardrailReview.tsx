import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EditorialReviewModal } from "../components/EditorialReviewModal";
import { EmptyState } from "../components/EmptyState";
import { useTwin } from "../context/TwinContext";
import { canPersistDraft } from "../lib/consent";
import {
  GUARDRAIL_DISCLAIMER,
  canSaveDraft,
  evaluateGuardrails,
  getRuleForTrigger,
  isReviewResolved,
  listAutoClearedIds,
  markDeferred,
  markRejected,
  markReviewed,
  requiresEditorialNote,
  summarizeReviews,
} from "../lib/guardrails";
import { GUARDRAIL_CLEAR_DESCRIPTION } from "../lib/stateCopy";
import type { DigitalTwinProfile, GuardrailReview } from "../types/twin";

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function statusLabel(review: GuardrailReview): string {
  if (review.status === "Reviewed") return "Editorially reviewed";
  if (review.status === "Rejected") return "Rejected";
  if (review.status === "Deferred") return "Deferred";
  return "Needs review";
}

function statusBadgeVariant(
  review: GuardrailReview,
): "ok" | "danger" | "gold" | "muted" | "warning" {
  if (review.status === "Reviewed") return "ok";
  if (review.status === "Rejected") return "danger";
  if (review.status === "Deferred") return "muted";
  if (review.severity === "High") return "danger";
  if (review.severity === "Medium") return "warning";
  return "muted";
}

function severityBadgeVariant(
  review: GuardrailReview,
): "danger" | "warning" | "muted" {
  if (review.severity === "High") return "danger";
  if (review.severity === "Medium") return "warning";
  return "muted";
}

function itemKindFor(
  draft: DigitalTwinProfile,
  eventId: string,
): "timeline" | "custom" | "unknown" {
  if (draft.timeline.some((e) => e.id === eventId)) return "timeline";
  if (draft.customMoments.some((m) => m.id === eventId)) return "custom";
  return "unknown";
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

// ---------------------------------------------------------------------------
// Single flag row
// ---------------------------------------------------------------------------

interface FlagRowProps {
  review: GuardrailReview;
  itemTitle: string;
  itemKind: "timeline" | "custom" | "unknown";
  onReview: () => void;
  onDefer: () => void;
  onReject: () => void;
  onEditItem: () => void;
}

function FlagRow({
  review,
  itemTitle,
  itemKind,
  onReview,
  onDefer,
  onReject,
  onEditItem,
}: FlagRowProps) {
  const rule = getRuleForTrigger(review.trigger);
  const isHigh = review.severity === "High";
  const resolved = isReviewResolved(review);
  const needsNote =
    requiresEditorialNote(review) && review.status === "NeedsReview";

  const kindLabel =
    itemKind === "timeline"
      ? "Timeline event"
      : itemKind === "custom"
        ? "Custom moment"
        : "Unknown item";

  return (
    <li
      className={[
        "rounded-lg border p-4 transition-colors",
        review.status === "Reviewed"
          ? "border-ok/30 bg-ok/5"
          : review.status === "Rejected"
            ? "border-danger/30 bg-dangerfaint"
            : review.status === "Deferred"
              ? "border-bordermid bg-panel/40"
              : isHigh
                ? "border-danger/40 bg-card"
                : "border-border bg-card",
      ].join(" ")}
      aria-labelledby={`flag-${review.eventId}-${review.trigger}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
            {kindLabel}
          </p>
          <h2
            id={`flag-${review.eventId}-${review.trigger}-title`}
            className="mt-0.5 font-body font-medium text-text"
          >
            {itemTitle}
          </h2>
          <p className="mt-2 font-mono text-xs text-gold">{review.trigger}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant={statusBadgeVariant(review)}>
            {statusLabel(review)}
          </Badge>
          <Badge variant={severityBadgeVariant(review)}>
            {review.severity.toLowerCase()}
          </Badge>
        </div>
      </div>

      {rule && (
        <div className="mt-3 space-y-1">
          <p className="font-body text-sm text-textsub">
            <span className="text-textmuted">Reason — </span>
            {rule.reason}
          </p>
          <p className="font-body text-sm text-textsub">
            <span className="text-textmuted">Suggested — </span>
            {rule.suggestion}
          </p>
        </div>
      )}

      {needsNote && (
        <p className="mt-3 font-mono text-xs text-gold">
          High severity — editorial note required before clearing. Defer is
          unavailable for High-severity flags.
        </p>
      )}

      {review.status === "NeedsReview" && (
        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label={`Actions for ${itemTitle}`}
        >
          <Button
            variant="primary"
            onClick={onReview}
            aria-label={`Resolve ${itemTitle} — ${review.trigger}`}
          >
            Resolve
          </Button>
          <Button
            variant="secondary"
            onClick={onDefer}
            disabled={isHigh}
            aria-label={
              isHigh
                ? `Defer is unavailable for High-severity flag ${itemTitle}`
                : `Defer ${itemTitle} — ${review.trigger}`
            }
            title={
              isHigh
                ? "Defer is unavailable for High-severity flags — resolve or reject instead."
                : undefined
            }
          >
            Defer
          </Button>
          <Button
            variant="ghost"
            onClick={onEditItem}
            disabled={itemKind === "unknown"}
            aria-label={
              itemKind === "timeline"
                ? `Edit timeline event ${itemTitle} in S3`
                : itemKind === "custom"
                  ? `Edit custom moment ${itemTitle} in S4`
                  : `Edit unavailable — item not found`
            }
          >
            Edit item
          </Button>
          <Button
            variant="danger"
            onClick={onReject}
            aria-label={`Reject ${itemTitle} — ${review.trigger}`}
          >
            Reject
          </Button>
        </div>
      )}

      {resolved && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs text-textsub">
            {review.status === "Reviewed" && "Cleared by producer."}
            {review.status === "Rejected" && "Item rejected — see custom-moment rework section below."}
            {review.status === "Deferred" &&
              "Deferred — will not block save, but remains visible for follow-up."}
          </p>
          {review.status !== "Rejected" && (
            <Button
              variant="ghost"
              size="small"
              onClick={onEditItem}
              disabled={itemKind === "unknown"}
            >
              Edit item
            </Button>
          )}
        </div>
      )}

      {review.status === "Reviewed" && review.editorialNote && (
        <p className="mt-3 rounded border border-bordermid bg-panel/40 px-3 py-2 font-body text-xs text-textsub">
          <span className="text-textmuted">Editorial note — </span>
          {review.editorialNote}
        </p>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

function SummaryCard({
  cleared,
  unresolved,
  deferred,
  highBlocking,
  autoCleared,
}: {
  cleared: number;
  unresolved: number;
  deferred: number;
  highBlocking: number;
  autoCleared: number;
}) {
  return (
    <section
      aria-label="Guardrail summary"
      className="mt-4 rounded-lg border border-bordermid bg-panel/40 p-4"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Cleared" value={cleared} tone="ok" />
        <SummaryStat label="Unresolved" value={unresolved} tone="warning" />
        <SummaryStat label="Deferred" value={deferred} tone="muted" />
        <SummaryStat label="High blocking" value={highBlocking} tone="danger" />
      </div>
      {autoCleared > 0 && (
        <p className="mt-3 font-mono text-[11px] text-textmuted">
          {autoCleared} item{autoCleared === 1 ? "" : "s"} cleared automatically
          (no rule matched).
        </p>
      )}
    </section>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warning" | "muted" | "danger";
}) {
  const toneClass: Record<typeof tone, string> = {
    ok: "text-ok",
    warning: "text-gold",
    muted: "text-textsub",
    danger: "text-danger",
  };
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
        {label}
      </p>
      <p
        className={[
          "mt-1 font-display text-2xl tracking-wide",
          toneClass[tone],
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

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
  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);
  const saveAllowed = canSaveDraft(reviews);
  const hasRejections = reviews.some((r) => r.status === "Rejected");
  const consentOk = draft ? canPersistDraft(draft) : false;

  const autoClearedIds = draft
    ? listAutoClearedIds(draft.timeline, draft.customMoments, reviews)
    : [];
  const autoClearedTitles = useMemo(() => {
    if (!draft) return [];
    return autoClearedIds.map((id) => resolveItemTitle(draft, id));
  }, [draft, autoClearedIds]);

  // Sort reviews so blockers float to the top: High-NeedsReview → other
  // unresolved → deferred → cleared/rejected at the bottom.
  const sortedReviews = useMemo(() => {
    const weight = (r: GuardrailReview) => {
      if (r.status === "NeedsReview" && r.severity === "High") return 0;
      if (r.status === "NeedsReview" && r.severity === "Medium") return 1;
      if (r.status === "NeedsReview") return 2;
      if (r.status === "Deferred") return 3;
      return 4;
    };
    return [...reviews].sort((a, b) => weight(a) - weight(b));
  }, [reviews]);

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

  const handleDefer = (review: GuardrailReview) => {
    const next = markDeferred(review);
    // markDeferred is a no-op for High severity — defense in depth against
    // a UI that forgets to disable the button.
    if (next.status !== "Deferred") return;
    updateReview(next);
  };

  const handleEditItem = (review: GuardrailReview) => {
    if (!draft) return;
    const kind = itemKindFor(draft, review.eventId);
    if (kind === "timeline") goTo("S3");
    else if (kind === "custom") goTo("S4");
  };

  const handleSaveDraft = () => {
    if (!draft || !saveAllowed || !consentOk) return;
    goTo("S6");
  };

  if (!draft) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16">
        <EmptyState
          eyebrow="S5 · Guardrail review"
          title="No draft loaded"
          description="Start a digital twin from search to review guardrails."
          action={
            <Button variant="primary" onClick={() => goTo("S1")}>
              Go to search
            </Button>
          }
        />
      </div>
    );
  }

  // Footer message reflects the priority order of save-blockers.
  const footerStatus = !consentOk
    ? "Consent required (S2)"
    : !saveAllowed
      ? `${summary.highBlocking} high-severity flag${summary.highBlocking === 1 ? "" : "s"} blocking save`
      : summary.unresolved > 0
        ? `${summary.unresolved} unresolved (Medium/Low) — save allowed`
        : "Ready to save draft";

  return (
    <div className="mx-auto max-w-[680px] px-4 pb-action-bar pt-6">
      <h1 className="font-display text-3xl tracking-wide text-text">
        Guardrail review
      </h1>
      <p className="mt-2 font-body text-sm text-textsub">
        Resolve, defer, or reject each flag before saving. High-severity
        flags block save until cleared or rejected.
      </p>

      <p
        className="mt-4 rounded-md border border-bordermid bg-panel px-3 py-2 font-mono text-xs text-textmuted"
        role="note"
      >
        {GUARDRAIL_DISCLAIMER}
      </p>

      {reviews.length === 0 ? (
        <div
          role="status"
          className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-ok/30 bg-okfaint px-6 py-8 text-center"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-ok">
            S5 · Clear
          </p>
          <h3 className="font-display text-xl text-ok">All clear</h3>
          <p className="max-w-prose font-body text-sm text-textsub">
            {GUARDRAIL_CLEAR_DESCRIPTION}
          </p>
          {autoClearedTitles.length > 0 && (
            <p className="font-mono text-[11px] text-textmuted">
              {autoClearedTitles.length} item
              {autoClearedTitles.length === 1 ? "" : "s"} cleared
              automatically (no rule matched).
            </p>
          )}
        </div>
      ) : (
        <>
          <SummaryCard
            cleared={summary.cleared}
            unresolved={summary.unresolved}
            deferred={summary.deferred}
            highBlocking={summary.highBlocking}
            autoCleared={autoClearedTitles.length}
          />

          <ul
            className="mt-6 space-y-3"
            aria-label={`${summary.total} flagged items`}
          >
            {sortedReviews.map((review) => (
              <FlagRow
                key={`${review.eventId}-${review.trigger}`}
                review={review}
                itemTitle={resolveItemTitle(draft, review.eventId)}
                itemKind={itemKindFor(draft, review.eventId)}
                onReview={() => setModalReview(review)}
                onDefer={() => handleDefer(review)}
                onReject={() => handleReject(review)}
                onEditItem={() => handleEditItem(review)}
              />
            ))}
          </ul>
        </>
      )}

      {autoClearedTitles.length > 0 && reviews.length > 0 && (
        <section className="mt-10" aria-labelledby="cleared-heading">
          <h2
            id="cleared-heading"
            className="font-mono text-xs uppercase tracking-widest text-textmuted"
          >
            {autoClearedTitles.length} item
            {autoClearedTitles.length === 1 ? "" : "s"} cleared automatically
          </h2>
          <ul className="mt-3 space-y-1 font-body text-sm text-textsub">
            {autoClearedTitles.map((title) => (
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

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface/95 pb-safe backdrop-blur-sm">
        <div className="mx-auto flex max-w-[680px] items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:py-4">
          <Button variant="ghost" onClick={goBack} className="touch-target">
            ← Back
          </Button>
          <p className="hidden flex-1 text-center font-mono text-xs text-textsub sm:block">
            {footerStatus}
          </p>
          <Button
            variant="primary"
            disabled={!saveAllowed || !consentOk}
            onClick={handleSaveDraft}
            aria-describedby="s5-save-helper"
            className="touch-target"
          >
            Save draft
          </Button>
          <span id="s5-save-helper" className="sr-only">
            {!consentOk
              ? "Acknowledge consent on profile import before saving"
              : !saveAllowed
                ? `${summary.highBlocking} high-severity guardrail flag${summary.highBlocking === 1 ? "" : "s"} must be resolved or rejected before saving`
                : "Ready to save"}
          </span>
        </div>
        <p className="px-4 pb-2 text-center font-mono text-[10px] text-textmuted sm:hidden">
          {footerStatus}
        </p>
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
