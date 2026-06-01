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

- Content frame max-width: **680px** for wizard screens; the Voice Studio is a full-width **three-panel grid** (`220px · 1fr · 260px`).
- Border radius: 6px (controls), 8px (cards), 10–12px (containers), 20px (pills).
- Borders are hairline: `0.5px solid` the border token. Accent borders use a `2px` left border.
- Generous vertical rhythm. Don't crowd.

## Component primitives (build these first, in `src/components/`)

Each is a small typed component with all interaction states (default/hover/focus/active/disabled):

- `Button` — variants: primary (gold fill), secondary (outline), ghost, danger, success. Sizes: default, small.
- `Badge` — pill, color variants: gold, blue, ok, danger, muted.
- `Input` / `Textarea` — dark fields with hairline border, visible focus ring, placeholder in `textmuted`.
- `SegControl` — segmented single-select button group.
- `ProgressBar` — the 7-step wizard indicator (current = gold, done = checkmark).
- `ParamBar` — labelled 0–100 horizontal bar (intensity/warmth/pacing/confidence).
- `Modal` — centered overlay, dark scrim, close affordance, ESC + scrim-click to dismiss.
- `Tooltip` — hover popover for the source-confidence breakdown.
- `Mono` / `Label` — the small mono caption used everywhere.

## Accessibility rules baked into primitives

- Focus states are **visible** (gold focus ring), not removed.
- Buttons and tappable cards are real `<button>`s or have `role="button"` + key handlers.
- AI output containers get `aria-live="polite"`.
- Minimum tap target 44×44px on touch.
- Never signal state with color alone — pair with text or an icon (e.g. guardrail status shows a word, not just a hue).

## Motion

Two "wow moments" deserve real animation; everything else is subtle:
1. **Timeline reveal (S3):** events fade/slide in on scroll.
2. **Resolver reveal (S7):** the resolved feeling and parameter bars animate in when an event is selected.
Keep transitions ~150–400ms, ease-out. Respect `prefers-reduced-motion`.
