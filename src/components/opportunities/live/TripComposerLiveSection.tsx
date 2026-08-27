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

export function TripComposerLiveSection({ runtime, reducedMotion }: { runtime: TripComposerLiveRuntime; reducedMotion: boolean }) {
  if (!runtime.active) return null;

  return (
    <section
      className="fixed inset-x-0 bottom-3 z-[70] px-3 sm:bottom-5 sm:px-5"
      aria-label="Roteiro ao vivo"
      data-testid="trip-composer-live-overlay"
    >
      <div className="mx-auto max-h-[78svh] w-full max-w-[90rem] overflow-y-auto rounded-[1.9rem] shadow-[0_28px_90px_rgba(0,0,0,0.62)] [scrollbar-width:thin]">
        <TripComposerPanel
          days={runtime.days}
          activeDay={runtime.activeDay}
          candidates={runtime.candidates}
          focusedCandidateId={runtime.focusedCandidateId}
          selectedCandidateId={runtime.selectedCandidateId}
          reducedMotion={reducedMotion}
          onDayChange={runtime.setActiveDay}
          onFocusCandidate={runtime.setFocusedCandidate}
          onSelectCandidate={(id) => { void runtime.selectCandidate(id, runtime.activeDay); }}
        />
      </div>
    </section>
  );
}
