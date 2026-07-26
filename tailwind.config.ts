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
        // Button border-trace: a short "comet" running the pill outline,
        // echoing the CoreValueSection card ring.
        "btn-trace": {
          to: { strokeDashoffset: "-320" },
        },
        // Button sheen: a single diagonal light sweep fired on hover.
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
        "btn-sheen": "btn-sheen 0.9s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
