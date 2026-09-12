import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Plane, RotateCcw, Sparkles, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { answerTravelPreference, getTravelProfile, type PreferenceResponse } from "@/lib/myTomorrowProfile";
import { completeTravelMatch, travelMatchCategories } from "@/lib/travelMatch";
import { travelMatchVisualStyle } from "@/lib/travelMatchVisuals";

const positive = new Set<PreferenceResponse>(["want", "like"]);
const TRANSITION_MS = 140;

export default function MyTomorrowWelcome() {
  const navigate = useNavigate();
  const location = useLocation();
  const editing = location.pathname === "/minha-area/preferencias";
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, PreferenceResponse>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [leavingX, setLeavingX] = useState(0);
  const touchStart = useRef<number | null>(null);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const writeFailed = useRef(false);

  useEffect(() => {
    const sprite = new Image();
    sprite.decoding = "async";
    sprite.src = "/travel-match/generated-sprite.jpg";
    void sprite.decode().catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    void getTravelProfile()
      .then((state) => {
        if (!active) return;
        if (!editing && state.profile?.onboarding_completed_at) {
          navigate("/minha-area", { replace: true });
          return;
        }
        setAnswers(editing ? {} : state.latestAnswers);
      })
      .catch(() => toast.error("Não foi possível carregar seu Travel Match."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [editing, navigate]);

  const index = useMemo(() => travelMatchCategories.findIndex(([key]) => !answers[key]), [answers]);
  const currentIndex = index === -1 ? travelMatchCategories.length : index;
  const current = currentIndex < travelMatchCategories.length ? travelMatchCategories[currentIndex] : null;
  const progress = Math.round((currentIndex / travelMatchCategories.length) * 100);

  useEffect(() => {
    if (!loading && !current && !completed) setCompleted(true);
  }, [completed, current, loading]);

  const queueChoiceWrite = (key: string, response: PreferenceResponse) => {
    writeQueue.current = writeQueue.current.then(async () => {
      try {
        await answerTravelPreference(key, response);
      } catch {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        try {
          await answerTravelPreference(key, response);
        } catch (error) {
          writeFailed.current = true;
          console.error("[TRAVEL_MATCH_PERSIST_ERROR]", key, error);
        }
      }
    });
  };

  const commitChoice = (key: string, response: PreferenceResponse) => {
    setHistory((items) => [...items, key]);
    setAnswers((state) => ({ ...state, [key]: response }));
    setDragX(0);
    setLeavingX(0);
    queueChoiceWrite(key, response);
  };

  const choose = (response: PreferenceResponse) => {
    if (!current || finishing || leavingX !== 0) return;
    const [key] = current;
    const direction = response === "not_for_me" ? -1 : response === "want" ? 1 : 0;

    if (!direction) {
      commitChoice(key, response);
      return;
    }

    setLeavingX(direction * 520);
    window.setTimeout(() => commitChoice(key, response), TRANSITION_MS);
  };

  const undo = () => {
    const last = history.at(-1);
    if (!last || finishing || leavingX !== 0) return;
    setHistory((items) => items.slice(0, -1));
    setAnswers((state) => {
      const next = { ...state };
      delete next[last];
      return next;
    });
    setCompleted(false);
  };

  const flushWrites = async () => {
    await writeQueue.current;
    if (writeFailed.current) {
      throw new Error("Algumas escolhas não foram sincronizadas. Verifique sua conexão e tente novamente.");
    }
  };

  const enterMyTomorrow = async () => {
    setFinishing(true);
    try {
      await flushWrites();
      if (!editing) await completeTravelMatch();
      navigate("/minha-area", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir seu perfil inicial.");
    } finally {
      setFinishing(false);
    }
  };

  const refine = async () => {
    setFinishing(true);
    try {
      await flushWrites();
      if (!editing) await completeTravelMatch();
      navigate("/minha-area/perfil/refinar", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sincronizar suas escolhas.");
    } finally {
      setFinishing(false);
    }
  };

  const liked = travelMatchCategories.filter(([key]) => positive.has(answers[key])).map(([, label]) => label);
  const avoided = travelMatchCategories.filter(([key]) => answers[key] === "not_for_me").map(([, label]) => label);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#041012]"><Loader2 className="size-8 animate-spin text-cyan-300" /></div>;
  }

  if (completed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,rgba(31,196,204,.16),transparent_35%),#041012] px-5 py-10 text-white">
        <section className="w-full max-w-md text-center">
          <Sparkles className="mx-auto size-10 text-[#d4af37]" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300">Tomorrow Profile · 55%</p>
          <h1 className="mt-3 font-serif text-4xl">Seu perfil inicial está pronto.</h1>
          <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-white/10"><div className="h-full w-[55%] rounded-full bg-cyan-300" /></div>
          <p className="mt-4 text-sm leading-relaxed text-white/55">Já entendemos seus principais interesses. Seu perfil já pode ajudar o Radar nas sugestões de Discovery. Você pode refinar seu jeito de viajar agora ou continuar depois.</p>
          <div className="mt-7 rounded-[1.75rem] border border-white/10 bg-white/[.04] p-5 text-left">
            <p className="text-xs uppercase tracking-[.18em] text-white/40">Você embarcaria em</p>
            <p className="mt-2 text-lg font-medium">{liked.slice(0, 6).join(" · ") || "Nenhuma categoria marcada"}</p>
            {avoided.length ? <><p className="mt-5 text-xs uppercase tracking-[.18em] text-white/40">Você passou</p><p className="mt-2 text-sm text-white/60">{avoided.slice(0, 6).join(" · ")}</p></> : null}
          </div>
          <button disabled={finishing} onClick={() => void refine()} className="mt-6 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-semibold text-[#041012] disabled:opacity-50">{finishing ? "Sincronizando..." : "Refinar meu perfil"}</button>
          <button disabled={finishing} onClick={() => void enterMyTomorrow()} className="mt-3 w-full rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white/75 disabled:opacity-50">Ir para o My Tomorrow</button>
        </section>
      </main>
    );
  }

  if (!current) return null;
  const [key, label, description] = current;
  const visualX = leavingX || dragX;
  const rotation = Math.max(-9, Math.min(9, visualX / 28));
  const interactionLocked = finishing || leavingX !== 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#041012] px-4 py-5 text-white sm:grid sm:place-items-center">
      <section className="mx-auto w-full max-w-md">
        <div className="flex items-center gap-4">
          <button onClick={undo} disabled={!history.length || interactionLocked} className="grid size-10 place-items-center rounded-full border border-white/10 disabled:opacity-30"><ArrowLeft className="size-4" /></button>
          <div className="flex-1">
            <div className="flex justify-between text-[11px] uppercase tracking-[.16em] text-white/45"><span>Travel Match</span><span>{currentIndex + 1}/{travelMatchCategories.length}</span></div>
            <div className="mt-2 h-1 rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>

        <div className="relative mt-5 h-[68vh] min-h-[500px] max-h-[700px]">
          <article
            onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
            onTouchMove={(event) => {
              if (touchStart.current === null || interactionLocked) return;
              setDragX((event.touches[0]?.clientX ?? touchStart.current) - touchStart.current);
            }}
            onTouchEnd={() => {
              touchStart.current = null;
              if (dragX > 80) choose("want");
              else if (dragX < -80) choose("not_for_me");
              else setDragX(0);
            }}
            className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#07191c] shadow-2xl"
            style={{
              transform: `translate3d(${visualX}px,0,0) rotate(${rotation}deg)`,
              transition: leavingX ? `transform ${TRANSITION_MS}ms ease-out` : dragX === 0 ? "transform 120ms ease-out" : "none",
              willChange: "transform",
              contain: "paint",
            }}
          >
            <div className="absolute inset-0 bg-cover" style={{ ...travelMatchVisualStyle(key), transform: "translateZ(0)" }} />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,#02090a_0%,#02090a_34%,rgba(2,9,10,.82)_47%,rgba(2,9,10,.12)_70%,rgba(0,0,0,.05)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-cyan-200">Isso combina com você?</p>
              <h1 className="mt-2 font-serif text-5xl">{label}</h1>
              <p className="mt-3 text-sm text-white/75">{description}</p>
            </div>
          </article>
        </div>

        <div className="mt-5 flex justify-center gap-10">
          <button disabled={interactionLocked} onClick={() => choose("not_for_me")} className="grid size-16 place-items-center rounded-full border-2 border-red-300/45 text-red-200 disabled:opacity-40"><X className="size-8" /></button>
          <button disabled={interactionLocked} onClick={() => choose("want")} className="grid size-20 place-items-center rounded-full border-2 border-[#d4af37]/60 text-[#efd36a] disabled:opacity-40"><Plane className="size-9" /></button>
        </div>
        <button disabled={interactionLocked} onClick={() => choose("neutral")} className="mx-auto mt-4 flex items-center gap-2 text-xs text-white/35 disabled:opacity-40"><RotateCcw className="size-3.5" />Pular</button>
      </section>
    </main>
  );
}
