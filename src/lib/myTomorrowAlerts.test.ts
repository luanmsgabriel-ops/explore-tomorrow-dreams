import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));

import { countUnreadRadarAlerts, markAllRadarAlertsRead, markRadarAlertRead } from "./myTomorrowAlerts";

describe("myTomorrowAlerts", () => {
  beforeEach(() => mocks.from.mockReset());

  it("counts unread alerts using RLS-bound query", async () => {
    const is = vi.fn().mockResolvedValue({ count: 3, error: null });
    const select = vi.fn().mockReturnValue({ is });
    mocks.from.mockReturnValue({ select });
    await expect(countUnreadRadarAlerts()).resolves.toBe(3);
    expect(mocks.from).toHaveBeenCalledWith("travel_radar_alerts");
    expect(is).toHaveBeenCalledWith("read_at", null);
  });

  it("marks one alert read without changing ownership", async () => {
    const is = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn().mockReturnValue({ is });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ update });
    await markRadarAlertRead("alert-1");
    expect(eq).toHaveBeenCalledWith("id", "alert-1");
  });

  it("marks all unread alerts read", async () => {
    const is = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ is });
    mocks.from.mockReturnValue({ update });
    await markAllRadarAlertsRead();
    expect(is).toHaveBeenCalledWith("read_at", null);
  });
});
