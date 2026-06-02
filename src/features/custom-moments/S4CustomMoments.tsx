import { useMemo, useState } from "react";
import { Badge } from "@/shared/ui/Badge";
import { SourceBadge, VisibilityBadge } from "@/shared/ui/badges";
import { WizardActionBar } from "@/app/navigation/WizardActionBar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import {
  CustomMomentDrawer,
  type CustomMomentSavePayload,
} from "@/features/custom-moments/CustomMomentDrawer";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useTwin } from "@/app/providers/TwinContext";
import {
  getDisplaySensitivity,
  getMomentDisplay,
} from "@/lib/contentModel";
import { evaluateGuardrails } from "@/lib/guardrails";
import {
  CUSTOM_MOMENT_MEDIA_TYPE_LABEL,
  validateCustomMomentMediaInput,
} from "@/features/custom-moments/customMomentMedia";
import { CUSTOM_EMPTY_DESCRIPTION } from "@/lib/stateCopy";
import type {
  CustomMoment,
  CustomMomentMedia,
  TimelineEvent,
} from "@/types/twin";

function MediaPreview({ item }: { item: CustomMomentMedia }) {
  const label =
    item.label ||
    item.fileName ||
    `${CUSTOM_MOMENT_MEDIA_TYPE_LABEL[item.type]} attachment`;

  if (item.type === "image") {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded border border-border bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        aria-label={`Open ${label}`}
      >
        <img
          src={item.url}
          alt={label}
          loading="lazy"
          className="h-20 w-full object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="flex h-20 items-center justify-center rounded border border-border bg-panel font-display text-2xl text-gold transition-colors hover:border-gold/60 hover:bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      aria-label={`Open ${label}`}
    >
      <span aria-hidden="true">▶</span>
    </a>
  );
}

function MediaAttachment({ item }: { item: CustomMomentMedia }) {
  const error = validateCustomMomentMediaInput({
    type: item.type,
    url: item.url,
    label: item.label ?? "",
  });
  if (error) {
    return (
      <p className="rounded border border-danger/40 bg-dangerfaint px-2 py-1 meta-mono text-danger">
        Media unavailable - attachment URL is invalid.
      </p>
    );
  }

  return (
    <figure className="min-w-0 rounded-md border border-border bg-panel/40 p-2">
      <MediaPreview item={item} />
      <figcaption className="mt-1.5 flex min-w-0 items-center justify-between gap-2 meta-mono text-textmuted">
        <span className="truncate">
          {CUSTOM_MOMENT_MEDIA_TYPE_LABEL[item.type]}
          {item.label ? ` · ${item.label}` : ""}
        </span>
        <span className="shrink-0 text-lightblue">Open ↗</span>
      </figcaption>
    </figure>
  );
}

