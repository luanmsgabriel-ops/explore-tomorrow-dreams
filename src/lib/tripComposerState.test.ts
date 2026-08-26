import { describe, expect, it } from "vitest";
import { createComposerState, getPreferenceScore, tripComposerReducer } from "./tripComposerState";

const item = (id: string, title = id) => ({ id, title, kind: "experience" as const });

describe("tripComposerReducer", () => {
  it("adds, moves, replaces and removes items without duplicating ids", () => {
    let state = createComposerState(2);
    state = tripComposerReducer(state, { type: "add_item", dayNumber: 1, item: item("a") });
    state = tripComposerReducer(state, { type: "add_item", dayNumber: 1, item: item("b") });
    state = tripComposerReducer(state, { type: "add_item", dayNumber: 1, item: item("a") });
    expect(state.days[0].items.map((entry) => entry.id)).toEqual(["a", "b"]);

    state = tripComposerReducer(state, { type: "move_item", dayNumber: 1, itemId: "b", toIndex: 0 });
    expect(state.days[0].items.map((entry) => entry.id)).toEqual(["b", "a"]);

    state = tripComposerReducer(state, { type: "replace_item", dayNumber: 1, itemId: "a", item: item("c", "Nova opção") });
    expect(state.days[0].items[1].title).toBe("Nova opção");

    state = tripComposerReducer(state, { type: "remove_item", dayNumber: 1, itemId: "b" });
    expect(state.days[0].items.map((entry) => entry.id)).toEqual(["c"]);
  });

  it("completes one day and advances to the next planning day", () => {
    let state = createComposerState(3);
    state = tripComposerReducer(state, { type: "complete_day", dayNumber: 1 });
    expect(state.days[0].status).toBe("planned");
    expect(state.activeDay).toBe(2);

    state = tripComposerReducer(state, { type: "reopen_day", dayNumber: 1 });
    expect(state.days[0].status).toBe("planning");
    expect(state.activeDay).toBe(1);
  });

  it("gives declared preferences precedence over inferred conflicting signals", () => {
    let state = createComposerState(1);
    state = tripComposerReducer(state, {
      type: "record_preference",
      signal: { key: "ritmo", value: "tranquilo", source: "declared", weight: 10 },
    });
    state = tripComposerReducer(state, {
      type: "record_preference",
      signal: { key: "ritmo", value: "intenso", source: "selected", weight: 20 },
    });
    expect(state.preferences).toHaveLength(1);
    expect(getPreferenceScore(state, "ritmo", "tranquilo")).toBe(30);
  });

  it("scores repeated selections positively and rejections negatively", () => {
    let state = createComposerState(1);
    state = tripComposerReducer(state, {
      type: "record_preference",
      signal: { key: "categoria", value: "natureza", source: "selected", weight: 8 },
    });
    state = tripComposerReducer(state, {
      type: "record_preference",
      signal: { key: "categoria", value: "shopping", source: "rejected", weight: 7 },
    });
    expect(getPreferenceScore(state, "categoria", "natureza")).toBe(8);
    expect(getPreferenceScore(state, "categoria", "shopping")).toBe(-7);
  });
});
