import { afterEach, describe, expect, it, vi } from "vitest";
import { makeWikipediaSource } from "@/lib/contentModel";
import { deleteActiveDraft, saveTwin, setDraft } from "@/lib/storage";
import { SCHEMA_VERSION, type DigitalTwinProfile } from "@/types/twin";
import { createHttpTwinRemoteStorage } from "./httpTwinRemoteStorage";
import {
  configureTwinRemoteStorage,
  deleteTwinFromRemote,
  flushTwinRemoteStorage,
  mirrorTwinToRemote,
  type TwinRemoteStorageService,
} from "./twinRemoteStorage";

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
}

function twin(): DigitalTwinProfile {
  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: "twin-remote",
    consentAcknowledged: true,
    coreIdentity: { name: "Remote subject" },
    wikipedia: {
      pageId: "remote-subject",
      title: "Remote subject",
      summary: "Summary",
      description: "Description",
      sourceUrl: "https://example.com/remote",
    },
    timeline: [
      {
        id: "evt-1",
        title: "Event",
        description: "Description.",
        year: 2020,
        decade: "2020s",
        eventType: "Career",
        source: makeWikipediaSource("https://example.com/remote"),
        confidence: "High",
        approvalStatus: "Reviewed",
        sensitivity: "Low",
        emotionalSignificance: 80,
      },
    ],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: "2026-06-02T12:00:00.000Z",
  };
}

afterEach(async () => {
  await flushTwinRemoteStorage();
  configureTwinRemoteStorage(null);
  vi.unstubAllGlobals();
});

describe("remote twin storage coordinator", () => {
  it("mirrors queued saves and deletions when a remote service is configured", async () => {
    const service: TwinRemoteStorageService = {
      getTwin: vi.fn(),
      listTwins: vi.fn(),
      upsertTwin: vi.fn().mockResolvedValue(undefined),
      deleteTwin: vi.fn().mockResolvedValue(undefined),
    };
    configureTwinRemoteStorage(service);

    mirrorTwinToRemote(twin());
    deleteTwinFromRemote("twin-remote");
    await flushTwinRemoteStorage();

    expect(service.upsertTwin).toHaveBeenCalledWith(
      expect.objectContaining({ twinId: "twin-remote" }),
    );
    expect(service.deleteTwin).toHaveBeenCalledWith("twin-remote");
  });

  it("keeps later mirror writes running after a remote failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const upsertTwin = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);
    configureTwinRemoteStorage({
      getTwin: vi.fn(),
      listTwins: vi.fn(),
      upsertTwin,
      deleteTwin: vi.fn(),
    });

    mirrorTwinToRemote(twin());
    mirrorTwinToRemote({ ...twin(), twinId: "twin-next" });
    await flushTwinRemoteStorage();

    expect(upsertTwin).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("mirrors the existing local save and explicit delete path without disrupting local success", async () => {
    vi.stubGlobal("localStorage", new MemoryStorage());
    const upsertTwin = vi.fn().mockRejectedValue(new Error("offline"));
    const deleteTwin = vi.fn().mockResolvedValue(undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    configureTwinRemoteStorage({
      getTwin: vi.fn(),
      listTwins: vi.fn(),
      upsertTwin,
      deleteTwin,
    });

    const saved = saveTwin(twin());
    expect(saved?.twinId).toBe("twin-remote");
    setDraft("twin-remote");
    expect(deleteActiveDraft()).toBe(true);
    await flushTwinRemoteStorage();

    expect(upsertTwin).toHaveBeenCalledWith(
      expect.objectContaining({ twinId: "twin-remote" }),
    );
    expect(deleteTwin).toHaveBeenCalledWith("twin-remote");
    warn.mockRestore();
  });
});

describe("HTTP remote twin adapter", () => {
  it("sends twin upserts to an API without exposing a database dependency", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const service = createHttpTwinRemoteStorage({
      baseUrl: "/api",
      fetcher,
    });
    const profile = twin();

    await service.upsertTwin(profile);

    expect(fetcher).toHaveBeenCalledWith("/api/twins/twin-remote", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  });

  it("rejects invalid API profile payloads before they reach the UI", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ twinId: "bad-profile" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const service = createHttpTwinRemoteStorage({
      baseUrl: "/api",
      fetcher,
    });

    await expect(service.getTwin("bad-profile")).rejects.toThrow(/invalid profile shape/);
  });

  it("uses the documented read, list, and delete endpoints", async () => {
    const profile = twin();
    const fetcher = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(
        new Response(
          JSON.stringify(url.endsWith("/twins") ? [profile] : profile),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    });
    const service = createHttpTwinRemoteStorage({
      baseUrl: "/api/",
      fetcher,
    });

    await expect(service.getTwin("twin-remote")).resolves.toEqual(profile);
    await expect(service.listTwins()).resolves.toEqual([profile]);
    await expect(service.deleteTwin("twin-remote")).resolves.toBeUndefined();

    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/twins/twin-remote");
    expect(fetcher).toHaveBeenNthCalledWith(2, "/api/twins");
    expect(fetcher).toHaveBeenNthCalledWith(3, "/api/twins/twin-remote", {
      method: "DELETE",
    });
  });
});
