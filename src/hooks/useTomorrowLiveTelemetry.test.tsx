import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  trackEventStandalone: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/hooks/useAnalytics", () => ({
  trackEventStandalone: mocks.trackEventStandalone,
}));

import { trackTomorrowLiveAction, useTomorrowLiveTelemetry } from "./useTomorrowLiveTelemetry";

const initial = {
  voiceStatus: "idle" as const,
  connected: false,
  online: true,
  offerIds: [] as string[],
  offerTypes: [] as string[],
  routeCount: 0,
  handoffChannel: null,
  composerActive: false,
};

describe("Tomorrow Live telemetry", () => {
  beforeEach(() => {
    mocks.trackEventStandalone.mockClear();
  });

  it("não envia evento apenas por renderizar o estado inicial", () => {
    renderHook(() => useTomorrowLiveTelemetry(initial));
    expect(mocks.trackEventStandalone).not.toHaveBeenCalled();
  });

  it("mede transições e resultados somente com metadados operacionais", () => {
    const { rerender } = renderHook((props) => useTomorrowLiveTelemetry(props), {
      initialProps: initial,
    });

    rerender({
      ...initial,
      voiceStatus: "offers" as const,
      connected: true,
      offerIds: ["offer-2", "offer-1"],
      offerTypes: ["pacote", "pacote"],
      routeCount: 1,
      handoffChannel: "details" as const,
      composerActive: true,
    });

    expect(mocks.trackEventStandalone).toHaveBeenCalledWith(
      "tomorrow_live_voice_status_changed",
      expect.objectContaining({ previous_status: "idle", status: "offers", connected: true }),
    );
    expect(mocks.trackEventStandalone).toHaveBeenCalledWith(
      "tomorrow_live_offers_rendered",
      { count: 2, offer_types: ["pacote"], route_count: 1 },
    );
    expect(mocks.trackEventStandalone).toHaveBeenCalledWith(
      "tomorrow_live_handoff_ready",
      { channel: "details" },
    );
    expect(mocks.trackEventStandalone).toHaveBeenCalledWith(
      "tomorrow_live_trip_composer_opened",
      { offer_count: 2 },
    );

    const payloads = mocks.trackEventStandalone.mock.calls.map(([, payload]) => JSON.stringify(payload));
    expect(payloads.join(" ")).not.toMatch(/transcript|mensagem|Quero viajar/i);
  });

  it("registra novamente ofertas e handoff quando uma nova busca repete o mesmo resultado", () => {
    const { rerender } = renderHook((props) => useTomorrowLiveTelemetry(props), {
      initialProps: initial,
    });
    const result = {
      ...initial,
      voiceStatus: "offers" as const,
      connected: true,
      offerIds: ["offer-1"],
      offerTypes: ["bloqueio_aereo"],
      routeCount: 1,
      handoffChannel: "details" as const,
    };

    rerender(result);
    rerender({ ...initial, voiceStatus: "listening" as const, connected: true });
    rerender(result);

    expect(mocks.trackEventStandalone.mock.calls.filter(([event]) => event === "tomorrow_live_offers_rendered")).toHaveLength(2);
    expect(mocks.trackEventStandalone.mock.calls.filter(([event]) => event === "tomorrow_live_handoff_ready")).toHaveLength(2);
  });

  it("registra ações explícitas sem depender da transcrição", () => {
    trackTomorrowLiveAction("voice_start_requested", { online: true });

    expect(mocks.trackEventStandalone).toHaveBeenCalledWith(
      "tomorrow_live_action",
      { action: "voice_start_requested", online: true },
    );
  });
});
