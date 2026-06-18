import { useEffect, useRef } from "react";
import { WizardActionBar } from "@/app/navigation/WizardActionBar";
import { Card } from "@/shared/ui/Card";
import { ResponsivePanel } from "@/shared/ui/ResponsivePanel";
import { StepTransition } from "@/shared/ui/StepTransition";
import { StudioProvider, useStudio } from "@/features/studio/StudioContext";
import { useTwin } from "@/app/providers/TwinContext";
import type { ResolverOutput } from "@/types/resolver";
import type { DigitalTwinProfile, TimelineEvent } from "@/types/twin";
import type { StudioStepId } from "@/types/navigation";
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
      goTo("S1");
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
