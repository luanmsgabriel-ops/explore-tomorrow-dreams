import { CheckCircle2, CircleDot, Clock3, Navigation, ShieldCheck, WifiOff } from "lucide-react";

import type { VoiceTranscriptEntry } from "@/lib/realtimeVoice";
import type { LiveGlobeRoute } from "@/lib/liveRoute";
import type { LiveSessionSnapshot, LiveSessionTone } from "@/lib/liveSessionModel";
import { cn } from "@/lib/utils";
import { LiveTranscriptDrawer } from "./LiveTranscriptDrawer";

interface LiveSessionCockpitProps {
  snapshot: LiveSessionSnapshot;
  routes: LiveGlobeRoute[];
  offerCount: number;
  transcript: VoiceTranscriptEntry[];
  connected: boolean;
  latestInventoryUpdate: string | null;
  notice: string;
}

const toneClasses: Record<LiveSessionTone, string> = {
  neutral: "border-tomorrow-line bg-white/[0.035] text-tomorrow-muted",
  active: "border-tomorrow-teal/35 bg-tomorrow-teal/8 text-tomorrow-teal-soft",
  success: "border-tomorrow-gold/35 bg-tomorrow-gold/8 text-tomorrow-gold-soft",
  warning: "border-amber-300/30 bg-amber-300/8 text-amber-100",
  danger: "border-red-300/30 bg-red-300/8 text-red-100",
};

function formatInventoryUpdate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

export function LiveSessionCockpit({
  snapshot,
  routes,
  offerCount,
  transcript,
  connected,
  latestInventoryUpdate,
  notice,
}: LiveSessionCockpitProps) {
  const formattedUpdate = formatInventoryUpdate(latestInventoryUpdate);
  const primaryRoute = routes[0] ?? null;

  return (
    <section aria-label="Estado da sessão Tomorrow Live" className="mx-auto mt-5 w-full max-w-4xl">
      <div className="overflow-hidden rounded-[1.4rem] border border-tomorrow-line bg-[#05191c]/88 shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-[0.66rem] font-bold uppercase tracking-[0.14em]", toneClasses[snapshot.tone])}>
                {snapshot.stage === "offline" ? <WifiOff className="size-3.5" aria-hidden="true" /> : snapshot.stage === "handoff" || snapshot.stage === "reviewing" ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <CircleDot className="size-3.5" aria-hidden="true" />}
                {snapshot.label}
              </span>
              {offerCount > 0 ? (
                <span className="rounded-full border border-tomorrow-gold/20 bg-tomorrow-gold/5 px-3 py-1.5 text-[0.65rem] font-semibold text-tomorrow-gold-soft">
                  {offerCount} {offerCount === 1 ? "opção real" : "opções reais"}
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-tomorrow-text">{snapshot.detail}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-tomorrow-muted">{snapshot.nextAction}</p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.055]" aria-hidden="true">
              <div
                className="h-full rounded-full bg-gradient-to-r from-tomorrow-teal via-tomorrow-teal-soft to-tomorrow-gold transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${snapshot.progress}%` }}
              />
            </div>
          </div>

          <div className="grid content-start gap-2 text-xs">
            <div className="flex min-h-10 items-center gap-2 rounded-xl border border-tomorrow-line bg-white/[0.025] px-3 text-tomorrow-muted">
              <Navigation className="size-4 shrink-0 text-tomorrow-teal-soft" aria-hidden="true" />
              <span className="min-w-0 truncate">
                {primaryRoute ? `${primaryRoute.origin.label} → ${primaryRoute.destination.label}${routes.length > 1 ? ` +${routes.length - 1}` : ""}` : "A rota aparece após uma oferta real."}
              </span>
            </div>
            <div className="flex min-h-10 items-center gap-2 rounded-xl border border-tomorrow-line bg-white/[0.025] px-3 text-tomorrow-muted">
              <Clock3 className="size-4 shrink-0 text-tomorrow-gold-soft" aria-hidden="true" />
              <span>{formattedUpdate ? `Inventário atualizado em ${formattedUpdate}` : "Atualização confirmada na próxima consulta."}</span>
            </div>
          </div>
        </div>

        {offerCount > 0 ? (
          <div className="flex gap-2 border-t border-tomorrow-line bg-tomorrow-gold/[0.035] px-4 py-3 text-[0.68rem] leading-relaxed text-tomorrow-muted sm:px-5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-tomorrow-gold-soft" aria-hidden="true" />
            <span>{notice}</span>
          </div>
        ) : null}
      </div>

      <LiveTranscriptDrawer entries={transcript} connected={connected} className="mt-3" />
    </section>
  );
}
