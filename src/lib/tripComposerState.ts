export type ComposerItem = {
  id: string;
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  kind: "experience" | "restaurant" | "transport" | "hotel" | "free_time" | "custom";
  sourceId?: string | null;
};

export type ComposerDay = {
  dayNumber: number;
  status: "planning" | "planned";
  items: ComposerItem[];
};

export type PreferenceSignal = {
  key: string;
  value: string;
  source: "declared" | "selected" | "rejected";
  weight: number;
};

export type ComposerState = {
  activeDay: number;
  days: ComposerDay[];
  preferences: PreferenceSignal[];
};

export type ComposerAction =
  | { type: "set_active_day"; dayNumber: number }
  | { type: "add_item"; dayNumber: number; item: ComposerItem; index?: number }
  | { type: "remove_item"; dayNumber: number; itemId: string }
  | { type: "move_item"; dayNumber: number; itemId: string; toIndex: number }
  | { type: "replace_item"; dayNumber: number; itemId: string; item: ComposerItem }
  | { type: "complete_day"; dayNumber: number }
  | { type: "reopen_day"; dayNumber: number }
  | { type: "record_preference"; signal: PreferenceSignal }
  | { type: "remove_preference"; key: string; value: string; source?: PreferenceSignal["source"] };

function updateDay(state: ComposerState, dayNumber: number, updater: (day: ComposerDay) => ComposerDay) {
  return {
    ...state,
    days: state.days.map((day) => day.dayNumber === dayNumber ? updater(day) : day),
  };
}

function clampIndex(index: number, length: number) {
  return Math.max(0, Math.min(index, length));
}

export function createComposerState(totalDays: number): ComposerState {
  const normalized = Math.max(1, Math.floor(totalDays));
  return {
    activeDay: 1,
    days: Array.from({ length: normalized }, (_, index) => ({ dayNumber: index + 1, status: "planning" as const, items: [] })),
    preferences: [],
  };
}

export function tripComposerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case "set_active_day": {
      if (!state.days.some((day) => day.dayNumber === action.dayNumber)) return state;
      return { ...state, activeDay: action.dayNumber };
    }
    case "add_item": {
      return updateDay(state, action.dayNumber, (day) => {
        if (day.items.some((item) => item.id === action.item.id)) return day;
        const next = [...day.items];
        const target = action.index == null ? next.length : clampIndex(action.index, next.length);
        next.splice(target, 0, action.item);
        return { ...day, items: next };
      });
    }
    case "remove_item": {
      return updateDay(state, action.dayNumber, (day) => ({ ...day, items: day.items.filter((item) => item.id !== action.itemId) }));
    }
    case "move_item": {
      return updateDay(state, action.dayNumber, (day) => {
        const current = day.items.findIndex((item) => item.id === action.itemId);
        if (current < 0) return day;
        const next = [...day.items];
        const [item] = next.splice(current, 1);
        next.splice(clampIndex(action.toIndex, next.length), 0, item);
        return { ...day, items: next };
      });
    }
    case "replace_item": {
      return updateDay(state, action.dayNumber, (day) => ({
        ...day,
        items: day.items.map((item) => item.id === action.itemId ? action.item : item),
      }));
    }
    case "complete_day": {
      const nextState = updateDay(state, action.dayNumber, (day) => ({ ...day, status: "planned" }));
      const nextOpen = nextState.days.find((day) => day.dayNumber > action.dayNumber && day.status === "planning");
      return nextOpen ? { ...nextState, activeDay: nextOpen.dayNumber } : nextState;
    }
    case "reopen_day": {
      return updateDay({ ...state, activeDay: action.dayNumber }, action.dayNumber, (day) => ({ ...day, status: "planning" }));
    }
    case "record_preference": {
      const incoming = action.signal;
      const declaredConflict = state.preferences.find((signal) =>
        signal.key === incoming.key && signal.source === "declared" && signal.value !== incoming.value
      );
      if (declaredConflict && incoming.source !== "declared") return state;

      const existingIndex = state.preferences.findIndex((signal) =>
        signal.key === incoming.key && signal.value === incoming.value && signal.source === incoming.source
      );
      if (existingIndex >= 0) {
        const next = [...state.preferences];
        next[existingIndex] = { ...next[existingIndex], weight: Math.max(next[existingIndex].weight, incoming.weight) };
        return { ...state, preferences: next };
      }

      if (incoming.source === "declared") {
        return {
          ...state,
          preferences: [
            ...state.preferences.filter((signal) => !(signal.key === incoming.key && signal.source !== "declared")),
            incoming,
          ],
        };
      }

      return { ...state, preferences: [...state.preferences, incoming] };
    }
    case "remove_preference": {
      return {
        ...state,
        preferences: state.preferences.filter((signal) => !(
          signal.key === action.key &&
          signal.value === action.value &&
          (action.source == null || signal.source === action.source)
        )),
      };
    }
    default:
      return state;
  }
}

export function getPreferenceScore(state: ComposerState, key: string, value: string) {
  return state.preferences
    .filter((signal) => signal.key === key && signal.value === value)
    .reduce((sum, signal) => {
      const direction = signal.source === "rejected" ? -1 : 1;
      const sourceMultiplier = signal.source === "declared" ? 3 : 1;
      return sum + direction * signal.weight * sourceMultiplier;
    }, 0);
}
