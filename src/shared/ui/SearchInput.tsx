import { forwardRef, type InputHTMLAttributes } from "react";

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Visually hidden label for screen readers. */
  label?: string;
}

/**
 * Large search field used on S1. Wraps the `text-input` + touch-target
 * shell and keeps combobox ARIA on the caller.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { label = "Search by name", id, className = "", ...props },
    ref,
  ) {
    const inputId = id ?? "search-input";

    return (
      <label className="block">
        <span className="sr-only">{label}</span>
        <input
          ref={ref}
          id={inputId}
          type="search"
          className={[
            "text-input min-h-touch w-full rounded-lg border border-border bg-card px-4 py-3 font-body text-text placeholder:text-textmuted",
            "focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40",
            className,
          ].join(" ")}
          {...props}
        />
      </label>
    );
  },
);
