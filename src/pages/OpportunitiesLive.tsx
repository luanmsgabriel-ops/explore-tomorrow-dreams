import { useEffect, useState } from "react";
import {
  CalendarDays,
  LoaderCircle,
  MessageSquareText,
  Mic,
  MicOff,
  Power,
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
  OpportunityHeader,
} from "@/components/opportunities";
import {
  LiveParticleGlobe,
  type TomorrowLiveState,
} from "@/components/opportunities/live/LiveParticleGlobe";
import { LiveOfferOverlay } from "@/components/opportunities/live/LiveOfferOverlay";
import { TripComposerLiveSection } from "@/components/opportunities/live/TripComposerLiveSection";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import {
  buildOfferDetailPath,
  buildOfferWhatsAppUrl,
} from "@/lib/offerHandoff";

const navItems = [
  { label: "Catálogo", href: "/oportunidades/catalogo" },
  { label: "Live", href: "/oportunidades/live" },
  { label: "Comparar", href: "/oportunidades/comparar" },
];

const LIVE_TITLE = "A conversa continua enquanto a rota ganha forma.";

const stateCopy: Record<TomorrowLiveState, { eyebrow: string; body: string }> = {
  idle: { eyebrow: "Téo pronto", body: "Converse com o Téo e descubra oportunidades que combinam com você." },
  listening: { eyebrow: "Estou ouvindo", body: "Conte o que você procura e deixe a conversa seguir de forma natural." },
  thinking: { eyebrow: "Buscando possibilidades", body: "O Téo organiza suas preferências e procura as melhores opções disponíveis." },
  speaking: { eyebrow: "Téo falando", body: "Ouça as opções e interrompa quando quiser para ajustar sua busca." },
  offers: { eyebrow: "Opções encontradas", body: "Compare as oportunidades na tela e peça ao Téo para abrir a que mais gostar." },
};

