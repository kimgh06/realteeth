import { useState, useCallback, useMemo, type ReactNode } from "react";
import {
  SelectedLocationContext,
  type SelectedLocation,
} from "@/shared/lib/useSelectedLocation";

export function SelectedLocationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<SelectedLocation | null>(null);

  const select = useCallback((loc: SelectedLocation) => {
    setSelected(loc);
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const value = useMemo(
    () => ({ selected, select, clearSelection }),
    [selected, select, clearSelection],
  );

  return (
    <SelectedLocationContext.Provider value={value}>
      {children}
    </SelectedLocationContext.Provider>
  );
}
