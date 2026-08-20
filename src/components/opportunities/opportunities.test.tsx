import { fireEvent, render, screen } from "@testing-library/react";
import { MapPin } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { OpportunityCard } from "./OpportunityCard";
import { OpportunityHeader } from "./OpportunityHeader";
import { OpportunityButton, OpportunityField } from "./OpportunityPrimitives";
import { OpportunityState } from "./OpportunityState";

describe("Tomorrow Live design system", () => {
  it("preserva semântica e acessibilidade do botão quando usado como link", () => {
    render(
      <OpportunityButton asChild>
        <a href="/oportunidades/catalogo">Abrir catálogo</a>
      </OpportunityButton>,
    );

    expect(screen.getByRole("link", { name: "Abrir catálogo" })).toHaveAttribute("href", "/oportunidades/catalogo");
  });

  it("associa label, orientação e erro ao campo", () => {
    render(
      <OpportunityField
        label="Origem"
        hint="Cidade ou aeroporto"
        error="Informe uma origem válida"
        leadingIcon={<MapPin />}
      />,
    );

    const field = screen.getByRole("textbox", { name: "Origem" });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field.getAttribute("aria-describedby")).toContain("hint");
    expect(field.getAttribute("aria-describedby")).toContain("error");
  });

  it("não inventa vagas nem preço quando o pacote não informa esses campos", () => {
    render(
      <OpportunityCard
        id="package-1"
        kind="package"
        title="João Pessoa"
        destination="João Pessoa"
        airfareIncluded={false}
        availableSeats={null}
        pricePerPerson={null}
        actionHref="/oportunidades/oferta/package-1"
      />,
    );

    expect(screen.queryByText(/vagas/i)).not.toBeInTheDocument();
    expect(screen.getByText("Aéreo não incluído")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("exibe preço e estoque reais quando recebidos", () => {
    render(
      <OpportunityCard
        id="air-1"
        kind="air_block"
        origin="São Paulo"
        originIata="GRU"
        destination="Recife"
        destinationIata="REC"
        availableSeats={5}
        pricePerPerson={1299.9}
        taxPerPerson={89.5}
        actionHref="/oportunidades/oferta/air-1"
      />,
    );

    expect(screen.getByText("5 vagas")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.299,90")).toBeInTheDocument();
    expect(screen.getByText("Taxa: R$ 89,50")).toBeInTheDocument();
  });

  it("abre, identifica e fecha a navegação móvel por teclado", () => {
    render(
      <OpportunityHeader
        activeHref="/oportunidades"
        navItems={[
          { label: "Início", href: "/oportunidades" },
          { label: "Catálogo", href: "/oportunidades/catalogo" },
        ]}
      />,
    );

    const toggle = screen.getByRole("button", { name: "Abrir navegação" });
    fireEvent.click(toggle);
    expect(screen.getByRole("navigation", { name: "Navegação móvel de oportunidades" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Início" })[0]).toHaveAttribute("aria-current", "page");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "Navegação móvel de oportunidades" })).not.toBeInTheDocument();
  });

  it("anuncia carregamento e falha com papéis adequados", () => {
    const { rerender } = render(<OpportunityState state="loading" />);
    expect(screen.getByRole("status")).toHaveTextContent("Buscando oportunidades");

    const retry = vi.fn();
    rerender(<OpportunityState state="error" actionLabel="Tentar novamente" onAction={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(retry).toHaveBeenCalledOnce();
  });
});
