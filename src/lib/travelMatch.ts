import { getTravelProfile, updateTravelProfile } from "@/lib/myTomorrowProfile";

export const travelMatchCategories = [
  ["praia", "Praia", "Sol, mar e dias perto da água"],
  ["neve", "Neve", "Frio, montanhas e experiências de inverno"],
  ["parques", "Parques", "Diversão, atrações e experiências em família"],
  ["cidade", "Cidade", "Arquitetura, bairros e vida urbana"],
  ["natureza", "Natureza", "Paisagens, trilhas e contato com o natural"],
  ["gastronomia", "Gastronomia", "Sabores, restaurantes e experiências locais"],
  ["compras", "Compras", "Outlets, lojas e achados de viagem"],
  ["aventura", "Aventura", "Atividades intensas e experiências fora da rotina"],
  ["resort", "Resort", "Estrutura completa para descansar"],
  ["all_inclusive", "All inclusive", "Tudo organizado em um só lugar"],
  ["cruzeiro", "Cruzeiro", "Vários destinos em uma única viagem"],
  ["eventos", "Eventos", "Shows, festivais e datas especiais"],
  ["cultura", "Cultura", "História, arte e experiências locais"],
  ["vida_noturna", "Vida noturna", "Bares, festas e cidades que seguem acordadas"],
  ["familia", "Família", "Viagens pensadas para viver junto"],
  ["casal", "Casal", "Experiências para dois"],
] as const;

export async function resolveMyTomorrowEntry() {
  const state = await getTravelProfile();
  return state.profile?.onboarding_completed_at ? "/minha-area" : "/minha-area/boas-vindas";
}

export async function completeTravelMatch() {
  await updateTravelProfile({ onboardingCompleted: true });
}
