import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
        // Tomorrow Travel Ocean Premium colors
        ocean: {
          DEFAULT: "hsl(192 65% 12%)",
          deep: "hsl(192 65% 8%)",
          mid: "hsl(190 60% 20%)",
          light: "hsl(185 55% 30%)",
          surface: "hsl(192 60% 15%)",
        },
        teal: {
          DEFAULT: "hsl(185 65% 35%)",
          light: "hsl(185 60% 45%)",
          dark: "hsl(185 65% 25%)",
        },
        gold: {
          DEFAULT: "hsl(40 70% 50%)",
          light: "hsl(45 80% 60%)",
          dark: "hsl(35 65% 40%)",
          metallic: "hsl(40 75% 55%)",
        },
        bronze: {
          DEFAULT: "hsl(30 55% 35%)",
          light: "hsl(35 60% 45%)",
          dark: "hsl(25 50% 25%)",
        },
        tomorrow: {
          background: "hsl(var(--op-background) / <alpha-value>)",
          surface: "hsl(var(--op-surface) / <alpha-value>)",
          "surface-elevated": "hsl(var(--op-surface-elevated) / <alpha-value>)",
          teal: "hsl(var(--op-teal) / <alpha-value>)",
          "teal-soft": "hsl(var(--op-teal-soft) / <alpha-value>)",
          gold: "hsl(var(--op-gold) / <alpha-value>)",
          "gold-soft": "hsl(var(--op-gold-soft) / <alpha-value>)",
          text: "hsl(var(--op-text) / <alpha-value>)",
          muted: "hsl(var(--op-muted) / <alpha-value>)",
          line: "hsl(var(--op-line) / <alpha-value>)",
          danger: "hsl(var(--op-danger) / <alpha-value>)",
          success: "hsl(var(--op-success) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        editorial: ['Instrument Serif', 'Playfair Display', 'serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        tomorrow: "var(--op-radius-md)",
        "tomorrow-lg": "var(--op-radius-lg)",
      },
      boxShadow: {
        "tomorrow-surface": "var(--op-shadow-surface)",
        "tomorrow-teal": "var(--op-shadow-teal)",
        "tomorrow-gold": "var(--op-shadow-gold)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "fade-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(2deg)" },
        },
        "light-trail": {
          "0%": { opacity: "0", transform: "translateX(-100%)" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateX(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(40 75% 50% / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(40 75% 50% / 0.6)" },
        },
        "text-reveal": {
          from: { opacity: "0", transform: "translateY(120%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "teo-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "parallax-float": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-14px,0)" },
        },
        "gold-shimmer": {
          "0%": { backgroundPosition: "-150% 0" },
          "100%": { backgroundPosition: "250% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-left": "slide-in-left 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.5s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        shimmer: "shimmer 2s infinite linear",
        sparkle: "sparkle 2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "light-trail": "light-trail 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "text-reveal": "text-reveal 1.1s cubic-bezier(0.16,1,0.3,1) both",
        "teo-bounce": "teo-bounce 3s cubic-bezier(0.22,0.61,0.36,1) infinite",
        "parallax-float": "parallax-float 9s ease-in-out infinite",
        "gold-shimmer": "gold-shimmer 3.5s linear infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-ocean": "linear-gradient(180deg, hsl(192 65% 15%) 0%, hsl(192 65% 8%) 100%)",
        "gradient-gold": "linear-gradient(180deg, hsl(45 80% 60%) 0%, hsl(40 70% 50%) 50%, hsl(35 65% 40%) 100%)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
