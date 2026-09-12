import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RadarSignalGlobe } from "./RadarSignalGlobe";

describe("RadarSignalGlobe", () => {
  it("exibe a quantidade real de sinais ativos", () => {
    render(<RadarSignalGlobe signals={38} />);
    expect(screen.getByLabelText("38 sinais ativos")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument();
  });

  it("mantém o estado de varredura sem alterar a contagem", () => {
    render(<RadarSignalGlobe signals={0} scanning />);
    expect(screen.getByLabelText("0 sinais ativos")).toBeInTheDocument();
  });
});
