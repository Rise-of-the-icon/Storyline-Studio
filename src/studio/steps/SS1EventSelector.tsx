import { Badge } from "../../components/Badge";
import { useTwin } from "../../context/TwinContext";
import { useStudio } from "../../context/StudioContext";
import type { TimelineEvent } from "../../types/twin";

function EventCard({
  event,
  selected,
  onSelect,
}: {
  event: TimelineEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  const approved = event.approvalStatus === "Reviewed";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        "w-full rounded-lg border p-4 text-left transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-gold",
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
        <div className="flex gap-1">
          <Badge variant={approved ? "ok" : "muted"}>
            {approved ? "Approved" : "Deferred"}
          </Badge>
          <Badge variant="muted">{event.confidence}</Badge>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 font-body text-sm text-textsub">
        {event.description}
      </p>
    </button>
  );
}

export function SS1EventSelector() {
  const { draft } = useTwin();
  const { selectedEventId, setSelectedEventId } = useStudio();

  if (!draft) return null;

  const events = [...draft.timeline].sort((a, b) => a.year - b.year);

  return (
    <div>
      <h2 className="font-display text-2xl text-text">Select anchoring event</h2>
      <p className="mt-2 font-body text-sm text-textsub">
        Choose a timeline moment — the resolver updates live in the right panel.
      </p>

      {events.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-card/40 px-6 py-10 text-center">
          <p className="font-body text-sm text-textsub">
            No timeline events — import a profile first.
          </p>
        </div>
      ) : (
        <ul
          className="mt-6 max-h-[min(52vh,480px)] space-y-3 overflow-y-auto pr-1"
          role="radiogroup"
          aria-label="Anchoring timeline events"
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
      )}
    </div>
  );
}
