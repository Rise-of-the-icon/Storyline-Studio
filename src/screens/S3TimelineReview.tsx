import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { SegControl } from "../components/SegControl";
import { TimelineEventSkeleton } from "../components/Skeleton";
import { TimelineRevealItem } from "../components/TimelineRevealItem";
import { useTwin } from "../context/TwinContext";
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

interface EventRowProps {
  event: TimelineEvent;
  onApprove: () => void;
  onDefer: () => void;
}

function EventRow({ event, onApprove, onDefer }: EventRowProps) {
  const approved = isApproved(event.approvalStatus);

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-body font-medium text-text">{event.title}</h3>
          <p className="mt-1 font-mono text-xs text-textsub">
            {event.year}
            {event.date ? ` · ${event.date}` : ""} · {event.eventType}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant={approved ? "ok" : "muted"}>
            {approved ? "Approved" : "Deferred"}
          </Badge>
          <Badge variant="muted">{event.confidence}</Badge>
        </div>
      </div>
      <p className="mt-2 font-body text-sm text-textsub">{event.description}</p>
      <div className="mt-4 flex gap-2">
        <Button
          variant={approved ? "primary" : "secondary"}
          size="small"
          onClick={onApprove}
          aria-pressed={approved}
        >
          Approve
        </Button>
        <Button
          variant={!approved ? "primary" : "ghost"}
          size="small"
          onClick={onDefer}
          aria-pressed={!approved}
        >
          Defer
        </Button>
      </div>
    </article>
  );
}

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

  const approvedCount = timeline.filter((e) =>
    isApproved(e.approvalStatus),
  ).length;

  const thinTimeline = timeline.length > 0 && timeline.length < 5;
  const canContinue = approvedCount >= 1;
  const emptyFilter = timeline.length > 0 && filtered.length === 0;

  const setEventStatus = (eventId: string, status: ReviewStatus) => {
    updateDraft((prev) => ({
      ...prev,
      timeline: prev.timeline.map((e) =>
        e.id === eventId ? { ...e, approvalStatus: status } : e,
      ),
    }));
  };

  if (!draft) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-text">Timeline review</h1>
        <p className="mt-2 font-body text-sm text-textsub">No draft loaded.</p>
        <Button className="mt-4" variant="primary" onClick={() => goTo("S1")}>
          Go to search
        </Button>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16 text-center">
        <p className="font-body text-sm text-textsub">
          No timeline events yet — import a profile first.
        </p>
        <Button className="mt-4" variant="primary" onClick={() => goTo("S2")}>
          Back to import
        </Button>
      </div>
    );
  }

  if (loadingTimeline) {
    return (
      <div
        className="mx-auto max-w-[680px] px-4 pb-28 pt-6"
        aria-busy="true"
        aria-live="polite"
      >
        <h1 className="font-display text-3xl tracking-wide text-text">
          Timeline review
        </h1>
        <p className="mt-2 font-mono text-xs text-textmuted">Loading events…</p>
        <div className="mt-8 space-y-4">
          <TimelineEventSkeleton />
          <TimelineEventSkeleton />
          <TimelineEventSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-[680px] px-4 pb-28 pt-6"
      aria-labelledby="s3-heading"
    >
      <h1
        id="s3-heading"
        className="font-display text-3xl tracking-wide text-text"
      >
        Timeline review
      </h1>
      <p className="mt-2 font-body text-sm text-textsub">
        Approve events to include in the twin. Defer anything you are not ready
        to stand behind.
      </p>

      {thinTimeline && (
        <div
          className="mt-6 rounded-lg border border-gold/30 bg-goldfaint px-4 py-3"
          role="status"
        >
          <p className="font-body text-sm text-gold">
            This profile has limited public events ({timeline.length}) —
            consider adding custom moments in the next step.
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

      {emptyFilter && (
        <p className="mt-8 text-center font-body text-sm text-textsub">
          No events match these filters — try a different combination.
        </p>
      )}

      <div className="mt-8 space-y-10">
        {grouped.map(([decade, events]) => (
          <section key={decade} aria-labelledby={`decade-${decade}`}>
            <h2
              id={`decade-${decade}`}
              className="mb-4 font-display text-xl tracking-wide text-gold"
            >
              {decade}
            </h2>
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
        ))}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[680px] flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Button variant="ghost" onClick={goBack}>
            ← Back
          </Button>
          <p className="font-mono text-xs text-textsub">
            {approvedCount} approved
            {!canContinue && " · approve at least 1 to continue"}
          </p>
          <Button
            variant="primary"
            disabled={!canContinue}
            onClick={() => goTo("S4")}
            aria-describedby={!canContinue ? "s3-continue-helper" : undefined}
          >
            Continue →
          </Button>
          {!canContinue && (
            <span id="s3-continue-helper" className="sr-only">
              Approve at least one timeline event to continue
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
