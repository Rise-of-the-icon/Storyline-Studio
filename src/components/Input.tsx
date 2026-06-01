import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-textmuted">
        {label}
      </label>
      <input
        id={inputId}
        className={[
          "w-full rounded-md border bg-card px-3 py-2 font-body text-sm text-text placeholder:text-textmuted",
          "focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40",
          error ? "border-danger" : "border-border",
          className,
        ].join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 font-mono text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
