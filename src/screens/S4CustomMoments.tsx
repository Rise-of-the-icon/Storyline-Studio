import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import {
  CustomMomentDrawer,
  type CustomMomentSavePayload,
} from "../components/CustomMomentDrawer";
import { useTwin } from "../context/TwinContext";
import { evaluateGuardrails } from "../lib/guardrails";
import type { CustomMoment, TimelineEvent } from "../types/twin";

function TimelineReference({ events }: { events: TimelineEvent[] }) {
  const approved = events.filter((e) => e.approvalStatus === "Reviewed");

  if (approved.length === 0) {
    return (
      <p className="font-body text-sm text-textsub">
        No approved timeline events yet — approve events in the previous step.
      </p>
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
          <p className="font-mono text-[10px] text-textmuted">
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
      <div className="mx-auto max-w-[680px] px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-text">Custom moments</h1>
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
    <div className="mx-auto max-w-[900px] px-4 pb-28 pt-6">
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
            <div className="mt-6 rounded-lg border border-dashed border-border bg-card/40 px-6 py-12 text-center">
              <p className="font-body text-sm text-textsub">
                No custom moments yet — add the behind-the-scenes beats databases
                miss.
              </p>
              <Button className="mt-4" variant="secondary" onClick={openAdd}>
                Add your first moment
              </Button>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {sortedMoments.map((moment) => (
                <li
                  key={moment.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-body font-medium text-text">
                        {moment.title}
                      </h3>
                      {moment.date && (
                        <p className="mt-0.5 font-mono text-xs text-textsub">
                          {moment.date}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="muted">{moment.visibility}</Badge>
                      <Badge
                        variant={
                          moment.sensitivity === "High" ? "danger" : "muted"
                        }
                      >
                        {moment.sensitivity}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 font-body text-sm text-textsub">
                    {moment.description}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => openEdit(moment)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(moment.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
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

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3 px-4 py-4">
          <Button variant="ghost" onClick={goBack}>
            ← Back
          </Button>
          <Button variant="primary" onClick={() => goTo("S5")}>
            Continue →
          </Button>
        </div>
      </footer>
    </div>
  );
}
