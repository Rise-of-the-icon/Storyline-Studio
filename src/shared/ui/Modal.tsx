import { useEffect, useId, useRef, type ReactNode } from "react";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import { Button } from "./Button";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      panelRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={[
          "relative z-10 flex w-full flex-col border border-border bg-panel shadow-xl",
          // Mobile (default): fill the dynamic viewport so iOS URL-bar changes
          // don't clip the footer. Bottom safe-area inset moves to the inner
          // footer so the dialog body still uses the full height.
          "h-dvh max-h-dvh rounded-t-xl",
          // Tablet+: classic centered dialog.
          "sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-xl",
        ].join(" ")}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 pt-safe">
          <h2 id={titleId} className="font-display text-xl text-text">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="small"
            onClick={onClose}
            aria-label="Close"
            className="touch-target"
          >
            ✕
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <footer className="shrink-0 border-t border-border px-4 py-3 pb-safe">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
