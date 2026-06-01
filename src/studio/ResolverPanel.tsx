import { useEffect, useState } from "react";
import { Badge } from "../components/Badge";
import { ParamBar } from "../components/ParamBar";
import type { ResolverOutput } from "../types/resolver";
import { EmotionalArcViz } from "./EmotionalArcViz";

export interface ResolverPanelProps {
  output: ResolverOutput | null;
}

export function ResolverPanel({ output }: ResolverPanelProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!output) {
      setRevealed(false);
      return;
    }
    setRevealed(false);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setRevealed(true);
      return;
    }
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, [output?.signatureState, output?.winningFamily, output?.intensity]);

  const active = output !== null;

  return (
    <aside className="flex h-full flex-col border-t border-border bg-panel p-4 lg:border-l lg:border-t-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
        Resolver
      </p>

      {!active ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 px-4 py-8 text-center">
          <p className="font-body text-sm text-textsub">
            Select an event to activate the resolver
          </p>
        </div>
      ) : (
        <div
          key={`${output.signatureState}-${output.intensity}`}
          className={[
            "resolver-reveal mt-4 flex-1 overflow-y-auto rounded-lg border border-border bg-card p-4",
            revealed ? "resolver-reveal-visible" : "",
          ].join(" ")}
          aria-live="polite"
          aria-busy={!revealed}
        >
          {!revealed && (
            <p className="sr-only" role="status">
              Resolver recomputing emotional state
            </p>
          )}
          <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
            Resolved feeling
          </p>
          <p className="mt-1 font-display text-2xl leading-tight text-text">
            {output.signatureState}
          </p>
          <p className="mt-1 font-mono text-xs text-textsub">
            {output.winningFamily} · {output.direction}
          </p>

          <div className="mt-4 space-y-3">
            <ParamBar label="Intensity" value={output.intensity} />
            <ParamBar label="Warmth" value={output.warmth} />
            <ParamBar label="Pacing" value={output.pacing} />
            <ParamBar label="Confidence" value={output.confidence} />
          </div>

          <div className="mt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
              Steering tag
            </p>
            <div className="mt-2">
              <Badge variant="gold">
                {output.beats[output.beats.length - 1]?.steeringTag ?? "—"}
              </Badge>
            </div>
          </div>

          <EmotionalArcViz output={output} />
        </div>
      )}
    </aside>
  );
}
