import { useEffect, useState } from "react";
import {
  CalendarDays,
  Headphones,
  LoaderCircle,
  MessageSquareText,
  Mic,
  MicOff,
  Power,
  Route,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  OpportunityBadge,
  OpportunityButton,
  OpportunityCard,
  OpportunityHeader,
} from "@/components/opportunities";
import {
  LiveParticleGlobe,
  type TomorrowLiveState,
} from "@/components/opportunities/live/LiveParticleGlobe";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import type { TravelOfferCatalogItem } from "@/lib/travelOffersPublic";

const navItems = [
  { label: "Catálogo", href: "/oportunidades/catalogo" },
  { label: "Live", href: "/oportunidades/live" },
  { label: "Comparar", href: "/oportunidades/comparar" },
];

const stateOptions: Array<{ value: TomorrowLiveState; label: string }> = [
  { value: "idle", label: "Aguardando" },
  { value: "listening", label: "Ouvindo" },
  { value: "thinking", label: "Pensando" },
  { value: "speaking", label: "Falando" },
  { value: "offers", label: "Ofertas" },
];

const stateCopy: Record<TomorrowLiveState, { eyebrow: string; title: string; body: string }> = {
  idle: {
    eyebrow: "Central pronta",
    title: "A viagem começa antes da primeira pergunta.",
    body: "A conversa por voz só começa depois da sua ação e pode ser encerrada a qualquer momento.",
  },
  listening: {
    eyebrow: "Escuta ativa",
    title: "O sistema acompanha sem interromper.",
    body: "O estado Ouvindo acompanha a detecção real de fala durante uma sessão ativa.",
  },
  thinking: {
    eyebrow: "Organizando contexto",
    title: "Menos ruído. Mais clareza sobre o que importa.",
    body: "O planeta muda de estado quando a fala termina e a resposta está sendo preparada.",
  },
  speaking: {
    eyebrow: "Resposta em curso",
    title: "A conversa continua enquanto a rota ganha forma.",
    body: "O estado Falando acompanha a resposta de áudio recebida pela conexão WebRTC.",
  },
  offers: {
    eyebrow: "Contexto conectado",
    title: "As oportunidades entram na conversa sem quebrar a experiência.",
    body: "Os cards desta etapa apontam apenas para experiências reais já existentes na plataforma, sem inventar ofertas.",
  },
};

const transcriptPreview = [
  {
    speaker: "Téo",
    text: "Antes de qualquer coisa: o que essa viagem precisa ser para você?",
  },
  {
    speaker: "Você",
    text: "Quero algo diferente, com natureza e poucos dias de deslocamento.",
  },
  {
    speaker: "Téo",
    text: "Há um ponto importante que vale considerar: flexibilidade de datas pode abrir caminhos muito melhores para esse perfil.",
  },
];

const contextCards = [
  {
    title: "Calendário inteligente",
    description: "Consulte datas e preços reais do inventário Tomorrow Travel.",
    href: "/oportunidades/calendario",
    icon: CalendarDays,
  },
  {
    title: "Catálogo de oportunidades",
    description: "Explore pacotes e bloqueios pela camada pública controlada.",
    href: "/oportunidades/catalogo",
    icon: Search,
  },
  {
    title: "Comparar escolhas",
    description: "Mantenha até três oportunidades lado a lado antes de decidir.",
    href: "/oportunidades/comparar",
    icon: Scale,
  },
];

const liveDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatLiveDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : liveDateFormatter.format(date);
}

function liveOfferTitle(item: TravelOfferCatalogItem) {
  return item.name || (item.kind === "air_block" ? item.airline : item.category);
}

function useAdaptiveMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lowPerformance, setLowPerformance] = useState(false);

  useEffect(() => {
    const hardwareConcurrency = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 8 : 8;
    setLowPerformance(hardwareConcurrency <= 4 || window.innerWidth < 390);

    if (typeof window.matchMedia !== "function") return undefined;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener?.(update);
    return () => query.removeListener?.(update);
  }, []);

  return { reducedMotion, lowPerformance };
}

