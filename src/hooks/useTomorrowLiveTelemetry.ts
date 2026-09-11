import { useEffect, useMemo, useRef } from "react";

import { trackEventStandalone } from "@/hooks/useAnalytics";
import type { OfferHandoffChannel, RealtimeVoiceStatus } from "@/lib/realtimeVoice";

export type TomorrowLiveTelemetryInput = {
  voiceStatus: RealtimeVoiceStatus;
  connected: boolean;
  online: boolean;
  offerIds: string[];
  offerTypes: string[];
  routeCount: number;
  handoffChannel: OfferHandoffChannel | null;
  composerActive: boolean;
};

type SafeTelemetryValue = string | number | boolean | null | string[];

type TomorrowLiveAction =
  | "voice_start_requested"
  | "voice_end_requested"
  | "microphone_toggled"
  | "speaker_toggled"
  | "text_handoff_clicked"
  | "privacy_opened";

function emit(eventType: string, eventData: Record<string, SafeTelemetryValue>) {
  void trackEventStandalone(`tomorrow_live_${eventType}`, eventData);
}

export function trackTomorrowLiveAction(
  action: TomorrowLiveAction,
  eventData: Record<string, SafeTelemetryValue> = {},
) {
  emit("action", { action, ...eventData });
}

export function useTomorrowLiveTelemetry(input: TomorrowLiveTelemetryInput) {
  const previousVoiceStatus = useRef(input.voiceStatus);
  const previousOnline = useRef(input.online);
  const previousOfferSignature = useRef("");
  const previousHandoffChannel = useRef<OfferHandoffChannel | null>(null);
  const previousComposerActive = useRef(false);
  const offerSignature = useMemo(
    () => input.offerIds.slice().sort().join(":"),
    [input.offerIds],
  );
  const normalizedOfferTypes = useMemo(
    () => [...new Set(input.offerTypes.filter(Boolean))].sort(),
    [input.offerTypes],
  );

  useEffect(() => {
    if (previousVoiceStatus.current === input.voiceStatus) return;
    const previous = previousVoiceStatus.current;
    previousVoiceStatus.current = input.voiceStatus;
    emit("voice_status_changed", {
      previous_status: previous,
      status: input.voiceStatus,
      connected: input.connected,
    });
  }, [input.connected, input.voiceStatus]);

  useEffect(() => {
    if (previousOnline.current === input.online) return;
    previousOnline.current = input.online;
    emit("connectivity_changed", { online: input.online });
  }, [input.online]);

  useEffect(() => {
    if (!offerSignature || offerSignature === previousOfferSignature.current) return;
    previousOfferSignature.current = offerSignature;
    emit("offers_rendered", {
      count: input.offerIds.length,
      offer_types: normalizedOfferTypes,
      route_count: input.routeCount,
    });
  }, [input.offerIds.length, input.routeCount, normalizedOfferTypes, offerSignature]);

  useEffect(() => {
    if (!input.handoffChannel || input.handoffChannel === previousHandoffChannel.current) return;
    previousHandoffChannel.current = input.handoffChannel;
    emit("handoff_ready", { channel: input.handoffChannel });
  }, [input.handoffChannel]);

  useEffect(() => {
    if (input.composerActive && !previousComposerActive.current) {
      emit("trip_composer_opened", { offer_count: input.offerIds.length });
    }
    previousComposerActive.current = input.composerActive;
  }, [input.composerActive, input.offerIds.length]);
}
