import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, ChevronRight, Compass, Loader2, Plus, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { createPlanningTrip, listMyTomorrowTrips, type MyTomorrowStage, type MyTomorrowTrip } from "@/lib/myTomorrowTrips";

const stageLabel: Record<MyTomorrowStage, string> = {
  dreaming: "Sonhando",
  researching: "Pesquisando",
  planning: "Planejando",
  monitoring: "Monitorando",
  ready_to_buy: "Pronta para comprar",
  booked: "Contratada",
  traveling: "Viajando",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const formatDate = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`))
  : "Data em aberto";

export default function MyTomorrowTrips() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<MyTomorrowTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [destinationName, setDestinationName] = useState("");
  const [originName, setOriginName] = useState("");
  const [originIata, setOriginIata] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stage, setStage] = useState<"dreaming" | "researching" | "planning">("dreaming");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [budgetMax, setBudgetMax] = useState("");
  const creating = searchParams.get("nova") === "1";

  const load = async () => {
    setLoading(true);
    try {
      setTrips(await listMyTomorrowTrips());
    } catch (error) {
      console.error(error);
      toast.error("A camada de viagens ainda depende da migration acumulada.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const grouped = useMemo(() => ({
    active: trips.filter((trip) => !["completed", "cancelled"].includes(trip.stage)),
    history: trips.filter((trip) => ["completed", "cancelled"].includes(trip.stage)),
  }), [trips]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (startDate && endDate && startDate > endDate) throw new Error("A data final deve ser posterior à inicial.");
      const created = await createPlanningTrip({
        destinationName,
        originName,
        originIata,
        startDate,
        endDate,
        stage,
        passengerComposition: { adults, children },
        budgetMax: budgetMax ? Number(budgetMax) : null,
        budgetCurrency: "BRL",
      });
      toast.success("Viagem criada no My Tomorrow.");
      navigate(`/minha-area/viagens/${created.id}?tipo=planning`, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a viagem.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#041012] text-white">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><Link to="/minha-area" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"><ArrowLeft className="size-4" />My Tomorrow</Link><p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Ciclo de viagens</p><h1 className="mt-2 font-serif text-3xl sm:text-4xl">Minhas viagens</h1><p className="mt-2 max-w-xl text-sm text-white/55">Da primeira ideia até o pós-viagem, sem misturar planejamento pessoal com os registros operacionais já contratados.</p></div>
          <button onClick={() => setSearchParams({ nova: "1" })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#041012]"><Plus className="size-4" />Nova viagem</button>
        </div>

        {creating ? (
          <section className="mt-8 rounded-[1.75rem] border border-cyan-300/20 bg-cyan-300/[0.04] p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Nova viagem</p><h2 className="mt-1 font-serif text-2xl">Registre a intenção sem precisar ter comprado</h2></div><button className="text-sm text-white/45" onClick={() => setSearchParams({})}>Fechar</button></div>
            <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-white/70">Destino<input value={destinationName} onChange={(e) => setDestinationName(e.target.value)} placeholder="Ex.: Santiago" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white outline-none focus:border-cyan-300/40" /></label>
              <label className="text-sm text-white/70">Estágio<select value={stage} onChange={(e) => setStage(e.target.value as typeof stage)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#07191c] px-3 py-3 text-white"><option value="dreaming">Sonhando</option><option value="researching">Pesquisando</option><option value="planning">Planejando</option></select></label>
              <label className="text-sm text-white/70">Origem<input value={originName} onChange={(e) => setOriginName(e.target.value)} placeholder="Ex.: São Paulo" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white outline-none focus:border-cyan-300/40" /></label>
              <label className="text-sm text-white/70">Aeroporto de origem<input value={originIata} onChange={(e) => setOriginIata(e.target.value.slice(0, 3).toUpperCase())} placeholder="GRU" maxLength={3} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 uppercase text-white outline-none focus:border-cyan-300/40" /></label>
              <label className="text-sm text-white/70">Início<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label>
              <label className="text-sm text-white/70">Fim<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm text-white/70">Adultos<input type="number" min={1} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label><label className="text-sm text-white/70">Crianças<input type="number" min={0} value={children} onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label></div>
              <label className="text-sm text-white/70">Orçamento máximo<input type="number" min={0} step="0.01" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="R$" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-white" /></label>
              <div className="sm:col-span-2 flex justify-end"><button disabled={saving} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#041012] disabled:opacity-60">{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Criar viagem</button></div>
            </form>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">Ativas</h2><span className="text-xs text-white/40">{grouped.active.length} viagem(ns)</span></div>
          {loading ? <div className="grid min-h-40 place-items-center"><Loader2 className="size-6 animate-spin text-cyan-300" /></div> : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {grouped.active.map((trip) => <TripCard key={`${trip.kind}-${trip.id}`} trip={trip} />)}
              {grouped.active.length === 0 ? <div className="md:col-span-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/45">Nenhuma viagem ativa ainda.</div> : null}
            </div>
          )}
        </section>

        {grouped.history.length > 0 ? <section className="mt-10"><h2 className="font-serif text-2xl">Histórico</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{grouped.history.map((trip) => <TripCard key={`${trip.kind}-${trip.id}`} trip={trip} />)}</div></section> : null}
      </main>
    </div>
  );
}

function TripCard({ trip }: { trip: MyTomorrowTrip }) {
  const planning = trip.kind === "planning";
  const href = planning ? `/minha-area/viagens/${trip.id}?tipo=planning` : "/minha-area/operacional";
  return <Link to={href} className="group rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.035]">
    <div className="flex items-start justify-between gap-4"><div className="grid size-11 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300">{planning ? <Compass className="size-5" /> : <CalendarDays className="size-5" />}</div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">{stageLabel[trip.stage]}</span></div>
    <h3 className="mt-5 font-serif text-2xl">{trip.destinationName || "Destino em aberto"}</h3>
    <p className="mt-2 text-sm text-white/50">{formatDate(trip.startDate)} · {formatDate(trip.endDate)}</p>
    {planning && trip.budgetMax !== null ? <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/60"><WalletCards className="size-4 text-[#d4af37]" />Até {new Intl.NumberFormat("pt-BR", { style: "currency", currency: trip.budgetCurrency }).format(trip.budgetMax)}</p> : null}
    <div className="mt-5 flex items-center justify-between text-sm font-medium text-cyan-300"><span>{planning ? "Abrir planejamento" : "Abrir viagem contratada"}</span><ChevronRight className="size-4 transition group-hover:translate-x-1" /></div>
  </Link>;
}
