import type { ReactNode } from "react";

export interface ResponsivePanelProps {
  /**
   * Visible header label (e.g. "Twin context", "Resolved feeling").
   * Always rendered; on mobile it doubles as the disclosure toggle.
   */
  title: string;
  /**
   * One-line "what you'd see if you opened me" summary, used only on mobile
   * when the body is collapsed. Keep it short — `12 events · 2 flagged`.
   */
  summary?: string;
  /**
   * Whether the body should be initially expanded on mobile.
   * Defaults to false so the studio's primary work area dominates the
   * viewport on phones.
   */
  defaultOpen?: boolean;
  /**
   * Tailwind breakpoint at which the disclosure stops collapsing and just
   * stays open as a normal panel. Defaults to `lg` (1024px), which is where
   * the Voice Studio's 3-column layout kicks in.
   */
  alwaysOpenFrom?: "md" | "lg" | "xl";
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * A disclosure that collapses on phones/tablets and stays open on wider
 * breakpoints. Backed by the native `<details>` element so it works without
 * JS, ships free a11y semantics (`aria-expanded` via the browser, keyboard
 * support), and degrades gracefully.
 *
 * Used by Voice Studio to keep `TwinContextPanel` and `ResolverPanel`
 * accessible on mobile without forcing the user to scroll through both of
 * them to reach the center stage.
 *
 * On `alwaysOpenFrom`+ we force `open` to true via inline JS so the user
 * can't accidentally close it on desktop, where there's no point — and we
 * hide the chevron so the header looks like a static eyebrow.
 */
export function ResponsivePanel({
  title,
  summary,
  defaultOpen = false,
  alwaysOpenFrom = "lg",
  className = "",
  bodyClassName = "",
  children,
}: ResponsivePanelProps) {
  // `data-always-open-from` is read by the small CSS rule in `index.css`
  // (`.responsive-panel[data-always-open-from="lg"]`) which forces the body
  // open and hides the summary at the chosen breakpoint without JS.
  return (
    <details
      open={defaultOpen}
      data-always-open-from={alwaysOpenFrom}
      className={["responsive-panel group/disc bg-panel", className].join(" ")}
    >
      <summary
        className={[
          "flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 px-4 py-3",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        ].join(" ")}
      >
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
            {title}
          </p>
          {summary && (
            <p className="mt-0.5 truncate font-mono text-[11px] text-textsub group-open/disc:hidden">
              {summary}
            </p>
          )}
        </div>
        <span
          aria-hidden="true"
          className="font-mono text-xs text-textmuted transition-transform group-open/disc:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className={bodyClassName}>{children}</div>
    </details>
  );
}
