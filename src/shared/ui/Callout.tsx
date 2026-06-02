import type { ReactNode } from "react";

export type CalloutTone = "info" | "warning" | "neutral";

export interface CalloutProps {
  tone?: CalloutTone;
  /** Small mono uppercase eyebrow above the body. */
  eyebrow?: string;
  children: ReactNode;
  /** Optional id for aria-labelledby wiring. */
  id?: string;
  className?: string;
  role?: "note" | "status" | "alert";
}

const TONE_STYLES: Record<
  CalloutTone,
  { surface: string; eyebrow: string; body: string }
> = {
  info: {
    surface: "border-blue/40 bg-bluefaint",
    eyebrow: "text-lightblue",
    body: "text-text",
  },
  warning: {
    surface: "border-gold/40 bg-goldfaint",
    eyebrow: "text-gold",
    body: "text-text",
  },
  neutral: {
    surface: "border-bordermid bg-panel",
    eyebrow: "text-textmuted",
    body: "text-textsub",
  },
};

/**
 * Inline advisory / status block — replaces hand-built gold callouts
 * scattered through S1, S3, and SS2.
 */
export function Callout({
  tone = "warning",
  eyebrow,
  children,
  id,
  className = "",
  role = "note",
}: CalloutProps) {
  const { surface, eyebrow: eyebrowClass, body } = TONE_STYLES[tone];

  return (
    <div
      id={id}
      role={role}
      className={[
        "rounded-lg border px-4 py-3",
        surface,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow && (
        <p
          className={["label-mono", eyebrowClass].join(" ")}
        >
          {eyebrow}
        </p>
      )}
      <div
        className={[
          "font-body text-sm",
          eyebrow ? "mt-1" : "",
          body,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
