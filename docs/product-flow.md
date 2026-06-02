# Product Flow — RICON Storyline Studio

This document describes the **implemented** producer flow as shipped in the current POC. It is written for product, design, and engineering readers who need to understand behavior **without reading React source**.

For screen regions and navigation shorthand, see [`04-SCREENS.md`](04-SCREENS.md). For loading/empty/error checklists, see [`05-STATES.md`](05-STATES.md). For types and persistence, see [`data-model.md`](data-model.md).

---

## How navigation works

The app does **not** use a URL router. A single `TwinContext` (`src/app/providers/TwinContext.tsx`) holds:

| State | Meaning |
|---|---|
| `screen` | Wizard screen `S1` … `S7` |
| `studioStep` | Voice Studio sub-step `SS1` … `SS4` (only on `S7`) |
| `draft` | In-memory `DigitalTwinProfile`, autosaved via `src/lib/storage.ts` |

**Persistent chrome**

- **Every screen:** `AppHeader` (logo/home, step title, optional Save Draft on wizard steps).
- **S2–S6:** `WizardHeader` with 7-step `WizardStepper` + `TwinContextSummary` (subject name, source badge, flag count).
- **S7:** Three-panel Voice Studio layout (twin context · center stage · resolver), `StudioBreadcrumb`, optional `HowItWorksPanel`.

**Exit / unsaved work**

- Leaving S2–S5 or S7 via logo/home may show a confirm dialog when `hasUnsavedProgress` is true (`src/app/navigation/unsavedChanges.ts`).
- S6 does not confirm on exit — the draft is already committed at save.
- **Clear draft** on S1 hard-deletes the active twin from `localStorage` (with confirmation).

```
S1 → S2 (select subject)
S2 ← S1 · S2 → S3 (import + consent)
S3 ← S2 · S3 → S4 (≥1 approved event)
S4 ← S3 · S4 → S5
S5 ← S4 · S5 → S6 (save; High flags resolved) · S5 → S4 (reject loop)
S6 → S7 · S6 → S3 (back to timeline)
S7 ← S6
  SS1 → SS2 → SS3 → SS4 → Finalize → Voice Context Preview
```

**Code map**

| Screen | Primary module |
|---|---|
| S1, S2 | `src/features/search/` |
| S3 | `src/features/timeline/` |
| S4 | `src/features/custom-moments/` |
| S5 | `src/features/guardrails/` |
| S6 | `src/features/saved-draft/` |
| S7, SS1–SS4 | `src/features/studio/` |

---

## 1 · Landing / Search (`S1`)

**Screen id:** `S1` · **Step label:** Search · **Wizard header:** hidden

### Purpose

Entry point. A producer finds a public figure to build a digital-twin draft from, or resumes / clears an existing draft.

### User actions

- Type in the search field (autofocus).
- Pick a **live Wikipedia** search result or a **demo subject** card (“Try a demo subject”).
- **Resume** an in-progress draft (`ResumeDraftPanel`) when `localStorage` has an active draft pointer.
- **Clear draft** (confirmed) to delete the persisted twin and reset navigation to S1.
- Navigate forward only by selecting a subject (live result → fetch profile → S2; demo pill → S2 with prebuilt twin).

### Data required

| Input | Source |
|---|---|
| Search query | User (≥2 characters before search runs) |
| Search results | Wikipedia REST API (`src/features/search/wikipedia.ts`) |
| Demo subjects | `src/data/demoSubjects.ts` (explicit opt-in only) |
| Resume draft | `getDraft()` via `src/lib/storage.ts` |

### Validation rules

- Query trimmed; sanitized on use (`sanitizeFreeText`, field `searchQuery`, max 200 chars).
- Search not fired until query length ≥ 2.
- No draft is created until the user selects a result or a demo pill (`useDemoSubject`).

### Empty / error states

| State | Behavior |
|---|---|
| Default | Hero + empty search; optional resume panel if draft exists |
| Typing | Debounced search in flight |
| Loading | Skeleton result cards |
| Results | List of selectable `Card` rows (thumbnail, name, description, domain badge) |
| No results | “No results — try a different name” |
| API failure | Falls back to demo/local matches; `Callout` banner (`unavailable` or `rate-limited`) |
| Disambiguation hit | Warning badge on row; producer should pick a specific person page |

### Accessibility notes

- Search uses `SearchInput` with visible label; results are a list of buttons (`Card as="button"`) with keyboard navigation (`aria-activedescendant` combobox pattern where wired).
- Skip link targets `#main-content` (global).
- Resume and clear actions are semantic buttons with confirmation for destructive clear.
- `aria-live` on search status region when results/error banner update.

