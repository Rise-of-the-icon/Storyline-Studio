# 03 · Data Model

All types live in `src/types/`. All persistence goes through `src/lib/storage.ts`. Nothing else touches `localStorage`. Every stored object carries a `schemaVersion` so we can detect drift (Five Challenge T2).

## Entities & TypeScript types

```ts
// src/types/twin.ts

export const SCHEMA_VERSION = 1;

export type Confidence = "High" | "Medium" | "Low";
export type Sensitivity = "Low" | "Medium" | "High";
export type Visibility = "Private" | "Internal" | "Public";
export type ReviewStatus = "Draft" | "NeedsReview" | "Reviewed" | "Rejected";

export type EventType =
  | "Personal" | "Career" | "Achievement" | "Award" | "Relationship"
  | "Education" | "Business" | "Legacy" | "Historical" | "Custom";

export interface SourceObject {
  type: "wikipedia" | "custom" | "manual";
  url?: string;
  citation?: string;
  verified: boolean;
  importedAtISO: string;   // when captured
  revisionId?: string;     // pin Wikipedia revision (Five Challenge data-validity)
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date?: string;
  year: number;
  decade: string;          // e.g. "1990s" — used for grouping in S3
  eventType: EventType;
  source: SourceObject;
  confidence: Confidence;
  approvalStatus: ReviewStatus;
  sensitivity: Sensitivity;
  emotionalSignificance: number; // 0–100
}

export interface CustomMoment {
  id: string;
  title: string;
  date?: string;
  description: string;
  emotionalSignificance: string; // free text in POC; could become 0–100
  visibility: Visibility;
  sensitivity: Sensitivity;
  sourceNotes: string;
}

export interface GuardrailReview {
  eventId: string;          // refers to a TimelineEvent or CustomMoment id
  trigger: string;          // e.g. "Private relationships"
  severity: Sensitivity;
  status: ReviewStatus;     // NeedsReview → Reviewed | Rejected
  editorialNote?: string;   // required for High severity (gate 4)
  reviewedAtISO?: string;
}

export interface WikipediaProfile {
  pageId: string;
  title: string;
  summary: string;
  description: string;
  imageUrl?: string;
  sourceUrl: string;
  revisionId?: string;
}

export interface DigitalTwinProfile {
  schemaVersion: number;          // === SCHEMA_VERSION
  twinId: string;
  consentAcknowledged: boolean;   // gate 4 — must be true before save
  coreIdentity: { name: string };
  wikipedia: WikipediaProfile;
  timeline: TimelineEvent[];
  customMoments: CustomMoment[];
  guardrailReviews: GuardrailReview[];
  draftStatus: "draft" | "saved";
  createdAtISO: string;
}
```

```ts
// src/types/resolver.ts  (see 06-EMOTIONAL-RESOLVER.md for the engine)

export type Domain = "sports" | "music";

export interface ResolverInput {
  domain: Domain;
  archetype: string;            // selected anchor
  eventId: string;              // selected timeline event
  intent: string;               // user intent
  mode: "Narrator" | "Q&A" | "Documentary";
  sensitivity: Sensitivity;
  confidence: Confidence;
}

export interface ResolverBeat {
  role: string;                 // OPEN / BUILD / PEAK (or settle variants)
  state: string;                // resolved leaf state
  steeringTag: string;
  intensity: number;            // 0–100
}

export interface ResolverOutput {
  domain: Domain;
  winningFamily: string;
  signatureState: string;
  direction: "ascending" | "settle" | "steady";
  beats: ResolverBeat[];
  intensity: number;
  warmth: number;
  pacing: number;
  confidence: number;
  reason: string;
  guardrailWarnings: string[];
}
```

## localStorage schema

Single module `storage.ts`. Hierarchical, namespaced keys. No whitespace/slashes/quotes in keys.

```
ricon:twin:{twinId}        → DigitalTwinProfile (JSON)
ricon:index                → string[] of twinIds
ricon:draft                → the in-progress draft twinId (or null)
```

Rules:
- Every read validates `schemaVersion === SCHEMA_VERSION`. On mismatch, log a warning and treat as missing (do not crash).
- Every write goes through `storage.ts` functions: `saveTwin`, `getTwin`, `listTwins`, `setDraft`, `getDraft`, `clearDraft`.
- Wrap all `localStorage` calls in try/catch; storage can throw (quota, private mode).
- IDs: generate with `crypto.randomUUID()`.

## Demo data (Five Challenge B1 — never live-fetch in a demo)

Seed a local `src/lib/mockData.ts` with **fully-built demo twins** (start with Michael Jordan). Include:
- 10 timeline events grouped across decades, with realistic confidence levels (a couple "Medium").
- At least one **intentional guardrail flag** so the review flow demonstrates itself on cue.
- At least one **low-confidence / edge-case** record so the State Catalog states are demonstrable.
The Search screen should be able to resolve demo subjects from this local set if the Wikipedia API is unavailable.
