# 07 · Build Sequence (the Cursor prompt list)

How to use this: paste prompts **one at a time**, in order, into Cursor. Each prompt produces something runnable. After each, verify using its "✅ Verify" line before moving on. Don't batch them — the whole point is that errors surface one step at a time instead of compounding.

Every prompt assumes the `docs/` folder and `.cursor/rules/project.mdc` are in the repo so Cursor has the rules in context. Where a prompt says "per the docs," Cursor should open the named doc.

---

### Phase 0 — Foundation

**Prompt 0.1 — Scaffold**
```
Read docs/00-PROJECT-RULES.md and docs/01-ARCHITECTURE.md.
Scaffold a React + Vite + TypeScript project with Tailwind, matching the folder
structure in 01-ARCHITECTURE.md exactly (including the inert netlify/functions/
twin-chat.ts stub and a netlify.toml configured for a static SPA build). Configure
tailwind.config.js with the tokens and fonts from docs/02-DESIGN-SYSTEM.md, and load
the four Google Fonts in index.html. Set up TypeScript strict mode. Create empty
placeholder files for the folders (types, lib, context, components, screens, studio)
with TODO comments. Do NOT build any screens yet. Then tell me the exact commands to
run it locally and to deploy to Netlify, and what I should see (a blank styled page).
✅ Verify: app runs locally, page is near-black (#080810), no console errors; netlify.toml present.
```

**Prompt 0.2 — Types + storage + sanitize (the spine)**
```
Read docs/03-DATA-MODEL.md and docs/08-AI-SAFETY.md (gate 3).
Implement src/types/twin.ts and src/types/resolver.ts exactly as specified.
Implement src/lib/storage.ts as the ONLY module that touches localStorage, with
saveTwin/getTwin/listTwins/setDraft/getDraft/clearDraft, schemaVersion validation,
and try/catch around every localStorage call.
Implement src/lib/sanitize.ts per gate 3.
Add a tiny temporary test page or console script proving a twin can be saved and
read back, and that a schemaVersion mismatch is handled gracefully.
✅ Verify: I can save and reload a mock twin; corrupting the version doesn't crash.
```

**Prompt 0.3 — Component primitives**
```
Read docs/02-DESIGN-SYSTEM.md.
Build every primitive in src/shared/ui/ (Button, Badge, Input, Textarea,
SegControl, ProgressBar, ParamBar, Modal, Tooltip, Mono/Label) with all
interaction states and the accessibility rules in the doc (visible focus,
real buttons, 44px targets, no color-only state).
Create a temporary /kitchen-sink view rendering every primitive in every variant
so I can eyeball them. Don't wire it into the app flow.
✅ Verify: kitchen-sink shows all primitives; tab-navigation shows focus rings.
```

---

### Phase 1 — The Resolver (build the IP first, prove it, before any UI depends on it)

**Prompt 1.1 — Resolver engine**
```
Read docs/06-EMOTIONAL-RESOLVER.md and src/types/resolver.ts.
Implement src/lib/resolver.ts as a pure function resolve(input): ResolverOutput,
with all weights/config in a single labelled RESOLVER_CONFIG object covering BOTH
sports and music domains (both ship in this build). The domain switch swaps the
entire config. No AI calls, no side effects.
✅ Verify: I can call resolve() for a sports input AND a music input and get full,
distinct output objects.
```

**Prompt 1.2 — Resolver tests**
```
Write unit tests for src/lib/resolver.ts covering every case listed under
"Tests to write" in docs/06-EMOTIONAL-RESOLVER.md (determinism, valid output for
all combos, conflict resolution, low-confidence never yields high-confidence
assertive output, reason string references the real event).
Use Vitest. Show me how to run them.
✅ Verify: all tests pass; deliberately break a weight and watch a test fail.
```

