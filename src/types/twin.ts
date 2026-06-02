/**
 * Canonical content model for RICON Storyline Studio.
 *
 * Two tiers coexist intentionally:
 *
 * 1. **Persistence types** (`Confidence`, `Sensitivity`, `Visibility`,
 *    `ReviewStatus`, `EventType`) use TitleCase string literals. These are the
 *    on-disk format in `localStorage`; changing them requires a schema bump
 *    + migration. Don't reach for new TitleCase literals — extend the
 *    *display* layer below instead.
 *
 * 2. **Display / API layer** (`SourceType`, `DisplayConfidence`,
 *    `DisplayApprovalStatus`, `DisplayVisibility`, `DisplaySensitivity`) uses
 *    lowercase string literals. These are what the UI badges, the resolver,
 *    and external integrations see. The mapping lives in
 *    `src/lib/contentModel.ts`.
 *
 * Bumping `SCHEMA_VERSION` requires a matching `migrateV1ToV2`-style
 * function in `src/lib/storage.ts`. Never silently drop data.
 */
export const SCHEMA_VERSION = 2;

// ===========================================================================
// Persistence enums (TitleCase — never break the wire format)
// ===========================================================================

export type Confidence = "High" | "Medium" | "Low";
export type Sensitivity = "Low" | "Medium" | "High";
export type Visibility = "Private" | "Internal" | "Public";
/**
 * Lifecycle states shared by `TimelineEvent.approvalStatus` and
 * `GuardrailReview.status`.
 *
 * - `Draft` / `NeedsReview` — work-in-progress; not yet acted on.
 * - `Reviewed` — producer explicitly cleared/approved.
 * - `Rejected` — producer explicitly removed (custom moments only).
 * - `Deferred` — producer acknowledged the flag but chose to address it
 *   later. Only valid for `GuardrailReview.status`. Medium/Low severity
 *   reviews may be deferred without blocking the final save; High severity
 *   reviews cannot (see `canSaveDraft()`).
 */
export type ReviewStatus =
  | "Draft"
  | "NeedsReview"
  | "Reviewed"
  | "Rejected"
  | "Deferred";

export type EventType =
  | "Personal"
  | "Career"
  | "Achievement"
  | "Award"
  | "Relationship"
  | "Education"
  | "Business"
  | "Legacy"
  | "Historical"
  | "Custom";

// ===========================================================================
// Display enums (lowercase — what the UI and resolver consume)
// ===========================================================================

/**
 * Canonical provenance label for any piece of content (timeline event or
 * custom moment). Replaces ad-hoc "is this from Wikipedia?" checks scattered
 * through the UI.
 *
 * - `wikipedia` — imported from a real Wikipedia page or our cached fixture.
 * - `producer`  — added by a producer through the Custom Moments drawer.
 * - `demo`      — seeded by `src/data/demoSubjects.ts` for the demo flow.
 *                 Visibly labelled "Demo profile" everywhere.
 * - `manual`    — entered by hand in a future producer tool (e.g. inline edit
 *                 of a Wikipedia timeline row). Not yet wired but reserved.
 * - `unknown`   — fallback used by the V1→V2 migration when the persisted
 *                 source predates this taxonomy. Treated as unverified.
 */
export type SourceType =
  | "wikipedia"
  | "producer"
  | "demo"
  | "manual"
  | "unknown";

export type DisplayConfidence = "high" | "medium" | "low" | "unknown";
export type DisplayApprovalStatus =
  | "approved"
  | "deferred"
  | "needsReview"
  | "rejected";
export type DisplayVisibility = "private" | "internal" | "public";
export type DisplaySensitivity = "low" | "medium" | "high";

// ===========================================================================
// Source model
// ===========================================================================

/**
 * Persistence shape for the provenance of a single timeline event.
 *
 * `type` is the legacy V1 string ("wikipedia" | "custom" | "manual"). V2
 * widens it to include "producer" | "demo" | "unknown" so the display layer
 * can be a 1:1 mapping. The narrower V1 values still parse cleanly:
 *   - "custom" → mapped to "producer" by `getSourceType()`
 *   - everything else passes through.
 */
