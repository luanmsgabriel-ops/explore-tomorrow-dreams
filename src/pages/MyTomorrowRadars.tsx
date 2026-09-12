import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Pause, Play, Plus, Radar, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import MyTomorrowRadarCreate from "@/pages/MyTomorrowRadarCreate";
import { offerCardImageUrl } from "@/lib/offerImages";
import { deleteMyRadar, listMyRadars, setMyRadarStatus, type TravelRadar } from "@/lib/myTomorrowRadars";
import { fetchTravelOfferCatalog } from "@/lib/travelOffersPublic";

const origins = (radar: TravelRadar) =>
  (radar.origin_airports ?? []).length ? radar.origin_airports.join(" · ") : radar.origin || "Origem aberta";

const dateLabel = (value: string | null) => {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

type RadarImage = { src: string; fallback: string | null };

async function destinationImage(radar: TravelRadar): Promise<RadarImage | null> {
  if (!radar.destination) return null;
  try {
    const catalog = await fetchTravelOfferCatalog({
      destination: radar.destination,
      sort: "editorial",
      page: 1,
      per_page: 1,
    });
    const offer = catalog.items.find((item) => item.image_url);
    if (!offer?.image_url) return null;
    return { src: offerCardImageUrl(offer.id) ?? offer.image_url, fallback: offer.image_url };
  } catch {
    return null;
  }
}

export default function MyTomorrowRadars() {
  const [params] = useSearchParams();
  const [radars, setRadars] = useState<TravelRadar[]>([]);
  const [images, setImages] = useState<Record<string, RadarImage>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const creating = params.get("novo") === "1";

  useEffect(() => {
    if (creating) {
      setLoading(false);
      return;
    }
    let active = true;
    void listMyRadars()
      .then(async (items) => {
        if (!active) return;
        setRadars(items);
        const entries = await Promise.all(
          items.map(async (radar) => [radar.id, await destinationImage(radar)] as const),
        );
        if (!active) return;
        setImages(Object.fromEntries(entries.filter((entry): entry is readonly [string, RadarImage] => Boolean(entry[1]))));
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar seus radares.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [creating]);

  const status = async (radar: TravelRadar) => {
    const updated = await setMyRadarStatus(radar.id, radar.status === "active" ? "pause" : "resume");
    setRadars((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const remove = async (id: string) => {
    await deleteMyRadar(id);
    setRadars((current) => current.filter((item) => item.id !== id));
  };

  if (creating) return <MyTomorrowRadarCreate />;

  return (
    <div className="min-h-screen bg-[#041012] text-white">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-cyan-300">My Tomorrow</p>
            <h1 className="mt-2 font-serif text-4xl">Meus radares</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Cada Radar aprende o que faria você embarcar e acompanha oportunidades compatíveis.
            </p>
          </div>
          <Link
            to="/minha-area/radares?novo=1"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#041012]"
          >
            <Plus className="size-4" /> Criar novo Radar
          </Link>
        </div>

        {error ? <div className="mt-5 rounded-xl border border-amber-300/20 p-4 text-sm text-amber-100">{error}</div> : null}
        {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="size-6 animate-spin text-cyan-300" /></div> : null}

        {!loading && !radars.length ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-cyan-300/15 bg-cyan-300/[.025] p-10 text-center">
            <Radar className="mx-auto size-9 text-cyan-300" />
            <h2 className="mt-4 font-serif text-2xl">Nenhum Radar ativo</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/45">Crie seu primeiro Radar contando o que procura ou calibrando visualmente.</p>
            <Link to="/minha-area/radares?novo=1" className="mt-6 inline-flex rounded-xl border border-cyan-300/30 px-5 py-3 text-sm text-cyan-200">Calibrar meu primeiro Radar</Link>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {radars.map((radar) => {
            const image = images[radar.id];
            const start = dateLabel(radar.start_date);
            const end = dateLabel(radar.end_date);
            return (
              <article key={radar.id} className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.07),transparent_35%),rgba(255,255,255,.025)]">
                <Link to={`/minha-area/radares/${radar.id}`} className="relative block h-40 overflow-hidden bg-cyan-300/[.035] sm:h-44">
                  {image ? (
                    <img
                      src={image.src}
                      alt={radar.destination ? `Vista de ${radar.destination}` : "Destino do Radar"}
                      className="size-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.035]"
                      loading="lazy"
                      onError={(event) => {
                        if (image.fallback && event.currentTarget.src !== image.fallback) event.currentTarget.src = image.fallback;
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(34,211,238,.15),transparent_25%),linear-gradient(135deg,rgba(5,52,57,.75),rgba(4,16,18,1))]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#041012] via-[#041012]/30 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                    <div>
                      <span className={`text-[10px] font-semibold uppercase tracking-[.18em] ${radar.status === "active" ? "text-cyan-200" : "text-white/50"}`}>
                        {radar.status === "active" ? "Varrendo oportunidades" : radar.status === "paused" ? "Pausado" : "Arquivado"}
                      </span>
                      <h2 className="mt-1 font-serif text-2xl drop-shadow-lg">{radar.name}</h2>
                    </div>
                    <div className="grid size-11 shrink-0 place-items-center rounded-full border border-cyan-200/25 bg-[#041012]/55 backdrop-blur-md">
                      <Radar className="size-5 text-cyan-200" />
                    </div>
                  </div>
                </Link>

                <div className="p-5 pt-4">
                  <p className="text-sm text-white/55">{origins(radar)} → {radar.destination || radar.category || "Discovery aberto"}</p>
                  <p className="mt-3 text-xs text-white/35">
                    {start || "Período aberto"}{end ? ` → ${end}` : ""}{radar.last_checked_at ? " · Radar já executado" : " · primeira varredura pendente"}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link to={`/minha-area/radares/${radar.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold">Abrir Radar</Link>
                    <button onClick={() => void status(radar)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs">
                      {radar.status === "active" ? <Pause className="size-3" /> : <Play className="size-3" />}
                      {radar.status === "active" ? "Pausar" : "Reativar"}
                    </button>
                    <button onClick={() => void remove(radar.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-300/15 px-3 py-2 text-xs text-red-200">
                      <Trash2 className="size-3" /> Excluir
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
