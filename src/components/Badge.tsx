import type { ReactNode } from "react";

type BadgeVariant = "gold" | "blue" | "ok" | "danger" | "muted" | "warning";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantClass: Record<BadgeVariant, string> = {
  gold: "border-gold/40 bg-goldfaint text-gold",
  blue: "border-blue/40 bg-bluefaint text-lightblue",
  ok: "border-ok/40 bg-okfaint text-ok",
  danger: "border-danger/40 bg-dangerfaint text-danger",
  muted: "border-border bg-panel text-textsub",
  // Advisory (e.g. disambiguation). Uses Tailwind amber to stay distinct
  // from gold (music domain) and danger (errors); see Badge.tsx note.
  warning: "border-amber-500/40 bg-amber-950/40 text-amber-300",
};

export function Badge({ variant = "muted", children }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        variantClass[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
