import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));

import { createMyRadar, deleteMyRadar, listMyRadars, setMyRadarStatus, updateMyRadar } from "./myTomorrowRadars";

describe("myTomorrowRadars", () => {
  beforeEach(() => mocks.invoke.mockReset());

  it("lists radars through authenticated function boundary", async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true, radars: [{ id: "r1", name: "Beto Carrero" }] }, error: null });
    const radars = await listMyRadars();
    expect(mocks.invoke).toHaveBeenCalledWith("my-tomorrow-radars", { body: { action: "list" } });
    expect(radars[0].id).toBe("r1");
  });

  it("creates a radar with exact input", async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true, radar: { id: "r2" } }, error: null });
    await createMyRadar({ name: "Orlando", destination: "Orlando", passengers: 3 });
    expect(mocks.invoke).toHaveBeenCalledWith("my-tomorrow-radars", { body: { action: "create", input: { name: "Orlando", destination: "Orlando", passengers: 3 } } });
  });

  it("updates only supplied fields and can pause", async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true, radar: { id: "r3" } }, error: null });
    await updateMyRadar("r3", { flexibility_days: 7 });
    expect(mocks.invoke).toHaveBeenNthCalledWith(1, "my-tomorrow-radars", { body: { action: "update", radarId: "r3", input: { flexibility_days: 7 } } });
    await setMyRadarStatus("r3", "pause");
    expect(mocks.invoke).toHaveBeenNthCalledWith(2, "my-tomorrow-radars", { body: { action: "pause", radarId: "r3" } });
  });

  it("uses soft delete", async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    await deleteMyRadar("r4");
    expect(mocks.invoke).toHaveBeenCalledWith("my-tomorrow-radars", { body: { action: "delete", radarId: "r4" } });
  });
});
