import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveTranscriptDrawer } from "./LiveTranscriptDrawer";

describe("LiveTranscriptDrawer", () => {
  it("permanece compacto até o cliente solicitar a transcrição completa", () => {
    render(<LiveTranscriptDrawer connected entries={[
      { id: "1", role: "user", text: "Quero viajar para Recife.", final: true },
      { id: "2", role: "assistant", text: "Vou buscar opções reais.", final: true },
    ]} />);

    const trigger = screen.getByRole("button", { name: /Legendas da conversa/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
    expect(within(trigger).getByText(/Téo: Vou buscar opções reais/)).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("log")).toHaveTextContent("Quero viajar para Recife");
    expect(screen.getByRole("log")).toHaveTextContent("Vou buscar opções reais");
  });

  it("explica o estado vazio sem afirmar que existe gravação local", () => {
    render(<LiveTranscriptDrawer connected={false} entries={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /Legendas da conversa/ }));

    expect(screen.getByText(/A transcrição aparecerá aqui/)).toBeInTheDocument();
    expect(screen.getByText(/não grava a transcrição no armazenamento local/)).toBeInTheDocument();
  });
});
