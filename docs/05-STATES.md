# 05 · State Catalog

A screen is not "done" until its loading, empty, error, and relevant edge states exist. This doc is the checklist. (Five Challenge: missing states are where POC demos break.)

## Global patterns
- **Loading:** skeleton shapes (not spinners) where content will appear; for AI/streaming, a typing indicator with a Stop control.
- **Empty:** a calm illustration/glyph + one line of guidance + (if relevant) a primary action.
- **Error:** human, on-brand copy + a retry affordance. Never a raw stack trace. Never blame the user.
- **Disabled:** explain *why* a CTA is disabled (helper text), don't just grey it out.

## Per screen

### S1 Search
- Default (empty input) · Typing · Loading results (skeleton cards) · Results shown · **No results** ("No results — try a different name") · **API failure** (fall back to local demo data, show a subtle "showing demo subjects" note).

### S2 Profile Import
- Loading profile · Profile ready · **Consent unchecked** (CTA disabled, helper text) · Importing (full loading state) · **Import error** (retry).

### S3 Timeline Review
- Loading events (skeleton timeline) · Events loaded · Filtering (incl. empty filter result) · **Thin timeline** (<5 events → surface "This profile has limited public events; consider adding custom moments" — Five Challenge U1) · None approved (CTA disabled) · Some approved.

### S4 Custom Moments
- No moments yet (empty) · Drawer open (add) · Drawer open (edit, pre-filled) · Moment saved · Validation error (title required) · **Untrusted-text caught** (if sanitizer flags suspicious input, accept the text but flag it; never execute it — gate 3).

### S5 Guardrail Review
- Flags pending · Reviewing (modal open) · **High-severity missing note** (clear disabled until note entered — gate 4) · All reviewed · Some rejected (return-loop messaging) · **No flags at all** (clean pass-through state).

### S6 Draft Saved
- Saving (loading) · Saved (default) · **Save error** (retry, don't lose the draft).

### S7 Voice Studio
- **No event selected** (right panel shows "Select an event to activate the resolver") · Event selected (resolver populated) · Resolver recomputing (brief) · **Guardrail warning present** (SS3 surfaces it; not a blocker, but labelled) · Finalized.
- If the Digital Twin AI chat is in scope: idle · streaming (typing + Stop) · **refusal** (twin declines an ungrounded question — this is correct behavior, style it as intentional, not an error) · error/retry.

## The thin-timeline reality (call it out, don't hide it)
Wikipedia is rich on career facts, thin on the emotional/behind-the-scenes moments that are the product's whole pitch. The **thin-timeline state in S3** and the **custom-moments emphasis in S4** are the product's honest answer to that gap. Design them to make the gap feel like a feature (the producer adds what databases can't), not a deficiency.
