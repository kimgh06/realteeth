import { useState, useCallback } from "react";
import type { District } from "@/entities/location";

const STORAGE_KEY = "weather-recent-searches";
const MAX_RECENT = 5;

function load(): District[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [recents, setRecents] = useState<District[]>(load);

  const addRecent = useCallback((district: District) => {
    setRecents((prev) => {
      const filtered = prev.filter((d) => d.code !== district.code);
      const next = [district, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecents([]);
  }, []);

  return { recents, addRecent, clearRecents };
}
