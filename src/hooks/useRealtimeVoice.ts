import { useCallback, useEffect, useRef, useState } from "react";

import {
  analyserAudioLevel,
  applyTranscriptChange,
  catalogParamsFromRealtimeTool,
  fetchRealtimeClientSecret,
  functionCallFromRealtimeEvent,
  microphoneErrorMessage,
  offerHandoffFromRealtimeTool,
  parseRealtimeEvent,
  realtimeToolContinuationEvents,
  transcriptChangeFromEvent,
  type RealtimeServerEvent,
  type RealtimeVoiceStatus,
  type OfferHandoffChannel,
  type VoiceTranscriptEntry,
} from "@/lib/realtimeVoice";
import {
  fetchTravelOfferCatalog,
  type TravelOfferCatalogItem,
} from "@/lib/travelOffersPublic";
import {
  travelHandoffContextFromCatalogParams,
  type TravelHandoffContext,
} from "@/lib/offerHandoff";

type RealtimeResources = {
  abortController: AbortController;
  peer: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  localStream: MediaStream;
  remoteStream: MediaStream | null;
  audioElement: HTMLAudioElement;
  audioContext: AudioContext;
  inputAnalyser: AnalyserNode;
  outputSource: MediaStreamAudioSourceNode | null;
  outputAnalyser: AnalyserNode | null;
  outputMonitorGain: GainNode | null;
  animationFrame: number;
};

const REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";
const AUDIO_PUBLISH_INTERVAL_MS = 80;
const AUDIO_PUBLISH_MIN_DELTA = 0.025;
const OUTPUT_ACTIVITY_THRESHOLD = 0.012;
const OUTPUT_SILENCE_HOLD_MS = 900;
const TRANSCRIPT_FLUSH_INTERVAL_MS = 120;

