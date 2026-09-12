import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  answerProfileRefinement,
  getTravelProfile,
  type PreferenceResponse,
} from "@/lib/myTomorrowProfile";
import {
  deriveProfileAxes,
  nextProfileStage,
  profileCompletion,
  refinementQuestions,
  type RefinementChoice,
} from "@/lib/progressiveTravelProfile";
import { travelMatchVisualStyle } from "@/lib/travelMatchVisuals";

const axisLabels: Record<string, [string, string]> = {
  exploration: ["Descanso", "Exploração"],
  planning: ["Espontâneo", "Planejado"],
  comfort: ["Economia", "Conforto"],
  pace: ["Ritmo leve", "Ritmo ativo"],
  discovery: ["Clássicos", "Descoberta"],
  independence: ["Independente", "Organizado"],
};

export default function MyTomorrowProfileRefine() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState<Record<string, PreferenceResponse>>({});
  const [refinements, setRefinements] = useState<Record<string, RefinementChoice>>({});

  useEffect(() => {
    let active = true;
    void getTravelProfile()
      .then((state) => {
        if (!active) return;
        setInterests(state.latestAnswers);
        setRefinements(state.refinements);
      })
      .catch(() => toast.error("Não foi possível carregar seu perfil."))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const completion = profileCompletion(interests, refinements);
  const next = useMemo(
    () => refinementQuestions.find((question) => !refinements[question.key]),
    [refinements],
  );
  const axes = deriveProfileAxes(refinements);

  const choose = async (choice: RefinementChoice) => {
    if (!next || saving) return;
    setSaving(true);
    try {
      await answerProfileRefinement(next.key, next.stage, choice);
      setRefinements((current) => ({ ...current, [next.key]: choice }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar sua resposta.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#041012]">
        <Loader2 className="size-8 animate-spin text-cyan-300" />
      </div>
    );
  }

  if (!next) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#041012] px-5 py-10 text-white">
        <section className="w-full max-w-md text-center">
          <Sparkles className="mx-auto size-10 text-[#d4af37]" />
          <p className="mt-5 text-xs uppercase tracking-[.22em] text-cyan-300">Tomorrow Profile · 100%</p>
          <h1 className="mt-3 font-serif text-4xl">Seu perfil está completo.</h1>
          <div className="mt-8 space-y-4 text-left">
            {Object.entries(axes).map(([axis, value]) => {
              const labels = axisLabels[axis] ?? [axis, axis];
              return (
                <div key={axis}>
                  <div className="flex justify-between text-xs text-white/45">
                    <span>{labels[0]}</span>
                    <span>{labels[1]}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-300" style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => navigate("/minha-area")}
            className="mt-8 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-semibold text-[#041012]"
          >
            Voltar ao My Tomorrow
          </button>
        </section>
      </main>
    );
  }

  const stage = nextProfileStage(completion);
  const options = [
    ["left", next.left, next.leftImage],
    ["right", next.right, next.rightImage],
  ] as const;

  return (
    <main className="min-h-screen bg-[#041012] px-4 py-6 text-white">
      <section className="mx-auto max-w-md">
        <div className="flex items-center gap-4">
          <Link to="/minha-area" className="grid size-10 place-items-center rounded-full border border-white/10">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex-1">
            <div className="flex justify-between text-xs uppercase tracking-[.16em] text-white/45">
              <span>Tomorrow Profile</span>
              <span>{completion}%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] p-4">
          <p className="text-xs uppercase tracking-[.18em] text-cyan-300">Próxima camada · {stage.target}%</p>
          <p className="mt-1 text-sm text-white/60">{stage.label}</p>
        </div>

        <h1 className="mt-8 font-serif text-3xl">{next.prompt}</h1>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {options.map(([choice, label, visual]) => (
            <button
              key={choice}
              type="button"
              disabled={saving}
              onClick={() => void choose(choice)}
              className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[.04] text-left transition active:scale-[.98] disabled:opacity-50"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <div className="absolute inset-0" style={travelMatchVisualStyle(visual)} />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,#041012_0%,rgba(4,16,18,.96)_30%,rgba(4,16,18,.35)_58%,transparent_100%)]" />
                <span className="absolute inset-x-0 bottom-0 block p-4 text-sm font-semibold leading-snug">{label}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void choose("neutral")}
          className="mt-4 w-full py-3 text-xs text-white/40 disabled:opacity-50"
        >
          Tanto faz / pular
        </button>

        <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 p-4">
          <div>
            <p className="text-xs text-white/40">Seu perfil já está ativo</p>
            <p className="mt-1 text-sm">Você pode continuar depois.</p>
          </div>
          <Link to="/minha-area" className="grid size-10 place-items-center rounded-full bg-white/5">
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
