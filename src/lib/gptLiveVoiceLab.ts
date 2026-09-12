export const GPT_LIVE_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "beacon",
  "bossa",
  "cedar",
  "cinder",
  "coral",
  "delta",
  "echo",
  "gleam",
  "marin",
  "meridian",
  "quartz",
  "ripple",
  "sage",
  "shimmer",
  "stone",
  "tempo",
  "verse",
  "vesper",
  "willow",
] as const;

export type GptLiveVoice = typeof GPT_LIVE_VOICES[number];

export const GPT_LIVE_ACCENT_PRESETS = [
  { id: "pt_br_neutral", label: "Brasil neutro", description: "Português brasileiro nativo, sem marca regional forte." },
  { id: "pt_br_sao_paulo", label: "Paulistano leve", description: "Traços sutis de São Paulo, sem caricatura." },
  { id: "pt_br_rio", label: "Carioca leve", description: "Traços sutis do Rio de Janeiro, sem caricatura." },
  { id: "pt_br_minas", label: "Mineiro leve", description: "Traços sutis de Minas Gerais, sem caricatura." },
  { id: "pt_br_nordeste", label: "Nordeste leve", description: "Traços sutis do Nordeste brasileiro, sem caricatura." },
  { id: "pt_br_sul", label: "Sulista leve", description: "Traços sutis do Sul do Brasil, sem caricatura." },
] as const;

export type GptLiveAccentPreset = typeof GPT_LIVE_ACCENT_PRESETS[number]["id"];

export const GPT_LIVE_PACE_PRESETS = [
  { id: "calm", label: "Calmo", description: "Pausas discretas e cadência mais tranquila." },
  { id: "natural", label: "Natural", description: "Ritmo de conversa cotidiana, claro e fluido." },
  { id: "agile", label: "Ágil", description: "Fala mais objetiva e dinâmica, sem atropelar palavras." },
] as const;

export type GptLivePacePreset = typeof GPT_LIVE_PACE_PRESETS[number]["id"];

export const GPT_LIVE_STYLE_PRESETS = [
  { id: "concierge", label: "Concierge", description: "Sofisticado, acolhedor e consultivo." },
  { id: "conversational", label: "Conversacional", description: "Mais espontâneo e próximo, mantendo precisão." },
  { id: "executive", label: "Executivo", description: "Direto, seguro e conciso." },
] as const;

export type GptLiveStylePreset = typeof GPT_LIVE_STYLE_PRESETS[number]["id"];

export interface GptLiveLabSettings {
  voice: GptLiveVoice;
  accent: GptLiveAccentPreset;
  pace: GptLivePacePreset;
  style: GptLiveStylePreset;
}

export const DEFAULT_GPT_LIVE_LAB_SETTINGS: GptLiveLabSettings = {
  voice: "marin",
  accent: "pt_br_neutral",
  pace: "natural",
  style: "concierge",
};

export const isGptLiveVoice = (value: unknown): value is GptLiveVoice =>
  typeof value === "string" && (GPT_LIVE_VOICES as readonly string[]).includes(value);

export const isGptLiveAccentPreset = (value: unknown): value is GptLiveAccentPreset =>
  typeof value === "string" && GPT_LIVE_ACCENT_PRESETS.some((preset) => preset.id === value);

export const isGptLivePacePreset = (value: unknown): value is GptLivePacePreset =>
  typeof value === "string" && GPT_LIVE_PACE_PRESETS.some((preset) => preset.id === value);

export const isGptLiveStylePreset = (value: unknown): value is GptLiveStylePreset =>
  typeof value === "string" && GPT_LIVE_STYLE_PRESETS.some((preset) => preset.id === value);
