import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Plane, RotateCcw, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { answerTravelPreference, getTravelProfile, type PreferenceResponse } from "@/lib/myTomorrowProfile";
import { completeTravelMatch, travelMatchCategories } from "@/lib/travelMatch";

const positive = new Set<PreferenceResponse>(["want", "like"]);

export default function MyTomorrowWelcome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Record<string, PreferenceResponse>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    void getTravelProfile().then((state) => {
      if (!active) return;
      if (state.profile?.onboarding_completed_at) {
        navigate("/minha-area", { replace: true });
        return;
      }
      setAnswers(state.latestAnswers);
    }).catch(() => toast.error("Não foi possível carregar seu Travel Match.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [navigate]);

  const index = useMemo(() => travelMatchCategories.findIndex(([key]) => !answers[key]), [answers]);
  const currentIndex = index === -1 ? travelMatchCategories.length : index;
  const current = currentIndex < travelMatchCategories.length ? travelMatchCategories[currentIndex] : null;
  const progress = Math.round((currentIndex / travelMatchCategories.length) * 100);

  useEffect(() => {
    if (!loading && !current && !completed) setCompleted(true);
  }, [completed, current, loading]);

  const choose = async (response: PreferenceResponse) => {
    if (!current || saving) return;
    const [key] = current;
    setSaving(true);
    try {
      await answerTravelPreference(key, response);
      setHistory((items) => [...items, key]);
      setAnswers((state) => ({ ...state, [key]: response }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar sua escolha.");
    } finally {
      setSaving(false);
    }
  };

  const undo = () => {
    const last = history.at(-1);
    if (!last || saving) return;
    setHistory((items) => items.slice(0, -1));
    setAnswers((state) => { const next = { ...state }; delete next[last]; return next; });
  };

  const finish = async () => {
    setSaving(true);
    try {
      await completeTravelMatch();
      navigate("/minha-area", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir seu perfil.");
    } finally {
      setSaving(false);
    }
  };

  const liked = travelMatchCategories.filter(([key]) => positive.has(answers[key])).map(([, label]) => label);
  const avoided = travelMatchCategories.filter(([key]) => answers[key] === "not_for_me").map(([, label]) => label);

  if (loading) return <div className="min-h-screen bg-[#041012] grid place-items-center"><Loader2 className="size-8 animate-spin text-cyan-300" /></div>;

  if (completed) return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(31,196,204,.16),transparent_35%),#041012] px-5 py-10 text-white grid place-items-center">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10"><Sparkles className="size-7 text-[#d4af37]" /></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300">Travel Match concluído</p>
        <h1 className="mt-3 font-serif text-4xl">Seu Tomorrow Profile está pronto.</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/55">Suas escolhas passam a ajudar o Radar Tomorrow a separar oportunidades exatas de descobertas compatíveis com o que você explicitamente escolheu.</p>
        <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[.04] p-5 text-left">
          <p className="text-xs uppercase tracking-[.18em] text-white/40">Você quer viver</p>
          <p className="mt-2 text-lg font-medium">{liked.slice(0, 5).join(" · ") || "Você preferiu não destacar categorias"}</p>
          {avoided.length ? <><p className="mt-5 text-xs uppercase tracking-[.18em] text-white/40">Menos alinhado</p><p className="mt-2 text-sm text-white/60">{avoided.slice(0, 5).join(" · ")}</p></> : null}
        </div>
        <button type="button" disabled={saving} onClick={() => void finish()} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-semibold text-[#041012] disabled:opacity-50"><Plane className="size-5" />Explorar meu My Tomorrow</button>
      </section>
    </main>
  );

  if (!current) return null;
  const [, label, description] = current;

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(31,196,204,.12),transparent_32%),#041012] px-4 py-6 text-white sm:grid sm:place-items-center">
      <section className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={undo} disabled={!history.length || saving} className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/55 disabled:opacity-25" aria-label="Desfazer última escolha"><ArrowLeft className="size-4" /></button>
          <div className="flex-1"><div className="flex justify-between text-[11px] uppercase tracking-[.16em] text-white/45"><span>Conhecendo você</span><span>{currentIndex + 1}/{travelMatchCategories.length}</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} /></div></div>
          <div className="size-10" />
        </div>

        <div className="relative mt-8 h-[62vh] min-h-[480px] max-h-[650px]">
          <div className="absolute inset-x-5 top-3 bottom-0 rounded-[2.25rem] border border-white/5 bg-white/[.025]" />
          <article
            onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => { if (touchStart.current === null) return; const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; touchStart.current = null; if (Math.abs(delta) > 70) void choose(delta > 0 ? "want" : "not_for_me"); }}
            className="absolute inset-0 flex flex-col justify-end overflow-hidden rounded-[2.25rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_50%_22%,rgba(40,205,213,.2),transparent_27%),linear-gradient(165deg,#0b2b30,#061719_58%,#031012)] p-7 shadow-2xl shadow-black/40"
          >
            <div className="absolute left-1/2 top-[18%] grid size-36 -translate-x-1/2 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/[.06] shadow-[0_0_70px_rgba(31,196,204,.12)]"><Plane className="size-16 text-cyan-200/80" strokeWidth={1.2} /></div>
            <div className="relative"><p className="text-xs font-semibold uppercase tracking-[.22em] text-cyan-300">Travel Match</p><h1 className="mt-2 font-serif text-5xl">{label}</h1><p className="mt-3 max-w-sm text-base leading-relaxed text-white/55">{description}</p><p className="mt-5 text-sm text-white/40">Isso combina com o jeito que você quer viajar?</p></div>
          </article>
        </div>

        <div className="mt-6 flex items-center justify-center gap-8">
          <button type="button" disabled={saving} onClick={() => void choose("not_for_me")} className="grid size-16 place-items-center rounded-full border border-red-300/25 bg-red-300/[.06] text-red-200 shadow-lg transition active:scale-95 disabled:opacity-40" aria-label="Não é para mim"><X className="size-8" /></button>
          <button type="button" disabled={saving} onClick={() => void choose("want")} className="grid size-20 place-items-center rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 text-[#e8c95d] shadow-[0_0_35px_rgba(212,175,55,.12)] transition active:scale-95 disabled:opacity-40" aria-label="Quero viajar assim">{saving ? <Loader2 className="size-7 animate-spin" /> : <Plane className="size-9" />}</button>
        </div>
        <button type="button" disabled={saving} onClick={() => void choose("neutral")} className="mx-auto mt-4 flex items-center gap-2 text-xs text-white/35 hover:text-white/60"><RotateCcw className="size-3.5" />Pular por enquanto</button>
        <p className="mt-5 text-center text-[11px] text-white/25">Deslize para a direita para embarcar · esquerda para passar</p>
      </section>
    </main>
  );
}
