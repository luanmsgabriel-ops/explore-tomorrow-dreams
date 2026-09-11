import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientAuthGuard } from "./ClientAuthGuard";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  maybeSingle: vi.fn(),
  signOut: vi.fn(),
  claim: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      signOut: mocks.signOut,
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mocks.maybeSingle })),
      })),
    })),
  },
}));

vi.mock("@/lib/tripComposerClaim", () => ({
  claimPendingTripComposerSession: mocks.claim,
}));

function renderGuard() {
  render(
    <MemoryRouter initialEntries={["/minha-area"]}>
      <Routes>
        <Route path="/cliente" element={<div>Login</div>} />
        <Route path="/minha-area" element={<ClientAuthGuard><div>Área protegida</div></ClientAuthGuard>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ClientAuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.claim.mockResolvedValue({ claimed: false });
  });

  it("allows a client role and attempts pending Trip Composer claim", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });
    mocks.maybeSingle.mockResolvedValue({ data: { role: "user" }, error: null });

    renderGuard();

    expect(await screen.findByText("Área protegida")).toBeInTheDocument();
    expect(mocks.claim).toHaveBeenCalledTimes(1);
  });

  it("signs out admin accounts and redirects them to client login", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "admin-1" } } } });
    mocks.maybeSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    mocks.signOut.mockResolvedValue({ error: null });

    renderGuard();

    expect(await screen.findByText("Login")).toBeInTheDocument();
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(mocks.claim).not.toHaveBeenCalled();
  });
});
