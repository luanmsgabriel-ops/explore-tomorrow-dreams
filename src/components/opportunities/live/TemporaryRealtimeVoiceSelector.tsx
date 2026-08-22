import { useState } from "react";
import { AudioLines } from "lucide-react";
import { useLocation } from "react-router-dom";

import {
  getSelectedRealtimeVoice,
  REALTIME_VOICES,
  setSelectedRealtimeVoice,
  type RealtimeVoiceName,
} from "@/lib/realtimeVoice";

const voiceLabels: Record<RealtimeVoiceName, string> = {
  alloy: "Alloy",
  ash: "Ash",
  ballad: "Ballad",
  coral: "Coral",
  echo: "Echo",
  sage: "Sage",
  shimmer: "Shimmer",
  verse: "Verse",
  marin: "Marin · recomendada",
  cedar: "Cedar · atual",
};

export function TemporaryRealtimeVoiceSelector() {
  const location = useLocation();
  const [voice, setVoice] = useState<RealtimeVoiceName>(() => getSelectedRealtimeVoice());

  if (location.pathname !== "/oportunidades/live") return null;

  const changeVoice = (next: string) => {
    if (!(REALTIME_VOICES as readonly string[]).includes(next)) return;
    const selected = next as RealtimeVoiceName;
    setVoice(selected);
    setSelectedRealtimeVoice(selected);
  };

  return (
    <aside
      className="fixed bottom-3 left-3 z-[95] w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border border-tomorrow-gold/35 bg-[#041416]/95 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.58)] backdrop-blur-xl sm:bottom-5 sm:left-5"
      aria-label="Seletor temporário de voz do Tomorrow Live"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-tomorrow-teal/30 bg-tomorrow-teal/10 text-tomorrow-teal-soft">
          <AudioLines className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-tomorrow-gold-soft">Teste temporário de voz</p>
          <label htmlFor="temporary-realtime-voice" className="mt-1 block text-xs font-semibold text-tomorrow-text">
            Voz do Téo
          </label>
          <select
            id="temporary-realtime-voice"
            value={voice}
            onChange={(event) => changeVoice(event.target.value)}
            className="opportunity-focus mt-2 w-full rounded-lg border border-tomorrow-line bg-tomorrow-background px-3 py-2 text-sm font-semibold text-tomorrow-text outline-none"
          >
            {REALTIME_VOICES.map((name) => (
              <option key={name} value={name}>{voiceLabels[name]}</option>
            ))}
          </select>
          <p className="mt-2 text-[0.66rem] leading-relaxed text-tomorrow-muted">
            A escolha vale para a próxima conversa. Encerre a sessão atual e inicie outra para comparar.
          </p>
        </div>
      </div>
    </aside>
  );
}
