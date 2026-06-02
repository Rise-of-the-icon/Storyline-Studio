import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Danger-tone inline error. Renders below the input with `role="alert"`. */
  error?: string;
  /** Muted helper text. Hidden when `error` is present (error wins). */
  helper?: string;
  /**
   * When true, renders a visible "required" marker next to the label so
   * sighted users see the requirement, and lets the underlying `required`
   * native attribute carry the SR semantics.
   */
  required?: boolean;
  /**
   * When true, renders a "N / max" character counter below the input, in
   * mono. Counter goes red when `value.length > maxLength`. Requires
   * `maxLength` and `value` to be set.
   */
  showCounter?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helper,
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
  const counterId = showCounter ? `${inputId}-counter` : undefined;

  const value =
    typeof props.value === "string" ? props.value : String(props.value ?? "");
  const maxLength =
    typeof props.maxLength === "number" ? props.maxLength : undefined;
  const overLimit =
    showCounter && maxLength !== undefined && value.length > maxLength;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1.5 flex items-baseline justify-between gap-2 label-mono"
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
      <input
        ref={ref}
        id={inputId}
        required={required}
        className={[
          "text-input w-full rounded-md border bg-card px-3 py-2 font-body text-text placeholder:text-textmuted",
          "min-h-touch sm:min-h-0",
          "focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40",
          error || overLimit ? "border-danger" : "border-border",
          className,
        ].join(" ")}
        aria-invalid={Boolean(error || overLimit)}
        aria-required={required || undefined}
        aria-describedby={
          [errorId, helperId, counterId].filter(Boolean).join(" ") || undefined
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
});
