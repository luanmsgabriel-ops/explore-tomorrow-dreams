import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OpportunitiesLive from "./OpportunitiesLive";

const originalMatchMedia = window.matchMedia;
const originalMediaDevices = navigator.mediaDevices;
const originalPeerConnection = window.RTCPeerConnection;

describe("Tomorrow Live — Etapa 7: fundação de voz", () => {
  const getUserMedia = vi.fn();

  beforeEach(() => {
    getUserMedia.mockReset();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    Object.defineProperty(window, "RTCPeerConnection", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: originalMediaDevices,
    });
    Object.defineProperty(window, "RTCPeerConnection", {
      configurable: true,
      value: originalPeerConnection,
    });
  });

  it("abre a central sem solicitar microfone", () => {
    render(<OpportunitiesLive />);

    expect(screen.getByRole("heading", { name: "A conversa continua enquanto a rota ganha forma." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar conversa por voz" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Pausar microfone" })).toBeDisabled();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("mantém o planeta como palco principal sem painel permanente de transcrição", () => {
    render(<OpportunitiesLive />);

    expect(screen.queryByRole("complementary", { name: "Conversa com o Téo" })).not.toBeInTheDocument();
    expect(screen.queryByText("Sua viagem, em conversa.")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Conversar por texto" })).toHaveAttribute("href", "/teo");
    expect(screen.getByLabelText("Globo visual do Tomorrow Live — Aguardando")).toBeInTheDocument();
  });

  it("solicita microfone somente após o clique e trata permissão negada", async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"));
    render(<OpportunitiesLive />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar conversa por voz" }));

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("alert")).toHaveTextContent("Permissão do microfone negada");
    expect(screen.getAllByRole("link", { name: "Continuar por texto" }).every((link) => link.getAttribute("href") === "/teo")).toBe(true);
  });

  it("inicia a conversa pelo microfone visual do planeta", async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"));
    render(<OpportunitiesLive />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar conversa por voz pelo microfone do planeta" }));

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("alert")).toHaveTextContent("Permissão do microfone negada");
  });

  it("permite visualizar o estado inicial sem iniciar voz ou alterar dados", () => {
    render(<OpportunitiesLive />);

    expect(screen.getByLabelText("Globo visual do Tomorrow Live — Aguardando")).toHaveAttribute("data-live-state", "idle");
    expect(screen.getByText("Converse com o Téo e descubra oportunidades que combinam com você.")).toBeInTheDocument();
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

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver informações de privacidade" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "O microfone só é usado enquanto você estiver falando com o Téo.",
    );
    expect(screen.getByText(/Sua conversa é privada/)).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
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
