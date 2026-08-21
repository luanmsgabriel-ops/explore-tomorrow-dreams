import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveWaveBackdrop } from "./LiveWaveBackdrop";

describe("LiveWaveBackdrop", () => {
  it("usa a intensidade visual padrão de cada estado", () => {
    const { container, rerender } = render(<LiveWaveBackdrop state="idle" reducedMotion />);
    expect(container.firstElementChild).toHaveAttribute("data-wave-state", "idle");
    expect(container.firstElementChild).toHaveAttribute("data-audio-level", "0.14");

    rerender(<LiveWaveBackdrop state="speaking" reducedMotion />);
    expect(container.firstElementChild).toHaveAttribute("data-wave-state", "speaking");
    expect(container.firstElementChild).toHaveAttribute("data-audio-level", "0.86");
  });

  it("aceita nível de áudio normalizado sem ativar captura de microfone", () => {
    const { container } = render(
      <LiveWaveBackdrop state="listening" audioLevel={0.63} reducedMotion />,
    );

    expect(container.firstElementChild).toHaveAttribute("data-audio-level", "0.63");
    expect(container.querySelectorAll("animate")).toHaveLength(0);
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
