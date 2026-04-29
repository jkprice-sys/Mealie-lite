import type { Config } from "tailwindcss";

export default {
  // Scan all Vue, TS, JS files in the app directory
  content: [
    "./app/**/*.{vue,ts,js}",
    "./app/components/**/*.{vue,ts}",
    "./app/pages/**/*.{vue,ts}",
    "./app/layouts/**/*.{vue,ts}",
  ],

  // Use class strategy so Tailwind dark mode is controlled by <html class="dark">
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        // ByteSized brand palette — maps to CSS custom properties so dark mode
        // flips automatically when the 'dark' class is toggled on <html>.
        primary: "var(--bs-primary)",
        "primary-content": "var(--bs-primary-content)",
        accent: "var(--bs-accent)",
        "accent-content": "var(--bs-accent-content)",
        secondary: "var(--bs-secondary)",
        success: "var(--bs-success)",
        info: "var(--bs-info)",
        warning: "var(--bs-warning)",
        error: "var(--bs-error)",
        surface: "var(--bs-surface)",
        background: "var(--bs-background)",
        "on-surface": "var(--bs-on-surface)",
        border: "var(--bs-border)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },

  plugins: [
    require("@tailwindcss/forms")({ strategy: "class" }),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
