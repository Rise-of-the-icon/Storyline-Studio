import { useEffect, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useTwin } from "../context/TwinContext";
import { ProfileCardSkeleton } from "../components/Skeleton";
import { canPersistDraft } from "../lib/consent";
import { saveTwin, setDraft as persistDraftId } from "../lib/storage";
import type { DigitalTwinProfile } from "../types/twin";

type S6Phase = "saving" | "saved" | "error";

const SAVE_DELAY_MS = 800;

function summarizeConfidence(timeline: DigitalTwinProfile["timeline"]): string {
  if (timeline.length === 0) return "No events";
  const levels = new Set(timeline.map((e) => e.confidence));
  if (levels.size === 1) return [...levels][0];
  if (levels.has("Low")) return "Mixed (includes low confidence)";
  return "Mixed";
}

async function commitTwin(
  draft: DigitalTwinProfile,
): Promise<DigitalTwinProfile | null> {
  if (!canPersistDraft(draft)) {
    return null;
  }
  await new Promise((r) => setTimeout(r, SAVE_DELAY_MS));
  const saved: DigitalTwinProfile = {
    ...draft,
    draftStatus: "saved",
  };
  const ok = saveTwin(saved);
  if (!ok) return null;
  persistDraftId(saved.twinId);
  return saved;
}

export function S6DraftSaved() {
  const { draft, setDraft, goTo } = useTwin();
  const [phase, setPhase] = useState<S6Phase>("saving");

  const runCommit = async () => {
    if (!draft) {
      goTo("S1");
      return;
    }
    if (draft.draftStatus === "saved") {
      setPhase("saved");
      return;
    }
    setPhase("saving");
    const saved = await commitTwin(draft);
    if (!saved) {
      setPhase("error");
      return;
    }
    setDraft(saved);
    setPhase("saved");
  };

  useEffect(() => {
    void runCommit();
    // Commit once per visit when draft is not yet persisted as saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.twinId]);

  if (!draft && phase !== "saving") {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16 text-center">
        <Button variant="primary" onClick={() => goTo("S1")}>
          Go to search
        </Button>
      </div>
    );
  }

  if (phase === "saving") {
    return (
      <div
        className="mx-auto max-w-[680px] px-4 py-16"
        aria-busy="true"
        aria-live="polite"
      >
        <p className="font-display text-2xl text-text">Saving draft…</p>
        <p className="mt-2 font-body text-sm text-textsub">
          Writing {draft?.coreIdentity.name ?? "twin"} to local storage
        </p>
        <div className="mt-8">
          <ProfileCardSkeleton />
        </div>
      </div>
    );
  }

  if (phase === "error") {
    const consentBlocked = draft && !canPersistDraft(draft);
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16 text-center">
        <p className="font-display text-2xl text-danger">
          {consentBlocked ? "Consent required" : "Save failed"}
        </p>
        <p className="mt-2 font-body text-sm text-textsub">
          {consentBlocked
            ? "Acknowledge consent on profile import (S2) before saving a draft."
            : "Your twin is still in memory. Free storage or retry — nothing was lost from this session."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {!consentBlocked && (
            <Button variant="primary" onClick={() => void runCommit()}>
              Retry save
            </Button>
          )}
          <Button
            variant={consentBlocked ? "primary" : "ghost"}
            onClick={() => goTo(consentBlocked ? "S2" : "S5")}
          >
            {consentBlocked ? "Go to profile import" : "Back to guardrails"}
          </Button>
        </div>
      </div>
    );
  }

  const wiki = draft!.wikipedia;
  const approvedCount = draft!.timeline.filter(
    (e) => e.approvalStatus === "Reviewed",
  ).length;

  return (
    <div className="mx-auto max-w-[680px] px-4 py-12">
      <div className="flex flex-col items-center text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ok bg-okfaint font-display text-2xl text-ok"
          aria-hidden="true"
        >
          ✓
        </div>
        <h1 className="mt-4 font-display text-3xl tracking-wide text-text">
          Draft saved
        </h1>
        <p className="mt-2 font-body text-sm text-textsub">
          Your digital twin is ready for the Voice Studio.
        </p>
      </div>

      <article className="mt-10 flex gap-4 rounded-lg border border-border bg-card p-5">
        {wiki.imageUrl ? (
          <img
            src={wiki.imageUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-panel font-display text-2xl text-textmuted">
            {wiki.title.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 text-left">
          <h2 className="font-body text-xl font-medium text-text">
            {draft!.coreIdentity.name}
          </h2>
          <dl className="mt-3 space-y-1 font-mono text-xs text-textsub">
            <div className="flex gap-2">
              <dt className="text-textmuted">Timeline</dt>
              <dd>{draft!.timeline.length} events</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-textmuted">Approved</dt>
              <dd>{approvedCount}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-textmuted">Custom</dt>
              <dd>{draft!.customMoments.length} moments</dd>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <dt className="text-textmuted">Confidence</dt>
              <dd>
                <Badge variant="blue">
                  {summarizeConfidence(draft!.timeline)}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>
      </article>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="primary" onClick={() => goTo("S7")}>
          Open Voice Studio
        </Button>
        <Button variant="secondary" onClick={() => goTo("S3")}>
          Back to timeline
        </Button>
      </div>
    </div>
  );
}
