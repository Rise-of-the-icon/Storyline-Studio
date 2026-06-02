import type { ReactNode } from "react";

export interface SegControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegControlProps<T extends string> {
  label: string;
  value: T;
  options: SegControlOption<T>[];
  onChange: (value: T) => void;
  /**
   * Optional content rendered next to the label, e.g. an `<InfoTip>` trigger
   * that opens a `<Tooltip>` explaining the term.
   */
  labelTrailing?: ReactNode;
  /**
   * Optional helper paragraph rendered beneath the control. Used for
   * critical concepts where mobile users should be able to read the
   * explanation without tapping a tooltip trigger.
   */
  helper?: ReactNode;
}

export function SegControl<T extends string>({
  label,
  value,
  options,
  onChange,
  labelTrailing,
  helper,
}: SegControlProps<T>) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <p className="label-mono">
          {label}
        </p>
        {labelTrailing}
      </div>
      <div
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1"
        role="group"
        aria-label={label}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={[
                "min-h-touch rounded-md px-3 font-mono text-[11px] uppercase tracking-wide transition-colors sm:min-h-[36px] sm:px-3 sm:text-xs",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                selected
                  ? "bg-goldfaint text-gold"
                  : "text-textsub hover:bg-hover hover:text-text",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {helper && (
        <p className="mt-2 font-body text-xs leading-snug text-textsub">
          {helper}
        </p>
      )}
    </div>
  );
}
