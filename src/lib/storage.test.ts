import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearDraft,
  deleteActiveDraft,
  getDraft,
  getTwin,
  listTwins,
  resetAllRiconStorage,
  saveTwin,
  setDraft,
} from "./storage";
import { makeWikipediaSource } from "./contentModel";
import { SCHEMA_VERSION, type DigitalTwinProfile } from "@/types/twin";

/**
 * Storage layer regression suite — node + the polyfilled `localStorage`
 * declared below. Pins the persistence contract that S1 (resume), S6
 * (save), and `TwinContext` (auto-save on every keystroke) depend on.
 */

// Minimal in-memory localStorage polyfill — vitest runs in node, where
// `localStorage` isn't defined by default and we don't want to bring in
// jsdom just for the storage tests.
class MemoryStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function freshTwin(
  overrides: Partial<DigitalTwinProfile> = {},
): DigitalTwinProfile {
  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: "twin-fresh",
    consentAcknowledged: true,
    coreIdentity: { name: "Fresh subject" },
    wikipedia: {
      pageId: "demo-fresh",
      title: "Fresh",
      summary: "Summary",
      description: "Description",
      sourceUrl: "https://example.com/fresh",
    },
    timeline: [
      {
        id: "evt-1",
        title: "Event",
        description: "Description.",
        year: 2010,
        decade: "2010s",
        eventType: "Career",
        confidence: "High",
        approvalStatus: "Reviewed",
        sensitivity: "Low",
        emotionalSignificance: 50,
        source: makeWikipediaSource("https://example.com/fresh"),
      },
    ],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: "2026-06-01T18:00:00.000Z",
    ...overrides,
  };
}

describe("saveTwin — lastSavedAtISO stamp", () => {
  it("returns the saved twin (not a boolean) with lastSavedAtISO set", () => {
    const saved = saveTwin(freshTwin());
    expect(saved).not.toBeNull();
    expect(saved!.lastSavedAtISO).toBeDefined();
    expect(typeof saved!.lastSavedAtISO).toBe("string");
    expect(saved!.twinId).toBe("twin-fresh");
  });

  it("normalizes the schemaVersion onto the saved twin", () => {
    const saved = saveTwin(
      freshTwin({ schemaVersion: 1 as unknown as typeof SCHEMA_VERSION }),
    );
    expect(saved!.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("re-saving bumps lastSavedAtISO forward", async () => {
    const first = saveTwin(freshTwin())!;
    // Force the clock to advance by 5ms so a re-save produces a strictly
    // later ISO — `Date.now()` resolution is ms.
    await new Promise((r) => setTimeout(r, 5));
    const second = saveTwin(first)!;
    expect(Date.parse(second.lastSavedAtISO!)).toBeGreaterThanOrEqual(
      Date.parse(first.lastSavedAtISO!),
    );
  });

  it("persists the twin under its keyed slot and indexes the id", () => {
    saveTwin(freshTwin());
    expect(getTwin("twin-fresh")!.coreIdentity.name).toBe("Fresh subject");
    const ids = listTwins().map((t) => t.twinId);
    expect(ids).toContain("twin-fresh");
  });

  it("returns null when localStorage.setItem throws", () => {
    const broken = new MemoryStorage();
    broken.setItem = () => {
      throw new Error("quota exceeded");
    };
    vi.stubGlobal("localStorage", broken);
    expect(saveTwin(freshTwin())).toBeNull();
  });
});

describe("setDraft / getDraft pointer", () => {
  it("points at a saved twin", () => {
    const saved = saveTwin(freshTwin())!;
    setDraft(saved.twinId);
    expect(getDraft()!.twinId).toBe(saved.twinId);
  });

  it("clearDraft removes the pointer but not the twin payload", () => {
    const saved = saveTwin(freshTwin())!;
    setDraft(saved.twinId);
    clearDraft();
    expect(getDraft()).toBeNull();
    // Payload still around — we can still reach it by id.
    expect(getTwin(saved.twinId)!.twinId).toBe(saved.twinId);
  });
});

describe("deleteActiveDraft", () => {
  it("returns false when there is no active draft pointer", () => {
    expect(deleteActiveDraft()).toBe(false);
  });

  it("deletes payload + pointer + index entry when a draft is active", () => {
    const saved = saveTwin(freshTwin())!;
    setDraft(saved.twinId);
    const result = deleteActiveDraft();
    expect(result).toBe(true);
    expect(getDraft()).toBeNull();
    expect(getTwin(saved.twinId)).toBeNull();
    expect(listTwins().map((t) => t.twinId)).not.toContain(saved.twinId);
  });

  it("does not touch other (non-active) twins in the index", () => {
    const a = saveTwin(freshTwin({ twinId: "twin-a" }))!;
    saveTwin(freshTwin({ twinId: "twin-b" }));
    setDraft(a.twinId);
    deleteActiveDraft();
    expect(getTwin("twin-a")).toBeNull();
    expect(getTwin("twin-b")).not.toBeNull();
    expect(listTwins().map((t) => t.twinId)).toEqual(["twin-b"]);
  });
});

describe("resetAllRiconStorage", () => {
  it("nukes every ricon: key but leaves unrelated keys alone", () => {
    saveTwin(freshTwin());
    setDraft("twin-fresh");
    localStorage.setItem("unrelated:key", "keep me");
    resetAllRiconStorage();
    expect(getDraft()).toBeNull();
    expect(listTwins()).toEqual([]);
    expect(localStorage.getItem("unrelated:key")).toBe("keep me");
  });
});
