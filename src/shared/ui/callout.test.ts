import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Callout } from "./Callout";

describe("Callout", () => {
  it("renders warning tone with eyebrow", () => {
    const html = renderToStaticMarkup(
      createElement(
        Callout,
        { tone: "warning", eyebrow: "Heuristic timeline", role: "note" },
        "Review every event.",
      ),
    );
    expect(html).toContain('role="note"');
    expect(html).toContain("border-gold/40");
    expect(html).toContain("bg-goldfaint");
    expect(html).toContain("Heuristic timeline");
    expect(html).toContain("Review every event.");
  });

  it("renders neutral tone without eyebrow", () => {
    const html = renderToStaticMarkup(
      createElement(Callout, { tone: "neutral" }, "Neutral body."),
    );
    expect(html).toContain("border-bordermid");
    expect(html).toContain("Neutral body.");
  });
});
