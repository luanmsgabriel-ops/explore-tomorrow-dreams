import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { opportunityBadgeVariants, opportunityButtonVariants } from "./variants";

export interface OpportunityButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof opportunityButtonVariants> {
  asChild?: boolean;
}

export const OpportunityButton = React.forwardRef<HTMLButtonElement, OpportunityButtonProps>(
  ({ asChild = false, className, variant, size, fullWidth, type, ...props }, ref) => {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={ref}
        className={cn(opportunityButtonVariants({ variant, size, fullWidth }), className)}
        type={asChild ? undefined : type ?? "button"}
        {...props}
      />
    );
  },
);
OpportunityButton.displayName = "OpportunityButton";

export interface OpportunityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof opportunityBadgeVariants> {}

export function OpportunityBadge({ className, variant, ...props }: OpportunityBadgeProps) {
  return <span className={cn(opportunityBadgeVariants({ variant }), className)} {...props} />;
}

export interface OpportunityFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
}

export const OpportunityField = React.forwardRef<HTMLInputElement, OpportunityFieldProps>(
  ({ className, label, hint, error, leadingIcon, id, "aria-describedby": describedBy, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const descriptionIds = [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="opportunity-scope grid gap-2">
        <label htmlFor={inputId} className="text-sm font-semibold text-tomorrow-text">
          {label}
        </label>
        <div className="relative">
          {leadingIcon ? (
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-tomorrow-teal-soft"
              aria-hidden="true"
            >
              {leadingIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={descriptionIds}
            className={cn(
              "opportunity-focus min-h-11 w-full rounded-tomorrow border border-tomorrow-line bg-tomorrow-surface/88 px-3 py-2 text-base text-tomorrow-text placeholder:text-tomorrow-muted/75 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              leadingIcon && "pl-10",
              error && "border-tomorrow-danger/80",
              className,
            )}
            {...props}
          />
        </div>
        {hint ? (
          <p id={hintId} className="text-xs leading-relaxed text-tomorrow-muted">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-xs font-medium text-tomorrow-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
OpportunityField.displayName = "OpportunityField";
