import {
  ApprovalBadge,
  ConfidenceBadge,
  SourceBadge,
  VisibilityBadge,
} from "@/shared/ui/badges";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useTwin } from "@/app/providers/TwinContext";
import { useStudio } from "@/features/studio/StudioContext";
import {
  eligibleVoiceStudioEvents,
  getEventDisplay,
} from "@/lib/contentModel";
import type { TimelineEvent } from "@/types/twin";
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
    <Card
      as="button"
      type="button"
      aria-pressed={selected}
      selectable
      selected={selected}
      onClick={onSelect}
      className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <Card.Header
        actions={
          <>
            <SourceBadge
              sourceType={display.sourceType}
              verified={display.sourceVerified}
              sourceUrl={display.sourceUrl}
            />
            <ConfidenceBadge level={display.confidence} />
            <ApprovalBadge status={display.approvalStatus} />
            <VisibilityBadge level={display.visibility} />
          </>
        }
      >
        <Card.Title className="text-base">{event.title}</Card.Title>
        <Card.Meta>
          {event.decade} · {event.year}
        </Card.Meta>
      </Card.Header>
      <Card.Body className="line-clamp-2">{event.description}</Card.Body>
    </Card>
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
            role="group"
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
