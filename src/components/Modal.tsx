import { useEffect, useId, useRef, type ReactNode } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
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
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-xl border border-border bg-panel shadow-xl sm:rounded-xl"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id={titleId} className="font-display text-xl text-text">
            {title}
          </h2>
          <Button variant="ghost" size="small" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </header>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <footer className="border-t border-border px-4 py-3">{footer}</footer>
        )}
      </div>
    </div>
  );
}