export interface SourceObject {
  type: "wikipedia" | "custom" | "manual" | "producer" | "demo" | "unknown";
  url?: string;
  citation?: string;
  /** Free-form producer notes (e.g. "Corroborated by two engineers."). */
  notes?: string;
  verified: boolean;
  importedAtISO: string;
  revisionId?: string;
}

/**
 * Canonical content-model shape for source references. Used directly by
 * `CustomMoment.source` (new in V2) and via `toSourceReference(event.source)`
 * for timeline events. UI badges + the guardrail engine consume this shape.
 *
 * The difference from `SourceObject`: `sourceType` is the lowercase canonical
 * field, `sourceUrl` / `sourceNotes` replace the legacy `url` / `citation` /
 * `notes` triplet, and `verified` is required (no inference).
 */
export interface SourceReference {
  sourceType: SourceType;
  sourceUrl?: string;
  sourceNotes?: string;
  verified: boolean;
  importedAtISO?: string;
  revisionId?: string;
}

// ===========================================================================
// Timeline event
// ===========================================================================

export interface TimelineEvent {
  id: string;
  title: string;
  /**
   * Required body text — also accessible as `summary` via the content-model
   * helpers. We keep the persistence field name `description` so V1 drafts
   * load without a renamer.
   */
  description: string;
  /** Optional canonical alias of `description`. Filled in by the V2 migration. */
  summary?: string;
  date?: string;
  year: number;
  decade: string;
  /**
   * Internal taxonomy. The brief uses the word "category" for the same idea;
   * `category` below is an explicit alias kept in sync via the V2 migration.
   */
  eventType: EventType;
  /** Optional alias of `eventType`. Filled in by the V2 migration. */
  category?: EventType;
  source: SourceObject;
  confidence: Confidence;
  approvalStatus: ReviewStatus;
  sensitivity: Sensitivity;
  /**
   * Optional surface that controls how the event is allowed to be quoted in
   * the Voice Studio. Defaulted to `"Internal"` by the V2 migration; can be
   * narrowed to `"Private"` by an editorial reviewer.
   */
  visibility?: Visibility;
  emotionalSignificance: number;
}

// ===========================================================================
// Custom moment
// ===========================================================================

export interface CustomMoment {
  id: string;
  title: string;
  date?: string;
  description: string;
  emotionalSignificance: string;
  visibility: Visibility;
  sensitivity: Sensitivity;
  /**
   * Free-form notes the producer typed about the source. Preserved from V1
   * for back-compat (the V1 guardrail engine regex-scanned this string for
   * "unverified"/"rumor"/"speculation"). In V2 the structured `source` block
   * below is the source of truth.
   */
  sourceNotes: string;
  /**
   * Canonical V2 source block. Optional for back-compat with V1 drafts; the
   * V1→V2 migration fills it in with `{ sourceType: "producer", verified: false }`
   * for every legacy moment (the conservative "assume unverified" default
   * that satisfies the "avoid presenting unverified custom content as fact"
   * requirement).
   */
  source?: SourceReference;
  /** Optional producer-supplied media references. URLs only: no binary upload. */
  media?: CustomMomentMedia[];
}

export type CustomMomentMediaType = "image" | "video" | "youtube";

export interface CustomMomentMedia {
  id: string;
  type: CustomMomentMediaType;
  /**
   * Uploaded images/videos use a data URL so the client-only draft can
   * survive reloads. YouTube attachments keep the pasted watch/share URL.
   */
  url: string;
  /** Optional producer-facing caption used for accessible preview labels. */
  label?: string;
  /** Original local filename for uploaded image/video attachments. */
  fileName?: string;
}

// ===========================================================================
// Guardrails
// ===========================================================================

/**
 * Detection-time guardrail flag — what the guardrail engine emits *before*
 * an editorial reviewer engages. Persistence-free; lives in memory.
 *
 * `GuardrailReview` (below) is the persisted producer-facing record of how
 * the flag was resolved. Every `GuardrailReview` starts life as a
 * `GuardrailFlag` from `evaluateGuardrailFlags()`.
 */