const contextCards = [
  { title: "Calendário inteligente", description: "Encontre datas e valores para planejar a melhor saída.", href: "/oportunidades/calendario", icon: CalendarDays },
  { title: "Catálogo de oportunidades", description: "Explore pacotes e bloqueios disponíveis para sua próxima viagem.", href: "/oportunidades/catalogo", icon: Search },
  { title: "Comparar escolhas", description: "Veja suas opções lado a lado antes de decidir.", href: "/oportunidades/comparar", icon: Scale },
];

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
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const { reducedMotion, lowPerformance } = useAdaptiveMotion();
  const {
    status: voiceStatus,
    connected,
    muted,
    speakerEnabled,
    audioLevel,
    offers,
    offerHandoff,
    tripComposer,
    toolError,
    error,
    startConversation,
    endConversation,
    toggleMute,
    toggleSpeaker,
  } = useRealtimeVoice();

  const voiceSessionActive = connected || voiceStatus === "connecting";
  const displayedState: TomorrowLiveState = voiceStatus === "listening"
    ? "listening"
    : voiceStatus === "thinking" || voiceStatus === "connecting"
      ? "thinking"
      : voiceStatus === "speaking"
        ? "speaking"
        : voiceStatus === "offers"
          ? "offers"
          : "idle";
  const globeMicrophoneState = voiceStatus === "connecting"
    ? "connecting"
    : connected
      ? muted ? "muted" : "active"
      : "idle";
  const copy = stateCopy[displayedState];
  const handoffDetailPath = offerHandoff ? buildOfferDetailPath(offerHandoff.offer.id) : null;
  const handoffWhatsAppUrl = offerHandoff
    ? buildOfferWhatsAppUrl(offerHandoff.offer, { context: offerHandoff.searchContext })
    : null;

  return (
    <div
      className="opportunities-theme min-h-screen overflow-x-hidden bg-tomorrow-background text-tomorrow-text"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-low-performance={lowPerformance ? "true" : "false"}
    >
      <OpportunityHeader activeHref="/oportunidades/live" navItems={navItems} ctaHref="/teo" ctaLabel="Continuar por texto" />

      <main>
        <section className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden border-b border-tomorrow-line">
          <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_40%,rgba(50,159,158,0.13),transparent_34%),radial-gradient(circle_at_50%_22%,rgba(213,175,72,0.11),transparent_30%),linear-gradient(180deg,#041315_0%,#061b1e_46%,#041012_100%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-55 [background-image:linear-gradient(rgba(122,221,214,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(213,175,72,0.028)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" aria-hidden="true" />

          <div className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
            <div className="mx-auto max-w-6xl text-center">
              <OpportunityBadge variant="neutral"><Sparkles className="size-3.5" aria-hidden="true" />Tomorrow Live</OpportunityBadge>
              <p className="mt-5 min-h-4 text-xs font-bold uppercase tracking-[0.22em] text-tomorrow-teal-soft transition-opacity duration-300">{copy.eyebrow}</p>
              <h1 className="mx-auto mt-3 max-w-6xl font-editorial text-5xl leading-[0.92] text-tomorrow-text sm:text-6xl lg:text-[5.25rem]">{LIVE_TITLE}</h1>
              <p className="mx-auto mt-5 min-h-[2.8rem] max-w-3xl text-sm leading-relaxed text-tomorrow-muted transition-opacity duration-300 sm:text-base">{copy.body}</p>
            </div>

            <div className="relative mx-auto mt-1 max-w-[78rem]">
              <LiveParticleGlobe
                state={displayedState}
                audioLevel={voiceSessionActive ? audioLevel : undefined}
                reducedMotion={reducedMotion}
                lowPerformance={lowPerformance}
                microphoneState={globeMicrophoneState}
                onMicrophoneClick={connected ? toggleMute : startConversation}
              />
              <LiveOfferOverlay offers={offers} handoff={offerHandoff} detailPath={handoffDetailPath} whatsappUrl={handoffWhatsAppUrl} />
              <div className="pointer-events-none absolute left-[5%] top-[57%] hidden items-center gap-2 rounded-full border border-tomorrow-teal/30 bg-tomorrow-background/72 px-3 py-1.5 text-[0.67rem] font-semibold text-tomorrow-teal-soft backdrop-blur sm:flex" aria-hidden="true">
                <span className="size-1.5 rounded-full bg-tomorrow-teal-soft shadow-tomorrow-teal" />Origem
              </div>
              <div className="pointer-events-none absolute right-[5%] top-[38%] hidden items-center gap-2 rounded-full border border-tomorrow-gold/35 bg-tomorrow-background/72 px-3 py-1.5 text-[0.67rem] font-semibold text-tomorrow-gold-soft backdrop-blur sm:flex" aria-hidden="true">
                <span className="size-1.5 rounded-full bg-tomorrow-gold-soft shadow-tomorrow-gold" />Destino
              </div>
            </div>

            <div className="mx-auto mt-3 flex max-w-3xl flex-col items-center gap-3">
              <section className="grid grid-cols-4 gap-2" aria-label="Controles da conversa">
                <button type="button" disabled={!connected} aria-label={muted ? "Reativar microfone" : "Pausar microfone"} aria-pressed={muted} onClick={toggleMute} className="opportunity-focus grid size-12 place-items-center rounded-xl border border-tomorrow-line bg-tomorrow-background/60 text-tomorrow-text backdrop-blur transition-colors hover:border-tomorrow-teal/50 disabled:cursor-not-allowed disabled:opacity-45 sm:size-14">
                  {muted ? <MicOff className="size-5" aria-hidden="true" /> : <Mic className="size-5" aria-hidden="true" />}
                </button>
                <button type="button" disabled={!connected} aria-label={speakerEnabled ? "Silenciar áudio do Téo" : "Reativar áudio do Téo"} aria-pressed={!speakerEnabled} onClick={toggleSpeaker} className="opportunity-focus grid size-12 place-items-center rounded-xl border border-tomorrow-line bg-tomorrow-background/60 text-tomorrow-text backdrop-blur transition-colors hover:border-tomorrow-teal/50 disabled:cursor-not-allowed disabled:opacity-45 sm:size-14">
                  {speakerEnabled ? <Volume2 className="size-5" aria-hidden="true" /> : <VolumeX className="size-5" aria-hidden="true" />}
                </button>
                <button type="button" disabled={!voiceSessionActive} aria-label="Encerrar conversa por voz" onClick={endConversation} className="opportunity-focus grid size-12 place-items-center rounded-xl border border-tomorrow-line bg-tomorrow-background/60 text-tomorrow-text backdrop-blur transition-colors hover:border-tomorrow-gold/50 disabled:cursor-not-allowed disabled:opacity-45 sm:size-14"><Power className="size-5" aria-hidden="true" /></button>
                <button type="button" aria-label="Ver informações de privacidade" aria-expanded={privacyOpen} onClick={() => setPrivacyOpen((current) => !current)} className="opportunity-focus grid size-12 place-items-center rounded-xl border border-tomorrow-line bg-tomorrow-background/60 text-tomorrow-text backdrop-blur transition-colors hover:border-tomorrow-gold/50 sm:size-14"><ShieldCheck className="size-5" aria-hidden="true" /></button>
              </section>

              <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
                <OpportunityButton variant={voiceSessionActive ? "outline" : "gold"} fullWidth disabled={voiceStatus === "connecting"} onClick={voiceSessionActive ? endConversation : startConversation}>
                  {voiceStatus === "connecting" ? <><LoaderCircle className="animate-spin" aria-hidden="true" />Conectando...</> : voiceSessionActive ? <><Power aria-hidden="true" />Encerrar conversa</> : <><Mic aria-hidden="true" />Iniciar conversa por voz</>}
                </OpportunityButton>
                <OpportunityButton asChild variant="outline" fullWidth><a href="/teo"><MessageSquareText aria-hidden="true" />Conversar por texto</a></OpportunityButton>
              </div>

              {connected ? <OpportunityBadge variant="success">Conectado</OpportunityBadge> : null}
              {error ? <div className="w-full max-w-xl rounded-xl border border-tomorrow-danger/35 bg-tomorrow-danger/8 p-3 text-center text-xs leading-relaxed text-tomorrow-text" role="alert">{error} <a href="/teo" className="font-semibold text-tomorrow-teal-soft underline underline-offset-2">Continuar por texto</a></div> : null}
              {toolError ? <div className="w-full max-w-xl rounded-xl border border-tomorrow-gold/35 bg-tomorrow-gold/8 p-3 text-center text-xs leading-relaxed text-tomorrow-text" role="alert">{toolError}</div> : null}
              {privacyOpen ? <div className="w-full max-w-xl rounded-xl border border-tomorrow-teal/25 bg-tomorrow-teal/7 p-3 text-center text-xs leading-relaxed text-tomorrow-muted" role="status">Sua conversa é privada. O microfone só é usado enquanto você estiver falando com o Téo.</div> : null}
            </div>
          </div>
        </section>

        <TripComposerLiveSection runtime={tripComposer} reducedMotion={reducedMotion} />

        <section className="mx-auto grid w-full max-w-[90rem] gap-5 px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="live-context-title">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-tomorrow-gold-soft">Continue explorando</p>
            <h2 id="live-context-title" className="mt-2 font-editorial text-4xl leading-none text-tomorrow-text sm:text-5xl">Sua próxima viagem está mais perto.</h2>
            <p className="mt-3 text-sm leading-relaxed text-tomorrow-muted sm:text-base">Explore datas, compare oportunidades ou abra o catálogo completo.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {contextCards.map((card) => {
              const Icon = card.icon;
              return (
                <a key={card.href} href={card.href} className="opportunity-focus group rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/60 p-5 transition-[transform,border-color,background-color] duration-200 motion-safe:hover:-translate-y-1 hover:border-tomorrow-gold/45 hover:bg-tomorrow-surface">
                  <span className="grid size-10 place-items-center rounded-xl border border-tomorrow-teal/25 bg-tomorrow-teal/8 text-tomorrow-teal-soft"><Icon className="size-5" aria-hidden="true" /></span>
                  <h3 className="mt-4 font-editorial text-2xl text-tomorrow-text">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-tomorrow-muted">{card.description}</p>
                </a>
              );
            })}
          </div>
          <div className="flex justify-end"><OpportunityButton asChild variant="ghost"><a href="/oportunidades/catalogo"><Search aria-hidden="true" />Explorar oportunidades</a></OpportunityButton></div>
        </section>
      </main>
    </div>
  );
}
