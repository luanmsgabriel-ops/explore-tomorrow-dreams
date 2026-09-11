import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Pause, Play, Plus, Radar, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { createMyRadar, deleteMyRadar, listMyRadars, setMyRadarStatus, type RadarInput, type TravelRadar } from "@/lib/myTomorrowRadars";
import { listMyTomorrowTrips, type MyTomorrowTrip } from "@/lib/myTomorrowTrips";

function num(value: string) { return value.trim() ? Number(value) : undefined; }

export default function MyTomorrowRadars() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [radars, setRadars] = useState<TravelRadar[]>([]);
  const [planningTrips, setPlanningTrips] = useState<MyTomorrowTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showForm = params.get("novo") === "1";

  const initial = useMemo(() => ({
    name: params.get("name") || "",
    tripSessionId: params.get("tripSessionId") || "",
    origin: params.get("origin") || "",
    destination: params.get("destination") || "",
    startDate: params.get("startDate") || "",
    endDate: params.get("endDate") || "",
    flexibility: params.get("flexibility") || "0",
    minNights: params.get("minNights") || "",
    maxNights: params.get("maxNights") || "",
    passengers: params.get("passengers") || "",
    budgetMin: params.get("minPrice") || "",
    budgetMax: params.get("maxPrice") || "",
    offerType: params.get("offerType") || "",
    subtype: params.get("subtype") || "",
    category: params.get("category") || "",
    source: params.get("source") === "catalog" ? "catalog" : "manual",
  }), [params]);
  const [form, setForm] = useState(initial);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [myRadars, trips] = await Promise.all([listMyRadars(), listMyTomorrowTrips()]);
      setRadars(myRadars);
      setPlanningTrips(trips.filter((trip) => trip.kind === "planning" && !["completed", "cancelled"].includes(trip.stage)));
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível carregar seus radares."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      const input: RadarInput = {
        name: form.name.trim() || `Radar ${form.destination || form.origin || "Tomorrow"}`,
        trip_session_id: form.tripSessionId || null,
        origin: form.origin || null,
        destination: form.destination || null,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        flexibility_days: Number(form.flexibility || 0),
        min_nights: num(form.minNights),
        max_nights: num(form.maxNights),
        passengers: num(form.passengers),
        budget_min: num(form.budgetMin),
        budget_max: num(form.budgetMax),
        offer_type: (form.offerType || null) as RadarInput["offer_type"],
        offer_subtype: (form.subtype || null) as RadarInput["offer_subtype"],
        category: form.category || null,
        source: form.source as "manual" | "catalog",
        source_filters: form.source === "catalog" ? { origin: form.origin, destination: form.destination, startDate: form.startDate, endDate: form.endDate, passengers: form.passengers, minPrice: form.budgetMin, maxPrice: form.budgetMax, offerType: form.offerType, subtype: form.subtype, category: form.category } : null,
      };
      const radar = await createMyRadar(input);
      navigate(`/minha-area/radares/${radar.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível criar o radar."); }
    finally { setSaving(false); }
  };

  const statusAction = async (radar: TravelRadar) => {
    const updated = await setMyRadarStatus(radar.id, radar.status === "active" ? "pause" : "resume");
    setRadars((current) => current.map((item) => item.id === updated.id ? updated : item));
  };

  const remove = async (radarId: string) => {
    await deleteMyRadar(radarId);
    setRadars((current) => current.filter((item) => item.id !== radarId));
  };

  return <div className="min-h-screen bg-[#041012] text-white"><Header />
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">My Tomorrow</p><h1 className="mt-2 font-serif text-4xl">Meus radares</h1><p className="mt-2 max-w-2xl text-sm text-white/55">Defina o que você quer monitorar. Matching e alertas entram nas próximas fases.</p></div>
        <Link to="/minha-area/radares?novo=1" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#041012]"><Plus className="size-4" />Criar radar</Link>
      </div>

      {error ? <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">{error}</div> : null}

      {showForm ? <form onSubmit={create} className="mt-6 grid gap-4 rounded-[1.5rem] border border-cyan-300/15 bg-white/[0.035] p-5 sm:grid-cols-2">
        <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 sm:col-span-2" placeholder="Nome do radar" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <select className="rounded-xl border border-white/10 bg-[#07191c] px-3 py-3 sm:col-span-2" value={form.tripSessionId} onChange={e=>setForm({...form,tripSessionId:e.target.value})}><option value="">Sem vínculo com uma viagem</option>{planningTrips.map(trip=><option key={trip.id} value={trip.id}>{trip.destinationName || "Viagem em planejamento"}</option>)}</select>
        <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" placeholder="Origem" value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})}/>
        <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" placeholder="Destino" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})}/>
        <input type="date" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/>
        <input type="date" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/>
        <input type="number" min="0" max="60" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" placeholder="Flexibilidade em dias" value={form.flexibility} onChange={e=>setForm({...form,flexibility:e.target.value})}/>
        <input type="number" min="1" max="20" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" placeholder="Passageiros" value={form.passengers} onChange={e=>setForm({...form,passengers:e.target.value})}/>
        <input type="number" min="1" max="60" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" placeholder="Mínimo de noites" value={form.minNights} onChange={e=>setForm({...form,minNights:e.target.value})}/>
        <input type="number" min="1" max="60" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" placeholder="Máximo de noites" value={form.maxNights} onChange={e=>setForm({...form,maxNights:e.target.value})}/>
        <input type="number" min="0" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" placeholder="Orçamento mínimo" value={form.budgetMin} onChange={e=>setForm({...form,budgetMin:e.target.value})}/>
        <input type="number" min="0" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" placeholder="Orçamento máximo" value={form.budgetMax} onChange={e=>setForm({...form,budgetMax:e.target.value})}/>
        <div className="flex gap-3 sm:col-span-2"><button disabled={saving} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#041012] disabled:opacity-50">{saving ? "Salvando..." : "Ativar radar"}</button><Link to="/minha-area/radares" className="rounded-xl border border-white/10 px-5 py-3 text-sm">Cancelar</Link></div>
      </form> : null}

      {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="size-6 animate-spin text-cyan-300" /></div> : null}
      {!loading && radars.length === 0 ? <div className="mt-8 rounded-[1.5rem] border border-dashed border-white/10 p-8 text-center text-white/55"><Radar className="mx-auto mb-3 size-7 text-cyan-300" />Nenhum radar cadastrado ainda.</div> : null}
      <div className="mt-8 grid gap-4 md:grid-cols-2">{radars.map(radar => <article key={radar.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-start justify-between gap-4"><div><span className={`text-xs font-semibold uppercase tracking-[0.14em] ${radar.status === "active" ? "text-cyan-300" : "text-white/40"}`}>{radar.status === "active" ? "Monitorando" : radar.status === "paused" ? "Pausado" : "Arquivado"}</span><h2 className="mt-2 font-serif text-2xl">{radar.name}</h2><p className="mt-2 text-sm text-white/55">{radar.origin || "Origem aberta"} → {radar.destination || "Destino aberto"}</p></div><Radar className="size-5 text-cyan-300" /></div>
        <div className="mt-4 text-xs text-white/45">{radar.start_date || "Data inicial aberta"} · {radar.end_date || "Data final aberta"}{radar.trip_session_id ? " · vinculado a uma viagem" : ""}</div>
        <div className="mt-5 flex flex-wrap gap-2"><Link to={`/minha-area/radares/${radar.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold">Detalhes</Link><button onClick={()=>void statusAction(radar)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs">{radar.status === "active" ? <Pause className="size-3"/> : <Play className="size-3"/>}{radar.status === "active" ? "Pausar" : "Reativar"}</button><button onClick={()=>void remove(radar.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-300/15 px-3 py-2 text-xs text-red-200"><Trash2 className="size-3"/>Excluir</button></div>
      </article>)}</div>
    </main>
  </div>;
}
