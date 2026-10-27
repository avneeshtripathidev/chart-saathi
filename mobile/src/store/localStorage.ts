import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentSearchItem {
  id: string;
  trainNumber: string;
  trainName: string;
  boarding: string;
  destination: string;
  date: string;
  trainClass: string;
  vacantCount?: number;
  routeType: 'DIRECT' | 'INDIRECT';
  viaStation?: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  RECENT_SEARCHES: '@chartsaathi:recent_searches',
  FAVORITES: '@chartsaathi:favorites',
};

// In-memory fallback cache
let inMemorySearches: RecentSearchItem[] = [];
let inMemoryFavorites: string[] = [];

export async function loadRecentSearches(): Promise<RecentSearchItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemorySearches = parsed;
        return parsed;
      }
    }
  } catch {
    // Return in-memory fallback
  }
  return inMemorySearches;
}

export async function saveRecentSearch(item: Omit<RecentSearchItem, 'timestamp'>): Promise<void> {
  try {
    const current = await loadRecentSearches();
    const filtered = current.filter(
      (s) =>
        s.trainNumber !== item.trainNumber ||
        s.date !== item.date ||
        s.boarding !== item.boarding,
    );
    const updated: RecentSearchItem[] = [
      { ...item, timestamp: Date.now() },
      ...filtered,
    ].slice(0, 10);

    inMemorySearches = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
  } catch {
    // fallback in-memory only
  }
}

export async function clearRecentSearches(): Promise<void> {
  inMemorySearches = [];
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  } catch {
    // ignore
  }
}

export async function getFavoriteTrains(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryFavorites = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return inMemoryFavorites;
}

export async function toggleFavoriteTrain(trainNumber: string): Promise<boolean> {
  try {
    const favs = await getFavoriteTrains();
    const exists = favs.includes(trainNumber);
    const updated = exists
      ? favs.filter((t) => t !== trainNumber)
      : [...favs, trainNumber];

    inMemoryFavorites = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}
