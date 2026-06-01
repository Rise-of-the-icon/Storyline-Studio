import { useEffect } from "react";
import { Button } from "../components/Button";
import { StudioProvider, useStudio } from "../context/StudioContext";
import { useTwin } from "../context/TwinContext";
import type { StudioStepId } from "../types/navigation";
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
    <div className="grid min-h-[calc(100vh-57px)] w-full grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
      <TwinContextPanel draft={draft} />

      <main
        className="flex min-h-0 flex-col border-b border-border lg:border-b-0"
        aria-label="Voice Studio workflow"
      >
        <div className="border-b border-border px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
            S7 · Voice Studio
          </p>
          <div className="mt-2">
            <StudioBreadcrumb
              current={studioStep}
              onSelect={setStudioStep}
            />
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-4 py-6"
          role="region"
          aria-label={`Studio step: ${studioStep}`}
        >
          <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-6">
            <StudioCenterStage studioStep={studioStep} />
          </div>
        </div>

        <footer className="border-t border-border bg-surface/90 px-4 py-3">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="small" onClick={goBack}>
              ← Exit studio
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                disabled={studioStep === "SS1"}
                onClick={backStudioStep}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="small"
                disabled={studioStep === "SS4"}
                onClick={advanceStudioStep}
              >
                Continue
              </Button>
            </div>
          </div>
        </footer>
      </main>

      <ResolverPanel output={resolverOutput} />
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
