/**
 * `<StepTransition>` contract suite. Mirrors the static-markup pattern of
 * `src/shared/ui/states.test.ts` so it runs in the existing node-only
 * vitest environment (no jsdom dep).
 *
 * The wrapper has three orthogonal contracts we want to lock down:
 *  1. It renders its children verbatim (it's a transparent wrapper —
 *     never a content barrier or focus trap).
 *  2. It applies the correct `motion-safe:`-gated animation utility per
 *     `direction` prop, defaulting to the pure fade when omitted.
 *  3. It composes with `className` for layout nudges without overriding
 *     the animation utility.
 *
 * The "key changes remount" behavior is a React invariant, not a
 * component behavior, so we don't try to exercise it here — the
 * production wiring in `src/App.tsx` keys the wrapper on `screen` so
 * remount happens automatically on transition. See implementation-log
 * entry for the manual verification record.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StepTransition } from "./StepTransition";

describe("StepTransition", () => {
  it("renders its children verbatim", () => {
    const html = renderToStaticMarkup(
      createElement(
        StepTransition,
        null,
        createElement("section", { "data-testid": "child" }, "hello"),
      ),
    );
    expect(html).toContain('data-testid="child"');
    expect(html).toContain("hello");
  });

  it("applies the default fade-in animation when direction is omitted", () => {
    const html = renderToStaticMarkup(
      createElement(StepTransition, null, createElement("p", null, "x")),
    );
    expect(html).toContain("motion-safe:animate-fade-in");
    expect(html).not.toContain("motion-safe:animate-slide-in-right");
    expect(html).not.toContain("motion-safe:animate-slide-in-left");
  });

  it("applies slide-in-right for direction=forward", () => {
    const html = renderToStaticMarkup(
      createElement(
        StepTransition,
        { direction: "forward" },
        createElement("p", null, "x"),
      ),
    );
    expect(html).toContain("motion-safe:animate-slide-in-right");
    expect(html).not.toContain("motion-safe:animate-fade-in");
  });

  it("applies slide-in-left for direction=back", () => {
    const html = renderToStaticMarkup(
      createElement(
        StepTransition,
        { direction: "back" },
        createElement("p", null, "x"),
      ),
    );
    expect(html).toContain("motion-safe:animate-slide-in-left");
    expect(html).not.toContain("motion-safe:animate-fade-in");
  });

  it("composes with custom className without dropping the animation utility", () => {
    const html = renderToStaticMarkup(
      createElement(
        StepTransition,
        { className: "h-full max-w-prose" },
        createElement("p", null, "x"),
      ),
    );
    expect(html).toContain("motion-safe:animate-fade-in");
    expect(html).toContain("h-full");
    expect(html).toContain("max-w-prose");
  });

  it("does not add aria/role attributes (transparent wrapper)", () => {
    // The wrapper is a layout-only div. Adding role/aria would corrupt the
    // wizard's landmark structure (the parent <main> owns the landmark)
    // and could nest live regions that already exist inside children.
    const html = renderToStaticMarkup(
      createElement(StepTransition, null, createElement("p", null, "x")),
    );
    expect(html).not.toMatch(/\brole\s*=/);
    expect(html).not.toMatch(/\baria-/);
  });
});
