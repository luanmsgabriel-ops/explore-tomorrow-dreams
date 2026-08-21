import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OpportunitiesLive from "./OpportunitiesLive";

const originalMatchMedia = window.matchMedia;
const originalMediaDevices = navigator.mediaDevices;

describe("Tomorrow Live — Etapa 6 visual", () => {
  const getUserMedia = vi.fn();

  beforeEach(() => {
    getUserMedia.mockReset();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it("abre a central visual sem solicitar microfone", () => {
    render(<OpportunitiesLive />);

    expect(screen.getByText("Tomorrow Live · Interface visual")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Microfone indisponível nesta etapa" })).toBeDisabled();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("permite visualizar estados sem iniciar voz ou alterar dados", () => {
    render(<OpportunitiesLive />);

    fireEvent.click(screen.getByRole("button", { name: "Pensando" }));

    expect(screen.getByLabelText("Planeta visual do Tomorrow Live — Pensando")).toHaveAttribute("data-live-state", "thinking");
    expect(screen.getByText("Menos ruído. Mais clareza sobre o que importa.")).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("mantém os atalhos contextuais ligados somente às experiências existentes", () => {
    render(<OpportunitiesLive />);

    expect(screen.getByRole("link", { name: /Calendário inteligente/ })).toHaveAttribute("href", "/oportunidades/calendario");
    expect(screen.getByRole("link", { name: /Catálogo de oportunidades/ })).toHaveAttribute("href", "/oportunidades/catalogo");
    expect(screen.getByRole("link", { name: /Comparar escolhas/ })).toHaveAttribute("href", "/oportunidades/comparar");
    expect(screen.getAllByRole("link", { name: "Live" }).length).toBeGreaterThan(0);
  });

  it("explica privacidade e não mascara a ausência da voz em tempo real", () => {
    render(<OpportunitiesLive />);

    fireEvent.click(screen.getByRole("button", { name: "Ver informações de privacidade" }));

    expect(screen.getByRole("status")).toHaveTextContent("não acessa microfone");
    expect(screen.getByText(/Voz em tempo real, ferramentas e consulta conversacional de estoque pertencem à Etapa 7/)).toBeInTheDocument();
  });

  it("respeita preferência de movimento reduzido", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    const { container } = render(<OpportunitiesLive />);

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute("data-reduced-motion", "true");
    });
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
