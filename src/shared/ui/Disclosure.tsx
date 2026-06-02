import type { ReactNode } from "react";

export interface DisclosureProps {
  /** Summary row title (mono uppercase). */
  title: string;
  children: ReactNode;
  /** Optional one-line hint shown when collapsed. */
  summaryCollapsed?: string;
  /** Optional one-line hint shown when open. */
  summaryOpen?: string;
  /** Start expanded. */
  defaultOpen?: boolean;
  className?: string;
  bodyClassName?: string;
}

/**
 * Native `<details>` disclosure with consistent chevron + touch summary.
 */
export function Disclosure({
  title,
  children,
  summaryCollapsed,
  summaryOpen,
  defaultOpen = false,
  className = "",
  bodyClassName = "",
}: DisclosureProps) {
  return (
    <details
      open={defaultOpen || undefined}
      className={[
        "group/disclosure rounded-md border border-border bg-panel/40",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <summary
        className={[
          "flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 px-3 py-2",
          "font-mono text-[11px] uppercase tracking-widest text-textmuted",
          "hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          "[&::-webkit-details-marker]:hidden",
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block w-4 shrink-0 transition-transform group-open/disclosure:rotate-90"
          >
            ›
          </span>
          <span>{title}</span>
        </span>
        {(summaryCollapsed || summaryOpen) && (
          <span className="truncate font-mono text-[11px] normal-case tracking-normal text-textsub">
            {summaryCollapsed && (
              <span className="group-open/disclosure:hidden">
                {summaryCollapsed}
              </span>
            )}
            {summaryOpen && (
              <span className="hidden group-open/disclosure:inline">
                {summaryOpen}
              </span>
            )}
          </span>
        )}
      </summary>
      <div className={["px-3 pb-3 pt-1", bodyClassName].filter(Boolean).join(" ")}>
        {children}
      </div>
    </details>
  );
}
