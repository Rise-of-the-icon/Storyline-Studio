import { useEffect, useMemo, useState } from "react";
import { sanitizeCustomMomentFields } from "../lib/sanitize";
import type { CustomMoment, Sensitivity, Visibility } from "../types/twin";
import { Button } from "./Button";
import { Input } from "./Input";
import { Modal } from "./Modal";
import { SegControl } from "./SegControl";
import { Textarea } from "./Textarea";

export interface CustomMomentFormValues {
  title: string;
  date: string;
  description: string;
  emotionalSignificance: string;
  sourceNotes: string;
  visibility: Visibility;
  sensitivity: Sensitivity;
}

export interface CustomMomentSavePayload {
  moment: Omit<CustomMoment, "id"> & { id?: string };
  injectionFlagged: boolean;
}

export interface CustomMomentDrawerProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: CustomMoment;
  onClose: () => void;
  onSave: (payload: CustomMomentSavePayload) => void;
}

const VISIBILITY_OPTIONS: Visibility[] = ["Private", "Internal", "Public"];
const SENSITIVITY_OPTIONS: Sensitivity[] = ["Low", "Medium", "High"];

const emptyForm = (): CustomMomentFormValues => ({
  title: "",
  date: "",
  description: "",
  emotionalSignificance: "",
  sourceNotes: "",
  visibility: "Internal",
  sensitivity: "Medium",
});

export function CustomMomentDrawer({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: CustomMomentDrawerProps) {
  const [form, setForm] = useState<CustomMomentFormValues>(emptyForm);
  const [titleError, setTitleError] = useState<string | null>(null);

  const injectionPreview = useMemo(() => {
    if (!open) return false;
    return sanitizeCustomMomentFields({
      title: form.title,
      date: form.date,
      description: form.description,
      emotionalSignificance: form.emotionalSignificance,
      sourceNotes: form.sourceNotes,
    }).injectionFlagged;
  }, [open, form]);

  useEffect(() => {
    if (!open) return;
    setTitleError(null);
    if (initial) {
      setForm({
        title: initial.title,
        date: initial.date ?? "",
        description: initial.description,
        emotionalSignificance: initial.emotionalSignificance,
        sourceNotes: initial.sourceNotes,
        visibility: initial.visibility,
        sensitivity: initial.sensitivity,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, initial]);

  const handleSave = () => {
    const sanitized = sanitizeCustomMomentFields({
      title: form.title,
      date: form.date,
      description: form.description,
      emotionalSignificance: form.emotionalSignificance,
      sourceNotes: form.sourceNotes,
    });

    if (!sanitized.title) {
      setTitleError("Title is required.");
      return;
    }

    setTitleError(null);

    onSave({
      moment: {
        id: initial?.id,
        title: sanitized.title,
        date: sanitized.date,
        description: sanitized.description,
        emotionalSignificance: sanitized.emotionalSignificance,
        sourceNotes: sanitized.sourceNotes,
        visibility: form.visibility,
        sensitivity: form.sensitivity,
      },
      injectionFlagged: sanitized.injectionFlagged,
    });
  };

  return (
    <Modal
      open={open}
      title={mode === "add" ? "Add custom moment" : "Edit custom moment"}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save moment
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {injectionPreview && (
          <p
            className="rounded-md border border-bordermid bg-panel px-3 py-2 font-mono text-xs text-textsub"
            role="status"
          >
            Suspicious patterns detected — text will be sanitized on save (gate
            3). Instructions inside your copy are not executed.
          </p>
        )}
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => {
            setForm((f) => ({ ...f, title: e.target.value }));
            if (titleError) setTitleError(null);
          }}
          error={titleError ?? undefined}
          required
        />
        <Input
          label="Date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          placeholder="e.g. June 1998"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
        <Textarea
          label="Emotional significance"
          value={form.emotionalSignificance}
          onChange={(e) =>
            setForm((f) => ({ ...f, emotionalSignificance: e.target.value }))
          }
        />
        <Textarea
          label="Source notes"
          value={form.sourceNotes}
          onChange={(e) =>
            setForm((f) => ({ ...f, sourceNotes: e.target.value }))
          }
        />
        <SegControl<Visibility>
          label="Visibility"
          value={form.visibility}
          onChange={(visibility) => setForm((f) => ({ ...f, visibility }))}
          options={VISIBILITY_OPTIONS.map((v) => ({ value: v, label: v }))}
        />
        <SegControl<Sensitivity>
          label="Sensitivity"
          value={form.sensitivity}
          onChange={(sensitivity) => setForm((f) => ({ ...f, sensitivity }))}
          options={SENSITIVITY_OPTIONS.map((s) => ({ value: s, label: s }))}
        />
      </div>
    </Modal>
  );
}
