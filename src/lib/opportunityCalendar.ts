import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  TravelOffersPublicError,
  type PublicOfferSubtype,
  type PublicOfferType,
} from "@/lib/travelOffersPublic";

const DAY_MS = 86_400_000;

export interface OpportunityCalendarParams {
  origin?: string;
  origin_iata?: string;
  destination?: string;
  destination_iata?: string;
  start_date: string;
  end_date: string;
  passengers: number;
  offer_type?: PublicOfferType;
}

export interface OpportunityCalendarDate {
  date: string;
  min_price_per_person: number;
  tax_per_person: number | null;
  offer_type: PublicOfferType;
  offer_subtype: PublicOfferSubtype;
  options_count: number;
  min_available_seats: number | null;
  origin_iata: string | null;
  destination_iata: string | null;
  best_option_id: string;
}

export interface OpportunityCalendarResponse {
  start_date: string;
  end_date: string;
  passengers: number;
  total_options: number;
  dates: OpportunityCalendarDate[];
  updated_at: string;
  notice: string;
}

type FunctionErrorBody = {
  error?: { code?: string; message?: string };
  request_id?: string;
};

async function calendarError(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json() as FunctionErrorBody;
      return new TravelOffersPublicError(
        body.error?.message ?? "Não foi possível consultar o calendário.",
        body.error?.code ?? "request_failed",
        body.request_id ?? null,
      );
    } catch {
      return new TravelOffersPublicError("Não foi possível consultar o calendário.");
    }
  }

  return new TravelOffersPublicError("Não foi possível consultar o calendário agora.");
}

export async function fetchOpportunityCalendar(
  params: OpportunityCalendarParams,
  signal?: AbortSignal,
): Promise<OpportunityCalendarResponse> {
  const { data, error } = await supabase.functions.invoke<OpportunityCalendarResponse>(
    "travel-offers-public",
    {
      body: { action: "calendar", params },
      signal,
      timeout: 15_000,
    },
  );

  if (error) throw await calendarError(error);
  if (!data || typeof data !== "object" || !Array.isArray(data.dates)) {
    throw new TravelOffersPublicError(
      "O calendário retornou uma resposta inválida.",
      "invalid_response",
    );
  }

  return data;
}

export function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function shiftDate(value: string, days: number) {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

export function calendarSearchWindow(anchorDate: string) {
  if (!isIsoDate(anchorDate)) throw new Error("Data de referência inválida.");
  return {
    startDate: shiftDate(anchorDate, -60),
    endDate: shiftDate(anchorDate, 60),
  };
}

export function daysBetween(startDate: string, endDate: string) {
  return Math.round((parseIsoDate(endDate).getTime() - parseIsoDate(startDate).getTime()) / DAY_MS);
}

export function monthStart(value: string) {
  const date = parseIsoDate(value);
  date.setUTCDate(1);
  return toIsoDate(date);
}

export function shiftMonth(value: string, months: number) {
  const date = parseIsoDate(monthStart(value));
  date.setUTCMonth(date.getUTCMonth() + months);
  return toIsoDate(date);
}

export interface CalendarMonthCell {
  date: string;
  day: number;
  inMonth: boolean;
}

export function buildCalendarMonth(value: string): CalendarMonthCell[] {
  const firstDay = parseIsoDate(monthStart(value));
  const gridStart = new Date(firstDay);
  gridStart.setUTCDate(gridStart.getUTCDate() - firstDay.getUTCDay());

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setUTCDate(gridStart.getUTCDate() + index);
    return {
      date: toIsoDate(current),
      day: current.getUTCDate(),
      inMonth: current.getUTCMonth() === firstDay.getUTCMonth() && current.getUTCFullYear() === firstDay.getUTCFullYear(),
    };
  });
}

export function monthIntersectsWindow(month: string, startDate: string, endDate: string) {
  const first = monthStart(month);
  const nextMonth = shiftMonth(first, 1);
  const last = shiftDate(nextMonth, -1);
  return last >= startDate && first <= endDate;
}

export interface PriceBands {
  cheapMax: number;
  midMax: number;
}

export type PriceBand = "cheap" | "mid" | "high";

export function calculatePriceBands(values: number[]): PriceBands | null {
  const sorted = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (ratio: number) => Math.floor((sorted.length - 1) * ratio);
  return {
    cheapMax: sorted[index(0.33)],
    midMax: sorted[index(0.66)],
  };
}

export function priceBand(value: number, bands: PriceBands | null): PriceBand {
  if (!bands || value <= bands.cheapMax) return "cheap";
  if (value <= bands.midMax) return "mid";
  return "high";
}

export function singleCalendarCurrency(
  priceRanges: Array<{ currency: string | null; min: number; max: number }> | undefined,
) {
  const currencies = [...new Set((priceRanges ?? []).map((range) => range.currency).filter((currency): currency is string => Boolean(currency)))];
  return currencies.length === 1 ? currencies[0] : null;
}