---

## 2 · Subject selection (within `S1`)

Subject selection is **not** a separate route. It is the act of choosing one row from search results or one demo card.

### Purpose

Bind a `WikipediaProfile` (or demo fixture) to a new `DigitalTwinProfile` before import review.

### User actions

- Activate a search result → `fetchWikipediaSummary` → `setDraft` → `goTo("S2")`.
- Activate a demo card → `useDemoSubject(demoSubjectId)` → S2 with curated timeline/guardrails pre-seeded.

### Data required

- `WikipediaSearchHit` (pageId, title, description, optional thumbnail, optional `demoSubjectId`).
- On confirm: full `WikipediaProfile` (summary, sourceUrl, revisionId when available).

### Validation rules

- Disambiguation pages should not proceed to import without a specific biography (UI warns; summary fetch may confirm `type === "disambiguation"`).
- Unknown `demoSubjectId` → `useDemoSubject` returns `false`; no navigation.

### Empty / error states

- Failed profile fetch on S2 (not here): user sent back or sees import error on S2.
- Demo path never depends on Wikipedia availability.

### Accessibility notes

- Each result is one focusable control; selected/hover states use shared `Card` `selectable` styling.
- Demo cards are full-card buttons (not nested links).

---

## 3 · Profile Import (`S2`)

**Screen id:** `S2` · **Step label:** Import · **Wizard header:** shown

### Purpose

Preview the imported subject, inspect source metadata, acknowledge consent, and generate the initial timeline.

### User actions

- **Back** to S1.
- Expand **data preview** (`Disclosure`: pageId, summary, image, source URL).
- Toggle **consent checkbox** (gate 4).
- **Import & Generate Timeline** → loading (~1.1s) → timeline bundle written to draft → S3.
- **Save Draft** from wizard header (only if consent already true — same gate as persist).

### Data required

| Field | Notes |
|---|---|
| `draft.wikipedia` | From search/demo |
| `draft.coreIdentity.name` | From profile title |
| `draft.consentAcknowledged` | Must be `true` to import |
| Generated `timeline`, `customMoments`, `guardrailReviews` | `generateImportBundle` in `src/features/timeline/timelineGenerator.ts` |

### Validation rules

- `canImportTimeline(draft)` / `canPersistDraft(draft)` require `consentAcknowledged === true` (`src/lib/consent.ts`).
- Import CTA disabled with helper text when consent unchecked.
- Demo subjects use curated events from `demoSubjects.ts`; live subjects use heuristic extraction from Wikipedia summary (may yield **zero** events — S3 handles empty timeline).

### Empty / error states

| State | Behavior |
|---|---|
| Loading profile | Skeleton on card |
| Profile ready | Card + disclosure + consent block |
| Consent unchecked | Primary CTA disabled + helper |
| Importing | Full-screen/step loading |
| Import error | `ErrorState` / retry (failed bundle) |

### Accessibility notes

- Consent uses shared `Checkbox` with `aria-describedby` linking to legal-adjacent disclosure copy (`CONSENT_NOT_LEGAL_CLEARANCE_NOTE`).
- “Why this matters” content in `Disclosure` (native `<details>`).
- Import button `aria-disabled` semantics via `disabled` + visible reason text.

---

## 4 · Consent checkpoint (on `S2`)

The consent checkpoint is **inline on S2**, not a separate screen. It is a hard gate for import and save.

### Purpose

Record producer acknowledgement that building/evaluating this twin is authorized or strictly internal demo/research — **not** legal clearance (gate 4).

### User actions

- Check/uncheck acknowledgement checkbox.
- Read static copy and optional “Why this matters” bullets (`CONSENT_WHY_THIS_MATTERS` in `src/lib/consent.ts`).

### Data required

- `DigitalTwinProfile.consentAcknowledged: boolean`
- `consentAcknowledgedAtISO` set on first ack via `withConsent()`

### Validation rules

- Import blocked until checked.
- `saveTwin` paths respect `canPersistDraft` where enforced in UI.
- Unchecking consent clears `consentAcknowledgedAtISO` for a fresh timestamp on re-ack.

### Empty / error states

- N/A — checkbox always rendered on S2.

### Accessibility notes

- Checkbox + label association; advisory note always visible (not tooltip-only).
- Copy centralized in `consent.ts` for consistent screen reader text across S2/S5/S6 references.

---

## 5 · Timeline Review (`S3`)

**Screen id:** `S3` · **Step label:** Timeline

