import { useId, useState, type ReactNode } from "react";

export interface TooltipProps {
  label: string;
  content: ReactNode;
  children: ReactNode;
}

export function Tooltip({ label, content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border border-border bg-panel p-3 shadow-lg"
        >
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-textmuted">
            {label}
          </span>
          <span className="block font-body text-xs text-textsub">{content}</span>
        </span>
      )}
    </span>
  );
}
