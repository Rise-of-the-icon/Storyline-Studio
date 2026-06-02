import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Thin wrapper over `Modal` for two-button confirm flows (e.g. "Leave this
 * draft?"). Returns focus to the trigger via `Modal`'s focus trap; uses the
 * destructive variant when the action would lose user work.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" size="small" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            size="small"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="font-body text-sm text-textsub">{description}</div>
    </Modal>
  );
}