function TimelineReference({ events }: { events: TimelineEvent[] }) {
  const approved = events.filter((e) => e.approvalStatus === "Reviewed");

  if (approved.length === 0) {
    return (
      <EmptyState description="No approved timeline events yet — approve events in the previous step." />
    );
  }

  return (
    <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {approved.map((event) => (
        <li
          key={event.id}
          className="rounded-md border border-border bg-card px-3 py-2"
        >
          <p className="font-body text-sm text-text">{event.title}</p>
          <p className="meta-mono text-textmuted">
            {event.decade} · {event.year}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function S4CustomMoments() {
  const { draft, goTo, goBack, updateDraft } = useTwin();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CustomMoment | undefined>();
  const [lastSavedFlag, setLastSavedFlag] = useState(false);

  const moments = draft?.customMoments ?? [];
  const timeline = draft?.timeline ?? [];

  const sortedMoments = useMemo(
    () => [...moments].sort((a, b) => a.title.localeCompare(b.title)),
    [moments],
  );

  const openAdd = () => {
    setEditing(undefined);
    setDrawerOpen(true);
    setLastSavedFlag(false);
  };

  const openEdit = (moment: CustomMoment) => {
    setEditing(moment);
    setDrawerOpen(true);
    setLastSavedFlag(false);
  };

  const applyMoments = (nextMoments: CustomMoment[]) => {
    updateDraft((prev) => ({
      ...prev,
      customMoments: nextMoments,
      guardrailReviews: evaluateGuardrails(prev.timeline, nextMoments),
    }));
  };

  const handleSave = ({ moment, injectionFlagged }: CustomMomentSavePayload) => {
    const id = moment.id ?? crypto.randomUUID();
    const saved: CustomMoment = {
      id,
      title: moment.title,
      date: moment.date,
      description: moment.description,
      emotionalSignificance: moment.emotionalSignificance,
      sourceNotes: moment.sourceNotes,
      source: moment.source,
      media: moment.media,
      visibility: moment.visibility,
      sensitivity: moment.sensitivity,
    };

    const next = editing
      ? moments.map((m) => (m.id === editing.id ? saved : m))
      : [...moments, saved];

    applyMoments(next);
    setDrawerOpen(false);
    setEditing(undefined);
    setLastSavedFlag(injectionFlagged);
  };

  const handleDelete = (id: string) => {
    applyMoments(moments.filter((m) => m.id !== id));
  };

  if (!draft) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16">
        <EmptyState
          eyebrow="S4 · Custom moments"
          title="No draft loaded"
          description="Start a digital twin from search to add custom moments."
          action={
            <Button variant="primary" onClick={() => goTo("S1")}>
              Go to search
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 pb-action-bar pt-6">
      <h1 className="font-display text-3xl tracking-wide text-text">
        Custom moments
      </h1>
      <p className="mt-2 font-body text-sm text-textsub">
        Add producer-sourced moments Wikipedia cannot capture. All text is
        sanitized before save.
      </p>

      {lastSavedFlag && (
        <p
          className="mt-4 rounded-md border border-bordermid bg-panel px-3 py-2 font-mono text-xs text-textsub"
          role="status"
        >
          Last save: suspicious patterns were sanitized (gate 3).
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <aside className="rounded-lg border border-border bg-panel/50 p-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-textmuted">
            Timeline reference (read-only)
          </h2>
          <div className="mt-3">
            <TimelineReference events={timeline} />
          </div>
        </aside>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-xs uppercase tracking-widest text-textmuted">
              Custom moments ({moments.length})
            </h2>
            <Button variant="primary" size="small" onClick={openAdd}>
              Add moment
            </Button>
          </div>

          {sortedMoments.length === 0 ? (
            <EmptyState
              className="mt-6"
              description={CUSTOM_EMPTY_DESCRIPTION}
              action={
                <Button variant="secondary" onClick={openAdd}>
                  Add your first moment
                </Button>
              }
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {sortedMoments.map((moment) => {
                const display = getMomentDisplay(moment);
                const sensitivity = getDisplaySensitivity(moment.sensitivity);
                return (
                  <li key={moment.id}>
                    <Card>
                      <Card.Header
                        actions={
                          <>
                            <SourceBadge
                              sourceType={display.sourceType}
                              verified={display.sourceVerified}
                              sourceUrl={display.sourceUrl}
                            />
                            <VisibilityBadge level={display.visibility} />
                            <Badge
                              variant={
                                sensitivity === "high" ? "danger" : "muted"
                              }
                            >
                              Sensitivity · {sensitivity}
                            </Badge>
                          </>
                        }
                      >
                        <Card.Title>{moment.title}</Card.Title>
                        {moment.date && <Card.Meta>{moment.date}</Card.Meta>}
                      </Card.Header>
                      <Card.Body className="line-clamp-2">
                        {moment.description}
                      </Card.Body>
                      {moment.sourceNotes && (
                        <p className="mt-2 line-clamp-2 meta-mono">
                          <span className="text-textmuted">Source notes — </span>
                          {moment.sourceNotes}
                        </p>
                      )}
                      {moment.media && moment.media.length > 0 && (
                        <div className="mt-3">
                          <p className="label-mono">
                            Media ({moment.media.length})
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {moment.media.map((item) => (
                              <MediaAttachment key={item.id} item={item} />
                            ))}
                          </div>
                        </div>
                      )}
                      {!display.sourceVerified && (
                        <p
                          className="mt-2 rounded-md border border-danger/40 bg-dangerfaint px-2 py-1 meta-mono text-danger"
                          role="note"
                        >
                          Unverified — not presented as fact in the studio.
                        </p>
                      )}
                      <Card.Footer className="mt-3">
                        <Button
                          variant="secondary"
                          size="small"
                          className="touch-target"
                          onClick={() => openEdit(moment)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          className="touch-target"
                          onClick={() => handleDelete(moment.id)}
                        >
                          Delete
                        </Button>
                      </Card.Footer>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <CustomMomentDrawer
        open={drawerOpen}
        mode={editing ? "edit" : "add"}
        initial={editing}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(undefined);
        }}
        onSave={handleSave}
      />

      <WizardActionBar
        maxWidthClass="max-w-[900px]"
        back={{ label: "← Back", onClick: goBack }}
        primary={{ label: "Continue →", onClick: () => goTo("S5") }}
      />
    </div>
  );
}
