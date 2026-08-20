import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tomorrow-opportunity-favorites-v1";
const MAX_FAVORITES = 100;

function readFavorites() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((value): value is string => typeof value === "string").slice(0, MAX_FAVORITES));
  } catch {
    return new Set<string>();
  }
}

export function useOpportunityFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(readFavorites);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites].slice(0, MAX_FAVORITES)));
    } catch {
      // Favoritos continuam disponíveis na sessão mesmo quando o armazenamento está indisponível.
    }
  }, [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_FAVORITES) next.add(id);
      return next;
    });
  }, []);

  return {
    favorites,
    favoriteCount: favorites.size,
    isFavorite: (id: string) => favorites.has(id),
    toggleFavorite,
  };
}
