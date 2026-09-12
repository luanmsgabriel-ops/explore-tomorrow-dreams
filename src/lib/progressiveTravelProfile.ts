import type { PreferenceResponse } from "@/lib/myTomorrowProfile";

export type ProfileStage = "interests" | "style" | "comfort" | "rhythm" | "advanced";
export type RefinementChoice = "left" | "right" | "neutral";

export type RefinementQuestion = {
  key: string;
  stage: Exclude<ProfileStage, "interests">;
  prompt: string;
  left: string;
  right: string;
  leftImage: string;
  rightImage: string;
  axis: "exploration" | "planning" | "comfort" | "pace" | "discovery" | "independence";
};

export const profileStages: Array<{ key: ProfileStage; target: number; label: string }> = [
  { key: "interests", target: 55, label: "Interesses" },
  { key: "style", target: 70, label: "Estilo de viagem" },
  { key: "comfort", target: 82, label: "Conforto" },
  { key: "rhythm", target: 92, label: "Companhia e ritmo" },
  { key: "advanced", target: 100, label: "Preferências avançadas" },
];

export const refinementQuestions: RefinementQuestion[] = [
  { key: "style_explore_rest", stage: "style", prompt: "Qual viagem parece mais com você?", left: "Descansar sem pressa", right: "Explorar o máximo possível", leftImage: "/images/posters/maldivas.jpg", rightImage: "/images/posters/lencois.jpg", axis: "exploration" },
  { key: "style_plan_spontaneous", stage: "style", prompt: "Como você prefere viajar?", left: "Tudo planejado", right: "Espaço para improvisar", leftImage: "/images/posters/dubai.jpg", rightImage: "/images/posters/jeri.jpg", axis: "planning" },
  { key: "style_classic_discovery", stage: "style", prompt: "O que te atrai mais?", left: "Os grandes clássicos", right: "Lugares menos óbvios", leftImage: "/images/posters/dubai.jpg", rightImage: "/images/posters/noronha.jpg", axis: "discovery" },
  { key: "comfort_hotel", stage: "comfort", prompt: "Na hospedagem, o que pesa mais?", left: "Funcional e bem localizado", right: "O hotel faz parte da experiência", leftImage: "/images/posters/jeri.jpg", rightImage: "/images/posters/maldivas.jpg", axis: "comfort" },
  { key: "comfort_flight", stage: "comfort", prompt: "No deslocamento, você prefere?", left: "Economizar mesmo com conexão", right: "Pagar mais por praticidade", leftImage: "/images/posters/lencois.jpg", rightImage: "/images/posters/dubai.jpg", axis: "comfort" },
  { key: "comfort_structure", stage: "comfort", prompt: "Durante a viagem?", left: "Resolver as coisas pelo caminho", right: "Ter estrutura já organizada", leftImage: "/images/posters/jeri.jpg", rightImage: "/images/posters/maldivas.jpg", axis: "independence" },
  { key: "rhythm_days", stage: "rhythm", prompt: "Seu dia ideal de viagem?", left: "Poucos compromissos", right: "Roteiro cheio de experiências", leftImage: "/images/posters/noronha.jpg", rightImage: "/images/posters/dubai.jpg", axis: "pace" },
  { key: "rhythm_repeat_new", stage: "rhythm", prompt: "Quando encontra algo que ama?", left: "Voltaria sem pensar", right: "Prefiro descobrir algo novo", leftImage: "/images/posters/maldivas.jpg", rightImage: "/images/posters/lencois.jpg", axis: "discovery" },
  { key: "advanced_guided", stage: "advanced", prompt: "Para conhecer um lugar novo?", left: "Gosto de explorar sozinho", right: "Prefiro experiências guiadas", leftImage: "/images/posters/jeri.jpg", rightImage: "/images/posters/dubai.jpg", axis: "independence" },
  { key: "advanced_priority", stage: "advanced", prompt: "Se precisar escolher?", left: "Mais experiências pelo mesmo valor", right: "Menos experiências, mais conforto", leftImage: "/images/posters/lencois.jpg", rightImage: "/images/posters/maldivas.jpg", axis: "comfort" },
];

const stageQuestionCounts = refinementQuestions.reduce<Record<string, number>>((acc, question) => {
  acc[question.stage] = (acc[question.stage] ?? 0) + 1;
  return acc;
}, {});

export function profileCompletion(interests: Record<string, PreferenceResponse>, refinements: Record<string, RefinementChoice>) {
  const interestCount = Object.keys(interests).length;
  const interestProgress = Math.min(1, interestCount / 16) * 55;
  let completion = interestProgress;
  let previousTarget = 55;
  for (const stage of profileStages.slice(1)) {
    const stageQuestions = refinementQuestions.filter((question) => question.stage === stage.key);
    const answered = stageQuestions.filter((question) => refinements[question.key]).length;
    const span = stage.target - previousTarget;
    completion += stageQuestions.length ? span * (answered / stageQuestions.length) : 0;
    previousTarget = stage.target;
  }
  return Math.min(100, Math.round(completion));
}

export function nextProfileStage(completion: number) {
  return profileStages.find((stage) => completion < stage.target) ?? profileStages.at(-1)!;
}

export function stageQuestionCount(stage: ProfileStage) {
  return stageQuestionCounts[stage] ?? 0;
}

export function deriveProfileAxes(refinements: Record<string, RefinementChoice>) {
  const totals: Record<string, { value: number; count: number }> = {};
  for (const question of refinementQuestions) {
    const choice = refinements[question.key];
    if (!choice || choice === "neutral") continue;
    const current = totals[question.axis] ?? { value: 0, count: 0 };
    current.value += choice === "right" ? 1 : -1;
    current.count += 1;
    totals[question.axis] = current;
  }
  return Object.fromEntries(Object.entries(totals).map(([axis, total]) => [axis, Math.round(50 + (total.value / total.count) * 50)]));
}
