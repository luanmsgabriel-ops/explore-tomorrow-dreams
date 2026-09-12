import { useCallback, useEffect, useRef, useState } from "react";

import type { GptLiveLabSettings } from "@/lib/gptLiveVoiceLab";

type LabStatus = "idle" | "connecting" | "connected" | "error";

type LabResources = {
  peer: RTCPeerConnection;
  stream: MediaStream;
  audio: HTMLAudioElement;
  dataChannel: RTCDataChannel;
};

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tomorrow-live-gpt-live-call`;
const EDGE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function release(resources: LabResources | null) {
  if (!resources) return;
  resources.dataChannel.close();
  resources.peer.close();
  resources.stream.getTracks().forEach((track) => track.stop());
  resources.audio.pause();
  resources.audio.srcObject = null;
  resources.audio.remove();
}

export function useGptLiveVoiceLab(settings: GptLiveLabSettings) {
  const [status, setStatus] = useState<LabStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resourcesRef = useRef<LabResources | null>(null);
  const mountedRef = useRef(true);

  const stop = useCallback(() => {
    release(resourcesRef.current);
    resourcesRef.current = null;
    if (mountedRef.current) {
      setStatus("idle");
      setMuted(false);
      setError(null);
    }
  }, []);

  useEffect(() => () => {
    mountedRef.current = false;
    release(resourcesRef.current);
    resourcesRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (resourcesRef.current || status === "connecting") return;
    setError(null);
    setStatus("connecting");

    let resources: LabResources | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error("Este navegador não oferece voz em tempo real.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const peer = new RTCPeerConnection();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const dataChannel = peer.createDataChannel("oai-events");
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.hidden = true;
      audio.setAttribute("playsinline", "true");
      document.body.appendChild(audio);
      resources = { peer, stream, audio, dataChannel };
      resourcesRef.current = resources;

      peer.ontrack = (event) => {
        const remote = event.streams[0] ?? new MediaStream([event.track]);
        audio.srcObject = remote;
        audio.muted = !speakerEnabled;
        void audio.play().catch(() => undefined);
      };
      peer.onconnectionstatechange = () => {
        if (!mountedRef.current) return;
        if (peer.connectionState === "connected") setStatus("connected");
        if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
          setError("A conexão do laboratório de voz foi interrompida.");
          setStatus("error");
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const response = await fetch(EDGE_URL, {
        method: "POST",
        headers: { "apikey": EDGE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: offer.sdp, ...settings }),
      });
      const payload = await response.json() as { sdp?: string; error?: { message?: string } };
      if (!response.ok || !payload.sdp) throw new Error(payload.error?.message ?? "Não foi possível iniciar o teste GPT-Live-1.");
      await peer.setRemoteDescription({ type: "answer", sdp: payload.sdp });
    } catch (failure) {
      release(resources);
      resourcesRef.current = null;
      if (mountedRef.current) {
        setError(failure instanceof Error ? failure.message : "Não foi possível iniciar o teste GPT-Live-1.");
        setStatus("error");
      }
    }
  }, [settings, speakerEnabled, status]);

  const toggleMute = useCallback(() => {
    const resources = resourcesRef.current;
    if (!resources) return;
    const next = !muted;
    resources.stream.getAudioTracks().forEach((track) => { track.enabled = !next; });
    setMuted(next);
  }, [muted]);

  const toggleSpeaker = useCallback(() => {
    const next = !speakerEnabled;
    if (resourcesRef.current) resourcesRef.current.audio.muted = !next;
    setSpeakerEnabled(next);
  }, [speakerEnabled]);

  return { status, connected: status === "connected", muted, speakerEnabled, error, start, stop, toggleMute, toggleSpeaker };
}
