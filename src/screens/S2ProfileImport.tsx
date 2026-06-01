import { useEffect, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useTwin } from "../context/TwinContext";
import { ProfileCardSkeleton } from "../components/Skeleton";
import { CONSENT_ACKNOWLEDGEMENT_LABEL } from "../lib/consent";
import { generateImportBundle } from "../lib/timelineGenerator";

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

  const handleImport = async () => {
    if (!draft || !consentChecked) return;

    setPhase("importing");
    setImportError(null);

    try {
      const bundle = await generateImportBundle(draft);
      updateDraft((prev) => ({
        ...prev,
        consentAcknowledged: true,
        timeline: bundle.timeline,
        customMoments: bundle.customMoments,
        guardrailReviews: bundle.guardrailReviews,
      }));
      goTo("S3");
    } catch {
      setImportError(
        "Import failed — we could not generate a timeline. Please retry.",
      );
      setPhase("error");
    }
  };

  if (!draft || phase === "loading") {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-16">
        <div className="animate-pulse space-y-4" aria-busy="true">
          <div className="h-8 w-1/2 rounded bg-panel" />
          <div className="h-40 rounded-lg bg-card" />
          <div className="h-24 rounded-lg bg-card" />
        </div>
      </div>
    );
  }

  if (phase === "importing") {
    return (
      <div
        className="mx-auto max-w-[680px] px-4 py-16"
        aria-busy="true"
        aria-live="polite"
      >
        <p className="font-display text-2xl text-text">Importing profile…</p>
        <p className="mt-2 font-body text-sm text-textsub">
          Generating timeline from Wikipedia sources
        </p>
        <div className="mt-8 space-y-4">
          <ProfileCardSkeleton />
          <ProfileCardSkeleton />
        </div>
      </div>
    );
  }

  const wiki = draft.wikipedia;
  const ctaDisabled = !consentChecked || phase === "error";

  return (
    <div className="mx-auto max-w-[680px] px-4 py-8">
      <button
        type="button"
        onClick={goBack}
        className="font-mono text-xs text-lightblue hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold"
      >
        ← Back to search
      </button>

      <h1 className="mt-4 font-display text-3xl tracking-wide text-text">
        Profile import
      </h1>
      <p className="mt-2 font-body text-sm text-textsub">
        Review the Wikipedia source, acknowledge consent, then generate the
        timeline.
      </p>

      <article className="mt-8 flex gap-4 rounded-lg border border-border bg-card p-4">
        {wiki.imageUrl ? (
          <img
            src={wiki.imageUrl}
            alt=""
            className="h-24 w-24 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-panel font-display text-2xl text-textmuted">
            {wiki.title.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-body text-xl font-medium text-text">
              {wiki.title}
            </h2>
            <Badge variant="blue">Wikipedia</Badge>
          </div>
          <p className="mt-2 line-clamp-3 font-body text-sm text-textsub">
            {wiki.description || wiki.summary}
          </p>
        </div>
      </article>

      <section
        className="mt-6 rounded-lg border border-border bg-panel p-4"
        aria-labelledby="data-preview-heading"
      >
        <h2
          id="data-preview-heading"
          className="font-mono text-xs uppercase tracking-widest text-textmuted"
        >
          Data preview
        </h2>
        <dl className="mt-3 space-y-2 font-mono text-xs text-textsub">
          <div className="flex gap-2">
            <dt className="text-textmuted">pageId</dt>
            <dd className="text-text">{wiki.pageId}</dd>
          </div>
          <div>
            <dt className="text-textmuted">summary</dt>
            <dd className="mt-1 font-body text-sm text-text">
              {wiki.summary || "—"}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-textmuted">source</dt>
            <dd>
              <a
                href={wiki.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-lightblue hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {wiki.sourceUrl}
              </a>
            </dd>
          </div>
          {wiki.revisionId && (
            <div className="flex gap-2">
              <dt className="text-textmuted">revision</dt>
              <dd className="text-text">{wiki.revisionId}</dd>
            </div>
          )}
        </dl>
      </section>

      <div className="mt-8 rounded-lg border border-bordermid bg-card p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 rounded border-border bg-panel accent-gold focus:ring-2 focus:ring-gold"
          />
          <span className="font-body text-sm text-text">
            {CONSENT_ACKNOWLEDGEMENT_LABEL}
          </span>
        </label>
        {!consentChecked && (
          <p className="mt-3 font-mono text-xs text-textmuted" role="status">
            Consent is required before import — check the box above to continue.
          </p>
        )}
      </div>

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
