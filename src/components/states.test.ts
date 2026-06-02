import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { RetryPanel } from "./RetryPanel";
import {
  AUDIO_UNAVAILABLE_DESCRIPTION,
  AUDIO_UNAVAILABLE_TITLE,
  IMPORT_LOADING_TITLE,
  SAVE_ERROR_DESCRIPTION,
  SAVE_ERROR_TITLE,
  SEARCH_EMPTY_DESCRIPTION,
  SEARCH_ERROR_DESCRIPTION,
  SEARCH_ERROR_TITLE,
  TIMELINE_EMPTY_DESCRIPTION,
  TIMELINE_EMPTY_TITLE,
} from "../lib/stateCopy";

/**
 * State component contract suite. We assert against static markup so the
 * suite stays inside the existing vitest+node environment (no jsdom dep).
 *
 * The aim isn't pixel-perfect snapshotting — it's catching regressions in:
 *  - aria-roles / aria-busy (what assistive tech sees)
 *  - canonical user-facing copy (the QA brief's exact strings)
 *  - structural slots (eyebrow, title, description, action)
 */

describe("LoadingState", () => {
  it("renders an aria-busy + aria-live polite region", () => {
    const html = renderToStaticMarkup(
      createElement(LoadingState, {
        title: IMPORT_LOADING_TITLE,
        description: "Generating timeline from Wikipedia sources.",
      }),
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain(IMPORT_LOADING_TITLE);
    expect(html).toContain("Generating timeline from Wikipedia sources.");
  });

  it("renders the optional eyebrow + skeleton slot", () => {
    const html = renderToStaticMarkup(
      createElement(LoadingState, {
        eyebrow: "S3 · Timeline",
        title: "Loading",
        skeleton: createElement("div", { "data-testid": "skel" }),
      }),
    );
    expect(html).toContain("S3 · Timeline");
    expect(html).toContain('data-testid="skel"');
  });
});

describe("ErrorState", () => {
  it("renders with role=alert in the danger tone by default", () => {
    const html = renderToStaticMarkup(
      createElement(ErrorState, {
        title: SAVE_ERROR_TITLE,
        description: SAVE_ERROR_DESCRIPTION,
      }),
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("border-danger/40");
    expect(html).toContain(SAVE_ERROR_TITLE);
    expect(html).toContain(SAVE_ERROR_DESCRIPTION);
  });

  it("renders the warning tone for degraded surfaces", () => {
    const html = renderToStaticMarkup(
      createElement(ErrorState, {
        title: SEARCH_ERROR_TITLE,
        description: SEARCH_ERROR_DESCRIPTION,
        tone: "warning",
      }),
    );
    expect(html).toContain("border-gold/30");
    expect(html).not.toContain("border-danger/40");
  });

  it("renders custom action node", () => {
    const html = renderToStaticMarkup(
      createElement(ErrorState, {
        title: "Blocked",
        description: "Acknowledge consent.",
        action: createElement(Button, { variant: "primary" }, "Go to consent"),
      }),
    );
    expect(html).toContain("Go to consent");
  });
});

describe("RetryPanel", () => {
  it("includes the primary Retry button by default", () => {
    const html = renderToStaticMarkup(
      createElement(RetryPanel, {
        title: SEARCH_ERROR_TITLE,
        description: SEARCH_ERROR_DESCRIPTION,
        onRetry: () => {},
      }),
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain(">Retry</button>");
  });

  it("renders the override retry label and a secondary action", () => {
    const html = renderToStaticMarkup(
      createElement(RetryPanel, {
        title: SAVE_ERROR_TITLE,
        description: SAVE_ERROR_DESCRIPTION,
        retryLabel: "Retry save",
        onRetry: () => {},
        secondaryAction: { label: "Back to guardrails", onClick: () => {} },
      }),
    );
    expect(html).toContain(">Retry save</button>");
    expect(html).toContain(">Back to guardrails</button>");
  });

  it("disables the retry button when retryDisabled=true", () => {
    const html = renderToStaticMarkup(
      createElement(RetryPanel, {
        title: SAVE_ERROR_TITLE,
        description: SAVE_ERROR_DESCRIPTION,
        retryLabel: "Retry save",
        onRetry: () => {},
        retryDisabled: true,
      }),
    );
    // The disabled attribute appears on the inner button rendered by <Button>
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Retry save<\/button>/);
  });
});

describe("EmptyState (regression — canonical timeline + audio copy)", () => {
  it("renders the canonical timeline-empty surface", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        eyebrow: "S3 · Timeline review",
        title: TIMELINE_EMPTY_TITLE,
        description: TIMELINE_EMPTY_DESCRIPTION,
      }),
    );
    expect(html).toContain('role="status"');
    expect(html).toContain(TIMELINE_EMPTY_TITLE);
    expect(html).toContain(TIMELINE_EMPTY_DESCRIPTION);
  });

  it("does not collide with the audio-unavailable copy", () => {
    expect(AUDIO_UNAVAILABLE_TITLE).not.toEqual(TIMELINE_EMPTY_TITLE);
    expect(AUDIO_UNAVAILABLE_DESCRIPTION).not.toEqual(
      TIMELINE_EMPTY_DESCRIPTION,
    );
  });
});

describe("State copy contract", () => {
  // These tests guard the *exact* user-facing strings the latest brief
  // requested. If anyone tweaks them, the test will fail and the QA log
  // gets a paper trail of the deliberate copy change.
  it("search empty", () => {
    expect(SEARCH_EMPTY_DESCRIPTION).toBe(
      "No matching public figures found. Try a full name or adjust filters.",
    );
  });
  it("search error", () => {
    expect(SEARCH_ERROR_DESCRIPTION).toBe(
      "Search is unavailable right now. Try again in a moment.",
    );
  });
  it("timeline empty", () => {
    expect(TIMELINE_EMPTY_DESCRIPTION).toBe(
      "No reliable timeline events were found. Add custom moments to continue.",
    );
  });
  it("save error", () => {
    expect(SAVE_ERROR_DESCRIPTION).toBe(
      "Draft could not be saved locally. Try again before leaving this page.",
    );
  });
  it("audio unavailable", () => {
    expect(AUDIO_UNAVAILABLE_DESCRIPTION).toBe(
      "Audio generation is not connected in this demo. The voice context is saved and ready for generation.",
    );
  });
});
