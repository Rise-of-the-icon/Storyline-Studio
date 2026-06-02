import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  /** Danger-tone inline error. Renders below the field with `role="alert"`. */
  error?: string;
  /** Muted helper text. Hidden when `error` is present (error wins). */
  helper?: string;
  /**
   * Soft, non-blocking guidance — e.g. "recommended but not required". Renders
   * below the field in muted copy (no `role="alert"`). Suppressed when `error`
   * is present so producers see the blocking message first.
   */
  recommended?: string;
  /** Visible "required" marker next to the label. */
  required?: boolean;
  /**
   * Render a live "N / max" counter below the field. Requires `maxLength` +
   * `value`. Counter goes red and the field border switches to danger when
   * `value.length > maxLength`.
   */
  showCounter?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      error,
      helper,
      recommended,
      required,
      showCounter,
      id,
      className = "",
      ...props
    },
    ref,
  ) {
    const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();
    const helperId = helper ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const recommendedId = recommended ? `${inputId}-recommended` : undefined;
    const counterId = showCounter ? `${inputId}-counter` : undefined;

    const value =
      typeof props.value === "string"
        ? props.value
        : String(props.value ?? "");
    const maxLength =
      typeof props.maxLength === "number" ? props.maxLength : undefined;
    const overLimit =
      showCounter && maxLength !== undefined && value.length > maxLength;

    return (
      <div>
        <label
          htmlFor={inputId}
          className="mb-1.5 flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-textmuted"
        >
          <span>
            {label}
            {required && (
              <span aria-hidden="true" className="ml-1 text-gold">
                *
              </span>
            )}
          </span>
          {showCounter && maxLength !== undefined && (
            <span
              id={counterId}
              aria-live="polite"
              className={[
                "font-mono text-[10px] normal-case tracking-normal",
                overLimit ? "text-danger" : "text-textmuted",
              ].join(" ")}
            >
              {value.length} / {maxLength}
            </span>
          )}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          className={[
            "text-input min-h-[88px] w-full resize-y rounded-md border bg-card px-3 py-2 font-body text-text placeholder:text-textmuted",
            "focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40",
            error || overLimit ? "border-danger" : "border-border",
            className,
          ].join(" ")}
          aria-invalid={Boolean(error || overLimit)}
          aria-required={required || undefined}
          aria-describedby={
            [errorId, helperId, recommendedId, counterId]
              .filter(Boolean)
              .join(" ") || undefined
          }
          {...props}
        />
        {error ? (
          <p
            id={errorId}
            className="mt-1 font-mono text-xs text-danger"
            role="alert"
          >
            {error}
          </p>
        ) : (
          <>
            {helper && (
              <p
                id={helperId}
                className="mt-1 font-mono text-[11px] text-textmuted"
              >
                {helper}
              </p>
            )}
            {recommended && (
              <p
                id={recommendedId}
                className="mt-1 font-mono text-[11px] text-gold"
              >
                {recommended}
              </p>
            )}
          </>
        )}
      </div>
    );
  },
);
