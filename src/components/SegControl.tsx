export interface SegControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegControlProps<T extends string> {
  label: string;
  value: T;
  options: SegControlOption<T>[];
  onChange: (value: T) => void;
}

export function SegControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegControlProps<T>) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-textmuted">
        {label}
      </p>
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
                "min-h-[36px] rounded-md px-2.5 font-mono text-[10px] uppercase tracking-wide transition-colors sm:px-3 sm:text-xs",
                "focus:outline-none focus:ring-2 focus:ring-gold",
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
    </div>
  );
}
