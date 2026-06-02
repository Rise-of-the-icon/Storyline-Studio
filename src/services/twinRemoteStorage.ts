import type { DigitalTwinProfile } from "@/types/twin";

/**
 * Server-backed persistence contract for saved twin profiles.
 *
 * MongoDB must sit behind an authenticated API implementation of this
 * interface. Browser code must never import a MongoDB driver or receive a
 * database connection string.
 */
export interface TwinRemoteStorageService {
  getTwin(twinId: string): Promise<DigitalTwinProfile | null>;
  listTwins(): Promise<DigitalTwinProfile[]>;
  upsertTwin(twin: DigitalTwinProfile): Promise<void>;
  deleteTwin(twinId: string): Promise<void>;
}

let remoteStorage: TwinRemoteStorageService | null = null;
let pendingRemoteWrites = Promise.resolve();

export function configureTwinRemoteStorage(
  service: TwinRemoteStorageService | null,
): void {
  remoteStorage = service;
}

export function getTwinRemoteStorage(): TwinRemoteStorageService | null {
  return remoteStorage;
}

function enqueueRemoteWrite(
  operation: (service: TwinRemoteStorageService) => Promise<void>,
): void {
  const service = remoteStorage;
  if (!service) return;

  pendingRemoteWrites = pendingRemoteWrites
    .then(() => operation(service))
    .catch((error: unknown) => {
      // Local persistence remains authoritative until remote sync is enabled
      // in product. A backend outage must not interrupt the current POC.
      console.warn("[remote-storage] sync failed; local draft preserved", error);
    });
}

export function mirrorTwinToRemote(twin: DigitalTwinProfile): void {
  enqueueRemoteWrite((service) => service.upsertTwin(twin));
}

export function deleteTwinFromRemote(twinId: string): void {
  enqueueRemoteWrite((service) => service.deleteTwin(twinId));
}

/** Test/dev hook for waiting until queued remote mirror writes settle. */
export function flushTwinRemoteStorage(): Promise<void> {
  return pendingRemoteWrites;
}