export interface OfferHandoffSelection {
  offer: TravelOfferCatalogItem;
  requestedChannel: OfferHandoffChannel;
  searchContext: TravelHandoffContext | null;
}

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
  resources.outputSource?.disconnect();
  resources.outputAnalyser?.disconnect();
  resources.outputMonitorGain?.disconnect();
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
  const [offers, setOffers] = useState<TravelOfferCatalogItem[]>([]);
  const [offerHandoff, setOfferHandoff] = useState<OfferHandoffSelection | null>(null);
  const [toolError, setToolError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resourcesRef = useRef<RealtimeResources | null>(null);
  const mountedRef = useRef(true);
  const userSpeakingRef = useRef(false);
  const statusRef = useRef<RealtimeVoiceStatus>("idle");
  const mutedRef = useRef(false);
  const startAttemptRef = useRef(0);
  const pendingAbortControllerRef = useRef<AbortController | null>(null);
  const transcriptBufferRef = useRef<VoiceTranscriptEntry[]>([]);
  const transcriptFlushTimerRef = useRef<number | null>(null);
  const outputActiveRef = useRef(false);
  const outputCompleteRef = useRef(true);
  const lastOutputActivityAtRef = useRef(0);
  const handledToolCallsRef = useRef(new Set<string>());
  const offersRef = useRef<TravelOfferCatalogItem[]>([]);
  const offersContextRef = useRef<TravelHandoffContext | null>(null);

  const updateStatus = useCallback((next: RealtimeVoiceStatus) => {
    if (statusRef.current === next) return;
    statusRef.current = next;
    if (mountedRef.current) setStatus(next);
  }, []);

  const clearTranscriptFlush = useCallback(() => {
    if (transcriptFlushTimerRef.current === null) return;
    window.clearTimeout(transcriptFlushTimerRef.current);
    transcriptFlushTimerRef.current = null;
  }, []);

  const publishTranscript = useCallback(() => {
    transcriptFlushTimerRef.current = null;
    if (mountedRef.current) setTranscript([...transcriptBufferRef.current]);
  }, []);

  const resetOutputActivity = useCallback(() => {
    outputActiveRef.current = false;
    outputCompleteRef.current = true;
    lastOutputActivityAtRef.current = 0;
  }, []);

  const failConversation = useCallback((message: string) => {
    startAttemptRef.current += 1;
    pendingAbortControllerRef.current?.abort();
    pendingAbortControllerRef.current = null;
    const resources = resourcesRef.current;
    resourcesRef.current = null;
    releaseResources(resources);
    userSpeakingRef.current = false;
    mutedRef.current = false;
    resetOutputActivity();
    handledToolCallsRef.current.clear();
    if (mountedRef.current) {
      setConnected(false);
      setMuted(false);
      setAudioLevel(0);
      setOffers([]);
      offersRef.current = [];
      offersContextRef.current = null;
      setOfferHandoff(null);
      setToolError(null);
      setError(message);
      updateStatus("error");
    }
  }, [resetOutputActivity, updateStatus]);

  const endConversation = useCallback(() => {
    startAttemptRef.current += 1;
    pendingAbortControllerRef.current?.abort();
    pendingAbortControllerRef.current = null;
    const resources = resourcesRef.current;
    resourcesRef.current = null;
    releaseResources(resources);
    userSpeakingRef.current = false;
    resetOutputActivity();
    if (mountedRef.current) {
      setConnected(false);
      setMuted(false);
      mutedRef.current = false;
      setAudioLevel(0);
      setOffers([]);
      offersRef.current = [];
      offersContextRef.current = null;
      setOfferHandoff(null);
      setToolError(null);
      handledToolCallsRef.current.clear();
      updateStatus("idle");
    }
  }, [resetOutputActivity, updateStatus]);

  useEffect(() => () => {
    mountedRef.current = false;
    startAttemptRef.current += 1;
    pendingAbortControllerRef.current?.abort();
    pendingAbortControllerRef.current = null;
    clearTranscriptFlush();
    const resources = resourcesRef.current;
    resourcesRef.current = null;
    releaseResources(resources);
  }, [clearTranscriptFlush]);

  const handleFunctionCall = useCallback(async (event: RealtimeServerEvent) => {
    const call = functionCallFromRealtimeEvent(event);
    if (!call || handledToolCallsRef.current.has(call.callId)) return;
    handledToolCallsRef.current.add(call.callId);

    const resources = resourcesRef.current;
    if (!resources || resources.dataChannel.readyState !== "open") return;

    updateStatus("thinking");
    if (mountedRef.current) setToolError(null);

    let output: unknown;
    try {
      if (call.name === "search_travel_offers") {
        setOffers([]);
        offersRef.current = [];
        offersContextRef.current = null;
        setOfferHandoff(null);
        const params = catalogParamsFromRealtimeTool(call);
        const result = await fetchTravelOfferCatalog(params, resources.abortController.signal);
        if (resourcesRef.current !== resources || !mountedRef.current) return;
        offersRef.current = result.items;
        offersContextRef.current = travelHandoffContextFromCatalogParams(params);
        setOffers(result.items);
        if (result.items.length > 0) updateStatus("offers");
        output = {
          ok: true,
          total: result.total,
          items: result.items,
          notice: result.notice,
        };
      } else {
        const request = offerHandoffFromRealtimeTool(call);
        const offer = offersRef.current.find((item) => item.id === request.offerId);
        if (!offer) {
          throw new Error("A oportunidade escolhida não pertence aos resultados atuais. Peça ao cliente para escolher uma das opções exibidas.");
        }
        setOfferHandoff({
          offer,
          requestedChannel: request.requestedChannel,
          searchContext: offersContextRef.current,
        });
        updateStatus("offers");
        output = {
          ok: true,
          action_ready: true,
          offer_id: offer.id,
          requested_channel: request.requestedChannel,
          instruction: "As ações verificadas foram apresentadas na interface. Oriente o cliente a tocar na opção desejada.",
        };
      }
    } catch (toolFailure) {
      if (resourcesRef.current !== resources || !mountedRef.current) return;
      const message = toolFailure instanceof Error
        ? toolFailure.message
        : "Não foi possível consultar as oportunidades agora.";
      setToolError(message);
      output = {
        ok: false,
        error: call.name === "search_travel_offers"
          ? "Não foi possível consultar as oportunidades reais agora. Informe isso ao cliente sem sugerir dados alternativos."
          : "Não foi possível preparar a ação para essa oferta. Peça ao cliente para escolher uma das oportunidades exibidas, sem inventar alternativas.",
      };
    }

    if (resourcesRef.current !== resources || resources.dataChannel.readyState !== "open") return;
    for (const continuationEvent of realtimeToolContinuationEvents(call.callId, output)) {
      resources.dataChannel.send(JSON.stringify(continuationEvent));
    }
  }, [updateStatus]);

  const handleEvent = useCallback((event: RealtimeServerEvent) => {
    if (functionCallFromRealtimeEvent(event)) void handleFunctionCall(event);

    const transcriptChange = transcriptChangeFromEvent(event);
    if (transcriptChange) {
      transcriptBufferRef.current = applyTranscriptChange(transcriptBufferRef.current, transcriptChange);
      if (transcriptChange.final) {
        clearTranscriptFlush();
        publishTranscript();
      } else if (transcriptFlushTimerRef.current === null) {
        transcriptFlushTimerRef.current = window.setTimeout(publishTranscript, TRANSCRIPT_FLUSH_INTERVAL_MS);
      }
    }

    switch (event.type) {
      case "session.created":
      case "session.updated":
        if (!userSpeakingRef.current && statusRef.current === "connecting") updateStatus("idle");
        break;
      case "input_audio_buffer.speech_started":
        userSpeakingRef.current = true;
        resetOutputActivity();
        updateStatus("listening");
        break;
      case "input_audio_buffer.speech_stopped":
        userSpeakingRef.current = false;
        updateStatus("thinking");
        break;
      case "response.created":
        outputActiveRef.current = false;
        outputCompleteRef.current = false;
        if (!userSpeakingRef.current && statusRef.current !== "offers") updateStatus("thinking");
        break;
      case "response.output_audio.delta":
      case "response.output_audio_transcript.delta":
        outputActiveRef.current = true;
        outputCompleteRef.current = false;
        lastOutputActivityAtRef.current = performance.now();
        if (!userSpeakingRef.current) updateStatus("speaking");
        break;
      case "response.done":
      case "response.output_audio.done":
        outputCompleteRef.current = true;
        if (userSpeakingRef.current) updateStatus("listening");
        break;
      case "error":
        if (mountedRef.current) setError(event.error?.message || "A sessão de voz encontrou um erro.");
        updateStatus("error");
        break;
      default:
        break;
    }
  }, [clearTranscriptFlush, handleFunctionCall, publishTranscript, resetOutputActivity, updateStatus]);

  const startConversation = useCallback(async () => {
    if (resourcesRef.current || statusRef.current === "connecting") return;
    const attempt = ++startAttemptRef.current;
    setError(null);
    clearTranscriptFlush();
    transcriptBufferRef.current = [];
    setTranscript([]);
    setAudioLevel(0);
    setOffers([]);
    offersRef.current = [];
    offersContextRef.current = null;
    setOfferHandoff(null);
    setToolError(null);
    handledToolCallsRef.current.clear();
    resetOutputActivity();
    updateStatus("connecting");

    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      setError("Este navegador não oferece os recursos necessários para voz em tempo real.");
      updateStatus("error");
      return;
    }

    let resources: RealtimeResources | null = null;
    try {
      const abortController = new AbortController();
      pendingAbortControllerRef.current = abortController;
      const [localStream, secret] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        }),
        fetchRealtimeClientSecret(abortController.signal),
      ]);
      if (attempt !== startAttemptRef.current || !mountedRef.current) {
        abortController.abort();
        localStream.getTracks().forEach((track) => track.stop());
        return;
      }
      pendingAbortControllerRef.current = null;
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
        outputSource: null,
        outputAnalyser: null,
        outputMonitorGain: null,
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
        resources.outputSource?.disconnect();
        resources.outputAnalyser?.disconnect();
        resources.outputMonitorGain?.disconnect();
        const outputSource = resources.audioContext.createMediaStreamSource(remoteStream);
        const outputAnalyser = resources.audioContext.createAnalyser();
        const outputMonitorGain = resources.audioContext.createGain();
        setAnalyserDefaults(outputAnalyser);
        outputMonitorGain.gain.value = 0;
        outputSource.connect(outputAnalyser);
        outputAnalyser.connect(outputMonitorGain);
        outputMonitorGain.connect(resources.audioContext.destination);
        resources.outputSource = outputSource;
        resources.outputAnalyser = outputAnalyser;
        resources.outputMonitorGain = outputMonitorGain;
        void resources.audioElement.play().catch(() => undefined);
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed") {
          failConversation("A conexão de voz foi encerrada inesperadamente.");
        }
      };

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
      let lastPublishedAt = 0;
      let lastPublishedLevel = 0;
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

          if (!userSpeakingRef.current && outputLevel >= OUTPUT_ACTIVITY_THRESHOLD) {
            outputActiveRef.current = true;
            lastOutputActivityAtRef.current = timestamp;
            updateStatus("speaking");
          } else if (
            !userSpeakingRef.current &&
            outputActiveRef.current &&
            outputCompleteRef.current &&
            timestamp - lastOutputActivityAtRef.current >= OUTPUT_SILENCE_HOLD_MS
          ) {
            outputActiveRef.current = false;
            updateStatus("idle");
          }

          const level = !userSpeakingRef.current && outputActiveRef.current ? outputLevel : inputLevel;
          const shouldPublish = timestamp - lastPublishedAt >= AUDIO_PUBLISH_INTERVAL_MS &&
            (lastPublishedAt === 0 ||
              Math.abs(level - lastPublishedLevel) >= AUDIO_PUBLISH_MIN_DELTA ||
              (level === 0 && lastPublishedLevel !== 0));
          if (mountedRef.current && shouldPublish) {
            lastPublishedAt = timestamp;
            lastPublishedLevel = level;
            setAudioLevel(level);
          }
        }
        resources.animationFrame = requestAnimationFrame(sampleAudio);
      };
      resources.animationFrame = requestAnimationFrame(sampleAudio);
    } catch (startError) {
      if (attempt !== startAttemptRef.current || !mountedRef.current) return;
      pendingAbortControllerRef.current?.abort();
      pendingAbortControllerRef.current = null;
      if (resourcesRef.current === resources) resourcesRef.current = null;
      releaseResources(resources);
      if (mountedRef.current) {
        setConnected(false);
        setAudioLevel(0);
        setError(microphoneErrorMessage(startError));
        updateStatus("error");
      }
    }
  }, [clearTranscriptFlush, failConversation, handleEvent, resetOutputActivity, speakerEnabled, updateStatus]);

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
    offers,
    offerHandoff,
    toolError,
    error,
    startConversation,
    endConversation,
    toggleMute,
    toggleSpeaker,
  };
}
