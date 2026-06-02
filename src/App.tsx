import type { ComponentType } from "react";
import { AppHeader, WizardHeader } from "@/app/navigation";
import { TwinProvider, useTwin } from "@/app/providers";
import { S4CustomMoments } from "@/features/custom-moments";
import { S5GuardrailReview } from "@/features/guardrails";
import { S6DraftSaved } from "@/features/saved-draft";
import { S1Search, S2ProfileImport } from "@/features/search";
import { VoiceStudio } from "@/features/studio";
import { S3TimelineReview } from "@/features/timeline";
import { StepTransition } from "@/shared/ui";
import { GuardrailsTest } from "./dev/GuardrailsTest";
import { ResolverTest } from "./dev/ResolverTest";
import { StorageTest } from "./dev/StorageTest";
import { SCREEN_META, type ScreenId } from "./types/navigation";

const SCREEN_COMPONENTS: Record<ScreenId, ComponentType> = {
  S1: S1Search,
  S2: S2ProfileImport,
  S3: S3TimelineReview,
  S4: S4CustomMoments,
  S5: S5GuardrailReview,
  S6: S6DraftSaved,
  S7: VoiceStudio,
};

function AppRoutes() {
  const { screen } = useTwin();
  const Screen = SCREEN_COMPONENTS[screen];
  const showWizardHeader = SCREEN_META[screen].showWizardHeader;
  const showDevHarness =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("dev");

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:font-body focus:text-sm focus:text-bg focus:outline-none focus:ring-2 focus:ring-gold"
      >
        Skip to main content
      </a>
      <AppHeader />
      {showWizardHeader && <WizardHeader />}
      <main id="main-content" tabIndex={-1} aria-label="RICON Voice Research Studio">
        {/* Keyed on `screen` so React unmounts + remounts the wrapper on
            every wizard transition, re-firing the fade-in animation.
            Reduced-motion users land instantly (motion-safe:-gated). */}
        <StepTransition key={screen}>
          <Screen />
        </StepTransition>
        {showDevHarness && (
          <div className="border-t border-border">
            <StorageTest />
            <ResolverTest />
            <GuardrailsTest />
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TwinProvider>
      <AppRoutes />
    </TwinProvider>
  );
}
