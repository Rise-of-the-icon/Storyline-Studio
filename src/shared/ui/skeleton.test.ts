/**
 * Branded `<Skeleton>` contract suite. We assert against the static
 * markup (`renderToStaticMarkup`) so the suite stays inside the existing
 * node-only vitest environment — the same pattern as
 * `src/shared/ui/states.test.ts`.
 *
 * The goal isn't pixel-perfect snapshotting; it's catching regressions in:
 *  - the shimmer utility + `motion-safe:animate-shimmer` (the brand)
 *  - `aria-hidden="true"` on the decorative sweep (so AT only hears the
 *    caller-owned `<LoadingState>` announcement)
 *  - the optional caption slot (so each variant can carry editorial copy)
 *  - composition: variants must render the base shimmer chrome — never
 *    inline their own animation utility — so the look stays consistent
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ProfileCardSkeleton,
  SearchResultSkeleton,
  Skeleton,
  SkeletonLine,
  StudioPanelSkeleton,
  TimelineEventSkeleton,
} from "./Skeleton";

describe("Skeleton (base)", () => {
  it("renders the branded card chrome with shimmer utility", () => {
    const html = renderToStaticMarkup(createElement(Skeleton));
    // Branded card surface — dark card, hairline border, rounded.
    expect(html).toContain("bg-card");
    expect(html).toContain("border-border");
    expect(html).toContain("rounded-lg");
    // Shimmer utility + motion-safe gate (so reduced-motion users see a
    // static frame instead of the sweep).
    expect(html).toContain("skeleton-shimmer");
    expect(html).toContain("motion-safe:animate-shimmer");
  });

  it("marks the decorative shimmer band aria-hidden", () => {
    const html = renderToStaticMarkup(createElement(Skeleton));
    // The shimmer band must not leak into the AX tree — the loading
    // announcement is owned by the parent LoadingState's aria-live region.
    // We assert the shimmer node carries aria-hidden by checking the
    // attribute appears on the same element that holds the shimmer class.
    const shimmerMatch = html.match(
      /<div\b[^>]*?skeleton-shimmer[^>]*?>|<div\b[^>]*?aria-hidden="true"[^>]*?skeleton-shimmer[^>]*?>/,
    );
    expect(shimmerMatch).not.toBeNull();
    expect(shimmerMatch?.[0]).toContain('aria-hidden="true"');
  });

  it("renders the optional caption with fade-in + reduced-motion fallback", () => {
    const html = renderToStaticMarkup(
      createElement(Skeleton, { caption: "Searching public sources…" }),
    );
    expect(html).toContain("Searching public sources…");
    expect(html).toContain("motion-safe:animate-fade-in");
    // Reduced-motion users see the caption immediately (opacity-100).
    expect(html).toContain("motion-reduce:opacity-100");
  });

  it("does NOT render a caption element when caption prop is omitted", () => {
    const html = renderToStaticMarkup(createElement(Skeleton));
    expect(html).not.toContain("motion-safe:animate-fade-in");
  });

  it("merges custom className with the branded chrome", () => {
    const html = renderToStaticMarkup(
      createElement(Skeleton, { className: "h-32 w-64" }),
    );
    expect(html).toContain("h-32");
    expect(html).toContain("w-64");
    expect(html).toContain("bg-card");
  });
});

describe("SkeletonLine", () => {
  it("renders a flat aria-hidden placeholder (no per-line pulse)", () => {
    const html = renderToStaticMarkup(
      createElement(SkeletonLine, { className: "h-4 w-1/2" }),
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("bg-panel");
    expect(html).toContain("rounded");
    // The parent Skeleton owns the shimmer — lines must not double up
    // with their own animate-pulse.
    expect(html).not.toContain("animate-pulse");
  });
});

describe("Skeleton variants — domain shape composition", () => {
  it("SearchResultSkeleton composes the branded base", () => {
    const html = renderToStaticMarkup(createElement(SearchResultSkeleton));
    expect(html).toContain("skeleton-shimmer");
    expect(html).toContain("motion-safe:animate-shimmer");
    expect(html).toContain("bg-card");
    expect(html).toContain("border-border");
    // Domain shape — avatar block + two text bars.
    expect(html).toContain("h-14 w-14");
  });

  it("TimelineEventSkeleton composes the branded base", () => {
    const html = renderToStaticMarkup(createElement(TimelineEventSkeleton));
    expect(html).toContain("skeleton-shimmer");
    expect(html).toContain("motion-safe:animate-shimmer");
    expect(html).toContain("bg-card");
  });

  it("ProfileCardSkeleton composes the branded base", () => {
    const html = renderToStaticMarkup(createElement(ProfileCardSkeleton));
    expect(html).toContain("skeleton-shimmer");
    expect(html).toContain("motion-safe:animate-shimmer");
    expect(html).toContain("bg-card");
    // 24×24 thumb block from the real S2 / S6 card.
    expect(html).toContain("h-24 w-24");
  });

  it("StudioPanelSkeleton composes the branded base (right-rail shape)", () => {
    const html = renderToStaticMarkup(createElement(StudioPanelSkeleton));
    expect(html).toContain("skeleton-shimmer");
    expect(html).toContain("motion-safe:animate-shimmer");
    expect(html).toContain("bg-card");
  });

  it("variants accept the optional caption and render it inside the card", () => {
    const html = renderToStaticMarkup(
      createElement(SearchResultSkeleton, {
        caption: "Building source profile…",
      }),
    );
    expect(html).toContain("Building source profile…");
    expect(html).toContain("motion-safe:animate-fade-in");
  });
});
