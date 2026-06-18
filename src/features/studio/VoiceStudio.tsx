import { useEffect, useRef, useState } from "react";
import { WizardActionBar } from "@/app/navigation/WizardActionBar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { ResponsivePanel } from "@/shared/ui/ResponsivePanel";
import { StepTransition } from "@/shared/ui/StepTransition";
import { StudioProvider, useStudio } from "@/features/studio/StudioContext";
import { useTwin } from "@/app/providers/TwinContext";
import type { ResolverOutput } from "@/types/resolver";
import type { DigitalTwinProfile, TimelineEvent } from "@/types/twin";
import type { StudioStepId } from "@/types/navigation";
import { getDraftSummary } from "@/features/saved-draft/draftSummary";
import { HowItWorksPanel } from "./HowItWorksPanel";
import { ResolverPanel } from "./ResolverPanel";
import { StudioBreadcrumb } from "./StudioBreadcrumb";
import { TwinContextPanel } from "./TwinContextPanel";
import {
  appendSavedVoiceContext,
  buildSampleScript,
  captureVoiceContext,
} from "./voiceContext";
import { SS1EventSelector } from "./steps/SS1EventSelector";
import { SS2SceneContext } from "./steps/SS2SceneContext";
import { SS3EmotionalPreview } from "./steps/SS3EmotionalPreview";
import { SS4GuardrailClearance } from "./steps/SS4GuardrailClearance";

const STUDIO_STEP_ORDER: StudioStepId[] = ["SS1", "SS2", "SS3", "SS4"];

function StudioCenterStage({ studioStep }: { studioStep: StudioStepId }) {
  switch (studioStep) {
    case "SS1":
      return <SS1EventSelector />;
    case "SS2":
      return <SS2SceneContext />;
    case "SS3":
      return <SS3EmotionalPreview />;
    case "SS4":
      return <SS4GuardrailClearance />;
  }
}

/** One-line readout shown on mobile when TwinContextPanel is collapsed. */
function twinContextSummary(draft: DigitalTwinProfile): string {
  const events = draft.timeline.length;
  const custom = draft.customMoments.length;
  const flags = draft.guardrailReviews.filter(
    (r) => r.status === "NeedsReview",
  ).length;
  const flagPart = flags > 0 ? ` · ${flags} flag${flags === 1 ? "" : "s"}` : "";
  return `${events} events · ${custom} custom${flagPart}`;
}

/** One-line readout shown on mobile when ResolverPanel is collapsed. */
function resolverSummary(output: ResolverOutput | null): string {
  if (!output) return "Select an event to resolve a feeling";
  return `${output.signatureState} · ${output.winningFamily} · ${output.direction}`;
}

function finalizeProfileForStoryline(args: {
  draft: DigitalTwinProfile;
  selectedEvent: TimelineEvent;
  resolver: ResolverOutput;
  scene: ReturnType<typeof useStudio>["scene"];
}): DigitalTwinProfile {
  const { draft, selectedEvent, resolver, scene } = args;
  const nowISO = new Date().toISOString();
  const sampleScript = buildSampleScript({
    subjectName: draft.coreIdentity.name,
    event: selectedEvent,
    scene,
    resolver,
  });
  const voiceContext = captureVoiceContext({
    event: selectedEvent,
    scene,
    resolver,
    sampleScript,
    nowISO,
  });
  const hasMatchingVoiceContext = (draft.savedVoiceContexts ?? []).some(
    (context) =>
      context.eventId === voiceContext.eventId &&
      context.audience === voiceContext.audience &&
      context.mode === voiceContext.mode &&
      context.narrativeGoalId === voiceContext.narrativeGoalId &&
      context.signatureState === voiceContext.signatureState,
  );
  const withVoiceContext = hasMatchingVoiceContext
    ? draft
    : appendSavedVoiceContext(draft, voiceContext);

  return {
    ...withVoiceContext,
    consentAcknowledged: true,
    consentAcknowledgedAtISO: withVoiceContext.consentAcknowledgedAtISO ?? nowISO,
    draftStatus: "saved",
    timeline: withVoiceContext.timeline.map((event) => ({
      ...event,
      approvalStatus: "Reviewed",
      visibility: event.visibility === "Private" ? "Private" : "Public",
    })),
    customMoments: withVoiceContext.customMoments.map((moment) => ({
      ...moment,
      visibility: moment.visibility === "Private" ? "Private" : "Public",
    })),
  };
}

function BuiltProfileComplete({
  draft,
  onBackToStudio,
  onBackToTimeline,
}: {
  draft: DigitalTwinProfile;
  onBackToStudio: () => void;
  onBackToTimeline: () => void;
}) {
  const summary = getDraftSummary(draft);

  return (
    <main className="min-h-[calc(100dvh-57px)] px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-ok bg-okfaint font-display text-2xl text-ok"
          aria-hidden="true"
        >
          ✓
        </div>
        <p className="mt-5 label-mono text-ok">Step 7 complete</p>
        <h1 className="mt-3 font-display text-3xl tracking-wide text-text">
          Profile built
        </h1>
        <p className="mt-2 font-body text-sm text-textsub">
          The profile data, public timeline, and voice context are saved for Storyline.
        </p>

        <Card className="mt-8 p-5 text-left">
          <Card.Header
            actions={
              <>
                <Badge variant="ok">Built profile</Badge>
                {summary.savedVoiceContextCount > 0 && (
                  <Badge variant="gold">
                    {summary.savedVoiceContextCount} voice context
                    {summary.savedVoiceContextCount === 1 ? "" : "s"}
                  </Badge>
                )}
              </>
            }
          >
            <Card.Title className="text-xl">{summary.subjectName}</Card.Title>
          </Card.Header>
          <dl className="mt-4 grid gap-x-4 gap-y-2 font-mono text-xs text-textsub sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-textmuted">Timeline</dt>
              <dd>{summary.eventCount} events</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-textmuted">Approved</dt>
              <dd>{summary.approvedEventCount}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-textmuted">Custom</dt>
              <dd>{summary.customMomentCount}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-textmuted">Status</dt>
              <dd>{summary.draftStatus}</dd>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <dt className="text-textmuted">Built</dt>
              <dd>
                <time dateTime={summary.lastSavedAtISO}>
                  {summary.lastSavedLabel}
                </time>
              </dd>
            </div>
          </dl>
        </Card>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="primary" onClick={onBackToStudio}>
            Review in Voice Studio
          </Button>
          <Button variant="secondary" onClick={onBackToTimeline}>
            Back to timeline
          </Button>
        </div>
      </div>
    </main>
  );
}