**Prompt 1.3 — Guardrail evaluation**
```
Read docs/03-DATA-MODEL.md (GuardrailReview) and docs/04-SCREENS.md (S5) and
docs/08-AI-SAFETY.md (gate 4).
Implement src/lib/guardrails.ts: given timeline events + custom moments, return the
GuardrailReview[] (which items trigger which rule, at what severity). Encode the
trigger taxonomy as a config table, not scattered conditionals. High severity must
be markable as requiring an editorial note.
✅ Verify: feeding a "Private relationships" custom moment produces a High-severity flag.
```

---

### Phase 2 — Onboarding wizard (S1–S6)

**Prompt 2.1 — App shell + navigation + TwinContext**
```
Read docs/01-ARCHITECTURE.md and docs/04-SCREENS.md (navigation map).
Implement App.tsx with the screen-state switch (S1–S7) and the back/forward +
S5→S4 rejection-loop transitions. Implement src/app/providers/TwinContext.tsx holding the
in-progress draft and wizard progress, persisting through storage.ts.
Build the persistent TopBar and the wizard header (ProgressBar + Twin Context
summary) as shared components. Stub each screen as a labelled placeholder.
✅ Verify: I can click through S1→S7 placeholders and back; progress bar updates.
```

**Prompt 2.2 — S1 Search**
```
Read docs/04-SCREENS.md (S1) and docs/05-STATES.md (S1) and docs/03-DATA-MODEL.md
(mockData requirement).
Build the Search screen with all S1 states. Implement src/features/search/wikipedia.ts and query
the REAL Wikipedia REST API live, client-side (public, read-only, no key) for both
search and summary/import. Debounce the query. On API failure or rate-limit, fall back
to local demo subjects from src/data/demoSubjects.ts (seed Michael Jordan fully per the
data-model doc) and show a subtle "showing demo subjects" note. Selecting a result
stores the profile draft in TwinContext and goes to S2.
✅ Verify: typing "michael" returns live Wikipedia results; disabling network falls
back to demo data with the note.
```

**Prompt 2.3 — S2 Profile Import (+ consent gate)**
```
Read docs/04-SCREENS.md (S2), docs/05-STATES.md (S2), docs/08-AI-SAFETY.md (gate 4).
Build Profile Import with the profile card, data-preview panel, and the consent
acknowledgement checkbox that BLOCKS the import CTA until checked. On confirm, show
the importing loading state, generate the timeline from mockData/Wikipedia, store
it, and go to S3.
✅ Verify: CTA is disabled until consent checked; import shows loading then S3.
```

**Prompt 2.4 — S3 Timeline Review**
```
Read docs/04-SCREENS.md (S3) and docs/05-STATES.md (S3).
Build Timeline Review: events grouped by decade, filter by type AND confidence,
approve/defer toggles, the thin-timeline state (<5 events), and the scroll-reveal
animation (wow moment #1, respect prefers-reduced-motion). Continue enabled when
≥1 event approved.
✅ Verify: filters work; approving toggles state; <5 events shows the thin-timeline note.
```

**Prompt 2.5 — S4 Custom Moments (+ edit drawer, sanitized fields)**
```
Read docs/04-SCREENS.md (S4), docs/05-STATES.md (S4), docs/08-AI-SAFETY.md (gate 3).
Build Custom Moments: read-only timeline reference, the moments list, and the
Custom Moment Edit Drawer (modal) with ALL fields (title, date, description,
emotional significance, source notes, visibility, sensitivity). Edit + delete
existing moments. Run all text through sanitize.ts on save. Empty + validation states.
✅ Verify: add/edit/delete a moment; title-required validation fires.
```

