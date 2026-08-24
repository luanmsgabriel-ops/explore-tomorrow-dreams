const PUBLIC_OFFER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function offerCardImageUrl(
  offerId: string,
  supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL,
) {
  if (!PUBLIC_OFFER_ID.test(offerId) || !supabaseUrl) return null;
  const base = supabaseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({ id: offerId, variant: "card" });
  return `${base}/functions/v1/travel-offer-image?${params}`;
}
