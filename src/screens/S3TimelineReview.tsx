import { useEffect, useMemo, useState } from "react";
import {
  ApprovalBadge,
  ConfidenceBadge,
  SourceBadge,
  VisibilityBadge,
} from "../components/badges";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { SegControl } from "../components/SegControl";
import { TimelineEventSkeleton } from "../components/Skeleton";
import { TimelineRevealItem } from "../components/TimelineRevealItem";
import { useTwin } from "../context/TwinContext";
import { isDemoTwin } from "../data/demoSubjects";
import {
  applyBulkApprovalStatus,
  countApproved,
  getEventDisplay,
  toSourceReference,
} from "../lib/contentModel";
import {
  TIMELINE_EMPTY_DESCRIPTION,
  TIMELINE_EMPTY_TITLE,
  TIMELINE_LOADING_DESCRIPTION,
  TIMELINE_LOADING_TITLE,
} from "../lib/stateCopy";
import type {
  Confidence,
  EventType,
  ReviewStatus,
  TimelineEvent,
} from "../types/twin";

const ALL_TYPES = "All" as const;
type TypeFilter = typeof ALL_TYPES | EventType;

const ALL_CONFIDENCE = "All" as const;
type ConfidenceFilter = typeof ALL_CONFIDENCE | Confidence;

const EVENT_TYPES: EventType[] = [
  "Personal",
  "Career",
  "Achievement",
  "Award",
  "Relationship",
  "Education",
  "Business",
  "Legacy",
  "Historical",
  "Custom",
];

const CONFIDENCES: Confidence[] = ["High", "Medium", "Low"];

function decadeSortKey(decade: string): number {
  const match = decade.match(/(\d{4})/);
  return match ? Number(match[1]) : 0;
}

function groupByDecade(events: TimelineEvent[]): [string, TimelineEvent[]][] {
  const map = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const list = map.get(event.decade) ?? [];
    list.push(event);
    map.set(event.decade, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => decadeSortKey(a) - decadeSortKey(b))
    .map(([decade, list]) => [
      decade,
      [...list].sort((x, y) => x.year - y.year),
    ]);
}

function isApproved(status: ReviewStatus): boolean {
  return status === "Reviewed";
}

// ---------------------------------------------------------------------------
// EventRow — one timeline event card.
// ---------------------------------------------------------------------------

interface EventRowProps {
  event: TimelineEvent;
  onApprove: () => void;
  onDefer: () => void;
}