### Purpose

Review auto-generated timeline events, approve or defer each, filter by type/confidence, then continue when at least one event is approved.

### User actions

- Filter by **event type** and **confidence** (`SegControl` / chips).
- Per event: **Approve** / **Defer** (toggles `approvalStatus`).
- **Back** to S2; **Continue** to S4 when ≥1 `Reviewed` event.
- **Save Draft** from header.

### Data required

| Field | Notes |
|---|---|
| `draft.timeline[]` | `TimelineEvent` entities |
| Per event | `approvalStatus`, `confidence`, `decade`, `source`, etc. |

### Validation rules

- Continue disabled until `timeline.some(e => e.approvalStatus === "Reviewed")`.
- Events start as `Draft` after import; producer must explicitly approve.
- Thin timeline: **&lt;5 events** surfaces advisory `Callout` suggesting custom moments (Five Challenge U1).

### Empty / error states

| State | Behavior |
|---|---|
| Loading | Skeleton timeline |
| Empty timeline | Message to add custom moments (heuristic import yielded nothing) |
| Filter empty | “No events match this filter” |
| None approved | Continue disabled + helper |
| Heuristic notice | `Callout` when events came from Wikipedia sentence parsing (not demo) |

### Accessibility notes

- Events grouped by decade with headings; each `EventRow` is a `Card` with internal toggle buttons.
- Scroll-reveal animations respect `prefers-reduced-motion`.
- Approval state exposed in button labels (not color alone).

---

## 6 · Custom Moments (`S4`)

**Screen id:** `S4` · **Step label:** Custom

### Purpose

Add producer-supplied moments Wikipedia did not capture; optional step but recommended for thin timelines.

### User actions

- View read-only timeline reference (left) and moment list (right).
- **Add Moment** / **Edit** / **Delete** → `CustomMomentDrawer` modal.
- Attach optional media (images, videos, YouTube).
- **Continue** to S5 (always enabled — step is optional).
- **Back** to S3.

### Data required

| Field | Notes |
|---|---|
| `draft.customMoments[]` | `CustomMoment` |
| Drawer fields | title, date, description, emotionalSignificance, visibility, sensitivity, sourceNotes, sourceUrl, media |

### Validation rules

(`src/features/custom-moments/customMomentValidation.ts`)

| Rule | Severity |
|---|---|
| Title required, ≤80 chars | Error |
| Date/year required | Error |
| Description required, ≤600 chars | Error |
| Emotional significance empty | Warning (save allowed) |
| Public visibility → source notes required | Error |
| Source URL | Optional; must be `http(s)://` if present |
| Sanitization | All text through `sanitizeCustomMomentFields` (gate 3); injection flagged but saved |
| Media | MIME/size caps in `customMomentMedia.ts`; max attachments per moment |

High-sensitivity or Public-without-notes moments feed **S5 guardrail rules**.

### Empty / error states

| State | Behavior |
|---|---|
| No moments | Empty state + CTA to add |
| Drawer open | Add vs edit (pre-filled) |
| Validation errors | Inline per field; focus moves to first error |
| Injection flagged | Accept text; flag for producer awareness |

### Accessibility notes

- Drawer uses focus trap (`useFocusTrap`); form fields use `Input` / `Textarea` / `Checkbox`.
- Media tiles are keyboard-focusable links with open labels.
- Visibility/sensitivity guidance exposed as helper text, not tooltips-only.

---

## 7 · Guardrail Review (`S5`)

**Screen id:** `S5` · **Step label:** Guardrails

### Purpose

Resolve editorial flags on timeline and custom content before committing the draft. High-severity items block save until addressed.

### User actions

- Review flagged rows (trigger, severity, reason, suggestion).
- **Resolve** → `EditorialReviewModal` (note required for High severity).
- **Defer** (Medium/Low only), **Reject** (loops to S4 for content fixes).
- **Save Draft** → persist + `draftStatus: "saved"` → S6 when `canSaveDraft(reviews)`.
- Read disclaimer: editorial review ≠ legal clearance (`GUARDRAIL_DISCLAIMER`).

### Data required

| Field | Notes |
|---|---|
| `draft.guardrailReviews[]` | Produced by `evaluateGuardrails()` |
| `editorialNote` | Required to clear High-severity flags |
| Underlying timeline + custom moments | Re-evaluated when returning from S4 |

### Validation rules

(`src/lib/guardrails.ts`)

