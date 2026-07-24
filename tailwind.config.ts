import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        accent: "#00E5D4",
        accentWarm: "#FB923C",
        muted: "#A0A0A0",
        foreground: "#FFFFFF",
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
      },
      animation: {
        "marquee-ltr": "marquee-ltr 20s linear infinite",
        "marquee-rtl": "marquee-rtl 20s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
