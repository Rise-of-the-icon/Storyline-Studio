import type { ReactNode } from "react";
import { Button } from "@/shared/ui/Button";

export interface WizardActionBarAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Optional aria-describedby target id for disabled primary CTAs. */
  describedBy?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "small";
  /** Extra aria-label when visible label is abbreviated. */
  ariaLabel?: string;
}

export interface WizardActionBarProps {
  back: WizardActionBarAction;
  /** Optional secondary back (e.g. studio inner step Back). */
  secondaryBack?: WizardActionBarAction;
  primary: WizardActionBarAction;
  /** Center helper copy — hidden on xs, shown sm+. */
  helper?: ReactNode;
  /** Mobile-only helper below the button row. */
  helperMobile?: ReactNode;
  /** `fixed` for wizard screens with pb-action-bar body; `sticky` for studio. */
  position?: "fixed" | "sticky";
  maxWidthClass?: string;
}

/**
 * Shared sticky/fixed footer shell for wizard + studio forward/back flows.
 */
export function WizardActionBar({
  back,
  secondaryBack,
  primary,
  helper,
  helperMobile,
  position = "fixed",
  maxWidthClass = "max-w-[680px]",
}: WizardActionBarProps) {
  const positionClass =
    position === "fixed"
      ? "fixed bottom-0 left-0 right-0"
      : "sticky bottom-0";

  return (
    <footer
      className={[
        positionClass,
        "border-t border-border bg-surface/95 pb-safe backdrop-blur-sm",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto flex items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:py-4",
          maxWidthClass,
        ].join(" ")}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant={back.variant ?? "ghost"}
            size={back.size ?? "default"}
            onClick={back.onClick}
            disabled={back.disabled}
            aria-label={back.ariaLabel}
            className={["touch-target", back.className ?? ""].join(" ")}
          >
            {back.label}
          </Button>
          {secondaryBack && (
            <Button
              variant={secondaryBack.variant ?? "secondary"}
              size={secondaryBack.size ?? "small"}
              onClick={secondaryBack.onClick}
              disabled={secondaryBack.disabled}
              aria-label={secondaryBack.ariaLabel}
              className={["touch-target", secondaryBack.className ?? ""].join(" ")}
            >
              {secondaryBack.label}
            </Button>
          )}
        </div>
        {helper && (
          <p className="hidden flex-1 text-center font-mono text-xs text-textsub sm:block">
            {helper}
          </p>
        )}
        <Button
          variant={primary.variant ?? "primary"}
          size={primary.size ?? "default"}
          onClick={primary.onClick}
          disabled={primary.disabled}
          aria-describedby={primary.describedBy}
          aria-label={primary.ariaLabel}
          className={["touch-target shrink-0", primary.className ?? ""].join(" ")}
        >
          {primary.label}
        </Button>
      </div>
      {helperMobile && (
        <p className="px-4 pb-2 text-center meta-mono text-textmuted sm:hidden">
          {helperMobile}
        </p>
      )}
    </footer>
  );
}