**Prompt 2.6 — S5 Guardrail Review (+ editorial modal, gate 4 language)**
```
Read docs/04-SCREENS.md (S5), docs/05-STATES.md (S5), docs/08-AI-SAFETY.md (gate 4),
and src/lib/guardrails.ts.
Build Guardrail Review: flagged-event list from guardrails.ts, inline review/approve/
reject, the Editorial Review modal, the "cleared automatically" section. High-severity
flags require an editorial note before clearing. Use "Editorially reviewed"/"Needs
review" — never bare "Approved." Add the "editorial review is not legal clearance"
disclaimer. Rejection loops to S4. Save Draft (loading) only when all resolved → S6.
✅ Verify: high-severity flag can't clear without a note; save blocked until all resolved.
```

**Prompt 2.7 — S6 Draft Saved**
```
Read docs/04-SCREENS.md (S6) and docs/05-STATES.md (S6).
Build the Draft Saved screen: saving state → identity card with stats → "Open Voice
Studio" + "Back to timeline". Persist the committed twin via storage.ts (draftStatus
"saved"). Save-error state with retry that doesn't lose the draft.
✅ Verify: saving shows loading; reloading the app still finds the saved twin.
```

---

### Phase 3 — Voice Studio (S7 + SS1–SS4)

**Prompt 3.1 — Studio shell (three-panel layout)**
```
Read docs/04-SCREENS.md (S7) and docs/02-DESIGN-SYSTEM.md (three-panel grid).
Build VoiceStudio.tsx: fixed left Twin Context panel (with source-confidence
Tooltip), fixed right Resolver panel (empty "select an event" state), center stage
with the step breadcrumb + CTA bar. Wire the four sub-step placeholders.
✅ Verify: three panels render; left panel shows the twin; right panel shows empty state.
```

**Prompt 3.2 — SS1 Event Selector → live resolver**
```
Read docs/04-SCREENS.md (SS1) and src/lib/resolver.ts.
Build the Event Selector. Selecting an event calls resolve() and populates the right
Resolver panel live (wow moment #2): resolved feeling, parameter bars, steering tag,
and the emotional-arc visualization (SVG). Animate the reveal; respect reduced-motion.
✅ Verify: selecting different events changes the resolved feeling and bars instantly.
```

**Prompt 3.3 — SS2 Scene Context**
```
Read docs/04-SCREENS.md (SS2).
Build the three segmented controls (audience, mode, narrative goal). Changing them
re-runs resolve() and updates the right panel live.
✅ Verify: changing mode/goal visibly shifts the resolver output.
```

**Prompt 3.4 — SS3 Emotional Preview (+ warning modal, biographical reason)**
```
Read docs/04-SCREENS.md (SS3), docs/06-EMOTIONAL-RESOLVER.md (reason string),
docs/08-AI-SAFETY.md (gate 4 label).
Build the Emotional State Preview: large feeling name, the biographical reason
string (must reference the real event title — not a placeholder), parameter bars,
and the "what triggers a warning?" affordance opening the Guardrail Warning Detail
modal. If any text here is AI-generated, label it "AI-generated."
✅ Verify: the reason names the actual selected event; warning modal opens.
```

**Prompt 3.5 — SS4 Clearance + Finalize + Phase 2 modal**
```
Read docs/04-SCREENS.md (SS4).
Build Guardrail Clearance (pass/warn/block summary of the final context), the
Finalize action, the "Voice Generation Ready" state, and the Phase 2 Vision modal
(OpenAI Realtime, ElevenLabs, XTTS, Vector DB, Memory Layer).
✅ Verify: clean config finalizes; the Phase 2 modal opens from the finalized state.
```

---

### Phase 4 — AI seam (mock now, real later)

> The AI is NOT connected in this build. You build the *seam* and a *grounded mock* so the demo shows the trust behavior and connecting real AI later is a one-file change. Do NOT build a server or add an API key now.

