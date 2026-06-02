import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  /** Danger-tone inline error. Renders below with `role="alert"`. */
  error?: string;
  /** Muted helper text. Hidden when `error` is present. */
  helper?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    { label, error, helper, id, className = "", disabled, ...props },
    ref,
  ) {
    const inputId = id ?? `checkbox-${String(label).replace(/\s+/g, "-").toLowerCase()}`;
    const helperId = helper ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div>
        <label
          htmlFor={inputId}
          className={[
            "flex cursor-pointer items-start gap-3",
            disabled ? "cursor-not-allowed opacity-60" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            disabled={disabled}
            className="mt-1 h-5 w-5 min-h-[20px] min-w-[20px] shrink-0 rounded border-border bg-panel accent-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-invalid={Boolean(error)}
            aria-describedby={
              [errorId, helperId].filter(Boolean).join(" ") || undefined
            }
            {...props}
          />
          <span className="font-body text-sm text-text">{label}</span>
        </label>
        {error ? (
          <p
            id={errorId}
            className="mt-1 font-mono text-xs text-danger"
            role="alert"
          >
            {error}
          </p>
        ) : helper ? (
          <p
            id={helperId}
            className="mt-1 meta-mono text-textmuted"
          >
            {helper}
          </p>
        ) : null}
      </div>
    );
  },
);
