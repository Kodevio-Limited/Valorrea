import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#25596E",
          dark: "#020507",
        },
        accent: {
          blue: "#BBCCD2",
        },
        surface: {
          bg: "#F2F2F2",
          card: "#FFFFFF",
        },
        text: {
          primary: "#2D2F33",
          body: "#2E2E2E",
          muted: "#686868",
          light: "#989898",
          faint: "#B9B9B9",
        },
        dark: {
          DEFAULT: "#1E1E1E",
        },
      },
      fontFamily: {
        urbanist: ["var(--font-urbanist)", "sans-serif"],
        playfair: ['var(--font-playfair)', "serif"],
        manrope: ["var(--font-manrope)", "sans-serif"],
        satoshi: ["var(--font-manrope)", "sans-serif"],
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(180deg, #25596E 0%, #020507 100%)",
      },
      borderRadius: {
        card: "12px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(45, 47, 51, 0.06)",
        raised: "0 8px 24px rgba(2, 5, 7, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
