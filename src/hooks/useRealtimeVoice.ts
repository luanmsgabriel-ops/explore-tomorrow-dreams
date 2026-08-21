import { useCallback, useEffect, useRef, useState } from "react";

import {
  analyserAudioLevel,
  applyTranscriptChange,
  fetchRealtimeClientSecret,
  microphoneErrorMessage,
  parseRealtimeEvent,
  transcriptChangeFromEvent,
  type RealtimeServerEvent,
  type RealtimeVoiceStatus,
  type VoiceTranscriptEntry,
} from "@/lib/realtimeVoice";

type RealtimeResources = {
  abortController: AbortController;
  peer: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  localStream: MediaStream;
  remoteStream: MediaStream | null;
  audioElement: HTMLAudioElement;
  audioContext: AudioContext;
  inputAnalyser: AnalyserNode;
  outputAnalyser: AnalyserNode | null;
  animationFrame: number;
};

const REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

function releaseResources(resources: RealtimeResources | null) {
  if (!resources) return;
  resources.abortController.abort();
  cancelAnimationFrame(resources.animationFrame);
  resources.dataChannel.onopen = null;
  resources.dataChannel.onmessage = null;
  resources.dataChannel.onerror = null;
  resources.dataChannel.onclose = null;
  if (resources.dataChannel.readyState !== "closed") resources.dataChannel.close();
  resources.peer.ontrack = null;
  resources.peer.onconnectionstatechange = null;
  resources.peer.close();
  resources.localStream.getTracks().forEach((track) => track.stop());
  resources.remoteStream?.getTracks().forEach((track) => track.stop());
  resources.audioElement.pause();
  resources.audioElement.srcObject = null;
  resources.audioElement.remove();
  void resources.audioContext.close().catch(() => undefined);
}

function createAudioContext() {
  const AudioContextClass = window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio indisponível");
  return new AudioContextClass();
}

function setAnalyserDefaults(analyser: AnalyserNode) {
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.82;
}

