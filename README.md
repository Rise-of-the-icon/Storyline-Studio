# RICON Storyline Studio

RICON Storyline Studio is a client-only React proof of concept for researching a public figure, curating an approved timeline, adding producer context, resolving guardrails, and preparing an emotionally directed Voice Studio context.

The current build is intentionally local-first: profile drafts persist in browser `localStorage`, Wikipedia search uses the public REST API with seeded demo fallbacks, and the AI chat remains a clearly labelled grounded mock behind the stable `src/lib/ai.ts` seam.

## Setup

```bash
npm install
npm run dev
```

Open the Vite URL printed by the terminal, normally `http://localhost:5173/`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server. |
| `npm test` | Run the Vitest suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run build` | Run strict TypeScript validation and create the production Vite bundle. |
| `npm run preview` | Preview the production bundle locally after a build. |

There is currently no lint script. Use `npm run build`, `npm test`, and `git diff --check` as the required verification baseline.

## Project Structure

```text
src/
  app/
    navigation/       # App header, wizard header, stepper, navigation helpers
    providers/        # Cross-feature application context
  features/
    search/           # S1-S2, Wikipedia search, subject classification
    timeline/         # S3 and timeline generation helpers
    custom-moments/   # S4, drawer, uploads, validation
    guardrails/       # S5 and editorial review modal
    saved-draft/      # S6 and saved-draft summaries
    studio/           # S7 Voice Studio shell, SS1-SS4, studio helpers
  shared/
    ui/               # Reusable visual primitives
    hooks/            # Reusable React hooks
  lib/                # Stable safety and domain seams
  services/           # Optional future remote-storage adapters
  data/               # Seeded demo profiles
  types/              # Shared contracts and persisted schema
  dev/                # Development-only test harnesses
```

Use the `@/` alias for imports rooted at `src/`. The old `src/components`, `src/screens`, and `src/studio` barrels remain as compatibility entrypoints while existing consumers transition.

## Start Here

1. Read [`docs/00-PROJECT-RULES.md`](docs/00-PROJECT-RULES.md) for the safety gates and locked stack.
2. Read [`docs/01-ARCHITECTURE.md`](docs/01-ARCHITECTURE.md) for data flow and feature ownership.
3. Start UI changes in the owning `src/features/` folder.
4. Reuse primitives from `src/shared/ui/`.
5. Keep persisted schema changes in `src/types/` and profile persistence changes in `src/lib/storage.ts`.

## Documentation

| File | Purpose |
|---|---|
| [`docs/product-flow.md`](docs/product-flow.md) | **Start here for behavior** — full producer flow per screen (S1–S7, consent, Voice Context Preview) |
| [`docs/data-model.md`](docs/data-model.md) | **Start here for types** — entities, storage keys, migrations, resolver shapes |
| [`docs/known-limitations.md`](docs/known-limitations.md) | POC boundaries and Phase 2 gaps |
| [`docs/00-PROJECT-RULES.md`](docs/00-PROJECT-RULES.md) | Locked stack, coding standards, and safety gates |
| [`docs/01-ARCHITECTURE.md`](docs/01-ARCHITECTURE.md) | Folder map, data flow, AI seam |
| [`docs/02-DESIGN-SYSTEM.md`](docs/02-DESIGN-SYSTEM.md) | Tokens, primitives, motion, accessibility |
| [`docs/03-DATA-MODEL.md`](docs/03-DATA-MODEL.md) | Short legacy type reference |
| [`docs/04-SCREENS.md`](docs/04-SCREENS.md) | Wizard screens and Voice Studio steps (regions) |
| [`docs/05-STATES.md`](docs/05-STATES.md) | Loading, empty, error, and edge states |
| [`docs/08-AI-SAFETY.md`](docs/08-AI-SAFETY.md) | AI safety implementation details |
| [`docs/09-MONGODB-READINESS.md`](docs/09-MONGODB-READINESS.md) | Optional future remote-storage seam |

## Safety Boundaries

- `src/lib/ai.ts` is the single client AI seam. The current build does not call an external AI provider.
- `src/lib/storage.ts` owns profile-draft persistence. `HowItWorksPanel` separately stores one non-profile UI preference for its disclosure state.
- `src/lib/sanitize.ts` treats producer text as untrusted data.
- `src/lib/resolver.ts` is the pure Emotional Resolver engine.
