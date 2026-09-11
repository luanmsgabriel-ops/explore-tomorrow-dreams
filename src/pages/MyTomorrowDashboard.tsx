import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, ChevronRight, Compass, Loader2, MapPinned, PlaneTakeoff, Plus, Radar, SlidersHorizontal, Sparkles, UserRound } from "lucide-react";

import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { countUnreadRadarAlerts } from "@/lib/myTomorrowAlerts";
import { listMyTomorrowTrips, type MyTomorrowStage, type MyTomorrowTrip } from "@/lib/myTomorrowTrips";

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

function formatDate(value: string | null | undefined) {
  if (!value) return "Data em aberto";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export default function MyTomorrowDashboard() {
  const [name, setName] = useState("");
  const [trips, setTrips] = useState<MyTomorrowTrip[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const [{ data: profile }, allTrips, unread] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("user_id", session.user.id).maybeSingle(),
          listMyTomorrowTrips(),
          countUnreadRadarAlerts().catch(() => 0),
        ]);
        if (!active) return;
        setName(profile?.full_name || "Viajante");
        setTrips(allTrips);
        setUnreadAlerts(unread);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar suas viagens.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const activeTrips = useMemo(() => trips.filter((trip) => !["completed", "cancelled"].includes(trip.stage)), [trips]);
  const nextBooked = useMemo(() => activeTrips.find((trip) => trip.kind === "booked"), [activeTrips]);
  const planning = useMemo(() => activeTrips.filter((trip) => trip.kind === "planning").slice(0, 3), [activeTrips]);

  return (
    <div className="min-h-screen bg-[#041012] text-white">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(27,184,190,0.16),transparent_42%),linear-gradient(135deg,rgba(7,35,39,0.98),rgba(3,15,17,0.98))] p-6 sm:p-8">
          <div className="absolute right-[-4rem] top-[-5rem] h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">My Tomorrow</p>
            <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-5xl">Seu próximo amanhã começa aqui, {name || "Viajante"}.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">Organize viagens que ainda são ideia, acompanhe as que estão em planejamento e mantenha suas viagens contratadas no mesmo lugar.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/minha-area/viagens?nova=1" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#041012] transition hover:bg-cyan-200"><Plus className="size-4" />Criar viagem</Link>
              <Link to="/minha-area/radares" className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/15"><Radar className="size-4" />Meus radares</Link>
              <Link to="/minha-area/notificacoes" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Bell className="size-4" />Alertas{unreadAlerts > 0 ? ` (${unreadAlerts})` : ""}</Link>
              <Link to="/minha-area/viagens" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><MapPinned className="size-4" />Ver minhas viagens</Link>
              <Link to="/minha-area/perfil" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><UserRound className="size-4" />Travel Profile</Link>
            </div>
          </div>
        </section>

        {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="size-7 animate-spin text-cyan-300" /></div> : null}
        {!loading && error ? <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm text-amber-100">Não foi possível carregar sua central de viagens agora. Seus módulos operacionais permanecem preservados.</div> : null}

        {!loading && !error ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-xs uppercase tracking-[0.18em] text-white/45">Em movimento</p><h2 className="mt-1 font-serif text-2xl">Viagens em planejamento</h2></div>
                <Link to="/minha-area/viagens" className="text-sm font-medium text-cyan-300">Ver todas</Link>
              </div>
              <div className="mt-5 space-y-3">
                {planning.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/55">Você ainda não criou uma viagem antes da compra.</div>
                ) : planning.map((trip) => (
                  <Link key={trip.id} to={`/minha-area/viagens/${trip.id}?tipo=planning`} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-black/15 p-4 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.04]">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><Compass className="size-5" /></div>
                    <div className="min-w-0 flex-1"><p className="truncate font-medium">{trip.destinationName || "Destino em aberto"}</p><p className="mt-1 text-xs text-white/50">{stageLabel[trip.stage]} · {formatDate(trip.startDate)}</p></div>
                    <ChevronRight className="size-4 text-white/35" />
                  </Link>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-[1.75rem] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(41,203,210,0.08),rgba(255,255,255,0.025))] p-5 sm:p-6">
                <div className="flex items-center gap-3"><Radar className="size-5 text-cyan-300" /><h2 className="font-serif text-xl">Radar Tomorrow</h2></div>
                <p className="mt-3 text-sm leading-relaxed text-white/55">Cadastre uma intenção de viagem, edite os critérios e pause ou reative o monitoramento quando quiser.</p>
                <Link to="/minha-area/radares" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">Abrir meus radares <ChevronRight className="size-4" /></Link>
              </section>

              <section className="rounded-[1.75rem] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(41,203,210,0.07),rgba(255,255,255,0.025))] p-5 sm:p-6">
                <div className="flex items-center gap-3"><Bell className="size-5 text-cyan-300" /><h2 className="font-serif text-xl">Alertas do Radar</h2>{unreadAlerts > 0 ? <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-xs font-semibold text-[#041012]">{unreadAlerts}</span> : null}</div>
                <p className="mt-3 text-sm leading-relaxed text-white/55">Novos matches e mudanças relevantes aparecem aqui sem depender de e-mail ou WhatsApp.</p>
                <Link to="/minha-area/notificacoes" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">Abrir alertas <ChevronRight className="size-4" /></Link>
              </section>

              <section className="rounded-[1.75rem] border border-[#d4af37]/20 bg-[linear-gradient(145deg,rgba(212,175,55,0.08),rgba(255,255,255,0.025))] p-5 sm:p-6">
                <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]"><PlaneTakeoff className="size-5" /></div><div><p className="text-xs uppercase tracking-[0.18em] text-white/45">Próxima contratada</p><h2 className="font-serif text-xl">{nextBooked?.destinationName || "Nenhuma próxima viagem"}</h2></div></div>
                {nextBooked ? <><p className="mt-4 text-sm text-white/60">{formatDate(nextBooked.startDate)} até {formatDate(nextBooked.endDate)}</p><Link to="/minha-area/operacional" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#d4af37]">Abrir documentos e detalhes <ChevronRight className="size-4" /></Link></> : <p className="mt-4 text-sm text-white/55">Quando uma viagem for contratada, os módulos de aéreo, hospedagem, vouchers e checklist aparecerão aqui.</p>}
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                <div className="flex items-center gap-3"><SlidersHorizontal className="size-5 text-cyan-300" /><h2 className="font-serif text-xl">Preferências de viagem</h2></div>
                <p className="mt-3 text-sm leading-relaxed text-white/55">Registre o que você quer, gosta ou prefere evitar. Você pode editar ou resetar tudo depois.</p>
                <Link to="/minha-area/preferencias" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">Abrir Travel Match <ChevronRight className="size-4" /></Link>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                <div className="flex items-center gap-3"><Sparkles className="size-5 text-cyan-300" /><h2 className="font-serif text-xl">Seu ciclo de viagens</h2></div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-2xl font-semibold">{activeTrips.length}</p><p className="text-xs text-white/45">ativas</p></div>
                  <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-2xl font-semibold">{trips.filter((trip) => trip.stage === "completed").length}</p><p className="text-xs text-white/45">concluídas</p></div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-white/45"><CalendarDays className="size-4" />Radar, matching e alertas in-app conectados no MVP.</div>
              </section>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
