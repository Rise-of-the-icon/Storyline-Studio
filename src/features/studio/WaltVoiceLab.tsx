import { useEffect } from "react";
import { useTwin } from "@/app/providers";
import type { TimelineEvent } from "@/types/twin";
import { StudioProvider, useStudio } from "./StudioContext";
import { VoiceContextPreview } from "./VoiceContextPreview";
import {
  WALT_VOICE_ID,
  WALT_VOICE_SCRIPT_OPTIONS,
  WALT_VOICE_STUDIO_DRAFT,
  WALT_VOICE_STUDIO_EVENT_ID,
} from "./waltVoiceSeed";

function WaltVoiceLabInner() {
  const { setSelectedEventId, resolverOutput } = useStudio();
  const event = WALT_VOICE_STUDIO_DRAFT.timeline.find(
    (item): item is TimelineEvent => item.id === WALT_VOICE_STUDIO_EVENT_ID,
  );

  useEffect(() => {
    setSelectedEventId(WALT_VOICE_STUDIO_EVENT_ID);
  }, [setSelectedEventId]);

  if (!event || !resolverOutput) {
    return (
      <main className="min-h-[calc(100dvh-57px)] px-4 py-8">
        <p className="mx-auto max-w-2xl font-mono text-sm text-textsub">
          Loading voice lab...
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
            Walt Voice Lab
          </h1>
          <p className="mt-2 font-body text-sm text-textsub">
            Seeded directly from the reviewed moment &ldquo;Fake It Till You Make
            It.&rdquo;
          </p>
        </div>
        <VoiceContextPreview
          draft={WALT_VOICE_STUDIO_DRAFT}
          event={event}
          resolver={resolverOutput}
          defaultVoiceId={WALT_VOICE_ID}
          scriptOptions={WALT_VOICE_SCRIPT_OPTIONS}
          onEditEmotionalContext={() => {}}
        />
      </div>
    </main>
  );
}

export function WaltVoiceLab() {
  const { setTransientDraft } = useTwin();

  useEffect(() => {
    setTransientDraft(WALT_VOICE_STUDIO_DRAFT);
  }, [setTransientDraft]);

  return (
    <StudioProvider draft={WALT_VOICE_STUDIO_DRAFT}>
      <WaltVoiceLabInner />
    </StudioProvider>
  );
}
