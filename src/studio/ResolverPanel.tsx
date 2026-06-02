import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { ParamBar } from "../components/ParamBar";
import { useStudio } from "../context/StudioContext";
import { useTwin } from "../context/TwinContext";
import type { ResolverOutput } from "../types/resolver";
import { EmotionalArcViz } from "./EmotionalArcViz";
import { InfoTip } from "./InfoTip";
import {
  CONFIDENCE_DESCRIPTION,
  CONFIDENCE_LABEL,
  EMOTIONAL_STATE_DESCRIPTION,
  EMOTIONAL_STATE_LABEL,
  INPUTS_LABEL,
  INTENSITY_DESCRIPTION,
  INTENSITY_LABEL,
  PACING_DESCRIPTION,
  PACING_LABEL,
  RESOLVED_FEELING_EYEBROW,
  RESOLVER_DESCRIPTION,
  RESOLVER_LABEL,
  RESOLVER_LIVE_NOTE,
  STEERING_TAG_DESCRIPTION,
  STEERING_TAG_INLINE_HELPER,
  STEERING_TAG_LABEL,
  WARMTH_DESCRIPTION,
  WARMTH_LABEL,
  WHY_THIS_FEELING_LABEL,
  WINNING_FAMILY_LABEL,
} from "./studioCopy";
import {
  NARRATIVE_GOAL_OPTIONS,
  type StudioSceneSettings,
} from "./studioResolver";
import {
  buildWhyThisFeelingRationale,
  narrativeGoalLabelFor,
} from "./whyThisFeeling";

export interface ResolverPanelProps {
  output: ResolverOutput | null;
}

// ---------------------------------------------------------------------------
// AxisRow — wraps `<ParamBar>` with the canonical inline description text.
//
// The sibling subagent's `<ParamBar labelTrailing>` already shows the four
// axes with a labelled `<InfoTip>` next to each label, which covers the
// hover/focus discoverability path. This wrapper ADDS the inline one-sentence
// explanation pulled from `studioCopy` so the panel reads as a real decision
// system at a glance — producers don't need to hover every axis to know what
// it means before showing the panel to a stakeholder.
// ---------------------------------------------------------------------------

interface AxisRowProps {
  label: string;
  value: number;
  description: string;
  /** Trailing slot rendered next to the label — typically an `<InfoTip>`. */
  labelTrailing: ReactNode;
}

