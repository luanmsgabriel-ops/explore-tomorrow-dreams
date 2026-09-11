import { useEffect, useMemo, useState } from "react";
import { Clock3, LoaderCircle, MapPin, Maximize2, Minimize2, Plus, X } from "lucide-react";

import { TripComposerPanel } from "@/components/opportunities/live/TripComposerPanel";

export type TripComposerLiveRuntime = {
  active: boolean;
  activeDay: number;
  days: Parameters<typeof TripComposerPanel>[0]["days"];
  candidates: Parameters<typeof TripComposerPanel>[0]["candidates"];
  selectedCandidateId: string | null;
  focusedCandidateId: string | null;
  setActiveDay: (day: number) => void;
  setFocusedCandidate: (id: string) => void;
  selectCandidate: (id: string, dayNumber?: number, startsAt?: string, endsAt?: string) => Promise<unknown>;
};

function formatMinutes(value?: number | null) {
  if (!value) return null;
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}min` : `${hours}h`;
}

export function TripComposerLiveSection({ runtime, reducedMotion }: { runtime: TripComposerLiveRuntime; reducedMotion: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const [detailCandidateId, setDetailCandidateId] = useState<string | null>(null);
  const [pendingCandidateId, setPendingCandidateId] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const candidateSignature = runtime.candidates.map((candidate) => candidate.id).join(":");
  const detailCandidate = useMemo(
    () => runtime.candidates.find((candidate) => candidate.id === detailCandidateId) ?? null,
    [detailCandidateId, runtime.candidates],
  );

  useEffect(() => {
    if (!runtime.active) return;
    setExpanded(true);
    setSelectionError(null);
  }, [candidateSignature, runtime.active, runtime.activeDay]);

  useEffect(() => {
    if (!runtime.active) {
      setDetailCandidateId(null);
      setPendingCandidateId(null);
      setSelectionError(null);
    }
  }, [runtime.active]);

  if (!runtime.active) return null;

  const selectCandidate = async (candidateId: string) => {
    if (pendingCandidateId) return;
    setPendingCandidateId(candidateId);
    setSelectionError(null);
    try {
      await runtime.selectCandidate(candidateId, runtime.activeDay);
      setDetailCandidateId(null);
    } catch {
      setSelectionError("Não foi possível adicionar esta experiência agora. A conversa continua ativa; tente novamente ou peça outra opção ao Téo.");
    } finally {
      setPendingCandidateId(null);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="opportunity-focus fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[80] flex min-h-12 items-center gap-3 rounded-full border border-[#d5af48]/45 bg-[#06181b]/96 px-4 py-2.5 text-left text-white shadow-[0_24px_70px_rgba(0,0,0,0.7),0_0_28px_rgba(213,175,72,0.16)] backdrop-blur-xl sm:right-5"
        aria-label={`Retomar roteiro ao vivo no dia ${runtime.activeDay}`}
      >
        <Maximize2 className="size-4 text-[#d5af48]" aria-hidden="true" />
        <span>
          <span className="block text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[#62d6cf]">Trip Composer</span>
          <span className="block text-xs font-semibold">Retomar dia {runtime.activeDay}</span>
        </span>
      </button>
    );
  }

  return (
    <section
      className="pointer-events-none fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-[#020b0d]/58 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,env(safe-area-inset-top))] backdrop-blur-[3px] sm:px-5 sm:pt-[max(5.5rem,env(safe-area-inset-top))]"
      aria-label="Roteiro ao vivo"
      data-testid="trip-composer-live-overlay"
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[78rem]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#06181b]/94 px-3 py-2.5 text-white shadow-xl backdrop-blur-xl sm:px-4">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#62d6cf]">Roteiro ao vivo</p>
            <p className="truncate text-xs text-white/60">A conversa e a voz continuam ativas por trás desta camada.</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="opportunity-focus flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white/72 transition hover:border-[#d5af48]/45 hover:text-white"
          >
            <Minimize2 className="size-4" aria-hidden="true" />
            Minimizar
          </button>
        </div>

        {selectionError ? (
          <p role="alert" className="mb-2 rounded-xl border border-red-300/25 bg-red-300/8 px-4 py-3 text-xs leading-relaxed text-red-100">
            {selectionError}
          </p>
        ) : null}

        <div className="rounded-[1.9rem] shadow-[0_34px_110px_rgba(0,0,0,0.72)]">
          <TripComposerPanel
            days={runtime.days}
            activeDay={runtime.activeDay}
            candidates={runtime.candidates}
            focusedCandidateId={runtime.focusedCandidateId}
            selectedCandidateId={runtime.selectedCandidateId}
            reducedMotion={reducedMotion}
            onDayChange={runtime.setActiveDay}
            onFocusCandidate={runtime.setFocusedCandidate}
            onSelectCandidate={(id) => { void selectCandidate(id); }}
            onRequestMoreInfo={(id) => setDetailCandidateId(id)}
          />
        </div>
      </div>

      {detailCandidate ? (
        <div
          className="pointer-events-auto fixed inset-0 z-[90] grid items-end bg-black/65 p-3 backdrop-blur-sm sm:place-items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setDetailCandidateId(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="trip-composer-detail-title"
            className="relative w-full max-w-2xl overflow-hidden rounded-[1.6rem] border border-[#d5af48]/35 bg-[#041214]/98 text-white shadow-[0_32px_110px_rgba(0,0,0,0.8)]"
          >
            <button
              type="button"
              onClick={() => setDetailCandidateId(null)}
              aria-label="Fechar detalhes da experiência"
              className="opportunity-focus absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full border border-white/12 bg-black/45 text-white/75 backdrop-blur hover:text-white"
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            {detailCandidate.photos[0]?.url ? (
              <div className="relative h-52 overflow-hidden sm:h-64">
                <img src={detailCandidate.photos[0].url} alt={detailCandidate.title} className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#041214] via-transparent to-transparent" />
              </div>
            ) : null}

            <div className={`p-5 sm:p-6 ${detailCandidate.photos[0]?.url ? "relative -mt-10" : "pt-16"}`}>
              {detailCandidate.category ? <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#62d6cf]">{detailCandidate.category.replace(/_/g, " ")}</p> : null}
              <h2 id="trip-composer-detail-title" className="mt-1 pr-10 font-editorial text-3xl leading-tight sm:text-4xl">{detailCandidate.title}</h2>
              {detailCandidate.summary ? <p className="mt-4 text-sm leading-relaxed text-white/68">{detailCandidate.summary}</p> : null}

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/65">
                {formatMinutes(detailCandidate.durationMinutes) ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2">
                    <Clock3 className="size-3.5 text-[#d5af48]" aria-hidden="true" />
                    {formatMinutes(detailCandidate.durationMinutes)}
                  </span>
                ) : null}
                {detailCandidate.travelMinutes ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2">
                    <MapPin className="size-3.5 text-[#62d6cf]" aria-hidden="true" />
                    {detailCandidate.travelMinutes} min de deslocamento
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => { void selectCandidate(detailCandidate.id); }}
                disabled={Boolean(pendingCandidateId)}
                className="opportunity-focus mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d5af48] px-4 text-sm font-bold text-[#071416] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
              >
                {pendingCandidateId === detailCandidate.id ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                {pendingCandidateId === detailCandidate.id ? "Adicionando..." : "Adicionar ao roteiro"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
