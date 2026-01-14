const CACHE_KEY = 'itinerary_cache';
const CACHE_EXPIRY_HOURS = 24 * 7; // 7 dias

interface CachedItinerary {
  destination: string;
  preferences: string;
  itinerary: string;
  actualDestination: string;
  createdAt: number;
}

interface ItineraryCache {
  [key: string]: CachedItinerary;
}

// Gera uma chave única baseada no destino e preferências
const generateCacheKey = (destination: string, preferences: string): string => {
  const normalizedDestination = destination.toLowerCase().trim();
  const normalizedPreferences = preferences.toLowerCase().trim();
  return `${normalizedDestination}::${normalizedPreferences}`;
};

// Verifica se o cache ainda é válido
const isCacheValid = (createdAt: number): boolean => {
  const now = Date.now();
  const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
  return (now - createdAt) < expiryTime;
};

// Carrega o cache do localStorage
const loadCache = (): ItineraryCache => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return {};
    return JSON.parse(cached);
  } catch {
    console.warn('Erro ao carregar cache de roteiros');
    return {};
  }
};

// Salva o cache no localStorage
const saveCache = (cache: ItineraryCache): void => {
  try {
    // Limpa entradas expiradas antes de salvar
    const cleanedCache: ItineraryCache = {};
    for (const [key, value] of Object.entries(cache)) {
      if (isCacheValid(value.createdAt)) {
        cleanedCache[key] = value;
      }
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cleanedCache));
  } catch (error) {
    console.warn('Erro ao salvar cache de roteiros:', error);
  }
};

// Busca um roteiro no cache
export const getCachedItinerary = (
  destination: string,
  preferences: string
): CachedItinerary | null => {
  const cache = loadCache();
  const key = generateCacheKey(destination, preferences);
  const cached = cache[key];
  
  if (cached && isCacheValid(cached.createdAt)) {
    console.log('✅ Roteiro encontrado no cache:', key);
    return cached;
  }
  
  return null;
};

// Salva um roteiro no cache
export const setCachedItinerary = (
  destination: string,
  preferences: string,
  itinerary: string,
  actualDestination: string
): void => {
  const cache = loadCache();
  const key = generateCacheKey(destination, preferences);
  
  cache[key] = {
    destination,
    preferences,
    itinerary,
    actualDestination,
    createdAt: Date.now(),
  };
  
  saveCache(cache);
  console.log('💾 Roteiro salvo no cache:', key);
};

// Limpa todo o cache
export const clearItineraryCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Cache de roteiros limpo');
  } catch {
    console.warn('Erro ao limpar cache de roteiros');
  }
};

// Retorna estatísticas do cache
export const getCacheStats = (): { count: number; size: string } => {
  const cache = loadCache();
  const validCount = Object.values(cache).filter(c => isCacheValid(c.createdAt)).length;
  const size = new Blob([JSON.stringify(cache)]).size;
  const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} bytes`;
  
  return { count: validCount, size: sizeStr };
};
