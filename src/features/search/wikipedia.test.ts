import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_SUBJECTS, getDemoSubjectById } from "@/data/demoSubjects";
import {
  createDraftFromDemoSubject,
  createDraftFromWikipedia,
  detectDisambiguation,
  searchWikipedia,
} from "./wikipedia";
import type { WikipediaProfile } from "@/types/twin";

const FORBIDDEN_LEAK_STRINGS = [
  "Demo Subject",
  "mock-page",
  "Mock summary for storage test.",
  "Mock description.",
  "Storage Test Twin",
  "storage-harness-fixture",
];

function assertNoFixtureLeak(serialized: string) {
  for (const needle of FORBIDDEN_LEAK_STRINGS) {
    expect(serialized).not.toContain(needle);
  }
}

describe("createDraftFromWikipedia (gate: no fixture leak into real flow)", () => {
  it("uses the Wikipedia title as the canonical identity name", () => {
    const profile: WikipediaProfile = {
      pageId: "12345",
      title: "Michael Jordan",
      summary: "American former professional basketball player and businessman.",
      description: "American basketball player (born 1963)",
      imageUrl: "https://upload.wikimedia.org/.../MJ.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Michael_Jordan",
      revisionId: "rev-1",
    };

    const draft = createDraftFromWikipedia(profile);

    expect(draft.coreIdentity.name).toBe("Michael Jordan");
    expect(draft.wikipedia.title).toBe("Michael Jordan");
    expect(draft.wikipedia.pageId).toBe("12345");
    expect(draft.wikipedia.summary).toBe(profile.summary);
    expect(draft.wikipedia.sourceUrl).toBe(profile.sourceUrl);
    expect(draft.draftStatus).toBe("draft");
    expect(draft.consentAcknowledged).toBe(false);
    expect(draft.twinId).toEqual(expect.any(String));
    expect(draft.twinId.length).toBeGreaterThan(0);

    assertNoFixtureLeak(JSON.stringify(draft));
  });

  it("preserves description and revision when both are present", () => {
    const profile: WikipediaProfile = {
      pageId: "67890",
      title: "Serena Williams",
      summary: "American former professional tennis player.",
      description: "American tennis player",
      sourceUrl: "https://en.wikipedia.org/wiki/Serena_Williams",
      revisionId: "rev-2",
    };

    const draft = createDraftFromWikipedia(profile);

    expect(draft.coreIdentity.name).toBe("Serena Williams");
    expect(draft.wikipedia.description).toBe("American tennis player");
    expect(draft.wikipedia.revisionId).toBe("rev-2");
    assertNoFixtureLeak(JSON.stringify(draft));
  });
});

describe("detectDisambiguation (heuristic)", () => {
  it("flags titles ending with '(disambiguation)'", () => {
    expect(detectDisambiguation("Jordan (disambiguation)", "")).toBe(true);
    expect(
      detectDisambiguation("Michael Jordan (disambiguation)", "Anything here"),
    ).toBe(true);
  });

  it("flags excerpts with 'may refer to'", () => {
    expect(
      detectDisambiguation("Jordan", "Jordan may refer to: a country, a person"),
    ).toBe(true);
    expect(
      detectDisambiguation("Phoenix", "Phoenix may also refer to: many things"),
    ).toBe(true);
  });

  it("flags excerpts saying 'is a disambiguation page'", () => {
    expect(
      detectDisambiguation("Apple", "Apple is a disambiguation page on Wikipedia"),
    ).toBe(true);
  });

  it("does not flag real biographies", () => {
    expect(
      detectDisambiguation(
        "Michael Jordan",
        "American basketball player who won six NBA championships",
      ),
    ).toBe(false);
    expect(
      detectDisambiguation(
        "Serena Williams",
        "American former professional tennis player",
      ),
    ).toBe(false);
  });
});

describe("searchWikipedia (error → demo fallback flag)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 'unavailable' error code when network fails (still falling back to demo)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const res = await searchWikipedia("michael jordan");
    expect(res.source).toBe("demo");
    expect(res.error).toBe("unavailable");
  });

  it("returns 'rate-limited' error code on HTTP 429", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    } as Response);
    const res = await searchWikipedia("michael jordan");
    expect(res.source).toBe("demo");
    expect(res.error).toBe("rate-limited");
  });

  it("returns 'unavailable' on generic non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response);
    const res = await searchWikipedia("michael jordan");
    expect(res.error).toBe("unavailable");
  });

  it("does not set 'error' on a happy live response", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes("/v1/search/page")) {
        return {
          ok: true,
          json: async () => ({
            pages: [
              {
                id: 1,
                title: "Michael Jordan",
                excerpt: "American basketball player",
                thumbnail: { url: "/mj.jpg" },
              },
            ],
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ entities: {} }),
      } as Response;
    });
    const res = await searchWikipedia("michael jordan");
    expect(res.error).toBeUndefined();
    expect(res.source).toBe("live");
    expect(res.results[0]?.domain).toBe("sports");
    expect(res.results[0]?.isDisambiguation).toBe(false);
  });

  it("flags live results as disambiguation when the excerpt says 'may refer to'", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes("/v1/search/page")) {
        return {
          ok: true,
          json: async () => ({
            pages: [
              {
                id: 99,
                title: "Jordan",
                excerpt: "Jordan may refer to: a country in Asia, a person…",
              },
            ],
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ entities: {} }),
      } as Response;
    });
    const res = await searchWikipedia("jordan");
    expect(res.results[0]?.isDisambiguation).toBe(true);
    expect(res.results[0]?.domain).toBe("other");
  });
});

describe("createDraftFromDemoSubject (explicit demo fixture path)", () => {
  it("loads the David West demo with David West as the identity", () => {
    const subject = getDemoSubjectById("demo-david-west");
    expect(subject).toBeDefined();

    const draft = createDraftFromDemoSubject(subject!);

    expect(draft.coreIdentity.name).toBe("David West");
    expect(draft.wikipedia.title).toBe("David West");
    expect(draft.wikipedia.pageId).toBe("demo-david-west");
    expect(draft.wikipedia.sourceUrl).toContain("david-west");
    expect(draft.timeline.length).toBeGreaterThan(0);
    expect(draft.draftStatus).toBe("draft");
    expect(draft.consentAcknowledged).toBe(false);

    assertNoFixtureLeak(JSON.stringify(draft));
  });

  it("loads each demo subject under its own canonical name", () => {
    expect(DEMO_SUBJECTS.length).toBeGreaterThan(0);
    for (const subject of DEMO_SUBJECTS) {
      const draft = createDraftFromDemoSubject(subject);
      expect(draft.coreIdentity.name).toBe(subject.hit.title);
      expect(draft.coreIdentity.name).not.toBe("Demo Subject");
      expect(draft.wikipedia.pageId).not.toBe("mock-page");
      assertNoFixtureLeak(JSON.stringify(draft));
    }
  });
});
