import type { ResolverOutput } from "../types/resolver";
import { ARC_POSITION_LABELS } from "./studioCopy";
import { arcPositionsFor, buildArcAccessibleSummary } from "./whyThisFeeling";

export interface EmotionalArcVizProps {
  output: ResolverOutput;
}

// SVG layout. The viewBox is wider + taller than before so we can fit the
// Open/Build/Peak labels above the chart and the beat-role labels below
// without crowding the line itself. The element still scales to its
// container width via Tailwind's `w-full`, so on a 320px phone the chart
// renders at roughly 320×130 css px — chart line ~84 css px tall, which
// reads cleanly even on a small viewport without horizontal-scroll bleed.
const W = 260;
const H = 120;
const PAD_X = 16;
// Headroom for the position labels (Open / Build / Peak) at the top.
const PAD_TOP = 22;
// Footroom for the beat-role labels at the bottom.
const PAD_BOTTOM = 18;

export function EmotionalArcViz({ output }: EmotionalArcVizProps) {
  const beats = output.beats;
  if (beats.length === 0) return null;

  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const step = beats.length > 1 ? innerW / (beats.length - 1) : 0;

  const positions = arcPositionsFor(beats);
  const accessibleSummary = buildArcAccessibleSummary(output);

  const points = beats.map((beat, i) => {
    const x = PAD_X + (beats.length > 1 ? i * step : innerW / 2);
    const y = PAD_TOP + innerH - (beat.intensity / 100) * innerH;
    return { x, y, beat, position: positions[i] };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Pick a single x-position for each of Open / Build / Peak so the section
  // label can sit above the corresponding part of the chart. We use the
  // *first* index that owns each tag (so a 3-beat arc with [open, build,
  // peak] reads cleanly; a 1-beat arc only shows "Peak"). The most-intense
  // beat is tagged Peak by `arcPositionsFor` even when it falls mid-arc,
  // so the label always tracks the visual high point.
  const firstIndexFor = (tag: keyof typeof ARC_POSITION_LABELS) =>
    positions.indexOf(tag);

  const arcLabelEntries: { tag: keyof typeof ARC_POSITION_LABELS; x: number }[] = [];
  (["open", "build", "peak"] as const).forEach((tag) => {
    const idx = firstIndexFor(tag);
    if (idx >= 0) {
      arcLabelEntries.push({ tag, x: points[idx]!.x });
    }
  });

  return (
    <figure className="mt-5">
      <figcaption className="mb-2 font-mono text-[10px] uppercase tracking-widest text-textmuted">
        Emotional arc · {output.direction}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full rounded-md border border-border bg-card"
        role="img"
        aria-label={accessibleSummary}
        // `preserveAspectRatio` lets the chart grow with its container width
        // while keeping the line shape recognizable on the narrowest phones.
        preserveAspectRatio="xMidYMid meet"
      >
        {/* SR-only title + desc give NVDA/JAWS a clean two-tier readout. */}
        <title>Emotional arc</title>
        <desc>{accessibleSummary}</desc>

        {/* === Open / Build / Peak section labels === */}
        {arcLabelEntries.map(({ tag, x }) => (
          <text
            key={`label-${tag}`}
            x={x}
            y={12}
            textAnchor="middle"
            fill="#888fad"
            fontSize={9}
            fontFamily="'Space Mono', monospace"
            fontWeight={600}
            letterSpacing={0.6}
            // The label is visible chrome; we don't hide it from the AX tree
            // because the per-section semantics ("this is the Peak") aren't
            // duplicated elsewhere on the panel.
          >
            {ARC_POSITION_LABELS[tag].toUpperCase()}
          </text>
        ))}

        {/* === baseline === */}
        <line
          x1={PAD_X}
          y1={H - PAD_BOTTOM}
          x2={W - PAD_X}
          y2={H - PAD_BOTTOM}
          stroke="currentColor"
          strokeOpacity={0.15}
        />

        {/* === arc polyline === */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#c9a84c"
          strokeWidth={2.25}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* === per-beat dots + beat role labels === */}
        {points.map((p) => (
          <g key={`${p.beat.role}-${p.beat.state}`}>
            <circle cx={p.x} cy={p.y} r={4.5} fill="#c9a84c" />
            <text
              x={p.x}
              y={H - 4}
              textAnchor="middle"
              fill="#888fad"
              fontSize={9}
              fontFamily="'Space Mono', monospace"
            >
              {p.beat.role.slice(0, 6)}
            </text>
          </g>
        ))}
      </svg>
      {/* Repeat the accessible summary as visible muted copy on phone widths
          so producers reading the panel collapsed don't have to expand the
          arc to read its shape. Hidden from SR (already on the SVG). */}
      <p
        className="mt-2 font-mono text-[10px] leading-snug text-textmuted sm:hidden"
        aria-hidden="true"
      >
        {accessibleSummary}
      </p>
    </figure>
  );
}
