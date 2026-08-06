/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict monochrome. No hue — only blacks, greys and white.
        // base: #0a0a0a app background, text: #ffffff / #a3a3a3
        base: {
          DEFAULT: "#0a0a0a", // page background
          raised: "#141414", // cards / raised surfaces
          hover: "#1c1c1c", // hover overlays
          line: "#262626", // hairline borders
        },
        ink: {
          DEFAULT: "#ffffff", // primary text
          muted: "#a3a3a3", // secondary text
          faint: "#737373", // tertiary / captions
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: {
        content: "1024px", // max content width on desktop
        modal: "440px", // keep modals compact regardless of layout width
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.3), 0 6px 20px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(255,255,0.06), 0 8px 30px rgba(0,0,0,0.5)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.45s ease-out both",
        "scale-in": "scale-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