- **Save allowed** when no **High** severity review remains `NeedsReview` (`canSaveDraft`).
- Medium/Low may stay `NeedsReview` or `Deferred` — producer accepts residual risk.
- High severity **cannot** be deferred (`markDeferred` no-op).
- UI uses “Editorially reviewed”, not bare “Approved” (gate 4).
- `markReviewed` requires editorial note when `requiresEditorialNote(review)`.

### Empty / error states

| State | Behavior |
|---|---|
| Flags pending | List + summary counts |
| Modal open | Editorial review in progress |
| High missing note | Resolve disabled |
| All clear | “N events cleared automatically” section |
| No flags | Clean pass-through to save |
| Save error | Retry; draft remains in memory |

### Accessibility notes

- Flag rows use `Card` with `state` tint (`reviewed`, `rejected`, `deferred`, `flagged`).
- Modal traps focus; note field labeled and associated with validation errors.
- Summary counts in header for screen reader context (`aria-live` on summary updates where implemented).

---

## 8 · Draft Save (`S6`)

**Screen id:** `S6` · **Step label:** Saved

### Purpose

Confirm the twin draft is persisted and hand off to Voice Studio (mode change, not a cold page load).

### User actions

- **Open Voice Studio** → S7 (`SS1`).
- **Back to timeline** → S3.
- View summary card (identity, event/custom counts, confidence, last saved time).

### Data required

| Field | Notes |
|---|---|
| `draft.draftStatus` | `"saved"` after successful S5 save |
| `lastSavedAtISO` | From `saveTwin()` |
| Summary helpers | `src/features/saved-draft/draftSummary.ts` |

### Validation rules

- Screen assumes draft exists; otherwise redirect to S1.
- Consent must have been true before save path was reachable.

### Empty / error states

| State | Behavior |
|---|---|
| Saving | Brief loading before render |
| Saved | Default confirmation + CTAs |
| Save error | `RetryPanel`; in-memory draft retained |

### Accessibility notes

- Confirmation uses text + visual check (not color-only).
- Primary CTA is obvious single action (“Open Voice Studio”).
- `exitConfirms: false` — leaving home from S6 does not warn.

---

## 9 · Voice Studio (`S7` + `SS1`–`SS4`)

**Screen id:** `S7` · **Wizard header:** hidden · **Layout:** 220px · 1fr · 280px (responsive collapsible panels)

### Purpose

Workspace to pick an anchoring timeline moment, set scene context, preview the Emotional Resolver output, clear performance guardrails, and lock a voice performance context for the session.

### User actions (shell)

- **Exit** to S6.
- Collapse/expand **Twin Context** (left) and **Resolver** (right) on small viewports (`ResponsivePanel`).
- Advance **studio sub-steps** via center footer `WizardActionBar` and `StudioBreadcrumb`.
- Optional **Twin Chat** (right context) — grounded mock via `src/lib/ai.ts`.

### Data required

| Field | Notes |
|---|---|
| Saved `DigitalTwinProfile` | Loaded from context |
| `StudioContext` | `selectedEventId`, scene settings, `resolverOutput` |
| Approved events only | SS1 list filters eligible events (`contentModel.ts`) |

### Validation rules

- Sub-step forward disabled until prerequisites met (event selected before SS2+, resolver computed before SS3+, etc.).
- SS4 `evaluatePerformanceClearance` returns `pass` | `warn` | `block`.
- Unresolved producer guardrails (`NeedsReview` any severity) block finalize in SS4.

### Sub-steps

#### SS1 · Event Selector

- **Purpose:** Choose anchoring `TimelineEvent`; seeds resolver input.
- **Actions:** Select one approved event card.
- **Validation:** Only events with `approvalStatus === "Reviewed"` (and not rejected).
- **Empty:** “No approved events” — return to S3 messaging.
- **A11y:** Selectable `Card` list; resolver panel shows placeholder until selection.

#### SS2 · Scene Context

- **Purpose:** Set audience, conversation mode, narrative goal (`SegControl` groups).
- **Actions:** Three segment controls; changing values recomputes resolver.
- **Validation:** Requires `selectedEventId` from SS1.
- **Empty:** `Callout` “Select an event first”.
- **A11y:** Each control group labeled; changes update resolver `aria-live` region in panel.

#### SS3 · Emotional Preview

- **Purpose:** Primary “wow” — signature state, arc viz, parameter bars, biographical reason string.
- **Actions:** Open guardrail warning detail modal; continue to SS4.
- **Validation:** Requires resolver output.
- **Notes:** Resolver reason must reference real event title; **not** labelled “AI-generated” (scoring model, not LLM). Twin chat responses **are** AI-labelled.
- **A11y:** `aria-live="polite"` on reveal; reduced motion skips animation.

