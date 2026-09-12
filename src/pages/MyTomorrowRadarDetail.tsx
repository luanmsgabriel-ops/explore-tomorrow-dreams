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

  return (
    <div className="min-h-screen bg-[#031416] text-white">
      <Header />
      <main className="mx-auto max-w-[94rem] px-3 pb-20 pt-24 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between gap-4 px-1 sm:px-2">
          <Link to="/minha-area/radares" className="inline-flex items-center gap-2 text-sm text-white/50"><ArrowLeft className="size-4" />Meus radares</Link>
          <Link to="/minha-area/radares/novo" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 px-3 py-2 text-xs text-cyan-200"><Plus className="size-3.5" />Novo Radar</Link>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto px-1 pb-2 sm:px-2">
          {radars.map((item) => (
            <Link key={item.id} to={`/minha-area/radares/${item.id}`} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs ${item.id === radar.id ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-white/45"}`}>
              {item.name.replace(/^Radar\s+/i, "")}
            </Link>
          ))}
        </nav>

        {error ? <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">{error}</div> : null}

        <section className="relative mt-3 min-h-[48rem] overflow-hidden rounded-[2.1rem] border border-cyan-300/[.10] bg-[radial-gradient(circle_at_50%_44%,rgba(14,116,128,.16),transparent_31%),radial-gradient(circle_at_12%_28%,rgba(20,163,176,.08),transparent_24%),radial-gradient(circle_at_88%_33%,rgba(212,175,55,.055),transparent_22%),linear-gradient(180deg,#041c1f_0%,#031416_60%,#021012_100%)] shadow-[0_42px_120px_rgba(0,0,0,.42)] sm:min-h-[55rem] lg:min-h-[62rem]">
          <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true">
            <div className="absolute -left-[12%] top-[22%] size-[36rem] rounded-full bg-cyan-400/[.025] blur-[90px]" />
            <div className="absolute -right-[14%] top-[30%] size-[31rem] rounded-full bg-[#d4af37]/[.022] blur-[100px]" />
            <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[radial-gradient(ellipse_at_center,rgba(22,155,167,.06),transparent_66%)]" />
          </div>

          <div className="absolute left-5 top-5 z-30 sm:left-8 sm:top-8 lg:left-12 lg:top-10">
            <h1 className="text-2xl font-medium uppercase tracking-[.16em] text-white sm:text-3xl lg:text-4xl">{radar.name}</h1>
            <p className="mt-3 text-[10px] uppercase tracking-[.22em] text-cyan-200/70 sm:text-xs">{originLabel} → {destinationLabel}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[.22em] text-cyan-200/62 sm:text-xs">{periodLabel}</p>
          </div>

          <div className="absolute right-5 top-6 z-30 hidden text-right lg:block lg:right-12 lg:top-11">
            <p className="text-xs uppercase tracking-[.38em] text-cyan-200/65">Explorando</p>
            <p className="mt-2 text-xs uppercase tracking-[.38em] text-cyan-200/65">novos</p>
            <p className="mt-2 text-xs uppercase tracking-[.38em] text-cyan-200/65">horizontes</p>
            <div className="ml-auto mt-4 h-px w-10 bg-[#d4af37]/80" />
          </div>

          <div className="absolute bottom-[13.5rem] left-5 z-30 hidden lg:block lg:left-12">
            <div className="mb-4 flex h-8 items-end gap-[3px]" aria-hidden="true">
              {[8,15,22,13,27,18,31,15,24,10].map((height, index) => <span key={index} className="w-[2px] rounded-full bg-cyan-300/60" style={{ height }} />)}
            </div>
            <p className="text-[11px] uppercase tracking-[.36em] leading-6 text-cyan-200/55">Varrendo<br/>oportunidades<br/>em tempo real</p>
          </div>

          <div className="absolute bottom-[13.5rem] right-5 z-30 hidden text-right lg:block lg:right-12">
            <p className="text-[11px] uppercase tracking-[.36em] leading-6 text-cyan-200/55">O mundo<br/>sempre tem<br/>mais para você</p>
            <div className="ml-auto mt-4 h-px w-12 bg-[#d4af37]/80" />
          </div>

          <div className="absolute inset-x-0 top-[7rem] z-10 flex justify-center sm:top-[6rem] lg:top-[2.3rem]">
            <RadarSignalGlobe signals={matches.length} scanning={matching} />
          </div>

          <div className="absolute inset-x-0 bottom-6 z-40 flex flex-col items-center gap-3 px-4 sm:bottom-8">
            <div className="flex w-full max-w-[42rem] gap-3 sm:gap-5">
              <button onClick={() => void toggle()} className="inline-flex min-h-16 flex-1 items-center justify-center gap-3 rounded-[1.4rem] border border-cyan-300/35 bg-[#041a1d]/80 px-5 text-base text-white shadow-[inset_0_0_24px_rgba(34,211,238,.04),0_0_22px_rgba(34,211,238,.04)] backdrop-blur-md sm:min-h-20 sm:text-xl">
                {radar.status === "active" ? <Pause className="size-5 sm:size-6" /> : <Play className="size-5 sm:size-6" />}{radar.status === "active" ? "Pausar" : "Reativar"}
              </button>
              <button onClick={() => void remove()} className="inline-flex min-h-16 flex-1 items-center justify-center gap-3 rounded-[1.4rem] border border-red-300/25 bg-[#041a1d]/80 px-5 text-base text-red-200 shadow-[inset_0_0_24px_rgba(255,120,120,.035)] backdrop-blur-md sm:min-h-20 sm:text-xl">
                <Trash2 className="size-5 sm:size-6" />Excluir
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <button onClick={() => void refresh()} disabled={matching || radar.status !== "active"} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-black/15 px-4 py-2 text-cyan-100/75 disabled:opacity-40"><RefreshCw className={`size-3.5 ${matching ? "animate-spin" : ""}`} />{matching ? "Varrendo..." : "Varrer agora"}</button>
              <button onClick={() => setEditing((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-4 py-2 text-white/55"><Settings2 className="size-3.5" />Ajustar critérios</button>
            </div>
            {summary ? <p className="max-w-xl text-center text-xs text-cyan-100/55">{summary}</p> : null}
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
