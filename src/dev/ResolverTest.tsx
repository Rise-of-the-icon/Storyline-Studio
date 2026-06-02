import { useState } from "react";
import { resolve } from "@/lib/resolver";
import type { ResolverOutput } from "@/types/resolver";

const SPORTS_INPUT = {
  domain: "sports" as const,
  archetype: "the-closer",
  eventId: "evt-championship-1998",
  eventTitle: "1998 NBA Finals — Game 6 winning shot",
  eventContext: "championship achievement",
  emotionalSignificance: 92,
  intent: "Celebrate the defining championship moment with competitive fire",
  mode: "Narrator" as const,
  sensitivity: "Medium" as const,
  confidence: "High" as const,
};

const MUSIC_INPUT = {
  domain: "music" as const,
  archetype: "the-poet",
  eventId: "evt-album-1991",
  eventTitle: "1991 breakthrough album release",
  eventContext: "legacy honor soulful",
  emotionalSignificance: 78,
  intent: "Honor the legacy with intimate, soulful reflection",
  mode: "Documentary" as const,
  sensitivity: "High" as const,
  confidence: "Medium" as const,
};

function summarize(output: ResolverOutput): string {
  return [
    `family: ${output.winningFamily}`,
    `state: ${output.signatureState}`,
    `direction: ${output.direction}`,
    `params: I${output.intensity} W${output.warmth} P${output.pacing} C${output.confidence}`,
    `beats: ${output.beats.length}`,
    `warnings: ${output.guardrailWarnings.length}`,
  ].join(" · ");
}

export function ResolverTest() {
  const [sports, setSports] = useState<ResolverOutput | null>(null);
  const [music, setMusic] = useState<ResolverOutput | null>(null);

  const runSports = () => setSports(resolve(SPORTS_INPUT));
  const runMusic = () => setMusic(resolve(MUSIC_INPUT));

  return (
    <section
      className="mx-auto max-w-[680px] border-t border-border p-6 font-mono text-sm text-textsub"
      aria-label="Resolver test harness (dev only)"
    >
      <h2 className="mb-2 font-display text-xl tracking-wide text-gold">
        Resolver harness
      </h2>
      <p className="mb-4 font-body text-textmuted">
        Prompt 1.1 — calls <code className="text-lightblue">resolve()</code> for
        sports and music.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-bordermid bg-panel px-3 py-2 text-text hover:bg-hover focus:outline-none focus:ring-2 focus:ring-gold"
          onClick={runSports}
        >
          Resolve sports
        </button>
        <button
          type="button"
          className="rounded-md border border-bordermid bg-panel px-3 py-2 text-text hover:bg-hover focus:outline-none focus:ring-2 focus:ring-gold"
          onClick={runMusic}
        >
          Resolve music
        </button>
      </div>
      {sports && (
        <div className="mb-4 rounded-lg border border-border bg-card p-4">
          <p className="mb-1 text-gold">Sports</p>
          <p className="text-xs text-text">{summarize(sports)}</p>
          <p className="mt-2 font-body text-xs text-textsub">{sports.reason}</p>
        </div>
      )}
      {music && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-1 text-blue">Music</p>
          <p className="text-xs text-text">{summarize(music)}</p>
          <p className="mt-2 font-body text-xs text-textsub">{music.reason}</p>
        </div>
      )}
    </section>
  );
}
