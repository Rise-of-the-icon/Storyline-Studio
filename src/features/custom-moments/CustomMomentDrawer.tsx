import { useEffect, useId, useMemo, useRef, useState } from "react";
import { makeProducerSource } from "@/lib/contentModel";
import {
  CUSTOM_MOMENT_MEDIA_LABEL_LIMIT,
  CUSTOM_MOMENT_MEDIA_MAX_ATTACHMENTS,
  CUSTOM_MOMENT_MEDIA_TYPE_LABEL,
  createUploadedMomentMedia,
  createYouTubeMomentMedia,
  readFileAsDataUrl,
  validateCustomMomentMediaStorage,
  validateCustomMomentUpload,
  validateCustomMomentMediaInput,
} from "@/features/custom-moments/customMomentMedia";
import {
  CUSTOM_MOMENT_FIELD_LIMITS,
  CUSTOM_MOMENT_HELPER_TEXT,
  SENSITIVITY_GUIDANCE,
  VISIBILITY_GUIDANCE,
  firstErrorField,
  validateCustomMomentForm,
  type CustomMomentField,
  type CustomMomentValidationResult,
} from "@/features/custom-moments/customMomentValidation";
import { sanitizeCustomMomentFields } from "@/lib/sanitize";
import type {
  CustomMoment,
  CustomMomentMedia,
  CustomMomentMediaType,
  Sensitivity,
  Visibility,
} from "@/types/twin";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { SegControl } from "@/shared/ui/SegControl";
import { Textarea } from "@/shared/ui/Textarea";

export interface CustomMomentFormValues {
  title: string;
  date: string;
  description: string;
  emotionalSignificance: string;
  sourceNotes: string;
  sourceUrl: string;
  /**
   * Producer affirmation that the source has been corroborated. Defaults to
   * `false` so an unaffirmed moment is never silently treated as verified.
   * This is the UI contract behind the "Avoid presenting unverified custom
   * content as fact" acceptance criterion.
   */
  sourceVerified: boolean;
  media: CustomMomentMedia[];
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
  sourceUrl: "",
  sourceVerified: false,
  media: [],
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
  // `submitted` flips the first time the user clicks Save. Until then we don't
  // show field errors — producers shouldn't be yelled at while they're still
  // typing the first field.
  const [submitted, setSubmitted] = useState(false);
  // Live region announcement for SR users when save is blocked. Updated only
  // on save attempts; sighted users see the per-field errors directly.
  const [submitAnnouncement, setSubmitAnnouncement] = useState<string>("");
  const [mediaType, setMediaType] = useState<CustomMomentMediaType>("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaLabel, setMediaLabel] = useState("");
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaPending, setMediaPending] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement | null>(null);

  // Stable IDs for the Visibility / Sensitivity guidance paragraphs so we can
  // associate them with each SegControl via `aria-describedby`.
  const visibilityHelpId = useId();
  const sensitivityHelpId = useId();

  // Refs into the form so we can focus the first error on save-with-errors.
  const fieldRefs = useRef<Record<CustomMomentField, HTMLElement | null>>({
    title: null,
    date: null,
    description: null,
    emotionalSignificance: null,
    sourceNotes: null,
    sourceUrl: null,
  });

  const validation: CustomMomentValidationResult = useMemo(
    () => validateCustomMomentForm(form),
    [form],
  );

