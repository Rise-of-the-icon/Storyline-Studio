import { useEffect, type ComponentType } from "react";
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
import { configureTwinRemoteStorage } from "@/services/twinRemoteStorage";
import { createHttpTwinRemoteStorage } from "@/services/httpTwinRemoteStorage";
import { WaltVoiceLab } from "@/features/studio/WaltVoiceLab";
import { WaltVoicePreview } from "@/features/studio/WaltVoicePreview";
import { WALT_VOICE_STUDIO_DRAFT } from "@/features/studio/waltVoiceSeed";
import {
  buildDavidWestTwin,
  buildTomHooverTwin,
  buildWaltTaylorTwin,
} from "@/data/demoSubjects";
import { saveTwin } from "@/lib/storage";
import type { DigitalTwinProfile } from "@/types/twin";


configureTwinRemoteStorage(
  createHttpTwinRemoteStorage({
    baseUrl: "https://ricon-storyline-production.up.railway.app/api",
  })
);

const SCREEN_COMPONENTS: Record<ScreenId, ComponentType> = {
  S1: S1Search,
  S2: S2ProfileImport,
  S3: S3TimelineReview,
  S4: S4CustomMoments,
  S5: S5GuardrailReview,
  S6: S6DraftSaved,
  S7: VoiceStudio,
};

function WaltSeededVoiceStudioRoute() {
  const { draft, goTo, setStudioStep, setTransientDraft } = useTwin();

  useEffect(() => {
    setTransientDraft(WALT_VOICE_STUDIO_DRAFT);
    setStudioStep("SS1");
    goTo("S7");
  }, [goTo, setStudioStep, setTransientDraft]);

  const ready = draft?.twinId === WALT_VOICE_STUDIO_DRAFT.twinId;

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />
      {ready ? (
        <VoiceStudio />
      ) : (
        <main className="px-4 py-8">
          <p className="mx-auto max-w-2xl font-mono text-sm text-textsub">
            Loading Walt voice studio...
          </p>
        </main>
      )}
    </div>
  );
}

function makePublishReadyTwin(
  twin: DigitalTwinProfile,
  twinId: string,
): DigitalTwinProfile {
  const nowISO = new Date().toISOString();
  return {
    ...twin,
    twinId,
    consentAcknowledged: true,
    consentAcknowledgedAtISO: nowISO,
    draftStatus: "saved",
    lastSavedAtISO: nowISO,
    timeline: twin.timeline.map((event) => ({
      ...event,
      approvalStatus: "Reviewed",
      visibility: "Public",
    })),
    customMoments: twin.customMoments.map((moment) => ({
      ...moment,
      visibility: moment.visibility === "Private" ? "Private" : "Public",
    })),
  };
}

function CoreTwinSeedRoute() {
  useEffect(() => {
    const waltSeed = buildWaltTaylorTwin();
    const seeds = [
      makePublishReadyTwin(buildDavidWestTwin(), "core-david-west"),
      makePublishReadyTwin(buildTomHooverTwin(), "core-tom-hoover"),
      makePublishReadyTwin(
        {
          ...waltSeed,
          coreIdentity: { name: "Walt Liquor" },
          wikipedia: {
            ...waltSeed.wikipedia,
            title: "Walt Liquor",
          },
        },
        "core-walt-liquor",
      ),
    ];

    seeds.forEach((seed) => {
      saveTwin(seed);
    });
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />
      <main className="px-4 py-8">
        <div className="mx-auto max-w-2xl rounded-md border border-border bg-card p-6">
          <p className="label-mono text-gold">Core Twin Seed</p>
          <h1 className="mt-2 font-display text-3xl text-text">
            Core twins were saved and mirrored
          </h1>
          <p className="mt-3 font-body text-sm text-textsub">
            David West, Tom Hoover, and Walt Liquor were marked as saved with
            reviewed/public timeline events for demo parity checks.
          </p>
          <p className="mt-4 font-mono text-xs text-textsub">
            Tip: remove <span className="text-text">seedCoreTwins=1</span> from
            the URL after seeding.
          </p>
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { screen } = useTwin();
  const seedCoreTwins = new URLSearchParams(window.location.search).has(
    "seedCoreTwins",
  );
  const showWaltVoiceLab = new URLSearchParams(window.location.search).has(
    "waltVoiceLab",
  );
  const showWaltVoiceStudio = new URLSearchParams(window.location.search).has(
    "waltVoiceStudio",
  );
  const showWaltVoicePreview = new URLSearchParams(window.location.search).has(
    "waltVoicePreview",
  );

  if (seedCoreTwins) {
    return <CoreTwinSeedRoute />;
  }

  if (showWaltVoicePreview) {
    return (
      <div className="min-h-screen bg-bg">
        <AppHeader />
        <WaltVoicePreview />
      </div>
    );
  }

  if (showWaltVoiceStudio) {
    return <WaltSeededVoiceStudioRoute />;
  }

  if (showWaltVoiceLab) {
    return (
      <div className="min-h-screen bg-bg">
        <AppHeader />
        <WaltVoiceLab />
      </div>
    );
  }

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
