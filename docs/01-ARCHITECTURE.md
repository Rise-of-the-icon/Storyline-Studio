# 01 · Architecture

## Folder structure

```
ricon-storyline/
├── netlify.toml               # Netlify build + (later) functions config
├── netlify/
│   └── functions/
│       └── twin-chat.ts       # STUB FOR LATER — the AI proxy. NOT wired in this build.
│                              # Lives here so connecting AI is a one-file change.
├── src/
│   ├── main.tsx               # app entry
│   ├── App.tsx                # screen switch + global providers
│   ├── types/
│   │   ├── twin.ts
│   │   └── resolver.ts
│   ├── lib/
│   │   ├── storage.ts         # the ONLY module that touches localStorage
│   │   ├── sanitize.ts        # untrusted-text sanitizer (gate 3)
│   │   ├── resolver.ts        # the Emotional Resolver engine (pure functions)
│   │   ├── guardrails.ts      # guardrail trigger evaluation
│   │   ├── wikipedia.ts       # real Wikipedia REST API client (search + summary)
│   │   ├── mockData.ts        # demo twins + Wikipedia fallback
│   │   └── ai.ts              # SINGLE AI SEAM. Currently a labelled mock.
│   │                          # Swap its body for a Netlify Function call to connect AI.
│   ├── context/
│   │   └── TwinContext.tsx
│   ├── components/
│   ├── screens/               # S1–S7
│   └── studio/                # SS1–SS4
└── docs/
```

## Data flow

1. **Search → Import.** The **real Wikipedia REST API** is queried live (`src/lib/wikipedia.ts`) — it's public and read-only, so client-side is fine; no key. Selecting a result stores a `DigitalTwinProfile` draft in `TwinContext`. If Wikipedia is unreachable, fall back to local demo subjects from `mockData.ts` so a demo never dead-ends.
2. **Timeline → Custom → Guardrails.** Each wizard step mutates the draft in `TwinContext` and persists via `storage.ts`. Nothing is committed permanently until "Save Draft."
3. **Save Draft.** The full `DigitalTwinProfile` is written to `localStorage` under its namespaced key.
4. **Voice Studio.** Reads the committed twin. The Resolver (`lib/resolver.ts`) is a **pure function** of its inputs — no side effects, no AI call — so it's instant and testable. The optional Digital Twin chat (if shown) calls `lib/ai.ts`, which is currently a **grounded mock** (no network, no key); the seam is built so a real Netlify Function can replace the mock later without touching the UI.

## The AI seam (gate 1) — currently a mock

The AI layer is **not connected** in this build. The Digital Twin chat calls one function in `src/lib/ai.ts`, which currently returns grounded mock replies built from the twin's approved timeline.

```
NOW (this build):
  Browser → src/lib/ai.ts (askTwin)
              └─ returns a canned, grounded reply or a grounded refusal. No network.

WHEN CONNECTED (later, one-file change to ai.ts):
  Browser → src/lib/ai.ts (askTwin)
              └─ POST /.netlify/functions/twin-chat   { context, userMessage }
                    └─ Netlify Function reads ANTHROPIC_API_KEY (server-only),
                       builds verified-facts-only prompt, sanitizes/delimits user text,
                       calls Anthropic Messages API → returns reply.
```

The UI never knows which path served the answer. The browser never holds a key. Connecting AI = editing the body of `askTwin` plus filling in `netlify/functions/twin-chat.ts`. Nothing else changes.

## Routing

POC uses a simple screen-state switch in `App.tsx` (no router library needed), mirroring the wireframe: `S1 → S2 → S3 → S4 → S5 → S6 → S7`, with back transitions and the S5→S4 rejection loop. If a router is later wanted, `react-router` is the only approved choice — ask first.
