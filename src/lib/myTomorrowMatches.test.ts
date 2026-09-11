import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));

import { listMyRadarMatches, runMyRadarMatching } from "./myTomorrowMatches";

describe("myTomorrowMatches", () => {
  beforeEach(() => mocks.invoke.mockReset());

  it("runs matching only through authenticated function boundary", async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true, result: { radar_id: "r1", matches: 2, exact: 1, flexible: 1, discovery: 0 } }, error: null });
    const result = await runMyRadarMatching("r1");
    expect(mocks.invoke).toHaveBeenCalledWith("my-tomorrow-matching", { body: { action: "run", radarId: "r1" } });
    expect(result.matches).toBe(2);
  });

  it("lists persisted matches through the same function", async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true, matches: [{ id: "m1", match_class: "exact" }] }, error: null });
    const matches = await listMyRadarMatches("r1");
    expect(mocks.invoke).toHaveBeenCalledWith("my-tomorrow-matching", { body: { action: "list", radarId: "r1" } });
    expect(matches[0].match_class).toBe("exact");
  });
});
