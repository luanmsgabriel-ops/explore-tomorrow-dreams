import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchSecretMock } = vi.hoisted(() => ({
  fetchSecretMock: vi.fn(),
}));

vi.mock("@/lib/realtimeVoice", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/realtimeVoice")>();
  return { ...actual, fetchRealtimeClientSecret: fetchSecretMock };
});

import { useRealtimeVoice } from "./useRealtimeVoice";

describe("useRealtimeVoice", () => {
  const track = { enabled: true, stop: vi.fn() };
  const stream = {
    getTracks: vi.fn(() => [track]),
    getAudioTracks: vi.fn(() => [track]),
  } as unknown as MediaStream;
  const getUserMedia = vi.fn();
  const dataChannel = {
    readyState: "open",
    close: vi.fn(),
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
  } as unknown as RTCDataChannel;
  const peer = {
    connectionState: "new",
    addTrack: vi.fn(),
    createDataChannel: vi.fn(() => dataChannel),
    createOffer: vi.fn(async () => ({ type: "offer", sdp: "offer-sdp" })),
    setLocalDescription: vi.fn(async () => undefined),
    setRemoteDescription: vi.fn(async () => undefined),
    close: vi.fn(),
    ontrack: null,
    onconnectionstatechange: null,
  } as unknown as RTCPeerConnection;
  const analyser = {
    fftSize: 32,
    smoothingTimeConstant: 0,
    getByteTimeDomainData: vi.fn((samples: Uint8Array) => samples.fill(128)),
  } as unknown as AnalyserNode;
  const audioContext = {
    resume: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    createAnalyser: vi.fn(() => analyser),
    createMediaStreamSource: vi.fn(() => ({ connect: vi.fn() })),
  } as unknown as AudioContext;

  beforeEach(() => {
    track.enabled = true;
    track.stop.mockReset();
    getUserMedia.mockReset().mockResolvedValue(stream);
    fetchSecretMock.mockReset().mockResolvedValue("ek_test");
    (dataChannel.close as ReturnType<typeof vi.fn>).mockReset();
    (peer.close as ReturnType<typeof vi.fn>).mockReset();
    (peer.addTrack as ReturnType<typeof vi.fn>).mockReset();
    (peer.createDataChannel as ReturnType<typeof vi.fn>).mockClear();
    (peer.createOffer as ReturnType<typeof vi.fn>).mockClear();
    (peer.setLocalDescription as ReturnType<typeof vi.fn>).mockClear();
    (peer.setRemoteDescription as ReturnType<typeof vi.fn>).mockClear();
    (audioContext.close as ReturnType<typeof vi.fn>).mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    Object.defineProperty(window, "RTCPeerConnection", { configurable: true, value: vi.fn(() => peer) });
    Object.defineProperty(window, "AudioContext", { configurable: true, value: vi.fn(() => audioContext) });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("answer-sdp", { status: 200 })));
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("não solicita microfone ao montar", () => {
    renderHook(() => useRealtimeVoice());
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("abre por ação explícita e libera todos os recursos ao encerrar", async () => {
    const { result } = renderHook(() => useRealtimeVoice());

    await act(async () => result.current.startConversation());
    act(() => dataChannel.onopen?.(new Event("open")));

    await waitFor(() => expect(result.current.connected).toBe(true));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(fetchSecretMock).toHaveBeenCalledTimes(1);
    expect(peer.setRemoteDescription).toHaveBeenCalledWith({ type: "answer", sdp: "answer-sdp" });

    act(() => result.current.endConversation());

    expect(track.stop).toHaveBeenCalled();
    expect(dataChannel.close).toHaveBeenCalled();
    expect(peer.close).toHaveBeenCalled();
    expect(audioContext.close).toHaveBeenCalled();
    expect(result.current.connected).toBe(false);
    expect(result.current.audioLevel).toBe(0);
  });

  it("libera recursos quando a conexão falha", async () => {
    const { result } = renderHook(() => useRealtimeVoice());

    await act(async () => result.current.startConversation());
    act(() => dataChannel.onopen?.(new Event("open")));
    await waitFor(() => expect(result.current.connected).toBe(true));

    act(() => dataChannel.onerror?.(new Event("error") as RTCErrorEvent));

    expect(track.stop).toHaveBeenCalled();
    expect(dataChannel.close).toHaveBeenCalled();
    expect(peer.close).toHaveBeenCalled();
    expect(audioContext.close).toHaveBeenCalled();
    expect(result.current.connected).toBe(false);
    expect(result.current.status).toBe("error");
    expect(result.current.audioLevel).toBe(0);
  });

  it("invalida uma inicialização encerrada enquanto a permissão está pendente", async () => {
    let resolvePermission!: (value: MediaStream) => void;
    getUserMedia.mockReturnValue(new Promise<MediaStream>((resolve) => {
      resolvePermission = resolve;
    }));
    const { result } = renderHook(() => useRealtimeVoice());
    let startPromise!: Promise<void>;

    act(() => {
      startPromise = result.current.startConversation();
    });
    await waitFor(() => expect(result.current.status).toBe("connecting"));
    act(() => result.current.endConversation());
    resolvePermission(stream);
    await act(async () => startPromise);

    expect(track.stop).toHaveBeenCalled();
    expect(fetchSecretMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
    expect(result.current.connected).toBe(false);
  });
});
