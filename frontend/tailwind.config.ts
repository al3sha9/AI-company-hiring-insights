import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      maxWidth: {
        "8xl": "1440px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "system-ui",
          "sans-serif"
        ]
      },
      fontSize: {
        // 12px — smallest labels, metadata
        "2xs": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        // 12px — keep xs alias
        xs:   ["12px", { lineHeight: "1.4" }],
        // 13px — base body size
        sm:   ["13px", { lineHeight: "1.55" }],
        // 14px — slightly larger body
        base: ["14px", { lineHeight: "1.55" }],
        // 16px — section labels, medium emphasis
        md:   ["16px", { lineHeight: "1.5" }],
        // 18px — subheadings
        lg:   ["18px", { lineHeight: "1.4" }],
        // 24px — page titles, biggest text
        "2xl":["24px", { lineHeight: "1.3" }],
        // keep 3xl for existing headings
        "3xl":["30px", { lineHeight: "1.2" }],
      },
      colors: {
        // Semantic text tokens
        ink:    "#292929",   // strong — primary text
        muted:  "#5D5D5D",   // default — secondary text
        subtle: "#7F7F7F",   // subtle — tertiary/placeholder text
        // Surfaces
        paper:    "#FFFFFF",
        selected: "#F5F5F5", // bg-selected
        // Borders
        line: "#F2F2F2",     // border
        // Accent (teal — kept from previous)
        accent: "#0f766e"
      },
      boxShadow: {
        hairline: "0 1px 0 rgba(41, 41, 41, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
