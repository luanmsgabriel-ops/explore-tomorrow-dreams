import { Radar } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { readCatalogRadarDraft } from "./catalogFilterState";

export function SaveCatalogRadarButton() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname !== "/oportunidades/catalogo") return null;

  const save = () => {
    const draft = readCatalogRadarDraft();
    const params = new URLSearchParams({ novo: "1", source: "catalog" });
    if (draft) {
      if (draft.origin) params.set("origin", draft.origin);
      if (draft.destination) params.set("destination", draft.destination);
      if (draft.startDate) params.set("startDate", draft.startDate);
      if (draft.endDate) params.set("endDate", draft.endDate);
      if (draft.passengers) params.set("passengers", draft.passengers);
      if (draft.minPrice) params.set("minPrice", draft.minPrice);
      if (draft.maxPrice) params.set("maxPrice", draft.maxPrice);
      if (draft.offerType) params.set("offerType", draft.offerType);
      if (draft.subtype) params.set("subtype", draft.subtype);
      if (draft.category) params.set("category", draft.category);
      const destination = draft.destination || draft.search;
      if (destination) params.set("name", `Radar ${destination}`);
    }
    navigate(`/minha-area/radares?${params.toString()}`);
  };

  return <button type="button" onClick={save} className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-[#072327]/95 px-4 py-3 text-sm font-semibold text-cyan-200 shadow-2xl backdrop-blur transition hover:bg-[#0a3035]" aria-label="Salvar esta busca como Radar Tomorrow"><Radar className="size-4" />Salvar busca como radar</button>;
}
