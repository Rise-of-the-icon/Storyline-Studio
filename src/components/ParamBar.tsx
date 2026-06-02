import type { ReactNode } from "react";

export interface ParamBarProps {
  label: string;
  value: number;
  /**
   * Optional content rendered next to the label, e.g. an `<InfoTip>` trigger
   * that opens a `<Tooltip>` explaining the axis.
   */
  labelTrailing?: ReactNode;
}

export function ParamBar({ label, value, labelTrailing }: ParamBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wide text-textmuted">
        <span className="inline-flex items-center gap-1.5">
          <span>{label}</span>
          {labelTrailing}
        </span>
        <span className="text-textsub">{clamped}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full border border-border bg-card"
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} ${clamped} out of 100`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-bluedim to-gold transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
