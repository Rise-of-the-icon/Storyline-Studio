# Data Model — RICON Storyline Studio

Canonical TypeScript definitions live in `src/types/`. Profile persistence is owned exclusively by `src/lib/storage.ts`. Display-layer mappings (badges, resolver inputs) live in `src/lib/contentModel.ts`.

For a shorter legacy reference, see [`03-DATA-MODEL.md`](03-DATA-MODEL.md). For how entities move through screens, see [`product-flow.md`](product-flow.md).

---

## Schema version

```ts
export const SCHEMA_VERSION = 2; // src/types/twin.ts
```

Every `DigitalTwinProfile` carries `schemaVersion`. On read:

| Version | Behavior |
|---|---|
| `2` | Loaded as-is |
| `1` | Migrated in-memory via `migrateV1ToV2()` (`src/lib/storage.ts`) |
| Other | Treated as missing; logged warning |

**V1 → V2 migration adds**

- `TimelineEvent.visibility` default `"Internal"`
- `TimelineEvent.category` ← `eventType`
- `TimelineEvent.summary` ← `description`
- `TimelineEvent.source.notes` ← legacy `citation`
- `CustomMoment.source` ← conservative producer inference (`customMomentSource`)

Never bump `SCHEMA_VERSION` without a migration function and tests (`storage.migration.test.ts`).

---

## Entity relationship (conceptual)

```
DigitalTwinProfile
├── coreIdentity { name }
├── wikipedia: WikipediaProfile
├── timeline[]: TimelineEvent
├── customMoments[]: CustomMoment
├── guardrailReviews[]: GuardrailReview
├── savedVoiceContexts[]?: SavedVoiceContext
├── consentAcknowledged (+ consentAcknowledgedAtISO?)
├── draftStatus: "draft" | "saved"
├── createdAtISO, lastSavedAtISO?
└── twinId, schemaVersion

GuardrailReview ──references──► TimelineEvent.id | CustomMoment.id (as eventId)
SavedVoiceContext ──references──► TimelineEvent.id (eventId)
ResolverInput ──references──► eventId (runtime only, not persisted on twin)
```

---

## Persistence enums (TitleCase — on-disk format)

Do not rename these without a schema bump.

| Type | Values |
|---|---|
| `Confidence` | `High` \| `Medium` \| `Low` |
| `Sensitivity` | `Low` \| `Medium` \| `High` |
| `Visibility` | `Private` \| `Internal` \| `Public` |
| `ReviewStatus` | `Draft` \| `NeedsReview` \| `Reviewed` \| `Rejected` \| `Deferred` |
| `EventType` | `Personal` \| `Career` \| `Achievement` \| `Award` \| `Relationship` \| `Education` \| `Business` \| `Legacy` \| `Historical` \| `Custom` |

`Deferred` is valid only on `GuardrailReview.status`, not on timeline approval.

---

## Display enums (lowercase — UI / API layer)

Mapped in `contentModel.ts`; do not persist these strings directly.

| Type | Purpose |
|---|---|
| `SourceType` | `wikipedia` \| `producer` \| `demo` \| `manual` \| `unknown` |
| `DisplayConfidence` | Badge copy for confidence |
| `DisplayApprovalStatus` | Badge copy for approval |
| `DisplayVisibility` | Badge copy for visibility |
| `DisplaySensitivity` | Badge copy for sensitivity |

---

## Core entities

### `SourceObject` (timeline persistence)

Legacy-compatible provenance block on each `TimelineEvent`.

| Field | Type | Notes |
|---|---|---|
| `type` | string union | Includes `wikipedia`, `custom`, `manual`, `producer`, `demo`, `unknown` |
| `url` | optional string | Wikipedia or external link |
| `citation` | optional string | Legacy; migrated to `notes` |
| `notes` | optional string | Producer notes |
| `verified` | boolean | Source trusted for guardrails |
| `importedAtISO` | string | Capture time |
| `revisionId` | optional string | Wikipedia revision pin |

### `SourceReference` (canonical guardrail / badge shape)

Used by `CustomMoment.source` and `toSourceReference(event.source)`.

| Field | Type |
|---|---|
| `sourceType` | `SourceType` |
| `sourceUrl` | optional |
| `sourceNotes` | optional |
| `verified` | boolean |
| `importedAtISO` | optional |
| `revisionId` | optional |

### `TimelineEvent`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `crypto.randomUUID()` |
| `title` | string | |
| `description` | string | Required body; alias `summary` |
| `summary` | optional | V2 alias |
| `date` | optional string | Display date |
| `year` | number | Used for sorting / resolver |
| `decade` | string | e.g. `"1990s"` — S3 grouping |
| `eventType` | `EventType` | Alias `category` |
| `category` | optional | V2 alias |
| `source` | `SourceObject` | |
| `confidence` | `Confidence` | Heuristic or curated |
| `approvalStatus` | `ReviewStatus` | Producer approve/defer |
| `sensitivity` | `Sensitivity` | Drives guardrails |
| `visibility` | optional `Visibility` | Default `Internal` after migration |
| `emotionalSignificance` | number | 0–100 |

