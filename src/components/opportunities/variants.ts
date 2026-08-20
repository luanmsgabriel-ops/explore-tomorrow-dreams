import { cva } from "class-variance-authority";

export const opportunityButtonVariants = cva(
  "opportunity-scope opportunity-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-tomorrow px-5 text-sm font-semibold transition-[transform,background-color,border-color,box-shadow,color] duration-200 disabled:pointer-events-none disabled:opacity-45 motion-safe:hover:-translate-y-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        gold: "border border-tomorrow-gold-soft/55 bg-tomorrow-gold text-tomorrow-background shadow-tomorrow-gold hover:bg-tomorrow-gold-soft",
        teal: "border border-tomorrow-teal-soft/40 bg-tomorrow-teal text-tomorrow-background shadow-tomorrow-teal hover:bg-tomorrow-teal-soft",
        outline:
          "border border-tomorrow-gold/55 bg-tomorrow-surface/55 text-tomorrow-gold-soft hover:border-tomorrow-gold-soft hover:bg-tomorrow-gold/10",
        ghost: "border border-transparent bg-transparent text-tomorrow-text hover:bg-tomorrow-text/10",
      },
      size: {
        sm: "min-h-9 rounded-lg px-3 text-xs",
        md: "min-h-11 px-5 text-sm",
        lg: "min-h-12 px-7 text-base",
        icon: "size-11 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  },
);

export const opportunityBadgeVariants = cva(
  "opportunity-scope inline-flex min-h-6 items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold uppercase leading-none tracking-[0.08em]",
  {
    variants: {
      variant: {
        air: "border-tomorrow-teal/45 bg-tomorrow-teal/12 text-tomorrow-teal-soft",
        package: "border-tomorrow-gold/45 bg-tomorrow-gold/12 text-tomorrow-gold-soft",
        event: "border-violet-300/45 bg-violet-300/10 text-violet-200",
        park: "border-emerald-300/45 bg-emerald-300/10 text-emerald-200",
        guided: "border-sky-300/45 bg-sky-300/10 text-sky-200",
        seats: "border-amber-300/55 bg-amber-300/12 text-amber-200",
        deadline: "border-rose-300/55 bg-rose-300/12 text-rose-200",
        neutral: "border-tomorrow-muted/30 bg-tomorrow-text/5 text-tomorrow-muted",
        success: "border-tomorrow-success/45 bg-tomorrow-success/10 text-tomorrow-success",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);
