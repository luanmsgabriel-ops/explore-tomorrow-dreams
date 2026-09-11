import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Pause, Play, Radar as RadarIcon, RefreshCw, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { listMyRadarMatches, runMyRadarMatching, type RadarMatch } from "@/lib/myTomorrowMatches";
import { deleteMyRadar, getMyRadar, setMyRadarStatus, updateMyRadar, type TravelRadar } from "@/lib/myTomorrowRadars";

const matchLabel = { exact: "Match exato", flexible: "Match flexível", discovery: "Descoberta" } as const;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function MyTomorrowRadarDetail() {
  const { radarId = "" } = useParams();
  const navigate = useNavigate();
  const [radar, setRadar] = useState<TravelRadar | null>(null);
  const [matches, setMatches] = useState<RadarMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchingSummary, setMatchingSummary] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", origin: "", destination: "", startDate: "", endDate: "", flexibility: "0", minNights: "", maxNights: "", passengers: "", budgetMin: "", budgetMax: "", category: "" });

  const loadMatches = async () => {
    try { setMatches(await listMyRadarMatches(radarId)); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível carregar os matches."); }
  };

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
        await loadMatches();
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
      setMatchingSummary("Radar atualizado. Execute uma nova busca para recalcular os matches.");
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

  const runMatching = async () => {
    setMatching(true); setError(null); setMatchingSummary(null);
    try {
      const result = await runMyRadarMatching(radarId);
      setMatchingSummary(`${result.matches} matches: ${result.exact} exatos, ${result.flexible} flexíveis e ${result.discovery} descobertas.`);
      await loadMatches();
      setRadar((current) => current ? { ...current, last_checked_at: result.checked_at } : current);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível atualizar o Radar."); }
    finally { setMatching(false); }
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
          <input type="number" min="0" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.budgetMin} onChange={e=>setForm({...form,budgetMin:e.target.value})} placeholder="Orçamento mínimo por pessoa"/>
          <input type="number" min="0" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3" value={form.budgetMax} onChange={e=>setForm({...form,budgetMax:e.target.value})} placeholder="Orçamento máximo por pessoa"/>
          <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 sm:col-span-2" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Categoria"/>
          <div className="sm:col-span-2"><button disabled={saving} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#041012] disabled:opacity-50">{saving ? "Salvando..." : "Salvar alterações"}</button></div>
        </form>

        <section className="mt-8 rounded-[1.5rem] border border-cyan-300/15 bg-white/[0.035] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><RadarIcon className="size-5 text-cyan-300"/><h2 className="font-serif text-2xl">Oportunidades encontradas</h2></div><p className="mt-2 text-sm text-white/50">Exact, Flexible e Discovery são calculados separadamente pelo algoritmo versionado.</p></div><button disabled={matching || radar.status !== "active"} onClick={()=>void runMatching()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#041012] disabled:opacity-40"><RefreshCw className={`size-4 ${matching ? "animate-spin" : ""}`}/>{matching ? "Buscando..." : "Atualizar Radar"}</button></div>
          {matchingSummary ? <p className="mt-4 rounded-xl bg-cyan-300/5 p-3 text-sm text-cyan-100">{matchingSummary}</p> : null}
          {radar.last_checked_at ? <p className="mt-3 text-xs text-white/35">Última avaliação: {new Date(radar.last_checked_at).toLocaleString("pt-BR")}</p> : null}
          <div className="mt-5 space-y-3">
            {matches.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">Nenhum match ativo. Execute o Radar para consultar o inventário público atual.</div> : matches.map((match) => {
              const offer = match.offer_snapshot;
              const canShowScore = (match.matched_factors.length + match.unmatched_factors.length) >= 3;
              return <article key={match.id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><span className={`text-xs font-semibold uppercase tracking-[0.15em] ${match.match_class === "exact" ? "text-cyan-300" : match.match_class === "flexible" ? "text-[#d4af37]" : "text-violet-300"}`}>{matchLabel[match.match_class]}</span><h3 className="mt-1 text-lg font-semibold">{offer.name || offer.destination || "Oportunidade"}</h3><p className="mt-1 text-sm text-white/50">{offer.origin || "Origem não informada"} → {offer.destination || "Destino não informado"}</p></div><div className="text-left sm:text-right"><p className="text-lg font-semibold text-white">{offer.currency === "BRL" || !offer.currency ? money.format(offer.price_per_person) : `${offer.currency} ${offer.price_per_person.toLocaleString("pt-BR")}`}</p><p className="text-xs text-white/40">por pessoa{canShowScore ? ` · ${Math.round(match.score)}% aderência` : ""}</p></div></div>
                <div className="mt-3 flex flex-wrap gap-2">{match.matched_factors.slice(0,4).map((factor) => <span key={factor.key} className="rounded-full border border-cyan-300/15 bg-cyan-300/5 px-2.5 py-1 text-xs text-cyan-100">✓ {factor.label}</span>)}{match.unmatched_factors.slice(0,2).map((factor) => <span key={factor.key} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/45">{factor.label}</span>)}</div>
                <Link to={`/oportunidades/oferta/${offer.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">Ver oportunidade real <ExternalLink className="size-4"/></Link>
              </article>;
            })}
          </div>
        </section>
      </> : null}
    </main>
  </div>;
}