**Prompt 4.1 — The AI seam (mock)**
```
Read docs/08-AI-SAFETY.md (gates 1, 2, 3) and docs/01-ARCHITECTURE.md (AI seam).
Implement src/lib/ai.ts exporting a single async askTwin(context, userMessage):
Promise<TwinReply>. For now it is a MOCK: it returns grounded answers built only
from the twin's approved timeline + approved custom moments, and returns a grounded
refusal ("I don't have a verified record of that") for anything it can't ground.
Run userMessage through sanitize.ts first. No network call, no API key, nothing
client-exposed. Also create a STUB file netlify/functions/twin-chat.ts with a comment
block describing exactly what to implement when AI is connected (read env key, build
verified-facts-only prompt, call Anthropic) — but leave it inert.
✅ Verify: askTwin answers a grounded question from the timeline and refuses an
ungrounded one; there is no API key anywhere in the project.
```

**Prompt 4.2 — Twin chat UI + mock safety tests**
```
Read docs/08-AI-SAFETY.md (gates 2, 3, 4) and docs/05-STATES.md (S7 AI states).
Add the Digital Twin chat UI calling ONLY askTwin: idle/streaming(simulated)/refusal/
error states, aria-live on the output, and an "AI-generated" label on every response.
Then run the mock gate tests: 10 ungrounded questions (expect grounded refusals), the
injection string from gate 3 (expect it ignored — the mock stays grounded), and confirm
the label always shows. Report results as a short table.
✅ Verify: mock refuses ungrounded questions; ignores the injection; label always present.
```

**(Later, when you decide to connect real AI — not part of this build)**
```
Replace the body of askTwin with a fetch to /.netlify/functions/twin-chat and implement
that Netlify Function per docs/08-AI-SAFETY.md (gates 1+2): read ANTHROPIC_API_KEY from
Netlify env vars, build the verified-facts-only prompt from Reviewed items only, wrap
user+context text via sanitize.ts, call claude-sonnet-4-20250514. Re-run the gate tests,
plus grep the built bundle to confirm the key and api.anthropic.com are absent client-side.
```

---

### Phase 5 — Hardening & demo readiness

**Prompt 5.1 — State + accessibility sweep**
```
Read docs/05-STATES.md and docs/02-DESIGN-SYSTEM.md (a11y rules).
Audit every screen against its state checklist and the accessibility rules. Fill any
missing loading/empty/error states. Verify keyboard navigation, focus visibility,
aria-live regions, and contrast. Give me a checklist of what you fixed and anything
still open.
✅ Verify: I can tab through the whole flow; every screen has its states.
```

**Prompt 5.2 — Demo resilience (Five Challenge B1)**
```
Read docs/03-DATA-MODEL.md (demo data) and docs/05-STATES.md.
Make the demo bulletproof: the full path (Search→…→Voice Studio) must run end-to-end
on local mock data with NO live network dependency. Confirm the seeded guardrail flag
fires on cue and the edge-case record demonstrates the thin-timeline state. Add a way
to reset demo state between runs.
✅ Verify: with network disabled, the entire demo runs start to finish.
```

**Prompt 5.3 — Final gate check**
```
Re-read docs/08-AI-SAFETY.md. Run the gate tests for THIS build (AI mocked) and produce
a short PASS/FAIL report: (1) no API key anywhere in the project + no api.anthropic.com
in the client bundle, (2) the mock twin refuses ungrounded questions, (3) the injection
string is ignored, (4) consent blocks save + "AI-generated" labels present + no
"legal clearance" language anywhere. Fix any FAIL before we call this done.
✅ Verify: four PASS rows.
```

---

## Quick reference — the order
0.1 scaffold → 0.2 spine → 0.3 primitives → 1.1 resolver → 1.2 resolver tests →
1.3 guardrails → 2.1 shell → 2.2 S1 → 2.3 S2 → 2.4 S3 → 2.5 S4 → 2.6 S5 → 2.7 S6 →
3.1 studio shell → 3.2 SS1 → 3.3 SS2 → 3.4 SS3 → 3.5 SS4 →
[4.1 AI seam (mock) → 4.2 chat UI + mock tests] → 5.1 a11y → 5.2 demo → 5.3 gate check.
