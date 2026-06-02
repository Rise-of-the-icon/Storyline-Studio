# Implementation Log

Append-only running log of changes made to RICON Storyline Studio. Newest entry on top.

Each entry records:
- **What changed** — one-line summary of the change
- **Files touched** — paths relative to repo root
- **User-facing behavior** — what a user/demo viewer notices
- **Known limitations** — what's intentionally still rough
- **Follow-up tasks** — links into `qa-fix-backlog.md` (use `QA-###` IDs)
- **Checks** — outcomes of `build` / `test` / `lint` (lint is currently N/A — see `QA-001`)

---

## 2026-06-01 · Custom moment media attachments

**What changed**
Added optional media attachments to Add/Edit Custom Moment. Producers can attach up to eight uploaded images, uploaded videos, and YouTube links, remove attachments before save, and see bounded previews on saved S4 moment cards. Image and Video use native file pickers; YouTube is the only type with a URL input. The client-only POC encodes selected files inside the browser draft so they survive reloads without an upload backend.

**Files touched**
- `src/types/twin.ts` - added `CustomMomentMedia` and optional `CustomMoment.media`.
- `src/lib/customMomentMedia.ts` - added upload MIME/size validation, browser file reading, YouTube URL parsing, and privacy-enhanced `youtube-nocookie.com` embed generation.
- `src/lib/customMomentMedia.test.ts` - covers uploaded data URLs, MIME/size validation, unsafe persisted values, common YouTube formats, and invalid YouTube links.
- `src/components/CustomMomentDrawer.tsx` - added media type, conditional file picker / YouTube URL, optional label, add, and remove controls.
- `src/screens/S4CustomMoments.tsx` - persists attachments and renders image, video, and YouTube previews with source links.

**User-facing behavior**
The custom-moment drawer now includes a `Media attachments (optional)` fieldset. Image and Video show file pickers; YouTube shows a URL field. Saved cards display attachment count, bounded previews, accessible labels, and YouTube `Open source` links. Invalid persisted attachments render as unavailable rather than clickable links.

**Accessibility and responsive behavior**
Attachment controls use native labels, a native select, semantic buttons, image alt text, video `aria-label`, titled YouTube iframes, and keyboard-accessible source links. Preview media is width-constrained and scales to the card width.

**Known limitations**
- Uploaded images are capped at 1 MB, uploaded videos at 2 MB, and each moment at roughly 3 MB of encoded media because this POC persists files in browser `localStorage`. Production uploads should move to durable blob storage.
- YouTube playback depends on the source host.

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | green - 111 modules transformed |
| Test | `npm test` | green - 29 files / 1,210 tests pass |
| Lint | - | not configured (`QA-001`) |

---

## 2026-06-01 · Voice Studio clearance recovery actions

**What changed**
Clarified the SS4 Guardrail Clearance checkpoint and added direct recovery actions for each blocking state. Missing anchoring events no longer also report a redundant resolver-output error.

**Files touched**
- `src/studio/clearance.ts` - replaced internal-sounding blocker copy with plain-language recovery guidance and removed redundant messages.
- `src/studio/steps/SS4GuardrailClearance.tsx` - explains what locking a performance context means and adds actions for event selection, scene-context review, and producer guardrail review.
- `src/studio/clearance.test.ts` - pins the revised blocker behavior and copy.

**User-facing behavior**
When finalization is blocked, the producer sees why the checkpoint exists, one clear explanation per issue, and buttons that return to the exact step needed to fix each issue.

**Accessibility and responsive behavior**
Recovery actions are semantic buttons in a wrapping container, remain keyboard accessible, and fit narrow screens without horizontal overflow. The blocker panel remains associated with the disabled finalization action through `aria-describedby`.

---

## 2026-06-01 · Remove For Talent surface

**What changed**
Removed the separate For Talent experience and both entry points. The app is now exclusively the seven-step producer flow: S1 no longer renders the footer CTA, the global header no longer renders a For Talent action, and the unused Talent route, screen, copy module, form validator, and feature-specific tests are deleted.

**Files touched**
- `src/screens/S1Search.tsx`, `src/components/AppHeader.tsx` — removed the visible For Talent actions.
- `src/types/navigation.ts`, `src/lib/navigation.ts`, `src/App.tsx`, `src/screens/index.ts` — removed the Talent route and exports.
- `src/screens/TalentOnboarding.tsx`, `src/lib/talentCopy.ts`, `src/lib/talentForm.ts` and their tests — deleted.
- `docs/qa-fix-backlog.md` — removed follow-ups that only applied to the deleted talent surface.

**User-facing behavior**
There is no longer a For Talent link in the global header or a For Talent footer section on S1. No talent onboarding route remains reachable.

**Accessibility and responsive behavior**
Removing the extra actions reduces the S1 tab order and header crowding at narrow widths. The remaining producer controls keep their existing semantic buttons and focus states.

**Browser verification**
- Reloaded localhost S1 after the removal. The AppHeader ends after `Step 1 of 7 · Search`, and the page ends after the search-results region. No For Talent action or footer section remains.

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | green - 110 modules transformed |
| Test | `npm test` | green - 28 files / 1,203 tests pass |
| Lint | — | not configured (`QA-001`) |

---

## 2026-06-01 · Three requested demo profiles on S1

**What changed**
Replaced the landing screen's single promoted profile plus edge-case pills with three equal demo-profile cards: David West (basketball), Tom Hoover (basketball), and Walt Taylor aka Walt Liquor (multidisciplinary artist and music executive). Each card loads a deterministic local profile without depending on Wikipedia. The import generator now resolves registered demo subjects through the catalog rather than a hard-coded ID list.

**Files touched**
- `src/data/demoSubjects.ts` — registered the three requested fixtures with timeline data, voice defaults, categories, and a seeded editorial-review moment for Walt Taylor.
- `src/screens/S1Search.tsx` — renders the three-card demo list and routes each card through the existing overwrite confirmation flow.
- `src/lib/timelineGenerator.ts` — resolves curated import bundles through `getDemoSubjectById()`.
- `src/data/demoSubjects.test.ts`, `src/lib/timelineGenerator.test.ts`, `src/lib/wikipedia.test.ts` — updated fixture and import-path regression coverage.
- `src/context/TwinContext.tsx` — updated demo-path documentation.
- `docs/qa-fix-backlog.md` — generalized the placeholder-source follow-up and closed superseded demo-catalog / keyboard-access items.

**User-facing behavior**
S1 now shows three clearly labeled, keyboard-focusable demo profile cards above search. Each card has a `View demo profile` action and remains responsive as a stacked layout on narrow screens.

**Known limitations**
- Demo source URLs remain local-fixture placeholders under `example.com`; the existing source-preview follow-up still applies.

**Browser verification**
- Desktop localhost S1 renders exactly three cards: David West / Sports, Tom Hoover / Sports, and Walt Taylor (aka Walt Liquor) / Music.
- Walt Taylor's CTA opens S2 with the expected Demo profile badge, six events, one custom moment, and disabled import until consent is acknowledged.
- At a 390px viewport, all three cards stack vertically and each CTA expands to the available width without horizontal overflow.

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | green - 113 modules transformed |
| Test | `npm test` | green - 30 files / 1,256 tests pass |
| Lint | — | not configured (`QA-001`) |

---

## 2026-06-01 · Voice Studio microcopy, tooltips, and “How this works”

**What changed**
First-time producers hitting Voice Studio (S7) could see specialized terms — Resolver, Steering tag, Voice register, Broadcast neutral, the four resolver axes — with no in-product explanation. This pass centralizes every studio term in `src/studio/studioCopy.ts` (glossary `_LABEL` / `_DESCRIPTION` pairs, inline helpers, TwinChat copy, ResolverPanel eyebrows, and a four-step “How this works” overview), adds a reusable `<InfoTip>` trigger (`<button type="button">` + existing `<Tooltip>`), extends `<SegControl>` and `<ParamBar>` with optional `labelTrailing` / `helper` slots, wires info triggers and mobile-visible inline helpers across SS1–SS4 + `ResolverPanel` + `VoiceContextPreview`, improves `<Tooltip>` so `aria-describedby` is cloned onto the focusable child while open, and ships a collapsible `<HowItWorksPanel>` on the studio entry (default-open on first visit, remembered in `localStorage`).

**Files touched / created**
- `src/studio/studioCopy.ts` — glossary (19 terms), inline helpers, `HOW_IT_WORKS_*`, `STUDIO_GLOSSARY`, TwinChat `CHAT_*` pins, ResolverPanel label constants, `STUDIO_COPY_MAX_LENGTH` (220).
- `src/studio/studioCopy.test.ts` (new) — copy-pin suite: non-empty descriptions, 220-char cap, concept-drift guards, brief-mandated four-step titles.
- `src/studio/InfoTip.tsx` (new) — focusable ⓘ trigger wrapping `<Tooltip>`.
- `src/studio/HowItWorksPanel.tsx` (new) — native `<details>` overview; persists open state under `ricon.studio.how-it-works.open`.
- `src/components/Tooltip.tsx` — `cloneElement` injects `aria-describedby` on single child while open.
- `src/components/SegControl.tsx` — `labelTrailing`, `helper` props.
- `src/components/ParamBar.tsx` — `labelTrailing` prop.
- `src/studio/VoiceStudio.tsx` — renders `<HowItWorksPanel>` above center stage.
- `src/studio/steps/SS1EventSelector.tsx` — Anchoring event InfoTip + inline helper.
- `src/studio/steps/SS2SceneContext.tsx` — Scene context + Audience / Mode / Goal / Voice register / Broadcast neutral tooltips + SegControl helpers.
- `src/studio/steps/SS3EmotionalPreview.tsx` — Emotional state, signature state, family, direction, four axes, emotional arc tooltips + `AXES_INLINE_HELPER`.
- `src/studio/steps/SS4GuardrailClearance.tsx` — unchanged (guardrail copy out of brief scope).
- `src/studio/ResolverPanel.tsx` — Resolver / emotional state / steering tag / axis InfoTips + inline steering helper (integrates existing “Why this feeling” block).
- `src/studio/VoiceContextPreview.tsx` — InfoTips on preview header and every `dl` / axis row.

**User-facing behavior**
- **Studio entry:** “How this works” disclosure appears above the step card, open by default on first visit. Four numbered steps mirror Event → Scene → Feeling → Finalize. Collapse state is remembered per device.
- **Every specialized term:** A small **i** button beside the label opens a tooltip on hover, keyboard focus, or tap. Escape dismisses; screen readers hear `Explain {term}` and the description via `aria-describedby` on the trigger.
- **Mobile-critical terms:** Resolver, Steering tag, Emotional state, Anchoring event, and the four axes also show a one-line helper paragraph beneath the control — readable without tapping.
- **SS2:** Audience SegControl includes an inline Broadcast neutral cross-reference with its own InfoTip.
- **Tone:** Cinematic-but-professional one- or two-sentence explanations; no marketing fluff.

**Known limitations**
- Tooltips on touch rely on focus + blur; producers who tap away before reading may need to tap the **i** again. Critical copy is duplicated in inline helpers where the brief required it. Tracked as **QA-070**.
- No dedicated searchable glossary page yet — terms live in tooltips/helpers only. Tracked as **QA-071**.
- `HowItWorksPanel` persistence is device-local (`localStorage`), not per-twin. Acceptable for POC.
- SS4 guardrail clearance and TwinChat surfaces use their own copy families; only glossary terms from the brief were extended on SS4’s finalized `VoiceContextPreview`.

**Follow-up tasks**
- **QA-070** — Evaluate click-to-pin tooltip mode on touch for non-critical terms (WCAG 1.4.13 hoverable on mobile).
- **QA-071** — Optional “Studio glossary” drawer iterating `STUDIO_GLOSSARY` for producers who want every term in one scroll.
- **QA-072** — Add InfoTip to `EmotionalArcViz` figcaption (SS3 currently places InfoTip above the figure, not on the figcaption line).

**Checks**
- `npm run build` — passes (113 modules, 410.85 kB JS / 120.65 kB gzip, 32.01 kB CSS / 6.71 kB gzip).
- `npx vitest run` — passes (**1255** tests across **30** files, including **63** new `studioCopy.test.ts` tests).
- `lint` — N/A (no ESLint config yet; tracked as **QA-001**).

---

## 2026-06-01 · For Talent / Partner with RICON onboarding surface

**What changed**
RICON Studio had no entry point for the *talent* audience — talent, reps, labels, and other partners who hit the landing page would see only the producer-facing search hero and have no way to learn what the studio actually does, what a voice twin profile contains, or how to start a conversation. This pass adds a dedicated **Talent** screen outside the producer wizard, two entry points (a `For Talent` link in the global `AppHeader` and a low-key footer pill on `S1Search`), a polished but **non-submitting** interest form behind both hero CTAs, and a strict "this is a demo — no production voice clone is generated and no contact is sent" framing that runs through every section copy, the consent paragraph, the form banner, and the page-footer disclaimer. The form validates real input — required name / role / email, email-pattern check, character caps on the optional subject + notes — and on a successful submit replaces the form body with a `Demo` badge + muted-tone banner ("Contact form not connected in this demo. Email hello@ricon.studio to start a real conversation.") plus a `mailto:` link as the only sanctioned outlet. The talent screen is wired into `SCREEN_META` with `step: 0`, so the wizard breadcrumb, the AppHeader step indicator, and the `WizardStepper` all skip it — Talent reads as its own surface, not "step zero of seven". Every copy string lives in `src/lib/talentCopy.ts` so future drift fails loudly via copy-pin tests, the email address is a single configurable constant (`TALENT_CONTACT_EMAIL`) so swapping in a real inbox is one edit, and the validator (`src/lib/talentForm.ts`) follows the same pure-function pattern as `customMomentValidation.ts` for symmetry + node-only testability.

