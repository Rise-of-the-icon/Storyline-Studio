import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export type CardState =
  | "default"
  | "reviewed"
  | "rejected"
  | "deferred"
  | "needs-review"
  | "flagged";

type CardElement = "div" | "button" | "article" | "li";

const STATE_SURFACE: Record<CardState, string> = {
  default: "border-border bg-card",
  reviewed: "border-ok/40 bg-ok/5",
  rejected: "border-danger/40 bg-dangerfaint",
  deferred: "border-bordermid bg-panel/40",
  "needs-review": "border-border bg-card",
  flagged: "border-danger/40 bg-card",
};

export interface CardProps
  extends HTMLAttributes<HTMLElement>,
    Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled"> {
  as?: CardElement;
  selectable?: boolean;
  selected?: boolean;
  state?: CardState;
  children: ReactNode;
}

function cardRootClass({
  selectable,
  selected,
  disabled,
  state = "default",
  className = "",
}: {
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  state?: CardState;
  className?: string;
}): string {
  return [
    "interactive-card rounded-lg border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-150",
    STATE_SURFACE[state],
    selectable ? "interactive-card-selectable cursor-pointer" : "",
    selected ? "interactive-card-selected" : "",
    disabled ? "interactive-card-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

const CardRoot = forwardRef<HTMLElement, CardProps>(function CardRoot(
  {
    as: Component = "div",
    selectable,
    selected,
    disabled,
    state = "default",
    className = "",
    children,
    ...props
  },
  ref,
) {
  return (
    <Component
      ref={ref as never}
      className={cardRootClass({
        selectable,
        selected,
        disabled,
        state,
        className,
      })}
      {...props}
    >
      {children}
    </Component>
  );
});

// ---------------------------------------------------------------------------
// Composition slots
// ---------------------------------------------------------------------------

export interface CardHeaderProps {
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

function CardHeader({
  eyebrow,
  actions,
  children,
  className = "",
}: CardHeaderProps) {
  return (
    <div
      className={["flex flex-wrap items-start justify-between gap-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="label-mono">{eyebrow}</p>}
        {children}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-1">{actions}</div>
      )}
    </div>
  );
}

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

function CardTitle({
  id,
  children,
  className = "",
  ...props
}: CardTitleProps) {
  return (
    <h3
      id={id}
      className={["font-body font-medium text-text", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </h3>
  );
}

export interface CardMetaProps {
  children: ReactNode;
  className?: string;
}

function CardMeta({ children, className = "" }: CardMetaProps) {
  return (
    <p
      className={["mt-1 font-mono text-xs text-textsub", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </p>
  );
}

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

function CardBody({ children, className = "" }: CardBodyProps) {
  return (
    <div
      className={["mt-2 font-body text-sm text-textsub", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function CardFooter({
  children,
  className = "",
  ...props
}: CardFooterProps) {
  return (
    <div
      className={["mt-4 flex flex-wrap gap-2", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Meta: CardMeta,
  Body: CardBody,
  Footer: CardFooter,
});
