import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
  type AriaAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

export interface TooltipProps {
  label: string;
  content: ReactNode;
  children: ReactNode;
}

/**
 * Custom tooltip primitive. Honours WCAG 2.1 SC 1.4.13 (Content on Hover or
 * Focus):
 *  - Dismissable: pressing Escape hides the tooltip without moving focus.
 *  - Hoverable:   shows on mouseenter, stays visible while the mouse is over
 *                 the trigger or the tooltip body (we read pointer events on
 *                 the wrapper, which encloses both).
 *  - Persistent:  remains until the trigger loses focus, the user moves the
 *                 mouse away, or Escape is pressed. Never auto-dismisses on
 *                 a timer.
 *
 * Wraps its child(ren) in an outer `<span>` that proxies focus / hover so
 * any focusable child (e.g. a `<button>`) will trigger the tooltip when
 * keyboard users tab to it.
 *
 * If exactly one React element is passed as a child, we clone it to put
 * `aria-describedby={tooltipId}` directly on the focusable element while the
 * tooltip is open. That way assistive tech announces the description for the
 * focused trigger itself (the spec doesn't propagate ARIA via ancestors).
 */
export function Tooltip({ label, content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  // Global Escape dismiss while the tooltip is open. We listen on document
  // (not the wrapper) because keyboard events with no focused descendant —
  // e.g. hovered via mouse, then Escape — wouldn't bubble through the span.
  useEffect(() => {
    if (!open) return;
    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Belt-and-braces: also dismiss on Escape from within the wrapper so the
  // event doesn't propagate (e.g. closing a wrapping Modal) when the tooltip
  // is the only thing the user wanted to dismiss.
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
    }
  };

  // If the consumer passed a single element child, clone it and inject
  // `aria-describedby` so screen readers announce the description against
  // the focused trigger (button/link). Compose with any existing
  // aria-describedby the child already had.
  let describedChild: ReactNode = children;
  const onlyChild = Children.toArray(children).find(isValidElement);
  if (
    Children.count(children) === 1 &&
    isValidElement(onlyChild) &&
    open
  ) {
    const childProps = onlyChild.props as AriaAttributes & {
      "aria-describedby"?: string;
    };
    const existing = childProps["aria-describedby"];
    const merged = existing ? `${existing} ${id}` : id;
    describedChild = cloneElement(
      onlyChild as ReactElement<{ "aria-describedby"?: string }>,
      { "aria-describedby": merged },
    );
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={onKeyDown}
    >
      {/*
        Fallback aria-describedby on the wrapper for the multi-child case
        where we can't safely clone a single focusable element. Single-element
        children get the ARIA injected directly above (the spec-compliant
        path). Both paths leave the wrapper hidden from AX.
      */}
      <span aria-describedby={open && describedChild === children ? id : undefined}>
        {describedChild}
      </span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border border-border bg-panel p-3 shadow-lg"
        >
          <span className="mb-1 block label-mono">
            {label}
          </span>
          <span className="block font-body text-xs text-textsub">{content}</span>
        </span>
      )}
    </span>
  );
}
