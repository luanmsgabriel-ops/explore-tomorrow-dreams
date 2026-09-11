import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TripComposerLiveSection, type TripComposerLiveRuntime } from "./TripComposerLiveSection";

function runtime(overrides: Partial<TripComposerLiveRuntime> = {}): TripComposerLiveRuntime {
  return {
    active: true,
    activeDay: 1,
    days: [{ dayNumber: 1, dateLabel: "12 de outubro de 2026", status: "planning", items: [] }],
    candidates: [{
      id: "experience-1",
      title: "Passeio histórico pelo Recife Antigo",
      summary: "Experiência cultural compatível com a janela disponível.",
      durationMinutes: 180,
      travelMinutes: 20,
      distanceMeters: 6400,
      category: "tour",
      photos: [],
    }],
    selectedCandidateId: null,
    focusedCandidateId: "experience-1",
    setActiveDay: vi.fn(),
    setFocusedCandidate: vi.fn(),
    selectCandidate: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
}

describe("TripComposerLiveSection", () => {
  it("permite minimizar e retomar o roteiro sem encerrar a experiência", () => {
    render(<TripComposerLiveSection runtime={runtime()} reducedMotion />);

    expect(screen.getByTestId("trip-composer-live-overlay")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Minimizar" }));

    expect(screen.queryByTestId("trip-composer-live-overlay")).not.toBeInTheDocument();
    const resume = screen.getByRole("button", { name: "Retomar roteiro ao vivo no dia 1" });
    expect(resume).toBeInTheDocument();

    fireEvent.click(resume);
    expect(screen.getByTestId("trip-composer-live-overlay")).toBeInTheDocument();
  });

  it("abre contexto adicional e adiciona somente o candidato exibido", async () => {
    const selectCandidate = vi.fn().mockResolvedValue({ ok: true });
    render(<TripComposerLiveSection runtime={runtime({ selectCandidate })} reducedMotion />);

    fireEvent.click(screen.getByRole("button", { name: "Saber mais" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Passeio histórico pelo Recife Antigo" })).toBeInTheDocument();
    expect(screen.getByText("Experiência cultural compatível com a janela disponível.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Adicionar ao roteiro" }));

    await waitFor(() => {
      expect(selectCandidate).toHaveBeenCalledWith("experience-1", 1);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mantém a conversa utilizável quando a inclusão falha", async () => {
    const selectCandidate = vi.fn().mockRejectedValue(new Error("network"));
    render(<TripComposerLiveSection runtime={runtime({ selectCandidate })} reducedMotion />);

    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível adicionar esta experiência agora");
    expect(screen.getByRole("button", { name: "Minimizar" })).toBeEnabled();
  });
});
