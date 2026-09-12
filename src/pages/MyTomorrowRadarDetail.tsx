import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Plus,
  Radar as RadarIcon,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RadarSignalGlobe } from "@/components/my-tomorrow/RadarSignalGlobe";
import { listMyRadarMatches, runMyRadarMatching, type RadarMatch } from "@/lib/myTomorrowMatches";
import {
  deleteMyRadar,
  getMyRadar,
  listMyRadars,
  setMyRadarStatus,
  updateMyRadar,
  type TravelRadar,
} from "@/lib/myTomorrowRadars";

const matchLabel = { exact: "Match exato", flexible: "Data flexível", discovery: "Descoberta" } as const;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const offerDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const formatDate = (value: string | null) => {
  if (!value) return "aberto";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "aberto" : shortDate.format(date);
};

const formatOfferDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : offerDate.format(date);
};

function offerPeriod(departure: string | null, returnDate: string | null) {
  const start = formatOfferDate(departure);
  const end = formatOfferDate(returnDate);
  if (start && end) return `${start} → ${end}`;
  if (start) return `Saída ${start}`;
  if (end) return `Retorno ${end}`;
  return null;
}

function offerPrice(offer: RadarMatch["offer_snapshot"]) {
  if (offer.currency === "BRL" || !offer.currency) return money.format(offer.price_per_person);
  return `${offer.currency} ${offer.price_per_person.toLocaleString("pt-BR")}`;
}

