import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  MapPin,
  Plane,
  ReceiptText,
  Share2,
  Sparkles,
  Ticket,
  UsersRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";

import {
  OpportunityBadge,
  OpportunityButton,
  OpportunityHeader,
  OpportunityState,
} from "@/components/opportunities";
import {
  formatOpportunityCurrency,
  formatOpportunityDate,
  formatOpportunityDateTime,
  opportunityRoute,
  opportunityTitle,
  opportunityTotalPerPerson,
  opportunityTypeLabel,
} from "@/components/opportunities/detailFormatters";
import {
  TRAVEL_OFFERS_NOTICE,
  fetchTravelOfferDetail,
  isPublicOfferId,
  type TravelOfferAirBlockDetail,
  type TravelOfferGuidedGroupDetail,
  type TravelOfferPackageDetail,
} from "@/lib/travelOffersPublic";

const navItems = [
  { label: "Catálogo", href: "/oportunidades/catalogo" },
  { label: "Comparar", href: "/oportunidades/comparar" },
];

function DetailSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="opportunity-surface rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/72 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-editorial text-3xl text-tomorrow-text">
        <span className="text-tomorrow-gold" aria-hidden="true">{icon}</span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-tomorrow border border-tomorrow-line bg-tomorrow-background/35 p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-tomorrow-muted">{label}</dt>
      <dd className="mt-2 text-sm font-semibold leading-relaxed text-tomorrow-text">{value ?? "Não informado"}</dd>
    </div>
  );
}

function AirBlockDetails({ item }: { item: TravelOfferAirBlockDetail }) {
  return (
    <div className="grid gap-5">
      <DetailSection title="Voos" icon={<Plane className="size-5" />}>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailValue label="Companhia" value={item.airline} />
          <DetailValue
            label="Ida"
            value={item.outbound_departure_time || item.outbound_arrival_time
              ? `${item.outbound_departure_time ?? "Horário não informado"} → ${item.outbound_arrival_time ?? "Horário não informado"}`
              : null}
          />
          <DetailValue
            label="Volta"
            value={item.return_departure_time || item.return_arrival_time
              ? `${item.return_departure_time ?? "Horário não informado"} → ${item.return_arrival_time ?? "Horário não informado"}`
              : null}
          />
          <DetailValue label="Prazo de emissão" value={formatOpportunityDateTime(item.issue_deadline)} />
        </dl>
      </DetailSection>
    </div>
  );
}

