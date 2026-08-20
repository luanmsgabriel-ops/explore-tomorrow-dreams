import { ArrowRight, CalendarDays, MapPin, Plane, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { OpportunityBadge, OpportunityButton, type OpportunityBadgeProps } from "./OpportunityPrimitives";

function formatCurrency(value: number, currency?: string | null) {
  const safeCurrency = currency && /^[A-Z]{3}$/.test(currency) ? currency : "BRL";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: safeCurrency }).format(value);
}

export type OpportunityCardKind = "air_block" | "package";

export interface OpportunityCardBadge {
  label: string;
  variant?: OpportunityBadgeProps["variant"];
}

export interface OpportunityCardProps {
  id: string;
  kind: OpportunityCardKind;
  title?: string | null;
  origin?: string | null;
  originIata?: string | null;
  destination: string;
  destinationIata?: string | null;
  departureLabel?: string | null;
  returnLabel?: string | null;
  nights?: number | null;
  pricePerPerson?: number | null;
  taxPerPerson?: number | null;
  currency?: string | null;
  availableSeats?: number | null;
  airfareIncluded?: boolean | null;
  imageUrl?: string | null;
  imageAlt?: string;
  badges?: OpportunityCardBadge[];
  actionHref: string;
  actionLabel?: string;
  className?: string;
}

function placeLabel(city?: string | null, iata?: string | null) {
  if (!city) return iata ?? null;
  return iata ? `${city} (${iata})` : city;
}

export function OpportunityCard({
  id,
  kind,
  title,
  origin,
  originIata,
  destination,
  destinationIata,
  departureLabel,
  returnLabel,
  nights,
  pricePerPerson,
  taxPerPerson,
  currency,
  availableSeats,
  airfareIncluded,
  imageUrl,
  imageAlt,
  badges = [],
  actionHref,
  actionLabel = "Ver oportunidade",
  className,
}: OpportunityCardProps) {
  const originLabel = placeLabel(origin, originIata);
  const destinationLabel = placeLabel(destination, destinationIata) ?? destination;
  const routeLabel = originLabel ? `${originLabel} → ${destinationLabel}` : destinationLabel;
  const safePrice = typeof pricePerPerson === "number" && Number.isFinite(pricePerPerson) ? pricePerPerson : null;
  const safeTax = typeof taxPerPerson === "number" && Number.isFinite(taxPerPerson) ? taxPerPerson : null;
  const safeSeats =
    typeof availableSeats === "number" && Number.isInteger(availableSeats) && availableSeats >= 0
      ? availableSeats
      : null;

  return (
    <article
      className={cn(
        "opportunity-scope opportunity-card group grid min-h-full overflow-hidden rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface text-tomorrow-text shadow-tomorrow-surface",
        className,
      )}
      data-offer-id={id}
      data-offer-kind={kind}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-tomorrow-surface-elevated">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt ?? destination}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.035]"
          />
        ) : (
          <div className="opportunity-card-placeholder size-full" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-tomorrow-background via-tomorrow-background/20 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <OpportunityBadge variant={kind === "air_block" ? "air" : "package"}>
            {kind === "air_block" ? <Plane aria-hidden="true" /> : null}
            {kind === "air_block" ? "Bloqueio aéreo" : "Pacote"}
          </OpportunityBadge>
          {badges.map((badge) => (
            <OpportunityBadge key={`${badge.variant}-${badge.label}`} variant={badge.variant}>
              {badge.label}
            </OpportunityBadge>
          ))}
        </div>
      </div>

      <div className="grid content-between gap-6 p-5 sm:p-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            {title ? <h3 className="font-editorial text-3xl leading-none text-tomorrow-text">{title}</h3> : null}
            <p className="flex items-start gap-2 text-sm font-medium text-tomorrow-text">
              <MapPin className="mt-0.5 size-4 shrink-0 text-tomorrow-gold" aria-hidden="true" />
              <span>{routeLabel}</span>
            </p>
          </div>

          <dl className="grid gap-2 text-sm text-tomorrow-muted">
            {departureLabel || returnLabel ? (
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-tomorrow-teal-soft" aria-hidden="true" />
                <div>
                  <dt className="sr-only">Período</dt>
                  <dd>
                    {[departureLabel, returnLabel].filter(Boolean).join(" a ")}
                    {typeof nights === "number" && nights >= 0 ? ` · ${nights} noites` : ""}
                  </dd>
                </div>
              </div>
            ) : null}
            {safeSeats !== null ? (
              <div className="flex items-center gap-2">
                <UsersRound className="size-4 text-tomorrow-teal-soft" aria-hidden="true" />
                <dt className="sr-only">Vagas</dt>
                <dd>{safeSeats === 1 ? "1 vaga" : `${safeSeats} vagas`}</dd>
              </div>
            ) : null}
            {kind === "package" && airfareIncluded === false ? (
              <div className="flex items-center gap-2">
                <Plane className="size-4 text-tomorrow-muted" aria-hidden="true" />
                <dt className="sr-only">Aéreo</dt>
                <dd>Aéreo não incluído</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="grid gap-4 border-t border-tomorrow-line pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tomorrow-muted">Por pessoa</p>
            <p className="mt-1 font-editorial text-4xl leading-none text-tomorrow-gold-soft">
              {safePrice !== null ? formatCurrency(safePrice, currency) : "—"}
            </p>
            {safeTax !== null ? <p className="mt-2 text-xs text-tomorrow-muted">Taxa: {formatCurrency(safeTax, currency)}</p> : null}
          </div>
          <OpportunityButton asChild variant="outline" fullWidth>
            <a href={actionHref} aria-label={`${actionLabel}: ${routeLabel}`}>
              {actionLabel}
              <ArrowRight aria-hidden="true" />
            </a>
          </OpportunityButton>
        </div>
      </div>
    </article>
  );
}
