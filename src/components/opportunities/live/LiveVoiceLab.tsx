import { useState } from "react";
import { FlaskConical, Mic, MicOff, Power, Volume2, VolumeX } from "lucide-react";

import { OpportunityBadge, OpportunityButton } from "@/components/opportunities";
import { useGptLiveVoiceLab } from "@/hooks/useGptLiveVoiceLab";
import {
  DEFAULT_GPT_LIVE_LAB_SETTINGS,
  GPT_LIVE_ACCENT_PRESETS,
  GPT_LIVE_PACE_PRESETS,
  GPT_LIVE_STYLE_PRESETS,
  GPT_LIVE_VOICES,
  type GptLiveAccentPreset,
  type GptLiveLabSettings,
  type GptLivePacePreset,
  type GptLiveStylePreset,
  type GptLiveVoice,
} from "@/lib/gptLiveVoiceLab";

const selectClassName = "opportunity-focus w-full rounded-xl border border-tomorrow-line bg-tomorrow-background/75 px-3 py-2.5 text-sm text-tomorrow-text outline-none transition-colors hover:border-tomorrow-teal/45 disabled:cursor-not-allowed disabled:opacity-50";

export function LiveVoiceLab() {
  const [settings, setSettings] = useState<GptLiveLabSettings>(DEFAULT_GPT_LIVE_LAB_SETTINGS);
  const lab = useGptLiveVoiceLab(settings);
  const locked = lab.status === "connecting" || lab.connected;

  return (
    <section className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="gpt-live-lab-title">
      <div className="overflow-hidden rounded-tomorrow-lg border border-tomorrow-gold/35 bg-[linear-gradient(145deg,rgba(7,35,39,.96),rgba(4,19,21,.98))] shadow-[0_30px_90px_rgba(0,0,0,.28)]">
        <div className="border-b border-tomorrow-line px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-center gap-3">
            <OpportunityBadge variant="neutral"><FlaskConical className="size-3.5" aria-hidden="true" />Voice Lab</OpportunityBadge>
            <OpportunityBadge variant="warning">Experimental</OpportunityBadge>
          </div>
          <h2 id="gpt-live-lab-title" className="mt-3 font-editorial text-3xl text-tomorrow-text sm:text-4xl">GPT-Live-1 · laboratório de voz</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-tomorrow-muted">Teste voz, orientação de sotaque, ritmo e estilo sem alterar a configuração definitiva do Téo. Voz e instruções são fixadas quando a sessão começa; encerre o teste para trocar os parâmetros.</p>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_.78fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tomorrow-muted">
              Voz
              <select value={settings.voice} disabled={locked} onChange={(event) => setSettings((current) => ({ ...current, voice: event.target.value as GptLiveVoice }))} className={selectClassName}>
                {GPT_LIVE_VOICES.map((voice) => <option key={voice} value={voice}>{voice}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tomorrow-muted">
              Sotaque · orientação por prompt
              <select value={settings.accent} disabled={locked} onChange={(event) => setSettings((current) => ({ ...current, accent: event.target.value as GptLiveAccentPreset }))} className={selectClassName}>
                {GPT_LIVE_ACCENT_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
              </select>
              <span className="font-normal normal-case tracking-normal text-tomorrow-muted/80">{GPT_LIVE_ACCENT_PRESETS.find((preset) => preset.id === settings.accent)?.description}</span>
            </label>

            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tomorrow-muted">
              Ritmo
              <select value={settings.pace} disabled={locked} onChange={(event) => setSettings((current) => ({ ...current, pace: event.target.value as GptLivePacePreset }))} className={selectClassName}>
                {GPT_LIVE_PACE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
              </select>
              <span className="font-normal normal-case tracking-normal text-tomorrow-muted/80">{GPT_LIVE_PACE_PRESETS.find((preset) => preset.id === settings.pace)?.description}</span>
            </label>

            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tomorrow-muted">
              Estilo
              <select value={settings.style} disabled={locked} onChange={(event) => setSettings((current) => ({ ...current, style: event.target.value as GptLiveStylePreset }))} className={selectClassName}>
                {GPT_LIVE_STYLE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
              </select>
              <span className="font-normal normal-case tracking-normal text-tomorrow-muted/80">{GPT_LIVE_STYLE_PRESETS.find((preset) => preset.id === settings.style)?.description}</span>
            </label>
          </div>

          <div className="rounded-2xl border border-tomorrow-teal/25 bg-tomorrow-background/55 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-tomorrow-teal-soft">Configuração do teste</p>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Modelo</dt><dd className="font-semibold text-tomorrow-text">gpt-live-1</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Voz</dt><dd className="font-semibold text-tomorrow-text">{settings.voice}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Sotaque</dt><dd className="font-semibold text-tomorrow-text">{GPT_LIVE_ACCENT_PRESETS.find((item) => item.id === settings.accent)?.label}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Ritmo</dt><dd className="font-semibold text-tomorrow-text">{GPT_LIVE_PACE_PRESETS.find((item) => item.id === settings.pace)?.label}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Estilo</dt><dd className="font-semibold text-tomorrow-text">{GPT_LIVE_STYLE_PRESETS.find((item) => item.id === settings.style)?.label}</dd></div>
            </dl>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <OpportunityButton variant={locked ? "outline" : "gold"} disabled={locked} onClick={lab.start} fullWidth>
                <Mic aria-hidden="true" />{lab.status === "connecting" ? "Conectando..." : lab.connected ? "Teste ativo" : "Iniciar teste"}
              </OpportunityButton>
              <OpportunityButton variant="outline" disabled={!locked} onClick={lab.stop} fullWidth><Power aria-hidden="true" />Encerrar teste</OpportunityButton>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" disabled={!lab.connected} onClick={lab.toggleMute} className="opportunity-focus flex items-center justify-center gap-2 rounded-xl border border-tomorrow-line px-3 py-2 text-xs font-semibold text-tomorrow-text disabled:opacity-45">{lab.muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}{lab.muted ? "Reativar mic" : "Pausar mic"}</button>
              <button type="button" disabled={!lab.connected} onClick={lab.toggleSpeaker} className="opportunity-focus flex items-center justify-center gap-2 rounded-xl border border-tomorrow-line px-3 py-2 text-xs font-semibold text-tomorrow-text disabled:opacity-45">{lab.speakerEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}{lab.speakerEnabled ? "Silenciar Téo" : "Ouvir Téo"}</button>
            </div>

            {lab.connected ? <p className="mt-4 text-center text-xs font-semibold text-tomorrow-teal-soft">Sessão GPT-Live-1 conectada.</p> : null}
            {lab.error ? <p className="mt-4 rounded-xl border border-tomorrow-danger/35 bg-tomorrow-danger/8 p-3 text-xs leading-relaxed text-tomorrow-text" role="alert">{lab.error}</p> : null}
          </div>
        </div>

        <div className="border-t border-tomorrow-line px-5 py-4 text-xs leading-relaxed text-tomorrow-muted sm:px-7">O campo de sotaque é uma orientação de fala aplicada às instruções da sessão; não é um parâmetro nativo separado da API. O resultado pode variar conforme a voz escolhida. Nenhuma escolha deste laboratório altera a voz definitiva do Tomorrow Live.</div>
      </div>
    </section>
  );
}
