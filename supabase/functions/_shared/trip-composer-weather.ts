export type WeatherMode = "forecast" | "seasonal" | "unavailable";

export type WeatherContext = {
  mode: WeatherMode;
  target_date: string;
  source: "openweather" | "none";
  precipitation_probability: number | null;
  min_temp_c: number | null;
  max_temp_c: number | null;
  weather_main: string | null;
  description: string | null;
  confidence: "forecast" | "seasonal_context" | "unavailable";
  planner_advice: string[];
};

const DAY_MS = 86_400_000;

export function daysFromToday(targetDate: string, now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const target = new Date(`${targetDate}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) throw new Error("invalid_target_date");
  return Math.floor((target.getTime() - today.getTime()) / DAY_MS);
}

export function classifyWeatherHorizon(targetDate: string, now = new Date()): WeatherMode {
  const days = daysFromToday(targetDate, now);
  if (days >= 0 && days <= 7) return "forecast";
  if (days > 7) return "seasonal";
  return "unavailable";
}

export function plannerAdvice(input: {
  precipitation_probability?: number | null;
  max_temp_c?: number | null;
  min_temp_c?: number | null;
  weather_main?: string | null;
}) {
  const advice: string[] = [];
  const rain = input.precipitation_probability ?? null;
  const max = input.max_temp_c ?? null;
  const min = input.min_temp_c ?? null;
  const main = input.weather_main?.toLowerCase() || "";

  if ((rain != null && rain >= 60) || main.includes("rain") || main.includes("thunderstorm")) advice.push("priorizar_indoor");
  if (max != null && max >= 32) advice.push("evitar_externo_meio_do_dia");
  if (min != null && min <= 8) advice.push("considerar_frio_intenso");
  if (rain != null && rain <= 20 && !main.includes("rain")) advice.push("favoravel_externo");

  return advice;
}

export function normalizeForecast(targetDate: string, daily: any[]): WeatherContext | null {
  const targetTs = Math.floor(new Date(`${targetDate}T00:00:00Z`).getTime() / 1000);
  const item = daily.find((d: any) => Math.abs(Number(d?.dt || 0) - targetTs) < 43_200);
  if (!item) return null;

  const rain = item.pop == null ? null : Math.round(Number(item.pop) * 100);
  const min = item.temp?.min == null ? null : Math.round(Number(item.temp.min) * 10) / 10;
  const max = item.temp?.max == null ? null : Math.round(Number(item.temp.max) * 10) / 10;
  const weatherMain = item.weather?.[0]?.main || null;
  const description = item.weather?.[0]?.description || null;

  return {
    mode: "forecast",
    target_date: targetDate,
    source: "openweather",
    precipitation_probability: rain,
    min_temp_c: min,
    max_temp_c: max,
    weather_main: weatherMain,
    description,
    confidence: "forecast",
    planner_advice: plannerAdvice({ precipitation_probability: rain, min_temp_c: min, max_temp_c: max, weather_main: weatherMain }),
  };
}

export function seasonalFallback(targetDate: string): WeatherContext {
  return {
    mode: "seasonal",
    target_date: targetDate,
    source: "none",
    precipitation_probability: null,
    min_temp_c: null,
    max_temp_c: null,
    weather_main: null,
    description: null,
    confidence: "seasonal_context",
    planner_advice: [],
  };
}
