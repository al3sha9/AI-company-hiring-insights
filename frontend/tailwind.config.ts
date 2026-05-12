import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "oklch(0.2 0.02 240)",
        muted: "oklch(0.5 0.02 240)",
        line: "oklch(0.90 0.01 240)",
        paper: "oklch(0.98 0.01 240)",
        surface: "oklch(1 0 0)", // Pure white for deepest layers if needed, or use paper
        accent: "oklch(0.6 0.2 280)", // Electric indigo
        positive: "oklch(0.65 0.15 150)", // Deep cool green
        negative: "oklch(0.65 0.18 25)" // Deep cool red
      }
    }
  },
  plugins: []
};

export default config;
