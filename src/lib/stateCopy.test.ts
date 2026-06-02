/**
 * Copy-pin regression tests for `src/lib/stateCopy.ts`.
 *
 * The brief mandates four specific loading-title strings (the cinematic
 * "editorial" copy). If anyone tweaks the constants, this suite fails
 * loudly so the QA log captures the deliberate copy change.
 *
 * Two contracts under test:
 *  1. Exact-string match for each brief-mandated title.
 *  2. Trailing-ellipsis invariant — `<LoadingState>` keys off the
 *     trailing `…` to skip its decorative animated gold ellipsis (so
 *     we never render "Searching public sources… …"). If a future copy
 *     change drops the ellipsis the renderer would emit a double-glyph
 *     visual bug; this test catches that contract drift up front.
 */

import { describe, expect, it } from "vitest";
import {
  IMPORT_LOADING_TITLE,
  SAVE_LOADING_TITLE,
  SEARCH_LOADING_TITLE,
  TIMELINE_LOADING_TITLE,
} from "./stateCopy";

const BRIEF_TITLES: Array<[string, string]> = [
  ["SEARCH_LOADING_TITLE", SEARCH_LOADING_TITLE],
  ["IMPORT_LOADING_TITLE", IMPORT_LOADING_TITLE],
  ["TIMELINE_LOADING_TITLE", TIMELINE_LOADING_TITLE],
  ["SAVE_LOADING_TITLE", SAVE_LOADING_TITLE],
];

describe("stateCopy — brief-mandated loading titles (exact strings)", () => {
  it("SEARCH_LOADING_TITLE is the editorial 'Searching public sources…'", () => {
    expect(SEARCH_LOADING_TITLE).toBe("Searching public sources…");
  });

  it("IMPORT_LOADING_TITLE is the editorial 'Building source profile…'", () => {
    expect(IMPORT_LOADING_TITLE).toBe("Building source profile…");
  });

  it("TIMELINE_LOADING_TITLE is the editorial 'Extracting timeline signals…'", () => {
    expect(TIMELINE_LOADING_TITLE).toBe("Extracting timeline signals…");
  });

  it("SAVE_LOADING_TITLE is the editorial 'Locking draft context…'", () => {
    expect(SAVE_LOADING_TITLE).toBe("Locking draft context…");
  });
});

describe("stateCopy — trailing ellipsis invariant (LoadingState renderer contract)", () => {
  // LoadingState skips its decorative gold-pulse `…` when the title
  // already ends with one (see src/components/LoadingState.tsx). Drop
  // the trailing `…` from these constants and the screen will render
  // "Searching public sources …" with the decorative pulse instead —
  // breaking the cinematic single-glyph look the brief specified.
  for (const [name, value] of BRIEF_TITLES) {
    it(`${name} ends with the Unicode horizontal ellipsis '…'`, () => {
      expect(value.endsWith("…")).toBe(true);
    });
  }

  it("uses Unicode '…' (U+2026), not three ASCII dots, so the renderer regex matches", () => {
    for (const [name, value] of BRIEF_TITLES) {
      const failures: string[] = [];
      if (/\.{3,}\s*$/.test(value)) failures.push(name);
      expect(failures).toEqual([]);
    }
  });
});
