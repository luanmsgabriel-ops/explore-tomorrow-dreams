import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TripComposerPanel } from "./TripComposerPanel";

const days = [
  { dayNumber: 1, status: "planning" as const, items: [{ id: "slot", title: "Janela livre", startsAt: "16:30", endsAt: "19:00", kind: "free_time" as const }] },
  { dayNumber: 2, status: "planned" as const, items: [] },
];

const candidates = [
  { id: "a", title: "Museu A", category: "Cultura", durationMinutes: 90, photos: [{ url: "https://example.com/a1.jpg" }, { url: "https://example.com/a2.jpg" }] },
  { id: "b", title: "Parque B", category: "Natureza", durationMinutes: 120, photos: [{ url: "https://example.com/b.jpg" }] },
  { id: "c", title: "Mercado C", category: "Gastronomia", durationMinutes: 60, photos: [{ url: "https://example.com/c.jpg" }] },
];

describe("TripComposerPanel", () => {
  it("renders up to three experience cards and the current timeline", () => {
    render(<TripComposerPanel days={days} activeDay={1} candidates={candidates} reducedMotion />);
    expect(screen.getByText("Janela livre")).toBeInTheDocument();
    expect(screen.getByText("Museu A")).toBeInTheDocument();
    expect(screen.getByText("Parque B")).toBeInTheDocument();
    expect(screen.getByText("Mercado C")).toBeInTheDocument();
  });

  it("collapses alternatives when one candidate is selected", () => {
    render(<TripComposerPanel days={days} activeDay={1} candidates={candidates} selectedCandidateId="b" reducedMotion />);
    expect(screen.getByText("Parque B")).toBeInTheDocument();
    expect(screen.queryByText("Museu A")).not.toBeInTheDocument();
    expect(screen.queryByText("Mercado C")).not.toBeInTheDocument();
  });

  it("emits selection and day navigation actions", () => {
    const onSelectCandidate = vi.fn();
    const onDayChange = vi.fn();
    render(<TripComposerPanel days={days} activeDay={1} candidates={candidates.slice(0, 1)} onSelectCandidate={onSelectCandidate} onDayChange={onDayChange} reducedMotion />);
    fireEvent.click(screen.getByRole("button", { name: /adicionar/i }));
    expect(onSelectCandidate).toHaveBeenCalledWith("a");
    fireEvent.click(screen.getByRole("button", { name: /dia 2/i }));
    expect(onDayChange).toHaveBeenCalledWith(2);
  });
});