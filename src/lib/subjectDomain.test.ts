import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyByDescription,
  classifyByWikidata,
  classifyHits,
} from "./subjectDomain";

describe("classifyByDescription", () => {
  it("classifies sports descriptions", () => {
    expect(
      classifyByDescription("American former professional basketball player"),
    ).toBe("sports");
    expect(classifyByDescription("English footballer (born 1985)")).toBe(
      "sports",
    );
  });

  it("classifies music descriptions", () => {
    expect(classifyByDescription("American singer and songwriter")).toBe(
      "music",
    );
    expect(classifyByDescription("British rapper and record producer")).toBe(
      "music",
    );
  });

  it("classifies entertainment descriptions", () => {
    expect(classifyByDescription("American film director")).toBe("entertainment");
    expect(classifyByDescription("Mexican actress and producer")).toBe(
      "entertainment",
    );
    expect(classifyByDescription("Canadian stand-up comedian")).toBe(
      "entertainment",
    );
    expect(classifyByDescription("British television presenter")).toBe(
      "entertainment",
    );
  });

  it("returns null for genuinely unclassified roles", () => {
    expect(classifyByDescription("44th president of the United States")).toBe(
      null,
    );
    expect(classifyByDescription("Theoretical physicist")).toBe(null);
    expect(classifyByDescription("")).toBe(null);
  });
});

describe("classifyByWikidata", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps occupation Q-IDs to domain", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        entities: {
          Q42: {
            sitelinks: { enwiki: { title: "Test Athlete" } },
            claims: {
              P106: [
                {
                  mainsnak: {
                    datavalue: { value: { id: "Q3665646" } },
                  },
                },
              ],
            },
          },
        },
      }),
    } as Response);

    const map = await classifyByWikidata(["Test Athlete"]);
    expect(map.get("Test Athlete")).toBe("sports");
  });

  it("returns empty map on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const map = await classifyByWikidata(["Someone"]);
    expect(map.size).toBe(0);
  });
});

describe("classifyHits", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns every hit — unknowns fall back to 'other', never dropped", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ entities: {} }),
    } as Response);

    const { classified, droppedCount } = await classifyHits([
      {
        title: "Michael Jordan",
        description: "American basketball player (born 1963)",
      },
      { title: "Barack Obama", description: "44th president of the United States" },
      { title: "Greta Gerwig", description: "American film director" },
    ]);

    expect(classified).toHaveLength(3);
    expect(droppedCount).toBe(0);

    const byTitle = Object.fromEntries(
      classified.map((c) => [c.hit.title, c.domain]),
    );
    expect(byTitle["Michael Jordan"]).toBe("sports");
    expect(byTitle["Greta Gerwig"]).toBe("entertainment");
    expect(byTitle["Barack Obama"]).toBe("other");
  });

  it("uses Wikidata occupation for unknowns when description is bare", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        entities: {
          Q1: {
            sitelinks: { enwiki: { title: "Mystery Person" } },
            claims: {
              P106: [
                {
                  mainsnak: { datavalue: { value: { id: "Q33999" } } },
                },
              ],
            },
          },
        },
      }),
    } as Response);

    const { classified } = await classifyHits([
      { title: "Mystery Person", description: "" },
    ]);

    expect(classified[0]?.domain).toBe("entertainment");
  });

  it("preserves input order in the classified array", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ entities: {} }),
    } as Response);

    const { classified } = await classifyHits([
      { title: "A", description: "American basketball player" },
      { title: "B", description: "44th president of the United States" },
      { title: "C", description: "American singer" },
    ]);

    expect(classified.map((c) => c.hit.title)).toEqual(["A", "B", "C"]);
    expect(classified.map((c) => c.domain)).toEqual([
      "sports",
      "other",
      "music",
    ]);
  });
});
