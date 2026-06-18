import { useEffect, useState } from "react";
import { useTwin } from "@/app/providers";
import type { DigitalTwinProfile, TimelineEvent } from "@/types/twin";
import { StudioProvider, useStudio } from "./StudioContext";
import { VoiceContextPreview, type VoiceScriptOption } from "./VoiceContextPreview";
import {
  DAVID_VOICE_ID,
  DAVID_VOICE_SCRIPT_OPTIONS,
  DAVID_VOICE_STUDIO_DRAFT,
  DAVID_VOICE_STUDIO_EVENT_ID,
} from "./davidVoiceSeed";
import {
  TOM_VOICE_ID,
  TOM_VOICE_SCRIPT_OPTIONS,
  TOM_VOICE_STUDIO_DRAFT,
  TOM_VOICE_STUDIO_EVENT_ID,
} from "./tomVoiceSeed";
import {
  WALT_VOICE_ID,
  WALT_VOICE_STUDIO_DRAFT,
  WALT_VOICE_STUDIO_EVENT_ID,
  WALT_VOICE_SCRIPT_OPTIONS,
} from "./waltVoiceSeed";

type ResearchTwinId = "walt" | "tom" | "david";

interface ResearchTwinConfig {
  id: ResearchTwinId;
  label: string;
  heading: string;
  description: string;
  draft: DigitalTwinProfile;
  eventId: string;
  voiceId: string;
  scriptOptions?: VoiceScriptOption[];
}

const RESEARCH_TWINS: ResearchTwinConfig[] = [
  {
    id: "walt",
    label: "Walt Liquor",
    heading: "Walt Voice Preview",
    description: "Seeded directly from the reviewed moment \"Fake It Till You Make It.\"",
    draft: WALT_VOICE_STUDIO_DRAFT,
    eventId: WALT_VOICE_STUDIO_EVENT_ID,
    voiceId: WALT_VOICE_ID,
    scriptOptions: WALT_VOICE_SCRIPT_OPTIONS,
  },
  {
    id: "tom",
    label: "Tom Hoover",
    heading: "Tom Hoover Preview",
    description:
      "Seeded from the curated Tom Hoover profile until verified personal stories are available.",
    draft: TOM_VOICE_STUDIO_DRAFT,
    eventId: TOM_VOICE_STUDIO_EVENT_ID,
    voiceId: TOM_VOICE_ID,
    scriptOptions: TOM_VOICE_SCRIPT_OPTIONS,
  },
  {
    id: "david",
    label: "David West",
    heading: "David West Preview",
    description:
      "Seeded from the curated David West profile for voice research and delivery checks.",
    draft: DAVID_VOICE_STUDIO_DRAFT,
    eventId: DAVID_VOICE_STUDIO_EVENT_ID,
    voiceId: DAVID_VOICE_ID,
    scriptOptions: DAVID_VOICE_SCRIPT_OPTIONS,
  },
];

function researchTwinFromUrl(): ResearchTwinConfig {
  const requested = new URLSearchParams(window.location.search).get("twin");
  return (
    RESEARCH_TWINS.find((twin) => twin.id === requested) ?? RESEARCH_TWINS[0]
  );
}

function ResearchTwinPreviewInner({
  activeTwin,
  onSelectTwin,
}: {
  activeTwin: ResearchTwinConfig;
  onSelectTwin: (id: ResearchTwinId) => void;
}) {
  const { setSelectedEventId, resolverOutput } = useStudio();
  const event = activeTwin.draft.timeline.find(
    (item): item is TimelineEvent => item.id === activeTwin.eventId,
  );

  useEffect(() => {
    setSelectedEventId(activeTwin.eventId);
  }, [activeTwin.eventId, setSelectedEventId]);

  if (!event || !resolverOutput) {
    return (
      <main className="min-h-[calc(100dvh-57px)] px-4 py-8">
        <p className="mx-auto max-w-2xl font-mono text-sm text-textsub">
          Loading voice preview...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-57px)] px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 border-b border-border pb-5">
          <p className="label-mono text-gold">Internal Research Studio</p>
          <h1 className="mt-2 font-display text-4xl tracking-wide text-text">
            {activeTwin.heading}
          </h1>
          <p className="mt-2 font-body text-sm text-textsub">
            {activeTwin.description}
          </p>
          <div
            className="mt-5 inline-flex rounded-md border border-border bg-card p-1"
            role="tablist"
            aria-label="Research twin"
          >
            {RESEARCH_TWINS.map((twin) => {
              const selected = activeTwin.id === twin.id;
              return (
                <button
                  key={twin.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onSelectTwin(twin.id)}
                  className={[
                    "rounded px-3 py-2 font-mono text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    selected
                      ? "bg-gold text-bg"
                      : "text-textsub hover:bg-hover hover:text-text",
                  ].join(" ")}
                >
                  {twin.label}
                </button>
              );
            })}
          </div>
        </div>
        <VoiceContextPreview
          draft={activeTwin.draft}
          event={event}
          resolver={resolverOutput}
          defaultVoiceId={activeTwin.voiceId}
          scriptOptions={activeTwin.scriptOptions}
          onEditEmotionalContext={() => {}}
        />
      </div>
    </main>
  );
}

export function WaltVoicePreview() {
  const { setTransientDraft } = useTwin();
  const [activeTwin, setActiveTwin] = useState(() => researchTwinFromUrl());

  useEffect(() => {
    setTransientDraft(activeTwin.draft);
  }, [activeTwin, setTransientDraft]);

  const handleSelectTwin = (id: ResearchTwinId) => {
    const next = RESEARCH_TWINS.find((twin) => twin.id === id);
    if (!next) return;
    setActiveTwin(next);
    const params = new URLSearchParams(window.location.search);
    params.set("waltVoicePreview", "1");
    params.set("twin", next.id);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  return (
    <StudioProvider key={activeTwin.id} draft={activeTwin.draft}>
      <ResearchTwinPreviewInner
        activeTwin={activeTwin}
        onSelectTwin={handleSelectTwin}
      />
    </StudioProvider>
  );
}
