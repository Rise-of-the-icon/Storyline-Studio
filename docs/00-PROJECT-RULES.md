# RICON Storyline — Voice Research Studio · Project Rules

> This file is the single source of truth Cursor reads on every task. Keep it open / pinned. If any instruction in a prompt conflicts with this file, this file wins unless the prompt explicitly says "override PROJECT_RULES".

---

## What we are building

A **proof-of-concept** web app: the RICON Voice Research Studio. A producer searches for a public figure, imports a verified profile, reviews an auto-generated timeline, enriches it with custom moments, clears guardrail flags, saves a digital-twin draft, then enters a **Voice Studio** where an **Emotional Resolver** turns a selected moment + scene context into a recommended emotional "feeling" with parameters and a steering tag.

This is a **vision-communication tool for investors and partners**, not production infrastructure. Mock data and manual workarounds are acceptable. But the four security/safety gates below are NOT optional, even for a POC.

---

## Non-negotiable gates (from the AI Five Challenge — do not build past these)

These are P0. If a task would violate one, STOP and flag it instead of proceeding.

1. **No API keys in client code, ever.** **CURRENT BUILD: the AI layer is NOT connected — the Digital Twin chat is a clearly-labelled mock (see `src/lib/ai.ts` stub). There is no Anthropic key in this build at all, which means there is nothing to leak.** This is the safest possible state and it is deliberate. The architecture is still built *as if* a server proxy will exist (the client only ever calls a local `ai.ts` helper, never an external API), so connecting real AI later is a one-file change with zero refactor. When AI is connected: all Anthropic calls go through a server-side route, the key lives in a server-only env var, and `fetch("https://api.anthropic.com...")` in any browser/client file is a bug. The kit is deployed on **Netlify** — when AI is turned on, the proxy must be a **Netlify Function**, never a client call.
2. **Verified-facts-only AI.** The Digital Twin AI must never state biographical facts that aren't grounded in imported timeline events or approved custom moments. Every AI feature ships with a system prompt that constrains it to provided context and refuses ungrounded/speculative questions. No AI feature is "done" until refusal behavior is tested.
3. **All user free-text is untrusted.** Any field a user types (custom-moment description, editorial notes, search query) must be treated as untrusted and sanitized before it is ever inserted into an AI prompt. Never concatenate raw user text directly into a system or user prompt without escaping/wrapping it as clearly-delimited data.
4. **Consent + AI-generated labelling.** The onboarding flow captures an explicit "talent consent / authorization" acknowledgement before import. Every AI-generated twin output carries a visible "AI-generated" label. Guardrail UI must never use language implying legal clearance (avoid bare "Approved" → prefer "Editorially reviewed").

---

## Tech stack (locked)

- **Framework:** React + Vite + TypeScript
- **Styling:** Tailwind CSS (tokens defined in `docs/02-DESIGN-SYSTEM.md`)
- **Deploy target:** **Netlify** (static site). The build must deploy as a static SPA with no server dependency in the current scope.
- **AI: NOT CONNECTED in this build.** The Digital Twin chat is a labelled mock returning canned, grounded responses from the twin's own timeline. It is wired behind a single `src/lib/ai.ts` interface so that swapping the mock for a real **Netlify Function** proxy later touches one file. Build the seam now; don't build the server now.
- **State:** React Context + local component state. Persistence via `localStorage`, namespaced per the data model.
- **Domains:** **both Sports and Music** ship from day one (the resolver config and demo data cover both).
- **Wikipedia:** the **real Wikipedia REST API** is used live for search and import. Local mock data is the demo *fallback*, not the primary path.
- **No backend database** in the POC. `localStorage` is the store.

Do not add libraries beyond this list without asking. No state-management libraries (Redux/Zustand), no UI kits, no CSS-in-JS.

---

## Coding standards

- **TypeScript strict mode on.** No `any` unless justified in a comment. Define types in `src/types/` and import them; don't redefine shapes inline.
- **One component per file.** Co-locate a component's styles and local helpers with it.
- **Functional components + hooks only.** No class components.
- **Named exports** for components except page-level/route entry points.
- **No `localStorage`/`sessionStorage` access scattered through components.** All persistence goes through a single `src/lib/storage.ts` module that wraps the data model. This keeps the schema in one place (see gate against schema drift).
- **Accessibility is not optional:** every interactive element is keyboard-reachable, has a visible focus state, and AI output regions use `aria-live="polite"`. Color contrast meets WCAG 2.1 AA.
- **Error/loading/empty states are part of "done."** A screen without its loading, empty, and error states is not complete. See `docs/05-STATES.md`.
- Keep functions small. If a component exceeds ~200 lines, split it.

---

## How to work with me (the human)

- **Build in the sequence in `docs/07-BUILD-SEQUENCE.md`.** Each step must run before the next begins. Do not scaffold five screens at once.
- After each step, **stop and tell me how to verify it** (what to click, what I should see). Don't move on until I confirm.
- When you make an assumption, **state it in one line** at the top of your response before the code.
- Prefer **small, reviewable diffs**. If a change touches more than ~3 files, explain the plan first.
- If something in these docs is ambiguous or looks wrong, **ask before guessing.** A wrong guess that compounds across steps is the most expensive failure mode here.

---

## File map (where things live)

```
docs/
  00-PROJECT-RULES.md      ← this file (also copied to .cursor/rules)
  01-ARCHITECTURE.md       ← folder structure, routing, data flow
  02-DESIGN-SYSTEM.md      ← tokens, fonts, component primitives
  03-DATA-MODEL.md         ← entities, types, localStorage schema
  04-SCREENS.md            ← all 7 screens + studio sub-steps, regions, behavior
  05-STATES.md             ← loading/empty/error/edge states per screen
  06-EMOTIONAL-RESOLVER.md ← the resolver logic spec
  07-BUILD-SEQUENCE.md     ← the ordered prompt list (the build plan)
  08-AI-SAFETY.md          ← the four gates in implementation detail
.cursor/rules/
  project.mdc              ← always-applied rule pointing at these docs
```