function PackageDetails({ item }: { item: TravelOfferPackageDetail }) {
  return (
    <div className="grid gap-5">
      <DetailSection title="Hospedagem e pacote" icon={<Building2 className="size-5" />}>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailValue label="Hotel" value={item.hotel} />
          <DetailValue label="Regime" value={item.meal_plan} />
          <DetailValue label="Promoção" value={item.promotion} />
          <DetailValue label="Parcela informada" value={item.installment} />
          <DetailValue label="Aéreo incluído" value={item.airfare_included ? "Sim" : "Não"} />
          <DetailValue
            label="Valor aéreo por pessoa"
            value={formatOpportunityCurrency(item.airfare_price_per_person, item.currency)}
          />
          <DetailValue label="Ingresso incluído" value={item.ticket_included ? "Sim" : "Não"} />
          <DetailValue label="Categoria" value={item.category} />
        </dl>
      </DetailSection>

      {item.inclusions.length ? (
        <DetailSection title="Inclusões" icon={<Check className="size-5" />}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {item.inclusions.map((inclusion) => (
              <li key={inclusion} className="flex items-start gap-3 text-sm leading-relaxed text-tomorrow-text">
                <Check className="mt-0.5 size-4 shrink-0 text-tomorrow-teal-soft" aria-hidden="true" />
                {inclusion}
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {item.event_specific || item.ticket_options.length ? (
        <DetailSection title="Evento e ingressos" icon={<Ticket className="size-5" />}>
          {item.event_name ? <p className="mb-4 font-semibold text-tomorrow-text">{item.event_name}</p> : null}
          {item.ticket_options.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {item.ticket_options.map((ticketOption) => (
                <div key={`${ticketOption.category}-${ticketOption.installment}`} className="rounded-tomorrow border border-tomorrow-line p-4">
                  <p className="font-semibold text-tomorrow-text">{ticketOption.category}</p>
                  <p className="mt-2 text-sm text-tomorrow-gold-soft">
                    {formatOpportunityCurrency(ticketOption.price_per_person, item.currency) ?? "Valor não informado"}
                  </p>
                  {ticketOption.installment ? <p className="mt-1 text-xs text-tomorrow-muted">{ticketOption.installment}</p> : null}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-tomorrow-muted">Nenhuma categoria adicional de ingresso foi informada.</p>}
        </DetailSection>
      ) : null}

      {item.other_accommodations.length ? (
        <DetailSection title="Outras hospedagens" icon={<Building2 className="size-5" />}>
          <div className="overflow-x-auto">
            <table className="min-w-[44rem] w-full border-collapse text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.1em] text-tomorrow-muted">
                <tr>
                  <th className="border-b border-tomorrow-line p-3">Hotel</th>
                  <th className="border-b border-tomorrow-line p-3">Regime</th>
                  <th className="border-b border-tomorrow-line p-3">Por pessoa</th>
                  <th className="border-b border-tomorrow-line p-3">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {item.other_accommodations.map((hotel) => (
                  <tr key={`${hotel.name}-${hotel.price_per_person}`} className="text-tomorrow-text">
                    <td className="border-b border-tomorrow-line/60 p-3 font-semibold">{hotel.name}</td>
                    <td className="border-b border-tomorrow-line/60 p-3">{hotel.meal_plan ?? "Não informado"}</td>
                    <td className="border-b border-tomorrow-line/60 p-3">{formatOpportunityCurrency(hotel.price_per_person, item.currency) ?? "Não informado"}</td>
                    <td className="border-b border-tomorrow-line/60 p-3">{formatOpportunityCurrency(hotel.tax_per_person, item.currency) ?? "Não informada"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}

function GuidedGroupDetails({ item }: { item: TravelOfferGuidedGroupDetail }) {
  return (
    <div className="grid gap-5">
      {item.description ? (
        <DetailSection title="Sobre o roteiro" icon={<Sparkles className="size-5" />}>
          <p className="whitespace-pre-line text-sm leading-7 text-tomorrow-text">{item.description}</p>
        </DetailSection>
      ) : null}

      <DetailSection title="Estrutura do grupo" icon={<UsersRound className="size-5" />}>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailValue label="Duração" value={item.duration} />
          <DetailValue label="Transporte" value={item.transport} />
          <DetailValue label="Pagamento" value={item.payment} />
          <DetailValue label="Aéreo incluído" value={item.airfare_included ? "Sim" : "Não"} />
        </dl>
        {item.cities.length ? <p className="mt-5 text-sm leading-relaxed text-tomorrow-muted">Cidades: {item.cities.join(" · ")}</p> : null}
      </DetailSection>

      {item.hotels.length ? (
        <DetailSection title="Hotéis do roteiro" icon={<Building2 className="size-5" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {item.hotels.map((hotel) => (
              <div key={`${hotel.city}-${hotel.name}`} className="rounded-tomorrow border border-tomorrow-line p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-tomorrow-muted">{hotel.city ?? "Cidade não informada"}</p>
                <p className="mt-2 font-semibold text-tomorrow-text">{hotel.name}</p>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {item.inclusions.length ? (
        <DetailSection title="Inclusões" icon={<Check className="size-5" />}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {item.inclusions.map((inclusion) => <li key={inclusion} className="text-sm leading-relaxed text-tomorrow-text">• {inclusion}</li>)}
          </ul>
        </DetailSection>
      ) : null}

      {item.flight_notes.length ? (
        <DetailSection title="Informações de voo" icon={<Plane className="size-5" />}>
          <ul className="grid gap-3">
            {item.flight_notes.map((note) => <li key={note} className="text-sm leading-relaxed text-tomorrow-text">{note}</li>)}
          </ul>
        </DetailSection>
      ) : null}

      {item.price_options.length ? (
        <DetailSection title="Opções informadas" icon={<ReceiptText className="size-5" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {item.price_options.map((option) => (
              <div key={`${option.label}-${option.total}`} className={`rounded-tomorrow border p-4 ${option.featured ? "border-tomorrow-gold/70 bg-tomorrow-gold/5" : "border-tomorrow-line"}`}>
                <p className="font-semibold text-tomorrow-text">{option.label}</p>
                {option.total ? <p className="mt-2 text-sm text-tomorrow-gold-soft">{option.total}</p> : null}
                {option.installment ? <p className="mt-1 text-xs text-tomorrow-muted">{option.installment}</p> : null}
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}

export default function OpportunityDetail() {
  const { id = "" } = useParams();
  const validId = isPublicOfferId(id);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const detailQuery = useQuery({
    queryKey: ["travel-offers-public", "detail", id],
    queryFn: ({ signal }) => fetchTravelOfferDetail(id, signal),
    enabled: validId,
    staleTime: 30_000,
    retry: 1,
  });

  const copyLink = async () => {
    const shareUrl = `${window.location.origin}/oportunidades/oferta/${id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  const item = detailQuery.data?.item;
  const notice = detailQuery.data?.notice || TRAVEL_OFFERS_NOTICE;

  return (
    <div className="opportunities-theme min-h-screen bg-tomorrow-background text-tomorrow-text">
      <OpportunityHeader navItems={navItems} ctaHref={item ? `/teo?offer_id=${encodeURIComponent(item.id)}` : "/teo"} />
      <main className="mx-auto grid w-full max-w-[90rem] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <a href="/oportunidades/catalogo" className="opportunity-focus inline-flex w-fit items-center gap-2 rounded-lg text-sm font-semibold text-tomorrow-muted hover:text-tomorrow-text">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao catálogo
        </a>

        {!validId ? <OpportunityState state="error" title="Identificador inválido" description="O link desta oportunidade não é válido." actionLabel="Abrir catálogo" actionHref="/oportunidades/catalogo" /> : null}
        {validId && detailQuery.isPending ? <OpportunityState state="loading" title="Consultando oportunidade" /> : null}
        {validId && detailQuery.isError ? (
          <OpportunityState
            state="error"
            title="Oportunidade indisponível"
            description={detailQuery.error instanceof Error ? detailQuery.error.message : undefined}
            actionLabel="Tentar novamente"
            onAction={() => detailQuery.refetch()}
          />
        ) : null}

        {item ? (
          <>
            <section className="opportunity-surface overflow-hidden rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface shadow-tomorrow-surface">
              <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
                <div className="relative min-h-[22rem] overflow-hidden p-6 sm:p-10">
                  {item.kind !== "air_block" && item.image_url ? (
                    <img src={item.image_url} alt={item.destination ? `Vista de ${item.destination}` : "Imagem pública da oportunidade"} className="absolute inset-0 size-full object-cover opacity-45" />
                  ) : <div className="opportunity-card-placeholder absolute inset-0 opacity-70" aria-hidden="true" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-tomorrow-background/95 via-tomorrow-background/80 to-tomorrow-background/25" />
                  <div className="relative flex h-full max-w-3xl flex-col justify-end">
                    <div className="flex flex-wrap gap-2">
                      <OpportunityBadge variant={item.kind === "air_block" ? "air" : item.kind === "guided_group" ? "guided" : item.offer_subtype === "evento" ? "event" : "package"}>
                        {opportunityTypeLabel(item)}
                      </OpportunityBadge>
                      {item.kind !== "air_block" && item.category ? <OpportunityBadge>{item.category}</OpportunityBadge> : null}
                    </div>
                    <h1 className="mt-5 font-editorial text-5xl leading-[0.95] text-tomorrow-text sm:text-6xl">{opportunityTitle(item)}</h1>
                    <p className="mt-5 flex items-start gap-2 text-base text-tomorrow-muted">
                      <MapPin className="mt-0.5 size-5 shrink-0 text-tomorrow-gold" aria-hidden="true" />
                      {opportunityRoute(item)}
                    </p>
                  </div>
                </div>

                <aside className="grid content-between gap-6 border-t border-tomorrow-line bg-tomorrow-background/50 p-6 lg:border-l lg:border-t-0 sm:p-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-tomorrow-muted">Valor por pessoa</p>
                    <p className="mt-2 font-editorial text-5xl text-tomorrow-gold-soft">{formatOpportunityCurrency(item.price_per_person, item.currency)}</p>
                    <p className="mt-3 text-sm text-tomorrow-muted">
                      Taxa por pessoa: {formatOpportunityCurrency(item.tax_per_person, item.currency) ?? "não informada"}
                    </p>
                    {opportunityTotalPerPerson(item) !== null ? (
                      <p className="mt-2 text-sm font-semibold text-tomorrow-text">
                        Total por pessoa: {formatOpportunityCurrency(opportunityTotalPerPerson(item), item.currency)}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <OpportunityButton asChild fullWidth size="lg">
                      <a href={`/teo?offer_id=${encodeURIComponent(item.id)}`}>Quero esta oportunidade</a>
                    </OpportunityButton>
                    <OpportunityButton variant="outline" fullWidth onClick={copyLink}>
                      {copyStatus === "copied" ? <Check aria-hidden="true" /> : copyStatus === "error" ? <Share2 aria-hidden="true" /> : <Copy aria-hidden="true" />}
                      {copyStatus === "copied" ? "Link copiado" : copyStatus === "error" ? "Não foi possível copiar" : "Copiar link"}
                    </OpportunityButton>
                  </div>
                </aside>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumo da oportunidade">
              <DetailValue label="Saída" value={formatOpportunityDate(item.departure_date)} />
              <DetailValue label="Retorno" value={formatOpportunityDate(item.return_date)} />
              <DetailValue label="Noites" value={item.nights === null ? null : String(item.nights)} />
              <DetailValue label="Vagas" value={item.available_seats === null ? "Quantidade não informada" : String(item.available_seats)} />
            </section>

            {item.kind === "air_block" ? <AirBlockDetails item={item} /> : null}
            {item.kind === "package" ? <PackageDetails item={item} /> : null}
            {item.kind === "guided_group" ? <GuidedGroupDetails item={item} /> : null}

            <aside className="opportunity-surface grid gap-3 rounded-tomorrow border border-tomorrow-gold/30 bg-tomorrow-gold/5 p-5 text-sm text-tomorrow-muted sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="leading-relaxed">{notice}</p>
                <p className="mt-2 flex items-center gap-2 text-xs">
                  <Clock3 className="size-4" aria-hidden="true" />
                  Atualização da oferta: {formatOpportunityDateTime(item.updated_at) ?? "não informada"}
                </p>
              </div>
              <OpportunityButton asChild variant="outline">
                <a href={`/oportunidades/comparar?ids=${encodeURIComponent(item.id)}`}>Comparar esta opção</a>
              </OpportunityButton>
            </aside>
          </>
        ) : null}
      </main>
    </div>
  );
}
