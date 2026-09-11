import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Plane, RotateCcw, Sparkles, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import beachImage from "@/assets/dest-maldives.jpg";
import snowImage from "@/assets/dest-iceland.jpg";
import parksImage from "@/assets/story-bombinhas-beto-carrero.jpg";
import cityImage from "@/assets/dest-kyoto.jpg";
import natureImage from "@/assets/dest-chapada.jpg";
import cultureImage from "@/assets/dest-machupicchu.jpg";
import coupleImage from "@/assets/dest-santorini.jpg";
import familyImage from "@/assets/hero-noronha.jpg";

import { answerTravelPreference, getTravelProfile, type PreferenceResponse } from "@/lib/myTomorrowProfile";
import { completeTravelMatch, travelMatchCategories } from "@/lib/travelMatch";

const positive = new Set<PreferenceResponse>(["want", "like"]);

const categoryImages: Record<string, string> = {
  praia: beachImage,
  neve: snowImage,
  parques: parksImage,
  cidade: cityImage,
  natureza: natureImage,
  gastronomia: cityImage,
  compras: cityImage,
  aventura: cultureImage,
  resort: coupleImage,
  all_inclusive: beachImage,
  cruzeiro: beachImage,
  eventos: parksImage,
  cultura: cultureImage,
  vida_noturna: cityImage,
  familia: familyImage,
  casal: coupleImage,
};

