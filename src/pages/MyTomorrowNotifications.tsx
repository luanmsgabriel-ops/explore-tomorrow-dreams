import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, ChevronRight, Loader2, Radar } from "lucide-react";

import { Header } from "@/components/Header";
import { listMyRadarAlerts, markAllRadarAlertsRead, markRadarAlertRead, type RadarAlert } from "@/lib/myTomorrowAlerts";

const money = (value: unknown, currency: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: typeof currency === "string" ? currency : "BRL" }).format(amount);
};

export default function MyTomorrowNotifications() {
  const [alerts, setAlerts] = useState<RadarAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setAlerts(await listMyRadarAlerts()); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível carregar seus alertas."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  const unread = useMemo(() => alerts.filter((item) => !item.read_at).length, [alerts]);

  const markOne = async (id: string) => {
    await markRadarAlertRead(id);
    setAlerts((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
  };

  const markAll = async () => {
    await markAllRadarAlertsRead();
    const now = new Date().toISOString();
    setAlerts((current) => current.map((item) => item.read_at ? item : { ...item, read_at: now }));
  };

  return <div className="min-h-screen bg-[#041012] text-white"><Header />
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">My Tomorrow</p><h1 className="mt-2 font-serif text-4xl">Alertas</h1><p className="mt-2 text-sm text-white/55">Novos matches e mudanças relevantes das oportunidades monitoradas.</p></div>
        {unread > 0 ? <button onClick={()=>void markAll()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm"><CheckCheck className="size-4"/>Marcar tudo como lido</button> : null}
      </div>
      {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="size-6 animate-spin text-cyan-300"/></div> : null}
      {error ? <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">{error}</div> : null}
      {!loading && !error && alerts.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center"><Bell className="mx-auto size-6 text-white/35"/><p className="mt-3 text-sm text-white/55">Nenhum alerta ainda.</p></div> : null}
      <div className="mt-8 space-y-3">
        {alerts.map((alert) => {
          const snapshot = alert.offer_snapshot || {};
          const destination = typeof snapshot.destination === "string" ? snapshot.destination : "Oportunidade";
          const price = money(snapshot.price_per_person, snapshot.currency);
          return <article key={alert.id} className={`rounded-2xl border p-5 ${alert.read_at ? "border-white/8 bg-white/[0.025]" : "border-cyan-300/20 bg-cyan-300/[0.055]"}`}>
            <div className="flex items-start gap-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><Radar className="size-5"/></div><div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300">{alert.alert_type === "new_match" ? "Novo match" : "Oferta atualizada"}</span>{alert.match_class ? <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-white/45">{alert.match_class}</span> : null}</div>
              <h2 className="mt-2 font-medium">{destination}</h2><p className="mt-1 text-sm text-white/55">{price ? `${price} por pessoa` : "Preço não informado"}{alert.score != null ? ` · ${Math.round(alert.score)}% de aderência` : ""}</p>
              <div className="mt-4 flex flex-wrap gap-3"><Link onClick={()=>{if(!alert.read_at) void markOne(alert.id);}} to={`/oportunidades/oferta/${alert.offer_id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">Ver oportunidade <ChevronRight className="size-4"/></Link><Link onClick={()=>{if(!alert.read_at) void markOne(alert.id);}} to={`/minha-area/radares/${alert.radar_id}`} className="text-sm text-white/55">Abrir radar</Link>{!alert.read_at ? <button onClick={()=>void markOne(alert.id)} className="text-sm text-white/55">Marcar como lido</button> : null}</div>
            </div></div>
          </article>;
        })}
      </div>
    </main>
  </div>;
}
