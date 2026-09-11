import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveGlobeRoute } from "@/lib/liveRoute";
import { LiveRouteGlobe } from "./LiveRouteGlobe";

const route: LiveGlobeRoute = {
  id: "gru-rec",
  offerId: "offer-1",
  origin: { lat: -23.4356, lng: -46.4731, label: "GRU", iata: "GRU" },
  destination: { lat: -8.1265, lng: -34.9236, label: "REC", iata: "REC" },
};

describe("LiveRouteGlobe", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mantém um fallback funcional sem inventar rota", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<LiveRouteGlobe state="idle" routes={[]} reducedMotion />);

    const globe = screen.getByLabelText("Globo visual do Tomorrow Live — Aguardando");
    expect(globe).toHaveAttribute("data-route-count", "0");
    expect(globe).toHaveAttribute("data-visual-engine", "webgl-semantic-route-globe");
    expect(screen.queryByText(/GRU → REC/)).not.toBeInTheDocument();

    await waitFor(() => expect(globe).toHaveAttribute("data-renderer", "fallback"));
  });

  it("expõe na semântica somente a rota sustentada pelos dados recebidos", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<LiveRouteGlobe state="offers" routes={[route]} reducedMotion />);

    const globe = screen.getByLabelText(/Globo visual do Tomorrow Live — Ofertas — rota GRU → REC/);
    expect(globe).toHaveAttribute("data-route-count", "1");
    expect(screen.getByText("GRU → REC")).toBeInTheDocument();

    await waitFor(() => expect(globe).toHaveAttribute("data-renderer", "fallback"));
  });
});
