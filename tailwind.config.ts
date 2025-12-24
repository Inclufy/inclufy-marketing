import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      /**
       * Fonts
       * - Keep your current default (Plus Jakarta Sans) as `sans`
       * - Add Luxe expected families for headings/body where needed
       */
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        display: ['"Playfair Display"', "serif"],
        primary: ["Inter", "system-ui", "sans-serif"],
      },

      /**
       * Colors
       * - Keep your existing HSL token system
       * - Add Luxe palettes (fixed hex scale) so Luxe utility classes work
       */
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Your custom ProjeXtPal tokens (keep)
        projextpal: {
          magenta: "hsl(var(--projextpal-magenta))",
          orange: "hsl(var(--projextpal-orange))",
          green: "hsl(var(--projextpal-green))",
          purple: "hsl(var(--projextpal-purple))",
        },

        // Luxe palettes (add)
        "luxe-primary": {
          50: "#f3f1ff",
          100: "#ebe5ff",
          200: "#d9cfff",
          300: "#bea6ff",
          400: "#9f75ff",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#3b1876",
        },
        "luxe-accent": {
          50: "#fff8f7",
          100: "#ffeedd",
          200: "#ffd6cc",
          300: "#ffb3a3",
          400: "#ff8b7a",
          500: "#e07b67",
          600: "#c46654",
          700: "#a85545",
          800: "#8c4539",
          900: "#703831",
        },

        // Sidebar (keep)
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      /**
       * Keyframes
       * - Keep your existing animations
       * - Add Luxe animations that the design system references
       */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },

        // Luxe
        "luxe-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "luxe-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "luxe-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "luxe-scale-in": {
          from: { transform: "scale(0.98)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        "bounce-gentle": "bounce-gentle 2s ease-in-out infinite",

        // Luxe
        shimmer: "luxe-shimmer 3s linear infinite",
        glow: "luxe-glow 2s ease-in-out infinite",
        "luxe-fade-in": "luxe-fade-in 0.5s ease-out",
        "luxe-scale-in": "luxe-scale-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
