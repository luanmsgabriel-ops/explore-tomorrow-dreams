import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, Sparkles } from "lucide-react";

export type TripComposerPhoto = {
  url: string;
  attribution?: string | null;
};

export type TripComposerExperience = {
  id: string;
  title: string;
  summary?: string | null;
  durationMinutes?: number | null;
  travelMinutes?: number | null;
  distanceMeters?: number | null;
  category?: string | null;
  photos: TripComposerPhoto[];
};

export type TripComposerTimelineItem = {
  id: string;
  startsAt?: string | null;
  endsAt?: string | null;
  title: string;
  subtitle?: string | null;
  kind: "experience" | "restaurant" | "transport" | "hotel" | "free_time" | "custom";
};

export type TripComposerDay = {
  dayNumber: number;
  dateLabel?: string | null;
  status: "planning" | "planned";
  items: TripComposerTimelineItem[];
};

type Props = {
  days: TripComposerDay[];
  activeDay: number;
  candidates: TripComposerExperience[];
  focusedCandidateId?: string | null;
  selectedCandidateId?: string | null;
  reducedMotion?: boolean;
  onDayChange?: (day: number) => void;
  onFocusCandidate?: (id: string) => void;
  onSelectCandidate?: (id: string) => void;
  onRequestMoreInfo?: (id: string) => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  "tourist attraction": "Atração turística",
  "tourist_attraction": "Atração turística",
  "point of interest": "Ponto de interesse",
  "point_of_interest": "Ponto de interesse",
  tour: "Passeio",
  experience: "Experiência",
  park: "Parque",
  beach: "Praia",
  museum: "Museu",
  restaurant: "Restaurante",
  bar: "Bar",
  cafe: "Café",
  "coffee shop": "Cafeteria",
  hiking_area: "Trilha",
  "hiking area": "Trilha",
  national_park: "Parque nacional",
  "national park": "Parque nacional",
  shopping_mall: "Shopping",
  "shopping mall": "Shopping",
};

function categoryLabel(value?: string | null) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return CATEGORY_LABELS[normalized] ?? CATEGORY_LABELS[normalized.replace(/_/g, " ")] ?? value.replace(/_/g, " ");
}

function formatDuration(minutes?: number | null) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

