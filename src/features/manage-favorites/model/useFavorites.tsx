import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { MAX_FAVORITES } from "@/shared/config";
import type { Favorite } from "@/entities/location";

const STORAGE_KEY = "weather-favorites";

interface PendingDelete {
  item: Favorite;
  index: number;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface FavoritesContextValue {
  favorites: Favorite[];
  addFavorite: (item: Omit<Favorite, "id" | "alias">) => boolean;
  removeFavorite: (id: string) => Favorite | null;
  undoDelete: () => void;
  updateAlias: (id: string, alias: string) => void;
  isFavorite: (lat: number, lon: number) => boolean;
  reorderFavorites: (reordered: Favorite[]) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function loadFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: Favorite[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>(loadFavorites);
  const pendingRef = useRef<PendingDelete | null>(null);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const addFavorite = useCallback(
    (item: Omit<Favorite, "id" | "alias">): boolean => {
      if (favorites.length >= MAX_FAVORITES) return false;
      if (favorites.some((f) => f.lat === item.lat && f.lon === item.lon))
        return false;

      setFavorites((prev) => [
        ...prev,
        { ...item, id: crypto.randomUUID(), alias: item.name },
      ]);
      return true;
    },
    [favorites],
  );

  const removeFavorite = useCallback(
    (id: string): Favorite | null => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timeoutId);
        pendingRef.current = null;
      }

      const index = favorites.findIndex((f) => f.id === id);
      if (index === -1) return null;
      const item = favorites[index]!;

      setFavorites((prev) => prev.filter((f) => f.id !== id));

      const timeoutId = setTimeout(() => {
        pendingRef.current = null;
      }, 5000);

      pendingRef.current = { item, index, timeoutId };
      return item;
    },
    [favorites],
  );

  const undoDelete = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingRef.current = null;

    setFavorites((prev) => {
      const next = [...prev];
      const insertAt = Math.min(pending.index, next.length);
      next.splice(insertAt, 0, pending.item);
      return next;
    });
  }, []);

  const updateAlias = useCallback((id: string, alias: string) => {
    setFavorites((prev) =>
      prev.map((f) => (f.id === id ? { ...f, alias } : f)),
    );
  }, []);

  const isFavorite = useCallback(
    (lat: number, lon: number) => {
      return favorites.some(
        (f) => Math.abs(f.lat - lat) < 0.001 && Math.abs(f.lon - lon) < 0.001,
      );
    },
    [favorites],
  );

  const reorderFavorites = useCallback((reordered: Favorite[]) => {
    setFavorites(reordered);
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      addFavorite,
      removeFavorite,
      undoDelete,
      updateAlias,
      isFavorite,
      reorderFavorites,
    }),
    [favorites, addFavorite, removeFavorite, undoDelete, updateAlias, isFavorite, reorderFavorites],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
