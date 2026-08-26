import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { classifyWeatherHorizon, normalizeForecast, seasonalFallback } from "../_shared/trip-composer-weather.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { latitude, longitude, target_date } = await req.json();
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || typeof target_date !== "string") {
      return new Response(JSON.stringify({ error: "invalid_request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const mode = classifyWeatherHorizon(target_date);
    if (mode === "seasonal") {
      return new Response(JSON.stringify(seasonalFallback(target_date)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (mode === "unavailable") {
      return new Response(JSON.stringify({ mode: "unavailable", target_date, source: "none", confidence: "unavailable", planner_advice: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("OPENWEATHERMAP_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "weather_unavailable" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const url = new URL("https://api.openweathermap.org/data/3.0/onecall");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("appid", apiKey);
    url.searchParams.set("units", "metric");
    url.searchParams.set("lang", "pt_br");
    url.searchParams.set("exclude", "minutely,hourly,alerts,current");

    const response = await fetch(url);
    if (!response.ok) {
      console.error("OpenWeather error", response.status);
      return new Response(JSON.stringify({ error: "weather_provider_error" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const normalized = normalizeForecast(target_date, data.daily || []);
    if (!normalized) return new Response(JSON.stringify({ error: "forecast_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify(normalized), { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=900" } });
  } catch (error) {
    console.error("trip-composer-weather", error);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
