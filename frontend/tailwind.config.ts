import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#121212",
        muted: "#737373",
        line: "#e7e5e4",
        paper: "#fbfaf8",
        accent: "#0f766e"
      },
      boxShadow: {
        hairline: "0 1px 0 rgba(18, 18, 18, 0.04)"
      }
    }
  },
  plugins: []
};

export default config;
