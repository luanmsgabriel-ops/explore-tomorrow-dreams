import { FlaskConical, Mic, MicOff, Power, Sparkles, Volume2, VolumeX } from "lucide-react";

import { OpportunityBadge, OpportunityButton } from "@/components/opportunities";
import { useGptLiveVoiceLab } from "@/hooks/useGptLiveVoiceLab";
import { TEO_GPT_LIVE_SETTINGS } from "@/lib/gptLiveVoiceLab";

export function LiveVoiceLab() {
  const lab = useGptLiveVoiceLab(TEO_GPT_LIVE_SETTINGS);
  const locked = lab.status === "connecting" || lab.connected;

  return (
    <section className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="gpt-live-lab-title">
      <div className="overflow-hidden rounded-tomorrow-lg border border-tomorrow-gold/35 bg-[linear-gradient(145deg,rgba(7,35,39,.96),rgba(4,19,21,.98))] shadow-[0_30px_90px_rgba(0,0,0,.28)]">
        <div className="border-b border-tomorrow-line px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-center gap-3">
            <OpportunityBadge variant="neutral"><FlaskConical className="size-3.5" aria-hidden="true" />Voice Lab</OpportunityBadge>
            <OpportunityBadge variant="package">Téo · hiperenergia x2</OpportunityBadge>
          </div>
          <h2 id="gpt-live-lab-title" className="mt-3 font-editorial text-3xl text-tomorrow-text sm:text-4xl">Téo · GPT-Live-1</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-tomorrow-muted">Preset oficial de teste travado: voz Tempo, sotaque paulista leve, empolgação dobrada desde a primeira palavra, espontaneidade extrema e gírias mais moderadas.</p>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_.78fr]">
          <div className="rounded-2xl border border-tomorrow-gold/25 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,.12),transparent_44%),rgba(4,16,18,.58)] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full border border-tomorrow-gold/30 bg-tomorrow-gold/10 p-2.5 text-tomorrow-gold"><Sparkles className="size-5" aria-hidden="true" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-tomorrow-gold">Personalidade ativa</p>
                <h3 className="mt-1 font-editorial text-2xl text-tomorrow-text">Téo · empolgação máxima x2</h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-tomorrow-muted">A fala deve começar muito empolgada já na primeira palavra, manter energia muito alta e reagir de forma espontânea, informal e divertida. O sotaque paulista agora é leve; as gírias aparecem só de vez em quando, sem dominar a conversa.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-tomorrow-teal/25 bg-tomorrow-teal/8 px-3 py-1.5 text-tomorrow-teal-soft">Empolgação x2</span>
              <span className="rounded-full border border-tomorrow-teal/25 bg-tomorrow-teal/8 px-3 py-1.5 text-tomorrow-teal-soft">Espontaneidade extrema</span>
              <span className="rounded-full border border-tomorrow-teal/25 bg-tomorrow-teal/8 px-3 py-1.5 text-tomorrow-teal-soft">Informal natural</span>
              <span className="rounded-full border border-tomorrow-teal/25 bg-tomorrow-teal/8 px-3 py-1.5 text-tomorrow-teal-soft">Paulista leve</span>
            </div>
          </div>

          <div className="rounded-2xl border border-tomorrow-teal/25 bg-tomorrow-background/55 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-tomorrow-teal-soft">Configuração fixa do Téo</p>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Modelo</dt><dd className="font-semibold text-tomorrow-text">gpt-live-1</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Voz</dt><dd className="font-semibold text-tomorrow-text">Tempo</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Sotaque</dt><dd className="font-semibold text-tomorrow-text">Paulista leve</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Ritmo</dt><dd className="font-semibold text-tomorrow-text">Ágil · muito energético</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Espontaneidade</dt><dd className="font-semibold text-tomorrow-text">Extrema</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Gírias</dt><dd className="font-semibold text-tomorrow-text">Moderadas</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-tomorrow-muted">Prompt</dt><dd className="font-semibold text-tomorrow-gold">Téo hiperempolgado x2</dd></div>
            </dl>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <OpportunityButton variant={locked ? "outline" : "gold"} disabled={locked} onClick={lab.start} fullWidth>
                <Mic aria-hidden="true" />{lab.status === "connecting" ? "Conectando..." : lab.connected ? "Téo ativo" : "Conversar com Téo"}
              </OpportunityButton>
              <OpportunityButton variant="outline" disabled={!locked} onClick={lab.stop} fullWidth><Power aria-hidden="true" />Encerrar conversa</OpportunityButton>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" disabled={!lab.connected} onClick={lab.toggleMute} className="opportunity-focus flex items-center justify-center gap-2 rounded-xl border border-tomorrow-line px-3 py-2 text-xs font-semibold text-tomorrow-text disabled:opacity-45">{lab.muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}{lab.muted ? "Reativar mic" : "Pausar mic"}</button>
              <button type="button" disabled={!lab.connected} onClick={lab.toggleSpeaker} className="opportunity-focus flex items-center justify-center gap-2 rounded-xl border border-tomorrow-line px-3 py-2 text-xs font-semibold text-tomorrow-text disabled:opacity-45">{lab.speakerEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}{lab.speakerEnabled ? "Silenciar Téo" : "Ouvir Téo"}</button>
            </div>

            {lab.connected ? <p className="mt-4 text-center text-xs font-semibold text-tomorrow-teal-soft">Téo conectado com o preset de empolgação x2 e sotaque paulista leve.</p> : null}
            {lab.error ? <p className="mt-4 rounded-xl border border-tomorrow-danger/35 bg-tomorrow-danger/8 p-3 text-xs leading-relaxed text-tomorrow-text" role="alert">{lab.error}</p> : null}
          </div>
        </div>

        <div className="border-t border-tomorrow-line px-5 py-4 text-xs leading-relaxed text-tomorrow-muted sm:px-7">Preset travado: Tempo + paulista leve + ritmo muito energético + empolgação x2 + espontaneidade extrema + gírias moderadas. Para sentir mudanças, encerre a sessão anterior e inicie uma nova.</div>
      </div>
    </section>
  );
}
