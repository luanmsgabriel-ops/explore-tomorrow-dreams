import type { RealtimeVoiceStatus } from "@/lib/realtimeVoice";

export type LiveJourneyStage =
  | "ready"
  | "connecting"
  | "conversation"
  | "searching"
  | "reviewing"
  | "planning"
  | "handoff"
  | "offline"
  | "error";

export type LiveSessionTone = "neutral" | "active" | "success" | "warning" | "danger";

export type LiveSessionSnapshot = {
  stage: LiveJourneyStage;
  label: string;
  detail: string;
  nextAction: string;
  tone: LiveSessionTone;
  progress: number;
};

export type LiveSessionInput = {
  status: RealtimeVoiceStatus;
  connected: boolean;
  online: boolean;
  offerCount: number;
  handoffReady: boolean;
  tripComposerActive: boolean;
  hasError: boolean;
};

export function deriveLiveSessionSnapshot(input: LiveSessionInput): LiveSessionSnapshot {
  if (!input.online) {
    return {
      stage: "offline",
      label: "Sem conexão",
      detail: "O Tomorrow Live precisa de internet para consultar dados reais e manter a voz ativa.",
      nextAction: "Reconecte-se antes de iniciar ou continuar a conversa.",
      tone: "warning",
      progress: 0,
    };
  }

  if (input.hasError || input.status === "error") {
    return {
      stage: "error",
      label: "Sessão interrompida",
      detail: "A conversa encontrou uma falha, mas o catálogo e o atendimento por texto continuam disponíveis.",
      nextAction: "Tente novamente ou use o modo texto.",
      tone: "danger",
      progress: 0,
    };
  }

  if (input.handoffReady) {
    return {
      stage: "handoff",
      label: "Escolha pronta",
      detail: "A oportunidade selecionada está preparada para detalhes ou atendimento.",
      nextAction: "Conclua no canal solicitado ou continue comparando.",
      tone: "success",
      progress: 100,
    };
  }

  if (input.tripComposerActive) {
    return {
      stage: "planning",
      label: "Roteiro em construção",
      detail: "O Trip Composer está organizando experiências reais por dia e janela de tempo.",
      nextAction: "Escolha uma experiência ou retome a conversa para refinar o dia.",
      tone: "active",
      progress: 75,
    };
  }

  if (input.offerCount > 0 || input.status === "offers") {
    return {
      stage: "reviewing",
      label: input.offerCount === 1 ? "1 oportunidade encontrada" : `${input.offerCount} oportunidades encontradas`,
      detail: "As opções exibidas vieram do inventário público validado da Tomorrow Travel.",
      nextAction: "Compare, escolha uma opção ou peça outro destino ao Téo.",
      tone: "success",
      progress: 70,
    };
  }

  if (input.status === "thinking") {
    return {
      stage: "searching",
      label: "Téo está analisando",
      detail: "A intenção da viagem está sendo interpretada antes da próxima resposta ou consulta.",
      nextAction: "Aguarde a resposta ou interrompa naturalmente para acrescentar um critério.",
      tone: "active",
      progress: 45,
    };
  }

  if (input.status === "connecting") {
    return {
      stage: "connecting",
      label: "Conectando voz",
      detail: "O canal seguro de áudio e eventos está sendo preparado.",
      nextAction: "Mantenha esta aba aberta até a conexão concluir.",
      tone: "active",
      progress: 20,
    };
  }

  if (input.connected || input.status === "listening" || input.status === "speaking") {
    const listening = input.status === "listening";
    const speaking = input.status === "speaking";
    return {
      stage: "conversation",
      label: listening ? "Ouvindo você" : speaking ? "Téo está falando" : "Conversa ativa",
      detail: listening
        ? "Fale normalmente; você pode pausar o microfone a qualquer momento."
        : speaking
          ? "Você pode interromper o Téo naturalmente para ajustar a busca."
          : "A sessão está pronta para receber sua próxima preferência.",
      nextAction: listening ? "Informe destino, período, origem e prioridade." : "Continue a conversa quando desejar.",
      tone: "active",
      progress: 35,
    };
  }

  return {
    stage: "ready",
    label: "Pronto para começar",
    detail: "A voz só será ativada após uma ação explícita no microfone.",
    nextAction: "Inicie a conversa ou abra o atendimento por texto.",
    tone: "neutral",
    progress: 0,
  };
}
