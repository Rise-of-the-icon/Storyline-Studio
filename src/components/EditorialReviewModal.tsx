import { useEffect, useState } from "react";
import { sanitizeFreeText } from "../lib/sanitize";
import { requiresEditorialNote } from "../lib/guardrails";
import type { GuardrailReview } from "../types/twin";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Textarea } from "./Textarea";

export interface EditorialReviewModalProps {
  open: boolean;
  review: GuardrailReview | null;
  itemTitle: string;
  sourceUrl: string;
  onClose: () => void;
  onConfirm: (review: GuardrailReview, editorialNote: string) => void;
}

export function EditorialReviewModal({
  open,
  review,
  itemTitle,
  sourceUrl,
  onClose,
  onConfirm,
}: EditorialReviewModalProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && review) {
      setNote(review.editorialNote ?? "");
      setError(null);
    }
  }, [open, review]);

  if (!review) return null;

  const noteRequired = requiresEditorialNote(review);

  const handleConfirm = () => {
    const sanitized = sanitizeFreeText(note, "editorialNote");
    if (noteRequired && !sanitized) {
      setError("Editorial note is required for high-severity flags.");
      return;
    }
    onConfirm(review, sanitized);
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Editorial review"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={noteRequired && !note.trim()}
            aria-describedby={
              noteRequired && !note.trim() ? "editorial-note-helper" : undefined
            }
          >
            Mark as editorially reviewed
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="font-body text-sm text-text">{itemTitle}</p>
          <p className="mt-1 font-mono text-xs text-gold">{review.trigger}</p>
          <p className="font-mono text-xs text-textsub">
            Severity: {review.severity}
          </p>
        </div>
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-textmuted">
            Source URL
          </p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all font-body text-sm text-lightblue hover:text-gold focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-gold"
          >
            {sourceUrl}
          </a>
        </div>
        {noteRequired && !note.trim() && (
          <p id="editorial-note-helper" className="sr-only">
            High severity — enter an editorial note before clearing this flag
          </p>
        )}
        <Textarea
          label={
            noteRequired
              ? "Editorial notes (required)"
              : "Editorial notes (optional)"
          }
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          placeholder="Producer review notes — not legal clearance."
        />
      </div>
    </Modal>
  );
}
