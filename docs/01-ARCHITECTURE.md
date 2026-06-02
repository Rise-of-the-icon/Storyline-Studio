# 01 · Architecture

## Folder structure

```text
ricon-storyline/
├── netlify/
│   └── functions/
│       └── twin-chat.ts             # Inert future AI proxy stub
├── src/
│   ├── main.tsx                     # App entry
│   ├── App.tsx                      # Screen switch + global providers
│   ├── app/
│   │   ├── navigation/              # Wizard shell + navigation state
│   │   └── providers/               # Cross-feature application context
│   ├── features/
│   │   ├── search/                  # S1-S2, Wikipedia search, classification
│   │   ├── timeline/                # S3 + timeline generation helpers
│   │   ├── custom-moments/          # S4 + attachment and validation logic
│   │   ├── guardrails/              # S5 + editorial review UI
│   │   ├── saved-draft/             # S6 + draft summary logic
│   │   └── studio/                  # S7 Voice Studio + SS1-SS4
│   ├── shared/
│   │   ├── ui/                      # Reusable visual primitives
│   │   └── hooks/                   # Reusable React hooks
│   ├── lib/                         # Stable safety and domain seams
│   │   ├── storage.ts               # Profile-draft localStorage owner
│   │   ├── sanitize.ts              # Untrusted-text sanitizer (gate 3)
│   │   ├── resolver.ts              # Pure Emotional Resolver engine
│   │   ├── guardrails.ts            # Guardrail evaluation
│   │   ├── contentModel.ts          # Shared content-model helpers
│   │   └── ai.ts                    # Single client AI seam, currently mock
│   ├── services/                    # Optional future remote-storage adapters
│   ├── data/demoSubjects.ts         # Seeded demo profiles and fallbacks
│   └── types/                       # Shared contracts and persisted schema
└── docs/
```

Use the `@/` alias for imports rooted at `src/`. Compatibility barrels remain at `src/components/index.ts`, `src/screens/index.ts`, and `src/studio/index.ts` for older consumers.

## Data flow

1. **Search → Import.** `src/features/search/wikipedia.ts` queries the public Wikipedia REST API. If Wikipedia is unreachable, seeded profiles from `src/data/demoSubjects.ts` keep the demo path available.
2. **Timeline → Custom → Guardrails.** Each wizard step mutates the draft through `TwinContext` in `src/app/providers/TwinContext.tsx`. Profile persistence continues through `src/lib/storage.ts`.
3. **Save Draft.** The full `DigitalTwinProfile` is written to namespaced `localStorage`. Successful saves also pass through a dormant coordinator in `src/services/` for a future authenticated backend.
4. **Voice Studio.** `src/features/studio/` reads the committed twin. `src/lib/resolver.ts` remains a pure function with no side effects or AI call.

## Persistence boundaries

`src/lib/storage.ts` is the only owner of profile-draft persistence and schema migration. `src/features/studio/HowItWorksPanel.tsx` intentionally uses `localStorage` for one non-profile UI preference: whether its disclosure is open. That preference is optional, isolated, and safe to lose.

## The AI seam

The AI layer is not connected in this build. Voice Studio calls `src/lib/ai.ts`, which returns grounded demo responses built from approved timeline context.

```text
NOW:
  Browser → src/lib/ai.ts → grounded mock response

LATER:
  Browser → src/lib/ai.ts
              └─ POST /.netlify/functions/twin-chat
                    └─ server-only provider call
```

The UI does not know which path served the response, and the browser never holds an API key.

## Routing

The POC uses screen state rather than a router library: `S1 → S2 → S3 → S4 → S5 → S6 → S7`, with back transitions and the S5 → S4 rejection loop. `S7` contains the `SS1 → SS2 → SS3 → SS4` Voice Studio sub-flow.
