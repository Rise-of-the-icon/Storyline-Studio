import { useEffect, useState } from "react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { ErrorState } from "@/shared/ui/ErrorState";
import { LoadingState } from "@/shared/ui/LoadingState";
import { RetryPanel } from "@/shared/ui/RetryPanel";
import { useTwin } from "@/app/providers/TwinContext";
import { ProfileCardSkeleton } from "@/shared/ui/Skeleton";
import { canPersistDraft } from "@/lib/consent";
import { getDraftSummary } from "@/features/saved-draft/draftSummary";
import {
  SAVE_CONSENT_BLOCKED_DESCRIPTION,
  SAVE_CONSENT_BLOCKED_TITLE,
  SAVE_ERROR_DESCRIPTION,
  SAVE_ERROR_TITLE,
  SAVE_LOADING_DESCRIPTION,
  SAVE_LOADING_TITLE,
} from "@/lib/stateCopy";
import { saveTwin, setDraft as persistDraftId } from "@/lib/storage";
import type { DigitalTwinProfile } from "@/types/twin";

type S6Phase = "saving" | "saved" | "error";

const SAVE_DELAY_MS = 800;

function finalizeProfileForStoryline(
  draft: DigitalTwinProfile,
): DigitalTwinProfile {
  const nowISO = new Date().toISOString();
  return {
    ...draft,
    consentAcknowledged: true,
    consentAcknowledgedAtISO: draft.consentAcknowledgedAtISO ?? nowISO,
    draftStatus: "saved",
    timeline: draft.timeline.map((event) => ({
      ...event,
      approvalStatus: "Reviewed",
      visibility: event.visibility === "Private" ? "Private" : "Public",
    })),
    customMoments: draft.customMoments.map((moment) => ({
      ...moment,
      visibility: moment.visibility === "Private" ? "Private" : "Public",
    })),
  };
}

async function commitTwin(
  draft: DigitalTwinProfile,
  options: { finalizeForStoryline?: boolean } = {},
): Promise<DigitalTwinProfile | null> {
  if (!canPersistDraft(draft)) {
    return null;
  }
  await new Promise((r) => setTimeout(r, SAVE_DELAY_MS));
  const publishableDraft = options.finalizeForStoryline
    ? finalizeProfileForStoryline(draft)
    : { ...draft, draftStatus: "saved" as const };
  const saved = saveTwin(publishableDraft);
  if (!saved) return null;
  persistDraftId(saved.twinId);
  return saved;
}

