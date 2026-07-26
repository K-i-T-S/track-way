import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        accent: "#00E5D4",
        accentWarm: "#FB923C",
        muted: "#5B6669",
        foreground: "#FFFFFF",
        trackway: {
          black: "#000000",
          teal: "#00E5D4",
          ice: "#F4FFFE",
          gray: "#5B6669",
        },
      },
      fontFamily: {
        display: ["Sora", "Montserrat", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        arabic: [
          "IBM Plex Sans Arabic",
          "Noto Sans Arabic",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        trackwaySoft: "0 16px 40px rgba(0, 0, 0, 0.09)",
        trackwayStrong: "0 26px 90px rgba(0, 0, 0, 0.16)",
      },
      borderRadius: {
        trackway: "1.5rem",
        trackwayLg: "2rem",
      },
      keyframes: {
        "marquee-ltr": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "marquee-rtl": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(50%)" },
        },
        // Button border-trace: a comet circling the pill outline, echoing
        // the CoreValueSection card ring. Deliberately animates
        // stroke-dashoffset (not a compositor-only property like
        // transform -- rotating the whole SVG via transform would look
        // right on a circle but visibly tumbles a wide pill shape, since
        // it spins the rigid rectangle instead of moving a dash along its
        // path). This is a real, known scroll-jank contributor when many
        // buttons animate it simultaneously -- if that returns, dial this
        // back to hover-only again rather than adding more effects on top.
        "btn-trace": {
          to: { strokeDashoffset: "-320" },
        },
        // Button sheen: a diagonal light sweep. The "-loop" variant runs
        // ambiently (mostly idle, brief sweep); the hover variant is
        // faster/brighter as the distinct hover boost.
        "btn-sheen-loop": {
          "0%, 15%": {
            transform: "translateX(-150%) skewX(-18deg)",
            opacity: "0",
          },
          "35%": { opacity: "0.7" },
          "55%, 100%": {
            transform: "translateX(420%) skewX(-18deg)",
            opacity: "0",
          },
        },
        "btn-sheen": {
          "0%": { transform: "translateX(-150%) skewX(-18deg)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { transform: "translateX(420%) skewX(-18deg)", opacity: "0" },
        },
      },
      animation: {
        "marquee-ltr": "marquee-ltr 20s linear infinite",
        "marquee-rtl": "marquee-rtl 20s linear infinite",
        "btn-trace": "btn-trace 3s linear infinite",
        "btn-sheen-loop": "btn-sheen-loop 3.5s ease-in-out infinite",
        "btn-sheen": "btn-sheen 0.6s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
