import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));

import { answerTravelPreference, getTravelProfile, resetTravelPreferences, updateTravelProfile } from "./myTomorrowProfile";

describe("myTomorrowProfile", () => {
  beforeEach(() => mocks.invoke.mockReset());

  it("reads profile state only through the authenticated Edge Function", async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true, profile: null, affinities: [], latestAnswers: {} }, error: null });
    const state = await getTravelProfile();
    expect(mocks.invoke).toHaveBeenCalledWith("my-tomorrow-profile", { body: { action: "get" } });
    expect(state.affinities).toEqual([]);
  });

  it("sends explicit profile fields without direct table writes", async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true, profile: { home_origin_name: "São Paulo" } }, error: null });
    await updateTravelProfile({ homeOriginName: "São Paulo", homeOriginIata: "GRU", onboardingCompleted: true });
    expect(mocks.invoke).toHaveBeenCalledWith("my-tomorrow-profile", {
      body: { action: "update_profile", profile: { homeOriginName: "São Paulo", homeOriginIata: "GRU", onboardingCompleted: true } },
    });
  });

  it("persists category answers as explicit signals", async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    await answerTravelPreference("praia", "want");
    expect(mocks.invoke).toHaveBeenCalledWith("my-tomorrow-profile", { body: { action: "answer", preferenceKey: "praia", response: "want" } });
  });

  it("resets preferences through a revocation action", async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    await resetTravelPreferences();
    expect(mocks.invoke).toHaveBeenCalledWith("my-tomorrow-profile", { body: { action: "reset_preferences" } });
  });
});
