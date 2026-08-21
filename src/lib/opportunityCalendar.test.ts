import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
}));

import {
  buildCalendarMonth,
  calculatePriceBands,
  calendarForwardWindow,
  calendarSearchWindow,
  daysBetween,
  fetchOpportunityCalendar,
  monthEnd,
  priceBand,
  singleCalendarCurrency,
} from "./opportunityCalendar";

describe("calendário inteligente de oportunidades", () => {
  beforeEach(() => invoke.mockReset());

  it("consulta somente a ação pública calendar", async () => {
    const response = {
      start_date: "2026-08-16",
      end_date: "2026-12-14",
      passengers: 2,
      total_options: 0,
      dates: [],
      updated_at: "2026-08-20T21:00:00Z",
      notice: "Confirmação necessária",
    };
    invoke.mockResolvedValue({ data: response, error: null });

    await expect(fetchOpportunityCalendar({
      origin: "São Paulo",
      destination: "Recife",
      start_date: "2026-08-16",
      end_date: "2026-12-14",
      passengers: 2,
    })).resolves.toBe(response);

    expect(invoke).toHaveBeenCalledWith("travel-offers-public", {
      body: {
        action: "calendar",
        params: {
          origin: "São Paulo",
          destination: "Recife",
          start_date: "2026-08-16",
          end_date: "2026-12-14",
          passengers: 2,
        },
      },
      signal: undefined,
      timeout: 15_000,
    });
  });

  it("preserva a janela legada de 120 dias sem usá-la como requisito da interface", () => {
    const window = calendarSearchWindow("2026-10-15");
    expect(window).toEqual({ startDate: "2026-08-16", endDate: "2026-12-14" });
    expect(daysBetween(window.startDate, window.endDate)).toBe(120);
  });

  it("gera janelas progressivas de no máximo 120 dias e respeita o fim real da rota", () => {
    const first = calendarForwardWindow("2026-09-10");
    expect(first).toEqual({ startDate: "2026-09-10", endDate: "2027-01-08" });
    expect(daysBetween(first.startDate, first.endDate)).toBe(120);

    expect(calendarForwardWindow("2026-09-10", "2026-11-20")).toEqual({
      startDate: "2026-09-10",
      endDate: "2026-11-20",
    });
  });

  it("calcula o último dia do mês para carregar a próxima janela apenas quando necessário", () => {
    expect(monthEnd("2026-02-15")).toBe("2026-02-28");
    expect(monthEnd("2028-02-01")).toBe("2028-02-29");
  });

  it("monta grade mensal fixa de seis semanas", () => {
    const cells = buildCalendarMonth("2026-09-18");
    expect(cells).toHaveLength(42);
    expect(cells.some((cell) => cell.date === "2026-09-01" && cell.inMonth)).toBe(true);
    expect(cells.some((cell) => !cell.inMonth)).toBe(true);
  });

  it("classifica preços em três faixas sem alterar valores", () => {
    const bands = calculatePriceBands([100, 200, 300, 400, 500, 600]);
    expect(bands).toEqual({ cheapMax: 200, midMax: 400 });
    expect(priceBand(150, bands)).toBe("cheap");
    expect(priceBand(300, bands)).toBe("mid");
    expect(priceBand(500, bands)).toBe("high");
  });

  it("só assume moeda quando as facetas possuem uma única moeda explícita", () => {
    expect(singleCalendarCurrency([{ currency: "BRL", min: 100, max: 500 }])).toBe("BRL");
    expect(singleCalendarCurrency([
      { currency: "BRL", min: 100, max: 500 },
      { currency: "USD", min: 50, max: 300 },
    ])).toBeNull();
  });
});
