import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { deleteMyRadar, getMyRadar, setMyRadarStatus, updateMyRadar, type TravelRadar } from "@/lib/myTomorrowRadars";

export default function MyTomorrowRadarDetail() {
  const { radarId = "" } = useParams();
  const navigate = useNavigate();
  const [radar, setRadar] = useState<TravelRadar | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", origin: "", destination: "", startDate: "", endDate: "", flexibility: "0", minNights: "", maxNights: "", passengers: "", budgetMin: "", budgetMax: "", category: "" });

  useEffect(() => {
    void (async () => {
      try {
        const item = await getMyRadar(radarId);
        setRadar(item);
        setForm({
          name: item.name,
          origin: item.origin || "",
          destination: item.destination || "",
          startDate: item.start_date || "",
          endDate: item.end_date || "",
          flexibility: String(item.flexibility_days || 0),
          minNights: item.min_nights ? String(item.min_nights) : "",
          maxNights: item.max_nights ? String(item.max_nights) : "",
          passengers: item.passengers ? String(item.passengers) : "",
          budgetMin: item.budget_min != null ? String(item.budget_min) : "",
          budgetMax: item.budget_max != null ? String(item.budget_max) : "",
          category: item.category || "",
        });
      } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível carregar o radar."); }
      finally { setLoading(false); }
    })();
  }, [radarId]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      const updated = await updateMyRadar(radarId, {
        name: form.name,
        origin: form.origin || null,
        destination: form.destination || null,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        flexibility_days: Number(form.flexibility || 0),
        min_nights: form.minNights ? Number(form.minNights) : null,
        max_nights: form.maxNights ? Number(form.maxNights) : null,
        passengers: form.passengers ? Number(form.passengers) : null,
        budget_min: form.budgetMin ? Number(form.budgetMin) : null,
        budget_max: form.budgetMax ? Number(form.budgetMax) : null,
        category: form.category || null,
      });
      setRadar(updated);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar o radar."); }
    finally { setSaving(false); }
  };

  const toggle = async () => {
    if (!radar) return;
    const updated = await setMyRadarStatus(radar.id, radar.status === "active" ? "pause" : "resume");
    setRadar(updated);
  };

  const remove = async () => {
    await deleteMyRadar(radarId);
    navigate("/minha-area/radares", { replace: true });
  };

  return <div className="min-h-screen bg-[#041012] text-white"><Header />
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <Link to="/minha-area/radares" className="inline-flex items-center gap-2 text-sm text-white/55"><ArrowLeft className="size-4"/>Voltar aos radares</Link>
      {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="size-6 animate-spin text-cyan-300"/></div> : null}
      {error ? <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">{error}</div> : null}
      {radar ? <>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Radar Tomorrow</p><h1 className="mt-2 font-serif text-4xl">{radar.name}</h1><p className="mt-2 text-sm text-white/50">{radar.status === "active" ? "Monitorando" : radar.status === "paused" ? "Pausado" : "Arquivado"} · origem {radar.source === "catalog" ? "catálogo" : "manual"}</p></div><div className="flex gap-2"><button onClick={()=>void toggle()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm">{radar.status === "active" ? <Pause className="size-4"/> : <Play className="size-4"/>}{radar.status === "active" ? "Pausar" : "Reativar"}</button><button onClick={()=>void remove()} className="inline-flex items-center gap-2 rounded-xl border border-red-300/15 px-4 py-2 text-sm text-red-200"><Trash2 className="size-4"/>Excluir</button></div></div>
        <form onSubmit={save} className="mt-8 grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 sm:grid-cols-2">
          <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 sm:col-span-2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nome do radar"/>
          <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})} placeholder="Origem"/>
          <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} placeholder="Destino"/>
          <input type="date" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/>
          <input type="date" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/>
          <input type="number" min="0" max="60" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.flexibility} onChange={e=>setForm({...form,flexibility:e.target.value})} placeholder="Flexibilidade em dias"/>
          <input type="number" min="1" max="20" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.passengers} onChange={e=>setForm({...form,passengers:e.target.value})} placeholder="Passageiros"/>
          <input type="number" min="1" max="60" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.minNights} onChange={e=>setForm({...form,minNights:e.target.value})} placeholder="Mínimo de noites"/>
          <input type="number" min="1" max="60" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.maxNights} onChange={e=>setForm({...form,maxNights:e.target.value})} placeholder="Máximo de noites"/>
          <input type="number" min="0" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.budgetMin} onChange={e=>setForm({...form,budgetMin:e.target.value})} placeholder="Orçamento mínimo"/>
          <input type="number" min="0" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.budgetMax} onChange={e=>setForm({...form,budgetMax:e.target.value})} placeholder="Orçamento máximo"/>
          <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 sm:col-span-2" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Categoria"/>
          <div className="sm:col-span-2"><button disabled={saving} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#041012] disabled:opacity-50">{saving ? "Salvando..." : "Salvar alterações"}</button></div>
        </form>
        <div className="mt-5 rounded-xl border border-white/10 p-4 text-xs text-white/45">Matching e alertas ainda não estão ativos nesta fase. Este radar apenas registra com precisão o que deve ser monitorado.</div>
      </> : null}
    </main>
  </div>;
}