#### SS4 · Guardrail Clearance

- **Purpose:** Session-level performance lock; pass/warn/block summary.
- **Actions:** Finalize → **Voice Context Preview** (same step, post-finalize UI); recovery buttons to SS1/SS2/S5 when blocked.
- **Validation:** See `src/features/studio/clearance.ts`.
- **Finalize:** Opens finalized state + optional Phase 2 roadmap modal (voice synthesis not in scope).

### Empty / error states (studio-wide)

| State | Behavior |
|---|---|
| No event selected | Resolver panel idle copy |
| Resolver recomputing | Brief loading in panel |
| Guardrail warnings | SS3 modal; annotations, not hard blocks |
| Finalized | Locked context + Voice Context Preview |

### Accessibility notes

- Three-panel grid collapses to stacked disclosures on mobile with summary strings for context/resolver.
- `StudioBreadcrumb` exposes current sub-step; footer actions duplicated in `WizardActionBar` with safe-area padding.
- Twin chat: `aria-live="polite"`, Stop control when streaming (mock), refusal styled as intentional (not error).

---

## 10 · Voice Context Preview (within `SS4` finalized)

**Not a separate screen id.** Rendered by `VoiceContextPreview.tsx` after SS4 **Finalize performance context** succeeds.

### Purpose

Summarize the locked emotional direction, show a deterministic sample script, optionally save/export the context for Phase 2 handoff, and state honestly that **voice synthesis is not connected**.

### User actions

- **Edit emotional context** → returns to SS3 (unfinalizes session state).
- **Save voice context** → appends to `draft.savedVoiceContexts[]`.
- **Export summary** → downloads plain-text file (`buildExportSummary`).
- **View Phase 2 roadmap** → `Phase2VisionModal` (OpenAI Realtime, ElevenLabs, etc. — roadmap only).
- Play **demo audio** only if `DEMO_AUDIO_SRC` is set (currently `null`).

### Data required

| Field | Notes |
|---|---|
| Selected `TimelineEvent` | Anchoring moment |
| `ResolverOutput` | From pure `resolve()` in `src/lib/resolver.ts` |
| `StudioSceneSettings` | Audience, mode, narrative goal |
| `VOICE_PROVIDER` | `not-connected` in this build (`voiceContext.ts`) |

### Validation rules

- Only reachable after successful finalize (clearance not `block`).
- Saved contexts capped by UI logic in `appendSavedVoiceContext` (see tests in `voiceContext.test.ts`).

### Empty / error states

| State | Behavior |
|---|---|
| Audio | `AudioPreview` shows not-connected copy |
| Save | Confirmation flash (`saveState === "saved"`) |
| Export | Client-side download; no server |

### Accessibility notes

- Provider status as `Badge` + text description (not icon-only).
- Parameter bars use `ParamBar` with text labels + `InfoTip` descriptions.
- Export uses temporary `<a download>` — announce via button label.

---

## Cross-cutting flows

### Save Draft (wizard header)

Available on S2–S5 (and behaviorally on S6 after save). Writes full `DigitalTwinProfile` to `ricon:twin:{twinId}` and sets `ricon:draft` pointer. Optional remote mirror is a no-op until configured (`09-MONGODB-READINESS.md`).

### Demo vs live data

| Path | Label in UI |
|---|---|
| Wikipedia search + import | Wikipedia / live source badges |
| `useDemoSubject` or API fallback | **Demo profile** badge (`SourceBadge` variant `gold`) |

### Safety gates (summary)

| Gate | Where it shows up in the flow |
|---|---|
| 1 No API keys | Mock AI only; `ai.ts` seam |
| 2 Grounded AI | Twin chat refuses ungrounded questions |
| 3 Untrusted text | Custom moments, editorial notes, search |
| 4 Consent + labelling | S2 checkbox; AI-generated on chat; editorial language on S5 |

See [`08-AI-SAFETY.md`](08-AI-SAFETY.md) for implementation detail.

---

## Related documentation

| Doc | Use when |
|---|---|
| [`data-model.md`](data-model.md) | Entity shapes, storage keys, migrations |
| [`known-limitations.md`](known-limitations.md) | POC boundaries and Phase 2 gaps |
| [`03-DATA-MODEL.md`](03-DATA-MODEL.md) | Short type reference (legacy numbered doc) |
| [`06-EMOTIONAL-RESOLVER.md`](06-EMOTIONAL-RESOLVER.md) | Resolver algorithm |
| [`implementation-log.md`](implementation-log.md) | Change history |
