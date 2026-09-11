import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { deriveLiveSessionSnapshot } from "@/lib/liveSessionModel";
import { LiveSessionCockpit } from "./LiveSessionCockpit";

const snapshot = deriveLiveSessionSnapshot({
  status: "offers",
  connected: true,
  online: true,
  offerCount: 1,
  handoffReady: false,
  tripComposerActive: false,
  hasError: false,
});

const commonProps = {
  snapshot,
  routes: [],
  offerCount: 1,
  transcript: [],
  connected: true,
  notice: "Preço e disponibilidade sujeitos à confirmação.",
};

describe("LiveSessionCockpit", () => {
  it("não afirma que o inventário inteiro foi atualizado a partir da data de uma oferta", () => {
    render(<LiveSessionCockpit {...commonProps} latestInventoryUpdate="2026-09-11T15:00:00Z" />);

    expect(screen.getByText(/Oferta mais recente atualizada em 11\/09\/2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Inventário atualizado/)).not.toBeInTheDocument();
  });

  it("declara quando o horário não está disponível em vez de presumir atualização", () => {
    render(<LiveSessionCockpit {...commonProps} latestInventoryUpdate={null} />);

    expect(screen.getByText("Horário de atualização não informado.")).toBeInTheDocument();
    expect(screen.queryByText(/Atualização confirmada/)).not.toBeInTheDocument();
  });
});