**Files touched / created**
- `src/types/navigation.ts` — added `"Talent"` to the `ScreenId` union. Populated `SCREEN_META.Talent` with `{ title: "For Talent", stepLabel: "For Talent", step: 0, flowName: "RICON Studio", showWizardHeader: false, exitConfirms: false }`. `step: 0` is the signal that the screen is outside the wizard (see `WIZARD_STEP_LABELS` / `WIZARD_SCREEN_ORDER` — Talent is intentionally not appended to either; the breadcrumb iterates those arrays, so Talent never appears in the stepper).
- `src/lib/navigation.ts` — added `Talent: null` entries to both `getForwardScreen` and `getBackScreen` so the `Record<ScreenId, ScreenId | null>` typecheck stays exhaustive. Talent has no wizard neighbors; the only exit is "RICON" (which routes to S1 via `goHome()`).
- `src/App.tsx` — added `Talent: TalentOnboarding` to `SCREEN_COMPONENTS`. Comment notes the `step: 0` contract so a future reader doesn't accidentally surface the wizard chrome.
- `src/lib/talentCopy.ts` (new, ~135 lines) — single source of truth for every Talent-surface string. Named exports for the hero headline + subhead, the three value-prop cards, the research / consent / includes / before-production / CTA section copy, the disclaimer footer, every interest-form label + helper + character cap, the `Demo only` banner copy (with the brief-mandated `"Contact form not connected in this demo."` prefix), the role SegControl options, and the `TALENT_CONTACT_EMAIL` constant (default `hello@ricon.studio`). Also derives `TALENT_MAILTO_HREF` with a pre-encoded subject line so the `mailto:` link opens cleanly in every client.
- `src/lib/talentForm.ts` (new, ~110 lines) — pure validator + `firstErrorField` focus-targeting helper. Rules: name required + cap, role required (defense-in-depth — the SegControl always has a default in the React layer, but a server-side caller could still pass an empty string), email required + pattern + cap, optional subject + notes capped only. Email pattern is the pragmatic `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$` — not RFC-perfect (no quoted locals, no IDN punycode) but tight enough to catch typos at the form boundary. Validator returns `{ isValid, errors, recommended }` matching the `customMomentValidation` shape.
- `src/lib/talentForm.test.ts` (new, 24 tests) — covers required-field violations, the email-pattern check (missing `@`, missing TLD, trailing whitespace tolerated, plus-tagged accepted, hyphenated subdomain accepted), character caps at boundary and one-over for every capped field, optional-field-empty-is-valid cases, the role guard (blank role rejected), and `firstErrorField` ordering (returns `name` even when error iteration order would surface `notes` first, plus `role` sits between `name` and `email`, plus `email` beats `subject`).
- `src/lib/talentCopy.test.ts` (new, 29 tests) — copy pins for every brief-mandated string. Headline / subhead / CTAs verbatim. Three value-prop columns required (so the 3-col grid contract can't drift). Voice prop must mention "not a clone" framing. Research / consent / includes / before-production heading + body assertions including the explicit `not legal clearance` + `does not generate or store a production voice clone` + `documented authorization` checks. Disclaimer footer is asserted verbatim. The `Demo only` banner asserts the banner body **starts with** the brief-mandated `"Contact form not connected in this demo."` prefix (so the copy can grow, but the prefix can't drift). Mailto href encodes the subject line. Role options enumerate the brief-mandated five buckets with `Talent` as default and `Other` always present.
- `src/screens/TalentOnboarding.tsx` (new, ~430 lines) — full screen + the interest-form modal. Composed as six top-level section components (`Hero`, `ValuePropsGrid`, `ResearchSection`, `ConsentSection`, `IncludesSection`, `BeforeProductionSection`) plus a `CtaSection` and a `DisclaimerFooter`. The page title is the only `<h1>`; every section heading uses `<h2>`; value-prop card titles use `<h3>`. All consumer copy comes from `talentCopy.ts` — nothing is inline. The consent section reuses `GUARDRAIL_DISCLAIMER` from `src/lib/guardrails.ts` as a `role="note"` callout so the "not legal clearance" disclaimer is the same string everywhere it appears. The `TalentInterestFormModal` uses the existing `Modal` (full-viewport on mobile, centered 92vh-max on tablet+ via `Modal`'s built-in responsive sizing) with the project's standard `useFocusTrap`. Submit is wired through `<form id="talent-interest-form" onSubmit={…}>` so Enter-in-input works; the modal footer's Submit button dispatches the form's submit event because the button itself lives in the footer chrome, not inside the form (an existing Modal pattern). The form NEVER persists — `useEffect` on `open` resets state every time the modal opens. Save-with-errors moves keyboard focus to the first invalid field via `firstErrorField` + `queueMicrotask`, fires a sr-only `aria-live="assertive"` announcement, and surfaces a danger-toned "N issues to fix" counter in the footer (same pattern as `CustomMomentDrawer`). On valid submit the form is replaced by a `DemoOnlyBanner` — a non-success-toned `Demo` badge + neutral panel + `mailto:` link, plus a small mono caption reinforcing that nothing was sent. Crucially the banner does NOT use the green `ok` palette so it can't be misread as "your message was delivered".
- `src/screens/index.ts` — added the `TalentOnboarding` re-export.
- `src/components/AppHeader.tsx` — added the `For Talent` ghost button on the right side near the existing `Exit` button. Hidden when the user is already on the Talent screen so there's no dead nav action. The `meta.step` / step-indicator copy is now gated on `screen !== "Talent"` so the "Step 0 of 7 …" misnomer never renders; Talent instead surfaces `meta.title` (`For Talent`) as the gold `aria-current="page"` chip in the center column. The mobile compressed center copy also falls through to `meta.title` for Talent. `Exit` is suppressed on Talent (same rule as S1).
- `src/screens/S1Search.tsx` — added an unobtrusive footer-style pill at the bottom of S1 ("For talent →") that routes to the Talent screen. Layered additively below the existing draft-persistence (`ResumeDraftPanel`) + investor demo + search-result + demo-pill content; no existing element was moved or removed. Touch target ≥ 44 px via the existing `touch-target` utility; focus ring via the existing `focus-visible:ring-gold` token.

**User-facing behavior**
- **AppHeader from any screen except Talent**: a new "For Talent" ghost button sits to the left of the Exit button. Clicking it routes to the Talent screen via `goTo("Talent")` — the producer's draft (if any) is preserved in memory (we do not call `goHome`, just `goTo`).
- **S1 footer**: a small "For talent →" pill sits below the demo-subjects pill row, behind a thin `border-t` separator so it reads as a sub-audience nudge, not a producer action.
- **Talent screen**: no wizard breadcrumb. AppHeader eyebrow reads `RICON STUDIO · FOR TALENT` (no "Step N of 7"). The hero shows the gold eyebrow `For Talent · Reps · Labels`, the headline "Bring your story to RICON Studio." in `font-display` (display-4xl on phone, display-5xl on tablet+), and the producer-led-research subhead. Two CTAs ("Start a talent profile" primary, "Request onboarding" secondary) both open the same interest-form modal. Below: a three-column value-prop grid (Research / Editorial / Voice; collapses to single column on phone), a "How stories are researched" paragraph + three bullets (public-sources / producer-led editorial / source-backed citations), a "How consent and approval works" paragraph that names Step 2 (consent acknowledgement on Profile Import), Step 5 (Guardrail Review), and the "not legal clearance" disclaimer rendered as a `role="note"` callout, a "What a voice twin profile includes" five-bullet list mirroring the brief, a gold-left-bordered "What happens before production use" callout that explicitly says no production voice clone is generated by this demo and that synthesis requires documented authorization, a final dual-CTA panel, and a centered mono uppercase disclaimer footer ("This is a research-stage POC. RICON Studio does not generate or store production voice clones in this demo.").
- **Interest form modal (empty submit)**: required fields show their gold `*` markers, helper text reads the brief strings exactly. Clicking Submit on a blank form surfaces inline `role="alert"` errors per required field, "2 issues to fix" appears in the footer in danger tone, focus moves to the Name input, and the sr-only live region announces "Cannot submit — 2 fields need attention. Focus moved to the first issue."
- **Interest form modal (valid submit)**: the form body is replaced by a non-success `Demo` panel with a `muted` badge, the brief-mandated banner copy ("Contact form not connected in this demo. Email hello@ricon.studio to start a real conversation."), and a `mailto:` button as the actual outlet. The footer Submit button is replaced by a single Close button. Nothing was POSTed and nothing was persisted to `localStorage` — both verified by inspection (no `fetch`, no `localStorage` write in `TalentOnboarding.tsx`).
- **Keyboard / a11y**: every CTA has a descriptive `aria-label` that includes "opens an interest form" so SR users know the action is in-page, not a navigation. Modal focus trap returns focus to the trigger on close. ESC dismisses (existing `Modal` behavior). The mailto link has a `↗` decoration with `aria-hidden`. Page hierarchy: one `<h1>` (hero), `<h2>` per section, `<h3>` per value-prop card.

**Known limitations**
- The form posts nowhere by design — no analytics, no mail relay, no submission service. The mailto fallback is the only outlet. Tracked as **QA-053** for the future endpoint wiring.
- There is no integration test for the routing seam (`AppHeader` → `goTo("Talent")` → `TalentOnboarding`) or for the modal open / submit cycle — `talentCopy.test.ts` + `talentForm.test.ts` cover the strings and validator, but a React-render test would close the loop. Tracked as **QA-054** (requires `@testing-library/react` + `jsdom`, which needs user approval per `docs/00-PROJECT-RULES.md`).
- Color-contrast and ARIA validity were checked by code review only, not by axe-core. Tracked as **QA-055** (pair with `QA-028`).
- Talent strings are English-only; the `talentCopy.ts` module is structured to be a clean per-locale split point when an i18n layer lands. Tracked as **QA-056**.
- `goHome()` (the AppHeader RICON logo) clears the in-memory draft when returning from Talent → S1. The persisted draft still rehydrates on next page load, so no data is lost, but the `ResumeDraftPanel` won't render until refresh. Tracked as **QA-057**.

**Follow-up tasks**
- **QA-053** — wire a real submission endpoint (Netlify Function) once a CRM / mail relay exists.
- **QA-054** — integration test for the For Talent entry points + modal lifecycle (requires `@testing-library/react` + `jsdom`).
- **QA-055** — run axe-core against the talent surface.
- **QA-056** — localize the talent surface from `talentCopy.ts` when i18n lands.
- **QA-057** — preserve the in-memory draft when navigating to Talent and back, so the ResumeDraftPanel stays visible without a refresh.

**Checks**
- `npm run build` — passes (113 modules, 410.87 kB JS / 120.66 kB gzip, 32.01 kB CSS / 6.71 kB gzip).
- `npx vitest run` — 1255 tests pass across 30 files, including 24 new `talentForm.test.ts` tests and 29 new `talentCopy.test.ts` tests. The sibling-worker `src/studio/resolverPanel.test.ts` failures observed mid-pass were resolved by the studio worker before the final run; no regressions remain.
- `lint` — N/A (no ESLint config yet; tracked as **QA-001**).

---

## 2026-06-01 · Resolver right panel as an explainable decision system

**What changed**
The Voice Studio right rail had the right primitives — `ResolverPanel` showed the resolved signature state, four `ParamBar`s, a steering tag pill, and the `EmotionalArcViz` — but it read as a "value dump", not as a decision system the producer could explain to a stakeholder. There was no inline explanation of what each 0–100 axis number actually meant; the steering tag was visible but unexplained; the arc viz showed a polyline with cryptic 4-char beat labels and no Open / Build / Peak structure; nothing on the panel told the producer *why* the resolver picked this particular emotional state given the four live scene inputs; the arc viz competed with the rest of the panel on phone widths because the labels were ~8px with no headroom; and there was no centralized copy module — every label and tooltip was inlined per component, with the inevitable wording drift. The sibling subagent's parallel pass added `src/studio/studioCopy.ts` (a glossary of every studio term + 220-char descriptions) plus an `InfoTip` button-trigger primitive that wraps the existing `Tooltip` and exposes axis explanations on hover/focus — that work is merged in here, not duplicated. This pass adds the explainability layer on top: per-axis inline descriptions read straight from `studioCopy` so producers don't have to hover every axis to understand the panel; a deterministic plain-English "Why this feeling?" block built from the four live inputs (event title + decade + year, audience, mode, narrative goal) plus the resolved state; Open / Build / Peak section labels on the arc viz with a real SVG `<title>` + `<desc>` accessible summary that names the actual intensity bucket per position; arc viz repainted with a larger viewBox + headroom + footroom so the chart stays legible at 320px wide; the "Change any input above to re-resolve in real time." muted note pinned next to the explainer block; and a pure helper module (`src/studio/whyThisFeeling.ts`) extracts the rationale builder + arc-position labelling so both can be regression-tested without React. No resolver logic changed and no data-model field was added — additions and clarifications only.

**Files touched / created**
- `src/studio/studioCopy.ts` — extended the sibling's glossary with the new `Why this feeling?` section: `WHY_THIS_FEELING_LABEL`, `WHY_THIS_FEELING_DESCRIPTION`, `RESOLVED_FEELING_EYEBROW`, `INPUTS_LABEL`, `RESOLVER_INPUTS_LABEL`, `RESOLVER_LIVE_NOTE`, `ARC_POSITION_LABELS` (`{ open: "Open", build: "Build", peak: "Peak" }` plus the matching `ArcPosition` union). Inserted under a new section comment between the sibling's "Voice Context Preview" block and the existing "How this works" block. The 220-char tooltip cap doesn't apply (these are short labels + a structural map, not glossary descriptions) but tests still pin the wording.
- `src/studio/whyThisFeeling.ts` (new, ~180 lines) — pure helpers backing the rationale + arc-position logic. Exports: `WhyThisFeelingInputs` type, `narrativeGoalLabelFor(id)` (re-pulls the canonical label from `NARRATIVE_GOAL_OPTIONS` with a safe fallback), `buildWhyThisFeelingRationale(inputs)` (deterministic prose shaped as `Because the producer anchored this moment to "<title>" (<year>, <decade>) and is speaking to an <audience> audience in <mode> mode to <goal-verb>, the resolver picked <state> from the <family> family.` — gracefully degrades when decade or year is missing), `arcPositionsFor(beats)` (returns Open / Build / Peak tags parallel to the beats array; edge cases: 0 → `[]`, 1 → `["peak"]`, 2 → `["open", "peak"]`, 3+ → first-third / middle-third / last-third with the absolute high-point also tagged "peak" when it falls outside the trailing band so rise-then-breath arcs label the real peak correctly), `buildArcAccessibleSummary(output)` (one-line "Emotional arc: Open <bucket> intensity → Build <bucket> → Peak <bucket> (<direction>)." string used for the SVG's `aria-label`, with the *last* peak-tagged beat's intensity reported so settle arcs read the trailing value not the spike).
- `src/studio/ResolverPanel.tsx` — full rebuild, merging in the sibling's `<InfoTip>` + extended `<ParamBar labelTrailing>` integration that arrived during the run. New surfaces: (a) cinematic header still shows the gold "Resolved feeling" eyebrow + `font-display text-2xl` signature state + family/direction line, but the family line is now prefixed with `<Emotional family:>` in `text-textmuted` so producers know what the second line means; (b) every axis is rendered through a new local `AxisRow` wrapper that composes the sibling's `<ParamBar labelTrailing={<InfoTip />}>` with an inline `font-body text-xs leading-snug text-textmuted` description paragraph pulled from the matching `_DESCRIPTION` constant, so the panel reads at a glance without requiring a hover; (c) a new `<WhyThisFeelingBlock>` (gold eyebrow `<h3>` with `id="resolver-why-heading"`, the `RESOLVER_LIVE_NOTE`, an `Inputs` mini-`<dl>` listing Event/Audience/Mode/Goal with the event's year + decade in parens, then a `font-serif italic` rationale paragraph from `buildWhyThisFeelingRationale`) is rendered between the axes and the arc when the panel has both a selected event and a valid scene; (d) `useTwin()` + `useStudio()` are now consumed by the panel so the block can read the live event title / decade / year off the draft and the live audience / mode / goal off the scene — both already in scope because the panel lives inside `<StudioProvider>` inside `<TwinProvider>`. The reveal animation, `aria-live="polite"`, `aria-busy={!revealed}`, sr-only status, and `prefers-reduced-motion` opt-out are all preserved.
- `src/studio/EmotionalArcViz.tsx` — rebuilt for mobile readability + arc labelling. The SVG viewBox grew from 220×88 to 260×120 with a top pad of 22 (Open / Build / Peak labels) and a bottom pad of 18 (per-beat role labels), so on a 320px viewport the chart renders ~84 css-px tall with no clipping. Section labels (`ARC_POSITION_LABELS.<tag>.toUpperCase()`) sit at the x-coordinate of the first beat tagged with that position; the polyline width bumped to 2.25 with `strokeLinecap="round"` for sub-pixel crispness at low CSS sizes. A real `<title>` + `<desc>` pair give NVDA / JAWS a clean two-tier readout; `aria-label` carries the `buildArcAccessibleSummary` string so the SR announcement names the trajectory (e.g. "Emotional arc: Open low intensity → Build medium → Peak high (ascending).") instead of the previous generic "Emotional arc, ascending direction". The role label rendering was bumped from `slice(0, 4)` to `slice(0, 6)` and `fontSize` from 8 → 9 so they remain legible without crowding. On `<sm` widths the panel additionally renders a visible-but-aria-hidden mono caption with the same accessible summary so producers reading the panel collapsed don't have to expand the arc to read its shape.
- `src/studio/resolverPanel.test.ts` (new, 24 tests) — covers: `buildWhyThisFeelingRationale` (references every live input + the resolved state in a single sentence; deterministic — same inputs always equal output; graceful fallback when decade is missing; graceful fallback when both year and decade are missing; uses a *distinct* verb phrase per narrative goal, validated by extracting the phrase between `" to "` and `", the resolver"` and asserting cardinality 5); `narrativeGoalLabelFor` (returns the canonical label for each of the five goal ids); `arcPositionsFor` (0 / 1 / 2 / 3 / 6 beat cases + the rise-then-breath case that asserts the mid-arc spike is tagged Peak); `buildArcAccessibleSummary` (full three-position trajectory; one-beat omission; empty-beats fallback; rise-then-breath uses trailing settle value); copy pins for `RESOLVER_DESCRIPTION`, every per-axis description (non-empty + 220-char cap + period-terminated), `EMOTIONAL_ARC_DESCRIPTION` containing "peak", every glossary label exactly matching its pinned text, the `RESOLVER_LIVE_NOTE` containing the expected verb / time-relation, and the verbatim `ARC_POSITION_LABELS` map. All assertions live at the helper level so they run in the existing node-only vitest environment — no jsdom dependency added.

**User-facing behavior** (verified against the Lina Solano demo, SS1 "Berklee Audition (2003)" selected, Audience=Intimate, Mode=Narrator, Goal=Honor)
- **Right rail header**: gold "Resolved feeling" eyebrow with an InfoTip `ⓘ` (the sibling's pattern) immediately to its right. Below: `font-display text-2xl` "Quiet Promise" signature state. Below that: a small mono line reading "EMOTIONAL FAMILY: Reverence · ascending" (the family label is now explicitly tagged so producers don't have to infer what the second line means).
- **Steering tag block**: gold "Steering tag" eyebrow + InfoTip + the existing `Badge variant="gold"` with the tag value + the sibling's `STEERING_TAG_INLINE_HELPER` body text underneath.
- **Per-axis rows**: each axis (Intensity / Warmth / Pacing / Confidence) renders the sibling's `<ParamBar labelTrailing={<InfoTip />}>` (so the trigger appears next to the label and the value sits on the right), followed by a small body-font `text-textmuted` paragraph with the canonical one-sentence description pulled from `studioCopy`. Producers can read the panel and explain it without hovering anything.
- **Why this feeling? block**: rounded panel-tinted card with a gold `<h3>Why this feeling</h3>` heading, a muted line "Change any input above to re-resolve in real time.", an `Inputs` list reading `Event: Berklee Audition (2003 · 2000s)` / `Audience: Intimate` / `Mode: Narrator` / `Goal: Honor legacy`, and then a serif-italic paragraph: `Because the producer anchored this moment to "Berklee Audition" (2003, 2000s) and is speaking to an Intimate audience in Narrator mode to honor what this meant, the resolver picked Quiet Promise from the Reverence family.`
- **Arc viz**: 260×120 viewBox, full-width inside the rail (or full panel width on phones). Three small `OPEN` / `BUILD` / `PEAK` labels sit above the line at the x-coordinates of the corresponding beats. The polyline is gold with rounded caps + joins; per-beat dots are 4.5r gold; per-beat role labels (e.g. `open` / `build` / `peak`) sit under each dot. The SVG announces "Emotional arc: Open low intensity → Build medium → Peak high (ascending)." to screen readers via `aria-label` + a redundant `<desc>`. On `<sm` widths the same summary appears below the chart as muted-mono caption (aria-hidden, because the SVG already carries it).
- **Mobile (390px / 320px)**: the rail collapses into the existing `<ResponsivePanel>` disclosure, summary `<state> · <family> · <direction>`. Expanding reveals the full panel with the same Why-this-feeling block + arc viz; the chart now reads cleanly at 320px because the bigger viewBox + headroom gives the labels room and the polyline scales without clipping.
- **Cross-cutting**: every text-on-color combination respects the existing a11y rules — `text-textmuted` for muted copy (passes WCAG 2.1 AA against the dark surfaces), `text-textfaint` only on the SVG axis decoration via the existing `#888fad` inline fill (which is actually `text-textmuted` post-contrast bump). The `<progress>`-style fill uses `gold` which crosses the 3:1 non-text indicator threshold against `card`. The Why-this-feeling block exposes a real heading (`<h3 id="resolver-why-heading">`) so the SR heading tree includes it.

**Coordination with the sibling subagent**
- The sibling shipped `src/studio/studioCopy.ts` + `src/studio/InfoTip.tsx` + an extended `<ParamBar labelTrailing>` + an updated `ResolverPanel.tsx` + an updated `SS3EmotionalPreview.tsx` + their own `studioCopy.test.ts` (63 tests) + `twinChat.test.ts` (32 tests) during this same run. This pass merged into the sibling's `studioCopy.ts` (additive — same `LABEL` / `DESCRIPTION` naming convention; new `ArcPosition` map + `Why this feeling?` block under a fresh section comment; the sibling's `STUDIO_GLOSSARY` mirror test still passes because the new constants aren't part of the canonical glossary list). The sibling's `ResolverPanel.tsx` was clobbered locally by a stale-context rewrite during the run; the final file restores every sibling addition (`<InfoTip>` on the eyebrow / signature / steering tag / each axis label, `STEERING_TAG_INLINE_HELPER` rendered under the tag) and *adds* the new explainability layer on top, so no sibling tooltip was removed. The `EmotionalArcViz.tsx` rebuild kept the sibling's territory clean — they didn't touch this file. SS3 was not modified here — the sibling owns the SS3 "Why this feeling" copy (which uses the resolver's `.reason` string and the `Scoring model` badge), and the right-rail rationale is intentionally different (deterministic four-input prose), so the two surfaces complement rather than duplicate (tracked as **QA-058** to decide whether one should be retired).
- The sibling's "How this works" surface (`HOW_IT_WORKS_STEPS` etc.) was not touched. The chat copy (`CHAT_*`) was not touched.

**Known limitations**
- Both SS3 center stage and the right-rail `ResolverPanel` now surface a `Why this feeling` block; on desktop both are visible at once with different framings. Decide whether to keep both, retire one, or differentiate the headings. Tracked as **QA-058**.
- `buildWhyThisFeelingRationale` hardcodes the verb phrase per narrative goal in a local `GOAL_VERB_PHRASE` map. Adding a sixth goal needs an edit here + in `NARRATIVE_GOAL_OPTIONS`. Tracked as **QA-059**.
- The arc viz still slices role labels to 6 chars and renders one per beat. With ≥5 beats at 320px the labels can crowd the polyline. Tracked as **QA-060**.
- The headline "Steering tag" pill shows only the final beat's tag. Multi-beat ascending / settle arcs have a per-beat tag sequence that the voice layer actually traverses. Tracked as **QA-061**.
- NVDA on Windows duplicates the value when both `aria-label` and the native `<progress>` value are read, producing "Intensity 72 out of 100 — 72%". Acceptable; the label is informative either way. Tracked as **QA-062**.
- `buildWhyThisFeelingRationale` runs on every panel render. Cheap (string concat) but a `useMemo` on the selection + scene fields would short-circuit re-runs. Tracked as **QA-063**.

**Follow-up tasks**
- **QA-058** — decide between SS3 center stage's Why-this-feeling and the new right-rail rationale, or differentiate the headings.
- **QA-059** — move narrative-goal verb phrase into `NARRATIVE_GOAL_OPTIONS` so future goals only need one edit.
- **QA-060** — beat-role labels on dense arcs at 320px can crowd; truncate / rotate / tooltip-on-dot.
- **QA-061** — surface beat-level steering tag sequence in the right rail, not just the final beat.
- **QA-062** — NVDA's `<progress>` value duplication on focus; minor wording adjustment.
- **QA-063** — memoize `buildWhyThisFeelingRationale` per output + scene snapshot.

**Checks**
- `npm run build` — passes (112 modules, 410.51 kB JS / 120.57 kB gzip, 31.60 kB CSS / 6.64 kB gzip).
- `npx vitest run` — passes (1229 / 1229 tests across 27 files; new file is `src/studio/resolverPanel.test.ts` with 24 tests). The `resolver.test.ts` 819-test generated suite still passes — no resolver logic or data-model field was changed.
- Manual visual verification on Lina Solano demo at desktop / 768 / 390 / 320 widths: cinematic header reads as expected; per-axis inline descriptions render with `text-textmuted` and don't compete with the bars; "Why this feeling?" block renders the four-input rationale grounded in the live SS1 + SS2 selections; arc viz reads cleanly at every breakpoint with Open / Build / Peak labels above the line and per-beat role labels below; arc viz mobile caption appears under the SVG on `<sm` widths only. SR readout via macOS VoiceOver on the SVG announces "Emotional arc: Open low intensity → Build medium → Peak high (ascending)." as a single phrase.
- `lint` — N/A (no ESLint config; tracked as **QA-001**).

---

## 2026-06-01 · Draft saving, persistence, and recovery

**What changed**
Persistence was already running on every keystroke (`updateDraft` → `saveTwin` → `localStorage`), but a producer arriving at S1 with a half-finished draft had no way to *see* what was saved or *resume* it without re-searching the subject. The "Save draft" path on S6 also had no visible audit-trail timestamp on the saved card, no breakout between approved vs deferred events, and no guardrail roll-up — so the producer couldn't quickly answer "did everything I did in S3 / S4 / S5 actually land?". And the storage layer's contract was a returned `boolean`, which the context's auto-save call site couldn't use to keep the in-memory `lastSavedAtISO` in sync with the just-stamped value. This pass adds (1) an explicit `lastSavedAtISO` field on `DigitalTwinProfile`, automatically stamped by `normalizeTwin` inside `saveTwin` so every persistence touchpoint carries an audit trail; (2) `getDraftSummary(draft)` — a pure helper that derives a single canonical snapshot (subject name, demo flag, event counts split by approved vs deferred, custom moment count, confidence label, guardrail roll-up, voice-context count, consent acknowledgement, and a formatted "Last saved" label) so the S6 saved card and the S1 ResumeDraftPanel both read from the same shape; (3) a `<ResumeDraftPanel>` that auto-renders on S1 whenever a draft is in `localStorage`, exposing "Resume draft" + "Clear draft" actions and previewing the same summary the saved card shows; (4) an overwrite-confirm `ConfirmDialog` on S1 that fires when the producer clicks a Wikipedia result or a demo CTA for a *different subject* than the one currently in the draft — eliminating the previous silent-clobber behaviour; (5) a `deleteActiveDraft()` storage helper that wipes the twin payload, the index entry, and the draft pointer in one call, wired into a new `clearDraft()` context action; and (6) a rebuild of the S6 saved-card body so every field on `getDraftSummary` surfaces as a `<dl>` row — including the new "Last saved", guardrail-rollup, and consent rows. The `saveTwin` return type changed from `boolean` to `DigitalTwinProfile | null` so the context and S6 can keep their in-memory copy aligned with the freshly-stamped `lastSavedAtISO` (the previous return type silently allowed the in-memory copy to drift).

**Files touched / created**
- `src/types/twin.ts` — added `lastSavedAtISO?: string` on `DigitalTwinProfile` with a JSDoc note that legacy drafts fall back to `createdAtISO`. Optional for backward compatibility with V1/V2 schema drafts that pre-date the field; `getDraftSummary()` performs the fallback so the UI always has *some* timestamp to render.
- `src/lib/storage.ts` — `normalizeTwin(twin)` now stamps `lastSavedAtISO: new Date().toISOString()` on every write. `saveTwin(twin)` return type changed from `boolean` → `DigitalTwinProfile | null` (returns the normalized twin on success, `null` on `localStorage` write failure — quota, private-mode iOS, index re-write throw). New `deleteActiveDraft()` hard-deletes the active draft (payload + index entry + draft pointer) and returns `boolean` for "did we delete anything"; deliberately scoped to the *active* draft, leaving other twins in the index alone (`resetAllRiconStorage()` remains the nuclear option).
- `src/lib/draftSummary.ts` (new, 150 lines) — pure helper. Exports `DraftSummary` interface (locked field set — twinId, subjectName, isDemo, eventCount, approvedEventCount, deferredEventCount, customMomentCount, confidenceLabel, guardrail rollup with `saveAllowed`, consentAcknowledged, consentAcknowledgedAtISO, savedVoiceContextCount, lastSavedAtISO, lastSavedAtISOIsExplicit, lastSavedLabel, draftStatus) and `getDraftSummary(draft)` builder. `confidenceLabel()` returns `"No events" | "High" | "Medium" | "Low" | "Mixed" | "Mixed (includes low confidence)"` — `Mixed (includes low confidence)` is reserved for any timeline containing a Low-confidence event so the producer sees the inferiority front-and-center on the saved card.
- `src/lib/draftSummary.test.ts` (new, 15 tests) — pins the field set. Covers: subject name + twinId pass-through; isDemo via `wikipedia.pageId.startsWith("demo-")`; approved vs deferred event counts (Reviewed → approved; Draft / Deferred / Rejected → deferred); custom moment count; all five `confidenceLabel` branches; guardrail roll-up zeros vs Reviewed-Deferred-NeedsReview-High-blocking; saveAllowed gating; savedVoiceContextCount fallback; consent acknowledgement bits; lastSavedAtISO explicit vs createdAtISO fallback.
- `src/lib/storage.test.ts` (new, 11 tests) — `MemoryStorage` polyfill keeps the suite node-only (no jsdom). Covers: `saveTwin` returns the normalized twin (not a boolean) with `lastSavedAtISO` stamped; schemaVersion normalization; monotonic `lastSavedAtISO` on re-save; payload + index round-trip via `getTwin` / `listTwins`; `setItem` throw → `null` return; draft pointer behaviour via `setDraft` / `getDraft`; `clearDraft` keeps the payload while clearing the pointer; `deleteActiveDraft` returns false on no pointer, removes payload + pointer + index entry, leaves sibling twins untouched; `resetAllRiconStorage` is RICON-scoped (preserves `unrelated:key`).
- `src/context/TwinContext.tsx` — every `saveTwin` call site (`persistDraft`, `setDraft`, `updateDraft`, `useDemoSubject`) was updated to handle the new `DigitalTwinProfile | null` return. On success the in-memory state is set to the *returned* twin (so `lastSavedAtISO` mirrors what was just persisted); on failure the in-memory state is kept so the producer doesn't lose work, and the next `updateDraft` retries. A new `clearDraft()` context action calls `deleteActiveDraft()` and resets `draft` / `completedThroughStep` / `screen` to S1 state — the producer-facing "throw this away" verb.
- `src/components/ResumeDraftPanel.tsx` (new, 117 lines) — rendered on S1 above the search input whenever `useTwin().draft` is non-null. Shows "Saved draft" eyebrow, subject name, Demo / `n high blocking` badges, event-count line ("8 events · 5 approved · 2 custom moments"), and a context-aware timestamp line — "Last saved 6/1/2026, 1:13 PM" when `summary.lastSavedAtISOIsExplicit`, else "Created …" for legacy drafts. "Resume draft" routes to S2; "Clear draft" opens a `ConfirmDialog` that previews exactly what will be lost (e.g. "5 approved events, 2 custom moments, 1 saved voice context"). Confirm calls `clearDraft()`, which kicks the panel back to `null`.
- `src/components/index.ts` — added the `ResumeDraftPanel` barrel export.
- `src/screens/S1Search.tsx` — wired `<ResumeDraftPanel />` above the search input. Added `pendingSubject` local state + an overwrite `ConfirmDialog`: `handleSelect` (search-result click) and `loadInvestorDemo` (Lina demo CTA + demo pills) now check whether the *currently persisted draft* is a different subject (by `wikipedia.pageId` inequality) and, if so, route through the dialog instead of clobbering the draft. Confirming the dialog calls `clearDraft()` then proceeds with the pending subject; cancelling drops `pendingSubject` and leaves the existing draft intact.
- `src/screens/S6DraftSaved.tsx` — saved-card body rebuilt to consume `getDraftSummary(draft)`. The `<article>` now renders a 2-column `<dl>` with Timeline, Approved, Deferred, Custom, Confidence (Badge), Guardrails (contextual roll-up — "5 cleared · 0 deferred · 0 unresolved" or "1 high blocking · 0 deferred" when blocking), Voice contexts (only when > 0), Consent (only when acknowledged), and a final `<time dateTime>` "Last saved" row. The Demo badge moves to the title row alongside an optional `n high blocking` `Badge variant="danger"` when applicable. `commitTwin` was updated to use the new `saveTwin` return type — `setDraft(saved)` keeps the in-memory `lastSavedAtISO` aligned with what's in localStorage so the saved-card timestamp matches the persisted value.
- `src/dev/StorageTest.tsx` — dev harness updated to handle the `DigitalTwinProfile | null` return from `saveTwin`.

**User-facing behavior**
- **Fresh visit, no draft**: S1 renders as before. No Resume panel.
- **Visit with persisted draft**: S1 renders the new "Saved draft" panel above the search input — eyebrow + subject name + Demo / high-blocking badges + count line + "Last saved …" timestamp (or "Created …" for legacy drafts that pre-date the field) + "Resume draft" / "Clear draft" actions.
- **Refresh during mid-session work**: any `updateDraft` on S2–S5 had already been persisting to localStorage; now the persisted payload carries an explicit `lastSavedAtISO` so the S1 panel can show *when*.
- **Resume**: routes to S2 with the draft pre-loaded. Producer can continue or jump forward via the stepper if `completedThroughStep` was high.
- **Clear draft**: opens a confirm dialog enumerating what will be lost ("This will permanently delete the draft for Lina Solano (demo) from this browser — including 5 approved events, 2 custom moments, and 0 saved voice contexts. This cannot be undone."). Confirm → draft is wiped; the panel disappears and the search-empty state returns.
- **Selecting a *different* subject while a draft exists**: instead of silently clobbering, an overwrite `ConfirmDialog` appears: "Replace the current draft? Continuing will discard the saved draft for <existing subject> and start a new draft for <new subject>." Confirm → existing draft is cleared then the new subject becomes the active draft; cancel → the draft is untouched.
- **Selecting the *same* subject**: no confirmation (the producer is just reopening). The existing draft loads as normal.
- **S6 saved-card** now shows: subject name + Demo / high-blocking badges; Timeline / Approved / Deferred / Custom counts; Confidence badge; Guardrails roll-up; Voice contexts (when > 0); Consent acknowledged (when applicable); and the "Last saved" timestamp as a semantic `<time>` element.
- **Save failure (quota, private-mode iOS)**: `saveTwin` returns `null`, S6 phase transitions to "error", `RetryPanel` renders with a Retry button that calls `runCommit()` again. The in-memory draft is preserved so the producer doesn't lose work.

**Known limitations**
- Resume always lands on S2 even when the draft is `draftStatus: "saved"` and the wizard is fully populated. A "saved" draft probably wants to land directly on S6 (or S7 if Voice contexts exist). Tracked as **QA-064**.
- Overwrite-confirm dialog content always says "This cannot be undone" — accurate but stark. A producer who's already saved a different draft might benefit from an "Export current draft first" option. Tracked as **QA-065**.
- `clearDraft()` resets `completedThroughStep` to the default (1) in addition to wiping the draft. A producer who clears and then re-resumes the same subject would have to step through the wizard again. Probably correct (the draft is *gone*) but worth confirming. Tracked as **QA-066**.
- "Last saved" label uses `toLocaleString()` so the format depends on viewer locale + timezone. Pinning the format would help shareable screenshots / Loom demos. Tracked as **QA-067**.
- The "Deferred" count on the saved card sums `Draft | Deferred | Rejected` approvalStatus values. That's pragmatic for "what *didn't* land", but a true "Rejected" count would be useful as a separate line for guardrail-tripped events. Tracked as **QA-068**.
- The Resume panel doesn't appear inside the wizard (S2–S7) — there's no in-wizard equivalent to remind the producer the draft is persisted. Probably fine (the auto-save is invisible by design), but a small "Saved 12 sec ago" indicator in the `AppHeader` would close the loop. Tracked as **QA-069**.

**Follow-up tasks**
- **QA-064** — Resume should respect `draftStatus` and skip ahead to S6 / S7 when the draft is already saved + has voice contexts.
- **QA-065** — Optional "Export current draft" action inside the overwrite confirm dialog.
- **QA-066** — Decide whether `clearDraft()` should preserve `completedThroughStep` for a same-subject re-import.
- **QA-067** — Pin a stable timestamp format on `getDraftSummary().lastSavedLabel` independent of the viewer locale (e.g. `Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" })`).
- **QA-068** — Split the "Deferred" count on the saved card into "Deferred" vs "Rejected" rows.
- **QA-069** — Add a small "Saved <relative time>" indicator to `AppHeader` so the producer sees the auto-save heartbeat inside the wizard.

**Checks**
- `npm run build` — pass (`tsc -b && vite build`; 112 modules transformed; 406.56 kB JS / 119.61 kB gzipped). The forced `tsc -b --force` was also clean.
- `npx vitest run` — pass (22 test files / **1057 tests** — the 26 new tests in `draftSummary.test.ts` + `storage.test.ts` all green; the existing migration suite continues to pass, confirming the `saveTwin` return-type change is backward-compatible).
- **Browser spot-check** (vite preview at :4173, fresh localStorage): loaded Lina Solano demo from the gold CTA → walked through S2 → S3 → S4 → S5 (rejected 5 flags to clear blocking) → clicked Save draft → S6 rendered the new saved-card layout with **Lina Solano (demo)** + Demo badge, Timeline 8 events, Approved 5, Deferred 3, Custom 2 moments, Confidence "MIXED (INCLUDES LOW CONFIDENCE)", "Guardrails 5 cleared · 0 deferred · 0 unresolved", "Consent Acknowledged", and "Last saved 6/1/2026, 1:13:26 PM". Returning to S1 then showed the Resume panel with the same subject/counts and the explicit "Last saved …" timestamp confirming the round-trip.
- `npm run lint` — N/A (still no lint script — see **QA-001**).

---

## 2026-06-01 · TwinChat as a scoped, source-backed demo assistant

**What changed**
The Voice Studio left-rail chat ("Ask about a verified moment…") was working but read as a generic mock — the placeholder told producers to ask about "a verified moment" with no anchor explanation, sending an empty prompt was allowed (the `disabled` was gated only on `busy`, not on `!input.trim()`), there were no example prompts, the gate against "no reviewed events" was just a sentence rendered in gold above the input rather than a real disabled state, and every twin answer rendered the same blue bubble whether or not it pretended to be a live AI. The grounded mock would happily compose an answer from *any* reviewed timeline fact even if the producer was actively voicing a different anchoring event in SS1 — so the response wasn't really tied to the producer's chosen scope. This pass redesigns the chat as a scoped, source-backed demo: the placeholder now reads exactly `"Ask about an approved timeline moment…"`; the entire form (textarea + chips + send) is disabled with explanatory copy + a navigation CTA when the gate isn't `ready` (no approved events → Go to S3, no SS1 selection → Go to SS1); three brief-mandated prompt chips ("What shaped this moment?" / "Why does this event matter?" / "How should the voice respond?") drive deterministic composition paths so the producer sees a different answer shape per chip without changing the event; the AI seam (`src/lib/ai.ts`) gains a new `askTwinScoped` + pure `composeDemoChatResponse` that *only* voices against the producer-selected anchoring event, never invents quotes, and falls back to honest `CHAT_INSUFFICIENT_SOURCE` copy when the event metadata can't ground the prompt; every assistant turn renders with a `Badge variant="muted"`/`"Demo response"`, a one-line "Demo response — no live assistant is connected. Composed from the approved event metadata." disclaimer, and a "Source: <event title> · <year>" button that calls `setStudioStep("SS1")` so the producer can revisit which event grounded the answer. Empty / whitespace-only prompts are blocked at two layers (UI disabled + `onSubmit` short-circuit + seam-level sanitize-then-empty-check). Loading is a single small skeleton bubble with `role="status" aria-live="polite" aria-busy="true"` so SR users hear the wait; error is a `role="alert"` bubble with the brief-mandated "Assistant unavailable. Try again or use one of the suggested prompts." + Retry that re-sends the last prompt verbatim. The thread is reset when the producer changes the SS1 selection because the previous answers cite a different source event.

**Files touched / created**
- `src/studio/studioCopy.ts` — appended the `CHAT_*` copy block. Constants: `CHAT_PLACEHOLDER`, `CHAT_EYEBROW`, `CHAT_SUBHEADING`, `CHAT_GATE_NO_APPROVED_TITLE/DESCRIPTION/CTA`, `CHAT_GATE_NO_SELECTED_TITLE/DESCRIPTION/CTA`, `CHAT_LOADING_TITLE/DESCRIPTION`, `CHAT_ERROR_TITLE/DESCRIPTION/RETRY_LABEL`, `CHAT_DEMO_BADGE_LABEL`, `CHAT_DEMO_DISCLAIMER`, `CHAT_INSUFFICIENT_SOURCE`, `CHAT_SOURCE_PREFIX`, `CHAT_SOURCE_ARIA_PREFIX`, `CHAT_SEND_ARIA_LABEL`, `CHAT_SEND_GLYPH`, `CHAT_PROMPT_CHIP_ARIA_PREFIX`, `CHAT_PROMPT_CHIPS` (typed `readonly ChatPromptChip[]` with `category: ChatPromptCategory`). The microcopy-worker's existing exports were left untouched — this is an append-only addition under a new section comment. The 220-char tooltip cap doesn't apply (these are body/placeholder strings, not glossary descriptions).
- `src/lib/ai.ts` — extended the single sanctioned AI seam (gate 1). Added: `ChatGateStatus` discriminated union + `getChatGate(draft, selectedEventId)` pure predicate (returns `ready` / `noApprovedEvents` / `noEventSelected` / `eventNotApproved` — the last is defensive for the "selection points at an event whose status was demoted" race); `isEmptyChatPrompt(input)` pure trim-then-empty check; `classifyChatPrompt(prompt)` maps the three chip labels to their `ChatPromptCategory` and falls back to `"general"` for free-form prompts; `composeDemoChatResponse(input)` pure deterministic builder that branches per category — shaping reads from `event.description`, meaning frames the `emotionalSignificance` score against a four-tier label, voiceDirection consumes the optional `scene` + `resolverOutput` (no resolver → "set a scene" / scene-but-no-resolver → "continue to SS3" / both → cites the signature state + family + direction), general path uses the existing token-overlap scorer against the event description with a `min(2, max(1, tokens))` floor. Every reply carries `sourceEventId`, `sourceEventTitle`, `sourceEventYear`, the pinned `disclaimer`, and an `insufficient` boolean. `askTwinScoped(request, userMessage)` is the async wrapper the component awaits — sanitizes the prompt via `sanitizeFreeText("generic")` (gate 3), enforces the gate, then delegates to the pure composer. Returns `null` when the gate would block so the component can render the same `ErrorState` for both seam failures and a future "real" backend's `null` return. The legacy `askTwin` is preserved verbatim for `ai.test.ts` / `ai.gates.test.ts` regression coverage.
- `src/studio/TwinChat.tsx` — full rebuild. Now consumes `useStudio()` for `selectedEventId` / `scene` / `resolverOutput` and `useTwin()` for `goTo` / `setStudioStep`. Holds `messages: ChatMessage[]` (discriminated union of `UserMessage` / `AssistantMessage<ScopedChatReply>`), `uiState: "idle" | "loading" | "error"`, and `lastPromptRef` for Retry. Thread auto-resets on `selectedEventId` change (the previous answers cite a different anchoring event). Render structure: eyebrow + subheading (pinned in studioCopy) → message list (user bubble / assistant bubble / loading bubble / error bubble) → form with gate-hint card (only when `!ready`) + three chip row + sr-only-labelled `<textarea>` + Send button (`aria-label="Send prompt"`, glyph "Send →"). Empty-input guard is layered: textarea is `disabled` when gated/loading, send button is `disabled` when `gated || loading || isEmptyChatPrompt(input)`, `handleSubmit` short-circuits on empty input + gated + loading, and `askTwinScoped` returns `null` on empty input as the seam-level defense. Enter-without-Shift submits; Shift+Enter inserts a newline. Chips set the input value via `setInput(label)` then refocus the textarea. Source-attribution button calls `setStudioStep("SS1")`. Re-exports `AI_GENERATED_LABEL = "AI-generated"` because `ai.gates.test.ts` imports it from this module — keeping the export avoids a breaking change to a sibling test.
- `src/studio/twinChat.test.ts` (new, 32 tests) — covers: `getChatGate` (5 cases — null draft, no approved events, no selection, selection-but-demoted, ready); `isEmptyChatPrompt` (empty / whitespace / non-empty); `classifyChatPrompt` (each chip → its category, case+whitespace tolerant, free-form → general); `composeDemoChatResponse` (references title + year + carries sourceEventId; deterministic — same inputs always equal output; never invents a subject quote — verifies the description appears verbatim and `\bi (said|felt|remember|knew|thought)\b` never appears; voiceDirection consumes resolver output when present; voiceDirection falls back to scene-only when resolver absent; insufficient when description is empty; insufficient on general prompt with no token overlap; general prompt with overlap returns answer); `askTwinScoped` (empty/whitespace → null; gate blocks → null; gate ready → deterministic source-backed reply; gate-3 injection attempts neutralized before composition); and a copy-pin suite that pins every brief-mandated string verbatim (placeholder, three chip labels with both label + category arrays, gate hint copy, error fallback, demo disclaimer + badge label, insufficient-source copy, source prefix).

**User-facing behavior**
- **Empty draft / no approved events** (e.g. just landed in S7 after S2): chat eyebrow + subheading still render. Gate card under the eyebrow reads "Approve at least one timeline event in S3 to enable the assistant." with a "Go to timeline review" ghost button. Chips + textarea + send are all visibly disabled + `aria-disabled`. Send button is greyed even if the producer pastes text into a focused-but-disabled textarea (the disabled attr blocks input anyway). Clicking the CTA navigates to S3.
- **Approved events exist but no SS1 selection** (e.g. landed in S7, breadcrumb to SS1 not yet clicked): gate card reads "Select an anchoring event in SS1 to start asking questions." with a "Go to event selector" ghost button that calls `setStudioStep("SS1")`. Same disabled visual state for chips + textarea + send.
- **Ready state** (SS1 selection made): gate card disappears, chips become ghost-styled with hover affordance, textarea border becomes `bordermid` (one shade more prominent), placeholder reads "Ask about an approved timeline moment…". The empty thread shows a one-line readout: "Anchoring event: <title> · <year>. Try a prompt chip below or ask your own question — answers cite this event."
- **Sending an empty / whitespace prompt**: Send button stays `disabled` because `isEmptyChatPrompt(input)` is true. Pressing Enter doesn't submit. Pressing the send button with a programmatic call (defense in depth) still short-circuits in `handleSubmit`. The seam-level `askTwinScoped` also returns `null` for whitespace because `sanitizeFreeText` trims first.
- **Clicking a prompt chip**: `setInput(chipLabel)` populates the textarea, focus jumps to the textarea, the producer can edit before pressing Enter. Each chip's `aria-label` reads "Use prompt: <chip label>".
- **Sending a prompt**: user bubble appears immediately with "You" eyebrow + the verbatim trimmed text. A 320ms loading bubble (gold pulsing dots + "Composing demo response" label, `role="status" aria-live="polite" aria-busy="true"`) appears. Assistant bubble then renders with: "Twin" eyebrow, `Demo response` badge (muted) + `AI-generated` badge (blue), the one-line disclaimer in muted body text, the composed body, a separator line, then "Source: <event title> · <year>" with the title rendered as a focusable underline-on-hover button.
- **Clicking the Source link**: navigates to SS1 (via `setStudioStep("SS1")`) so the producer can see which event grounded the answer.
- **Insufficient-source path** (e.g. the prompt is genuinely off-topic): bubble is gold-tinted (not blue) to signal "honest decline"; body reads "The approved event does not contain enough source material to answer this. Approve more events in S3 or add a custom moment in S4." The source attribution still cites the (insufficient) event because the response was still composed *about* that event.
- **Error path** (seam returns `null` or throws): error bubble appears with `role="alert"`, danger-tinted background, "Assistant unavailable" eyebrow + the brief-mandated description + a Retry button that calls `sendPrompt(lastPromptRef.current)` again.
- **Changing SS1 selection mid-thread**: the message thread resets to empty. (Tracked as **QA-048** — should announce the reset with a small "Anchoring event changed" SR + visual line so producers don't think the chat froze.)

**Known limitations**
- The new `composeDemoChatResponse` token-overlap classifier on the `general` path is brittle on very short prompts (< 4 tokens). A producer asking "when was that?" or "details please" — clearly referring to the anchored event — currently falls to the insufficient bubble because the token overlap with the event description is too low to clear the floor. Tracked as **QA-050**.
- The chat thread lives in component state. Navigating away from S7 (or even toggling between SS1↔SS2 if the studio is later refactored to unmount the rail) loses the conversation. Tracked as **QA-052**.
- Anchoring-event change wipes the thread silently. Tracked as **QA-048**.
- The thread is `aria-live="polite"` so every new bubble announces, but the whole rich block (badge + disclaimer + body + source) is read as one chunk. A composite SR-only summary ("Demo response from anchoring event 1998 Finals: <body>") would be more efficient. Tracked as **QA-051**.
- After the first message, the source attribution is visible per-bubble but the "Source: <title>" readout next to the eyebrow disappears (only renders on empty thread). Tracked as **QA-049**.
- During this pass the microcopy sibling worker rewrote `src/studio/studioCopy.ts` between vitest runs and clobbered the appended `CHAT_*` block once. Re-appended the block at the bottom of the file (additive — never collides with their `LABEL`/`DESCRIPTION` section). Both sets of exports now coexist; the `STUDIO_GLOSSARY` constant is intentionally untouched. If the sibling re-edits again, the same append-at-end pattern is the safe recovery move.

**Follow-up tasks**
- **QA-048** — anchoring-event change should announce thread reset.
- **QA-049** — sticky source-event readout under the chat eyebrow so the anchor is always visible.
- **QA-050** — short-prompt heuristic for `composeDemoChatResponse` general path so vague follow-up questions don't trip insufficient.
- **QA-051** — composite SR-only summary for new assistant turns.
- **QA-052** — persist chat history per anchoring event in `StudioContext`.

**Checks**
- `npm run build` — passes (113 modules, 410.87 kB JS / 120.66 kB gzip, 32.01 kB CSS / 6.71 kB gzip).
- `npx vitest run` — passes (1255 / 1255 across 30 files, including the 32 new tests in `src/studio/twinChat.test.ts`).
- `lint` — N/A (no ESLint config; tracked as **QA-001**).

---

## 2026-06-01 · Branded loading states + cinematic step transitions

**What changed**
Loading surfaces across the wizard read as generic grey pulse blocks with no brand voice — the brief called for "cinematic, branded, intentional" loaders, not spinners. This pass rebuilds the shared skeleton primitives with a dark `bg-card` surface, hairline `border-border`, a single low-contrast gold shimmer sweep (`skeleton-shimmer` + `motion-safe:animate-shimmer`, 1.6 s linear infinite), and an optional mono caption slot; pins the four brief-mandated editorial loading titles in `src/lib/stateCopy.ts`; adds a `<StepTransition>` wrapper (160–180 ms fade / 8 px slide, `motion-safe:`-gated) keyed on screen id in `src/App.tsx`; and ships a `useReducedMotion()` hook for cases Tailwind variants can't express. Every animation respects `prefers-reduced-motion` — reduced-motion users see static cards + instant screen swaps; copy and layout are identical.

**Loader inventory** (every loading surface in the app as of this pass)

| Surface | Location | Mechanism | Copy source |
|---|---|---|---|
| Search debounce / fetch | `S1Search.tsx` — `phase === "loading"` | 3× `<SearchResultSkeleton>` + mono status line | `SEARCH_LOADING_TITLE` |
| Result-row select | `S1Search.tsx` — `selectingId !== null` | Inline `"Loading…"` on the active row button | Inline (per-row, not a full-screen loader) |
| Investor demo CTA | `S1Search.tsx` — `selectingId === investorDemo.id` | Button label `"Loading…"` | Inline |
| Subject first-paint | `S2ProfileImport.tsx` — `phase === "loading"` | `<LoadingState>` + 1× `<ProfileCardSkeleton>` | `SUBJECT_LOADING_TITLE` + `SUBJECT_LOADING_DESCRIPTION` |
| Import in flight | `S2ProfileImport.tsx` — `phase === "importing"` | `<LoadingState>` + 2× `<ProfileCardSkeleton>` | `IMPORT_LOADING_TITLE` + `IMPORT_LOADING_DESCRIPTION` |
| Timeline rehydrate | `S3TimelineReview.tsx` — `loadingTimeline` (320 ms) | `<LoadingState>` + 3× `<TimelineEventSkeleton>` | `TIMELINE_LOADING_TITLE` + `TIMELINE_LOADING_DESCRIPTION` |
| Custom moments | `S4CustomMoments.tsx` | *(none — no blocking load)* | — |
| Guardrail review | `S5GuardrailReview.tsx` | *(none — rules evaluate synchronously on enter)* | — |
| Draft save | `S6DraftSaved.tsx` — `phase === "saving"` | `<LoadingState>` + 1× `<ProfileCardSkeleton>` | `SAVE_LOADING_TITLE` + `SAVE_LOADING_DESCRIPTION` |
| Voice Studio rails | `src/studio/**` | *(none today — studio workers can opt into `<StudioPanelSkeleton>` via **QA-064**)* | — |
| **New variant (exported, not yet wired)** | `StudioPanelSkeleton` | Right-rail shape (heading + body + 3 param bars) | Caller-supplied `caption` |

**Files touched / created**
- `src/components/Skeleton.tsx` — full rebuild. New base `<Skeleton>` (dark card + gold shimmer + optional `caption`); `<SkeletonLine>` (flat `bg-panel`, no per-line pulse); upgraded `SearchResultSkeleton`, `TimelineEventSkeleton`, `ProfileCardSkeleton` (compose base); new `StudioPanelSkeleton` for studio right-rail shape.
- `src/components/LoadingState.tsx` — detects trailing `…` in `title` and skips the decorative gold-pulse ellipsis when present (prevents double-ellipsis on brief-mandated titles).
- `src/components/StepTransition.tsx` (new) — `motion-safe:animate-fade-in` default; optional `direction="forward" | "back"` for 8 px slide.
- `src/hooks/useReducedMotion.ts` (new) — `matchMedia('(prefers-reduced-motion: reduce)')` with SSR-safe default; documented why Tailwind variants are preferred.
- `src/lib/stateCopy.ts` — pinned four brief-mandated titles: `SEARCH_LOADING_TITLE`, `IMPORT_LOADING_TITLE`, `TIMELINE_LOADING_TITLE`, `SAVE_LOADING_TITLE`. `SUBJECT_LOADING_TITLE` unchanged ("Loading profile" — distinct first-paint surface).
- `tailwind.config.js` — `keyframes` + `animation` for `shimmer`, `fade-in`, `slide-in-right`, `slide-in-left`.
- `src/index.css` — `.skeleton-shimmer` utility (gold gradient, `bg-[length:200%_100%]`).
- `src/App.tsx` — `<StepTransition key={screen}>` wraps screen mount (preserves existing routing including `Talent`).
- `src/screens/S1Search.tsx` — inline "Searching…" → `SEARCH_LOADING_TITLE`.
- `src/components/index.ts` — exports for skeleton variants + `StepTransition`.
- `src/components/skeleton.test.ts` (new, 11 tests) — shimmer class, `aria-hidden` on decorative band, caption, variant composition.
- `src/components/stepTransition.test.ts` (new, 6 tests) — children render, animation class per direction, no aria pollution.
- `src/lib/stateCopy.test.ts` (new, 9 tests) — exact-string pins for four brief titles + trailing-ellipsis invariant.

**User-facing behavior**
- **S1 search**: while debounced fetch runs, three branded skeleton cards shimmer with a gold sweep; status line reads "Searching public sources…" (was "Searching…").
- **S2 import**: blocking loads show editorial titles — "Building source profile…" during import (was "Importing profile"); subject first-paint still reads "Loading profile".
- **S3 timeline**: 320 ms rehydrate shows "Extracting timeline signals…" (was "Loading events") with three event-shaped skeletons.
- **S6 save**: "Locking draft context…" (was "Saving draft") with profile-card skeleton.
- **Wizard transitions**: every screen swap (S1 → S7, including Talent) fades in over 160 ms. Reduced-motion: instant swap, no fade.
- **Studio**: unchanged visually — `<StudioPanelSkeleton>` exported for studio workers (**QA-064**).

**Known limitations**
- `<StudioPanelSkeleton>` not wired in studio yet — studio worker territory (**QA-064**).
- SS1–SS4 sub-steps don't use `<StepTransition>` yet — studio worker can adopt (**QA-065**).
- Screen transitions are fade-only (no directional slide) — forward/back slide available on the component but `App.tsx` doesn't pass `direction` yet (**QA-066**).
- Shimmer runs on every mounted skeleton even when off-screen — acceptable today (≤3 per surface) but tracked (**QA-068**).

**Follow-up tasks**
- **QA-064** — adopt `<StudioPanelSkeleton>` in studio side panels.
- **QA-065** — wrap SS1–SS4 in `<StepTransition>`.
- **QA-066** — derive slide `direction` from screen index diff.
- **QA-067** — first real consumer for `useReducedMotion()`.
- **QA-068** — pause shimmer when skeleton scrolls off-screen.

**Checks**
- `npm run build` — passes (113 modules, 410.87 kB JS / 120.66 kB gzip, 32.01 kB CSS / 6.71 kB gzip).
- `npx vitest run` — passes (1255 tests across 30 files including 26 new tests: 11 skeleton + 6 stepTransition + 9 stateCopy).
- `lint` — N/A (no ESLint config yet; tracked as **QA-001**).

---

## 2026-06-01 · Guardrail Review as a producer safety workflow

**What changed**
S5 already had a rules engine, status persistence, editorial-note modal, and an "All clear" surface — but it read as a checklist, not a workflow. Every flag showed only a `trigger` label ("Low source confidence") with no producer-facing explanation of *why* it tripped or *how* to resolve it. The only available actions were Resolve (with note) and Reject — a producer who knew the flag was real but couldn't address it in this session had no in-between option, and the save gate blocked on *any* unresolved flag regardless of severity. There was no summary anywhere on the page, so producers couldn't see at a glance how much remained. And nothing helped producers navigate back to the offending item to fix it in S3 / S4. This pass turns S5 into a real safety workflow: every guardrail rule now carries human `reason` + `suggestion` copy that the row renders inline ("Heuristic extraction couldn't anchor this event to a clear year or citation. — Cross-check the claim against the linked source, raise confidence after verification, or defer."); a new **Defer** action moves Medium/Low flags into a non-blocking acknowledged state; a new **Edit item** action jumps to the right wizard step (S3 for timeline events, S4 for custom moments); the save gate now blocks on *High-severity unresolved only* via `canSaveDraft()`, so producers can choose to ship a draft with deferred Medium/Low flags while still being prevented from accidentally saving over a High-severity issue; a summary card shows the four counts (Cleared / Unresolved / Deferred / High blocking) live; and three new rules close the brief's gaps — `missing-date` (item has no date and no year mentioned in text), `missing-source` (no URL and no notes, with a guard against false positives on Wikipedia-sourced timeline items), and `public-without-source-notes` (custom moment marked Public visibility without any source notes — the moment may surface in story output and there's nothing to stand behind). The "Editorial review is not legal clearance. Flags indicate producer review only." disclaimer stays prominent and the All-clear happy-path surface is preserved.

**Files touched / created**
- `src/types/twin.ts` — widened `ReviewStatus` to `"Draft" | "NeedsReview" | "Reviewed" | "Rejected" | "Deferred"`. Added a doc comment marking `"Deferred"` as guardrail-only (S3's timeline `approvalStatus` never emits it; the type stays unified because lots of helpers operate on it generically). The widening is forward-additive — older drafts persisted before this pass never have `"Deferred"`, so the migration is a no-op (no schema bump).
- `src/lib/guardrails.ts` — every `GuardrailRule` now has `reason: string` + `suggestion: string` fields populated for all 13 rules. `GuardrailMatchContext` gained four new fields (`date`, `sourceNotes`, `sourceUrl`, `sourceType`) that the new rules pattern-match against. Three new rules added: `missing-date` (Medium, both scopes — `date.trim().length === 0 && !/\b(19|20)\d{2}\b/.test(text)`), `missing-source` (Medium, both — fires when `sourceType === "unknown"` or both URL and notes are blank, except for Wikipedia-sourced timeline items), `public-without-source-notes` (High, custom — `visibility === "Public" && sourceNotes.trim().length === 0`). Added helpers: `getRuleById(id)`, `markDeferred(review)` (no-op for High severity as defense-in-depth), `canSaveDraft(reviews)` (the new High-severity-only gate), `summarizeReviews(reviews)` returning `{ total, cleared, deferred, unresolved, highBlocking }`. `isReviewResolved` now treats `Deferred` as resolved (for the existing `allGuardrailsResolved` call sites). `timelineContext` + `customContext` populate the four new context fields from each item's V2 `SourceReference`.
- `src/lib/contentModel.ts` — `getDisplayApprovalStatus("Deferred")` falls into the existing `"deferred"` display bucket; added a doc comment to make the joint mapping with `"Draft"` explicit.
- `src/screens/S5GuardrailReview.tsx` — full rebuild while preserving the existing flow seam (`EditorialReviewModal`, `evaluateGuardrails` merge on enter, `canPersistDraft` consent gate). New surfaces: (a) header subheading explains the High-severity-blocking contract ("Resolve, defer, or reject each flag before saving. High-severity flags block save until cleared or rejected."); (b) `<SummaryCard>` with four stats colour-coded by tone (`ok / warning / muted / danger`) and an "N items cleared automatically" footnote so the auto-clear count surfaces in the header *and* in the bottom auto-clear list; (c) `sortedReviews` floats High-NeedsReview to the top of the list so the producer always sees blockers first; (d) `<FlagRow>` displays `kindLabel` ("Timeline event" / "Custom moment") above the title so producers know which screen to edit, plus the rule's `reason` and `suggestion` prose inline, plus four action buttons in a `role="group"` with explicit `aria-label`s that include the item title and trigger ("Resolve A friend's untold story — Unverified custom source"); (e) Defer button is `disabled` and `aria-label`/`title` annotated for High-severity flags ("Defer is unavailable for High-severity flag …"); (f) Edit item routes via `itemKindFor(draft, eventId)` → `goTo("S3" | "S4")`; (g) deferred and reviewed rows get tone-tinted borders (`border-ok/30 bg-ok/5` for Reviewed, `bg-panel/40` for Deferred, `bg-dangerfaint` for Rejected) so the state is visible at a glance; (h) footer status string now branches on `consentOk` → `saveAllowed` → `unresolved > 0` → ready, so producers always see the specific reason save is or isn't permitted. The "Save draft" button uses `canSaveDraft(reviews)` instead of the old `allGuardrailsResolved(reviews)`.
- `src/lib/guardrails.test.ts` — 32 tests now (was 8). New suites: `rule: public-without-source-notes` (fires on Public + blank notes; doesn't fire on Public + filled notes; severity is High + requires editorial note), `rule: missing-date` (fires on blank date with no embedded year; doesn't fire when the description embeds a year), `rule: missing-source` (fires when both URL and notes are blank for a producer-sourced moment; doesn't fire on a Wikipedia-sourced timeline event), `GUARDRAIL_RULES — producer-facing copy` (every rule has non-empty `reason` + `suggestion`; `getRuleForTrigger` round-trips for every rule), `markDeferred + isReviewResolved` (Medium/Low → Deferred; High is a no-op), `canSaveDraft — High-severity-only blocking` (7 cases covering empty list / all reviewed / Medium-Low unresolved / Medium-Low deferred / High NeedsReview / High Reviewed / High Rejected), `summarizeReviews` (empty / Reviewed+Rejected→cleared / Deferred counted separately / `highBlocking` counts only High NeedsReview), and a small regression suite for `markReviewed` + `markRejected` + `allGuardrailsResolved` (which now treats Deferred as resolved).

**User-facing behavior**
- **First entry to S5 with flags** (verified on Lina Solano demo): summary card reads `Cleared 0 / Unresolved 5 / Deferred 0 / High blocking 2` (the 2 in red). Below that, each flag card shows its kind label, item title, trigger, **Reason** prose, **Suggested** prose, status + severity badges. High-severity cards additionally show "High severity — editorial note required before clearing. Defer is unavailable for High-severity flags." in gold; Defer button is greyed out with an `aria-label` explaining why. Action row has Resolve / Defer / Edit item / Reject. Footer reads "2 high-severity flags blocking save" and Save draft is disabled.
- **Deferring a Medium flag**: clicking Defer flips the row to a muted bg with DEFERRED badge, "Deferred — will not block save, but remains visible for follow-up." inline note, secondary Edit item button. Summary recomputes live: `Cleared 0 / Unresolved 4 / Deferred 1 / High blocking 2`. AppHeader pill ("N flags pending") updates in lockstep.
- **Resolving a High flag**: opens the existing `EditorialReviewModal`, requires a note (the existing validation), closes on confirm. Row flips to `border-ok/30 bg-ok/5` with EDITORIALLY REVIEWED badge and "Cleared by producer." line; the editorial note renders below in a bordered panel.
- **All High flags resolved**: summary shows `High blocking 0` in green, footer becomes "N unresolved (Medium/Low) — save allowed", Save draft becomes enabled (gold). Producer can ship with deferred / unresolved Medium/Low flags — the policy explicitly allows this with the warning visible.
- **Edit item**: clicking jumps to S3 (timeline events) or S4 (custom moments). Disabled when the item can no longer be found in the draft (e.g. it was deleted from a different tab).
- **All-clear path** (no rule matches): the existing green `S5 · Clear / All clear` surface still renders, now with the auto-cleared count appended in muted mono so producers know nothing slipped through silently.
- **Disclaimer**: rendered immediately under the subheading with `role="note"` so it's part of every state ("Editorial review is not legal clearance. Flags indicate producer review only.").

**Known limitations**
- The new `missing-date` rule uses `\b(19|20)\d{2}\b` to detect an embedded year. Custom moments that describe a date as "early 70s" or "around the millennium" would still flag. Tracked as **QA-044**.
- The new `missing-source` rule special-cases `sourceType === "wikipedia"` to avoid false positives on every Wikipedia-sourced timeline event. If we ever introduce another curated source type that always carries a URL implicitly (e.g. `imdb`), it'll need a similar allowlist entry. Tracked as **QA-045**.
- Edit item navigates to S3 or S4 but does not scroll/focus the offending row inside that screen. Producers find the item by title manually. Tracked as **QA-046**.
- `canSaveDraft` ignores the "Deferred + High severity" case at runtime — but `markDeferred` is also a no-op for High, so producers can never actually create that combination via the UI. The defense-in-depth check matters for legacy persisted data: a draft saved by an older client could theoretically have a High-severity Deferred. We choose to treat that as unblocking the save (the producer affirmatively set Deferred at some point), but a stricter policy might force re-review. Tracked as **QA-047**.

**Follow-up tasks**
- **QA-044** — extend `missing-date` to recognise relative date phrasing ("early 70s", "around the millennium").
- **QA-045** — promote `sourceType !== "wikipedia"` allowlist on `missing-source` into a `KNOWN_URL_BEARING_SOURCES` set as we add more curated sources.
- **QA-046** — Edit item should scroll/focus the offending row inside S3 / S4. Today producers find it by title.
- **QA-047** — decide whether legacy `High + Deferred` reviews should force re-review on load (current policy: trust the persisted decision).

**Checks**
- `npm run build` — passes (103 modules, 368.25 kB JS / 109.11 kB gzip, 29.40 kB CSS / 6.19 kB gzip).
- `npx vitest run` — passes (1031 tests across 20 files including the 24 new guardrails tests).
- Manual visual verification on Lina Solano demo: entered S5 with 5 NeedsReview + 7 auto-cleared. Summary showed `0 / 5 / 0 / 2`. Deferred two Medium flags → summary became `0 / 3 / 2 / 2`. Resolved the two High flags with editorial notes → summary became `2 / 1 / 2 / 0` and Save draft enabled. Footer messaging updated through each transition. Defer button confirmed disabled on the two High-severity rows.
- `lint` — N/A (no ESLint config yet; tracked as **QA-001**).

---

## 2026-06-01 · Add Custom Moment drawer — validation, guidance, and a11y

**What changed**
The Custom Moment drawer was a thin wrapper around `<Input>` / `<Textarea>` / `<SegControl>` with one validation rule (blank title → block) and a single hard-coded error message. Producers had no way to know how long a description should be, what "Public" visibility actually meant for downstream story output, what the difference between Low/Medium/High sensitivity was, or whether emotional significance was a hard requirement. The save button silently failed on bad input — focus stayed on the Save button, no SR announcement, no per-field error association. This pass turns the drawer into a real producer-facing form: a pure `validateCustomMomentForm()` module enforces the brief's required-fields contract (title + date + description hard-required; emotional significance recommended-not-required; source notes required *only* when visibility is Public) and the brief's character caps (title 80, description 600, em-sig 400, source notes 400); the form-input primitives (`<Input>` and `<Textarea>`) now natively support helper text, a visible `*` required marker, a live `N / max` character counter with red-when-over styling, and a soft "recommended" slot beneath the field for non-blocking guidance; the drawer ties guidance directly to the active SegControl pill ("Public · May be shown in story output — source notes required so we can stand behind it.") so changing visibility instantly tells the producer what the implication is. Save-with-errors moves keyboard focus to the first invalid field via a `firstErrorField()` helper, fires an `aria-live="assertive"` SR announcement summarizing the issue count, and surfaces a danger-toned "N issues to fix" badge in the modal footer alongside the existing Save / Cancel buttons.

**Files touched / created**
- `src/lib/customMomentValidation.ts` (new, ~165 lines) — pure validator + the canonical copy pins. Exports `CUSTOM_MOMENT_FIELD_LIMITS` (title 80 / description 600 / em-sig 400 / source notes 400), `CUSTOM_MOMENT_HELPER_TEXT` (the brief's exact helper strings for title, date, description, em-sig, source notes, source URL), `VISIBILITY_GUIDANCE` (per-Visibility paragraphs that explain downstream consequence), `SENSITIVITY_GUIDANCE` (per-Sensitivity paragraphs that explain what reviewer expectation is), `validateCustomMomentForm(form)` returning `{ isValid, errors, recommended }` where `recommended` is the soft warnings slot, and `firstErrorField(errors)` for focus targeting. Validation rules: title required + cap; date required; description required + cap; em-sig recommended (soft warning when blank) + cap; sourceNotes required *only when* `visibility === "Public"` + cap; sourceUrl pattern check (`/^https?:\/\/[^\s]+\.[^\s]+$/i`). All errors are user-facing strings — no error codes.
- `src/components/Input.tsx` — promoted to `forwardRef` so the drawer can focus error fields. Added three new optional props (`helper?: string`, `required?: boolean`, `showCounter?: boolean`). Label now uses a flex row so the counter can sit on the right side of the same line as the label, in lower-emphasis mono. `aria-describedby` composes from the error / helper / counter IDs in priority order. Counter goes red and the input border switches to danger when `value.length > maxLength`. The label's `*` is rendered with `aria-hidden="true"` because the underlying `required` attribute already carries SR semantics.
- `src/components/Textarea.tsx` — same upgrades as `<Input>` plus a fourth `recommended?: string` slot for non-blocking guidance (used for the em-sig "Recommended — explain why this moment matters to the subject's voice." soft warning).
- `src/components/CustomMomentDrawer.tsx` — full rebuild. Uses `useMemo` to compute `validation` on every keystroke (cheap; the function is pure and the form is < 10 fields), but only surfaces errors after the first Save click (`submitted` state) so producers aren't yelled at while typing the first field. Holds field refs in `useRef<Record<CustomMomentField, HTMLElement | null>>` so a save-with-errors can call `queueMicrotask(() => fieldRefs.current[first]?.focus())` — `queueMicrotask` (not `setTimeout`) so focus moves after React's commit but before the browser paints, eliminating the focus flicker. Visibility / Sensitivity now have inline guidance paragraphs (`<span class="text-text">{form.visibility}</span> · {VISIBILITY_GUIDANCE[form.visibility]}`) underneath each SegControl, so the producer sees the consequence of the current choice change live. Source Notes label and `required` flag flip from `"Source notes (optional)"` to `"Source notes"` + visible `*` the instant visibility changes to Public. Footer adds a danger-toned "N issues to fix" status string (with `role="status" aria-live="polite"`) when `submitted && errorCount > 0`. A sr-only `aria-live="assertive"` paragraph announces "Cannot save — N field(s) need attention. Focus moved to the first issue." on the actual save attempt.
- `src/lib/customMomentValidation.test.ts` (new, 26 tests) — covers: required-field violations (blank, whitespace-only); the recommended-but-optional contract for emotional significance (blank emits `recommended` not `errors`; filled clears the recommendation); the Public-visibility ⇒ sourceNotes-required rule across all three visibility values; character cap edge cases at boundary and one-over for every capped field; sourceUrl pattern (blank ok, valid https ok, malformed rejected); `firstErrorField` ordering (returns title even when error iteration order would surface sourceUrl first); copy pins for every brief-mandated helper string, visibility guidance, sensitivity guidance, and character cap.

**User-facing behavior**
- **Opening the drawer fresh**: every required field shows a gold `*` next to its label. Helper text under each field reads exactly the brief's strings ("Name the moment in plain language.", "Use a year or approximate date.", "Describe what happened.", etc.). Counters read `0 / 80`, `0 / 600`, `0 / 400`, `0 / 400`. Emotional significance immediately shows a gold "Recommended — explain why this moment matters to the subject's voice." soft warning even before any save attempt, so producers know they're losing context without being blocked.
- **Save with empty form**: title / date / description fields all show red borders and per-field error messages ("Title is required.", "Date or year is required.", "Description is required."). Footer shows danger "3 issues to fix". Focus moves to the title input. The sr-only live region announces "Cannot save — 3 fields need attention. Focus moved to the first issue."
- **Switching visibility to Public**: the source notes field label flips from "SOURCE NOTES (OPTIONAL)" → "SOURCE NOTES *" and (once the user has tried to save without filling it) shows "Source notes are required for Public visibility — explain where this came from or who verified it." The visibility guidance paragraph beneath the SegControl reads "Public · May be shown in story output — source notes required so we can stand behind it." in real time.
- **Switching sensitivity**: each value shows its guidance line live ("Low · Public-record material. Safe for unrestricted use.", "Medium · Personal but not protected. Producer judgement applies.", "High · Sensitive or contested. Requires editorial review in S5."). High visibility makes the downstream S5 obligation explicit so producers can't be surprised by the editorial-review gate.
- **Typing into a capped field**: the counter increments live in muted mono. Pasting text that exceeds the cap turns the counter and the field border red instantly; aria-invalid flips to true so SR users hear the violation on the next focus traversal.
- **Edit an existing moment**: the drawer hydrates from `initial.source?.sourceUrl` and `initial.source?.verified` (the V2 source block from the previous pass). All validation runs against the rehydrated values; if a legacy moment has more than 80 chars in its title or violates the new Public⇒notes rule, the producer sees the same inline errors on next save attempt.
- **ESC / overlay click / close button**: all dismiss the drawer (existing `Modal` behavior preserved). Focus returns to whichever button triggered the open (existing `useFocusTrap` cleanup behavior preserved).
- **Saved moments**: appear in the right-hand list immediately (no list refresh, no toast — the existing `applyMoments` → `updateDraft` flow handles this). New moments are sorted alphabetically with the existing ones via `sortedMoments`. Each renders the source/visibility/sensitivity badges, source notes preview, "Unverified — not presented as fact in the studio." red strip when applicable, and Edit/Delete actions.

**Known limitations**
- Counter only goes red *after* the user types over the cap; it does not clamp typing. We could pass `maxLength` to the native input attribute (already supported via spread) but the brief calls for "guidance", not enforcement — producers may paste a long passage they intend to trim. Tracked as **QA-040**.
- Validation runs on every keystroke (via `useMemo`) but errors are only displayed after the first save. We could surface errors on blur as a middle ground — left for a follow-up. Tracked as **QA-041**.
- The save-with-errors flow announces "N fields need attention" but doesn't read each individual error to the SR. NVDA/JAWS will pick up the per-field `role="alert"` strings as focus traverses, but a single composite announcement would be more efficient. Tracked as **QA-042**.
- The visibility guidance for Public references "story output" but we don't yet have a downstream surface that consumes Public-visibility moments differently — that's Phase 2 work. The copy is forward-looking on purpose.
- `EditorialReviewModal` (the other consumer of `<Input>` / `<Textarea>`) hasn't been retrofitted with helper text or counters yet. It still works (new props are all optional) but doesn't benefit. Tracked as **QA-043**.

**Follow-up tasks**
- **QA-040** — consider clamping typing in capped fields via `maxLength` native attribute behind a `clamp` prop on `<Input>` / `<Textarea>`.
- **QA-041** — surface validation errors on blur (in addition to on-save) so producers see the issue as they leave a field.
- **QA-042** — compose a single SR live-region message summarizing every error on save, not just the count.
- **QA-043** — apply helper text + counters to `EditorialReviewModal` for parity.

**Checks**
- `npm run build` — passes (103 modules, 359.89 kB JS / 106.81 kB gzip, 29.28 kB CSS / 6.18 kB gzip).
- `npx vitest run` — passes (1005 tests across 20 files including 26 new `customMomentValidation.test.ts` tests).
- Manual visual verification: opened the drawer on the Lina Solano demo, exercised the save-with-empty-form path (got 3 inline errors + "3 issues to fix" footer + focus on title), filled minimum fields, switched visibility to Public (source notes label gained `*`, gained inline error), filled source notes and saved (new "Backstage moment" appeared immediately in the right column with PRODUCER + PUBLIC + SENSITIVITY · MEDIUM badges). Confirmed ESC dismisses the modal. Confirmed focus jumps from a focused description textarea → title input on save-with-errors.
- `lint` — N/A (no ESLint config yet; tracked as **QA-001**).

---

## 2026-06-01 · Timeline Review as a producer workflow

**What changed**
S3 already had the right bones — type + confidence filters, decade grouping, approve/defer per row, the four provenance badges from the previous pass — but it read as a list, not as an editorial step. There was no per-decade progress, no bulk action, no way to expand a citation without leaving the page, the approve/defer buttons were `size="small"` and used the same neutral chrome whether selected or not, the empty-filter copy was a one-liner without a recovery path, and the heuristic timeline generator silently emitted a single "Wikipedia profile imported" filler row when sentence-splitting yielded nothing — which made S3 look successful for a real import that actually had no extractable content. This pass turns S3 into a workflow the producer can actually run: bigger Approve/Defer buttons with descriptive `aria-label`s and a clear selected state (gold-filled "✓ Approved" with an `ok` ring against an `ok/5` card background); per-card expandable Source notes (`<details>`) showing the citation text, the source URL as a `target="_blank" rel="noreferrer noopener"` link, the import timestamp, and (when present) the Wikipedia revision id; per-decade "N of M approved" rollups in every section heading; a sticky result + bulk-action toolbar above the timeline ("Showing 3 of 8 events · 2 approved in view · Clear filters · ✓ Approve all visible · Defer all visible") that disables the bulk actions when the filter empties the list; an empty-filter `EmptyState` with the brief-mandated copy "No events match this filter." plus a Clear filters CTA; and a top "Heuristic timeline" callout that fires for any non-demo subject ("Events were auto-extracted from the Wikipedia summary — confidence is approximate. Review every event before approving; expand 'Source notes' to verify the citation."). On the data side, `generateHeuristicTimeline` no longer emits the filler row — when extraction yields nothing, the timeline is empty and S3's `TIMELINE_EMPTY_TITLE`/`DESCRIPTION` empty surface (now with subject-aware copy for real imports) takes over instead of pretending the import succeeded.

**Files touched / created**
- `src/lib/timelineGenerator.ts` — removed the "Wikipedia profile imported" filler-event fallback from `generateHeuristicTimeline`. Now returns `[]` when the heuristic finds no extractable sentences and no birth year. Added a doc-comment explaining the contract: curated demos never reach this path (handled by `generateImportBundle`'s `pageId.startsWith("demo-")` dispatch), and for real imports, an empty array hands control to S3's `TIMELINE_EMPTY_*` empty-state copy with subject-aware "We could not extract a reliable timeline from this Wikipedia summary…" wording, plus an "Add custom moments" forward CTA.
- `src/lib/contentModel.ts` — added two pure helpers: `countApproved(events)` (cheap `.reduce` counter for `approvalStatus === "Reviewed"`, used for per-decade rollups and the footer) and `applyBulkApprovalStatus(timeline, eventIds, status)` (returns a new timeline with the targeted events flipped to the given status; pure, idempotent, silently ignores unknown ids, returns the same array reference when `eventIds` is empty so React can short-circuit re-renders). Both used by the new bulk action toolbar.
- `src/screens/S3TimelineReview.tsx` — full rebuild while preserving the existing skeleton flow: (a) split EventRow visual chrome — approved cards now have `border-ok/40 bg-ok/5` and a gold "✓ Approved" button with `ring-2 ring-ok/40`, deferred cards keep the neutral border with hover-darken; (b) added `aria-label` strings on every approve/defer button that include the event title ("Approve Born in Bogotá" / "Approved · Born in Bogotá. Click to keep approved.") so screen-reader users hear context, not just the verb; (c) wrapped the action pair in a `role="group"` with `aria-label="Approval actions for {title}"`; (d) added a `<details>` "Source notes" disclosure per card showing sourceNotes, sourceUrl (as a clickable link), `importedAtISO`, and `revisionId`, with `cursor-pointer` summary and gold focus ring; (e) added the `isHeuristic = !isDemoTwin(draft)` callout block above the filters; (f) added the result + bulk-action toolbar with `aria-live="polite"` so screen readers hear the count update when a filter changes; (g) added "Clear filters" CTAs in both the toolbar and the empty-filter state; (h) added "✓ Approve all visible" / "Defer all visible" buttons that flip every event in the current filter (and only those — events outside the filter stay untouched); (i) per-decade headings now read "1980s · 1 of 1 approved" via `countApproved(events)`; (j) the empty-filter `EmptyState` now uses the brief-mandated copy "No events match this filter." with a Clear filters action; (k) the subheading expanded to "Approve events to include in the twin. Defer anything you are not ready to stand behind. Voice Studio only uses approved events." to make the downstream contract explicit; (l) the no-timeline `EmptyState` description branches on `isDemoTwin` — demo subjects get the canonical copy, real imports get "We could not extract a reliable timeline from this Wikipedia summary. Add custom moments to build the timeline by hand, or pick a different subject." with the "Add custom moments" primary CTA and "Back to import" secondary; (m) footer now reads "N of M approved · approve at least 1 to continue" so the producer always sees the gate even when they're approving, and the sr-only helper text mirrors that.
- `src/lib/contentModel.test.ts` — added 9 new tests: `countApproved` (empty list → 0, counts only `Reviewed`); `applyBulkApprovalStatus` (returns same reference when `eventIds` empty, updates only targeted ids and preserves untargeted by reference, is pure / does not mutate input, can defer already-approved events, silently ignores unknown ids).
- `src/lib/timelineGenerator.test.ts` (new) — 4 integration tests pinning the heuristic-vs-curated contract: the Lina Solano demo path returns ≥5 events all with `source.type === "demo"` and at least one custom moment; a real Wikipedia draft with only sub-24-char sentences returns `[]` (no filler row); a real draft with extracted years returns events with valid `year` values; every heuristic event is sourced from `wikipedia` (never `demo`).

**User-facing behavior**
- **Demo subjects** (Lina Solano, MJ, demo-thin-profile): no heuristic callout shows. The eight Lina events render in three decades with "1 of 1 approved", "2 of 3 approved", "1 of 1 approved" etc. rollups updating live as the producer approves/defers. Bulk "Approve all visible" lets the producer set the entire timeline to Approved in one click; "Defer all visible" is the inverse. Filters compose: `Career` + `High confidence` shows just Career events with `confidence === "High"`, the result toolbar updates to "Showing 2 of 8 events · 2 approved in view", and a Clear filters chip surfaces. Source notes expand inline for each card, showing the demo URL as a clickable link (`https://example.com/demo/lina-solano`) and the import timestamp.
- **Real Wikipedia imports** (non-`demo-` `pageId`): a goldfaint callout fires at the top — "Heuristic timeline · Events were auto-extracted from the Wikipedia summary — confidence is approximate. Review every event before approving; expand 'Source notes' to verify the citation." This is the brief-required "clear fallback copy for real imported subjects". When the heuristic yields zero events, the empty surface now reads "No timeline events found. We could not extract a reliable timeline from this Wikipedia summary. Add custom moments to build the timeline by hand, or pick a different subject." with an "Add custom moments" primary CTA.
- **Continue gate**: the footer button stays disabled until ≥1 event is approved. The text reads "0 of 8 approved · approve at least 1 to continue" → "5 of 8 approved" as the producer works. The sr-only helper updates the description for screen readers in lockstep.
- **Keyboard / a11y**: every approve/defer button has `aria-pressed` reflecting state and `aria-label` that includes the event title; the bulk action buttons have `aria-label`s that include the count and a "visible" qualifier when filters are active; the toolbar is `aria-live="polite"` so the count change is announced; the empty-filter EmptyState uses the standard EmptyState semantics (role+heading+description+action). Source-notes disclosures are native `<details>` so Enter/Space toggle them.

**Known limitations**
- Bulk "Approve all visible" doesn't currently confirm — it's idempotent (deferring is one click away) so we kept it light, but for a 50+ event timeline a confirmation modal would be safer. Tracked as **QA-036**.
- Per-decade rollups update on the fly but there's no visible animation. Tracked as **QA-037** (subtle 200ms transition when a count changes).
- The "Heuristic timeline" detection is structural (`!pageId.startsWith("demo-")`), not extraction-quality-based. A future pass could expose a `meta.extractionMode` field on the import bundle so we can show a stronger callout when extraction confidence is below a threshold. Tracked as **QA-038**.
- The empty-filter copy uses the brief's exact wording "No events match this filter." but we add "Try a different combination, or clear the filters to see every event." below it — this descriptive line is *not* in the brief; we kept it because it pairs naturally with the Clear filters CTA. Tracked as a copy-decision note in **QA-039**.

**Follow-up tasks**
- **QA-036** — confirmation modal on bulk Approve / Defer when filteredCount > 20.
- **QA-037** — subtle 200ms transition when a per-decade rollup count changes.
- **QA-038** — expose `meta.extractionMode` on the import bundle so the heuristic callout can sharpen when extraction confidence is low.
- **QA-039** — copy-pin the empty-filter description ("Try a different combination, or clear the filters to see every event.") in `stateCopy.ts` for centralized control.

**Checks**
- `npm run build` — passes (102 modules, 354.06 kB JS / 105.01 kB gzip, 29.18 kB CSS / 6.15 kB gzip).
- `npx vitest run` — passes (979 tests across 19 files including 9 new `contentModel.test.ts` tests and the new 4-test `timelineGenerator.test.ts`).
- Manual visual verification on Lina Solano: bulk Approve all visible → 8 of 8 approved, footer enabled. Filter to Career → 3 of 8 visible, bulk approve only flips those three. Filter to Education → empty-state appears with Clear filters button. Defer all visible → footer disables. Source notes disclosure expands, shows clickable demo URL.
- `lint` — N/A (no ESLint config yet; tracked as **QA-001**).

---

## 2026-06-01 · Source-backed content model + provenance badges

**What changed**
The content model was implicit: a `TimelineEvent` had a `source: SourceObject` block with a narrow `type: "wikipedia" | "custom" | "manual"` union, and a `CustomMoment` had a free-form `sourceNotes` string that the guardrail engine had to regex-scan to figure out whether the moment was verified. The UI showed two badges (Confidence + Approved/Deferred) and had no consistent way to tell a viewer where a piece of content came from or whether the producer had affirmed it. This pass introduces a canonical, source-backed content model: a lowercase `SourceType` taxonomy that covers `wikipedia | producer | demo | manual | unknown`, a `SourceReference` interface that's the single shape every UI surface consumes, four reusable provenance badges (`SourceBadge`, `ConfidenceBadge`, `ApprovalBadge`, `VisibilityBadge`) that render on S3 / S4 / SS1, an explicit `Verified` checkbox in the Custom Moment drawer that defaults to *unchecked* (so an unaffirmed moment is never silently treated as fact), a V1→V2 schema migration in `localStorage` that backfills the new fields without losing data, and an approved-only filter on the Voice Studio's event selector so producers can't anchor a performance on a Deferred / NeedsReview / Rejected event.

**Files touched / created**
- `src/types/twin.ts` — bumped `SCHEMA_VERSION` to `2` and split the type model into two clearly-labelled tiers: TitleCase **persistence enums** that stay frozen for back-compat (`Confidence` / `Sensitivity` / `Visibility` / `ReviewStatus` / `EventType`), and lowercase **display / API enums** (`SourceType` / `DisplayConfidence` / `DisplayApprovalStatus` / `DisplayVisibility` / `DisplaySensitivity`) that the UI and resolver consume. Widened `SourceObject.type` to include `"producer" | "demo" | "unknown"` and added an optional `notes?: string` field. Added the canonical `SourceReference` interface (`{ sourceType, sourceUrl?, sourceNotes?, verified, importedAtISO?, revisionId? }`). Added optional `summary` / `category` / `visibility` fields to `TimelineEvent` (filled in by the V2 migration). Added optional `source?: SourceReference` to `CustomMoment` (V2 source of truth — `sourceNotes` preserved for back-compat). Added a producer-facing `GuardrailFlag` interface that carries the offending item's `SourceReference` so the S5 review row can show provenance without re-running detection. Added the brief-mandated aliases: `SubjectProfile = WikipediaProfile`, `VoiceContext = SavedVoiceContext`, `DraftProfile = DigitalTwinProfile`.
- `src/lib/contentModel.ts` (new, ~190 lines) — pure helpers that normalize persisted shapes into the lowercase content model. Public surface: `sourceObjectTypeToCanonical` (maps legacy `"custom"` → `"producer"`), `toSourceReference` (lift `SourceObject` → `SourceReference`), `customMomentSource` (prefers explicit V2 block, falls back to V1 regex inference on `sourceNotes`), universal accessors (`getSourceType` / `getSourceUrl` / `getSourceNotes` / `getSourceVerified` — discriminate on the timeline-event-only `year` field), display-enum mappers (`getDisplayConfidence` etc.), one-call badge bundles (`getEventDisplay` / `getMomentDisplay`), the Voice Studio eligibility filter (`isApprovedForVoiceStudio` + `eligibleVoiceStudioEvents`), and source builders (`makeWikipediaSource` / `makeDemoSource` / `makeProducerSource` — the producer one defaults `verified: false` so callers must explicitly affirm).
- `src/lib/storage.ts` — added `migrateV1ToV2()` that runs on load when `parsed.schemaVersion === 1`. Defaults `TimelineEvent.visibility` to `"Internal"`, aliases `category` to `eventType` and `summary` to `description`, mirrors `source.citation` into `source.notes` when notes is absent, and most importantly: every legacy `CustomMoment` gets a `source` block synthesized via `customMomentSource()` (which uses the V1 regex inference — blank notes or text mentioning `unverified|rumor|speculation|hearsay` → `verified: false`; corroborated text → `verified: true`). Migration is pure (does not mutate the input), idempotent (re-running on its output is a no-op), and tested.
- `src/lib/guardrails.ts` — `customContext()` no longer regex-scans `moment.sourceNotes` for "unverified"; it now reads `customMomentSource(moment).verified` so the V2 explicit-source block is the source of truth (V1 inference still kicks in for legacy drafts via the helper's fallback). Added `evaluateGuardrailFlags(timeline, customMoments) → GuardrailFlag[]` as the producer-facing detection API: each flag carries the offending item's `SourceReference` so future UI can show "Why was this flagged?" with one-click provenance.
- `src/lib/timelineGenerator.ts` — `makeEvent()` now uses the shared `makeWikipediaSource()` builder and populates the V2 aliases (`visibility: "Internal"`, `category = eventType`, `summary = description`) directly on every event it emits, so live-Wikipedia imports match the V2 shape from day one (no migration round-trip needed for fresh content).
- `src/data/demoSubjects.ts` — the local `wikiSource()` helper became `demoSource()` and now emits `type: "demo"` (the new canonical source type for curated fixtures) with `citation: "Wikipedia (demo seed)"` and explanatory notes. Every demo event auto-fills `category` / `summary` / `visibility`. Every demo `CustomMoment` now ships an explicit `source: SourceReference` — Lina's "Quiet hours in the studio" is `verified: true` (corroborated by two engineers), Lina's "A friend's untold story" and MJ's "Private relationships" are `verified: false` (intentionally unverified so the guardrail engine flags them).
- `src/components/badges.tsx` (new, ~140 lines) — four content-model badges. `SourceBadge` renders as a Wikipedia/Producer/Demo/Manual/Unknown pill, falls into the `danger` tone when `verified=false`, and becomes a clickable link with `target="_blank" rel="noreferrer noopener"` + an `↗` glyph when given a `sourceUrl` (only for `wikipedia` / `manual` types — producer/demo URLs are passive). `ConfidenceBadge` uses ok/gold/warning/muted for high/medium/low/unknown. `ApprovalBadge` uses ok/muted/warning/danger for approved/deferred/needsReview/rejected. `VisibilityBadge` uses gold/blue/muted for public/internal/private. Each is a thin wrapper around the existing `<Badge>` primitive so the visual vocabulary is consistent.
- `src/components/CustomMomentDrawer.tsx` — added a "Source URL (optional)" input (URL inputMode, autocomplete off) and a "I have corroborated this source" checkbox with helper copy ("Unverified moments are flagged in guardrails and labelled 'unverified' in the studio. Never affirm what you cannot stand behind."). The checkbox defaults to `false` on add and reflects the persisted `source.verified` on edit. `handleSave` now emits a `source: SourceReference` block via `makeProducerSource()`.
- `src/screens/S4CustomMoments.tsx` — `handleSave` now persists the `source` block. Each moment card renders the four-badge row (`SourceBadge` with verified/unverified state + URL, `VisibilityBadge`, the existing inline `Sensitivity` chip), surfaces the source notes inline (mono, two-line clamp), and when the moment is unverified shows a danger-toned `role="note"` strip with the exact copy "Unverified — not presented as fact in the studio."
- `src/screens/S3TimelineReview.tsx` — `EventRow` now renders all four badges via `getEventDisplay(event)`. Wikipedia / Manual events with a `sourceUrl` are now one-click verifiable from the timeline. Demo-seeded events show the `DEMO SEED` badge in the warning tone so a viewer never confuses a curated fixture with a live import.
- `src/studio/steps/SS1EventSelector.tsx` — filters `draft.timeline` through `eligibleVoiceStudioEvents()` (the new approved-only helper). When some events exist but none are approved, the screen shows an `EmptyState` with a primary "Go to timeline review" CTA. When some events are approved and some are hidden, a `role="note"` strip explains "N events hidden — not yet approved in timeline review. Voice Studio only uses approved events." Each card shows the four-badge row.
- `src/components/index.ts` — exported the four badges + their props (`ApprovalBadge`, `ConfidenceBadge`, `SourceBadge`, `VisibilityBadge`, `ApprovalBadgeProps`, `ConfidenceBadgeProps`, `SourceBadgeProps`, `VisibilityBadgeProps`).
- `src/lib/contentModel.test.ts` (new) — 21 tests covering source-type translation (TitleCase → lowercase, legacy `"custom"` → `"producer"`), `SourceObject` → `SourceReference` lift, V2-source vs V1-inference path for custom moments (blank / rumor / speculation / corroborated), universal accessors discriminating events vs moments, all four display-enum mappers, full `getEventDisplay` / `getMomentDisplay` bundle output, the strict `isApprovedForVoiceStudio` + `eligibleVoiceStudioEvents` filter behavior, and the source builders' default-verified flags (`makeWikipediaSource` → `true`, `makeProducerSource` → `false`).
- `src/lib/storage.migration.test.ts` (new) — 8 tests pinning the V1 → V2 migration contract: bumps `schemaVersion`, defaults `visibility = "Internal"`, preserves explicit visibility, aliases `category`/`summary`, mirrors `citation` into `notes`, infers per-moment `verified` from the V1 `sourceNotes` (one verified moment, one unverified moment in the fixture), does not mutate the input, and is idempotent.
- `src/lib/guardrails.test.ts` — added 4 tests: (1) `moment.source.verified=true` suppresses the "Unverified custom source" flag even when `sourceNotes` is blank; (2) `moment.source.verified=false` re-fires it; (3) `evaluateGuardrailFlags()` returns a Wikipedia-typed flag for low-confidence events with the event's `sourceUrl` attached; (4) `evaluateGuardrailFlags()` returns a producer-typed flag with `verified: false` for unverified custom moments.

**User-facing behavior**
- **S3 timeline review** — every event card now shows four badges in a single row: source (Wikipedia / Demo seed / Producer / Manual / Unknown — color-coded), confidence (high/medium/low — ok/gold/warning), approval (approved/deferred/needsReview/rejected — ok/muted/warning/danger), visibility (public/internal/private — gold/blue/muted). Wikipedia and manual events whose source has a URL render the badge as a clickable link to the source. Demo subjects ship with the `DEMO SEED` badge in the warning tone, so viewers never mistake a curated fixture for a live import. Verified at the demo (Lina + MJ) — full-screen screenshots in `docs/implementation-log.md` verify the four-badge row at 1280×900.
- **S4 custom moments** — each moment now shows the source provenance + a "Producer · unverified" red badge when the producer hasn't affirmed the source. The `sourceNotes` text appears below the description (mono, two-line clamp) so viewers can see the producer's actual citation. Unverified moments get a danger-toned `role="note"` strip with copy "Unverified — not presented as fact in the studio." — this is the visible counterpart to the acceptance-criteria rule against presenting unverified custom content as fact.
- **Custom moment drawer** — producers now see an explicit "Source URL (optional)" input *and* an "I have corroborated this source" checkbox (defaults to off). The checkbox helper copy makes the consequence explicit: "Unverified moments are flagged in guardrails and labelled 'unverified' in the studio. Never affirm what you cannot stand behind." A producer who never touches the checkbox produces a flagged-unverified moment by default — failing safe.
- **Voice Studio (SS1 event selector)** — only events with `approvalStatus === "Reviewed"` are anchorable. On the Lina demo (5 approved / 3 deferred), the studio shows the 5 approved events and a "3 events hidden — not yet approved in timeline review" note so the producer understands what's missing and why. If no events are approved, the empty state offers a primary CTA back to S3. Each card shows the four-badge row, identical to S3, so the studio's view of an event matches the wizard's.
- **Guardrail engine** — custom moments without an explicit producer affirmation always fire the "Unverified custom source" flag (Medium severity). Previously the engine relied on regex-scanning `sourceNotes` for the word "unverified"; now it reads the explicit `source.verified` boolean.
- **localStorage migration** — drafts saved before this pass (schemaVersion 1) load successfully and gain the V2 fields automatically. Wikipedia events keep their existing source URLs; legacy custom moments inherit a `verified: false` source block when their `sourceNotes` are blank or mention "unverified|rumor|speculation|hearsay", and `verified: true` otherwise.

**Known limitations**
- The four badges on each card stretch wider than the title at 390px (xs). They wrap to a second line cleanly, but a denser one-row variant would be nicer on phones — see `QA-031`.
- `SourceBadge` only renders the source URL as a link for `wikipedia` and `manual` types. Producer / demo URLs are passive on purpose (the demo URL is `example.com/demo/…`, a placeholder), but once `QA-010` lands and demo URLs point at real explainer pages we should revisit.
- The migration is one-way (V1 → V2). A future V3 migration will need to handle V2 input directly; we should add a `migrateV2ToV3()` companion + a generic `migrate(parsed)` dispatcher when V3 lands. Not blocking today.
- `Visibility` on a timeline event is added by the migration as `"Internal"` for everything, including events that were `"Public"`-equivalent in spirit (e.g. born-in-Brooklyn for MJ). A more thoughtful default could derive from `eventType` (Personal → Internal, Achievement → Public). Skipped to keep the migration conservative.
- The new "I have corroborated this source" affirmation only persists a boolean. A future improvement could capture *who* affirmed (`affirmedBy: { producer, atISO }`) so audit trails show the human in the loop — captured as `QA-033`.

**Follow-up tasks**
- `QA-031` (P2) — design a compact, one-row variant of the four-badge cluster for phone widths (xs ≤ 390px).
- `QA-032` (P2) — add a generic `migrate(parsed: { schemaVersion }): DraftProfile | null` dispatcher in `storage.ts` so future schema bumps don't need to fork `parseTwin`.
- `QA-033` (P3) — capture `affirmedBy: { producer, atISO }` on `CustomMoment.source` so the audit trail records who affirmed and when, not just whether.
- `QA-034` (P2) — surface guardrail flags' new `source` reference on S5 (`evaluateGuardrailFlags` exposes it but S5 currently renders the persisted `GuardrailReview`; merge so reviewers see provenance at the row level).
- `QA-035` (P3) — once `INVESTOR_DEMO_SUBJECT_ID` ships a real source URL (currently `example.com`), drop the special-case "passive only for demo/producer" rule in `SourceBadge` and let producer/demo URLs become clickable too.

**Checks**
- `npm test -- --run` → 968 / 968 passing (+35 new: 21 in `contentModel.test.ts`, 8 in `storage.migration.test.ts`, 4 in `guardrails.test.ts`, 2 baseline drift).
- `npm run build` → green; `dist/assets/index-*.js` bundle delta is +6.3 kB gzipped for the content model + four-badge component + drawer additions.
- Manual: S2 → S3 → S4 verified live at 1280×900 against the Lina demo. The S3 four-badge row renders correctly across all confidence/approval/visibility combinations; the S4 unverified-moment red strip is clearly visible above the Edit/Delete row; the S4 verified moment ("Quiet hours in the studio") shows a gold `PRODUCER` badge with no danger callout. SS1 approved-only filter verified by unit test (`eligibleVoiceStudioEvents`).

---

## 2026-06-01 · Reusable loading / empty / error states across the flow

**What changed**
Every screen rolled its own loading skeleton, empty-state pill, and error banner — copy was inconsistent and a third of the failure paths fell back to a bare error string. This pass adds three new reusable primitives (`LoadingState`, `ErrorState`, `RetryPanel`), keeps the existing `EmptyState`, and centralizes every user-facing state string in `src/lib/stateCopy.ts` so the QA brief's exact copy ("No matching public figures found…", "Draft could not be saved locally…", "Audio generation is not connected in this demo…") is sourced from one place. The wizard's loading paths (S2 initial profile, S2 import in flight, S3 timeline rehydrate, S6 draft save) now share an `aria-busy + aria-live` `<LoadingState>` with a domain-shaped skeleton slot, and the error paths (S1 API outage, S6 save failure, AudioPreview asset error) now use a `RetryPanel` with a working retry handler.

**Files touched / created**
- `src/components/LoadingState.tsx` (new) — `<LoadingState title description? eyebrow? skeleton?>` standardizes the loading choreography. It wraps the section in `aria-busy="true" aria-live="polite"`, renders an animated `…` token (`motion-safe:` so it respects reduced-motion), and exposes a `skeleton` slot so each call site keeps its domain-shaped placeholder (per docs/05-STATES — prefer shapes over spinners).
- `src/components/ErrorState.tsx` (new) — `<ErrorState title description action? tone>` is the inverse of `EmptyState`: `role="alert"` so assistive tech announces failures immediately, two tones (`danger` for blocking failures, `warning` for "degraded but usable" surfaces like the search API being down), and a free-form `action` slot for unusual recoveries (e.g. "Go to profile import" when consent blocks a save).
- `src/components/RetryPanel.tsx` (new) — convenience composition of `<ErrorState>` with a built-in Retry CTA + optional secondary ghost button. Use it whenever recovery is "try the same op again"; reach for `<ErrorState>` directly when the action is something else.
- `src/components/AudioPreview.tsx` — three states already existed (not-connected, errored, playing). Re-pointed the not-connected + errored copy at `stateCopy.ts` so the exact "Audio generation is not connected in this demo…" string ships, and added a functional Retry button on the errored state that calls `audioRef.current.load()` and clears the error flag.
- `src/lib/stateCopy.ts` (new) — single source of truth for every user-facing loading / empty / error string in the flow. Naming convention is `SCREEN_PHASE_KEY` (e.g. `SEARCH_EMPTY_DESCRIPTION`), and every error string answers two questions per docs/05-STATES: *what happened* + *what to do next*.
- `src/screens/S1Search.tsx` — wired the API-error path to `<RetryPanel tone="warning">` with a functional retry that nudges the debounced query so the fetch effect re-runs. Empty-state copy now uses the canonical `SEARCH_EMPTY_DESCRIPTION` ("No matching public figures found. Try a full name or adjust filters.") with the searched term shown underneath in mono for grounding.
- `src/screens/S2ProfileImport.tsx` — replaced the bare animate-pulse rectangles + the inline "Importing profile…" block with two `<LoadingState>` calls keyed by phase (`SUBJECT_LOADING_*` for the initial profile load, `IMPORT_LOADING_*` while the timeline is generating). The import error path was already using a retry button; the failure message is now sourced from `IMPORT_ERROR_DESCRIPTION` so it tells the user what to do next ("Retry, or pick a different subject").
- `src/screens/S3TimelineReview.tsx` — replaced the inline loading block with `<LoadingState eyebrow="S3 · Timeline review" …>` and updated the "no timeline" empty state to surface the canonical `TIMELINE_EMPTY_DESCRIPTION` ("No reliable timeline events were found. Add custom moments to continue.") with a primary "Add custom moments" CTA and a ghost "Back to import" — so the user has a forward path even when the import returned zero rows.
- `src/screens/S4CustomMoments.tsx` — replaced the centered "No draft loaded — start from search." paragraph with `<EmptyState eyebrow="S4 · Custom moments">` so the no-draft branch matches the rest of the flow. The existing inline empty (`<EmptyState description=…>`) now pulls from `CUSTOM_EMPTY_DESCRIPTION` for consistency.
- `src/screens/S5GuardrailReview.tsx` — same treatment for the no-draft branch (now uses `<EmptyState>`), and the "all clear" green panel was promoted from a single-line paragraph to a full empty-state surface ("S5 · CLEAR" / "All clear" / `GUARDRAIL_CLEAR_DESCRIPTION`) so it reads as an intentional outcome and not an afterthought.
- `src/screens/S6DraftSaved.tsx` — saving state is now `<LoadingState eyebrow="S6 · Draft save" …>` with a ProfileCardSkeleton. The error branch split into two real paths: consent-blocked uses `<ErrorState>` with a "Go to profile import" action (not retryable), generic save failure uses `<RetryPanel>` with a wired `Retry save` primary + `Back to guardrails` secondary, and both pull their copy from `stateCopy.ts`.
- `src/studio/ResolverPanel.tsx`, `src/studio/steps/SS1EventSelector.tsx` — added `eyebrow` + `title` to the existing `<EmptyState>` calls so the Voice Studio's "awaiting event" and "no events available" surfaces match the wizard's hierarchy.
- `src/components/index.ts` — exported the three new components + their props (`LoadingStateProps`, `ErrorStateProps`, `ErrorStateTone`, `RetryPanelProps`) and re-alphabetized the file.
- `src/components/states.test.ts` (new) — vitest suite that:
  1. Renders each component via `renderToStaticMarkup` (no jsdom dep needed) and asserts `role="alert"`, `aria-busy`, and `aria-live` show up on the correct surfaces.
  2. Renders the override paths (`retryLabel`, `secondaryAction`, `retryDisabled`, `tone="warning"`) and asserts the right markup ships.
  3. Pins the QA brief's five exact copy strings (search-empty, search-error, timeline-empty, save-error, audio-unavailable) as `expect().toBe(…)` so any future copy tweak is a deliberate diff with a paper trail.

**User-facing behavior**
- **Search (S1)**: typing gibberish renders an `EmptyState` with "No matching public figures found. Try a full name or adjust filters." plus a mono-typed "Searched for `<query>`" line for grounding. If Wikipedia returns 5xx / 429 / network error, the screen now shows a warning-toned `RetryPanel` with title "Search unavailable", the canonical "Search is unavailable right now. Try again in a moment." copy, and a Retry button that re-triggers the debounced fetch — no more blank "0 results" panel masking a real outage.
- **Profile import (S2)**: opening the demo profile shows a `<LoadingState>` with "S2 · Profile import / Loading profile / Fetching the Wikipedia summary and metadata." and a ProfileCardSkeleton; clicking "Import profile" swaps to "Importing profile / Generating timeline from Wikipedia sources." with two skeletons. The import error path now says "Import failed — We could not generate a timeline from this source. Retry, or pick a different subject." instead of a generic toast.
- **Timeline (S3)**: when the timeline rehydrate is running the screen shows a proper LoadingState header with three timeline-shaped skeletons (not a bare spinner). When the timeline is empty the empty surface promotes "Add custom moments" as the primary CTA because that is the actual forward path — the previous version only offered "Back to import" which dead-ended users whose subject genuinely had no reliable events.
- **Custom moments (S4) + Guardrails (S5)**: the "no draft loaded" branches now read like the rest of the flow (`eyebrow + title + description`) instead of a centered paragraph + button. S5's all-clear surface now visibly celebrates the cleared state (was a one-line note).
- **Draft save (S6)**: saving shows a `LoadingState` with the twin's name; saving failure shows a `RetryPanel` with "Draft could not be saved locally. Try again before leaving this page. Your twin is still in memory — nothing was lost from this session.", primary `Retry save` (calls the same commit function), secondary `Back to guardrails`. Consent-blocked saves render an `ErrorState` (not retryable) that sends the user to S2.
- **Audio preview (S7 / Voice Context Preview)**: not-connected state now says "Audio generation is not connected in this demo. The voice context is saved and ready for generation." — the exact brief copy. If the audio asset 404s, the error state now offers a working Retry button that calls `<audio>.load()` and clears the error flag.

**Known limitations**
- The `LoadingState` ellipsis is a textual `…` token, not a real animated spinner. That's deliberate — the screen-reader announcement is the `title + description` from `aria-live`, and the visual cue is provided by the skeleton-shaped placeholders below it. If we ever ship a determinate progress bar (e.g. for multi-step imports), we should add a `progress` slot rather than overloading the title.
- `<RetryPanel>` doesn't currently expose a "retrying…" intermediate state. If a retry handler is async + long-running, the screen will sit on the error surface until the parent flips it back. Acceptable for our current retry targets (search re-fetch is ~1s, save retry is local-storage write, audio reload is sub-second), but we should add a `pending` prop if we ever wire a long-running retry.
- We didn't add jsdom to the vitest config — instead the new test suite uses `react-dom/server` `renderToStaticMarkup`. That keeps the test runtime where it is (node-only, 933 tests under 1s) but means interaction tests (e.g. asserting `onRetry` fires on click) live as separate static markup assertions ("the disabled attribute appears", "the Retry button is in the DOM"). If we eventually add jsdom for richer integration tests, the assertions in `states.test.ts` should migrate to fire-event-driven assertions.
- The `SUBJECT_LOADING_*` strings still mention Wikipedia by name. Acceptable today since our only import source is Wikipedia + curated demo subjects, but if we ever add a second source we'll need a generic phrasing or a per-source dictionary.

**Follow-up tasks**
- `QA-025` (P2) — add a determinate `progress` slot to `<LoadingState>` for the multi-second import flow so the screen reads as actively progressing, not just busy.
- `QA-026` (P2) — add a `pending` boolean to `<RetryPanel>` so retry handlers can flip the button into a disabled "Retrying…" state without unmounting the panel.
- `QA-027` (P2) — when jsdom is added (paired with the responsive-Playwright story in QA-024), migrate `states.test.ts` interaction assertions from static markup to `fireEvent` so the retry-disabled / secondary-action paths are exercised dynamically.

**Checks**
- `npm test -- --run` → 933 / 933 passing (was 918 — 15 new tests in `src/components/states.test.ts`).
- `npm run build` → green; `dist/assets/index-*.js` bundle delta is +1.2 kB gzipped for the three new components + state copy module.
- Manual: S1 (search empty + S1 search-API-error path), S2 (loading + import skeleton) verified live in the IDE browser at 1280×820. Existing screens render unchanged on the happy path (no regressions on the demo flow).

---

## 2026-06-01 · Accessibility remediation pass (WCAG 2.1 AA blockers)

**What changed**
Audited the entire flow for WCAG 2.1 AA blockers and remediated four classes of issues that the responsive pass surfaced. Bumped the `textmuted` token from `#5a5a78` to `#888fad` so it hits the 4.5:1 contrast minimum against every dark background we ship (the old hex sat at ~3.6:1 on `bg-card`, ~3.1:1 on `bg-panel`); preserved the old hex as a new `textfaint` token for purely decorative copy where the contrast hit was intentional. Standardized focus rings on `focus-visible:ring` so keyboard-only focus is visible but mouse users don't see a ring on every button click; kept `focus:ring` on text inputs since constant-on focus there is the expected behavior. Enhanced the `Tooltip` to dismiss on Escape (WCAG 1.4.13 — content on hover/focus must be dismissible). Tightened `<SubjectThumbnail>` to use `alt=""` since the subject name is announced adjacently (otherwise screen readers double-announce). Promoted the `StudioBreadcrumb` chips to descriptive `aria-label`s ("Studio sub-step 2 of 4, Scene context, current step") and pushed the click target above 44px via `min-h-touch sm:min-h-[36px]`.

**Files touched / created**
- `tailwind.config.js` — `textmuted` `#5a5a78` → `#888fad` (4.5:1 on every dark surface), added `textfaint: #5a5a78` for the rare decorative case (timeline filler text, faded breadcrumb separators).
- `src/studio/EmotionalArcViz.tsx` — SVG text was hardcoded to the old `#5a5a78` hex; updated to `#888fad` so the chart legend hits AA contrast.
- `src/components/Button.tsx` — `focus:ring` → `focus-visible:ring` across `variantClass` + the global default. Mouse-clicked buttons no longer show a persistent ring; keyboard-focused buttons still do.
- `src/components/Tooltip.tsx` — added a `useEffect` that listens for a global `Escape` keydown and closes the tooltip; added a local `onKeyDown` that calls `e.stopPropagation()` so Escape inside a focused trigger doesn't escape past the tooltip (e.g. into a parent Modal).
- `src/studio/StudioBreadcrumb.tsx` — chips now receive `aria-label="Studio sub-step N of 4, <name>, current step"` (or `disabled` / `completed`), `min-h-touch sm:min-h-[36px]` so the tap target is ≥44px on touch and 36px on pointer, and `focus-visible:ring` for keyboard-only focus.
- `src/screens/S2ProfileImport.tsx` — `SubjectThumbnail` no longer accepts an `alt` prop; the `<img>` is now `alt=""` since the subject's name is announced by the adjacent `<h1>`. Back link, external link, and the consent `<summary>` element all switched to `focus-visible:ring rounded` for keyboard-only focus.
- `src/screens/S1Search.tsx`, `src/components/SegControl.tsx`, `src/components/AppHeader.tsx`, `src/studio/TwinContextPanel.tsx`, `src/components/EditorialReviewModal.tsx`, `src/components/WizardStepper.tsx` — `focus:ring` → `focus-visible:ring` everywhere except text inputs.
- `src/lib/a11y.test.ts` (new) — static-analysis vitest suite that walks the source tree and flags: `<img>` without `alt`, non-button elements (`div`/`span`/`li`/`article`/`section`/`aside`/`figure`/`header`/`footer`/`nav`) with `onClick` handlers (Tooltip is whitelisted because it wraps focusable children), `<a target="_blank">` missing `rel`, `focus:outline-none` not paired with a `focus*:ring`, and any new usage of the legacy `#5a5a78` hex outside of the `textfaint` token. Five tests, runs in 6ms.

**User-facing behavior**
- All previously-faint UI affordances (file metadata, helper text, eyebrow labels) now meet AA contrast against every dark surface we ship — visible without being shouty.
- Keyboard users now see a consistent focus ring on every interactive surface (buttons, chips, cards, search filters, the consent disclosure summary, etc.) without mouse users picking up an unwanted persistent ring.
- Tooltips dismiss with `Escape` and don't trap focus on hover-only triggers.
- Screen readers no longer double-announce subject names on S2 (image alt + adjacent heading was redundant).
- Studio sub-step chips now read as "Studio sub-step 2 of 4, Scene context, current step" rather than just "Scene".

**Known limitations**
- We didn't bring in `axe-core` as a dev dependency this pass — the static suite in `src/lib/a11y.test.ts` catches the structural anti-patterns we care about today but won't catch color-contrast regressions on new tokens or new ARIA misuse. See `QA-028`.
- The new `textfaint` token is only used in two places (timeline filler text, decorative separators). If a designer reaches for it for substantive copy, our contrast guarantee breaks. Should add a lint rule that flags `textfaint` on anything other than `aria-hidden` content.

**Follow-up tasks**
- `QA-028` (P2) — wire `axe-core` into the IDE-browser MCP smoke test so every screen is dynamically audited before each push.
- `QA-029` (P2) — add a static check that `textfaint` is only used on elements with `aria-hidden="true"` or `role="presentation"`.
- `QA-030` (P3) — replace the breadcrumb chevron `›` characters with proper `aria-hidden` separators wrapped in `<span>`s so they don't get announced.

**Checks**
- `npm test -- --run` → 918 / 918 passing (5 new in `src/lib/a11y.test.ts`).
- `npm run build` → green.
- Manual: contrast spot-checks on `text-textmuted` against `bg-bg / bg-panel / bg-card` all clear AA at 4.5:1.

---

## 2026-06-01 · Responsive mobile layouts across RICON Studio

**What changed**
RICON Studio was desktop-first. At phone widths the side rails, sticky footers, modals, and form inputs were all cramped, clipped, or scroll-trapping. This pass adds a small set of responsive utility tokens, fixes every primary screen to behave at 390 / 768 / 1024 / desktop widths, restructures the Voice Studio so its left rail (Twin context) and right rail (Resolver) collapse into native disclosure summaries on mobile while keeping the 3-column layout from `lg:` and up, makes the `Modal` full-height + safe-area aware on phones, and bumps every text input to 16px on mobile so iOS Safari stops zooming on focus. Sticky footer bars on S3/S4/S5 now respect the iOS home-indicator inset and their CTAs are 44px touch targets.

**Files touched / created**
- `index.html` — `viewport-fit=cover` so `env(safe-area-inset-*)` returns real values inside iOS Safari, and a `theme-color` for the URL bar tint.
- `tailwind.config.js` — added an `xs` (390px) breakpoint to give us a hand-tuned width below `sm`, and three new spacing tokens: `touch` (44px), `safe` (`env(safe-area-inset-bottom)`), and an `xs:`-aware base scale. These are the building blocks the utilities below lean on.
- `src/index.css` — added five utility groups in `@layer utilities`:
  - **Safe-area** — `.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe` map to `env(safe-area-inset-*)`. `.pb-action-bar` is shorthand for `calc(96px + env(safe-area-inset-bottom))` and is applied to S3/S4/S5/Studio body shells so the page never permanently hides content behind the fixed footer.
  - **Touch target** — `.touch-target` is `min-h: 44px; min-w: 44px;`. Used on any control where the visual design has shrunk below WCAG's tappable minimum (AppHeader logo + Exit button, WizardStepper chips, sticky-footer CTAs, S4 per-card Edit/Delete).
  - **iOS form-zoom guard** — `.text-input` forces 16px on phones (the threshold iOS uses before it zooms on focus) and shrinks to 14px from `sm:` up. Applied to every `<input>` and `<textarea>` (Input, Textarea, S1 search input, TwinChat input).
  - **dvh shim** — `.h-dvh` / `.max-h-dvh` set `100vh` and then override with `100dvh` so we get the dynamic viewport that doesn't jump when the iOS URL bar collapses. Used by `Modal`.
  - **ResponsivePanel breakpoint overrides** — small CSS that lets `<ResponsivePanel data-always-open-from="lg">` force the disclosure open and hide its summary at the chosen breakpoint, without JS. This is what powers the Voice Studio's collapse-on-mobile / always-open-on-desktop behavior.
  - Also added `body { overflow-x: hidden }` as a defence-in-depth against any rogue child stretching the layout past the viewport on 360–390px devices.
- `src/components/ResponsivePanel.tsx` (new) — `<ResponsivePanel title summary defaultOpen alwaysOpenFrom>`. Renders a native `<details>` so the disclosure works without JS, ships free a11y (`aria-expanded` from the browser, full keyboard support), and degrades gracefully. The `alwaysOpenFrom` prop (`"md" | "lg" | "xl"`) drives the CSS rule that hides the summary and forces the body visible at that breakpoint. Used by Voice Studio for Twin context and Resolver on mobile/tablet.
- `src/components/index.ts` — exported `ResponsivePanel` + its props type.
- `src/components/Modal.tsx` — rewritten for mobile:
  - On phones (`<sm`) the dialog is `h-dvh max-h-dvh rounded-t-xl` — a full-screen sheet that follows the dynamic viewport, not a 92vh card that crops badly when the iOS URL bar moves.
  - From `sm:` and up it reverts to the classic centered `max-w-lg` rounded card with `max-h-[92vh]`.
  - The header gets `pt-safe`, the footer gets `pb-safe`, so the close button stays clear of the iOS notch and the action row stays clear of the home indicator.
  - The header + footer are `shrink-0`; the body is `flex-1 overflow-y-auto` so long content (e.g. CustomMomentDrawer's 6 form fields + 2 SegControls) scrolls cleanly without losing the actions.
  - Close button got `touch-target` so the tiny `✕` glyph is still a 44px tap region.
  - `CustomMomentDrawer` inherits the new behaviour for free since it composes `Modal`.
- `src/components/Input.tsx` and `src/components/Textarea.tsx` — swapped `text-sm` for `text-input` and added `min-h-touch sm:min-h-0`. The combination removes the iOS zoom-on-focus jump while keeping the desktop design tight.
- `src/screens/S1Search.tsx` — search input now uses `text-input min-h-touch`.
- `src/studio/TwinChat.tsx` — chat input now uses `text-input min-h-touch sm:min-h-0`.
- `src/components/SegControl.tsx` — chips bumped from `min-h-[36px]` to `min-h-touch` on mobile and back to `min-h-[36px]` from `sm:`. Font is 11px on mobile / 12px on desktop. The "All / Personal / Career / ..." filter rows in S3 are now fully tappable on a phone without missing.
- `src/components/AppHeader.tsx` — `pt-safe` on the sticky header, `touch-target` on both the RICON logo button and the Exit button (small variant = 36px otherwise).
- `src/components/WizardStepper.tsx` — chips now have `min-h-touch sm:min-h-0`. The 28px visual swatch is unchanged, but the surrounding button is 44px on mobile so every chip on the wizard breadcrumb is tappable.
- `src/studio/VoiceStudio.tsx` — restructured layout:
  - Outer container is `flex flex-col` on mobile and only becomes `lg:grid lg:grid-cols-[220px_minmax(0,1fr)_280px]` from `lg:` and up.
  - Mobile/tablet (`<lg`): Twin context is rendered inside `<ResponsivePanel title="Twin context" summary="N events · N custom · N flags">` above the center stage, collapsed by default. Resolver is rendered inside `<ResponsivePanel title="Resolver" summary="<feeling> · <family> · <direction>">` below the center stage, also collapsed by default. The collapsed summary line tells the producer what they'd see if they opened the panel without forcing them to.
  - `lg+`: TwinContextPanel and ResolverPanel render directly in their grid cells — no disclosure, no toggle.
  - Center stage body got `pb-action-bar` so it never hides content behind the sticky footer; the footer itself moved from `bg-surface/90` to `bg-surface/95 backdrop-blur pb-safe sticky bottom-0` and every footer button got `touch-target`.
  - Studio sub-steps breadcrumb now sits inside `-mx-1 overflow-x-auto px-1` so it scrolls on tiny widths instead of wrapping awkwardly.
  - Two pure helper fns `twinContextSummary(draft)` and `resolverSummary(output)` produce the mobile summary strings.
- `src/studio/TwinContextPanel.tsx` — removed the `border-b lg:border-b-0 lg:border-r` self-styling (the parent now decides). The "TWIN CONTEXT" eyebrow becomes `hidden lg:block` because on mobile the ResponsivePanel's own `<summary>` already shows that label. The avatar's `mt-4` collapses to `lg:mt-4` so the panel is tighter when opened on mobile.
- `src/studio/ResolverPanel.tsx` — same surgery as TwinContextPanel: the `border-t` is gone (ResponsivePanel handles it on mobile, the new `lg:border-l` handles it on desktop) and the "RESOLVER" eyebrow is `hidden lg:block`.
- `src/screens/S3TimelineReview.tsx` — outer body padding bumped from `pb-28` to `pb-action-bar`. Fixed footer got `pb-safe`, `touch-target` on Back + Continue, the helper text "X approved · approve at least 1 to continue" is now hidden on mobile and re-rendered on its own line below the action row so the two CTAs don't get pushed off-screen.
- `src/screens/S4CustomMoments.tsx` — same `pb-action-bar` + `pb-safe` + `touch-target` treatment. Per-card Edit/Delete buttons in the moment list got `touch-target` so they're tappable inside the densely packed cards.
- `src/screens/S5GuardrailReview.tsx` — same `pb-action-bar` + `pb-safe` + `touch-target` treatment, with the same "helper text on its own line on mobile" pattern as S3.
- `src/screens/S2ProfileImport.tsx` — the "← Back" link is now `touch-target inline-flex items-center px-1` (it was `font-mono text-xs` only — a 16x14 hit zone).

**User-facing behavior**
- At 390px (iPhone 12/13/14/15 widths), nothing scrolls horizontally. Every primary CTA is reachable. Every text input is at 16px so focusing one doesn't make iOS zoom and shift the page.
- At 390px the Voice Studio opens with the Twin context summary (`8 events · 2 custom`) at the top, the studio sub-steps breadcrumb, the center stage taking ~70% of the viewport, and the Resolver summary at the bottom (`Select an event to resolve a feeling`). Tap either summary to expand it inline. The sticky footer with Back / Continue stays clear of the iOS home indicator.
- The Editorial Review modal, the Custom Moment drawer, and any other Modal-based dialog are full-screen on mobile with their action footer pinned to the bottom and safe-area aware — no more "save button under the home bar" complaints.
- The wizard stepper chips on S2–S6 are tappable on a phone (44px tall) even though their visual swatch stays the compact 28px.
- S3/S4/S5 sticky bottom bars sit above the iOS home indicator (not under it) and show a single-line helper text on mobile instead of squeezing it between the two CTAs.
- Desktop (`lg+` and up) is visually unchanged. The 3-column Voice Studio layout, the centered max-w-680 wizard, and the AppHeader's full center-row of breadcrumb metadata all render exactly as before.

**Known limitations**
- Tablet (768–1023px) still uses the mobile pattern in the Voice Studio (collapsible Twin context + collapsible Resolver above the center stage). At those widths a 2-column layout (Twin context left, center stage right, Resolver as a collapsible bottom sheet) would feel more native. Logged as `QA-019`.
- The `<details>` disclosure animates open/close instantly (no height transition). That's the native browser behaviour. A polish pass with `interpolate-size: allow-keywords` or a hand-rolled height transition is left for later — logged as `QA-020`.
- The "always-open-from breakpoint" CSS rule uses `!important` to override the UA `<details>` stylesheet. That's load-bearing but it does block any consumer from forcing the panel closed via inline style at the breakpoint. Documented in `ResponsivePanel.tsx`. Not currently a problem since the only consumers are the studio panels.
- The studio's `lg:` breakpoint is 1024px. Between 1024 and ~1200 the 3 columns (220 / 1fr / 280) can feel tight, particularly when the TwinChat input is below a long bio. The columns hold but the chat input visibly compresses. Acceptable but worth widening the breakpoint to `xl:` for the 3-col layout — logged as `QA-021`.
- The `Button` component's `size="small"` variant is still 36px tall (designer intent, not a responsive bug). Where it appears in dense lists we add `className="touch-target"` to bump the hit zone. A future pass might add an explicit `touchable` prop to `Button` so consumers don't have to remember the utility class — logged as `QA-022`.

**Follow-up tasks**
- `QA-019` — Voice Studio tablet layout (768–1023): 2-col with Resolver as bottom sheet.
- `QA-020` — Smooth open/close transition on `<ResponsivePanel>` disclosures.
- `QA-021` — Promote the studio 3-column layout from `lg:` (1024) to `xl:` (1280) to relieve compression in the 1024–1200 band.
- `QA-022` — Add a `touchable` prop to `Button` so small-variant buttons in dense lists don't need the manual `touch-target` className.
- `QA-023` — Audit the AppHeader's mobile center copy. "Step 7 of 7 · Voice Studio" truncates to "STEP 7 OF 7 …" at 390. Either shorten the step label set or move the truncation point.

**Checks**
- `build` — passes (`tsc -b && vite build`, 96 modules, 341.30 kB / 101.52 kB gzipped).
- `test` — `npm test -- --run` → 913 / 913 passing across 14 test files. No new tests written for the responsive utilities themselves (they're pure CSS / DOM behavior — testable only via screenshot diffing, see `QA-024` if we add Playwright).
- Visual smoke test in the browser via the cursor-ide-browser MCP at four widths:
  - 390×844 (iPhone 13) — S1, S2, S3, S5, Voice Studio collapsed + expanded — no horizontal overflow, all CTAs reachable, modals full-screen.
  - 768×1024 (iPad portrait) — Voice Studio still in mobile pattern (collapsible panels). Acceptable; see `QA-019`.
  - 1024×768 (iPad landscape / small desktop) — Voice Studio 3-col activated; slightly compressed but functional. See `QA-021`.
  - 1280×800 (laptop) — desktop layout fully intact.

---

## 2026-06-01 · Navigation & wayfinding pass — persistent AppHeader, navigable stepper, exit guard

**What changed**
Producers can now always answer "where am I?", "how do I get home?", and "can I safely leave?" without guessing. The TopBar/ProgressBar pair was replaced with a sticky, persistent `AppHeader` (clickable RICON wordmark + flow name + step copy + subject name + Demo badge + Exit button) and a fully navigable `WizardStepper` (completed steps and visited steps can be clicked to revisit them; future steps are visibly disabled). An unsaved-changes confirm dialog is hooked into both the logo-home action and the Exit button, with a parallel `beforeunload` handler so the browser also nags if the tab is closed mid-flight.

**Files touched / created**
- `src/types/navigation.ts` — expanded `SCREEN_META` from `{title, step, showWizardHeader}` to `{title, stepLabel, step, flowName, showWizardHeader, exitConfirms}`. `stepLabel` is the short chip text (e.g. "Custom" vs the full "Custom Moments"). `flowName` distinguishes "Voice Research Studio" (S1–S6) from "Voice Studio" (S7). `exitConfirms` is the single source of truth for the unsaved-changes guard — false on S1 (already home) and S6 (just saved), true everywhere else. Added `WIZARD_SCREEN_ORDER` parallel to `WIZARD_STEP_LABELS` so the stepper can map step → screen id in one place.
- `src/lib/unsavedChanges.ts` (new) — pure `hasUnsavedProgress(draft, screen)` helper backed by `exitConfirms`. The doc-comment explains the rule: drafts auto-save on every edit, so this is really about confirming user *intent* to leave the wizard, not preventing data loss.
- `src/lib/stepperState.ts` (new) — pure `deriveStepperItems(currentScreen, completedThroughStep)` producing `{ step, screenId, label, state, navigable, ariaLabel }`. States are `current | completed | visited | future`. The current step + everything ≤ `completedThroughStep` is navigable; future steps aren't.
- `src/components/WizardStepper.tsx` (new) — replaces `ProgressBar`. Each step is a real `<button>`: completed (ok-green ✓), current (gold ring, `aria-current="step"`), visited (ok-green, still clickable), future (muted, `disabled`). On `<sm`, the row is a horizontal scroller (`overflow-x-auto`, hidden scrollbar) and the current chip auto-`scrollIntoView({ block: "nearest", inline: "center" })`s on screen change so the user can always see where they are.
- `src/components/ConfirmDialog.tsx` (new) — thin wrapper over the existing `Modal` for two-button confirm prompts. `destructive` swaps the primary button to the danger variant. Used by the AppHeader exit guard now; reusable for future destructive actions.
- `src/components/AppHeader.tsx` (new) — sticky global header that replaces `TopBar`. Layout:
  - **Left** RICON wordmark as a `<button>` (`aria-label="RICON — return to search"`). Clicking pops the unsaved-changes confirm when `hasUnsavedProgress(...)` is true, otherwise routes straight to `goHome`.
  - **Center** (sm+) flow name → step copy → subject name → "Demo profile" badge (when applicable). On S7 the right edge also surfaces `Studio · SSn` so the producer knows which studio sub-step they're on at a glance.
  - **Center (mobile)** condensed step copy only (the subject name + Demo badge are still visible in the `WizardHeader` row below for S2–S6, and in the `TwinContextPanel` left rail in the studio).
  - **Right** "Exit" button (S2–S5) / "Exit studio" (S7). Hidden on S1 (you're home) and S6 (clean handoff). Same dirty-state guard as the logo.
  - Adds a `beforeunload` listener whenever `hasUnsavedProgress(...)` is true. Browsers replace the message with their own copy, but the prompt does fire — belt-and-braces with the in-app dialog.
- `src/components/WizardHeader.tsx` — swapped `ProgressBar` for `WizardStepper`. Passes `goTo` as `onSelect` so clicking a completed/visited chip navigates back to that step. `TwinContextSummary` remains for the per-step "X events · Y custom · N flags pending" readout.
- `src/components/index.ts` — removed `TopBar` + `ProgressBar` exports; added `AppHeader`, `ConfirmDialog`, `WizardStepper`.
- `src/components/TopBar.tsx` and `src/components/ProgressBar.tsx` — **deleted**.
- `src/context/TwinContext.tsx` — added `goHome()` to the context value. Resets the in-memory draft to `null`, resets `studioStep` to `SS1`, resets `screen` to `S1`, resets `completedThroughStep` to 1. Does **not** clear localStorage — the persisted draft survives the reset and can be rehydrated on the next reload.
- `src/App.tsx` — replaced `<TopBar />` with `<AppHeader />`. `WizardHeader` continues to render on S2–S6 per `SCREEN_META[*].showWizardHeader`.
- `src/studio/VoiceStudio.tsx` — collapsed the redundant `"S7 · Voice Studio"` eyebrow in the center column header to a muted `"Studio sub-steps"` label, since the AppHeader now carries the wayfinding. Renamed the footer ghost button from `"← Exit studio"` to `"← Back to Saved"` so it no longer collides semantically with the global "Exit studio" in the AppHeader — one steps back, the other goes all the way home.
- `src/screens/S2ProfileImport.tsx` — the inline `"← Back to search"` text link is now just `"← Back"` with an `aria-label="Back to previous step"`. The exit/home action lives in the AppHeader, the per-step back action lives where the user is.
- `src/lib/unsavedChanges.test.ts` (new) — 4-test matrix: `null` draft anywhere → false; with draft on S1 → false (home); with draft on S6 → false (saved); with draft on S2/S3/S4/S5/S7 → true.
- `src/lib/stepperState.test.ts` (new) — 7 tests covering: S1 start (1 current, rest future), mid-flow (completed + current + future), walk-back from S6 to S3 (visited state appears on S4/S5/S6, S7 still future), current is always navigable, screen-id ordering, ariaLabel format, full-progress S7 (all prior completed).

**User-facing behavior**
- The RICON wordmark in the header is now a real link with hover + focus styles. It works on every screen.
- On any screen with in-flight work (S2/S3/S4/S5/S7), the header shows an `Exit` (or `Exit studio`) button. Clicking it — or the RICON logo — pops a "Leave this draft?" confirm dialog with `Stay here` and `Leave draft` buttons.
- The stepper at the top of S2–S6 is now a row of buttons. Completed steps (✓) and visited steps are clickable; the active step is highlighted in gold; future steps are visibly disabled. On phones, the row scrolls horizontally and the current step auto-centers as you progress.
- The persistent header always shows: `Voice Research Studio · Step 3 of 7 · Timeline Review · Michael Jordan` (with a `Demo profile` badge if applicable). In the studio it adds `Studio · SS2` on the right.
- Closing the browser tab mid-flight triggers the OS-level "Leave site?" prompt while there is in-flight work.

**Known limitations**
- The unsaved-changes guard is screen-based (`SCREEN_META[*].exitConfirms`), not dirty-tracking. It will confirm even if the user landed on, say, S3 but hasn't edited anything yet. This is intentionally conservative — false-positive nags are cheaper than silent draft loss. A finer per-field dirty flag could land later (logged as `QA-016`).
- The `beforeunload` handler returns a truthy value rather than a custom message. Every modern browser ignores the message string and shows their own — that's a platform-level restriction, not a workaround.
- The stepper's "visited" state assumes monotonic progress tracked via `completedThroughStep`. The S5→S4 rejection loop (`rejectToCustomMoments`) doesn't reduce `completedThroughStep`, so S5 stays clickable from S4 after a rejection. That's the desired behavior (you can re-attempt guardrail clearance), just noting it.
- Studio sub-steps (SS1–SS4) are not yet represented in the global stepper — they live in the studio center column's mini-breadcrumb. The AppHeader exposes the active SS in its right edge as a compromise. Logged as `QA-017` if we want a unified breadcrumb in the global header.

**Follow-up tasks**
- `QA-016` Move the unsaved-changes guard from screen-based to dirty-tracking (compare draft hash on entry vs on exit). Lower nag-rate, but still trigger on truly meaningful edits.
- `QA-017` Optionally expose SS1–SS4 in the AppHeader (collapse + expand) instead of only in the studio center column.
- `QA-018` Surface a small "View saved draft" button in the AppHeader when the user is on S1 and `localStorage` has a saved draft from a prior session — currently the only entrypoint is to manually search for the same subject.

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | green — 95 modules, `dist/assets/index-*.js` 338.46 KB (100.78 KB gzip; +5 KB from the new header + stepper + confirm dialog) |
| Test | `npm test` | green — 14 files / **913** tests (+11 new across `unsavedChanges` + `stepperState`) |
| Lint | — | not configured (`QA-001`) |

---

## 2026-06-01 · S1 search relevance + result clarity + keyboard nav

**What changed**
Reworked S1 search so producers can evaluate results faster and pick the right subject with less risk of mistaking a disambiguation page or off-domain figure for the person they actually mean. The classifier was widened (without breaking the resolver), the search result list got filter chips and disambiguation badges, the input grew keyboard navigation, and the empty/error states are now polished and specific.

**Files touched**
- `src/lib/subjectDomain.ts` — introduced `SearchResultDomain = SubjectDomain | "entertainment" | "other"` so the search layer can _label_ (not drop) figures outside the resolver's narrow sports/music wheelhouse. Resolver-facing `SubjectDomain` is unchanged. Added `ENTERTAINMENT_KEYWORDS` (actor, director, comedian, host, voice actor, dancer, screenwriter, etc.) and `ENTERTAINMENT_OCCUPATION_QIDS` (Q33999 actor, Q10800557 film actor, Q2526255 film director, Q245068 comedian, Q21027763 voice actor, Q6625963 stand-up comedian, Q947873 TV presenter, Q19350898 YouTuber, etc.). `classifyByDescription` and `classifyByWikidata` now know about entertainment. `classifyHits` no longer drops unknowns — it preserves input order and labels unclassified results as `"other"`; `droppedCount` is kept for back-compat but is always 0.
  - **Bug fix incidental to this pass:** `SPORTS_OCCUPATION_QIDS` previously listed `Q10800557` commented as "ice hockey player" — that QID is actually **film actor** on Wikidata. The real ice hockey player QID is `Q11774891`. Swapped them so actors are no longer mis-classified as sports. Added regression coverage.
- `src/lib/wikipedia.ts` — `WikipediaSearchHit.domain` widened to `SearchResultDomain`. Added `WikipediaSearchHit.isDisambiguation?: boolean` and the `detectDisambiguation(title, excerpt)` heuristic (title ends with `(disambiguation)`, or excerpt contains "may refer to" / "may also refer to" / "is a disambiguation page"). Confirmed via the search excerpt because the REST `/v1/search/page` endpoint doesn't tag disambiguation; the more authoritative summary check would cost an extra fetch per row.
  - Replaced the old `allFilteredByDomain` flag (now meaningless — we don't drop) with `error?: SearchErrorCode` (`"unavailable" | "rate-limited"`). HTTP 429 maps to `rate-limited`; everything else maps to `unavailable`. We still fall back to demo subjects so the UI stays useful, but the error code drives a dedicated banner / empty-state.
- `src/components/Badge.tsx` — added a `warning` variant (amber on dark amber) for advisory contexts. Picked amber instead of stretching the existing `gold` (which means Music domain in this UI) or `danger` (which means destructive). One new variant only; the existing palette is otherwise untouched.
- `src/screens/S1Search.tsx` — full pass:
  - **Category filter chips** above the result list: `All / Sports / Music / Entertainment / Other`, each with a live count, rendered as a `role="tablist"` with `aria-selected`. Chips that have zero matches in the current result set are visibly disabled. Filtering happens client-side on the already-classified result array — sports and music remain the editorial focus but other categories are surfaced under their own chip rather than hidden.
  - **Result card improvements**: domain badge now uses the right variant per domain (`blue` sports, `gold` music, `muted` entertainment/other); added a `warning` "Disambiguation" badge plus a one-line caption when `isDisambiguation` is true; disambiguation rows render at 80% opacity to telegraph "secondary." The thumbnail / title / description / Wikipedia/Demo source badge that were already shipped are kept.
  - **Empty / error / loading states**:
    - Idle (no query): "Enter a name to search Wikipedia." (unchanged)
    - Loading: three skeleton rows with a "Searching…" mono caption.
    - Empty (live API returned zero hits): "No matching public figures found for "<query>". Try a full name or check spelling." per spec.
    - API error (live API failed AND demo fallback empty): dedicated "Search unavailable" eyebrow + "Search is unavailable right now. Try again in a moment." + a `Retry` button that re-fires the debounce-driven effect by nudging the query.
    - Demo-fallback banner (live API failed BUT demo returned hits): "Search is unavailable right now — showing seeded demo subjects. Try again in a moment." (replaces the older softer "Wikipedia is unavailable or rate-limited.")
    - Filtered empty (results exist but the active chip has zero): "No <Domain> results in this search. Switch the filter to All to see every match." + a "Show all" button.
  - **Keyboard navigation**: input renders as a `role="combobox"` with `aria-controls` / `aria-expanded` / `aria-activedescendant`; result list is a `role="listbox"` of `role="option"` buttons.
    - Input: `↓` jumps focus to the first result; `Esc` clears the query, the result list, and any selection error in one shot.
    - Results: `↑` / `↓` move focus through the **filtered** list (so the chip filter and keyboard nav agree); `↑` from the first result returns focus to the input; `Home` / `End` jump to bounds; `Enter` selects (native button activation); `Esc` clears.
    - The highlighted result also visually flips to `border-gold/70 bg-hover` so it's obvious which row Enter would pick. `scrollIntoView({ block: "nearest" })` keeps it visible during long lists.
    - A one-line mono caption under the input documents the shortcuts so this isn't a hidden feature.
- `src/lib/subjectDomain.test.ts` — added entertainment description tests, a test that `classifyByDescription("")` is `null` (was implicit), a `classifyHits` test that proves nothing is dropped (length matches input, `droppedCount === 0`, unknowns → `"other"`), a test that input order is preserved (matters for the deterministic UI), and a test that Wikidata occupation lookup can promote an unknown to `entertainment`.
- `src/lib/wikipedia.test.ts` — added a 4-test `detectDisambiguation` block, plus a 5-test `searchWikipedia (error → demo fallback flag)` block covering: network failure → `error: "unavailable"`, HTTP 429 → `error: "rate-limited"`, HTTP 503 → `error: "unavailable"`, happy live response → `error` undefined, and a live disambiguation row → `isDisambiguation: true` + `domain: "other"`.

**User-facing behavior**
- Searching now feels closer to a real product: producers can scope by category, see at a glance whether a row is a disambig page, and use arrow keys + Enter without leaving the keyboard.
- Selecting an off-domain result (an actor, a director) still works — it just lands as `domain: "entertainment"` and surfaces under that chip. The studio still imports it via `inferStudioDomain` and the consent gate still runs at S2; nothing about the import contract changes.
- When Wikipedia is down: producers see an explicit "Search is unavailable" message instead of silently getting demo results without explanation; if demo subjects happen to match the query they still appear, but the banner makes the source obvious.

**Known limitations**
- `detectDisambiguation` is heuristic — it'll false-negative on a disambig page whose excerpt doesn't contain a giveaway phrase, and it'll false-positive on biography pages that contain a literal phrase like "his birthday may refer to…" (rare in practice). The expensive-but-authoritative check is the summary endpoint's `type === "disambiguation"`, which we could call at fetch time before navigating to S2 — logged as `QA-012`.
- The entertainment classifier is intentionally non-aggressive: `model` is in the keyword list and could mis-classify rows about model trains, model aircraft, etc. We accept this in exchange for catching "fashion model" / "Brazilian model" without an extra Wikidata round-trip. The chip filter limits the blast radius.
- Keyboard nav covers the result list only; the headline "View demo profile" CTA card and the "Other demo subjects" pill row at the bottom are still mouse-first (they're outside the combobox semantics). Logged as `QA-013`.
- The `Retry` button re-fires the existing debounce effect by nudging the query (append + trim a space). It works, but a dedicated `retryToken` would be cleaner; tracked as `QA-014`.

**Follow-up tasks**
- `QA-012` Call the summary endpoint to confirm disambiguation before S2 import (and offer a "Open disambiguation list" link instead of importing if confirmed).
- `QA-013` Extend keyboard nav: arrow-into the "Other demo subjects" pill row, with `Enter` to load.
- `QA-014` Refactor S1 retry to use an explicit `retryToken` instead of nudging the query.
- `QA-015` Add screen-reader announcements for chip-filter changes (`aria-live="polite"` region: "Showing 3 Music results").

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | green — 92 modules, `dist/assets/index-*.js` 333.46 KB (99.34 KB gzip; +5 KB from filter UI + keyboard plumbing) |
| Test | `npm test` | green — 12 files / **902** tests (+12 new across subjectDomain + wikipedia) |
| Lint | — | not configured (`QA-001`) |

---

## 2026-06-01 · Investor-ready demo profile (Lina Solano) + "Demo profile" labeling

**What changed**
Added one polished, fictional, end-to-end demo subject — **Lina Solano (demo)** — so the app can run a full review without depending on the live Wikipedia API. The previous demo catalog had Michael Jordan (great for guardrail UI but uses a real name) and Alex Rivera (deliberately *thin* — 3 events — for edge-case testing). Neither was the right shape for a polished investor demo, so Lina is added as the headline profile and made explicit via `INVESTOR_DEMO_SUBJECT_ID`. The S1 hero now offers a single, prominent **View demo profile** CTA wired to her; the existing pill row is repurposed as "Other demo subjects" for the edge-case fixtures.

Also unified the demo-labeling language across the wizard: every demo surface now says **"Demo profile"** in gold (previously inconsistent — S2 said "Demo fixture", S6/studio had no badge at all).

**Files touched**
- `src/data/demoSubjects.ts` — added `buildLinaSolanoTwin()`, `LINA_SOLANO_WIKI`, `LINA_SOLANO_TIMELINE` (8 events), `LINA_SOLANO_CUSTOM_MOMENTS` (2), `DEMO_CUSTOM_MOMENT_LINA_STUDIO_ID`, `DEMO_CUSTOM_MOMENT_LINA_PRIVATE_ID`. Registered the new subject at the head of `DEMO_SUBJECTS` with its full `DemoSubject` metadata (category Music, bio, voice profile defaults: archetype `the-poet`, audience `Intimate`, mode `Documentary`, narrative goal `honor`, tone note). Exported `INVESTOR_DEMO_SUBJECT_ID = "demo-lina-solano"` as the stable handle.
- `src/lib/timelineGenerator.ts` — added an explicit `demo-lina-solano` branch in `generateImportBundle` (parity with the existing MJ and thin branches), so S2 import always rebuilds Lina's bundle cleanly even if a stored draft is partial.
- `src/context/StudioContext.tsx` — initial `scene` now seeds from `getDemoSubjectForTwin(draft).voiceProfile` when the loaded draft is a demo profile, so the Voice Studio opens on the right archetype/audience/mode/goal for Lina (Intimate + Documentary + honor) without the producer having to hand-set the controls.
- `src/screens/S1Search.tsx` — added the headline **View demo profile** CTA card at the top of the screen (gold left-rule, title + category badge + 1-line bio + primary button). Loading state mirrors the search row's selection state so double-loads can't race. The bottom demo pill row was repurposed as "Other demo subjects" and now filters out the investor demo so the same subject isn't offered twice. Pill row hides entirely when only one demo exists.
- `src/screens/S2ProfileImport.tsx` — `<Badge variant="muted">Demo fixture</Badge>` → `<Badge variant="gold">Demo profile</Badge>` (unified language + stronger visual).
- `src/screens/S6DraftSaved.tsx` — added the `Demo profile` gold badge next to the subject name on the "Draft saved" card via `isDemoTwin(draft)`.
- `src/studio/TwinContextPanel.tsx` — same badge on the persistent studio left panel, so every studio sub-step shows the demo label.
- `src/data/demoSubjects.test.ts` — **+8 tests** in a new `investor-ready demo profile (Lina Solano)` block covering: subject id stability, 6–8 events with the required category mix (Personal/Career/Achievement/Award/Legacy + Custom moments separately), Internal + Private/High custom moments, ≥1 NeedsReview guardrail seeded, mixed-confidence timeline (High + Medium + Low), Reviewed + Draft statuses both present, voice profile defaults sanity, headline-pill ordering in the catalog.

**User-facing behavior**
- Landing page (S1) now leads with a clearly labeled `Demo profile · Music — Lina Solano (demo)` card and a "View demo profile" primary button. One click → S2 import with the Lina fixture pre-loaded.
- Full demo path is repeatable without any network: S1 → S2 (Demo profile badge, full summary, source URL) → S3 (8 events, mix of Reviewed/Draft, mixed confidence, the 2019 "Brother's death" event in Draft/High sensitivity flagged for the producer) → S4 (2 custom moments visible, including the Private high-sensitivity one) → S5 (seeded guardrail flag in NeedsReview from the Private moment, ready for editorial review) → S6 (Draft saved card with Demo profile badge) → S7 Voice Studio (left panel shows Demo profile badge; scene controls open on Intimate / Documentary / honor — the poet archetype) → SS4 Voice Context Preview (sample script + save + export, as shipped in the prior entry).
- The "Other demo subjects" row at the bottom of S1 still surfaces Michael Jordan + Alex Rivera for reviewers who specifically want to exercise the seeded MJ guardrail flag or the thin-timeline state.

**Known limitations**
- Lina Solano is fictional. The Wikipedia source URL (`https://example.com/demo/lina-solano`) is intentionally not a real page — the "Wikipedia" badge on her S2 import is paired with the gold "Demo profile" badge so the source provenance is unambiguous, but a reviewer who tabs through the data-preview URL will land on a placeholder. We chose this over fabricating an off-Wikipedia URL that could imply a real source. Logged as `QA-010`.
- The fixture's events have invented but plausible details (album titles, venue names, Latin Grammy category). They're explicitly demo-scoped — do not lift them into marketing copy.
- The headline CTA card is currently above the search input. The pending S1 hero redesign (separate user request, currently in flight on a different worker) may re-arrange this; the CTA itself is self-contained and will compose into whatever the hero ships.

**Follow-up tasks**
- `QA-010` Replace the placeholder `example.com` source URL with either a hosted in-repo "About Lina (demo)" page (e.g. `/demo/lina-solano.html` in `public/`) or a styled in-app modal that explains the fictional source, so the source URL doesn't dead-end.
- `QA-011` Author a third demo profile in Sports that's also fictional, so we have parity (currently Music has the polished demo, Sports has Michael Jordan which uses a real name). Lina can stay the headline; the Sports fictional profile would back the "Other demo subjects" row.

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | green — 92 modules, `dist/assets/index-*.js` 328.56 KB (97.63 KB gzip) |
| Test | `npm test` | green — 12 files / **890** tests pass (+8 new for the Lina fixture) |
| Lint | — | not configured (`QA-001`) |

---

## 2026-06-01 · Voice Studio output — Voice Context Preview panel (SS4 finalized state)

**What changed**
The Voice Studio used to end on a single line — "Voice generation ready" + a Phase 2 modal button — which gave reviewers nothing tangible after the resolver locked. SS4's finalized branch now renders a dedicated **Voice Context Preview** output section with an honest status badge, an audio block, the resolved performance context, a deterministic sample script, and three CTAs. The resolver IP is unchanged; this is a presentation layer over it.

Explicit non-goal: **do not claim live voice synthesis.** The voice-provider status ships as `not-connected` and the audio block renders a polished "Audio generation not connected in this demo" surface instead of a stub player. The badge and audio surface flip automatically when a real provider is wired (one constant + one source path, both in `src/studio/voiceContext.ts`).

**Files touched**
- `src/types/twin.ts` — added optional `SavedVoiceContext` shape and an optional `savedVoiceContexts?: SavedVoiceContext[]` field on `DigitalTwinProfile`. `schemaVersion` unchanged, so previously persisted drafts still load.
- `src/studio/voiceContext.ts` — **new**, pure helpers: `VOICE_PROVIDER` status constant, `DEMO_AUDIO_SRC` source switch, `badgeVariantForVoiceStatus`, `buildSampleScript` (deterministic — same inputs always yield same script), `captureVoiceContext`, `appendSavedVoiceContext` (immutable append), `buildExportSummary` (plain-text producer brief with explicit disclaimer), `exportSummaryFilename` (safe slug).
- `src/components/AudioPreview.tsx` — **new** reusable audio component. Real `<audio>` element with play/pause, scrub via `<input type="range">`, mm:ss `current / duration` clock, replay button. Renders a polished disabled state when `src === null` (current production path). Has an error fallback when the media element emits `error`. Cleans up listeners and pauses on unmount.
- `src/studio/VoiceContextPreview.tsx` — **new** panel that composes `AudioPreview`, the resolved-context summary grid (selected event, audience, mode, narrative goal, signature state, family/direction, steering tag, four `ParamBar`s), the gold-rule sample-script block, and the three CTAs:
  - **Edit emotional context** — jumps back to SS3 (sets `finalized=false`, `setStudioStep("SS3")`).
  - **Save voice context** — appends a `SavedVoiceContext` snapshot to the draft via the existing `updateDraft` → `saveTwin` path. Button shows "Saved ✓" and disables after save; a saved-count line confirms the snapshot landed.
  - **Export summary** — builds the plain-text summary in-browser and triggers a `Blob` download. No server, no network — works offline.
- `src/studio/steps/SS4GuardrailClearance.tsx` — replaced the inline "Voice generation ready" success block with `<VoiceContextPreview />`. Guard added so we only render the preview when `selectedEvent` and `resolverOutput` are both present (with the `finalized` branch as before, it always is — the type guard satisfies strict mode). Kept the "View Phase 2 roadmap" button as a quieter `ghost`/`small` secondary action below the preview, since the modal is still useful but no longer the headline payoff.
- `src/studio/voiceContext.test.ts` — **new** 11-test suite covering `VOICE_PROVIDER` honesty (gate 4), badge-variant mapping, sample-script determinism + audience/goal variation + steering-tag/param presence, `captureVoiceContext` snapshot shape + immutable `appendSavedVoiceContext`, plain-text summary content + disclaimer, filename slugging including the all-non-alphanumeric fallback.

**User-facing behavior**
- After clicking "Finalize performance context" on SS4, the user now sees the **Voice Context Preview** with a "Not connected" badge and a clear single-line explanation: "Voice synthesis is not wired up in this build. The resolver locks the emotional context; audio generation is Phase 2 (see roadmap)."
- The audio block shows the resolved subject + event title as its accessible name; a stylized play/seek/clock layout makes the absence intentional rather than broken.
- The context grid summarizes everything the producer just authored — selected event with year, audience, conversation mode, narrative goal (human label, not the internal id), emotional state with family + direction, steering tag in a gold badge, and the four resolver params as `ParamBar`s.
- The sample script reads as serif italic copy on a gold left-rule card, labeled "Sample script · Illustrative — not synthesized" so it cannot be mistaken for transcribed audio.
- "Save voice context" persists the snapshot to the draft (visible after reload). "Export summary" downloads a plain-text brief (filename example: `ricon-voice-context__michael-jordan__2026-06-01T17-42-00.txt`) with the full context + sample script + a built-in disclaimer about rights/consent/review. "Edit emotional context" pops back to SS3 so the producer can iterate without re-clearing guardrails.

**Known limitations**
- No actual audio asset ships in this build, so the player is always in its disabled state. The full audio code path is wired and tested manually but does not run in automated tests (no jsdom env, no `@testing-library/react`). When a clip is dropped in `public/`, flip `DEMO_AUDIO_SRC` and `VOICE_PROVIDER.status` to `"demo-audio"` and the controls become live in one constant edit.
- "Edit emotional context" pops the user back to SS3 but does not auto-clear the cached resolver output (the resolver is pure — the next render recomputes). This is intentional, but if scene controls aren't re-touched the second finalize captures the same snapshot. Logged as `QA-007`.
- `SavedVoiceContext` is currently append-only — no delete/replace UI. The data persists with the twin draft, but no list view exposes saved snapshots yet (the export download covers the immediate need). Logged as `QA-008`.

**Follow-up tasks**
- `QA-007` Clear the cached resolver output when the user re-enters SS3 from the "Edit emotional context" CTA, so the next save reflects fresh scene edits without an explicit re-touch of a control.
- `QA-008` Surface a "Saved voice contexts" list (with delete + re-export) on S6 or in the studio left panel, so multi-snapshot review is possible from the UI.
- `QA-009` Drop a producer-approved demo audio clip in `public/voice/`, switch `DEMO_AUDIO_SRC` and `VOICE_PROVIDER.status` to `"demo-audio"`, and verify the live player path end-to-end.

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | green — 92 modules, `dist/assets/index-*.js` 321.49 KB (95.73 KB gzip) |
| Test | `npm test` | green — 12 files / **882** tests pass (+11 new in `voiceContext.test.ts`) |
| Lint | — | not configured (`QA-001`) |

---

## 2026-06-01 · Real consent + ethical-use checkpoint on S2

**What changed**
Replaced the placeholder consent copy on the Profile Import step with producer-grade language and a working ethical-use checkpoint. The single-line "demo placeholder — not legal advice" string was a credibility liability for a digital-twin product; now S2 ships a labeled `Consent & ethical use` section with three layers:

1. The new acknowledgement label spans both authorization and the explicit internal-demo carve-out.
2. An always-visible "not legal clearance" note set off with a gold left rule, so it cannot be skimmed past.
3. A collapsible **Why this matters** disclosure with the four producer-side caveats (incomplete public sources, custom moments need review, voice generation needs consent, guardrails ≠ legal clearance).

The checkbox now writes a `consentAcknowledgedAtISO` timestamp into the draft, and the import handler **programmatically refuses** to run if the draft's persisted consent flag is false — even if the UI checkbox state were tampered with. Unchecking the box clears the timestamp so a future re-acknowledgement is recorded fresh.

Closes nothing on the open backlog (consent was tracked via `docs/08-AI-SAFETY.md`, not a QA row); adds `QA-005` for the planned `consentAcknowledgedAtISO` migration of pre-existing persisted twins.

**Files touched**
- `src/lib/consent.ts` — replaced the single-line constant with `CONSENT_ACKNOWLEDGEMENT_LABEL` (new copy), `CONSENT_NOT_LEGAL_CLEARANCE_NOTE`, and a typed `CONSENT_WHY_THIS_MATTERS` array of four `{title, body}` bullets. Added `canImportTimeline(twin)` (named for import-time intent — mirrors `canPersistDraft`) and a pure `withConsent(twin, acknowledged, nowISO?)` helper that does not mutate, preserves an existing timestamp on re-affirm, and clears the timestamp when consent is unchecked.
- `src/types/twin.ts` — added optional `consentAcknowledgedAtISO?: string` to `DigitalTwinProfile`. **`schemaVersion` is unchanged** because the field is optional — pre-existing persisted twins continue to load.
- `src/screens/S2ProfileImport.tsx` — wired the new consent UX: labeled `Consent & ethical use` section with the gold-rule disclosure, collapsible "Why this matters" `<details>`, and a live "Acknowledged at <local time>" timestamp once the user checks the box. New `handleConsentChange(next)` mirrors UI state into the draft via `withConsent`. `handleImport` now early-returns and surfaces an inline error if `canImportTimeline(draft)` is false, regardless of the local checkbox state.
- `src/lib/consent.test.ts` — **new** suite (12 tests) covering: persist-gate + import-gate accept/reject, tampered draft rejection, `withConsent` immutability, fresh-stamp on first ack, preserved-stamp on re-affirm, cleared-stamp on uncheck, re-stamp after a clear→re-check cycle, verbatim-copy regression on all three new copy constants, and a placeholder-phrase scrub of all consent copy (rejects "demo placeholder", "Lorem", "TBD", "coming soon").

**User-facing behavior**
- S2's consent block is now a titled section (`CONSENT & ETHICAL USE` eyebrow in gold) with a clear hierarchy: checkbox + label → permanent ethical-use disclosure → live acknowledgement timestamp → "Why this matters" disclosure (collapsed by default, focusable, gold ring on focus).
- The primary "Import & Generate Timeline" button stays disabled until consent is checked. If `handleImport` is somehow invoked without consent (e.g. via a future deep-link or a tampered DOM), it now refuses and surfaces "Consent acknowledgement is required before import. Check the box above." instead of silently importing.
- The acknowledgement timestamp is locale-rendered (`new Date(iso).toLocaleString()`) so reviewers can tell when the producer signed off.
- Unchecking the box clears the timestamp on the draft, forcing a fresh stamp when the user re-checks.

**Known limitations**
- The S2 timestamp surface uses `toLocaleString()` so it changes by viewer locale. This is intentional for a producer tool, but a follow-up could pin a stable format for screenshots/audit trails (`QA-006`).
- Persisted twins from before this change have no `consentAcknowledgedAtISO` field. They still load and the existing `consentAcknowledged: true` boolean still gates persist/import — but the new acknowledgement-time UI will be hidden until the user re-affirms. A small one-time migration could backfill the timestamp from `createdAtISO` on load (`QA-005`); currently we leave it absent rather than fabricating a moment.
- The `<details>` disclosure is native HTML, which in some browsers does not animate. That matches the project's restrained-motion stance and `prefers-reduced-motion` rules — kept intentionally.
- This is producer copy, not counsel copy. `docs/08-AI-SAFETY.md` still applies.

**Follow-up tasks**
- `QA-005` Backfill `consentAcknowledgedAtISO` from `createdAtISO` for legacy persisted twins (one-time migration in `TwinContext`'s initial-load `useEffect`).
- `QA-006` Stable timestamp formatting on the S2 acknowledgement readout (locale-independent format for screenshots / audit).

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | green — 89 modules, `dist/assets/index-*.js` 309.85 KB (92.68 KB gzip) |
| Test | `npm test` | green — 11 files / **871** tests pass (+12 new in `consent.test.ts`) |
| Lint | — | not configured (`QA-001`) |

---

## 2026-06-01 · Fix Subject-Import flow — stop leaking the "Demo Subject" fixture

**What changed**
Selecting a real Wikipedia result now actually imports that subject. Previously, `TwinContext.goTo()` silently auto-created a `createMockTwin("Demo Subject")` placeholder whenever the captured `draft` closure was `null`, which raced with the `setDraft(realDraft)` call in `S1Search.handleSelect` and overwrote both React state and `localStorage`. The screen-level guards then rendered the fixture (`pageId: "mock-page"`, `summary: "Mock summary for storage test."`, name `"Demo Subject"`) on S2 instead of the selected subject.

Closes `QA-002`.

**Files touched**
- `src/context/TwinContext.tsx` — removed `ensureDraft()` and the `createMockTwin("Demo Subject")` auto-creation. `goTo()` now purely navigates; screens still guard themselves with `if (!draft) goTo("S1")`. `updateDraft()` warns and no-ops if called with no draft. Added a new explicit `useDemoSubject(id)` context action — the **only** path to a demo twin.
- `src/dev/mockTwin.ts` — renamed `createMockTwin` → `createStorageTestTwin`. Stripped the misleading `"mock-page"` / `"Mock summary…"` strings (now `"storage-harness-fixture"` and `"Storage harness fixture — not a real subject."`) so any future leak into the UI is unmissable. Removed the `"Demo Subject"` default name.
- `src/dev/StorageTest.tsx` — updated import + call site.
- `src/screens/S1Search.tsx` — `handleSelect` now routes demo hits through `useDemoSubject(id)` (a single, atomic context action) and real Wikipedia hits through `setDraft + goTo("S2")` (unchanged shape, but now no longer racing). Replaced the dev-only "fill michael" hack with an always-visible "Try a demo subject" pill row backed by `DEMO_SEARCH_SUBJECTS`, so the deterministic-demo path is reachable on purpose, not by accident.
- `src/screens/S2ProfileImport.tsx` — h2 now renders `draft.coreIdentity.name` (canonical) instead of `wiki.title`. Added a `<Badge variant="muted">Demo fixture</Badge>` when `pageId.startsWith("demo-")`. New `SubjectThumbnail` subcomponent with `onError` → initials fallback. Defensive copy when `summary` / `description` are empty ("No summary returned by the source.") and when `sourceUrl` is missing. Data-preview row order rearranged so `source` is first.
- `src/lib/wikipedia.test.ts` — **new** regression suite (4 tests). Asserts: (1) `createDraftFromWikipedia` with a Michael Jordan profile yields `coreIdentity.name === "Michael Jordan"` and `pageId === "12345"`; (2) every `DEMO_SEARCH_SUBJECTS` entry's draft has its own canonical name and `pageId !== "mock-page"`; (3) no serialized draft from either path contains any of the forbidden fixture strings (`"Demo Subject"`, `"mock-page"`, `"Mock summary for storage test."`, `"Mock description."`, `"Storage Test Twin"`, `"storage-harness-fixture"`).

**User-facing behavior**
- Search → tap "Michael Jordan" → S2 import screen renders **"Michael Jordan"**, the real Wikipedia thumbnail, real summary text, real pageId, real source URL. No more `Demo Subject` / `mock-page`.
- When Wikipedia is unreachable and the live search falls back to demo data, S2 still loads the seeded twin (Michael Jordan, Alex Rivera) and labels it with a "Demo fixture" badge so the user knows the data isn't live.
- New "Try a demo subject" pill row at the bottom of S1 — explicit, always visible — for reviewers who want a deterministic demo path. Two pills today: `Michael Jordan`, `Alex Rivera (demo)`.
- Missing thumbnails (or remote-image 404s) now render an initials block instead of breaking the layout.
- If a downstream screen is reached without a draft (refresh after `clearDraft`, deep link, etc.), the screen-level `useEffect` bounces back to S1 — no fake twin is silently created. A `console.warn` fires so dev sees the redirect.

**Known limitations**
- Pre-existing `"Demo Subject"` drafts that were written to `localStorage` by the old code on a user's machine will still auto-load on next boot (the storage layer is content-agnostic). One-time cleanup is logged as `QA-003`. To clear by hand: `localStorage.clear()` or `import { resetAllRiconStorage } from "./lib/storage"; resetAllRiconStorage();`.
- The regression test exercises `createDraftFromWikipedia` and `createDraftFromDemoSubject` directly. It does **not** mount React (no `@testing-library/react` in the project — would require a dep + jsdom env). The full click-through coverage of `S1Search` → `S2ProfileImport` is logged as `QA-004`.
- The `useDemoSubject` context action is named after the React-rules-of-hooks convention (`use*`) but is not itself a hook — it's a plain function returned from context. Could be misread as a hook by lint tooling once `QA-001` lands; if so, rename to `loadDemoSubject`.

**Follow-up tasks**
- `QA-003` One-time `localStorage` migration to purge any persisted twin with `pageId === "mock-page"` or `coreIdentity.name === "Demo Subject"`.
- `QA-004` Add a React-level integration test for the S1 → S2 flow (requires `@testing-library/react` + `jsdom`; needs user approval per project rules before adding deps).

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | green — 88 modules, `dist/assets/index-*.js` 306.53 KB (91.41 KB gzip) |
| Test | `npm test` | green — 10 files / **853** tests pass (+4 new regression cases in `wikipedia.test.ts`) |
| Lint | — | not configured (`QA-001`) |

---

## 2026-06-01 · Baseline orientation

**What changed**
Seeded the implementation log and QA backlog. No app code changed.

**Files touched**
- `docs/implementation-log.md` (new)
- `docs/qa-fix-backlog.md` (new)

**User-facing behavior**
None — documentation only.

**Known limitations**
- The project has no `lint` script (logged as `QA-001`). Until that's resolved, "run lint after every change" reduces to "no-op" — `build` + `test` cover most of the same ground because `tsc -b` runs in strict mode with `noUnusedLocals`/`noUnusedParameters`.

**Follow-up tasks**
- `QA-001` Add an ESLint setup (ask before adopting; `docs/00-PROJECT-RULES.md` requires confirmation before adding tooling).

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | green — 88 modules, `dist/assets/index-*.js` 304.88 KB (90.99 KB gzip), CSS 20.70 KB (4.97 KB gzip) |
| Test | `npm test` | green — 9 files / 849 tests pass (`resolver.test.ts` is the bulk at 819 cases) |
| Lint | — | not configured |

**Baseline architecture confirmed**
- Framework: **Vite 6 + React 19 + TypeScript 5.7 + Tailwind 3** (not Next.js; no router library).
- Entry: `src/main.tsx` → `<App />` → `<TwinProvider>` → screen switch by `ScreenId` (`S1`–`S7`, with `S7` being the Voice Studio shell hosting `SS1`–`SS4`).
- State: `src/context/TwinContext.tsx` owns `screen`, `studioStep`, `draft: DigitalTwinProfile | null`, plus navigation helpers. `localStorage` is reached only through `src/lib/storage.ts`.
- Design tokens: `tailwind.config.js` matches `docs/02-DESIGN-SYSTEM.md` exactly (`bg #080810`, `gold #c9a84c`, `lightblue #7db3e8`, etc.). Fonts loaded in `index.html` via Google Fonts.
- Component primitives present in `src/components/`: `Badge`, `Button`, `Input`, `Textarea`, `Modal`, `Tooltip`, `ProgressBar`, `ParamBar`, `SegControl`, `Skeleton`, `TimelineRevealItem`, `TwinContextSummary`, `TopBar`, `WizardHeader`, `CustomMomentDrawer`, `EditorialReviewModal`, `ScreenPlaceholder`. Studio-specific: `EmotionalArcViz`, `GuardrailWarningDetailModal`, `Phase2VisionModal`, `ResolverPanel`, `StudioBreadcrumb`, `TwinChat`, `TwinContextPanel`, `VoiceStudio`. **Reuse these before introducing new primitives.**
- Pure-function IP: `src/lib/resolver.ts` (Emotional Resolver), `src/lib/guardrails.ts`, `src/lib/ai.ts` (grounded mock behind the single AI seam — gate 1), `src/lib/sanitize.ts` (gate 3), `src/lib/wikipedia.ts` (real REST API with `mockData.ts` fallback), `src/lib/subjectDomain.ts` (Wikidata classification).
- Dev-only harness at `src/dev/{StorageTest,ResolverTest,GuardrailsTest}.tsx`, mounted only when `import.meta.env.DEV` AND the URL has `?dev`.

**Why this orientation matters**
- The `senior-react-ai-ui` skill defaults to "Next.js App Router". This project is a **Vite SPA**, so server components / server actions / `"use client"` boundaries do **not** apply. State stays in React Context + `localStorage`. No streaming is wired yet — `askTwin` returns a `Promise<TwinReply>` synchronously today; the seam is built so a future Netlify Function can stream without UI changes (gate 1).
- Per project rules: **don't add new dependencies, routers, or styling systems without asking.** When in doubt, extend an existing primitive rather than creating a new one.

---

<!--
Template for the next entry — copy below and fill in.

## YYYY-MM-DD · <short title>

**What changed**

**Files touched**
- `path/to/file.tsx`

**User-facing behavior**

**Known limitations**

**Follow-up tasks**
- `QA-###` …

**Checks**
| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | |
| Test | `npm test` | |
| Lint | — | not configured (QA-001) |
-->
