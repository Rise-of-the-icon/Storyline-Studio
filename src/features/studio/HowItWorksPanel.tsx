import { useEffect, useRef, useState } from "react";
import {
  HOW_IT_WORKS_INTRO,
  HOW_IT_WORKS_STEPS,
  HOW_IT_WORKS_TITLE,
} from "./studioCopy";

const STORAGE_KEY = "ricon.studio.how-it-works.open";

/**
 * Read the persisted open/closed state. Defaults to `true` so first-time
 * visitors always see the overview. Subsequent visits remember the producer's
 * last interaction.
 *
 * Tolerates a missing `localStorage` (SSR / private mode) by returning `true`.
 */
function readPersistedOpen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw !== "0";
  } catch {
    return true;
  }
}

function persistOpen(open: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    // localStorage may be unavailable; remembering is a nicety, not a contract.
  }
}

/**
 * "How this works" overview shown on the Voice Studio entry surface.
 *
 * Native `<details>` element so we get keyboard support and `aria-expanded`
 * for free. Open by default on first visit; subsequent open/close gets
 * remembered in `localStorage` per producer device.
 */
export function HowItWorksPanel() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(true);

  // Hydrate from localStorage on mount; SSR-safe.
  useEffect(() => {
    setOpen(readPersistedOpen());
  }, []);

  return (
    <details
      ref={detailsRef}
      open={open}
      onToggle={(e) => {
        const next = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(next);
        persistOpen(next);
      }}
      className="group/howit mb-4 rounded-lg border border-border bg-panel"
      aria-label={HOW_IT_WORKS_TITLE}
    >
      <summary
        className={[
          "flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 px-4 py-3",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        ].join(" ")}
      >
        <div className="min-w-0">
          <p className="label-mono text-gold">
            {HOW_IT_WORKS_TITLE}
          </p>
          <p className="mt-0.5 truncate font-body text-xs text-textsub">
            <span className="hidden group-open/howit:inline">Tap to collapse.</span>
            <span className="group-open/howit:hidden">
              Tap to read the four steps.
            </span>
          </p>
        </div>
        <span
          aria-hidden="true"
          className="font-mono text-xs text-textmuted transition-transform group-open/howit:rotate-180"
        >
          ▾
        </span>
      </summary>

      <div className="border-t border-border px-4 py-4">
        <p className="font-body text-sm leading-relaxed text-textsub">
          {HOW_IT_WORKS_INTRO}
        </p>

        <ol
          className="mt-4 space-y-3"
          aria-label="Four steps to a producer-ready voice context"
        >
          {HOW_IT_WORKS_STEPS.map((step) => (
            <li
              key={step.index}
              className="flex gap-3 rounded-md border border-border bg-card p-3"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold bg-goldfaint font-mono text-xs text-gold"
                aria-hidden="true"
              >
                {step.index}
              </span>
              <div className="min-w-0">
                <p className="font-body text-sm font-medium text-text">
                  <span className="sr-only">Step {step.index}: </span>
                  {step.title}
                </p>
                <p className="mt-1 font-body text-xs leading-snug text-textsub">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
