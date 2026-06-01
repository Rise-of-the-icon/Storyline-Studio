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

  it("returns null for non sports/music", () => {
    expect(classifyByDescription("44th president of the United States")).toBe(
      null,
    );
    expect(classifyByDescription("American film director")).toBe(null);
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

  it("filters hits without a domain", async () => {
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
    ]);

    expect(classified).toHaveLength(1);
    expect(classified[0]?.domain).toBe("sports");
    expect(droppedCount).toBe(1);
  });
});
