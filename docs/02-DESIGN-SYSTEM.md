# 02 · Design System

The aesthetic is **cinematic, dark, editorial** — ESPN 30 for 30 meets a premium product tool. Near-black base, gold as the primary accent, light blue as secondary, restrained use of color.

## Fonts

Load via Google Fonts in `index.html`:
- **Display:** Bebas Neue — screen titles, big numbers, resolved-state names
- **Serif:** Cormorant Garamond (italic) — reason strings, evocative subtitles
- **Mono:** Space Mono — labels, metadata, tags, badges
- **Body:** Inter (400/500) — paragraphs, controls, descriptions

## Tailwind theme tokens

Add to `tailwind.config.js` under `theme.extend`:

```js
colors: {
  bg:        "#080810",
  surface:   "#0d0d1a",
  card:      "#111120",
  panel:     "#14142a",
  hover:     "#1a1a30",
  border:    "#1c1c2e",
  bordermid: "#252538",
  gold:      "#c9a84c",
  golddim:   "#7a6130",
  goldfaint: "#1c1608",
  blue:      "#4a90d9",
  bluedim:   "#1e3a5c",
  bluefaint: "#0a1522",
  lightblue: "#7db3e8",
  ok:        "#27ae60",
  okfaint:   "#071a10",
  danger:    "#c0392b",
  dangerfaint:"#1a0808",
  text:      "#e8e8f0",
  textsub:   "#8888aa",
  textmuted: "#5a5a78",
},
fontFamily: {
  display: ["'Bebas Neue'", "sans-serif"],
  serif:   ["'Cormorant Garamond'", "serif"],
  mono:    ["'Space Mono'", "monospace"],
  body:    ["Inter", "sans-serif"],
},
```

## Spacing & layout

- Content frame max-width: **680px** for wizard screens; the Voice Studio is a full-width **three-panel grid** (`220px · 1fr · 280px`).
- **Border radius (only these four):** `rounded-md` (controls), `rounded-lg` (cards), `rounded-xl` (modals/sheets), `rounded-full` (pills/chips). Avoid bare `rounded`.
- Borders are hairline on `border` / `bordermid`. **Accent borders:** `/40` resting, `/60` strong (e.g. `border-gold/40`, `border-gold/60`).
- Generous vertical rhythm. Don't crowd.

## Typography roles

- **Display** (`font-display`) — screen titles only.
- **Body** (`font-body`) — paragraphs and control labels.
- **`.label-mono`** — uppercase section eyebrows and form labels (12px, `text-label`).
- **`.meta-mono`** — metadata, counters, footnotes (11px, no uppercase).
- Reserve `text-[10px]` for bounded chips only (`Badge`, wizard stepper swatch).

## Component primitives (`src/shared/ui/`)

Each is a small typed component with all interaction states (default/hover/focus/active/disabled):

- `Button` — primary, secondary, ghost, danger. Sizes: default, small.
- `Card` — composition API (`Card.Header`, `Card.Title`, `Card.Meta`, `Card.Body`, `Card.Footer`) with `state` for review/guardrail tints and `selectable` for option cards.
- `Callout` — `tone="info" | "warning" | "neutral"` inline advisory blocks.
- `Checkbox`, `SearchInput`, `Disclosure` — form and progressive-disclosure shells.
- `Badge` + semantic wrappers (`SourceBadge`, `ConfidenceBadge`, …).
- `Input` / `Textarea` — dark fields, visible focus ring.
- `SegControl`, `ParamBar`, `Modal`, `Tooltip`, `EmptyState`, `LoadingState`, `ErrorState`, `RetryPanel`.
- `WizardActionBar` (`src/app/navigation/`) — sticky/fixed wizard + studio footers.

## Accessibility rules baked into primitives

- Focus states are **visible** (gold focus ring), not removed.
- Buttons and tappable cards are real `<button>`s or have `role="button"` + key handlers.
- AI output containers get `aria-live="polite"`.
- Minimum tap target 44×44px on touch.
- Never signal state with color alone — pair with text or an icon (e.g. guardrail status shows a word, not just a hue).

## Motion

Motion supports orientation and storytelling; it should not compete with content:
1. **Timeline reveal (S3):** events fade/slide in on scroll.
2. **Resolver reveal (S7):** the resolved feeling and parameter bars animate in when an event is selected.
3. **Flow entrances:** landing copy, search results, wizard screens, and Voice Studio sub-steps use short fade/slide entrances.
4. **Completion feedback:** completed wizard steps and locked voice context use a one-shot soft glow.
Keep transitions ~150–420ms, ease-out. Cap list staggering to the first six items. Every entry animation and completion glow must be gated by `prefers-reduced-motion`.
