# 09 · MongoDB Storage Readiness

## Current behavior

The POC remains local-first. `src/lib/storage.ts` is still the only module that
touches `localStorage`, so current autosave, refresh recovery, resume, and delete
flows behave exactly as before.

Successful profile saves and explicit active-draft deletions now also call the
dormant coordinator in `src/services/twinRemoteStorage.ts`. With no remote
service configured, those calls are no-ops.

## Why MongoDB is not imported in the browser

The browser must never connect directly to MongoDB or receive a MongoDB
connection string. A future server endpoint owns authentication, authorization,
validation, rate limiting, and MongoDB access. The browser talks only to an HTTP
adapter implementing `TwinRemoteStorageService`.

## Browser service contract

`src/services/twinRemoteStorage.ts` defines:

```ts
interface TwinRemoteStorageService {
  getTwin(twinId: string): Promise<DigitalTwinProfile | null>;
  listTwins(): Promise<DigitalTwinProfile[]>;
  upsertTwin(twin: DigitalTwinProfile): Promise<void>;
  deleteTwin(twinId: string): Promise<void>;
}
```

`src/services/httpTwinRemoteStorage.ts` provides a ready HTTP implementation.
Given `baseUrl: "/api"`, it expects:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/twins` | List twins the authenticated user may access |
| `GET` | `/api/twins/:twinId` | Read one authorized twin |
| `PUT` | `/api/twins/:twinId` | Validate and upsert one twin |
| `DELETE` | `/api/twins/:twinId` | Delete one authorized twin |

The later API may be implemented with Netlify Functions or another server
runtime. MongoDB credentials stay in server-only environment variables.

## Connection step for the backend phase

Once the authenticated API exists, configure the remote service once during app
bootstrap:

```ts
configureTwinRemoteStorage(
  createHttpTwinRemoteStorage({ baseUrl: "/api" }),
);
```

The local cache remains active so edits stay responsive and recoverable during a
temporary network failure. Remote writes are serialized, isolated from UI
errors, and retryable by a future sync policy.

## Server responsibilities before enabling sync

- Authenticate every request and authorize access to each `twinId`.
- Validate incoming JSON against the current `SCHEMA_VERSION`.
- Reject unknown fields or oversized payloads at the API boundary.
- Add ownership, organization, and server timestamps outside the client-owned
  `DigitalTwinProfile` document.
- Use idempotent upserts keyed by `twinId`.
- Add conflict handling before multi-device editing ships.
- Add observability and a retry policy for failed mirror writes.

## Media storage limitation

The current client-only POC stores uploaded image and video files as data URLs
inside a draft. Do not copy those large encoded values into MongoDB documents in
production. Add authenticated blob storage first, upload files there, and
persist only durable media references in MongoDB.

