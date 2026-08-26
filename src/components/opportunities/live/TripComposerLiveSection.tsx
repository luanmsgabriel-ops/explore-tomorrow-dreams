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
    <section className="border-b border-tomorrow-line bg-[#031012]">
      <div className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8">
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
