import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LiveWaveBackdrop } from "./LiveWaveBackdrop";

const contextMock = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  setLineDash: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  globalCompositeOperation: "source-over",
  strokeStyle: "",
  fillStyle: "",
  lineWidth: 1,
  shadowColor: "",
  shadowBlur: 0,
  lineDashOffset: 0,
} as unknown as CanvasRenderingContext2D;

describe("LiveWaveBackdrop", () => {
  let getContextSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => contextMock);
  });

  afterEach(() => {
    getContextSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("usa a intensidade visual padrão de cada estado", () => {
    const { container, rerender } = render(<LiveWaveBackdrop state="idle" reducedMotion />);
    expect(container.firstElementChild).toHaveAttribute("data-wave-state", "idle");
    expect(container.firstElementChild).toHaveAttribute("data-audio-level", "0.14");
    expect(container.firstElementChild).toHaveAttribute("data-wave-engine", "canvas2d");
    expect(container.firstElementChild).toHaveAttribute("data-wave-lines", "12");

    rerender(<LiveWaveBackdrop state="speaking" reducedMotion />);
    expect(container.firstElementChild).toHaveAttribute("data-wave-state", "speaking");
    expect(container.firstElementChild).toHaveAttribute("data-audio-level", "0.86");
  });

  it("aceita nível de áudio normalizado sem ativar captura de microfone", () => {
    const { container } = render(
      <LiveWaveBackdrop state="listening" audioLevel={0.63} reducedMotion />,
    );

    expect(container.firstElementChild).toHaveAttribute("data-audio-level", "0.63");
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("reduz a densidade das ondas no modo de baixo desempenho", () => {
    const { container } = render(
      <LiveWaveBackdrop state="listening" lowPerformance reducedMotion />,
    );

    expect(container.firstElementChild).toHaveAttribute("data-wave-lines", "7");
  });

  it("limita níveis externos ao intervalo de zero a um", () => {
    const { container, rerender } = render(
      <LiveWaveBackdrop state="speaking" audioLevel={4} reducedMotion />,
    );
    expect(container.firstElementChild).toHaveAttribute("data-audio-level", "1.00");

    rerender(<LiveWaveBackdrop state="idle" audioLevel={-2} reducedMotion />);
    expect(container.firstElementChild).toHaveAttribute("data-audio-level", "0.00");
  });
});
