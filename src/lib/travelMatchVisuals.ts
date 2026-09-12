import type { CSSProperties } from "react";

const positions: Record<string, [number, number]> = {
  praia: [0, 0],
  neve: [25, 0],
  parques: [50, 0],
  natureza: [75, 0],
  gastronomia: [100, 0],
  compras: [0, 33.333],
  cultura: [25, 33.333],
  aventura: [50, 33.333],
  all_inclusive: [75, 33.333],
  resort: [100, 33.333],
  cidade: [0, 66.667],
  eventos: [25, 66.667],
  cruzeiro: [50, 66.667],
  familia: [75, 66.667],
  casal: [100, 66.667],
  solo: [0, 100],
  vida_noturna: [25, 100],
  bem_estar: [50, 100],
  sustentabilidade: [75, 100],
  experiencias_locais: [100, 100],
};

export type TravelMatchVisualKey = keyof typeof positions;

export function travelMatchVisualStyle(key: string): CSSProperties {
  const [x, y] = positions[key] ?? positions.praia;
  return {
    backgroundImage: "url('/travel-match/generated-sprite.jpg')",
    backgroundRepeat: "no-repeat",
    backgroundSize: "500% 400%",
    backgroundPosition: `${x}% ${y}%`,
  };
}
