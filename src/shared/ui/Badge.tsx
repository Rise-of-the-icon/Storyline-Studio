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
  // Advisory (e.g. disambiguation, needs review).
  warning: "border-warning/40 bg-warningfaint text-warning",
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