  // Errors are only surfaced once the user has tried to save. Recommended
  // (soft) warnings are shown immediately so producers know up-front that
  // emotional significance is helpful — but we don't bug them about it as
  // "the form is invalid".
  const visibleErrors = submitted ? validation.errors : {};
  const visibleRecommended = validation.recommended;

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
    setSubmitted(false);
    setSubmitAnnouncement("");
    setMediaType("image");
    setMediaUrl("");
    setMediaFiles([]);
    setMediaLabel("");
    setMediaError(null);
    setMediaPending(false);
    if (initial) {
      setForm({
        title: initial.title,
        date: initial.date ?? "",
        description: initial.description,
        emotionalSignificance: initial.emotionalSignificance,
        sourceNotes: initial.sourceNotes,
        sourceUrl: initial.source?.sourceUrl ?? "",
        sourceVerified: initial.source?.verified ?? false,
        media: initial.media ?? [],
        visibility: initial.visibility,
        sensitivity: initial.sensitivity,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, initial]);

  const handleAddMedia = async () => {
    if (form.media.length >= CUSTOM_MOMENT_MEDIA_MAX_ATTACHMENTS) {
      setMediaError(
        `Add up to ${CUSTOM_MOMENT_MEDIA_MAX_ATTACHMENTS} media attachments per moment.`,
      );
      return;
    }
    if (mediaType === "youtube") {
      const error = validateCustomMomentMediaInput({
        type: mediaType,
        url: mediaUrl,
        label: mediaLabel,
      });
      if (error) {
        setMediaError(error);
        return;
      }
      const media = createYouTubeMomentMedia({
        url: mediaUrl,
        label: mediaLabel,
      });
      setForm((current) => ({ ...current, media: [...current.media, media] }));
      setMediaUrl("");
      setMediaLabel("");
      setMediaError(null);
      return;
    }

    if (mediaFiles.length === 0) {
      setMediaError(`Choose one or more ${mediaType} files.`);
      return;
    }
    const remainingSlots =
      CUSTOM_MOMENT_MEDIA_MAX_ATTACHMENTS - form.media.length;
    if (mediaFiles.length > remainingSlots) {
      setMediaError(
        `You can add ${remainingSlots} more attachment${remainingSlots === 1 ? "" : "s"} to this moment.`,
      );
      return;
    }
    const invalidFile = mediaFiles.find((file) =>
      validateCustomMomentUpload(mediaType, file),
    );
    if (invalidFile) {
      setMediaError(
        `${invalidFile.name}: ${validateCustomMomentUpload(mediaType, invalidFile)}`,
      );
      return;
    }
    setMediaPending(true);
    try {
      const uploadedMedia: CustomMomentMedia[] = [];
      for (const file of mediaFiles) {
        const dataUrl = await readFileAsDataUrl(file);
        const storageError = validateCustomMomentMediaStorage(
          [...form.media, ...uploadedMedia],
          dataUrl,
        );
        if (storageError) {
          setMediaError(`${file.name}: ${storageError}`);
          return;
        }
        uploadedMedia.push(
          createUploadedMomentMedia({
            type: mediaType,
            dataUrl,
            fileName: file.name,
            label: mediaLabel,
          }),
        );
      }
      setForm((current) => ({
        ...current,
        media: [...current.media, ...uploadedMedia],
      }));
      setMediaFiles([]);
      if (mediaFileRef.current) mediaFileRef.current.value = "";
      setMediaLabel("");
      setMediaError(null);
    } catch {
      setMediaError(
        "Could not read one of those files. Choose the files again and retry.",
      );
    } finally {
      setMediaPending(false);
    }
  };

  const handleRemoveMedia = (id: string) => {
    setForm((current) => ({
      ...current,
      media: current.media.filter((item) => item.id !== id),
    }));
  };

  const handleSave = () => {
    setSubmitted(true);

    if (!validation.isValid) {
      const errorCount = Object.keys(validation.errors).length;
      setSubmitAnnouncement(
        `Cannot save — ${errorCount} field${errorCount === 1 ? "" : "s"} need attention. Focus moved to the first issue.`,
      );

      const first = firstErrorField(validation.errors);
      if (first) {
        // Defer the focus until after React has flushed the
        // error-rendering re-render so the input picks up its `aria-invalid`.
        queueMicrotask(() => fieldRefs.current[first]?.focus());
      }
      return;
    }

    const sanitized = sanitizeCustomMomentFields({
      title: form.title,
      date: form.date,
      description: form.description,
      emotionalSignificance: form.emotionalSignificance,
      sourceNotes: form.sourceNotes,
    });

    const trimmedUrl = form.sourceUrl.trim();
    onSave({
      moment: {
        id: initial?.id,
        title: sanitized.title,
        date: sanitized.date,
        description: sanitized.description,
        emotionalSignificance: sanitized.emotionalSignificance,
        sourceNotes: sanitized.sourceNotes,
        source: makeProducerSource({
          sourceUrl: trimmedUrl || undefined,
          sourceNotes: sanitized.sourceNotes || undefined,
          verified: form.sourceVerified,
        }),
        media: form.media,
        visibility: form.visibility,
        sensitivity: form.sensitivity,
      },
      injectionFlagged: sanitized.injectionFlagged,
    });
  };

  const errorCount = Object.keys(visibleErrors).length;

  return (
    <Modal
      open={open}
      title={mode === "add" ? "Add custom moment" : "Edit custom moment"}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          {submitted && errorCount > 0 ? (
            <p
              className="font-mono text-xs text-danger"
              role="status"
              aria-live="polite"
            >
              {errorCount} issue{errorCount === 1 ? "" : "s"} to fix
            </p>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={mediaPending}>
              Save moment
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <p
          className="sr-only"
          role="status"
          aria-live="assertive"
          aria-atomic="true"
        >
          {submitAnnouncement}
        </p>

        {injectionPreview && (
          <p
            className="rounded-md border border-bordermid bg-panel px-3 py-2 font-mono text-xs text-textsub"
            role="status"
          >
            Suspicious patterns detected — text will be sanitized on save
            (gate 3). Instructions inside your copy are not executed.
          </p>
        )}

        <Input
          ref={(el) => {
            fieldRefs.current.title = el;
          }}
          label="Title"
          value={form.title}
          onChange={(e) =>
            setForm((f) => ({ ...f, title: e.target.value }))
          }
          required
          showCounter
          maxLength={CUSTOM_MOMENT_FIELD_LIMITS.title}
          helper={CUSTOM_MOMENT_HELPER_TEXT.title}
          error={visibleErrors.title}
        />

        <Input
          ref={(el) => {
            fieldRefs.current.date = el;
          }}
          label="Date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          placeholder="e.g. June 1998"
          required
          helper={CUSTOM_MOMENT_HELPER_TEXT.date}
          error={visibleErrors.date}
        />

        <Textarea
          ref={(el) => {
            fieldRefs.current.description = el;
          }}
          label="Description"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          required
          showCounter
          maxLength={CUSTOM_MOMENT_FIELD_LIMITS.description}
          helper={CUSTOM_MOMENT_HELPER_TEXT.description}
          error={visibleErrors.description}
        />

        <Textarea
          ref={(el) => {
            fieldRefs.current.emotionalSignificance = el;
          }}
          label="Emotional significance"
          value={form.emotionalSignificance}
          onChange={(e) =>
            setForm((f) => ({ ...f, emotionalSignificance: e.target.value }))
          }
          showCounter
          maxLength={CUSTOM_MOMENT_FIELD_LIMITS.emotionalSignificance}
          helper={CUSTOM_MOMENT_HELPER_TEXT.emotionalSignificance}
          recommended={visibleRecommended.emotionalSignificance}
          error={visibleErrors.emotionalSignificance}
        />

        <fieldset className="rounded-md border border-bordermid bg-panel/30 p-3">
          <legend className="px-1 label-mono">
            Media attachments (optional)
          </legend>
          <p className="mb-3 meta-mono text-textmuted">
            Upload images or videos from your device, or paste a YouTube URL.
            Files stay inside this browser draft. Up to{" "}
            {CUSTOM_MOMENT_MEDIA_MAX_ATTACHMENTS} attachments; images 1 MB max,
            videos 2 MB max. You can select multiple files at once.
          </p>

          {form.media.length > 0 && (
            <ul className="mb-3 space-y-2">
              {form.media.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="label-mono text-gold">
                      {CUSTOM_MOMENT_MEDIA_TYPE_LABEL[item.type]}
                    </p>
                    <p className="truncate font-body text-xs text-textsub">
                      {item.label || item.fileName || item.url}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleRemoveMedia(item.id)}
                    aria-label={`Remove ${item.label || item.fileName || CUSTOM_MOMENT_MEDIA_TYPE_LABEL[item.type]} attachment`}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <label className="block">
              <span className="mb-1.5 block label-mono">
                Media type
              </span>
              <select
                value={mediaType}
                onChange={(event) => {
                  setMediaType(event.target.value as CustomMomentMediaType);
                  setMediaUrl("");
                  setMediaFiles([]);
                  if (mediaFileRef.current) mediaFileRef.current.value = "";
                  setMediaError(null);
                }}
                className="text-input min-h-touch w-full rounded-md border border-border bg-card px-3 py-2 font-body text-text focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40 sm:min-h-0"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="youtube">YouTube</option>
              </select>
            </label>
            {mediaType === "youtube" ? (
              <Input
                label="YouTube URL"
                value={mediaUrl}
                onChange={(event) => {
                  setMediaUrl(event.target.value);
                  setMediaError(null);
                }}
                placeholder="https://youtube.com/watch?v=..."
                inputMode="url"
                autoComplete="off"
                error={mediaError ?? undefined}
              />
            ) : (
              <label className="block">
                <span className="mb-1.5 block label-mono">
                  {CUSTOM_MOMENT_MEDIA_TYPE_LABEL[mediaType]} files
                </span>
                <input
                  ref={mediaFileRef}
                  type="file"
                  multiple
                  accept={mediaType === "image" ? "image/*" : "video/*"}
                  onChange={(event) => {
                    setMediaFiles(Array.from(event.target.files ?? []));
                    setMediaError(null);
                  }}
                  className="text-input min-h-touch w-full rounded-md border border-border bg-card px-3 py-2 font-body text-sm text-text file:mr-3 file:rounded file:border-0 file:bg-gold file:px-3 file:py-1 file:font-body file:text-bg focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40 sm:min-h-0"
                  aria-describedby={mediaError ? "media-file-error" : undefined}
                />
                {mediaError && (
                  <p
                    id="media-file-error"
                    className="mt-1 font-mono text-xs text-danger"
                    role="alert"
                  >
                    {mediaError}
                  </p>
                )}
              </label>
            )}
          </div>
          <div className="mt-3">
            <Input
              label="Media label (optional)"
              value={mediaLabel}
              onChange={(event) => {
                setMediaLabel(event.target.value);
                setMediaError(null);
              }}
              maxLength={CUSTOM_MOMENT_MEDIA_LABEL_LIMIT}
              showCounter
              placeholder="e.g. Backstage interview clip"
              helper={
                mediaType === "youtube"
                  ? undefined
                  : "Applied to every file selected in this batch."
              }
            />
          </div>
          <div className="mt-3">
            <Button
              variant="secondary"
              size="small"
              onClick={handleAddMedia}
              aria-busy={mediaPending}
              disabled={
                mediaPending ||
                (mediaType === "youtube"
                  ? mediaUrl.trim().length === 0
                  : mediaFiles.length === 0) ||
                form.media.length >= CUSTOM_MOMENT_MEDIA_MAX_ATTACHMENTS
              }
            >
              {mediaPending
                ? "Adding…"
                : mediaType === "youtube"
                  ? "Add media"
                  : mediaFiles.length > 0
                    ? `Add ${mediaFiles.length} file${mediaFiles.length === 1 ? "" : "s"}`
                    : "Add files"}
            </Button>
          </div>
        </fieldset>

        <Textarea
          ref={(el) => {
            fieldRefs.current.sourceNotes = el;
          }}
          label={
            form.visibility === "Public" ? "Source notes" : "Source notes (optional)"
          }
          value={form.sourceNotes}
          onChange={(e) =>
            setForm((f) => ({ ...f, sourceNotes: e.target.value }))
          }
          required={form.visibility === "Public"}
          showCounter
          maxLength={CUSTOM_MOMENT_FIELD_LIMITS.sourceNotes}
          helper={CUSTOM_MOMENT_HELPER_TEXT.sourceNotes}
          error={visibleErrors.sourceNotes}
        />

        <Input
          ref={(el) => {
            fieldRefs.current.sourceUrl = el;
          }}
          label="Source URL (optional)"
          value={form.sourceUrl}
          onChange={(e) =>
            setForm((f) => ({ ...f, sourceUrl: e.target.value }))
          }
          placeholder="https://…"
          inputMode="url"
          autoComplete="off"
          helper={CUSTOM_MOMENT_HELPER_TEXT.sourceUrl}
          error={visibleErrors.sourceUrl}
        />

        <label className="flex items-start gap-3 rounded-md border border-bordermid bg-panel/40 px-3 py-2">
          <input
            type="checkbox"
            checked={form.sourceVerified}
            onChange={(e) =>
              setForm((f) => ({ ...f, sourceVerified: e.target.checked }))
            }
            className="mt-1 h-4 w-4 accent-gold"
            aria-describedby="source-verified-help"
          />
          <span className="text-sm text-text">
            <span className="font-body font-medium">
              I have corroborated this source.
            </span>
            <span
              id="source-verified-help"
              className="mt-1 block meta-mono text-textmuted"
            >
              Unverified moments are flagged in guardrails and labelled
              &ldquo;unverified&rdquo; in the studio. Never affirm what you
              cannot stand behind.
            </span>
          </span>
        </label>

        <div>
          <SegControl<Visibility>
            label="Visibility"
            value={form.visibility}
            onChange={(visibility) => setForm((f) => ({ ...f, visibility }))}
            options={VISIBILITY_OPTIONS.map((v) => ({ value: v, label: v }))}
          />
          <p
            id={visibilityHelpId}
            className="mt-1.5 meta-mono text-textmuted"
          >
            <span className="text-text">{form.visibility}</span> ·{" "}
            {VISIBILITY_GUIDANCE[form.visibility]}
          </p>
        </div>

        <div>
          <SegControl<Sensitivity>
            label="Sensitivity"
            value={form.sensitivity}
            onChange={(sensitivity) =>
              setForm((f) => ({ ...f, sensitivity }))
            }
            options={SENSITIVITY_OPTIONS.map((s) => ({ value: s, label: s }))}
          />
          <p
            id={sensitivityHelpId}
            className="mt-1.5 meta-mono text-textmuted"
          >
            <span className="text-text">{form.sensitivity}</span> ·{" "}
            {SENSITIVITY_GUIDANCE[form.sensitivity]}
          </p>
        </div>
      </div>
    </Modal>
  );
}
