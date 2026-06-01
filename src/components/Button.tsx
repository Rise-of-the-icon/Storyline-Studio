import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "small";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-bg hover:bg-gold/90 border border-gold focus:ring-gold",
  secondary:
    "bg-transparent text-text border border-bordermid hover:bg-hover focus:ring-gold",
  ghost: "bg-transparent text-textsub hover:bg-hover border border-transparent focus:ring-gold",
  danger:
    "bg-dangerfaint text-danger border border-danger/40 hover:bg-danger/20 focus:ring-danger",
};

const sizeClass: Record<ButtonSize, string> = {
  default: "min-h-[44px] px-4 py-2 text-sm",
  small: "min-h-[36px] px-3 py-1.5 text-xs",
};

export function Button({
  variant = "secondary",
  size = "default",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-md font-body font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