export default function MyTomorrowWelcome() {
  const navigate = useNavigate();
  const location = useLocation();
  const editing = location.pathname === "/minha-area/preferencias";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Record<string, PreferenceResponse>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [leavingX, setLeavingX] = useState(0);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    void getTravelProfile().then((state) => {
      if (!active) return;
      if (!editing && state.profile?.onboarding_completed_at) {
        navigate("/minha-area", { replace: true });
        return;
      }
      setAnswers(editing ? {} : state.latestAnswers);
    }).catch(() => toast.error("Não foi possível carregar seu Travel Match.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [editing, navigate]);

  const index = useMemo(() => travelMatchCategories.findIndex(([key]) => !answers[key]), [answers]);
  const currentIndex = index === -1 ? travelMatchCategories.length : index;
  const current = currentIndex < travelMatchCategories.length ? travelMatchCategories[currentIndex] : null;
  const progress = Math.round((currentIndex / travelMatchCategories.length) * 100);

  useEffect(() => {
    if (!loading && !current && !completed) setCompleted(true);
  }, [completed, current, loading]);

  const persistChoice = async (response: PreferenceResponse) => {
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
      setDragX(0);
      setLeavingX(0);
    }
  };

  const choose = (response: PreferenceResponse) => {
    if (!current || saving || leavingX !== 0) return;
    const direction = response === "not_for_me" ? -1 : response === "want" ? 1 : 0;
    if (direction === 0) {
      void persistChoice(response);
      return;
    }
    setLeavingX(direction * 520);
    window.setTimeout(() => void persistChoice(response), 180);
  };

  const undo = () => {
    const last = history.at(-1);
    if (!last || saving) return;
    setHistory((items) => items.slice(0, -1));
    setAnswers((state) => { const next = { ...state }; delete next[last]; return next; });
    setCompleted(false);
  };

  const finish = async () => {
    setSaving(true);
    try {
      if (!editing) await completeTravelMatch();
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
        <p className="mt-4 text-sm leading-relaxed text-white/55">O Radar Tomorrow passa a usar essas escolhas como sinais explícitos para sugestões de descoberta.</p>
        <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[.04] p-5 text-left">
          <p className="text-xs uppercase tracking-[.18em] text-white/40">Você embarcaria em</p>
          <p className="mt-2 text-lg font-medium">{liked.slice(0, 6).join(" · ") || "Nenhuma categoria marcada"}</p>
          {avoided.length ? <><p className="mt-5 text-xs uppercase tracking-[.18em] text-white/40">Você passou</p><p className="mt-2 text-sm text-white/60">{avoided.slice(0, 6).join(" · ")}</p></> : null}
        </div>
        <button type="button" disabled={saving} onClick={() => void finish()} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-semibold text-[#041012] disabled:opacity-50"><Plane className="size-5" />Ir para o My Tomorrow</button>
      </section>
    </main>
  );

  if (!current) return null;
  const [key, label, description] = current;
  const image = categoryImages[key] ?? beachImage;
  const visualX = leavingX || dragX;
  const rotation = Math.max(-9, Math.min(9, visualX / 28));

  return (
    <main className="min-h-screen overflow-hidden bg-[#041012] px-4 py-5 text-white sm:grid sm:place-items-center">
      <section className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={undo} disabled={!history.length || saving} className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 disabled:opacity-25" aria-label="Desfazer última escolha"><ArrowLeft className="size-4" /></button>
          <div className="flex-1"><div className="flex justify-between text-[11px] uppercase tracking-[.16em] text-white/45"><span>Travel Match</span><span>{currentIndex + 1}/{travelMatchCategories.length}</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} /></div></div>
          <div className="size-10" />
        </div>

        <div className="relative mt-5 h-[68vh] min-h-[500px] max-h-[700px]">
          <div className="absolute inset-x-4 top-3 bottom-0 rounded-[2rem] border border-white/5 bg-white/[.035]" />
          <article
            onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
            onTouchMove={(event) => { if (touchStart.current === null || saving) return; setDragX((event.touches[0]?.clientX ?? touchStart.current) - touchStart.current); }}
            onTouchEnd={() => {
              touchStart.current = null;
              if (dragX > 80) choose("want");
              else if (dragX < -80) choose("not_for_me");
              else setDragX(0);
            }}
            className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#07191c] shadow-2xl shadow-black/50 will-change-transform"
            style={{ transform: `translateX(${visualX}px) rotate(${rotation}deg)`, transition: leavingX ? "transform 180ms ease-out" : dragX === 0 ? "transform 180ms ease-out" : "none" }}
          >
            <img src={image} alt={label} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02090a] via-[#02090a]/15 to-black/5" />
            {visualX > 35 ? <div className="absolute left-6 top-7 rotate-[-8deg] rounded-xl border-2 border-[#d4af37] px-4 py-2 text-xl font-bold uppercase tracking-[.18em] text-[#f0d56d]">Embarco ✈</div> : null}
            {visualX < -35 ? <div className="absolute right-6 top-7 rotate-[8deg] rounded-xl border-2 border-red-300 px-4 py-2 text-xl font-bold uppercase tracking-[.18em] text-red-200">Passo ✕</div> : null}
            <div className="absolute inset-x-0 bottom-0 p-7 pb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-cyan-200">Isso combina com você?</p>
              <h1 className="mt-2 font-serif text-5xl drop-shadow-xl">{label}</h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75 drop-shadow">{description}</p>
            </div>
          </article>
        </div>

        <div className="mt-5 flex items-center justify-center gap-10">
          <button type="button" disabled={saving} onClick={() => choose("not_for_me")} className="grid size-16 place-items-center rounded-full border-2 border-red-300/45 bg-[#07191c] text-red-200 shadow-xl transition active:scale-90 disabled:opacity-40" aria-label="Não é para mim"><X className="size-8" /></button>
          <button type="button" disabled={saving} onClick={() => choose("want")} className="grid size-20 place-items-center rounded-full border-2 border-[#d4af37]/60 bg-[#0a2529] text-[#efd36a] shadow-[0_0_35px_rgba(212,175,55,.18)] transition active:scale-90 disabled:opacity-40" aria-label="Quero viajar assim">{saving ? <Loader2 className="size-7 animate-spin" /> : <Plane className="size-9" />}</button>
        </div>
        <button type="button" disabled={saving} onClick={() => choose("neutral")} className="mx-auto mt-4 flex items-center gap-2 text-xs text-white/35 hover:text-white/60"><RotateCcw className="size-3.5" />Pular</button>
        <p className="mt-4 text-center text-[11px] text-white/30">Arraste para a esquerda ou direita, como no Tinder</p>
      </section>
    </main>
  );
}
