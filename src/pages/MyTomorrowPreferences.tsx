import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Heart, Loader2, RotateCcw, Sparkles, ThumbsUp, X } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { answerTravelPreference, getTravelProfile, resetTravelPreferences, type PreferenceResponse, type TravelerAffinity } from "@/lib/myTomorrowProfile";

const categories = [
  ["praia", "Praia"], ["neve", "Neve"], ["parques", "Parques"], ["cidade", "Cidade"],
  ["natureza", "Natureza"], ["gastronomia", "Gastronomia"], ["compras", "Compras"], ["aventura", "Aventura"],
  ["resort", "Resort"], ["all_inclusive", "All inclusive"], ["cruzeiro", "Cruzeiro"], ["eventos", "Eventos"],
  ["cultura", "Cultura"], ["vida_noturna", "Vida noturna"], ["familia", "Família"], ["casal", "Casal"],
] as const;

const choices: Array<{ value: PreferenceResponse; label: string; icon: typeof Heart }> = [
  { value: "want", label: "Quero", icon: Heart },
  { value: "like", label: "Gosto", icon: ThumbsUp },
  { value: "neutral", label: "Tanto faz", icon: Check },
  { value: "not_for_me", label: "Não é para mim", icon: X },
];

function affinityLabel(score: number) {
  if (score >= 0.75) return "forte interesse";
  if (score >= 0.25) return "interesse";
  if (score <= -0.5) return "evitar";
  return "neutro";
}

export default function MyTomorrowPreferences() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, PreferenceResponse>>({});
  const [affinities, setAffinities] = useState<TravelerAffinity[]>([]);

  const refresh = async () => {
    const state = await getTravelProfile();
    setAnswers(state.latestAnswers);
    setAffinities(state.affinities);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const state = await getTravelProfile();
        if (!active) return;
        setAnswers(state.latestAnswers);
        setAffinities(state.affinities);
      } catch {
        toast.error("As preferências ainda dependem da migration e da Edge Function da Fase 3.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const answeredCount = Object.keys(answers).length;
  const topAffinities = useMemo(() => affinities.filter((item) => item.evidence_count > 0).slice(0, 5), [affinities]);

  const answer = async (key: string, response: PreferenceResponse) => {
    setSavingKey(key);
    try {
      await answerTravelPreference(key, response);
      setAnswers((current) => ({ ...current, [key]: response }));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar sua preferência.");
    } finally {
      setSavingKey(null);
    }
  };

  const reset = async () => {
    setResetting(true);
    try {
      await resetTravelPreferences();
      setAnswers({});
      setAffinities([]);
      toast.success("Preferências resetadas. O histórico foi revogado, não apagado silenciosamente.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível resetar as preferências.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#041012] text-white">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <Link to="/minha-area" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><ArrowLeft className="size-4" />Voltar ao My Tomorrow</Link>
        <section className="mt-6 rounded-[2rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(27,184,190,0.14),transparent_42%),linear-gradient(135deg,rgba(7,35,39,0.98),rgba(3,15,17,0.98))] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Travel Match</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Ensine o My Tomorrow sem formulário longo</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">Cada resposta é explícita, fica registrada com origem e data e pode ser substituída ou resetada. O Radar futuro continuará priorizando filtros definidos por você em cada viagem.</p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs"><span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">{answeredCount}/{categories.length} respondidas</span><Link to="/minha-area/perfil" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-cyan-200">Editar Travel Profile</Link></div>
        </section>

        {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="size-7 animate-spin text-cyan-300" /></div> : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-4">
              {categories.map(([key, label]) => (
                <article key={key} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex items-center justify-between gap-4"><div><p className="font-serif text-xl">{label}</p><p className="mt-1 text-xs text-white/45">Como essa categoria entra nas suas viagens?</p></div>{savingKey === key ? <Loader2 className="size-5 animate-spin text-cyan-300" /> : answers[key] ? <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">Salvo</span> : null}</div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{choices.map((choice) => { const Icon = choice.icon; const active = answers[key] === choice.value; return <button key={choice.value} type="button" disabled={savingKey === key} onClick={() => void answer(key, choice.value)} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition ${active ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-black/15 text-white/55 hover:bg-white/[0.05]"}`}><Icon className="size-4" />{choice.label}</button>; })}</div>
                </article>
              ))}
            </section>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-[1.5rem] border border-[#d4af37]/20 bg-[#d4af37]/[0.045] p-5">
                <div className="flex items-center gap-2"><Sparkles className="size-5 text-[#d4af37]" /><h2 className="font-serif text-xl">Afinidades atuais</h2></div>
                <p className="mt-2 text-xs leading-relaxed text-white/45">São agregações explicáveis das suas respostas, não diagnóstico nem verdade permanente.</p>
                <div className="mt-4 space-y-3">{topAffinities.length === 0 ? <p className="text-sm text-white/50">Responda alguns cards para formar seu perfil.</p> : topAffinities.map((item) => <div key={item.preference_key} className="flex items-center justify-between gap-3 rounded-xl bg-black/15 px-3 py-3"><div><p className="text-sm font-medium">{categories.find(([key]) => key === item.preference_key)?.[1] ?? item.preference_key}</p><p className="text-[11px] text-white/40">{item.evidence_count} sinal(is)</p></div><span className="text-xs text-[#d4af37]">{affinityLabel(Number(item.affinity_score))}</span></div>)}</div>
              </section>

              <button type="button" disabled={resetting || answeredCount === 0} onClick={() => void reset()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/15 bg-red-300/[0.04] px-4 py-3 text-sm text-red-100 disabled:opacity-40"><RotateCcw className="size-4" />{resetting ? "Resetando..." : "Resetar preferências"}</button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