export default function OpportunitiesLive() {
  const [visualState, setVisualState] = useState<TomorrowLiveState>("idle");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const { reducedMotion, lowPerformance } = useAdaptiveMotion();
  const {
    status: voiceStatus,
    connected,
    muted,
    speakerEnabled,
    audioLevel,
    transcript,
    offers,
    toolError,
    error,
    startConversation,
    endConversation,
    toggleMute,
    toggleSpeaker,
  } = useRealtimeVoice();
  const voiceSessionActive = connected || voiceStatus === "connecting";
  const realtimeVisualState: TomorrowLiveState = voiceStatus === "listening"
    ? "listening"
    : voiceStatus === "thinking" || voiceStatus === "connecting"
      ? "thinking"
      : voiceStatus === "speaking"
        ? "speaking"
        : voiceStatus === "offers"
          ? "offers"
          : "idle";
  const displayedState = voiceSessionActive ? realtimeVisualState : visualState;
  const copy = stateCopy[displayedState];
  const transcriptEntries = transcript.length > 0
    ? transcript.map((entry) => ({ speaker: entry.role === "assistant" ? "Téo" : "Você", text: entry.text, final: entry.final }))
    : transcriptPreview.map((entry) => ({ ...entry, final: true }));

  return (
    <div
      className="opportunities-theme min-h-screen overflow-x-hidden bg-tomorrow-background text-tomorrow-text"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-low-performance={lowPerformance ? "true" : "false"}
    >
      <OpportunityHeader
        activeHref="/oportunidades/live"
        navItems={navItems}
        ctaHref="/teo"
        ctaLabel="Continuar por texto"
      />

      <main>
        <section className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden border-b border-tomorrow-line">
          <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_38%,rgba(50,159,158,0.12),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(213,175,72,0.09),transparent_24%),linear-gradient(180deg,#041315_0%,#061b1e_46%,#041012_100%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-55 [background-image:linear-gradient(rgba(122,221,214,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(122,221,214,0.035)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" aria-hidden="true" />

          <div className="mx-auto grid w-full max-w-[90rem] gap-7 px-4 py-6 sm:px-6 sm:py-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:items-center lg:gap-10 lg:px-8 lg:py-10">
            <div className="min-w-0">
              <div className="max-w-3xl">
                <OpportunityBadge variant="neutral">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Tomorrow Live · Voz em tempo real
                </OpportunityBadge>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-tomorrow-teal-soft">{copy.eyebrow}</p>
                <h1 className="mt-3 max-w-3xl font-editorial text-5xl leading-[0.9] text-tomorrow-text sm:text-6xl lg:text-7xl">
                  {copy.title}
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-tomorrow-muted sm:text-base">
                  {copy.body}
                </p>
              </div>

              <div className="mt-6 -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Estados visuais do Tomorrow Live">
                <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
                  {stateOptions.map((option) => {
                    const active = option.value === visualState;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        disabled={voiceSessionActive}
                        className={`opportunity-focus rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                          active
                            ? "border-tomorrow-gold/65 bg-tomorrow-gold/12 text-tomorrow-gold-soft"
                            : "border-tomorrow-line bg-tomorrow-surface/50 text-tomorrow-muted hover:border-tomorrow-teal/55 hover:text-tomorrow-text"
                        }`}
                        onClick={() => setVisualState(option.value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative mt-2 sm:mt-0">
                <LiveParticleGlobe
                  state={displayedState}
                  audioLevel={voiceSessionActive ? audioLevel : undefined}
                  reducedMotion={reducedMotion}
                  lowPerformance={lowPerformance}
                />
                <div className="pointer-events-none absolute left-[4%] top-[57%] hidden items-center gap-2 rounded-full border border-tomorrow-teal/30 bg-tomorrow-background/72 px-3 py-1.5 text-[0.67rem] font-semibold text-tomorrow-teal-soft backdrop-blur sm:flex" aria-hidden="true">
                  <span className="size-1.5 rounded-full bg-tomorrow-teal-soft shadow-tomorrow-teal" />
                  Origem
                </div>
                <div className="pointer-events-none absolute right-[2%] top-[38%] hidden items-center gap-2 rounded-full border border-tomorrow-gold/30 bg-tomorrow-background/72 px-3 py-1.5 text-[0.67rem] font-semibold text-tomorrow-gold-soft backdrop-blur sm:flex" aria-hidden="true">
                  <span className="size-1.5 rounded-full bg-tomorrow-gold-soft shadow-tomorrow-gold" />
                  Destino
                </div>
              </div>
            </div>

            <aside className="min-w-0 rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/72 p-4 shadow-tomorrow-surface backdrop-blur-xl sm:p-5" aria-label="Painel de controle do Tomorrow Live">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-tomorrow-line pb-4">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-tomorrow-teal-soft">
                    <Route className="size-4" aria-hidden="true" />
                    Central de comando
                  </p>
                  <h2 className="mt-2 font-editorial text-3xl text-tomorrow-text">Téo em contexto.</h2>
                </div>
                <OpportunityBadge variant="success">Visual ativo</OpportunityBadge>
              </div>

              <section className="mt-4 rounded-tomorrow border border-tomorrow-line bg-tomorrow-background/55 p-4" aria-labelledby="live-transcript-title">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p id="live-transcript-title" className="text-xs font-bold uppercase tracking-[0.14em] text-tomorrow-muted">
                      {voiceSessionActive || transcript.length > 0 ? "Transcrição da conversa" : "Prévia de transcrição"}
                    </p>
                    <p className="mt-1 text-xs text-tomorrow-muted/80">
                      {voiceSessionActive || transcript.length > 0 ? "Gerada durante a sessão de voz ativa." : "Conteúdo demonstrativo da interface."}
                    </p>
                  </div>
                  <MessageSquareText className="size-5 text-tomorrow-gold-soft" aria-hidden="true" />
                </div>

                <div className="mt-4 grid max-h-64 gap-3 overflow-y-auto pr-1">
                  {transcriptEntries.map((entry, index) => (
                    <div
                      key={`${entry.speaker}-${index}-${entry.final ? "final" : "partial"}`}
                      className={`rounded-xl border p-3 ${
                        entry.speaker === "Téo"
                          ? "border-tomorrow-teal/25 bg-tomorrow-teal/8"
                          : "border-tomorrow-gold/22 bg-tomorrow-gold/7"
                      }`}
                    >
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-tomorrow-muted">{entry.speaker}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-tomorrow-text">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-4" aria-labelledby="live-text-mode-title">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p id="live-text-mode-title" className="text-sm font-semibold text-tomorrow-text">Modo texto</p>
                    <p className="mt-1 text-xs leading-relaxed text-tomorrow-muted">A conversa atual do Téo continua separada e não foi modificada nesta etapa.</p>
                  </div>
                  <Headphones className="size-5 shrink-0 text-tomorrow-teal-soft" aria-hidden="true" />
                </div>
                <OpportunityButton asChild variant="outline" fullWidth className="mt-3">
                  <a href="/teo"><MessageSquareText aria-hidden="true" />Continuar por texto</a>
                </OpportunityButton>
              </section>

              <section className="mt-4 grid grid-cols-4 gap-2" aria-label="Controles do Tomorrow Live">
                <button
                  type="button"
                  disabled={!connected}
                  aria-label={muted ? "Reativar microfone" : "Pausar microfone"}
                  aria-pressed={muted}
                  onClick={toggleMute}
                  className="opportunity-focus grid min-h-14 place-items-center rounded-xl border border-tomorrow-line bg-tomorrow-background/50 text-tomorrow-text transition-colors hover:border-tomorrow-teal/50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {muted ? <MicOff className="size-5" aria-hidden="true" /> : <Mic className="size-5" aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  disabled={!connected}
                  aria-label={speakerEnabled ? "Silenciar áudio do Téo" : "Reativar áudio do Téo"}
                  aria-pressed={!speakerEnabled}
                  onClick={toggleSpeaker}
                  className="opportunity-focus grid min-h-14 place-items-center rounded-xl border border-tomorrow-line bg-tomorrow-background/50 text-tomorrow-text transition-colors hover:border-tomorrow-teal/50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {speakerEnabled ? <Volume2 className="size-5" aria-hidden="true" /> : <VolumeX className="size-5" aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  disabled={!voiceSessionActive}
                  aria-label="Encerrar conversa por voz"
                  onClick={endConversation}
                  className="opportunity-focus grid min-h-14 place-items-center rounded-xl border border-tomorrow-line bg-tomorrow-background/50 text-tomorrow-text transition-colors hover:border-tomorrow-gold/50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Power className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Ver informações de privacidade"
                  aria-expanded={privacyOpen}
                  onClick={() => setPrivacyOpen((current) => !current)}
                  className="opportunity-focus grid min-h-14 place-items-center rounded-xl border border-tomorrow-line bg-tomorrow-background/50 text-tomorrow-text transition-colors hover:border-tomorrow-gold/50"
                >
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </button>
              </section>

              <OpportunityButton
                variant={voiceSessionActive ? "outline" : "gold"}
                fullWidth
                className="mt-3"
                disabled={voiceStatus === "connecting"}
                onClick={voiceSessionActive ? endConversation : startConversation}
              >
                {voiceStatus === "connecting" ? (
                  <><LoaderCircle className="animate-spin" aria-hidden="true" />Conectando com segurança...</>
                ) : voiceSessionActive ? (
                  <><Power aria-hidden="true" />Encerrar conversa</>
                ) : (
                  <><Mic aria-hidden="true" />Iniciar conversa por voz</>
                )}
              </OpportunityButton>

              <p className="mt-2 text-center text-[0.68rem] leading-relaxed text-tomorrow-muted">
                O microfone só é solicitado após o clique e é liberado ao encerrar.
              </p>

              {error ? (
                <div className="mt-3 rounded-xl border border-tomorrow-danger/35 bg-tomorrow-danger/8 p-3 text-xs leading-relaxed text-tomorrow-text" role="alert">
                  {error} <a href="/teo" className="font-semibold text-tomorrow-teal-soft underline underline-offset-2">Continuar por texto</a>
                </div>
              ) : null}

              {toolError ? (
                <div className="mt-3 rounded-xl border border-tomorrow-gold/35 bg-tomorrow-gold/8 p-3 text-xs leading-relaxed text-tomorrow-text" role="alert">
                  {toolError} A conversa continua ativa e nenhuma alternativa foi criada.
                </div>
              ) : null}

              {privacyOpen ? (
                <div className="mt-3 rounded-xl border border-tomorrow-teal/25 bg-tomorrow-teal/7 p-3 text-xs leading-relaxed text-tomorrow-muted" role="status">
                  O microfone nunca é ativado automaticamente. Durante uma sessão, o áudio é transmitido pela conexão Realtime para permitir a conversa e não é salvo por esta interface. Ao encerrar, as tracks, o WebRTC e o AudioContext são fechados. A chave principal permanece somente no servidor.
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        {offers.length > 0 ? (
          <section className="mx-auto grid w-full max-w-[90rem] gap-5 px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="live-offers-title" aria-live="polite">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-tomorrow-gold-soft">Inventário consultado em tempo real</p>
              <h2 id="live-offers-title" className="mt-2 font-editorial text-4xl leading-none text-tomorrow-text sm:text-5xl">Oportunidades encontradas na conversa.</h2>
              <p className="mt-3 text-sm leading-relaxed text-tomorrow-muted sm:text-base">
                Os cards abaixo são os mesmos resultados públicos usados pelo Radar Tomorrow. Preços e disponibilidade permanecem sujeitos à confirmação.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {offers.map((item) => (
                <OpportunityCard
                  key={item.id}
                  id={item.id}
                  kind={item.kind === "air_block" ? "air_block" : "package"}
                  title={liveOfferTitle(item)}
                  origin={item.origin}
                  originIata={item.origin_iata}
                  destination={item.destination || item.destination_iata || "Destino não informado"}
                  destinationIata={item.destination_iata}
                  departureLabel={formatLiveDate(item.departure_date)}
                  returnLabel={formatLiveDate(item.return_date)}
                  nights={item.nights}
                  pricePerPerson={item.price_per_person}
                  taxPerPerson={item.tax_per_person}
                  currency={item.currency}
                  availableSeats={item.available_seats}
                  airfareIncluded={item.airfare_included}
                  imageUrl={item.image_url}
                  imageAlt={item.destination ? `Vista de ${item.destination}` : "Imagem pública da oportunidade"}
                  actionHref={`/oportunidades/oferta/${encodeURIComponent(item.id)}`}
                  actionLabel="Ver detalhes"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto grid w-full max-w-[90rem] gap-5 px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="live-context-title">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-tomorrow-gold-soft">Contexto sem interrupção</p>
            <h2 id="live-context-title" className="mt-2 font-editorial text-4xl leading-none text-tomorrow-text sm:text-5xl">A conversa encontra o que já funciona.</h2>
            <p className="mt-3 text-sm leading-relaxed text-tomorrow-muted sm:text-base">
              A busca de voz agora consulta o inventário público real e pode apresentar até três oportunidades. Nenhum preço, data, voo ou disponibilidade é criado pela interface Live.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {contextCards.map((card) => {
              const Icon = card.icon;
              return (
                <a
                  key={card.href}
                  href={card.href}
                  className="opportunity-focus group rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/60 p-5 transition-[transform,border-color,background-color] duration-200 motion-safe:hover:-translate-y-1 hover:border-tomorrow-gold/45 hover:bg-tomorrow-surface"
                >
                  <span className="grid size-10 place-items-center rounded-xl border border-tomorrow-teal/25 bg-tomorrow-teal/8 text-tomorrow-teal-soft">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-editorial text-2xl text-tomorrow-text">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-tomorrow-muted">{card.description}</p>
                </a>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 rounded-tomorrow-lg border border-tomorrow-gold/25 bg-tomorrow-gold/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-semibold text-tomorrow-text"><ShieldCheck className="size-4 text-tomorrow-gold-soft" aria-hidden="true" />Fundação de voz isolada e segura.</p>
              <p className="mt-1 text-xs leading-relaxed text-tomorrow-muted">A primeira ferramenta de inventário é somente de leitura. Cotação, reserva e WhatsApp continuam fora deste incremento.</p>
            </div>
            <OpportunityButton asChild variant="ghost" className="shrink-0">
              <a href="/oportunidades/catalogo"><Search aria-hidden="true" />Explorar oportunidades</a>
            </OpportunityButton>
          </div>
        </section>
      </main>
    </div>
  );
}
