import { describe, expect, it } from "vitest";

import {
  applyTranscriptChange,
  catalogParamsFromRealtimeTool,
  clampAudioLevel,
  DEFAULT_REALTIME_VOICE,
  functionCallFromRealtimeEvent,
  getSelectedRealtimeVoice,
  isRealtimeVoiceName,
  offerHandoffFromRealtimeTool,
  parseRealtimeEvent,
  REALTIME_VOICES,
  REALTIME_VOICE_STORAGE_KEY,
  realtimeToolContinuationEvents,
  setSelectedRealtimeVoice,
  transcriptChangeFromEvent,
} from "./realtimeVoice";

describe("Realtime Voice contract", () => {
  it("expõe somente as vozes permitidas e persiste a seleção temporária", () => {
    expect(REALTIME_VOICES).toContain("marin");
    expect(REALTIME_VOICES).toContain("cedar");
    expect(isRealtimeVoiceName("voz-inventada")).toBe(false);

    window.localStorage.removeItem(REALTIME_VOICE_STORAGE_KEY);
    expect(getSelectedRealtimeVoice()).toBe(DEFAULT_REALTIME_VOICE);
    setSelectedRealtimeVoice("marin");
    expect(getSelectedRealtimeVoice()).toBe("marin");
    window.localStorage.setItem(REALTIME_VOICE_STORAGE_KEY, "voz-inventada");
    expect(getSelectedRealtimeVoice()).toBe(DEFAULT_REALTIME_VOICE);
    window.localStorage.removeItem(REALTIME_VOICE_STORAGE_KEY);
  });

  it("mantém audioLevel entre zero e um", () => {
    expect(clampAudioLevel(-1)).toBe(0);
    expect(clampAudioLevel(0.42)).toBe(0.42);
    expect(clampAudioLevel(4)).toBe(1);
    expect(clampAudioLevel(Number.NaN)).toBe(0);
  });

  it("ignora eventos inválidos sem derrubar a interface", () => {
    expect(parseRealtimeEvent("not-json")).toBeNull();
    expect(parseRealtimeEvent(JSON.stringify({ delta: "oi" }))).toBeNull();
    expect(parseRealtimeEvent(123)).toBeNull();
  });

  it("compõe deltas e finaliza a transcrição do usuário", () => {
    const delta = transcriptChangeFromEvent({
      type: "conversation.item.input_audio_transcription.delta",
      item_id: "user-1",
      delta: "Quero ",
    });
    const secondDelta = transcriptChangeFromEvent({
      type: "conversation.item.input_audio_transcription.delta",
      item_id: "user-1",
      delta: "viajar",
    });
    const completed = transcriptChangeFromEvent({
      type: "conversation.item.input_audio_transcription.completed",
      item_id: "user-1",
      transcript: "Quero viajar.",
    });

    let entries = applyTranscriptChange([], delta!);
    entries = applyTranscriptChange(entries, secondDelta!);
    entries = applyTranscriptChange(entries, completed!);

    expect(entries).toEqual([{ id: "user-1", role: "user", text: "Quero viajar.", final: true }]);
  });

  it("mantém a transcrição falada do Téo separada", () => {
    const change = transcriptChangeFromEvent({
      type: "response.output_audio_transcript.delta",
      response_id: "assistant-1",
      delta: "Vamos começar.",
    });

    expect(applyTranscriptChange([], change!)).toEqual([
      { id: "assistant-1", role: "assistant", text: "Vamos começar.", final: false },
    ]);
  });

  it("reconhece a chamada oficial da ferramenta e limita a consulta a três resultados pelo menor preço", () => {
    const call = functionCallFromRealtimeEvent({
      type: "response.output_item.done",
      item: {
        type: "function_call",
        call_id: "call-1",
        name: "search_travel_offers",
        arguments: JSON.stringify({ origin: "São Paulo", destination: "Maceió", passengers: 2 }),
      },
    });

    expect(call).toEqual({
      callId: "call-1",
      name: "search_travel_offers",
      arguments: JSON.stringify({ origin: "São Paulo", destination: "Maceió", passengers: 2 }),
    });
    expect(catalogParamsFromRealtimeTool(call!)).toEqual({
      origin: "São Paulo",
      destination: "Maceió",
      passengers: 2,
      sort: "price_asc",
      page: 1,
      per_page: 3,
    });
  });

  it("resolve Recife pelo aeroporto real quando a busca é por bloqueio aéreo", () => {
    expect(catalogParamsFromRealtimeTool({
      callId: "recife-destination",
      name: "search_travel_offers",
      arguments: JSON.stringify({ origin: "São Paulo", destination: "Recife", offer_type: "bloqueio_aereo" }),
    })).toEqual({
      origin: "São Paulo",
      offer_type: "bloqueio_aereo",
      destination_iata: "REC",
      sort: "price_asc",
      page: 1,
      per_page: 3,
    });

    expect(catalogParamsFromRealtimeTool({
      callId: "recife-search",
      name: "search_travel_offers",
      arguments: JSON.stringify({ origin: "São Paulo", search: "Recife", offer_type: "bloqueio_aereo" }),
    })).toEqual({
      origin: "São Paulo",
      offer_type: "bloqueio_aereo",
      destination_iata: "REC",
      sort: "price_asc",
      page: 1,
      per_page: 3,
    });
  });

  it("rejeita ferramenta, filtros e datas fora do contrato público", () => {
    expect(() => catalogParamsFromRealtimeTool({ callId: "1", name: "internal_search", arguments: "{}" })).toThrow("Ferramenta não permitida");
    expect(() => catalogParamsFromRealtimeTool({
      callId: "2",
      name: "search_travel_offers",
      arguments: JSON.stringify({ raw_data: true }),
    })).toThrow("filtros não permitidos");
    expect(() => catalogParamsFromRealtimeTool({
      callId: "3",
      name: "search_travel_offers",
      arguments: JSON.stringify({ start_date: "21/08/2026" }),
    })).toThrow("datas da consulta são inválidas");
  });

  it("aceita somente handoff para um UUID e canal permitidos", () => {
    expect(offerHandoffFromRealtimeTool({
      callId: "handoff-1",
      name: "present_offer_actions",
      arguments: JSON.stringify({
        offer_id: "0191a5f2-ccaa-7f03-8f00-1234567890ab",
        requested_channel: "whatsapp",
      }),
    })).toEqual({
      offerId: "0191a5f2-ccaa-7f03-8f00-1234567890ab",
      requestedChannel: "whatsapp",
    });

    expect(() => offerHandoffFromRealtimeTool({
      callId: "handoff-2",
      name: "present_offer_actions",
      arguments: JSON.stringify({ offer_id: "oferta-inventada", requested_channel: "whatsapp" }),
    })).toThrow("identificador da oferta é inválido");
    expect(() => offerHandoffFromRealtimeTool({
      callId: "handoff-3",
      name: "present_offer_actions",
      arguments: JSON.stringify({
        offer_id: "0191a5f2-ccaa-7f03-8f00-1234567890ab",
        requested_channel: "send_automatically",
      }),
    })).toThrow("canal solicitado é inválido");
  });

  it("cria a saída da função antes de pedir a continuação da resposta", () => {
    expect(realtimeToolContinuationEvents("call-1", { ok: true, items: [] })).toEqual([
      {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: "call-1",
          output: JSON.stringify({ ok: true, items: [] }),
        },
      },
      { type: "response.create" },
    ]);
  });
});