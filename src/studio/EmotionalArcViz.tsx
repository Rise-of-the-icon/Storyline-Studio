import type { ResolverOutput } from "../types/resolver";

export interface EmotionalArcVizProps {
  output: ResolverOutput;
}

const W = 220;
const H = 88;
const PAD = 12;

export function EmotionalArcViz({ output }: EmotionalArcVizProps) {
  const beats = output.beats;
  if (beats.length === 0) return null;

  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const step = beats.length > 1 ? innerW / (beats.length - 1) : 0;

  const points = beats.map((beat, i) => {
    const x = PAD + (beats.length > 1 ? i * step : innerW / 2);
    const y = PAD + innerH - (beat.intensity / 100) * innerH;
    return { x, y, beat };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <figure className="mt-4">
      <figcaption className="mb-2 font-mono text-[10px] uppercase tracking-widest text-textmuted">
        Emotional arc · {output.direction}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-md border border-border bg-card"
        aria-label={`Emotional arc, ${output.direction} direction`}
      >
        <line
          x1={PAD}
          y1={H - PAD}
          x2={W - PAD}
          y2={H - PAD}
          stroke="currentColor"
          strokeOpacity={0.15}
        />
        <polyline
          points={polyline}
          fill="none"
          stroke="#c9a84c"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {points.map((p) => (
          <g key={`${p.beat.role}-${p.beat.state}`}>
            <circle cx={p.x} cy={p.y} r={5} fill="#c9a84c" />
            <text
              x={p.x}
              y={H - 2}
              textAnchor="middle"
              fill="#5a5a78"
              fontSize={8}
              fontFamily="'Space Mono', monospace"
            >
              {p.beat.role.slice(0, 4)}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
