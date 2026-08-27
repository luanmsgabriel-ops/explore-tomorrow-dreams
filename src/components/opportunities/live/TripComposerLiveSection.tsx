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
      className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center px-3 pt-20 sm:px-5 sm:pt-24"
      aria-label="Roteiro ao vivo"
      data-testid="trip-composer-live-overlay"
    >
      <div className="pointer-events-auto max-h-[76svh] w-full max-w-[78rem] overflow-y-auto rounded-[1.9rem] shadow-[0_34px_110px_rgba(0,0,0,0.72)] [scrollbar-width:thin]">
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
