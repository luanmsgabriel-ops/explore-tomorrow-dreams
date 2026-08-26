import { describe, expect, it } from "vitest";

import {
  isTripComposerTool,
  parseTripComposerTool,
  recommendationsToExperiences,
  snapshotToDays,
} from "@/lib/tripComposerRealtime";

describe("tripComposerRealtime", () => {
  it("parses a planning tool call", () => {
    const call = {
      callId: "call-1",
      name: "plan_trip_window",
      arguments: JSON.stringify({
        destination: "Santiago",
        search: "vinícola",
        date: "2026-09-10",
        available_minutes: 360,
        day_number: 2,
        total_days: 5,
        preferences: ["gastronomia"],
      }),
    };
    expect(isTripComposerTool(call)).toBe(true);
    const parsed = parseTripComposerTool(call);
    expect(parsed.name).toBe("plan_trip_window");
    if (parsed.name === "plan_trip_window") {
      expect(parsed.request.day_number).toBe(2);
      expect(parsed.request.destination).toBe("Santiago");
    }
  });

  it("maps factual recommendations into visual cards without inventing media", () => {
    const cards = recommendationsToExperiences([{
      id: "rec-1",
      score: 0.91,
      reasons: ["Boa aderência"],
      candidate: {
        id: "place-1",
        title: "Museu real",
        categories: ["cultura"],
        latitude: -23,
        longitude: -46,
        duration_minutes: 90,
        factual_snapshot: { summary: "Descrição factual" },
        media: [{ url: "https://example.com/photo.jpg", attribution: "Fonte" }],
      },
    }]);
    expect(cards).toHaveLength(1);
    expect(cards[0].photos).toEqual([{ url: "https://example.com/photo.jpg", attribution: "Fonte" }]);
  });

  it("maps persisted multi-day snapshot into timeline", () => {
    const days = snapshotToDays({
      session: {},
      days: [
        { day_number: 1, date: "2026-09-10", status: "completed" },
        { day_number: 2, date: "2026-09-11", status: "planning" },
      ],
      items: [{ id: "item-1", day_number: 1, title: "Passeio", starts_at: "09:00", ends_at: "11:00" }],
      preferences: [],
    });
    expect(days).toHaveLength(2);
    expect(days[0].status).toBe("planned");
    expect(days[0].items[0].title).toBe("Passeio");
  });
});