export function S6DraftSaved() {
  const { draft, setDraft, goTo, completedThroughStep } = useTwin();
  const [phase, setPhase] = useState<S6Phase>("saving");
  const finalizeForStoryline = completedThroughStep >= 7;

  const runCommit = async () => {
    if (!draft) {
      goTo("S1");
      return;
    }
    if (draft.draftStatus === "saved" && !finalizeForStoryline) {
      setPhase("saved");
      return;
    }
    setPhase("saving");
    const saved = await commitTwin(draft, { finalizeForStoryline });
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
  }, [draft?.twinId, finalizeForStoryline]);

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
      <LoadingState
        eyebrow="S6 · Draft save"
        title={SAVE_LOADING_TITLE}
        description={
          draft?.coreIdentity.name
            ? `${SAVE_LOADING_DESCRIPTION} (${draft.coreIdentity.name})`
            : SAVE_LOADING_DESCRIPTION
        }
        skeleton={<ProfileCardSkeleton />}
      />
    );
  }

  if (phase === "error") {
    const consentBlocked = draft ? !canPersistDraft(draft) : false;
    if (consentBlocked) {
      // Not retryable — the user must go fix consent on S2. Use ErrorState
      // with a custom action instead of RetryPanel.
      return (
        <div className="mx-auto max-w-[680px] px-4 py-16">
          <ErrorState
            eyebrow="S6 · Save blocked"
            title={SAVE_CONSENT_BLOCKED_TITLE}
            description={SAVE_CONSENT_BLOCKED_DESCRIPTION}
            action={
              <Button variant="primary" onClick={() => goTo("S2")}>
                Go to profile import
              </Button>
            }
          />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16">
        <RetryPanel
          eyebrow="S6 · Save error"
          title={SAVE_ERROR_TITLE}
          description={
            <>
              {SAVE_ERROR_DESCRIPTION}{" "}
              <span className="block pt-2 text-textmuted">
                Your twin is still in memory — nothing was lost from this
                session.
              </span>
            </>
          }
          retryLabel="Retry save"
          onRetry={() => void runCommit()}
          secondaryAction={{
            label: "Back to guardrails",
            onClick: () => goTo("S5"),
          }}
        />
      </div>
    );
  }

  const wiki = draft!.wikipedia;
  const summary = getDraftSummary(draft!);
  const guardrailNote =
    summary.guardrail.total === 0
      ? "All clear — no guardrail flags."
      : summary.guardrail.highBlocking > 0
        ? `${summary.guardrail.highBlocking} high blocking · ${summary.guardrail.deferred} deferred`
        : `${summary.guardrail.cleared} cleared · ${summary.guardrail.deferred} deferred · ${summary.guardrail.unresolved} unresolved`;

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
          {finalizeForStoryline ? "Profile built" : "Draft saved"}
        </h1>
        <p className="mt-2 font-body text-sm text-textsub">
          {finalizeForStoryline
            ? "Your digital twin profile data is saved and ready for Storyline."
            : "Your digital twin is ready for the Voice Studio."}
        </p>
      </div>

      <Card
        className="mt-10 flex gap-4 p-5"
        aria-label="Saved draft summary"
      >
        {wiki.imageUrl ? (
          <img
            src={wiki.imageUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-panel font-display text-2xl text-textmuted"
            aria-hidden="true"
          >
            {wiki.title.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1 text-left">
          <Card.Header
            actions={
              <>
                {summary.isDemo && <Badge variant="gold">Demo profile</Badge>}
                {summary.guardrail.highBlocking > 0 && (
                  <Badge variant="danger">
                    {summary.guardrail.highBlocking} high blocking
                  </Badge>
                )}
              </>
            }
          >
            <Card.Title className="text-xl">{summary.subjectName}</Card.Title>
          </Card.Header>
          <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 font-mono text-xs text-textsub sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-textmuted">Timeline</dt>
              <dd>
                {summary.eventCount} event
                {summary.eventCount === 1 ? "" : "s"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-textmuted">Approved</dt>
              <dd>{summary.approvedEventCount}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-textmuted">Deferred</dt>
              <dd>{summary.deferredEventCount}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-textmuted">Custom</dt>
              <dd>
                {summary.customMomentCount} moment
                {summary.customMomentCount === 1 ? "" : "s"}
              </dd>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <dt className="text-textmuted">Confidence</dt>
              <dd>
                <Badge variant="blue">{summary.confidenceLabel}</Badge>
              </dd>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <dt className="text-textmuted">Guardrails</dt>
              <dd>{guardrailNote}</dd>
            </div>
            {summary.savedVoiceContextCount > 0 && (
              <div className="flex gap-2 sm:col-span-2">
                <dt className="text-textmuted">Voice contexts</dt>
                <dd>
                  {summary.savedVoiceContextCount} saved
                </dd>
              </div>
            )}
            {summary.consentAcknowledged && (
              <div className="flex gap-2 sm:col-span-2">
                <dt className="text-textmuted">Consent</dt>
                <dd>Acknowledged</dd>
              </div>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <dt className="text-textmuted">
                {finalizeForStoryline ? "Built" : "Last saved"}
              </dt>
              <dd>
                <time dateTime={summary.lastSavedAtISO}>
                  {summary.lastSavedLabel}
                </time>
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="primary" onClick={() => goTo("S7")}>
          {finalizeForStoryline ? "Back to Voice Studio" : "Open Voice Studio"}
        </Button>
        <Button variant="secondary" onClick={() => goTo("S3")}>
          Back to timeline
        </Button>
      </div>
    </div>
  );
}