function AxisRow({ label, value, description, labelTrailing }: AxisRowProps) {
  return (
    <div>
      <ParamBar label={label} value={value} labelTrailing={labelTrailing} />
      <p className="mt-1.5 font-body text-xs leading-snug text-textmuted">
        {description}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WhyThisFeelingBlock — inputs list + deterministic plain-English rationale.
//
// Sibling's `studioCopy` already exposes pinned constants for every term; we
// reuse them so the same wording appears in tooltips and inline. The
// rationale itself comes from `buildWhyThisFeelingRationale` so it can be
// regression-tested without React.
// ---------------------------------------------------------------------------

interface WhyThisFeelingBlockProps {
  output: ResolverOutput;
  selectedEventTitle: string;
  selectedEventDecade?: string;
  selectedEventYear?: number;
  scene: StudioSceneSettings;
}

function WhyThisFeelingBlock({
  output,
  selectedEventTitle,
  selectedEventDecade,
  selectedEventYear,
  scene,
}: WhyThisFeelingBlockProps) {
  const narrativeGoalLabel = narrativeGoalLabelFor(scene.narrativeGoalId);

  const rationale = buildWhyThisFeelingRationale({
    eventTitle: selectedEventTitle,
    eventDecade: selectedEventDecade,
    eventYear: selectedEventYear,
    audience: scene.audience,
    mode: scene.mode,
    narrativeGoalId: scene.narrativeGoalId,
    signatureState: output.signatureState,
    winningFamily: output.winningFamily,
  });

  return (
    <section
      aria-labelledby="resolver-why-heading"
      className="mt-5 rounded-md border border-border bg-panel/60 p-3"
    >
      <h3
        id="resolver-why-heading"
        className="font-mono text-[10px] uppercase tracking-widest text-gold"
      >
        {WHY_THIS_FEELING_LABEL}
      </h3>
      <p className="mt-1.5 font-mono text-[10px] text-textmuted">
        {RESOLVER_LIVE_NOTE}
      </p>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-textmuted">
        {INPUTS_LABEL}
      </p>
      <dl className="mt-2 space-y-2 text-xs">
        <div className="flex items-baseline gap-2">
          <dt className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-textmuted">
            Event
          </dt>
          <dd className="font-body text-xs text-text">
            {selectedEventTitle}
            {typeof selectedEventYear === "number" && (
              <span className="ml-1 font-mono text-textmuted">
                ({selectedEventYear}
                {selectedEventDecade ? ` · ${selectedEventDecade}` : ""})
              </span>
            )}
          </dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-textmuted">
            Audience
          </dt>
          <dd className="font-body text-xs text-text">{scene.audience}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-textmuted">
            Mode
          </dt>
          <dd className="font-body text-xs text-text">{scene.mode}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-textmuted">
            Goal
          </dt>
          <dd className="font-body text-xs text-text">{narrativeGoalLabel}</dd>
        </div>
      </dl>

      <p className="mt-3 font-serif text-sm italic leading-relaxed text-text">
        {rationale}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// ResolverPanel
// ---------------------------------------------------------------------------

export function ResolverPanel({ output }: ResolverPanelProps) {
  const [revealed, setRevealed] = useState(false);
  const { draft } = useTwin();
  const { selectedEventId, scene } = useStudio();

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

  // Resolve the selected event off the draft so the "Why this feeling?"
  // block has the title + decade + year to render. Owned here (not in
  // StudioContext) so the panel stays the only place that knows how the
  // inputs are presented; if the event vanished under the selection we
  // degrade gracefully and just skip the block.
  const selectedEvent = draft?.timeline.find((e) => e.id === selectedEventId);

  const steeringTag =
    output?.beats[output.beats.length - 1]?.steeringTag ?? "—";

  // Sanity check the narrative goal id resolves — protects the rendering
  // from a malformed scene snapshot (e.g. legacy persisted state).
  const sceneHasValidGoal = NARRATIVE_GOAL_OPTIONS.some(
    (g) => g.id === scene.narrativeGoalId,
  );

  return (
    <aside className="flex h-full flex-col bg-panel p-4 lg:border-l lg:border-border">
      <div className="hidden items-center gap-1.5 lg:flex">
        <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
          Resolver
        </p>
        <InfoTip label={RESOLVER_LABEL} description={RESOLVER_DESCRIPTION} />
      </div>

      {!active ? (
        <EmptyState
          className="mt-6 flex-1 justify-center"
          eyebrow="Resolver"
          title="Awaiting event"
          description="Select an event to activate the resolver."
        />
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

          {/* === Cinematic header: family + signature state + steering tag === */}
          <header>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
                {RESOLVED_FEELING_EYEBROW}
              </p>
              <InfoTip
                label={EMOTIONAL_STATE_LABEL}
                description={EMOTIONAL_STATE_DESCRIPTION}
              />
            </div>
            <p className="mt-1 font-display text-2xl leading-tight text-text">
              {output.signatureState}
            </p>
            <p className="mt-1 font-mono text-xs text-textsub">
              <span className="text-textmuted">{WINNING_FAMILY_LABEL}:</span>{" "}
              {output.winningFamily} · {output.direction}
            </p>

            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
                  {STEERING_TAG_LABEL}
                </p>
                <InfoTip
                  label={STEERING_TAG_LABEL}
                  description={STEERING_TAG_DESCRIPTION}
                />
              </div>
              <div className="mt-2">
                <Badge variant="gold">{steeringTag}</Badge>
              </div>
              <p className="mt-2 font-body text-xs leading-snug text-textmuted">
                {STEERING_TAG_INLINE_HELPER}
              </p>
            </div>
          </header>

          {/* === The four axes — Intensity / Warmth / Pacing / Confidence === */}
          <div
            className="mt-5 space-y-4"
            role="group"
            aria-label="Resolver axes"
          >
            <AxisRow
              label="Intensity"
              value={output.intensity}
              description={INTENSITY_DESCRIPTION}
              labelTrailing={
                <InfoTip
                  label={INTENSITY_LABEL}
                  description={INTENSITY_DESCRIPTION}
                />
              }
            />
            <AxisRow
              label="Warmth"
              value={output.warmth}
              description={WARMTH_DESCRIPTION}
              labelTrailing={
                <InfoTip
                  label={WARMTH_LABEL}
                  description={WARMTH_DESCRIPTION}
                />
              }
            />
            <AxisRow
              label="Pacing"
              value={output.pacing}
              description={PACING_DESCRIPTION}
              labelTrailing={
                <InfoTip
                  label={PACING_LABEL}
                  description={PACING_DESCRIPTION}
                />
              }
            />
            <AxisRow
              label="Confidence"
              value={output.confidence}
              description={CONFIDENCE_DESCRIPTION}
              labelTrailing={
                <InfoTip
                  label={CONFIDENCE_LABEL}
                  description={CONFIDENCE_DESCRIPTION}
                />
              }
            />
          </div>

          {/* === Why this feeling? === */}
          {selectedEvent && sceneHasValidGoal && (
            <WhyThisFeelingBlock
              output={output}
              selectedEventTitle={selectedEvent.title}
              selectedEventDecade={selectedEvent.decade}
              selectedEventYear={selectedEvent.year}
              scene={scene}
            />
          )}

          {/* === Emotional arc viz === */}
          <EmotionalArcViz output={output} />
        </div>
      )}
    </aside>
  );
}