function VoiceStudioInner() {
  const {
    draft,
    studioStep,
    goBack,
    goTo,
    setDraft,
    advanceStudioStep,
    backStudioStep,
    setStudioStep,
  } = useTwin();
  const { selectedEventId, scene, resolverOutput } = useStudio();
  const [buildComplete, setBuildComplete] = useState(false);
  const previousStudioStep = useRef(studioStep);
  const previousStudioStepIndex = STUDIO_STEP_ORDER.indexOf(
    previousStudioStep.current,
  );
  const studioStepIndex = STUDIO_STEP_ORDER.indexOf(studioStep);
  const transitionDirection =
    previousStudioStep.current === studioStep
      ? undefined
      : studioStepIndex > previousStudioStepIndex
        ? "forward"
        : "back";

  useEffect(() => {
    previousStudioStep.current = studioStep;
  }, [studioStep]);

  if (!draft) return null;

  if (buildComplete) {
    return (
      <BuiltProfileComplete
        draft={draft}
        onBackToStudio={() => setBuildComplete(false)}
        onBackToTimeline={() => goTo("S3")}
      />
    );
  }

  const selectedEvent = draft.timeline.find((event) => event.id === selectedEventId);

  const handlePrimaryAction = () => {
    if (studioStep === "SS4") {
      if (!selectedEvent || !resolverOutput) return;
      const finalized = finalizeProfileForStoryline({
        draft,
        selectedEvent,
        resolver: resolverOutput,
        scene,
      });
      setDraft(finalized);
      setBuildComplete(true);
      return;
    }
    advanceStudioStep();
  };

  return (
    <div className="flex min-h-[calc(100dvh-57px)] w-full flex-col lg:grid lg:grid-cols-[220px_minmax(0,1fr)_280px]">
      {/* === Mobile/tablet: collapsible Twin context above the center stage === */}
      <div className="lg:hidden">
        <ResponsivePanel
          title="Twin context"
          summary={twinContextSummary(draft)}
          className="border-b border-border"
        >
          <TwinContextPanel draft={draft} />
        </ResponsivePanel>
      </div>

      {/* === lg+: persistent left rail === */}
      <div className="hidden lg:block">
        <TwinContextPanel draft={draft} />
      </div>

      <main
        className="flex min-h-0 flex-col"
        aria-label="Voice Studio workflow"
      >
        <div className="border-b border-border px-4 py-3">
          <div className="-mx-1 overflow-x-auto px-1">
            <StudioBreadcrumb
              current={studioStep}
              onSelect={setStudioStep}
            />
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-4 py-6 pb-action-bar lg:pb-6"
          role="region"
          aria-label={`Studio step: ${studioStep}`}
        >
          <div className="mx-auto max-w-2xl">
            <HowItWorksPanel />
            <Card className="sm:p-6">
              <StepTransition key={studioStep} direction={transitionDirection}>
                <StudioCenterStage studioStep={studioStep} />
              </StepTransition>
            </Card>
          </div>
        </div>

        {/* === Mobile/tablet: collapsible Resolver below the center stage === */}
        <div className="lg:hidden">
          <ResponsivePanel
            title="Resolver"
            summary={resolverSummary(resolverOutput)}
            className="border-t border-border"
          >
            <ResolverPanel output={resolverOutput} />
          </ResponsivePanel>
        </div>

        <WizardActionBar
          position="sticky"
          maxWidthClass="max-w-2xl"
          back={{
            label: "← Back to Saved",
            onClick: goBack,
            size: "small",
          }}
          secondaryBack={{
            label: "Back",
            onClick: backStudioStep,
            disabled: studioStep === "SS1",
            variant: "secondary",
            size: "small",
          }}
          primary={{
            label: studioStep === "SS4" ? "Build Profile" : "Continue",
            onClick: handlePrimaryAction,
            disabled: studioStep === "SS4" && (!selectedEvent || !resolverOutput),
            size: "small",
          }}
        />
      </main>

      {/* === lg+: persistent right rail === */}
      <div className="hidden lg:block">
        <ResolverPanel output={resolverOutput} />
      </div>
    </div>
  );
}

export function VoiceStudio() {
  const { draft, goTo } = useTwin();

  useEffect(() => {
    if (!draft) goTo("S1");
  }, [draft, goTo]);

  if (!draft) {
    return null;
  }

  return (
    <StudioProvider draft={draft}>
      <VoiceStudioInner />
    </StudioProvider>
  );
}
