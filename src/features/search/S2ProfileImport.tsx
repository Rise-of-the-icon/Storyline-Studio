import { useEffect, useState } from "react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Disclosure } from "@/shared/ui/Disclosure";
import { LoadingState } from "@/shared/ui/LoadingState";
import { useTwin } from "@/app/providers/TwinContext";
import { ProfileCardSkeleton } from "@/shared/ui/Skeleton";
import {
  canImportTimeline,
  CONSENT_ACKNOWLEDGEMENT_LABEL,
  CONSENT_NOT_LEGAL_CLEARANCE_NOTE,
  CONSENT_WHY_THIS_MATTERS,
  withConsent,
} from "@/lib/consent";
import {
  IMPORT_ERROR_DESCRIPTION,
  IMPORT_LOADING_DESCRIPTION,
  IMPORT_LOADING_TITLE,
  SUBJECT_LOADING_DESCRIPTION,
  SUBJECT_LOADING_TITLE,
} from "@/lib/stateCopy";
import { generateImportBundle } from "@/features/timeline/timelineGenerator";

function SubjectThumbnail({
  imageUrl,
  fallbackInitial,
}: {
  imageUrl: string | undefined;
  fallbackInitial: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  if (showImage) {
    // `alt=""` because the subject's name is rendered immediately to the
    // right of this thumbnail in an `<h2>`. Repeating the name here would
    // cause double announcements in screen readers (a 1.1.1 anti-pattern
    // — decorative imagery should not duplicate adjacent text content).
    return (
      <img
        src={imageUrl}
        alt=""
        onError={() => setFailed(true)}
        className="h-24 w-24 shrink-0 rounded-lg object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-panel font-display text-2xl text-textsub"
      aria-hidden="true"
    >
      {fallbackInitial}
    </div>
  );
}

type S2Phase = "loading" | "ready" | "importing" | "error";

export function S2ProfileImport() {
  const { draft, goTo, goBack, updateDraft } = useTwin();
  const [phase, setPhase] = useState<S2Phase>("loading");
  const [consentChecked, setConsentChecked] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) {
      goTo("S1");
      return;
    }
    setPhase("ready");
    setConsentChecked(draft.consentAcknowledged);
  }, [draft, goTo]);

  const handleConsentChange = (next: boolean) => {
    setConsentChecked(next);
    updateDraft((prev) => withConsent(prev, next));
  };

  const handleImport = async () => {
    if (!draft) return;
    // Gate 4 — refuse programmatically even if UI state is somehow tampered.
    if (!canImportTimeline(draft) || !consentChecked) {
      setImportError(
        "Consent acknowledgement is required before import. Check the box above.",
      );
      setPhase("error");
      return;
    }

    setPhase("importing");
    setImportError(null);

    try {
      const bundle = await generateImportBundle(draft);
      updateDraft((prev) => ({
        ...prev,
        timeline: bundle.timeline,
        customMoments: bundle.customMoments,
        guardrailReviews: bundle.guardrailReviews,
      }));
      goTo("S3");
    } catch {
      setImportError(IMPORT_ERROR_DESCRIPTION);
      setPhase("error");
    }
  };

  if (!draft || phase === "loading") {
    return (
      <LoadingState
        eyebrow="S2 · Profile import"
        title={SUBJECT_LOADING_TITLE}
        description={SUBJECT_LOADING_DESCRIPTION}
        skeleton={<ProfileCardSkeleton />}
      />
    );
  }

  if (phase === "importing") {
    return (
      <LoadingState
        eyebrow="S2 · Profile import"
        title={IMPORT_LOADING_TITLE}
        description={IMPORT_LOADING_DESCRIPTION}
        skeleton={
          <>
            <ProfileCardSkeleton />
            <ProfileCardSkeleton />
          </>
        }
      />
    );
  }

  const wiki = draft.wikipedia;
  const ctaDisabled = !consentChecked || phase === "error";
  const subjectName = draft.coreIdentity.name || wiki.title || "Unknown subject";
  const isDemoSubject = wiki.pageId.startsWith("demo-");
  const summaryText = wiki.summary?.trim() ?? "";
  const descriptionText = wiki.description?.trim() ?? "";
  const previewText = descriptionText || summaryText;
  const initial = subjectName.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <div className="mx-auto max-w-[680px] px-4 py-8">
      <Button
        variant="ghost"
        size="small"
        onClick={goBack}
        className="touch-target -ml-2 text-lightblue hover:text-gold"
        aria-label="Back to previous step"
      >
        ← Back
      </Button>

      <h1 className="mt-4 font-display text-3xl tracking-wide text-text">
        Profile import
      </h1>
      <p className="mt-2 font-body text-sm text-textsub">
        Review the {isDemoSubject ? "demo" : "Wikipedia"} source, acknowledge
        consent, then generate the timeline.
      </p>

      <Card
        className="mt-8 flex gap-4"
        data-testid="s2-profile-card"
      >
        <SubjectThumbnail
          imageUrl={wiki.imageUrl}
          fallbackInitial={initial}
        />
        <div className="min-w-0">
          <Card.Header
            actions={
              <>
                <Badge variant="blue">Wikipedia</Badge>
                {isDemoSubject && <Badge variant="gold">Demo profile</Badge>}
              </>
            }
          >
            <Card.Title
              className="text-xl"
              id="s2-subject-name"
              data-testid="s2-subject-name"
            >
              {subjectName}
            </Card.Title>
          </Card.Header>
          <Card.Body className="mt-2 line-clamp-3">
            {previewText ? (
              previewText
            ) : (
              <span className="italic text-textmuted">
                No description available from the source.
              </span>
            )}
          </Card.Body>
        </div>
      </Card>

      <Card className="mt-6 bg-panel" aria-labelledby="data-preview-heading">
        <h2 id="data-preview-heading" className="sr-only">
          Data preview
        </h2>
        <Card.Header eyebrow="Data preview" />
        <dl className="space-y-3 font-mono text-xs text-textsub">
          <div className="flex flex-wrap gap-2">
            <dt className="text-textmuted">source</dt>
            <dd className="text-text">
              {isDemoSubject ? "Wikipedia (demo fixture)" : "Wikipedia"}
            </dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-textmuted">pageId</dt>
            <dd className="text-text">{wiki.pageId || "—"}</dd>
          </div>
          <div>
            <dt className="text-textmuted">summary</dt>
            <dd className="mt-1 font-body text-sm text-text">
              {summaryText ? (
                summaryText
              ) : (
                <span className="italic text-textmuted">
                  No summary returned by the source.
                </span>
              )}
            </dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-textmuted">url</dt>
            <dd className="min-w-0 flex-1 break-all">
              {wiki.sourceUrl ? (
                <a
                  href={wiki.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded text-lightblue hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {wiki.sourceUrl}
                </a>
              ) : (
                <span className="italic text-textmuted">No source URL</span>
              )}
            </dd>
          </div>
          {wiki.revisionId && (
            <div className="flex flex-wrap gap-2">
              <dt className="text-textmuted">revision</dt>
              <dd className="text-text">{wiki.revisionId}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card
        className="mt-8 border-bordermid"
        aria-labelledby="consent-heading"
      >
        <h2 id="consent-heading" className="sr-only">
          Consent &amp; ethical use
        </h2>
        <p className="label-mono text-gold">Consent &amp; ethical use</p>

        <Checkbox
          className="mt-3"
          checked={consentChecked}
          onChange={(e) => handleConsentChange(e.target.checked)}
          aria-describedby="consent-disclosure"
          data-testid="s2-consent-checkbox"
          label={CONSENT_ACKNOWLEDGEMENT_LABEL}
        />

        <p
          id="consent-disclosure"
          className="mt-3 border-l-2 border-gold/60 bg-goldfaint/40 px-3 py-2 font-body text-xs leading-relaxed text-textsub"
        >
          {CONSENT_NOT_LEGAL_CLEARANCE_NOTE}
        </p>

        {consentChecked && draft.consentAcknowledgedAtISO && (
          <p
            className="mt-3 meta-mono text-textmuted"
            data-testid="s2-consent-timestamp"
          >
            Acknowledged at{" "}
            <time dateTime={draft.consentAcknowledgedAtISO}>
              {new Date(draft.consentAcknowledgedAtISO).toLocaleString()}
            </time>
          </p>
        )}

        {!consentChecked && (
          <p className="mt-3 meta-mono text-textmuted" role="status">
            Consent is required before import — check the box above to continue.
          </p>
        )}

        <Disclosure title="Why this matters" className="mt-4">
          <ul className="space-y-3">
            {CONSENT_WHY_THIS_MATTERS.map((item) => (
              <li key={item.title}>
                <p className="font-body text-sm font-medium text-text">
                  {item.title}
                </p>
                <p className="mt-0.5 font-body text-xs text-textsub">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </Disclosure>
      </Card>

      {importError && (
        <p className="mt-4 font-body text-sm text-danger" role="alert">
          {importError}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          disabled={ctaDisabled}
          onClick={handleImport}
          aria-describedby={ctaDisabled ? "import-helper" : undefined}
        >
          Import &amp; Generate Timeline
        </Button>
        {ctaDisabled && (
          <p id="import-helper" className="font-mono text-xs text-textmuted">
            {phase === "error"
              ? "Fix the error above, then retry."
              : "Enable after consent is acknowledged."}
          </p>
        )}
        {phase === "error" && consentChecked && (
          <Button variant="secondary" onClick={handleImport}>
            Retry import
          </Button>
        )}
      </div>
    </div>
  );
}
