# RICON Cursor Build Kit — Start Here

This kit gives Cursor everything it needs to build the Voice Research Studio properly, with the AI Five Challenge safety findings wired in as hard gates.

## Setup (do this once)
1. Create your repo. Copy the entire `docs/` folder and the `.cursor/` folder into the repo root.
2. Open the repo in Cursor. The `.cursor/rules/project.mdc` rule applies automatically on every request.
3. Open `docs/07-BUILD-SEQUENCE.md` — that's your worklist.

## How to build
- Paste the prompts from `07-BUILD-SEQUENCE.md` **one at a time, in order.**
- After each, run the "✅ Verify" check before continuing.
- If Cursor proposes something that breaks a gate in `08-AI-SAFETY.md`, it should stop and flag it — if it doesn't, paste: *"Does this violate any gate in docs/08-AI-SAFETY.md? If so, fix it."*

## The docs (read order)
| File | What it's for |
|---|---|
| `00-PROJECT-RULES.md` | Master rules — stack, standards, the four gates, working style |
| `01-ARCHITECTURE.md` | Folder structure, data flow, the AI request path |
| `02-DESIGN-SYSTEM.md` | Tokens, fonts, primitives, motion, a11y |
| `03-DATA-MODEL.md` | Types + localStorage schema + demo data |
| `04-SCREENS.md` | All 7 screens + 4 studio sub-steps + nav map |
| `05-STATES.md` | Loading/empty/error/edge states per screen |
| `06-EMOTIONAL-RESOLVER.md` | The resolver logic spec (the IP) |
| `07-BUILD-SEQUENCE.md` | The ordered prompt list — **work from this** |
| `08-AI-SAFETY.md` | The four gates, in implementation detail |

## The four gates (never violated, even in a POC)
1. No API keys in client code — **AI is NOT connected in this build; the twin chat is a grounded mock, so there's no key to leak.** The seam is built so real AI (a Netlify Function) drops in later as a one-file change.
2. Verified-facts-only AI — even the mock refuses ungrounded questions; this proves the trust behavior to investors today.
3. All user free-text is untrusted — sanitized before any prompt (mock included).
4. Consent capture (demo-stage placeholder, but a real gate) + "AI-generated" labels — guardrail UI never implies legal clearance.

## This build's key decisions
- **Deploy:** Netlify, static SPA.
- **AI:** not connected — grounded mock behind a single `src/lib/ai.ts` seam.
- **Domains:** both Sports and Music ship.
- **Wikipedia:** real live REST API, with local mock data as fallback so demos never dead-end.
- **Consent:** real blocking gate in the flow, placeholder legal copy in one swappable constant.

## Why this order
The resolver (the differentiating IP) is built and unit-tested **before** any UI depends on it. The data spine (types + storage + sanitize) is built before screens, so the schema lives in one place. The four gates are enforced from the first prompt that touches each risk, not bolted on at the end — which is exactly where the Five Challenge said POCs fail.
