import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";
const PLACES_BASE = "https://places.googleapis.com/v1";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function normalizePlace(place: any) {
  return {
    place_id: place.id ?? null,
    name: place.displayName?.text ?? null,
    address: place.formattedAddress ?? null,
    location: place.location ?? null,
    types: Array.isArray(place.types) ? place.types : [],
    rating: typeof place.rating === "number" ? place.rating : null,
    user_rating_count: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    price_level: place.priceLevel ?? null,
    opening_hours: place.regularOpeningHours ?? null,
    google_maps_uri: place.googleMapsUri ?? null,
    website_uri: place.websiteUri ?? null,
    photos: Array.isArray(place.photos)
      ? place.photos.slice(0, 6).map((photo: any) => ({
          name: photo.name,
          width_px: photo.widthPx ?? null,
          height_px: photo.heightPx ?? null,
          author_attributions: photo.authorAttributions ?? [],
        }))
      : [],
  };
}

async function searchPlaces(body: any) {
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const lat = Number(body.latitude);
  const lng = Number(body.longitude);
  const radius = Math.min(Math.max(Number(body.radius_meters) || 5000, 100), 50000);
  const maxResults = Math.min(Math.max(Number(body.max_results) || 10, 1), 20);

  if (!query) return json({ error: "query_required" }, 400);

  const payload: any = { textQuery: query, maxResultCount: maxResults, languageCode: "pt-BR" };
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    payload.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius } };
  }

  const fields = [
    "places.id","places.displayName","places.formattedAddress","places.location","places.types",
    "places.rating","places.userRatingCount","places.priceLevel","places.regularOpeningHours",
    "places.googleMapsUri","places.websiteUri","places.photos",
  ].join(",");

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": fields,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("[TRIP_DISCOVERY_PLACES_ERROR]", res.status, text.slice(0, 500));
    return json({ error: "places_unavailable" }, 502);
  }
  const data = JSON.parse(text || "{}");
  return json({ places: (data.places || []).map(normalizePlace) });
}

async function getPhoto(body: any) {
  const photoName = typeof body.photo_name === "string" ? body.photo_name.trim() : "";
  if (!photoName.startsWith("places/") || !photoName.includes("/photos/")) return json({ error: "invalid_photo_name" }, 400);
  const maxWidthPx = Math.min(Math.max(Number(body.max_width_px) || 1200, 400), 4800);
  const url = `${PLACES_BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    console.error("[TRIP_DISCOVERY_PHOTO_ERROR]", res.status, text.slice(0, 500));
    return json({ error: "photo_unavailable" }, 502);
  }
  const data = JSON.parse(text || "{}");
  return json({ photo_uri: data.photoUri ?? null });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!GOOGLE_MAPS_API_KEY) return json({ error: "discovery_unconfigured" }, 503);
  try {
    const body = await req.json();
    if (body?.action === "photo") return await getPhoto(body);
    if (body?.action === "search" || !body?.action) return await searchPlaces(body);
    return json({ error: "invalid_action" }, 400);
  } catch (error) {
    console.error("[TRIP_DISCOVERY_ERROR]", error);
    return json({ error: "invalid_request" }, 400);
  }
});