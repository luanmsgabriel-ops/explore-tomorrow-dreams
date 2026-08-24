import { describe, expect, it } from "vitest";

import { offerCardImageUrl } from "./offerImages";

describe("offer image urls", () => {
  it("monta somente a URL pública do otimizador para UUID válido", () => {
    const id = "0191a5f2-ccaa-7f03-8f00-1234567890ab";
    expect(offerCardImageUrl(id, "https://project.supabase.co/")).toBe(
      `https://project.supabase.co/functions/v1/travel-offer-image?id=${id}&variant=card`,
    );
  });

  it("não cria URL para identificador inválido", () => {
    expect(offerCardImageUrl("raw_data", "https://project.supabase.co")).toBeNull();
  });
});