**Voice Studio eligibility:** typically `approvalStatus === "Reviewed"` (see `eligibleVoiceStudioEvents` in `contentModel.ts`).

### `CustomMoment`

| Field | Type | Notes |
|---|---|---|
| `id` | string | UUID |
| `title` | string | Max 80 in UI validator |
| `date` | optional string | Required in UI validator |
| `description` | string | Max 600 in UI |
| `emotionalSignificance` | string | Free text (not 0–100) |
| `visibility` | `Visibility` | Public → source notes required |
| `sensitivity` | `Sensitivity` | High → S5 flags |
| `sourceNotes` | string | Audit trail |
| `source` | optional `SourceReference` | V2; inferred on migration |
| `media` | optional `CustomMomentMedia[]` | See media limits below |

#### `CustomMomentMedia`

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `type` | `image` \| `video` \| `youtube` | |
| `url` | string | Data URL (uploads) or YouTube URL |
| `label` | optional | A11y / caption |
| `fileName` | optional | Original upload name |

**POC storage:** uploads encoded as data URLs inside the JSON blob — not suitable for MongoDB sync at scale (see `known-limitations.md`).

### `GuardrailFlag` vs `GuardrailReview`

| | `GuardrailFlag` | `GuardrailReview` |
|---|---|---|
| Persisted | No (detection-time) | Yes, on twin |
| Produced by | `evaluateGuardrailFlags()` | `evaluateGuardrails()` + producer actions |
| Fields | `itemId`, `itemKind`, `ruleId`, `trigger`, `severity`, `requiresEditorialNote`, `source` | `eventId`, `trigger`, `severity`, `status`, `editorialNote?`, `reviewedAtISO?` |

Rules are declared in `GUARDRAIL_RULES` (`src/lib/guardrails.ts`).

### `WikipediaProfile` / `SubjectProfile`

| Field | Type |
|---|---|
| `pageId` | string |
| `title` | string |
| `summary` | string (HTML stripped at import) |
| `description` | string |
| `imageUrl` | optional |
| `sourceUrl` | string |
| `revisionId` | optional |

`SubjectProfile` is currently a type alias for `WikipediaProfile`.

### `DigitalTwinProfile` (aliases: `DraftProfile`)

Top-level persisted document.

| Field | Type | Notes |
|---|---|---|
| `schemaVersion` | number | Must match `SCHEMA_VERSION` after load |
| `twinId` | string | UUID |
| `consentAcknowledged` | boolean | Gate 4 |
| `consentAcknowledgedAtISO` | optional string | First ack timestamp |
| `coreIdentity` | `{ name: string }` | |
| `wikipedia` | `WikipediaProfile` | |
| `timeline` | `TimelineEvent[]` | |
| `customMoments` | `CustomMoment[]` | |
| `guardrailReviews` | `GuardrailReview[]` | |
| `savedVoiceContexts` | optional `SavedVoiceContext[]` | From Voice Context Preview |
| `draftStatus` | `"draft"` \| `"saved"` | Set on S5 save |
| `createdAtISO` | string | |
| `lastSavedAtISO` | optional string | Updated every successful `saveTwin()` |

### `SavedVoiceContext` (alias: `VoiceContext`)

Snapshot from finalized Voice Studio session — **not audio**.

| Field | Type |
|---|---|
| `id`, `savedAtISO` | identifiers |
| `eventId`, `eventTitle` | anchoring moment |
| `audience`, `mode` | scene |
| `narrativeGoalId`, `narrativeGoalLabel` | scene |
| `signatureState`, `winningFamily`, `direction` | resolver |
| `intensity`, `warmth`, `pacing`, `confidence` | parameters |
| `reason`, `steeringTag` | copy / tag |
| `sampleScript` | deterministic script from `buildSampleScript()` |

---

## Resolver types (`src/types/resolver.ts`)

Runtime-only (stored inside `StudioContext`, not on twin — except via `SavedVoiceContext` fields).

### `ResolverInput`

| Field | Type |
|---|---|
| `domain` | `sports` \| `music` |
| `archetype` | string |
| `eventId` | string |
| `eventTitle`, `eventContext` | optional strings |
| `emotionalSignificance` | optional 0–100 |
| `intent` | string (narrative goal text) |
| `mode` | `Narrator` \| `Q&A` \| `Documentary` |
| `sensitivity`, `confidence` | from selected event |

### `ResolverOutput`