function formatDistance(meters?: number | null) {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

function ExperienceCard({
  experience,
  focused,
  selected,
  reducedMotion,
  onFocus,
  onSelect,
  onMoreInfo,
}: {
  experience: TripComposerExperience;
  focused: boolean;
  selected: boolean;
  reducedMotion?: boolean;
  onFocus?: () => void;
  onSelect?: () => void;
  onMoreInfo?: () => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const usablePhotos = useMemo(() => experience.photos.filter((photo) => Boolean(photo.url)), [experience.photos]);

  useEffect(() => {
    setPhotoIndex(0);
    usablePhotos.forEach((photo) => {
      const image = new Image();
      image.decoding = "async";
      image.src = photo.url;
    });
    if (reducedMotion || usablePhotos.length <= 1) return undefined;
    const interval = window.setInterval(() => {
      setPhotoIndex((current) => (current + 1) % usablePhotos.length);
    }, focused ? 3200 : 4200);
    return () => window.clearInterval(interval);
  }, [experience.id, focused, reducedMotion, usablePhotos]);

  const activePhoto = usablePhotos[photoIndex] ?? null;
  const metadata = [
    formatDuration(experience.durationMinutes),
    experience.travelMinutes ? `${experience.travelMinutes} min de deslocamento` : null,
    formatDistance(experience.distanceMeters),
  ].filter(Boolean);
  const localizedCategory = categoryLabel(experience.category);

  return (
    <article
      data-testid={`trip-composer-card-${experience.id}`}
      className={`group relative min-w-0 overflow-hidden rounded-[1.35rem] border bg-[#06181b]/96 shadow-2xl backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 ${
        selected ? "md:grid md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] border-[#d5af48] ring-1 ring-[#d5af48]/45" : focused ? "border-[#62d6cf]/70 ring-1 ring-[#62d6cf]/25" : "border-white/10"
      }`}
      onMouseEnter={onFocus}
      onFocus={onFocus}
    >
      <div className={`relative overflow-hidden bg-[#082226] ${selected ? "aspect-[4/3] md:aspect-auto md:min-h-[20rem]" : "aspect-[4/3]"}`}>
        {activePhoto ? (
          <img
            src={activePhoto.url}
            alt={experience.title}
            className="h-full w-full object-cover opacity-100 transition-opacity duration-500"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-white/45">Imagem não disponível</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06181b] via-transparent to-transparent" />
        {usablePhotos.length > 1 ? (
          <div className="absolute bottom-3 left-3 right-3 flex gap-1.5" aria-label={`${usablePhotos.length} fotos`}>
            {usablePhotos.map((_, index) => (
              <span key={index} className={`h-1 flex-1 rounded-full ${index === photoIndex ? "bg-[#d5af48]" : "bg-white/35"}`} />
            ))}
          </div>
        ) : null}
        {activePhoto?.attribution ? (
          <span className="absolute right-2 top-2 max-w-[80%] rounded-full bg-black/55 px-2 py-1 text-[0.6rem] text-white/70">
            {activePhoto.attribution}
          </span>
        ) : null}
      </div>

      <div className={`p-4 sm:p-5 ${selected ? "md:flex md:flex-col md:justify-center" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {localizedCategory ? <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#62d6cf]">{localizedCategory}</p> : null}
            <h3 className="mt-1 font-editorial text-2xl leading-tight text-white sm:text-[1.7rem]">{experience.title}</h3>
          </div>
          {selected ? (
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#d5af48] text-[#071416]" aria-label="Selecionado">
              <Check className="size-4" />
            </span>
          ) : null}
        </div>

        {experience.summary ? <p className={`mt-3 text-sm leading-relaxed text-white/65 ${selected ? "line-clamp-5" : "line-clamp-3"}`}>{experience.summary}</p> : null}

        {metadata.length ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/68">
            {metadata.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1.5">{item}</span>)}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onMoreInfo} className="min-h-10 rounded-xl border border-white/12 bg-white/[0.035] px-3 text-sm font-semibold text-white/78 transition hover:border-[#62d6cf]/50">
            Saber mais
          </button>
          <button type="button" onClick={onSelect} className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#d5af48] px-3 text-sm font-bold text-[#071416] transition hover:brightness-105">
            <Plus className="size-4" />
            {selected ? "No roteiro" : "Adicionar"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function TripComposerPanel({ days, activeDay, candidates, focusedCandidateId, selectedCandidateId, reducedMotion, onDayChange, onFocusCandidate, onSelectCandidate, onRequestMoreInfo }: Props) {
  const currentDay = useMemo(() => days.find((day) => day.dayNumber === activeDay) ?? days[0], [activeDay, days]);
  const visibleCandidates = selectedCandidateId ? candidates.filter((candidate) => candidate.id === selectedCandidateId) : candidates.slice(0, 3);
  if (!currentDay) return null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-[#041214]/94 p-3 shadow-2xl backdrop-blur-2xl sm:p-5" aria-label="Trip Composer">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#62d6cf]"><Sparkles className="size-4" /> Trip Composer</p>
          <h2 className="mt-1 font-editorial text-2xl text-white sm:text-3xl">Dia {currentDay.dayNumber} em construção</h2>
          {currentDay.dateLabel ? <p className="mt-1 text-xs text-white/50">{currentDay.dateLabel}</p> : null}
        </div>
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
          {days.map((day) => (
            <button key={day.dayNumber} type="button" onClick={() => onDayChange?.(day.dayNumber)} className={`min-w-14 rounded-xl border px-3 py-2 text-xs font-bold transition ${day.dayNumber === currentDay.dayNumber ? "border-[#62d6cf]/60 bg-[#62d6cf]/10 text-[#8ce9e4]" : day.status === "planned" ? "border-[#d5af48]/35 bg-[#d5af48]/8 text-[#e8cf84]" : "border-white/10 text-white/55"}`}>
              Dia {day.dayNumber}{day.status === "planned" ? <Check className="mx-auto mt-1 size-3.5" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.6fr)]">
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.025] p-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45">Linha do tempo</p>
          <div className="relative mt-4 grid gap-3 before:absolute before:bottom-3 before:left-[0.56rem] before:top-3 before:w-px before:bg-white/12">
            {currentDay.items.length ? currentDay.items.map((item) => (
              <div key={item.id} className="relative grid grid-cols-[1.2rem_1fr] gap-3">
                <span className="relative z-10 mt-1 size-3 rounded-full border-2 border-[#62d6cf] bg-[#041214] shadow-[0_0_18px_rgba(98,214,207,0.32)]" />
                <div className="rounded-xl border border-white/10 bg-[#06191c]/90 p-3">
                  <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#62d6cf]"><Clock3 className="size-3.5" /> {[item.startsAt, item.endsAt].filter(Boolean).join("–") || "Horário livre"}</p>
                  <p className="mt-1.5 text-sm font-semibold text-white">{item.title}</p>
                  {item.subtitle ? <p className="mt-1 text-xs leading-relaxed text-white/50">{item.subtitle}</p> : null}
                </div>
              </div>
            )) : <div className="rounded-xl border border-dashed border-white/12 p-4 text-sm leading-relaxed text-white/45">O dia ainda está vazio. As escolhas entram aqui conforme o cliente confirma.</div>}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45">Sugestões para esta janela</p>
              <p className="mt-1 text-sm text-white/60">Até três opções reais, com fotos rotativas e contexto logístico.</p>
            </div>
            {visibleCandidates.length > 1 ? <div className="hidden gap-1 sm:flex" aria-hidden="true"><ChevronLeft className="size-4 text-white/30" /><ChevronRight className="size-4 text-white/30" /></div> : null}
          </div>

          {visibleCandidates.length ? (
            <div className={`mt-4 grid gap-4 ${visibleCandidates.length === 1 ? "mx-auto w-full max-w-4xl" : "md:grid-cols-2 2xl:grid-cols-3"}`}>
              {visibleCandidates.map((experience) => (
                <ExperienceCard key={experience.id} experience={experience} focused={focusedCandidateId === experience.id} selected={selectedCandidateId === experience.id} reducedMotion={reducedMotion} onFocus={() => onFocusCandidate?.(experience.id)} onSelect={() => onSelectCandidate?.(experience.id)} onMoreInfo={() => onRequestMoreInfo?.(experience.id)} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.25rem] border border-dashed border-white/12 p-6 text-center"><MapPin className="mx-auto size-6 text-[#62d6cf]/70" /><p className="mt-2 text-sm text-white/55">As sugestões aparecem aqui quando o planner encontrar opções compatíveis.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}
