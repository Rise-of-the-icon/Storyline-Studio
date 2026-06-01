# 06 · Emotional Resolver

The resolver is a **pure function**: `resolve(input: ResolverInput): ResolverOutput`. No AI call, no side effects. It lives in `src/lib/resolver.ts` and is the most testable part of the app — write unit tests for it.

> Honesty note (from the Five Challenge): the scoring weights below are **calibrated heuristics, not a trained model**. Keep them in one clearly-labelled config object so they're easy to tune and so the technical story stays honest. Do not describe this in the UI as "AI deciding"; describe it as a transparent scoring model.

## The model in one paragraph
Each input contributes weighted points across a domain's **emotion families**. The selected **archetype** then boosts its home families and damps the rest (its "resting voice"). Low source-confidence damps assertive/uplifting families; high topic-sensitivity penalizes celebratory/playful tones. The highest-scoring family wins; within it, a **signature leaf state** is chosen (the archetype's anchored state if it lives there, else the one whose energy best matches the user's intent). From the signature state's energy we derive a three-beat **arc** (ascending / settle / steady), then compute intensity, warmth, pacing, confidence, a human-readable **reason string**, and any **guardrail warnings**.

## Pipeline (implement in this order)
1. **Domain gate** — pick the family set, archetypes, and permissiveness for `sports` or `music`.
2. **Family scoring** — event + intent + mode each add a point-vector across families.
3. **Archetype anchor** — multiply the archetype's boost families ×1.35, damp families ×0.7.
4. **Confidence + sensitivity** — low confidence damps assertive/uplift families; high sensitivity multiplies celebratory/playful down.
5. **Argmax family** → **leaf selection** (anchored leaf wins, else energy-match to intent).
6. **Arc construction** — signature energy ≥60 → ascending (45%→72%→100%); ≤40 → settle (170%→125%→100%); else steady. If the peak is an anthem/prophetic/triumphant state, insert a `[breathe]` transition before it.
7. **Validation** — combination-rule check (≤3 tags/segment, ≤1 non-verbal, no contradictory families in one segment) + editorial guardrail warnings.

## Guardrail warnings the resolver emits (annotations, never hard blocks)
- High sensitivity + uplifting winning family → editorial flag.
- Low confidence + peak intensity > 65 → "temper or verify".
- Controversy/hardship event + intensity > 60 → "review for tone".
- Low confidence + assertive winner → "verify before performance".

These are surfaced in SS3; enforcement/blocking is the Guardrail system's job, not the resolver's.

## Config to externalize (so weights are tunable)
Put all of this in a single `RESOLVER_CONFIG` object at the top of `resolver.ts`:
- families per domain (with energy/warmth/pace per leaf state + the literal steering tag)
- archetypes per domain (boost families, damp families, anchor leaf, warmth/confidence deltas)
- event→family vectors, intent→family vectors, mode deltas
- sensitivity and confidence modifier tables
- opener/build pools and the "breath peak" set per domain

Two domains (sports + music) ship from day one; the domain switch swaps the entire config.

## Output parameters (derive, then clamp 0–100, round to int)
- **intensity** = (event.significance·0.35 + state.energy·0.5 + intent.energy·0.15) × sensitivityDamp × confidenceDamp
- **warmth** = state.warmth + archetype.warmthDelta + mode.warmthDelta
- **pacing** = state.pace + sensitivity.pacingDelta + mode.pacingDelta
- **confidence** = confidence.base·0.65 + state.energy·0.15 + archetype.confDelta + 12

## The reason string must feel biographical (Five Challenge U3)
Bad: "A peak achievement approached to celebrate." Good: weave in the actual event title and archetype, e.g. "Anchored on the 1998 final championship and voiced through The Closer's competitive register, the resolver lands on a triumphant, ascending delivery." Pull the real event title from the timeline, not a placeholder.

## Tests to write (this is the differentiating IP — prove it works)
- Determinism: same input → same output.
- Every input combination yields a valid family + leaf + 3 beats.
- Conflict cases resolve sensibly (e.g. celebratory intent + somber event + high sensitivity → not celebratory).
- Low confidence never produces a high-confidence assertive output.
- Each output includes a non-empty reason string referencing the actual event.
