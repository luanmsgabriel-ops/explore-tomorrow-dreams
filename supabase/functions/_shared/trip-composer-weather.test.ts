import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { classifyWeatherHorizon, normalizeForecast, plannerAdvice } from "./trip-composer-weather.ts";

Deno.test("weather horizon uses forecast only up to seven days", () => {
  const now = new Date("2026-08-25T12:00:00Z");
  assertEquals(classifyWeatherHorizon("2026-09-01", now), "forecast");
  assertEquals(classifyWeatherHorizon("2026-09-02", now), "seasonal");
});

Deno.test("weather advice prioritizes indoor under high rain probability", () => {
  const advice = plannerAdvice({ precipitation_probability: 80, max_temp_c: 25, min_temp_c: 18, weather_main: "Rain" });
  assert(advice.includes("priorizar_indoor"));
});

Deno.test("forecast normalization converts pop to percentage", () => {
  const target = "2026-08-27";
  const dt = Math.floor(new Date(`${target}T00:00:00Z`).getTime() / 1000);
  const normalized = normalizeForecast(target, [{ dt, pop: 0.7, temp: { min: 12.4, max: 21.7 }, weather: [{ main: "Rain", description: "chuva" }] }]);
  assertEquals(normalized?.precipitation_probability, 70);
  assertEquals(normalized?.min_temp_c, 12.4);
  assertEquals(normalized?.max_temp_c, 21.7);
  assert(normalized?.planner_advice.includes("priorizar_indoor"));
});