function formatImportedAt(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function EventRow({ event, onApprove, onDefer }: EventRowProps) {
  const approved = isApproved(event.approvalStatus);
  const display = getEventDisplay(event);
  const sourceRef = toSourceReference(event.source);
  const importedAt = formatImportedAt(sourceRef.importedAtISO);
  // Pre-compute a single "is there anything to show under the disclosure?"
  // boolean so the chevron doesn't appear for events with no extra context.
  const hasSourceNotes = Boolean(
    sourceRef.sourceNotes?.trim() || sourceRef.sourceUrl?.trim() || importedAt,
  );

  return (
    <article
      className={[
        "rounded-lg border bg-card p-4 transition-colors",
        approved
          ? "border-ok/40 bg-ok/5"
          : "border-border hover:border-bordermid",
      ].join(" ")}
      aria-labelledby={`evt-${event.id}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3
            id={`evt-${event.id}-title`}
            className="font-body font-medium text-text"
          >
            {event.title}
          </h3>
          <p className="mt-1 font-mono text-xs text-textsub">
            {event.year}
            {event.date ? ` · ${event.date}` : ""} · {event.eventType}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <SourceBadge
            sourceType={display.sourceType}
            verified={display.sourceVerified}
            sourceUrl={display.sourceUrl}
          />
          <ConfidenceBadge level={display.confidence} />
          <ApprovalBadge status={display.approvalStatus} />
          <VisibilityBadge level={display.visibility} />
        </div>
      </div>

      <p className="mt-2 font-body text-sm text-textsub">{event.description}</p>

      {hasSourceNotes && (
        <details className="mt-3 rounded-md border border-border bg-panel/40">
          <summary className="cursor-pointer rounded-md px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-textmuted hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
            Source notes
          </summary>
          <div className="space-y-2 px-3 pb-3 pt-1 font-mono text-[11px] text-textsub">
            {sourceRef.sourceNotes && (
              <p className="whitespace-pre-wrap">{sourceRef.sourceNotes}</p>
            )}
            {sourceRef.sourceUrl && (
              <p>
                Source URL:{" "}
                <a
                  href={sourceRef.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-gold underline hover:text-gold/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  {sourceRef.sourceUrl}
                </a>
              </p>
            )}
            {importedAt && (
              <p className="text-textmuted">Imported {importedAt}</p>
            )}
            {sourceRef.revisionId && (
              <p className="text-textmuted">
                Wikipedia revision {sourceRef.revisionId}
              </p>
            )}
          </div>
        </details>
      )}

      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label={`Approval actions for ${event.title}`}
      >
        <Button
          variant={approved ? "primary" : "secondary"}
          onClick={onApprove}
          aria-pressed={approved}
          aria-label={
            approved
              ? `Approved · ${event.title}. Click to keep approved.`
              : `Approve ${event.title}`
          }
          className={approved ? "ring-2 ring-ok/40" : ""}
        >
          {approved ? "✓ Approved" : "Approve"}
        </Button>
        <Button
          variant={!approved ? "secondary" : "ghost"}
          onClick={onDefer}
          aria-pressed={!approved}
          aria-label={
            approved
              ? `Defer ${event.title} (currently approved)`
              : `Deferred · ${event.title}. Click to keep deferred.`
          }
        >
          {!approved ? "Defer" : "Defer instead"}
        </Button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// S3TimelineReview — screen
// ---------------------------------------------------------------------------

export function S3TimelineReview() {
  const { draft, goTo, goBack, updateDraft } = useTwin();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(ALL_TYPES);
  const [confidenceFilter, setConfidenceFilter] =
    useState<ConfidenceFilter>(ALL_CONFIDENCE);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  const timeline = draft?.timeline ?? [];

  useEffect(() => {
    if (!draft || timeline.length === 0) {
      setLoadingTimeline(false);
      return;
    }
    setLoadingTimeline(true);
    const id = window.setTimeout(() => setLoadingTimeline(false), 320);
    return () => window.clearTimeout(id);
  }, [draft?.twinId, timeline.length]);

  const filtered = useMemo(() => {
    return timeline.filter((event) => {
      if (typeFilter !== ALL_TYPES && event.eventType !== typeFilter) {
        return false;
      }
      if (
        confidenceFilter !== ALL_CONFIDENCE &&
        event.confidence !== confidenceFilter
      ) {
        return false;
      }
      return true;
    });
  }, [timeline, typeFilter, confidenceFilter]);

  const grouped = useMemo(() => groupByDecade(filtered), [filtered]);
  const totalCount = timeline.length;
  const filteredCount = filtered.length;
  const approvedCount = countApproved(timeline);
  const approvedVisibleCount = countApproved(filtered);

  const filtersActive =
    typeFilter !== ALL_TYPES || confidenceFilter !== ALL_CONFIDENCE;
  const thinTimeline = totalCount > 0 && totalCount < 5;
  const canContinue = approvedCount >= 1;
  const emptyFilter = totalCount > 0 && filteredCount === 0;

  const setEventStatus = (eventId: string, status: ReviewStatus) => {
    updateDraft((prev) => ({
      ...prev,
      timeline: prev.timeline.map((e) =>
        e.id === eventId ? { ...e, approvalStatus: status } : e,
      ),
    }));
  };

  const bulkSetVisible = (status: ReviewStatus) => {
    const visibleIds = filtered.map((e) => e.id);
    if (visibleIds.length === 0) return;
    updateDraft((prev) => ({
      ...prev,
      timeline: applyBulkApprovalStatus(prev.timeline, visibleIds, status),
    }));
  };

  const clearFilters = () => {
    setTypeFilter(ALL_TYPES);
    setConfidenceFilter(ALL_CONFIDENCE);
  };

  // Detect heuristic vs curated source so we can surface a clear callout for
  // real Wikipedia imports — the heuristic timeline is a starting point, not
  // a vetted dataset.
  const isDemo = draft ? isDemoTwin(draft) : false;
  const isHeuristic = !isDemo;

  if (!draft) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16">
        <EmptyState
          eyebrow="S3 · Timeline review"
          title="No draft loaded"
          description="Start a digital twin from search to review its timeline."
          action={
            <Button variant="primary" onClick={() => goTo("S1")}>
              Go to search
            </Button>
          }
        />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16">
        <EmptyState
          eyebrow="S3 · Timeline review"
          title={TIMELINE_EMPTY_TITLE}
          description={
            isDemo
              ? TIMELINE_EMPTY_DESCRIPTION
              : "We could not extract a reliable timeline from this Wikipedia summary. Add custom moments to build the timeline by hand, or pick a different subject."
          }
          action={
            <>
              <Button variant="primary" onClick={() => goTo("S4")}>
                Add custom moments
              </Button>
              <Button variant="ghost" onClick={() => goTo("S2")}>
                Back to import
              </Button>
            </>
          }
        />
      </div>
    );
  }

  if (loadingTimeline) {
    return (
      <LoadingState
        eyebrow="S3 · Timeline review"
        title={TIMELINE_LOADING_TITLE}
        description={TIMELINE_LOADING_DESCRIPTION}
        skeleton={
          <>
            <TimelineEventSkeleton />
            <TimelineEventSkeleton />
            <TimelineEventSkeleton />
          </>
        }
      />
    );
  }

  return (
    <div
      className="mx-auto max-w-[680px] px-4 pb-action-bar pt-6"
      aria-labelledby="s3-heading"
    >
      <h1
        id="s3-heading"
        className="font-display text-3xl tracking-wide text-text"
      >
        Timeline review
      </h1>
      <p className="mt-2 font-body text-sm text-textsub">
        Approve events to include in the twin. Defer anything you are not
        ready to stand behind. Voice Studio only uses approved events.
      </p>

      {isHeuristic && (
        <div
          className="mt-6 rounded-lg border border-gold/30 bg-goldfaint px-4 py-3"
          role="note"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
            Heuristic timeline
          </p>
          <p className="mt-1 font-body text-sm text-text">
            Events were auto-extracted from the Wikipedia summary — confidence
            is approximate. Review every event before approving; expand
            &ldquo;Source notes&rdquo; to verify the citation.
          </p>
        </div>
      )}

      {thinTimeline && (
        <div
          className="mt-3 rounded-lg border border-gold/30 bg-goldfaint px-4 py-3"
          role="status"
        >
          <p className="font-body text-sm text-gold">
            This profile has limited public events ({totalCount}) — consider
            adding custom moments in the next step.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <SegControl<TypeFilter>
          label="Event type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: ALL_TYPES, label: "All" },
            ...EVENT_TYPES.map((t) => ({ value: t, label: t })),
          ]}
        />
        <SegControl<ConfidenceFilter>
          label="Confidence"
          value={confidenceFilter}
          onChange={setConfidenceFilter}
          options={[
            { value: ALL_CONFIDENCE, label: "All" },
            ...CONFIDENCES.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      {/* Result + bulk-action toolbar — always present so the producer
          knows how many events are visible and can act on them in bulk. */}
      <div
        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-bordermid bg-panel/40 px-3 py-2"
        aria-live="polite"
      >
        <p className="font-mono text-xs text-textsub">
          Showing <span className="text-text">{filteredCount}</span> of{" "}
          <span className="text-text">{totalCount}</span> event
          {totalCount === 1 ? "" : "s"}
          {filtersActive && (
            <>
              {" "}
              · <span className="text-text">{approvedVisibleCount}</span>{" "}
              approved in view
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-1">
          {filtersActive && (
            <Button variant="ghost" size="small" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
          <Button
            variant="ghost"
            size="small"
            onClick={() => bulkSetVisible("Reviewed")}
            disabled={filteredCount === 0}
            aria-label={
              filtersActive
                ? `Approve all ${filteredCount} visible events`
                : `Approve all ${filteredCount} events`
            }
          >
            ✓ Approve all visible
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() => bulkSetVisible("Draft")}
            disabled={filteredCount === 0}
            aria-label={
              filtersActive
                ? `Defer all ${filteredCount} visible events`
                : `Defer all ${filteredCount} events`
            }
          >
            Defer all visible
          </Button>
        </div>
      </div>

      {emptyFilter && (
        <EmptyState
          className="mt-6"
          title="No events match this filter."
          description="Try a different combination, or clear the filters to see every event."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      )}

      <div className="mt-8 space-y-10">
        {grouped.map(([decade, events]) => {
          const decadeApproved = countApproved(events);
          return (
            <section key={decade} aria-labelledby={`decade-${decade}`}>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2
                  id={`decade-${decade}`}
                  className="font-display text-xl tracking-wide text-gold"
                >
                  {decade}
                </h2>
                <p className="font-mono text-[11px] uppercase tracking-wide text-textmuted">
                  {decadeApproved} of {events.length} approved
                </p>
              </div>
              <ul className="space-y-4">
                {events.map((event) => (
                  <TimelineRevealItem key={event.id}>
                    <EventRow
                      event={event}
                      onApprove={() => setEventStatus(event.id, "Reviewed")}
                      onDefer={() => setEventStatus(event.id, "Draft")}
                    />
                  </TimelineRevealItem>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface/95 pb-safe backdrop-blur-sm">
        <div className="mx-auto flex max-w-[680px] items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:py-4">
          <Button variant="ghost" onClick={goBack} className="touch-target">
            ← Back
          </Button>
          <p className="hidden flex-1 text-center font-mono text-xs text-textsub sm:block">
            {approvedCount} of {totalCount} approved
            {!canContinue && " · approve at least 1 to continue"}
          </p>
          <Button
            variant="primary"
            disabled={!canContinue}
            onClick={() => goTo("S4")}
            aria-describedby="s3-continue-helper"
            className="touch-target"
          >
            Continue →
          </Button>
          <span id="s3-continue-helper" className="sr-only">
            {!canContinue
              ? "Approve at least one timeline event to continue"
              : `${approvedCount} of ${totalCount} events approved.`}
          </span>
        </div>
        <p className="px-4 pb-2 text-center font-mono text-[10px] text-textmuted sm:hidden">
          {approvedCount} of {totalCount} approved
          {!canContinue && " · approve at least 1"}
        </p>
      </footer>
    </div>
  );
}