export default function MyTomorrowRadarDetail() {
  const { radarId = "" } = useParams();
  const navigate = useNavigate();
  const [radar, setRadar] = useState<TravelRadar | null>(null);
  const [radars, setRadars] = useState<TravelRadar[]>([]);
  const [matches, setMatches] = useState<RadarMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", destination: "", start: "", end: "", budget: "", passengers: "" });

  const loadMatches = async () => {
    const next = await listMyRadarMatches(radarId);
    setMatches(next);
  };

  const hydrateForm = (item: TravelRadar) =>
    setForm({
      name: item.name,
      destination: item.destination || "",
      start: item.start_date || "",
      end: item.end_date || "",
      budget: item.budget_max != null ? String(item.budget_max) : "",
      passengers: item.passengers ? String(item.passengers) : "",
    });

  const refresh = async (auto = false) => {
    if (!radar && !auto) return;
    setMatching(true);
    setError(null);
    try {
      const result = await runMyRadarMatching(radarId);
      setSummary(`${result.matches} sinais: ${result.exact} exatos, ${result.flexible} flexíveis e ${result.discovery} descobertas.`);
      await loadMatches();
      setRadar((current) => (current ? { ...current, last_checked_at: result.checked_at } : current));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível atualizar o Radar.");
    } finally {
      setMatching(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [item, all] = await Promise.all([getMyRadar(radarId), listMyRadars()]);
        if (!active) return;
        setRadar(item);
        setRadars(all);
        hydrateForm(item);
        await loadMatches();
        if (item.status === "active" && !item.last_checked_at) void refresh(true);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar o Radar.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [radarId]);

  const best = matches[0] ?? null;
  const counts = useMemo(
    () => ({
      exact: matches.filter((match) => match.match_class === "exact").length,
      flexible: matches.filter((match) => match.match_class === "flexible").length,
      discovery: matches.filter((match) => match.match_class === "discovery").length,
    }),
    [matches],
  );

  const toggle = async () => {
    if (!radar) return;
    const updated = await setMyRadarStatus(radar.id, radar.status === "active" ? "pause" : "resume");
    setRadar(updated);
  };

  const remove = async () => {
    await deleteMyRadar(radarId);
    navigate("/minha-area/radares", { replace: true });
  };

  const save = async () => {
    if (!radar) return;
    setSaving(true);
    try {
      const updated = await updateMyRadar(radar.id, {
        name: form.name,
        destination: form.destination || null,
        start_date: form.start || null,
        end_date: form.end || null,
        budget_max: form.budget ? Number(form.budget) : null,
        passengers: form.passengers ? Number(form.passengers) : null,
      });
      setRadar(updated);
      setEditing(false);
      setSummary("Critérios atualizados. O Radar recalculará os sinais.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar os critérios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#041012] text-white"><Header /><div className="grid min-h-screen place-items-center"><Loader2 className="size-7 animate-spin text-cyan-300" /></div></div>;
  }

  if (!radar) {
    return <div className="min-h-screen bg-[#041012] text-white"><Header /><main className="mx-auto max-w-4xl px-5 pt-28">{error || "Radar não encontrado."}</main></div>;
  }

  const originLabel = (radar.origin_airports ?? []).length ? radar.origin_airports.join(" · ") : radar.origin || "Origem aberta";
  const destinationLabel = radar.destination || radar.category || "Discovery aberto";
  const periodLabel = `${formatDate(radar.start_date)} a ${formatDate(radar.end_date)}`;
  const lastScanLabel = radar.last_checked_at ? new Date(radar.last_checked_at).toLocaleString("pt-BR") : "Ainda não executado";
  const bestPrice = best ? offerPrice(best.offer_snapshot) : "Sem sinal ainda";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(34,211,238,.10),transparent_30%),#041012] text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/minha-area/radares" className="inline-flex items-center gap-2 text-sm text-white/50"><ArrowLeft className="size-4" />Meus radares</Link>
          <Link to="/minha-area/radares/novo" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 px-3 py-2 text-xs text-cyan-200"><Plus className="size-3.5" />Novo Radar</Link>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {radars.map((item) => (
            <Link key={item.id} to={`/minha-area/radares/${item.id}`} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs ${item.id === radar.id ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-white/45"}`}>
              {item.name.replace(/^Radar\s+/i, "")}
            </Link>
          ))}
        </nav>

        {error ? <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">{error}</div> : null}

        <section className="relative mt-5 overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_50%_46%,rgba(22,181,195,.10),transparent_27%),radial-gradient(circle_at_top_right,rgba(212,175,55,.06),transparent_30%),linear-gradient(180deg,rgba(5,41,45,.96),rgba(3,24,27,.98))] p-5 shadow-[0_30px_90px_rgba(0,0,0,.28)] sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
            <div className="absolute left-[9%] top-[19%] h-px w-[18%] bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
            <div className="absolute right-[8%] top-[31%] h-px w-[16%] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />
            <div className="absolute bottom-[18%] left-[6%] h-px w-[20%] bg-gradient-to-r from-transparent via-[#d4af37]/25 to-transparent" />
            <div className="absolute bottom-[25%] right-[5%] h-px w-[19%] bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col gap-3 border-b border-white/[.055] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[.22em] text-cyan-300"><RadarIcon className={`size-4 ${matching ? "animate-spin" : ""}`} />{radar.status === "active" ? "Ativo · varrendo" : "Radar pausado"}</div>
                <h1 className="mt-3 font-serif text-4xl sm:text-5xl">{radar.name}</h1>
                <p className="mt-3 text-sm text-white/45">{originLabel} → {destinationLabel} · {periodLabel}</p>
              </div>
              <div className="hidden text-right lg:block">
                <p className="text-[10px] uppercase tracking-[.32em] text-cyan-200/55">Tomorrow Radar Intelligence</p>
                <p className="mt-2 max-w-xs text-xs leading-5 text-white/30">Varredura contínua do inventário público da Tomorrow Travel.</p>
              </div>
            </div>

            <div className="mt-4 grid items-center gap-4 lg:grid-cols-[minmax(180px,1fr)_auto_minmax(180px,1fr)] lg:gap-3 xl:gap-7">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <HudPanel eyebrow="Origem monitorada" value={originLabel} accent="cyan" />
                <HudPanel eyebrow="Janela de embarque" value={periodLabel} accent="gold" />
                <HudPanel eyebrow="Sinais exatos" value={String(counts.exact)} subvalue={`${counts.flexible} flexíveis`} accent="cyan" />
              </div>

              <div className="relative mx-auto grid min-h-[22rem] place-items-center sm:min-h-[29rem] lg:min-h-[32rem]">
                <div className="pointer-events-none absolute inset-x-[-8%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent" aria-hidden="true" />
                <div className="pointer-events-none absolute bottom-[7%] left-1/2 h-20 w-[78%] -translate-x-1/2 rounded-[50%] bg-cyan-300/[.035] blur-2xl" aria-hidden="true" />
                <RadarSignalGlobe signals={matches.length} scanning={matching} />
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <HudPanel eyebrow="Destino" value={destinationLabel} accent="gold" />
                <HudPanel eyebrow="Melhor sinal" value={bestPrice} subvalue={best ? `${Math.round(best.score)}% aderência` : undefined} accent="gold" />
                <HudPanel eyebrow="Última varredura" value={lastScanLabel} accent="cyan" compact />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/[.055] pt-5">
              <button onClick={() => void refresh()} disabled={matching || radar.status !== "active"} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#041012] shadow-[0_0_28px_rgba(34,211,238,.18)] disabled:opacity-40"><RefreshCw className={`size-4 ${matching ? "animate-spin" : ""}`} />{matching ? "Varrendo..." : "Varrer agora"}</button>
              <button onClick={() => setEditing((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm"><Settings2 className="size-4" />Ajustar critérios</button>
              <button onClick={() => void toggle()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm">{radar.status === "active" ? <Pause className="size-4" /> : <Play className="size-4" />}{radar.status === "active" ? "Pausar" : "Reativar"}</button>
              <button onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-xl border border-red-300/15 bg-black/10 px-4 py-3 text-sm text-red-200"><Trash2 className="size-4" />Excluir</button>
              <span className="ml-auto hidden text-[10px] uppercase tracking-[.24em] text-[#d4af37]/55 lg:block">O amanhã não espera.</span>
            </div>
            {summary ? <p className="mt-4 text-sm text-cyan-100/70">{summary}</p> : null}
          </div>
        </section>

        {editing ? (
          <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[.025] p-5">
            <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">Ajustar critérios</h2><span className="text-xs text-white/30">Configuração secundária</span></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <EditField label="Nome" value={form.name} set={(value) => setForm({ ...form, name: value })} />
              <EditField label="Destino" value={form.destination} set={(value) => setForm({ ...form, destination: value })} />
              <EditField label="De" type="date" value={form.start} set={(value) => setForm({ ...form, start: value })} />
              <EditField label="Até" type="date" value={form.end} set={(value) => setForm({ ...form, end: value })} />
              <EditField label="Até R$ por pessoa" type="number" value={form.budget} set={(value) => setForm({ ...form, budget: value })} />
              <EditField label="Passageiros" type="number" value={form.passengers} set={(value) => setForm({ ...form, passengers: value })} />
            </div>
            <button disabled={saving} onClick={() => void save()} className="mt-4 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#041012]">{saving ? "Salvando..." : "Salvar e recalcular"}</button>
          </section>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Metric label="Exatos" value={counts.exact} tone="cyan" />
          <Metric label="Flexíveis" value={counts.flexible} tone="gold" />
          <Metric label="Discovery" value={counts.discovery} tone="violet" />
        </section>

        {best ? <BestSignal match={best} /> : null}

        <section className="mt-8">
          <div className="flex items-end justify-between">
            <div><p className="text-xs uppercase tracking-[.18em] text-cyan-300">Sinais do Radar</p><h2 className="mt-2 font-serif text-3xl">Oportunidades encontradas</h2></div>
            {radar.last_checked_at ? <p className="hidden text-xs text-white/30 sm:block">Última varredura {new Date(radar.last_checked_at).toLocaleString("pt-BR")}</p> : null}
          </div>
          {!matches.length ? (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 p-8 text-center text-sm text-white/40">{matching ? "O Radar está procurando sinais..." : "Nenhuma oportunidade compatível encontrada nesta varredura."}</div>
          ) : (
            <div className="mt-5 grid gap-3">{matches.slice(0, 18).map((match) => <MatchCard key={match.id} match={match} />)}</div>
          )}
        </section>
      </main>
    </div>
  );
}

function HudPanel({ eyebrow, value, subvalue, accent, compact = false }: { eyebrow: string; value: string; subvalue?: string; accent: "cyan" | "gold"; compact?: boolean }) {
  const accentClass = accent === "gold" ? "text-[#e6c75a] border-[#d4af37]/18" : "text-cyan-300 border-cyan-300/15";
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-black/[.08] p-4 backdrop-blur-sm ${accentClass}`}>
      <div className={`absolute left-0 top-0 h-px w-16 ${accent === "gold" ? "bg-[#d4af37]/70" : "bg-cyan-300/70"}`} aria-hidden="true" />
      <p className="text-[9px] uppercase tracking-[.24em] opacity-70">{eyebrow}</p>
      <p className={`${compact ? "text-xs leading-5" : "text-base"} mt-2 font-medium text-white/85`}>{value}</p>
      {subvalue ? <p className="mt-1 text-[10px] uppercase tracking-[.15em] text-white/30">{subvalue}</p> : null}
    </div>
  );
}

function BestSignal({ match }: { match: RadarMatch }) {
  const offer = match.offer_snapshot;
  const period = offerPeriod(offer.departure_date, offer.return_date);
  return (
    <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#d4af37]/25 bg-white/[.03]">
      <div className="grid md:grid-cols-[.8fr_1.2fr]">
        {offer.image_url ? <img src={offer.image_url} alt={offer.destination ? `Vista de ${offer.destination}` : "Imagem da oportunidade"} className="h-64 w-full object-cover md:h-full" /> : <div className="grid min-h-56 place-items-center bg-cyan-300/[.04]"><Sparkles className="size-10 text-[#d4af37]" /></div>}
        <div className="p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[.18em] text-[#e7c95e]"><BellRing className="size-4" />Melhor sinal agora</div>
          <h2 className="mt-3 font-serif text-3xl">{offer.name || offer.destination || "Oportunidade"}</h2>
          <p className="mt-2 text-sm text-white/50">{offer.origin || "Origem não informada"} → {offer.destination || "Destino não informado"}</p>
          {period ? <p className="mt-2 flex items-center gap-2 text-sm text-cyan-100/65"><CalendarDays className="size-4 text-cyan-300" />{period}{offer.nights != null ? ` · ${offer.nights} noites` : ""}</p> : null}
          <div className="mt-5 flex items-end justify-between gap-4">
            <div><strong className="text-3xl">{offerPrice(offer)}</strong><p className="text-xs text-white/35">por pessoa · {Math.round(match.score)}% aderência</p></div>
            <Link to={`/oportunidades/oferta/${offer.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">Abrir <ExternalLink className="size-4" /></Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{match.matched_factors.slice(0, 5).map((factor) => <span key={factor.key} className="rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1.5 text-xs text-cyan-100">✓ {factor.label}</span>)}</div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "cyan" | "gold" | "violet" }) {
  const cls = tone === "cyan" ? "text-cyan-300 border-cyan-300/15" : tone === "gold" ? "text-[#e7c95e] border-[#d4af37]/20" : "text-violet-300 border-violet-300/15";
  return <div className={`rounded-[1.5rem] border bg-white/[.025] p-5 ${cls}`}><span className="text-xs uppercase tracking-[.18em]">{label}</span><strong className="mt-2 block text-3xl text-white">{value}</strong></div>;
}

function MatchCard({ match }: { match: RadarMatch }) {
  const offer = match.offer_snapshot;
  const period = offerPeriod(offer.departure_date, offer.return_date);
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/[.025] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className={`text-[10px] font-semibold uppercase tracking-[.16em] ${match.match_class === "exact" ? "text-cyan-300" : match.match_class === "flexible" ? "text-[#e7c95e]" : "text-violet-300"}`}>{matchLabel[match.match_class]}</span>
          <h3 className="mt-1 text-lg font-semibold">{offer.name || offer.destination || "Oportunidade"}</h3>
          <p className="mt-1 text-sm text-white/45">{offer.origin || "Origem não informada"} → {offer.destination || "Destino não informado"}</p>
          {period ? <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/40"><CalendarDays className="size-3.5 text-cyan-300/80" />{period}{offer.nights != null ? ` · ${offer.nights} noites` : ""}</p> : null}
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right"><strong>{offerPrice(offer)}</strong><p className="text-xs text-white/35">{Math.round(match.score)}% aderência</p></div>
          <Link to={`/oportunidades/oferta/${offer.id}`} className="grid size-10 place-items-center rounded-full border border-white/10 text-cyan-300"><ChevronRight className="size-4" /></Link>
        </div>
      </div>
    </article>
  );
}

function EditField({ label, value, set, type = "text" }: { label: string; value: string; set: (value: string) => void; type?: string }) {
  return (
    <label className="rounded-xl border border-white/10 bg-black/15 p-3">
      <span className="text-[10px] uppercase tracking-[.15em] text-white/35">{label}</span>
      <input type={type} value={value} onChange={(event) => set(event.target.value)} className="mt-1 w-full bg-transparent text-sm text-white outline-none" />
    </label>
  );
}
