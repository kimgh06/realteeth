import { createContext, useContext } from "react";

export interface SelectedLocation {
  lat: number;
  lon: number;
  name: string;
}

export interface SelectedLocationContextValue {
  selected: SelectedLocation | null;
  select: (loc: SelectedLocation) => void;
  clearSelection: () => void;
}

export const SelectedLocationContext =
  createContext<SelectedLocationContextValue | null>(null);

export function useSelectedLocation() {
  const ctx = useContext(SelectedLocationContext);
  if (!ctx)
    throw new Error(
      "useSelectedLocation must be used within SelectedLocationProvider",
    );
  return ctx;
}