| Field | Type |
|---|---|
| `domain`, `winningFamily`, `signatureState` | |
| `direction` | `ascending` \| `settle` \| `steady` |
| `beats` | `ResolverBeat[]` (3 beats) |
| `intensity`, `warmth`, `pacing`, `confidence` | 0–100 integers |
| `reason` | biographical string |
| `guardrailWarnings` | string[] (annotations) |

Pure function: `resolve(input)` in `src/lib/resolver.ts` — no I/O.

---

## localStorage schema

**Owner:** `src/lib/storage.ts` only (except one UI preference in `HowItWorksPanel` — see architecture doc).

| Key | Value |
|---|---|
| `ricon:twin:{twinId}` | JSON `DigitalTwinProfile` |
| `ricon:index` | JSON `string[]` of twinIds |
| `ricon:draft` | active draft `twinId` or removed when cleared |

### Public API

| Function | Purpose |
|---|---|
| `saveTwin(twin)` | Normalize, write payload + index; mirror remote if configured; returns saved twin or `null` |
| `getTwin(twinId)` | Parse + migrate |
| `listTwins()` | All valid twins from index |
| `setDraft(twinId \| null)` | Active draft pointer |
| `getDraft()` | Load active draft profile |
| `clearDraft()` | Remove draft pointer only |
| `deleteActiveDraft()` | Delete twin payload, index entry, pointer |
| `resetAllRiconStorage()` | Dev/demo wipe of all `ricon:*` keys |
| `migrateV1ToV2(draft)` | Pure migration (testable) |

### Write rules

- All `localStorage` access wrapped in try/catch (quota, private mode).
- IDs: `crypto.randomUUID()`.
- `saveTwin` stamps `schemaVersion` and `lastSavedAtISO`.
- Failed write returns `null` — UI keeps in-memory draft and may retry.

---

## Import bundle (transient)

`generateImportBundle()` returns:

```ts
interface ImportBundle {
  timeline: TimelineEvent[];
  customMoments: CustomMoment[];
  guardrailReviews: GuardrailReview[];
}
```

Merged into draft on S2 import completion. Demo subjects skip heuristic parsing and load curated fixtures from `src/data/demoSubjects.ts`.

---

## Remote persistence (dormant)

`src/services/twinRemoteStorage.ts` defines:

```ts
interface TwinRemoteStorageService {
  getTwin(twinId: string): Promise<DigitalTwinProfile | null>;
  listTwins(): Promise<DigitalTwinProfile[]>;
  upsertTwin(twin: DigitalTwinProfile): Promise<void>;
  deleteTwin(twinId: string): Promise<void>;
}
```

Successful local saves call `mirrorTwinToRemote()`; with no service configured, this is a no-op. HTTP adapter: `httpTwinRemoteStorage.ts` → `/api/twins`. **Browser never holds MongoDB credentials.**

See [`09-MONGODB-READINESS.md`](09-MONGODB-READINESS.md).

---

## Sanitization field limits (`src/lib/sanitize.ts`)

Safety ceiling (may be tighter in UI validators):

| Field key | Max length |
|---|---|
| `searchQuery` | 200 |
| `customMomentTitle` | 120 |
| `customMomentDate` | 64 |
| `customMomentDescription` | 2000 |
| `customMomentEmotionalSignificance` | 500 |
| `customMomentSourceNotes` | 500 |
| `editorialNote` | 1000 |
| `generic` | 2000 |

Custom moment **UI** caps (producer-readable) are lower — see `CUSTOM_MOMENT_FIELD_LIMITS` in `customMomentValidation.ts`.

---

## Demo data contract

`src/data/demoSubjects.ts` provides:

- Search fallback hits when Wikipedia fails
- Full twins via `useDemoSubject(id)` (Sports + Music domains)
- Intentional guardrail flags, mixed confidence, ~10+ timeline events

**Not** used for `storage` harness tests — use `src/dev/mockTwin.ts` (dev-only).

Detection in UI: `isDemoTwin(draft)` / `SourceType` `demo`.

---

## What to change where

| Change | Touch |
|---|---|
| New persisted field | `src/types/twin.ts`, migration, tests, `contentModel` if displayed |
| New guardrail rule | `GUARDRAIL_RULES` in `guardrails.ts`, tests |
| New storage key | **Avoid** — extend twin document instead |
| Resolver tuning | `RESOLVER_CONFIG` in `resolver.ts`, tests |
| AI behavior | `src/lib/ai.ts` only |
| Consent copy | `src/lib/consent.ts` |

---

## Related documentation

- [`product-flow.md`](product-flow.md) — when data is created/validated per screen
- [`known-limitations.md`](known-limitations.md) — POC boundaries
- [`06-EMOTIONAL-RESOLVER.md`](06-EMOTIONAL-RESOLVER.md) — resolver algorithm
- [`08-AI-SAFETY.md`](08-AI-SAFETY.md) — gates affecting stored/user data
