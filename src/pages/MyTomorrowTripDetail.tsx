import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Loader2, Plane, Save, UsersRound, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { listMyTomorrowTrips, updatePlanningTrip, type PlanningTrip } from "@/lib/myTomorrowTrips";

export default function MyTomorrowTripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<PlanningTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [destinationName, setDestinationName] = useState("");
  const [originName, setOriginName] = useState("");
  const [originIata, setOriginIata] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stage, setStage] = useState<"dreaming" | "researching" | "planning">("planning");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const found = (await listMyTomorrowTrips()).find((item) => item.kind === "planning" && item.id === tripId);
        if (!active) return;
        if (!found || found.kind !== "planning") {
          toast.error("Viagem de planejamento não encontrada.");
          navigate("/minha-area/viagens", { replace: true });
          return;
        }
        setTrip(found);
        setDestinationName(found.destinationName || "");
        setOriginName(found.originName || "");
        setOriginIata(found.originIata || "");
        setStartDate(found.startDate || "");
        setEndDate(found.endDate || "");
        setStage(["dreaming", "researching", "planning"].includes(found.stage) ? found.stage as typeof stage : "planning");
        setAdults(Number(found.passengers.adults || 1));
        setChildren(Number(found.passengers.children || 0));
        setBudgetMin(found.budgetMin === null ? "" : String(found.budgetMin));
        setBudgetMax(found.budgetMax === null ? "" : String(found.budgetMax));
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível carregar esta viagem.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [navigate, tripId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!tripId) return;
    setSaving(true);
    try {
      const updated = await updatePlanningTrip(tripId, {
        destinationName,
        originName,
        originIata,
        startDate,
        endDate,
        stage,
        passengerComposition: { adults, children },
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        budgetCurrency: "BRL",
      });
      if (updated.kind === "planning") setTrip(updated);
      toast.success("Viagem atualizada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a viagem.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#041012] grid place-items-center"><Loader2 className="size-7 animate-spin text-cyan-300" /></div>;
  if (!trip) return null;

  return (
    <div className="min-h-screen bg-[#041012] text-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6">
        <Link to="/minha-area/viagens" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"><ArrowLeft className="size-4" />Minhas viagens</Link>
        <div className="mt-6 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(27,184,190,0.12),transparent_38%),rgba(255,255,255,0.03)] p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Viagem em planejamento</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{trip.destinationName || "Destino em aberto"}</h1>
          <p className="mt-2 text-sm text-white/50">Edite somente o que você já decidiu. Campos em aberto continuam em aberto.</p>

          <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="text-sm text-white/70">Destino<input value={destinationName} onChange={(e) => setDestinationName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white outline-none focus:border-cyan-300/40" /></label>
            <label className="text-sm text-white/70">Estágio<select value={stage} onChange={(e) => setStage(e.target.value as typeof stage)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#07191c] px-3 py-3 text-white"><option value="dreaming">Sonhando</option><option value="researching">Pesquisando</option><option value="planning">Planejando</option></select></label>
            <label className="text-sm text-white/70">Origem<input value={originName} onChange={(e) => setOriginName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white outline-none focus:border-cyan-300/40" /></label>
            <label className="text-sm text-white/70">Aeroporto de origem<input value={originIata} onChange={(e) => setOriginIata(e.target.value.slice(0, 3).toUpperCase())} maxLength={3} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 uppercase text-white outline-none focus:border-cyan-300/40" /></label>
            <label className="text-sm text-white/70">Data inicial<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label>
            <label className="text-sm text-white/70">Data final<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label>
            <div className="grid grid-cols-2 gap-3"><label className="text-sm text-white/70">Adultos<input type="number" min={1} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label><label className="text-sm text-white/70">Crianças<input type="number" min={0} value={children} onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label></div>
            <div className="grid grid-cols-2 gap-3"><label className="text-sm text-white/70">Orçamento mínimo<input type="number" min={0} step="0.01" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label><label className="text-sm text-white/70">Orçamento máximo<input type="number" min={0} step="0.01" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label></div>
            <div className="sm:col-span-2 grid gap-3 rounded-2xl border border-white/8 bg-black/15 p-4 sm:grid-cols-3">
              <div className="flex items-center gap-3"><CalendarDays className="size-4 text-cyan-300" /><div><p className="text-[11px] uppercase tracking-wider text-white/35">Período</p><p className="text-sm">{startDate || "Em aberto"} → {endDate || "Em aberto"}</p></div></div>
              <div className="flex items-center gap-3"><UsersRound className="size-4 text-cyan-300" /><div><p className="text-[11px] uppercase tracking-wider text-white/35">Viajantes</p><p className="text-sm">{adults} adulto(s) · {children} criança(s)</p></div></div>
              <div className="flex items-center gap-3"><WalletCards className="size-4 text-[#d4af37]" /><div><p className="text-[11px] uppercase tracking-wider text-white/35">Orçamento</p><p className="text-sm">{budgetMax ? `Até R$ ${Number(budgetMax).toLocaleString("pt-BR")}` : "Em aberto"}</p></div></div>
            </div>
            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Link to="/oportunidades/catalogo" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5"><Plane className="size-4" />Explorar oportunidades</Link>
              <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#041012] disabled:opacity-60">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Salvar alterações</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