export function useRealtimeVoice() {
  const [status, setStatus] = useState<RealtimeVoiceStatus>("idle");
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const resourcesRef = useRef<RealtimeResources | null>(null);
  const mountedRef = useRef(true);
  const userSpeakingRef = useRef(false);
  const statusRef = useRef<RealtimeVoiceStatus>("idle");
  const mutedRef = useRef(false);
  const startAttemptRef = useRef(0);

  const updateStatus = useCallback((next: RealtimeVoiceStatus) => {
    statusRef.current = next;
    if (mountedRef.current) setStatus(next);
  }, []);

  const failConversation = useCallback((message: string) => {
    startAttemptRef.current += 1;
    const resources = resourcesRef.current;
    resourcesRef.current = null;
    releaseResources(resources);
    userSpeakingRef.current = false;
    mutedRef.current = false;
    if (mountedRef.current) {
      setConnected(false);
      setMuted(false);
      setAudioLevel(0);
      setError(message);
      updateStatus("error");
    }
  }, [updateStatus]);

  const endConversation = useCallback(() => {
    startAttemptRef.current += 1;
    const resources = resourcesRef.current;
    resourcesRef.current = null;
    releaseResources(resources);
    userSpeakingRef.current = false;
    if (mountedRef.current) {
      setConnected(false);
      setMuted(false);
      mutedRef.current = false;
      setAudioLevel(0);
      updateStatus("idle");
    }
  }, [updateStatus]);

  useEffect(() => () => {
    mountedRef.current = false;
    startAttemptRef.current += 1;
    const resources = resourcesRef.current;
    resourcesRef.current = null;
    releaseResources(resources);
  }, []);

  const handleEvent = useCallback((event: RealtimeServerEvent) => {
    const transcriptChange = transcriptChangeFromEvent(event);
    if (transcriptChange && mountedRef.current) {
      setTranscript((current) => applyTranscriptChange(current, transcriptChange));
    }

    switch (event.type) {
      case "session.created":
      case "session.updated":
        if (!userSpeakingRef.current && statusRef.current === "connecting") updateStatus("idle");
        break;
      case "input_audio_buffer.speech_started":
        userSpeakingRef.current = true;
        updateStatus("listening");
        break;
      case "input_audio_buffer.speech_stopped":
        userSpeakingRef.current = false;
        updateStatus("thinking");
        break;
      case "response.created":
        if (!userSpeakingRef.current) updateStatus("thinking");
        break;
      case "response.output_audio.delta":
      case "response.output_audio_transcript.delta":
        if (!userSpeakingRef.current) updateStatus("speaking");
        break;
      case "response.done":
      case "response.output_audio.done":
        updateStatus(userSpeakingRef.current ? "listening" : "idle");
        break;
      case "error":
        if (mountedRef.current) setError(event.error?.message || "A sessão de voz encontrou um erro.");
        updateStatus("error");
        break;
      default:
        break;
    }
  }, [updateStatus]);

  const startConversation = useCallback(async () => {
    if (resourcesRef.current || statusRef.current === "connecting") return;
    const attempt = ++startAttemptRef.current;
    setError(null);
    setTranscript([]);
    setAudioLevel(0);
    updateStatus("connecting");

    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      setError("Este navegador não oferece os recursos necessários para voz em tempo real.");
      updateStatus("error");
      return;
    }

    let resources: RealtimeResources | null = null;
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (attempt !== startAttemptRef.current || !mountedRef.current) {
        localStream.getTracks().forEach((track) => track.stop());
        return;
      }
      const abortController = new AbortController();
      const audioContext = createAudioContext();
      await audioContext.resume();
      const inputAnalyser = audioContext.createAnalyser();
      setAnalyserDefaults(inputAnalyser);
      audioContext.createMediaStreamSource(localStream).connect(inputAnalyser);

      const peer = new RTCPeerConnection();
      localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
      const dataChannel = peer.createDataChannel("oai-events");
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.setAttribute("playsinline", "true");
      audioElement.hidden = true;
      document.body.appendChild(audioElement);

      resources = {
        abortController,
        peer,
        dataChannel,
        localStream,
        remoteStream: null,
        audioElement,
        audioContext,
        inputAnalyser,
        outputAnalyser: null,
        animationFrame: 0,
      };
      resourcesRef.current = resources;

      dataChannel.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        updateStatus("idle");
      };
      dataChannel.onmessage = (message) => {
        const event = parseRealtimeEvent(message.data);
        if (event) handleEvent(event);
      };
      dataChannel.onerror = () => {
        failConversation("A conexão de eventos da voz foi interrompida.");
      };
      dataChannel.onclose = () => {
        if (resourcesRef.current === resources) {
          failConversation("A sessão de voz foi encerrada inesperadamente.");
        }
      };

      peer.ontrack = (event) => {
        if (!resources || !mountedRef.current) return;
        const remoteStream = event.streams[0] ?? new MediaStream([event.track]);
        resources.remoteStream = remoteStream;
        resources.audioElement.srcObject = remoteStream;
        resources.audioElement.muted = !speakerEnabled;
        const outputAnalyser = resources.audioContext.createAnalyser();
        setAnalyserDefaults(outputAnalyser);
        resources.audioContext.createMediaStreamSource(remoteStream).connect(outputAnalyser);
        resources.outputAnalyser = outputAnalyser;
        void resources.audioElement.play().catch(() => undefined);
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed") {
          failConversation("A conexão de voz foi encerrada inesperadamente.");
        }
      };

      const secret = await fetchRealtimeClientSecret(abortController.signal);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const sdpResponse = await fetch(REALTIME_CALLS_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${secret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
        signal: abortController.signal,
      });
      if (!sdpResponse.ok) throw new Error("SDP negotiation failed");
      await peer.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() });

      const inputSamples = new Uint8Array(new ArrayBuffer(inputAnalyser.fftSize));
      let outputSamples: Uint8Array<ArrayBuffer> | null = null;
      let lastSample = 0;
      const sampleAudio = (timestamp: number) => {
        if (!resources || resourcesRef.current !== resources) return;
        if (timestamp - lastSample >= 33) {
          lastSample = timestamp;
          const inputLevel = mutedRef.current ? 0 : analyserAudioLevel(resources.inputAnalyser, inputSamples);
          let outputLevel = 0;
          if (resources.outputAnalyser) {
            if (!outputSamples || outputSamples.length !== resources.outputAnalyser.fftSize) {
              outputSamples = new Uint8Array(new ArrayBuffer(resources.outputAnalyser.fftSize));
            }
            outputLevel = analyserAudioLevel(resources.outputAnalyser, outputSamples);
          }
          const level = statusRef.current === "speaking" ? outputLevel : inputLevel;
          if (mountedRef.current) setAudioLevel(level);
        }
        resources.animationFrame = requestAnimationFrame(sampleAudio);
      };
      resources.animationFrame = requestAnimationFrame(sampleAudio);
    } catch (startError) {
      if (attempt !== startAttemptRef.current || !mountedRef.current) return;
      if (resourcesRef.current === resources) resourcesRef.current = null;
      releaseResources(resources);
      if (mountedRef.current) {
        setConnected(false);
        setAudioLevel(0);
        setError(microphoneErrorMessage(startError));
        updateStatus("error");
      }
    }
  }, [failConversation, handleEvent, speakerEnabled, updateStatus]);

  const toggleMute = useCallback(() => {
    const resources = resourcesRef.current;
    if (!resources) return;
    const next = !muted;
    resources.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    mutedRef.current = next;
    setMuted(next);
    if (next) setAudioLevel(0);
  }, [muted]);

  const toggleSpeaker = useCallback(() => {
    const next = !speakerEnabled;
    if (resourcesRef.current) resourcesRef.current.audioElement.muted = !next;
    setSpeakerEnabled(next);
  }, [speakerEnabled]);

  return {
    status,
    connected,
    muted,
    speakerEnabled,
    audioLevel,
    transcript,
    error,
    startConversation,
    endConversation,
    toggleMute,
    toggleSpeaker,
  };
}
