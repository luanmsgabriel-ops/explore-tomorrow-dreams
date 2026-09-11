import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke },
  },
}));

import { createPlanningTrip, listMyTomorrowTrips, updatePlanningTrip } from "./myTomorrowTrips";

describe("myTomorrowTrips", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("lists unified trips through the authenticated backend boundary", async () => {
    invoke.mockResolvedValue({
      data: { ok: true, trips: [{ id: "p1", kind: "planning", destinationName: "Santiago", stage: "planning" }] },
      error: null,
    });

    const trips = await listMyTomorrowTrips();

    expect(invoke).toHaveBeenCalledWith("my-tomorrow-trips", { body: { action: "list" } });
    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe("p1");
  });

  it("creates planning trips without writing directly to public tables", async () => {
    invoke.mockResolvedValue({ data: { ok: true, trip: { id: "p2", kind: "planning", stage: "dreaming" } }, error: null });

    const trip = await createPlanningTrip({ destinationName: "Roma", stage: "dreaming" });

    expect(invoke).toHaveBeenCalledWith("my-tomorrow-trips", {
      body: { action: "create", input: { destinationName: "Roma", stage: "dreaming" } },
    });
    expect(trip.id).toBe("p2");
  });

  it("sends only the fields supplied by an update caller", async () => {
    invoke.mockResolvedValue({ data: { ok: true, trip: { id: "p3", kind: "planning", stage: "researching" } }, error: null });

    await updatePlanningTrip("p3", { stage: "researching" });

    expect(invoke).toHaveBeenCalledWith("my-tomorrow-trips", {
      body: { action: "update", tripId: "p3", input: { stage: "researching" } },
    });
  });
});
