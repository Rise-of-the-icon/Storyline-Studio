/**
 * Lightweight accessibility-regression smoke test. Scans the JSX source for
 * the known anti-patterns we fixed in the accessibility remediation pass.
 * Catches drift early — e.g. someone adding a clickable `<div>` or an `<img>`
 * with no `alt`.
 *
 * This is intentionally static (regex over source files) so we don't have to
 * pull in jsdom + testing-library + axe just to enforce a handful of rules.
 * For real WCAG verification we run axe-core against the live dev server via
 * the IDE browser MCP — that catches dynamic issues (focus order, color
 * contrast in computed styles) that static analysis can't see.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";

const ROOT = join(__dirname, "..");
const IGNORE_DIRS = new Set(["node_modules", "dist", "dev", "__snapshots__"]);
const IGNORE_FILE_SUFFIXES = [".test.ts", ".test.tsx", "vite-env.d.ts"];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      if (IGNORE_FILE_SUFFIXES.some((s) => entry.endsWith(s))) continue;
      out.push(full);
    }
  }
  return out;
}

const TSX_FILES = walk(ROOT).filter((f) => f.endsWith(".tsx"));
const ALL_TS_FILES = walk(ROOT);

describe("a11y · static analysis", () => {
  test("every `<img>` declares an `alt` attribute", () => {
    // Matches `<img` followed by any attrs across any number of lines, up to
    // the first `>` that closes the tag. We then assert each match includes
    // `alt=`. We don't validate the value — that's a judgment call (decorative
    // vs informative); we only catch the "completely missing alt" mistake.
    const offenders: Array<{ file: string; snippet: string }> = [];
    const imgRe = /<img\b[^>]*?\/?>/gs;
    for (const file of TSX_FILES) {
      const src = readFileSync(file, "utf8");
      const matches = src.match(imgRe) ?? [];
      for (const tag of matches) {
        if (!/\salt\s*=/.test(tag)) {
          offenders.push({
            file: relative(ROOT, file),
            snippet: tag.slice(0, 120),
          });
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test("no clickable `<div>` or `<span>` (use a `<button>` instead)", () => {
    // A click handler on a non-interactive element steals from keyboard users
    // (no Enter/Space, no focus). The exception list below is for elements
    // where the click is wired to a child `<button>`/`<a>` and the wrapper
    // only proxies for mouse pointer events (see Tooltip).
    const exemptFiles = new Set([
      // Tooltip wraps focusable children; mouseenter on the wrapper is the
      // pattern for SC 1.4.13 "hoverable" coverage.
      "components/Tooltip.tsx",
    ]);
    const offenders: Array<{ file: string; tag: string }> = [];
    const re = /<(div|span|li|article|section|aside|figure|header|footer|nav)\b[^>]*?\bonClick\s*=/gs;
    for (const file of TSX_FILES) {
      const rel = relative(ROOT, file);
      if (exemptFiles.has(rel)) continue;
      const src = readFileSync(file, "utf8");
      let match: RegExpExecArray | null;
      while ((match = re.exec(src)) !== null) {
        offenders.push({ file: rel, tag: match[0]!.slice(0, 80) });
      }
    }
    expect(offenders).toEqual([]);
  });

  test("every `<a>` with `target=\"_blank\"` declares `rel`", () => {
    // SC 3.2.5 (Change on Request) + tabnabbing protection. `noreferrer`
    // implies `noopener`, which is what we want.
    const offenders: Array<{ file: string; tag: string }> = [];
    const anchorRe = /<a\b[^>]*?target\s*=\s*["']_blank["'][^>]*?>/gs;
    for (const file of TSX_FILES) {
      const src = readFileSync(file, "utf8");
      const matches = src.match(anchorRe) ?? [];
      for (const tag of matches) {
        if (!/\brel\s*=/.test(tag)) {
          offenders.push({
            file: relative(ROOT, file),
            tag: tag.slice(0, 120),
          });
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test("`focus:outline-none` is always paired with a focus-visible ring", () => {
    // Removing the default outline without a replacement ring is a 2.4.7
    // (Focus Visible) violation. We accept either `focus-visible:ring` (the
    // modern pattern, keyboard-only) or `focus:ring` (always-visible — fine
    // for text inputs and the skip-link).
    const offenders: Array<{ file: string; line: number; text: string }> = [];
    for (const file of TSX_FILES) {
      const src = readFileSync(file, "utf8");
      const lines = src.split(/\r?\n/);
      lines.forEach((text, i) => {
        if (!text.includes("focus:outline-none")) return;
        const hasReplacement =
          text.includes("focus:ring") ||
          text.includes("focus-visible:ring") ||
          text.includes("focus-visible:outline");
        if (!hasReplacement) {
          offenders.push({
            file: relative(ROOT, file),
            line: i + 1,
            text: text.trim().slice(0, 120),
          });
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  test("the legacy below-AA `textmuted` hex (#5a5a78) only appears via the `textfaint` token", () => {
    // After the contrast bump, the old value was demoted to a `textfaint`
    // token reserved for purely decorative use (e.g. SVG axis labels with a
    // visible duplicate label). Any other inline occurrence is a regression
    // — text colored at #5a5a78 fails WCAG 1.4.3 (Contrast).
    const offenders: Array<{ file: string; line: number; text: string }> = [];
    // Files whose job is to *define* the legacy color are exempt.
    const exemptFiles = new Set([
      "../tailwind.config.js",
      "lib/a11y.test.ts",
    ]);
    for (const file of ALL_TS_FILES) {
      const rel = relative(ROOT, file);
      if (exemptFiles.has(rel)) continue;
      const src = readFileSync(file, "utf8");
      const lines = src.split(/\r?\n/);
      lines.forEach((text, i) => {
        if (!/#5a5a78/i.test(text)) return;
        // Inline SVG `fill="#888fad"` etc. are fine; we only flag the legacy
        // hex itself. Once a follow-up pass switches the SVG to currentColor
        // this test can also disallow `#888fad` outside the token file.
        offenders.push({
          file: rel,
          line: i + 1,
          text: text.trim().slice(0, 120),
        });
      });
    }
    expect(offenders).toEqual([]);
  });

  test("no `role=\"tab\"` / `role=\"tablist\"` without full tab widget semantics", () => {
    // Filter chips and twin switchers use `role=\"group\"` + `aria-pressed`
    // (see SegControl). Tab roles imply arrow-key navigation and tabpanels —
    // using them on simple toggle groups misleads screen readers.
    const offenders: Array<{ file: string; line: number; text: string }> = [];
    for (const file of TSX_FILES) {
      const src = readFileSync(file, "utf8");
      const lines = src.split(/\r?\n/);
      lines.forEach((text, i) => {
        if (!/role\s*=\s*["']tab(?:list)?["']/.test(text)) return;
        offenders.push({
          file: relative(ROOT, file),
          line: i + 1,
          text: text.trim().slice(0, 120),
        });
      });
    }
    expect(offenders).toEqual([]);
  });

  test("no `role=\"radio\"` / `role=\"radiogroup\"` without keyboard support", () => {
    // Single-select cards and tone pickers use `role=\"group\"` + `aria-pressed`
    // instead of radio semantics that require arrow-key roving focus.
    const offenders: Array<{ file: string; line: number; text: string }> = [];
    for (const file of TSX_FILES) {
      const src = readFileSync(file, "utf8");
      const lines = src.split(/\r?\n/);
      lines.forEach((text, i) => {
        if (!/role\s*=\s*["']radio(?:group)?["']/.test(text)) return;
        offenders.push({
          file: relative(ROOT, file),
          line: i + 1,
          text: text.trim().slice(0, 120),
        });
      });
    }
    expect(offenders).toEqual([]);
  });
});
