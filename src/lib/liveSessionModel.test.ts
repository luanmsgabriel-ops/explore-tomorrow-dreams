import { describe, expect, it } from "vitest";

import { deriveLiveSessionSnapshot } from "./liveSessionModel";

const base = {
  status: "idle" as const,
  connected: false,
  online: true,
  offerCount: 0,
  handoffReady: false,
  tripComposerActive: false,
  hasError: false,
};

describe("Tomorrow Live canonical journey", () => {
  it("prioriza bloqueios operacionais antes dos demais estados", () => {
    expect(deriveLiveSessionSnapshot({ ...base, online: false, offerCount: 3 }).stage).toBe("offline");
    expect(deriveLiveSessionSnapshot({ ...base, hasError: true, offerCount: 3 }).stage).toBe("error");
  });

  it("prioriza handoff e roteiro sobre a simples presença de ofertas", () => {
    expect(deriveLiveSessionSnapshot({ ...base, offerCount: 3, tripComposerActive: true }).stage).toBe("planning");
    expect(deriveLiveSessionSnapshot({ ...base, offerCount: 3, tripComposerActive: true, handoffReady: true }).stage).toBe("handoff");
  });

  it("traduz voz, busca e resultados em uma única sequência compreensível", () => {
    expect(deriveLiveSessionSnapshot({ ...base, status: "connecting" }).stage).toBe("connecting");
    expect(deriveLiveSessionSnapshot({ ...base, status: "listening", connected: true }).stage).toBe("conversation");
    expect(deriveLiveSessionSnapshot({ ...base, status: "thinking", connected: true }).stage).toBe("searching");
    expect(deriveLiveSessionSnapshot({ ...base, status: "offers", connected: true, offerCount: 2 })).toMatchObject({
      stage: "reviewing",
      label: "2 oportunidades encontradas",
    });
  });
});
