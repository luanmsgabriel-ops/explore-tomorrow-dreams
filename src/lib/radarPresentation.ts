const offerDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatRadarOfferDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : offerDateFormatter.format(date);
}

export function formatRadarOfferPeriod(departure: string | null, returnDate: string | null) {
  const start = formatRadarOfferDate(departure);
  const end = formatRadarOfferDate(returnDate);
  if (start && end) return `${start} → ${end}`;
  if (start) return `Saída ${start}`;
  if (end) return `Retorno ${end}`;
  return null;
}
