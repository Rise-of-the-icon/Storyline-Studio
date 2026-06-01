# 04 · Screens

Seven screens (S1–S7) plus four Voice Studio sub-steps (SS1–SS4). Persistent chrome: a top bar everywhere; a wizard header with the 7-step progress bar + Twin Context summary on S2–S6; a three-panel layout on S7. Full navigation map at the bottom.

> Every screen must implement its states from `docs/05-STATES.md` to be considered done.

---

## S1 · Search  (entry)
Find a person to build a twin from.
- **Regions:** header bar; large centered search input (autofocus); results list (profile cards: thumbnail, name, one-line description, "Wikipedia" badge); empty state.
- **Behavior:** results appear after ≥2 chars. Tapping a result → S2. Falls back to local demo data if the Wikipedia API fails.
- **Nav:** → S2 on result tap.

## S2 · Profile Import
Preview the selected profile, capture consent, confirm import.
- **Regions:** back link; profile card (image, name, description, Wikipedia source badge); data-preview panel (pageId, summary, image, source URL); **consent acknowledgement checkbox (gate 4)**; primary CTA "Import & Generate Timeline".
- **Behavior:** CTA disabled until consent is checked. On confirm → loading state → S3.
- **Nav:** ← S1; → S3.

## S3 · Timeline Review
Review and approve auto-generated events.
- **Regions:** wizard header (progress, twin context, Save Draft); filter bar (by event type AND by confidence level); event list **grouped by decade**; bottom CTA bar.
- **Behavior:** each event has approve/defer toggles. Events animate in on scroll (wow moment #1). Continue enabled when ≥1 event approved.
- **Nav:** ← S2; → S4.

## S4 · Custom Moments
Enrich with moments not on Wikipedia.
- **Regions:** wizard header; left = read-only timeline reference; right = list of added custom moments + "Add Moment"; **Custom Moment Edit Drawer (modal)** with full fields: title, date, description, emotional significance, source notes, visibility, sensitivity.
- **Behavior:** moments are editable and deletable (open the drawer pre-filled). Optional step — CTA always enabled. High-sensitivity custom moments will surface as guardrail flags in S5.
- **Nav:** ← S3; → S5.

## S5 · Guardrail Review
Resolve flagged events before saving.
- **Regions:** wizard header (with flag count); header summary card; flagged-event list (title, trigger reason, severity, inline review/approve/reject); "N events cleared automatically" section; **Editorial Review Modal** (source URL, editorial notes, decision).
- **Behavior:** **High-severity flags require an editorial note before they can be cleared (gate 4).** Use "Editorially reviewed", never bare "Approved" (gate 4 — no implied legal clearance). Rejecting loops back to S4. Save Draft enabled only when all flags resolved → loading → S6.
- **Nav:** ← S4; → S6 on save; → S4 on rejection loop.

## S6 · Draft Saved  (transitional)
Confirm the twin is saved; hand off to the studio.
- **Regions:** twin identity card (image, name, event count, confidence); confirmation mark; primary CTA "Open Voice Studio"; secondary "Back to timeline".
- **Behavior:** brief saving state before this screen renders. The transition into S7 should feel like a mode change, not a page load.
- **Nav:** → S7; ← S3 (back to timeline).

## S7 · Voice Studio  (persistent three-panel layout)
The workspace. Left and right panels are fixed; only the center stage advances.
- **Left panel — Twin Context (persistent):** profile image, name, source-confidence (with tooltip breakdown), guardrail status, event/custom counts.
- **Center stage:** the active sub-step (SS1–SS4), with a step breadcrumb (Event › Scene › Feeling › Finalize) and a bottom CTA bar.
- **Right panel — Resolver (persistent once an event is selected):** resolved feeling, emotional-arc visualization, parameter bars, steering tag. Updates live (wow moment #2).
- **Nav:** ← S6 (exit studio). Sub-steps advance in place.

### SS1 · Event Selector
Pick the anchoring moment. Scrollable list of timeline events; selecting one seeds the resolver and activates the right panel.

### SS2 · Scene Context
Three segmented controls: audience, conversation mode, narrative goal.

### SS3 · Emotional State Preview  (primary wow moment)
Large resolved-feeling name; biographical reason string (must feel specific, not generic — Five Challenge U3); the four parameter bars; a "what triggers a warning?" affordance opening the **Guardrail Warning Detail modal**. If an AI-written reason is shown, it carries the "AI-generated" label (gate 4) and is produced server-side (gate 1).

### SS4 · Guardrail Clearance
Pass / warn / block summary of the final performance context. On clear → Finalize → "Voice Generation Ready" state with the **Phase 2 Vision modal** (roadmap: OpenAI Realtime, ElevenLabs, XTTS, Vector DB, Memory Layer).

---

## Modal / overlay catalog
1. **Consent acknowledgement** — inline on S2 (blocks import).
2. **Editorial Review Modal** — S5.
3. **Custom Moment Edit Drawer** — S4.
4. **Source Confidence Tooltip** — S7 left panel + wizard header badge.
5. **Guardrail Warning Detail** — S7 SS3.
6. **Phase 2 Vision Modal** — S7 finalized.

## Navigation map
```
S1 → S2 (tap result)
S2 ← S1 (back) · S2 → S3 (import, consent required)
S3 ← S2 · S3 → S4
S4 ← S3 · S4 → S5
S5 ← S4 · S5 → S6 (all flags resolved) · S5 → S4 (rejection loop)
S6 → S7 (open studio) · S6 → S3 (back to timeline)
S7 ← S6 (exit)
  SS1 → SS2 → SS3 → SS4 → Finalized   (advance in center stage)
```
