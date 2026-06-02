# Known Limitations — RICON Storyline Studio

Explicit boundaries of the **current POC** so future work does not accidentally treat demo behavior as production-ready. For architecture and safety gates, see [`00-PROJECT-RULES.md`](00-PROJECT-RULES.md) and [`08-AI-SAFETY.md`](08-AI-SAFETY.md).

---

## Product scope

| Area | Limitation |
|---|---|
| Audience | Investor/partner **vision demo**, not production infrastructure |
| User roles | Single producer flow only; no auth, accounts, or permissions |
| Routing | Screen state in React context — **no deep links**, refresh returns to boot behavior (draft may rehydrate from `localStorage`) |
| “For Talent” | Removed; app is producer-only |
| Legal | Consent copy is a **placeholder**; counsel must approve before real use |
| Voice output | **No TTS / realtime voice** in this build; Phase 2 roadmap modal only |

---

## Data & persistence

| Area | Limitation |
|---|---|
| Primary store | Browser **`localStorage` only** — quota, private browsing, and clear-site-data can wipe drafts |
| Multi-device | No sync unless remote service is configured and backend exists (`09-MONGODB-READINESS.md`) |
| Conflict resolution | None — last write wins per browser |
| Media attachments | Images/videos stored as **data URLs inside JSON** — small caps (~1 MB image, ~2 MB video per file, ~8 attachments, ~3 MB total per moment); unsuitable for MongoDB documents |
| Remote mirror | `mirrorTwinToRemote()` is a **no-op** until `configureTwinRemoteStorage()` is called with a live API |
| Schema | Only V1→V2 migration implemented; unknown versions are dropped on read |
| Orphan twins | `deleteActiveDraft` only removes the active pointer’s twin; corrupted orphans need `resetAllRiconStorage()` |

---

## Wikipedia & timeline generation

| Area | Limitation |
|---|---|
| Source | Live **English Wikipedia REST API**; no other biography backends |
| Heuristic timeline | Sentence + year parsing from summary — **often thin or empty** for real subjects |
| Demo vs live | Demo subjects use **curated** timelines; live path quality varies widely |
| Facts | No fact-checking service; confidence is heuristic, not verified journalism |
| Emotional depth | Public articles skew career facts; **emotional/private moments** require S4 custom moments |
| Revision pinning | `revisionId` captured when available but not continuously re-synced |

---

## Guardrails & editorial review

| Area | Limitation |
|---|---|
| Engine | Rule-based regex/field checks (`GUARDRAIL_RULES`) — not ML moderation |
| Save policy | Only **High** severity `NeedsReview` blocks save; Medium/Low may remain open or deferred |
| Legal clearance | UI explicitly states editorial review **≠** legal approval |
| Defer | High-severity flags **cannot** be deferred |
| Re-evaluation | Returning from S4 may regenerate flags; producer must re-resolve |

---

## Emotional Resolver

| Area | Limitation |
|---|---|
| Nature | **Transparent scoring heuristics**, not a trained model — do not describe as “AI deciding” in product copy |
| Domains | Only **`sports`** and **`music`** configs ship |
| Archetypes | Fixed set per domain; no custom archetype authoring UI |
| Persistence | Resolver state is session-level in `StudioContext` until saved via Voice Context Preview |
| Warnings | Resolver warnings are **annotations**; hard blocks live in guardrail/clearance layers |

---

## AI & chat (gate 1 / 2)

| Area | Limitation |
|---|---|
| Connection | **No external LLM** — `src/lib/ai.ts` returns a **grounded mock** |
| API keys | None in client; Netlify Function stub exists but is inert |
| Grounding | Mock uses keyword overlap on approved timeline + custom moments; not semantic RAG |
| Refusal | Pattern-based; not red-team certified |
| Labels | Chat replies marked AI-generated; resolver copy is **not** (scoring model) |
| Server prompt | `<facts>` block spec documented for Phase 2 only |

---

## Voice Studio & audio

| Area | Limitation |
|---|---|
| Synthesis | `VOICE_PROVIDER.status === "not-connected"` — honest badge in UI |
| Demo audio | `DEMO_AUDIO_SRC` is `null` — no bundled clip |
| Sample script | **Deterministic template** from resolver + scene — not LLM prose |
| Session finalize | Locks context for **current session**; reopening studio does not auto-restore SS4 finalized UI |
| Twin Chat | Optional panel; mock latency/behavior only |

---

## Security & privacy (what is implemented vs not)

| Implemented (POC) | Not implemented |
|---|---|
| `sanitize.ts` on user free-text | Server-side validation |
| Consent gate before import/save | Identity verification |
| No client API keys | Rate limiting, abuse monitoring |
| Grounded mock refusals | SOC2 / audit logging |
| Injection pattern neutralization | WAF, CSP hardening beyond Vite defaults |

---

## UX & technical debt

| Area | Limitation |
|---|---|
| Lint | No ESLint script in repo (`QA-001` in `qa-fix-backlog.md`) |
| Tests | Vitest unit tests; no E2E browser suite in CI documented here |
| i18n | English only |
| Screenshots in docs | **No `docs/images/`** folder — product docs are text-only |
| Bundle | No code-splitting by screen; acceptable for POC size |
| Studio exit | Scene settings not fully persisted across S7 re-entry except `savedVoiceContexts` |

---

## Safe extension checklist

Before shipping a feature to production, verify:

1. **Schema** — bump `SCHEMA_VERSION` + migration + `storage.migration.test.ts`
2. **Storage** — only `storage.ts` touches `ricon:*` keys (except documented UI prefs)
3. **AI** — only `ai.ts` calls models; keys server-side only
4. **Media** — blob storage + references, not data URLs in MongoDB
5. **Guardrails** — add rules to `GUARDRAIL_RULES`, not one-off UI checks
6. **Copy** — gate 4 labelling and non-legal language preserved
7. **Docs** — update `product-flow.md`, `data-model.md`, and this file when behavior changes

---

## Phase 2 (explicitly out of scope)

Listed in `Phase2VisionModal` and architecture docs:

- OpenAI Realtime / ElevenLabs / XTTS voice synthesis
- Vector DB / memory layer for twin chat
- Authenticated API + MongoDB (or other) backing store
- Blob media CDN
- Multi-producer collaboration and audit trails

---

## Related documentation

| Doc | Topic |
|---|---|
| [`product-flow.md`](product-flow.md) | Screen-by-screen behavior |
| [`data-model.md`](data-model.md) | Entities and storage |
| [`09-MONGODB-READINESS.md`](09-MONGODB-READINESS.md) | Remote storage seam |
| [`qa-fix-backlog.md`](qa-fix-backlog.md) | Tracked follow-ups |
| [`implementation-log.md`](implementation-log.md) | What changed and when |
