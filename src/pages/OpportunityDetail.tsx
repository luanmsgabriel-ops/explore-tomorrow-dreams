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
import { buildOfferWhatsAppUrl } from "@/lib/offerHandoff";
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
    <section className="opportunity-surface min-w-0 max-w-full rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/72 p-5 sm:p-6">
      <h2 className="flex min-w-0 items-center gap-2 font-editorial text-2xl text-tomorrow-text sm:text-3xl">
        <span className="shrink-0 text-tomorrow-gold" aria-hidden="true">{icon}</span>
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{title}</span>
      </h2>
      <div className="mt-5 min-w-0 max-w-full">{children}</div>
    </section>
  );
}

function DetailValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 max-w-full rounded-tomorrow border border-tomorrow-line bg-tomorrow-background/35 p-4">
      <dt className="break-words text-xs font-bold uppercase tracking-[0.12em] text-tomorrow-muted [overflow-wrap:anywhere]">{label}</dt>
      <dd className="mt-2 min-w-0 break-words text-sm font-semibold leading-relaxed text-tomorrow-text [overflow-wrap:anywhere]">{value ?? "Não informado"}</dd>
    </div>
  );
}

function AirBlockDetails({ item }: { item: TravelOfferAirBlockDetail }) {
  return (
    <div className="grid min-w-0 gap-5">
      <DetailSection title="Voos" icon={<Plane className="size-5" />}>
        <dl className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
    <div className="grid min-w-0 gap-5">
      <DetailSection title="Hospedagem e pacote" icon={<Building2 className="size-5" />}>
        <dl className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
            {item.inclusions.map((inclusion) => (
              <li key={inclusion} className="flex min-w-0 items-start gap-3 break-words text-sm leading-relaxed text-tomorrow-text [overflow-wrap:anywhere]">
                <Check className="mt-0.5 size-4 shrink-0 text-tomorrow-teal-soft" aria-hidden="true" />
                {inclusion}
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {item.event_specific || item.ticket_options.length ? (
        <DetailSection title="Evento e ingressos" icon={<Ticket className="size-5" />}>
          {item.event_name ? <p className="mb-4 break-words font-semibold text-tomorrow-text [overflow-wrap:anywhere]">{item.event_name}</p> : null}
          {item.ticket_options.length ? (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {item.ticket_options.map((ticketOption) => (
                <div key={`${ticketOption.category}-${ticketOption.installment}`} className="min-w-0 rounded-tomorrow border border-tomorrow-line p-4">
                  <p className="break-words font-semibold text-tomorrow-text [overflow-wrap:anywhere]">{ticketOption.category}</p>
                  <p className="mt-2 break-words text-sm text-tomorrow-gold-soft [overflow-wrap:anywhere]">
                    {formatOpportunityCurrency(ticketOption.price_per_person, item.currency) ?? "Valor não informado"}
                  </p>
                  {ticketOption.installment ? <p className="mt-1 break-words text-xs text-tomorrow-muted [overflow-wrap:anywhere]">{ticketOption.installment}</p> : null}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-tomorrow-muted">Nenhuma categoria adicional de ingresso foi informada.</p>}
        </DetailSection>
      ) : null}

      {item.other_accommodations.length ? (
        <DetailSection title="Outras hospedagens" icon={<Building2 className="size-5" />}>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
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
    <div className="grid min-w-0 gap-5">
      {item.description ? (
        <DetailSection title="Sobre o roteiro" icon={<Sparkles className="size-5" />}>
          <p className="whitespace-pre-line break-words text-sm leading-7 text-tomorrow-text [overflow-wrap:anywhere]">{item.description}</p>
        </DetailSection>
      ) : null}

      <DetailSection title="Estrutura do grupo" icon={<UsersRound className="size-5" />}>
        <dl className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailValue label="Duração" value={item.duration} />
          <DetailValue label="Transporte" value={item.transport} />
          <DetailValue label="Pagamento" value={item.payment} />
          <DetailValue label="Aéreo incluído" value={item.airfare_included ? "Sim" : "Não"} />
        </dl>
        {item.cities.length ? <p className="mt-5 break-words text-sm leading-relaxed text-tomorrow-muted [overflow-wrap:anywhere]">Cidades: {item.cities.join(" · ")}</p> : null}
      </DetailSection>

      {item.hotels.length ? (
        <DetailSection title="Hotéis do roteiro" icon={<Building2 className="size-5" />}>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {item.hotels.map((hotel) => (
              <div key={`${hotel.city}-${hotel.name}`} className="min-w-0 rounded-tomorrow border border-tomorrow-line p-4">
                <p className="break-words text-xs font-bold uppercase tracking-[0.1em] text-tomorrow-muted [overflow-wrap:anywhere]">{hotel.city ?? "Cidade não informada"}</p>
                <p className="mt-2 break-words font-semibold text-tomorrow-text [overflow-wrap:anywhere]">{hotel.name}</p>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {item.inclusions.length ? (
        <DetailSection title="Inclusões" icon={<Check className="size-5" />}>
          <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
            {item.inclusions.map((inclusion) => <li key={inclusion} className="break-words text-sm leading-relaxed text-tomorrow-text [overflow-wrap:anywhere]">• {inclusion}</li>)}
          </ul>
        </DetailSection>
      ) : null}

      {item.flight_notes.length ? (
        <DetailSection title="Informações de voo" icon={<Plane className="size-5" />}>
          <ul className="grid min-w-0 gap-3">
            {item.flight_notes.map((note) => <li key={note} className="break-words text-sm leading-relaxed text-tomorrow-text [overflow-wrap:anywhere]">{note}</li>)}
          </ul>
        </DetailSection>
      ) : null}

      {item.price_options.length ? (
        <DetailSection title="Opções informadas" icon={<ReceiptText className="size-5" />}>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {item.price_options.map((option) => (
              <div key={`${option.label}-${option.total}`} className={`min-w-0 rounded-tomorrow border p-4 ${option.featured ? "border-tomorrow-gold/70 bg-tomorrow-gold/5" : "border-tomorrow-line"}`}>
                <p className="break-words font-semibold text-tomorrow-text [overflow-wrap:anywhere]">{option.label}</p>
                {option.total ? <p className="mt-2 break-words text-sm text-tomorrow-gold-soft [overflow-wrap:anywhere]">{option.total}</p> : null}
                {option.installment ? <p className="mt-1 break-words text-xs text-tomorrow-muted [overflow-wrap:anywhere]">{option.installment}</p> : null}
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
    <div className="opportunities-theme min-h-screen overflow-x-hidden bg-tomorrow-background text-tomorrow-text">
      <OpportunityHeader navItems={navItems} ctaHref={item ? `/teo?offer_id=${encodeURIComponent(item.id)}` : "/teo"} />
      <main className="mx-auto grid w-full min-w-0 max-w-[90rem] gap-6 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <a href="/oportunidades/catalogo" className="opportunity-focus inline-flex w-fit max-w-full items-center gap-2 rounded-lg text-sm font-semibold text-tomorrow-muted hover:text-tomorrow-text">
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          <span className="break-words">Voltar ao catálogo</span>
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
            <section className="opportunity-surface min-w-0 max-w-full overflow-hidden rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface shadow-tomorrow-surface">
              <div className="grid min-w-0 max-w-full lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
                <div className="relative min-h-[18rem] min-w-0 max-w-full overflow-hidden p-4 sm:min-h-[22rem] sm:p-10">
                  {item.kind !== "air_block" && item.image_url ? (
                    <img src={item.image_url} alt={item.destination ? `Vista de ${item.destination}` : "Imagem pública da oportunidade"} className="absolute inset-0 size-full object-cover opacity-45" />
                  ) : <div className="opportunity-card-placeholder absolute inset-0 opacity-70" aria-hidden="true" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-tomorrow-background/95 via-tomorrow-background/80 to-tomorrow-background/25" />
                  <div className="relative flex h-full min-w-0 max-w-full flex-col justify-end">
                    <div className="flex min-w-0 flex-wrap gap-2">
                      <OpportunityBadge variant={item.kind === "air_block" ? "air" : item.kind === "guided_group" ? "guided" : item.offer_subtype === "evento" ? "event" : "package"}>
                        {opportunityTypeLabel(item)}
                      </OpportunityBadge>
                      {item.kind !== "air_block" && item.category ? <OpportunityBadge>{item.category}</OpportunityBadge> : null}
                    </div>
                    <h1 className="mt-5 min-w-0 max-w-full break-words font-editorial text-3xl leading-[1.02] text-tomorrow-text [overflow-wrap:anywhere] sm:text-5xl sm:leading-[0.98] lg:text-6xl">{opportunityTitle(item)}</h1>
                    <p className="mt-5 flex min-w-0 max-w-full items-start gap-2 text-sm text-tomorrow-muted sm:text-base">
                      <MapPin className="mt-0.5 size-5 shrink-0 text-tomorrow-gold" aria-hidden="true" />
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]">{opportunityRoute(item)}</span>
                    </p>
                  </div>
                </div>

                <aside className="grid min-w-0 max-w-full content-between gap-6 border-t border-tomorrow-line bg-tomorrow-background/50 p-4 sm:p-8 lg:border-l lg:border-t-0">
                  <div className="min-w-0 max-w-full">
                    <p className="break-words text-xs font-bold uppercase tracking-[0.14em] text-tomorrow-muted [overflow-wrap:anywhere]">Valor por pessoa</p>
                    <p className="mt-2 max-w-full break-words font-editorial text-4xl leading-tight text-tomorrow-gold-soft [overflow-wrap:anywhere] sm:text-5xl">{formatOpportunityCurrency(item.price_per_person, item.currency)}</p>
                    <p className="mt-3 break-words text-sm text-tomorrow-muted [overflow-wrap:anywhere]">
                      Taxa por pessoa: {formatOpportunityCurrency(item.tax_per_person, item.currency) ?? "não informada"}
                    </p>
                    {opportunityTotalPerPerson(item) !== null ? (
                      <p className="mt-2 break-words text-sm font-semibold text-tomorrow-text [overflow-wrap:anywhere]">
                        Total por pessoa: {formatOpportunityCurrency(opportunityTotalPerPerson(item), item.currency)}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid min-w-0 gap-3">
                    <OpportunityButton asChild fullWidth size="lg">
                      <a className="max-w-full whitespace-normal text-center" href={buildOfferWhatsAppUrl(item)} target="_blank" rel="noopener noreferrer">Quero esta oportunidade</a>
                    </OpportunityButton>
                    <OpportunityButton variant="outline" fullWidth onClick={copyLink}>
                      {copyStatus === "copied" ? <Check aria-hidden="true" /> : copyStatus === "error" ? <Share2 aria-hidden="true" /> : <Copy aria-hidden="true" />}
                      {copyStatus === "copied" ? "Link copiado" : copyStatus === "error" ? "Não foi possível copiar" : "Copiar link"}
                    </OpportunityButton>
                  </div>
                </aside>
              </div>
            </section>

            <section className="grid min-w-0 max-w-full gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumo da oportunidade">
              <DetailValue label="Saída" value={formatOpportunityDate(item.departure_date)} />
              <DetailValue label="Retorno" value={formatOpportunityDate(item.return_date)} />
              <DetailValue label="Noites" value={item.nights === null ? null : String(item.nights)} />
              <DetailValue label="Vagas" value={item.available_seats === null ? "Quantidade não informada" : String(item.available_seats)} />
            </section>

            {item.kind === "air_block" ? <AirBlockDetails item={item} /> : null}
            {item.kind === "package" ? <PackageDetails item={item} /> : null}
            {item.kind === "guided_group" ? <GuidedGroupDetails item={item} /> : null}

            <aside className="opportunity-surface grid min-w-0 max-w-full gap-3 rounded-tomorrow border border-tomorrow-gold/30 bg-tomorrow-gold/5 p-5 text-sm text-tomorrow-muted sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="break-words leading-relaxed [overflow-wrap:anywhere]">{notice}</p>
                <p className="mt-2 flex min-w-0 items-start gap-2 text-xs">
                  <Clock3 className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">Atualização da oferta: {formatOpportunityDateTime(item.updated_at) ?? "não informada"}</span>
                </p>
              </div>
              <OpportunityButton asChild variant="outline">
                <a className="max-w-full whitespace-normal text-center" href={`/oportunidades/comparar?ids=${encodeURIComponent(item.id)}`}>Comparar esta opção</a>
              </OpportunityButton>
            </aside>
          </>
        ) : null}
      </main>
    </div>
  );
}
