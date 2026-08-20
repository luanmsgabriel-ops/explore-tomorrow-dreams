export const opportunityTokens = {
  color: {
    background: "hsl(190 68% 5%)",
    surface: "hsl(189 55% 9%)",
    surfaceElevated: "hsl(188 45% 13%)",
    teal: "hsl(177 72% 45%)",
    tealSoft: "hsl(178 55% 67%)",
    gold: "hsl(42 65% 54%)",
    goldSoft: "hsl(44 74% 72%)",
    text: "hsl(45 30% 96%)",
    muted: "hsl(181 14% 72%)",
    danger: "hsl(4 78% 62%)",
    success: "hsl(153 55% 52%)",
  },
  radius: {
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    pill: "9999px",
  },
  space: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    xxl: "3rem",
  },
  shadow: {
    surface: "0 24px 80px hsl(190 80% 2% / 0.48)",
    teal: "0 0 32px hsl(177 72% 45% / 0.2)",
    gold: "0 0 32px hsl(42 65% 54% / 0.2)",
  },
  motion: {
    fast: "160ms",
    standard: "240ms",
    slow: "420ms",
    ease: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export type OpportunityTokens = typeof opportunityTokens;
