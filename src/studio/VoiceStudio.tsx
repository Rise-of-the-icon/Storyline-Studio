import { useEffect } from "react";
import { Button } from "../components/Button";
import { ResponsivePanel } from "../components/ResponsivePanel";
import { StudioProvider, useStudio } from "../context/StudioContext";
import { useTwin } from "../context/TwinContext";
import type { ResolverOutput } from "../types/resolver";
import type { DigitalTwinProfile } from "../types/twin";
import type { StudioStepId } from "../types/navigation";
import { HowItWorksPanel } from "./HowItWorksPanel";
import { ResolverPanel } from "./ResolverPanel";
import { StudioBreadcrumb } from "./StudioBreadcrumb";
import { TwinContextPanel } from "./TwinContextPanel";
import { SS1EventSelector } from "./steps/SS1EventSelector";
import { SS2SceneContext } from "./steps/SS2SceneContext";
import { SS3EmotionalPreview } from "./steps/SS3EmotionalPreview";
import { SS4GuardrailClearance } from "./steps/SS4GuardrailClearance";

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

function VoiceStudioInner() {
  const {
    draft,
    studioStep,
    goBack,
    advanceStudioStep,
    backStudioStep,
    setStudioStep,
  } = useTwin();
  const { resolverOutput } = useStudio();

  if (!draft) return null;

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
          <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
            Studio sub-steps
          </p>
          <div className="mt-1 -mx-1 overflow-x-auto px-1">
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
            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <StudioCenterStage studioStep={studioStep} />
            </div>
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

        <footer className="sticky bottom-0 border-t border-border bg-surface/95 px-4 py-3 pb-safe backdrop-blur">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="small" onClick={goBack} className="touch-target">
              ← Back to Saved
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                disabled={studioStep === "SS1"}
                onClick={backStudioStep}
                className="touch-target"
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="small"
                disabled={studioStep === "SS4"}
                onClick={advanceStudioStep}
                className="touch-target"
              >
                Continue
              </Button>
            </div>
          </div>
        </footer>
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