export interface GuardrailFlag {
  /** The id of the timeline event or custom moment the flag points at. */
  itemId: string;
  /** Whether the flagged item is a `TimelineEvent` or a `CustomMoment`. */
  itemKind: "timeline" | "custom";
  /** Stable rule id from `GUARDRAIL_RULES` (e.g. `"unverified-custom-source"`). */
  ruleId: string;
  /** Human-readable rule trigger (mirrors `GuardrailRule.trigger`). */
  trigger: string;
  severity: Sensitivity;
  /** Whether an editorial note is required to clear this flag (Gate 4). */
  requiresEditorialNote: boolean;
  /** The provenance of the flagged item — surfaced in the S5 review list. */
  source: SourceReference;
}

export interface GuardrailReview {
  eventId: string;
  trigger: string;
  severity: Sensitivity;
  status: ReviewStatus;
  editorialNote?: string;
  reviewedAtISO?: string;
}

// ===========================================================================
// Subject + draft top-level shapes
// ===========================================================================

export interface WikipediaProfile {
  pageId: string;
  title: string;
  summary: string;
  description: string;
  imageUrl?: string;
  sourceUrl: string;
  revisionId?: string;
}

/**
 * Canonical content-model alias for "the subject of a digital twin". Today
 * subjects are always sourced from Wikipedia (or a curated demo fixture),
 * so `SubjectProfile` is structurally identical to `WikipediaProfile`. When
 * we add a second source backend (e.g. IMDb, label-supplied EPK), this
 * becomes a discriminated union and `WikipediaProfile` becomes one variant.
 */
export type SubjectProfile = WikipediaProfile;

/**
 * A finalized Voice Studio context — the producer-locked scene + resolver
 * output, captured for later reference. Lives on the twin so reloading the
 * draft restores the saved snapshots. Not the audio itself (this build has
 * no synth backend); see `voiceContext.ts` for shape details.
 */
export interface SavedVoiceContext {
  id: string;
  savedAtISO: string;
  eventId: string;
  eventTitle: string;
  audience: string;
  mode: string;
  narrativeGoalId: string;
  narrativeGoalLabel: string;
  signatureState: string;
  winningFamily: string;
  direction: string;
  intensity: number;
  warmth: number;
  pacing: number;
  confidence: number;
  reason: string;
  steeringTag: string;
  sampleScript: string;
}

/**
 * Canonical alias of `SavedVoiceContext` — the brief's `VoiceContext` name
 * maps to our existing persisted shape. New code should prefer this alias;
 * existing code that imports `SavedVoiceContext` keeps working unchanged.
 */
export type VoiceContext = SavedVoiceContext;

export interface DigitalTwinProfile {
  schemaVersion: number;
  twinId: string;
  consentAcknowledged: boolean;
  /**
   * ISO-8601 timestamp of when the user checked the import-step consent box.
   * Cleared (set to `undefined`) if consent is unchecked so a re-acknowledgement
   * is recorded fresh. Optional for backward compatibility with persisted twins
   * that pre-date this field — `schemaVersion` was unchanged when added.
   */
  consentAcknowledgedAtISO?: string;
  coreIdentity: { name: string };
  wikipedia: WikipediaProfile;
  timeline: TimelineEvent[];
  customMoments: CustomMoment[];
  guardrailReviews: GuardrailReview[];
  /**
   * Finalized voice contexts captured from SS4's "Save voice context" CTA.
   * Optional for backward compatibility with persisted drafts that pre-date
   * the Voice Context Preview panel.
   */
  savedVoiceContexts?: SavedVoiceContext[];
  draftStatus: "draft" | "saved";
  createdAtISO: string;
  /**
   * Updated on every successful `saveTwin()`. Used by the S6 summary card
   * ("Last saved 6/1/2026, 12:53 PM") and the S1 ResumeDraftPanel.
   * Optional for backward compatibility with persisted drafts that pre-date
   * the field — `getDraftSummary()` falls back to `createdAtISO` when this
   * is absent.
   */
  lastSavedAtISO?: string;
}

/**
 * Canonical alias of `DigitalTwinProfile`. The brief's `DraftProfile`
 * maps to our existing persisted top-level shape. New code should prefer
 * this alias; existing code that imports `DigitalTwinProfile` keeps
 * working unchanged.
 */
export type DraftProfile = DigitalTwinProfile;
