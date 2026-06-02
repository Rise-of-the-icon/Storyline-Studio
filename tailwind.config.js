/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Add an `xs` break so we can hand-craft anything narrower than the
      // smallest Pixel/iPhone width (390px) without disturbing the rest of
      // the responsive cascade. Other breakpoints stay at the Tailwind
      // defaults (sm 640, md 768, lg 1024, xl 1280, 2xl 1536).
      screens: {
        xs: "390px",
      },
      spacing: {
        // Smallest WCAG-friendly touch target — used by `min-h-touch` /
        // `min-w-touch` instead of remembering 44px in every place.
        touch: "44px",
        // iOS safe-area inset shortcuts. Use as `pb-[env(safe-area-inset-bottom)]`
        // for one-offs; for shared shells, use the `.pb-safe` utility below.
        safe: "env(safe-area-inset-bottom)",
      },
      colors: {
        bg: "#080810",
        surface: "#0d0d1a",
        card: "#111120",
        panel: "#14142a",
        hover: "#1a1a30",
        border: "#1c1c2e",
        bordermid: "#252538",
        gold: "#c9a84c",
        golddim: "#7a6130",
        goldfaint: "#1c1608",
        blue: "#4a90d9",
        bluedim: "#1e3a5c",
        bluefaint: "#0a1522",
        lightblue: "#7db3e8",
        ok: "#27ae60",
        okfaint: "#071a10",
        danger: "#c0392b",
        dangerfaint: "#1a0808",
        // Advisory / needs-attention (replaces raw amber-* in Badge).
        warning: "#f59e0b",
        warningdim: "#78350f",
        warningfaint: "#1c1408",
        // Semantic info role — same hue as lightblue, distinct from `blue` surfaces.
        info: "#7db3e8",
        // ---- Text scale ----
        // All three pass WCAG 2.1 AA (4.5:1) against every dark surface in
        // the palette (bg / surface / card / panel / hover / goldfaint /
        // bluefaint / okfaint / dangerfaint). textmuted was previously
        // #5a5a78 which measured ~2.83:1 on bg — fails AA for normal text.
        // Bumped to #888fad which is the lightest "muted" tone that still
        // reads as quiet while crossing the AA threshold on every surface
        // (~5.2:1 on the lightest, hover).
        //
        // If you need an even quieter tone for *purely decorative* glyphs
        // (e.g. SVG axis ticks that are duplicated by visible labels),
        // use the new `textfaint` token below — it's intentionally below
        // AA and should never wrap text that conveys meaning.
        text: "#e8e8f0",
        textsub: "#8888aa",
        textmuted: "#888fad",
        textfaint: "#5a5a78",
      },
      fontSize: {
        label: ["12px", { letterSpacing: "0.12em", lineHeight: "1.2" }],
        meta: ["11px", { letterSpacing: "0.04em", lineHeight: "1.4" }],
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        serif: ["'Cormorant Garamond'", "serif"],
        mono: ["'Space Mono'", "monospace"],
        body: ["Inter", "sans-serif"],
      },
      // ---- Motion ----
      // Every animation defined here must be paired with `motion-safe:`
      // at every call site (see docs/02-DESIGN-SYSTEM.md → Motion) so
      // `prefers-reduced-motion: reduce` users see a static frame.
      //
      // shimmer        — branded skeleton sweep. Low-contrast gold band
      //                  slides across the card on a 1.6s linear loop.
      //                  Paired with the `.skeleton-shimmer` utility in
      //                  src/index.css for the gradient + 200% bg-size.
      // fade-in        — generic mount fade (160ms ease-out). Used by
      //                  <StepTransition> and the skeleton caption.
      // slide-in-right — forward step transition (180ms ease-out, 8px).
      // slide-in-left  — back step transition (180ms ease-out, 8px).
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "fade-in": "fade-in 160ms ease-out",
        "slide-in-right": "slide-in-right 180ms ease-out",
        "slide-in-left": "slide-in-left 180ms ease-out",
      },
    },
  },
  plugins: [],
};
