/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
        text: "#e8e8f0",
        textsub: "#8888aa",
        textmuted: "#5a5a78",
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        serif: ["'Cormorant Garamond'", "serif"],
        mono: ["'Space Mono'", "monospace"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
