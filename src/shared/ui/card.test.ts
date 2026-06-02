import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Card } from "./Card";

describe("Card", () => {
  it("renders a static div with default state surface", () => {
    const html = renderToStaticMarkup(
      createElement(Card, null, "Body"),
    );
    expect(html).toContain("border-border");
    expect(html).toContain("bg-card");
    expect(html).toContain("Body");
  });

  it("renders reviewed state tint", () => {
    const html = renderToStaticMarkup(
      createElement(Card, { state: "reviewed" }, "Approved"),
    );
    expect(html).toContain("border-ok/40");
    expect(html).toContain("bg-ok/5");
  });

  it("renders as button with selectable + selected classes", () => {
    const html = renderToStaticMarkup(
      createElement(
        Card,
        {
          as: "button",
          type: "button",
          selectable: true,
          selected: true,
          role: "option",
        },
        "Hit",
      ),
    );
    expect(html).toContain("<button");
    expect(html).toContain("interactive-card-selectable");
    expect(html).toContain("interactive-card-selected");
    expect(html).toContain('role="option"');
  });

  it("composes Header, Title, Meta, Body, Footer", () => {
    const html = renderToStaticMarkup(
      createElement(
        Card,
        null,
        createElement(
          Card.Header,
          { eyebrow: "Timeline event" },
          createElement(Card.Title, { id: "t" }, "Title"),
          createElement(Card.Meta, null, "2020"),
        ),
        createElement(Card.Body, null, "Description"),
        createElement(Card.Footer, null, "Actions"),
      ),
    );
    expect(html).toContain("Timeline event");
    expect(html).toContain('id="t"');
    expect(html).toContain("2020");
    expect(html).toContain("Description");
    expect(html).toContain("Actions");
  });
});
