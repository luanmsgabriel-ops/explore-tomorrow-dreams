import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { OpportunityButton } from "./OpportunityPrimitives";

export interface OpportunityStateProps {
  state: "loading" | "empty" | "error";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

const copy = {
  loading: {
    title: "Buscando oportunidades",
    description: "Consultando preços e disponibilidade.",
  },
  empty: {
    title: "Nenhuma oportunidade encontrada",
    description: "Ajuste os filtros para consultar outras opções.",
  },
  error: {
    title: "Não foi possível carregar",
    description: "Tente novamente em instantes.",
  },
} as const;

export function OpportunityState({
  state,
  title = copy[state].title,
  description = copy[state].description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: OpportunityStateProps) {
  if (state === "loading") {
    return (
      <div className={cn("grid gap-4", className)} role="status" aria-live="polite">
        <span className="sr-only">{title}. {description}</span>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <div key={item} className="overflow-hidden rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface">
              <div className="opportunity-skeleton aspect-[16/9]" />
              <div className="grid gap-3 p-5">
                <div className="opportunity-skeleton h-4 w-2/3 rounded-full" />
                <div className="opportunity-skeleton h-8 w-5/6 rounded-full" />
                <div className="opportunity-skeleton h-4 w-1/2 rounded-full" />
                <div className="opportunity-skeleton mt-3 h-11 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isError = state === "error";
  const Icon = isError ? AlertTriangle : Inbox;

  return (
    <section
      className={cn(
        "opportunity-surface mx-auto grid max-w-2xl justify-items-center gap-4 rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/75 px-6 py-12 text-center",
        className,
      )}
      role={isError ? "alert" : "status"}
    >
      <span className="grid size-12 place-items-center rounded-full border border-tomorrow-gold/35 bg-tomorrow-gold/10 text-tomorrow-gold-soft">
        <Icon aria-hidden="true" />
      </span>
      <div className="grid gap-2">
        <h2 className="font-editorial text-3xl text-tomorrow-text">{title}</h2>
        <p className="text-sm leading-relaxed text-tomorrow-muted">{description}</p>
      </div>
      {actionLabel && (onAction || actionHref) ? (
        actionHref ? (
          <OpportunityButton asChild variant="outline">
            <a href={actionHref}>{actionLabel}</a>
          </OpportunityButton>
        ) : (
          <OpportunityButton variant="outline" onClick={onAction}>
            {isError ? <RotateCcw aria-hidden="true" /> : null}
            {actionLabel}
          </OpportunityButton>
        )
      ) : null}
    </section>
  );
}
