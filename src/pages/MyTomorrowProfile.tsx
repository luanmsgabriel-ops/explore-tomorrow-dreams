import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Save, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { getTravelProfile, updateTravelProfile, type DirectFlightPreference } from "@/lib/myTomorrowProfile";

const lodgingOptions = ["hotel", "resort", "pousada", "apartamento", "all_inclusive"];

export default function MyTomorrowProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [homeOriginName, setHomeOriginName] = useState("");
  const [homeOriginIata, setHomeOriginIata] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [directFlightPreference, setDirectFlightPreference] = useState<DirectFlightPreference>("neutral");
  const [lodgingPreferences, setLodgingPreferences] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const state = await getTravelProfile();
        if (!active || !state.profile) return;
        setHomeOriginName(state.profile.home_origin_name ?? "");
        setHomeOriginIata(state.profile.home_origin_iata ?? "");
        setBudgetMin(state.profile.budget_min === null ? "" : String(state.profile.budget_min));
        setBudgetMax(state.profile.budget_max === null ? "" : String(state.profile.budget_max));
        setDirectFlightPreference(state.profile.direct_flight_preference);
        setLodgingPreferences(state.profile.lodging_preferences ?? []);
        const party = state.profile.typical_party ?? {};
        if (typeof party.adults === "number") setAdults(String(party.adults));
        if (typeof party.children === "number") setChildren(String(party.children));
      } catch {
        toast.error("O Travel Profile ainda depende da migration e da Edge Function da Fase 3.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const toggleLodging = (value: string) => {
    setLodgingPreferences((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateTravelProfile({
        homeOriginName,
        homeOriginIata,
        typicalParty: { adults: Math.max(1, Number(adults) || 1), children: Math.max(0, Number(children) || 0) },
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        budgetCurrency: "BRL",
        directFlightPreference,
        lodgingPreferences,
        onboardingCompleted: true,
      });
      toast.success("Perfil de viagem salvo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#041012] text-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6">
        <Link to="/minha-area" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><ArrowLeft className="size-4" />Voltar ao My Tomorrow</Link>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Travel Profile</p><h1 className="mt-2 font-serif text-3xl sm:text-4xl">Como você costuma viajar</h1><p className="mt-2 max-w-2xl text-sm text-white/55">Dados explícitos que você controla. Eles ajudam a preparar viagens futuras sem substituir os filtros que você escolher em cada viagem.</p></div>
          <Link to="/minha-area/preferencias" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold"><SlidersHorizontal className="size-4" />Preferências</Link>
        </div>

        {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="size-7 animate-spin text-cyan-300" /></div> : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
              <h2 className="font-serif text-xl">Origem e grupo habitual</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-white/65">Cidade/aeroporto habitual<input value={homeOriginName} onChange={(e) => setHomeOriginName(e.target.value)} placeholder="Ex.: São Paulo" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300/50" /></label>
                <label className="text-sm text-white/65">IATA<input value={homeOriginIata} onChange={(e) => setHomeOriginIata(e.target.value.toUpperCase().slice(0, 3))} placeholder="GRU" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 uppercase text-white outline-none focus:border-cyan-300/50" /></label>
                <label className="text-sm text-white/65">Adultos<input type="number" min="1" max="20" value={adults} onChange={(e) => setAdults(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" /></label>
                <label className="text-sm text-white/65">Crianças<input type="number" min="0" max="20" value={children} onChange={(e) => setChildren(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" /></label>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
              <h2 className="font-serif text-xl">Faixa de orçamento habitual</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-white/65">Mínimo (R$)<input type="number" min="0" step="0.01" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" /></label>
                <label className="text-sm text-white/65">Máximo (R$)<input type="number" min="0" step="0.01" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" /></label>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
              <h2 className="font-serif text-xl">Preferências operacionais</h2>
              <label className="mt-5 block text-sm text-white/65">Voos<select value={directFlightPreference} onChange={(e) => setDirectFlightPreference(e.target.value as DirectFlightPreference)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#071719] px-4 py-3 text-white outline-none"><option value="prefer_direct">Prefiro voo direto</option><option value="neutral">Tanto faz</option><option value="accept_connections">Aceito conexões</option></select></label>
              <div className="mt-5"><p className="text-sm text-white/65">Hospedagens que você costuma considerar</p><div className="mt-3 flex flex-wrap gap-2">{lodgingOptions.map((option) => <button key={option} type="button" onClick={() => toggleLodging(option)} className={`rounded-full border px-3 py-2 text-xs font-medium transition ${lodgingPreferences.includes(option) ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/[0.03] text-white/55"}`}>{option.replace("_", " ")}</button>)}</div></div>
            </section>

            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3.5 text-sm font-semibold text-[#041012] disabled:opacity-50 sm:w-auto"><Save className="size-4" />{saving ? "Salvando..." : "Salvar Travel Profile"}</button>
          </form>
        )}
      </main>
    </div>
  );
}
