import { describe, expect, it } from "vitest";

import {
  applyTranscriptChange,
  clampAudioLevel,
  parseRealtimeEvent,
  transcriptChangeFromEvent,
} from "./realtimeVoice";

describe("Realtime Voice contract", () => {
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
});
