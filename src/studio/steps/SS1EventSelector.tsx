import {
  ApprovalBadge,
  ConfidenceBadge,
  SourceBadge,
  VisibilityBadge,
} from "../../components/badges";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { useTwin } from "../../context/TwinContext";
import { useStudio } from "../../context/StudioContext";
import {
  eligibleVoiceStudioEvents,
  getEventDisplay,
} from "../../lib/contentModel";
import type { TimelineEvent } from "../../types/twin";
import { InfoTip } from "../InfoTip";
import {
  ANCHORING_EVENT_DESCRIPTION,
  ANCHORING_EVENT_INLINE_HELPER,
  ANCHORING_EVENT_LABEL,
} from "../studioCopy";

function EventCard({
  event,
  selected,
  onSelect,
}: {
  event: TimelineEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  const display = getEventDisplay(event);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        "w-full rounded-lg border p-4 text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        selected
          ? "border-gold bg-goldfaint"
          : "border-border bg-card hover:border-bordermid hover:bg-hover",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-body font-medium text-text">{event.title}</p>
          <p className="mt-1 font-mono text-xs text-textsub">
            {event.decade} · {event.year}
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
      <p className="mt-2 line-clamp-2 font-body text-sm text-textsub">
        {event.description}
      </p>
    </button>
  );
}

export function SS1EventSelector() {
  const { draft, goTo } = useTwin();
  const { selectedEventId, setSelectedEventId } = useStudio();

  if (!draft) return null;

  // Voice Studio acceptance criterion: only events the producer has
  // explicitly approved (review status = "Reviewed") are anchorable. Deferred,
  // draft, needs-review, and rejected events are intentionally excluded —
  // the studio is not the place to ratify content.
  const events = eligibleVoiceStudioEvents(draft.timeline).sort(
    (a, b) => a.year - b.year,
  );
  const totalEvents = draft.timeline.length;
  const hiddenCount = totalEvents - events.length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl text-text">
          Select anchoring event
        </h2>
        <InfoTip
          label={ANCHORING_EVENT_LABEL}
          description={ANCHORING_EVENT_DESCRIPTION}
        />
      </div>
      <p className="mt-2 font-body text-sm text-textsub">
        Choose a timeline moment — the resolver updates live in the right
        panel. Only producer-approved events appear here.
      </p>
      <p className="mt-2 font-body text-xs leading-snug text-textsub">
        {ANCHORING_EVENT_INLINE_HELPER}
      </p>

      {events.length === 0 ? (
        <EmptyState
          className="mt-6"
          eyebrow="SS1 · Event"
          title="No approved events"
          description={
            totalEvents === 0
              ? "No timeline events — import a profile or add a custom moment first."
              : `${totalEvents} event${totalEvents === 1 ? "" : "s"} exist but none are approved. Approve at least one in the timeline review step before voicing.`
          }
          action={
            <Button variant="primary" onClick={() => goTo("S3")}>
              Go to timeline review
            </Button>
          }
        />
      ) : (
        <>
          {hiddenCount > 0 && (
            <p
              className="mt-4 rounded-md border border-bordermid bg-panel px-3 py-2 font-mono text-xs text-textsub"
              role="note"
            >
              {hiddenCount} event{hiddenCount === 1 ? "" : "s"} hidden — not yet
              approved in timeline review. Voice Studio only uses approved
              events.
            </p>
          )}
          <ul
            className="mt-6 max-h-[min(52vh,480px)] space-y-3 overflow-y-auto pr-1"
            role="radiogroup"
            aria-label="Approved anchoring timeline events"
          >
            {events.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  selected={selectedEventId === event.id}
                  onSelect={() => setSelectedEventId(event.id)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
