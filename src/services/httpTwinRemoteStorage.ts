import { SCHEMA_VERSION, type DigitalTwinProfile } from "@/types/twin";
import type { TwinRemoteStorageService } from "./twinRemoteStorage";

export interface HttpTwinRemoteStorageOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}

function endpoint(baseUrl: string, twinId?: string): string {
  const root = `${baseUrl.replace(/\/$/, "")}/twins`;
  return twinId ? `${root}/${encodeURIComponent(twinId)}` : root;
}

async function expectOk(response: Response): Promise<void> {
  if (!response.ok) {
    throw new Error(`Twin storage request failed (${response.status})`);
  }
}

function parseRemoteTwin(value: unknown): DigitalTwinProfile {
  if (
    typeof value !== "object" ||
    value === null ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== SCHEMA_VERSION ||
    !("twinId" in value) ||
    typeof value.twinId !== "string" ||
    !("coreIdentity" in value) ||
    typeof value.coreIdentity !== "object" ||
    value.coreIdentity === null ||
    !("name" in value.coreIdentity) ||
    typeof value.coreIdentity.name !== "string" ||
    !("timeline" in value) ||
    !Array.isArray(value.timeline) ||
    !("customMoments" in value) ||
    !Array.isArray(value.customMoments) ||
    !("guardrailReviews" in value) ||
    !Array.isArray(value.guardrailReviews)
  ) {
    throw new Error("Twin storage response has an invalid profile shape");
  }
  return value as DigitalTwinProfile;
}

/**
 * Browser-facing adapter for a future authenticated API.
 *
 * The API implementation may use MongoDB internally, but this adapter remains
 * database-agnostic. Authentication can be added through same-origin cookies
 * or by wrapping `fetcher` with the app's future auth layer.
 */
export function createHttpTwinRemoteStorage({
  baseUrl,
  fetcher = fetch,
}: HttpTwinRemoteStorageOptions): TwinRemoteStorageService {
  return {
    async getTwin(twinId) {
      const response = await fetcher(endpoint(baseUrl, twinId));
      if (response.status === 404) return null;
      await expectOk(response);
      return parseRemoteTwin(await response.json());
    },

    async listTwins() {
      const response = await fetcher(endpoint(baseUrl));
      await expectOk(response);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error("Twin storage response has an invalid list shape");
      }
      return payload.map(parseRemoteTwin);
    },

    async upsertTwin(twin) {
      const response = await fetcher(endpoint(baseUrl, twin.twinId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(twin),
      });
      await expectOk(response);
    },

    async deleteTwin(twinId) {
      const response = await fetcher(endpoint(baseUrl, twinId), {
        method: "DELETE",
      });
      await expectOk(response);
    },
  };
}
