import { Badge } from "@/shared/ui/Badge";
import { Tooltip } from "@/shared/ui/Tooltip";
import { isDemoTwin } from "@/data/demoSubjects";
import { breakdownSourceConfidence } from "@/features/timeline/confidence";
import { allGuardrailsResolved } from "@/lib/guardrails";
import type { DigitalTwinProfile } from "@/types/twin";
import { TwinChat } from "./TwinChat";

export interface TwinContextPanelProps {
  draft: DigitalTwinProfile;
}

function guardrailStatusLabel(draft: DigitalTwinProfile): string {
  const pending = draft.guardrailReviews.filter(
    (r) => r.status === "NeedsReview",
  ).length;
  if (pending > 0) return `${pending} needs review`;
  if (draft.guardrailReviews.length === 0) return "Clear";
  return allGuardrailsResolved(draft.guardrailReviews)
    ? "Editorially cleared"
    : "Reviewed";
}

export function TwinContextPanel({ draft }: TwinContextPanelProps) {
  const wiki = draft.wikipedia;
  const confidence = breakdownSourceConfidence(draft.timeline);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-panel lg:border-r lg:border-border">
      <div className="shrink-0 p-4">
      <p className="hidden label-mono lg:block">
        Twin context
      </p>

      {wiki.imageUrl ? (
        <img
          src={wiki.imageUrl}
          alt=""
          className="h-16 w-16 rounded-lg object-cover lg:mt-4"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-card font-display text-xl text-textmuted lg:mt-4">
          {wiki.title.slice(0, 1)}
        </div>
      )}

      <h2 className="mt-3 font-body text-base font-medium leading-tight text-text">
        {draft.coreIdentity.name}
      </h2>
      {isDemoTwin(draft) && (
        <p className="mt-1">
          <Badge variant="gold">Demo profile</Badge>
        </p>
      )}

      <dl className="mt-4 space-y-3 font-mono text-[11px]">
        <div>
          <dt className="text-textmuted">Source confidence</dt>
          <dd className="mt-1">
            <Tooltip
              label="Source confidence breakdown"
              content={
                <span className="space-y-1">
                  <span className="block">High: {confidence.high}</span>
                  <span className="block">Medium: {confidence.medium}</span>
                  <span className="block">Low: {confidence.low}</span>
                  <span className="mt-2 block text-textmuted">
                    Based on approved timeline source ratings.
                  </span>
                </span>
              }
            >
              <button
                type="button"
                className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Badge variant="blue">{confidence.label}</Badge>
              </button>
            </Tooltip>
          </dd>
        </div>
        <div>
          <dt className="text-textmuted">Guardrail status</dt>
          <dd className="mt-1 text-text">{guardrailStatusLabel(draft)}</dd>
        </div>
        <div>
          <dt className="text-textmuted">Counts</dt>
          <dd className="mt-1 text-textsub">
            {draft.timeline.length} events · {draft.customMoments.length} custom
          </dd>
        </div>
      </dl>
      </div>
      <TwinChat draft={draft} />
    </aside>
  );
}
