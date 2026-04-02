import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Unit = "C" | "F";

interface TempUnitContextValue {
  unit: Unit;
  toggle: () => void;
  convert: (celsius: number) => number;
}

const TempUnitContext = createContext<TempUnitContextValue | null>(null);

export function TempUnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<Unit>(
    () => (localStorage.getItem("temp-unit") as Unit) ?? "C",
  );

  useEffect(() => {
    localStorage.setItem("temp-unit", unit);
  }, [unit]);

  const toggle = () => setUnit((u) => (u === "C" ? "F" : "C"));
  const convert = (c: number) =>
    unit === "F" ? Math.round(c * 9 / 5 + 32) : c;

  return (
    <TempUnitContext.Provider value={{ unit, toggle, convert }}>
      {children}
    </TempUnitContext.Provider>
  );
}

export function useTempUnit() {
  const ctx = useContext(TempUnitContext);
  if (!ctx) throw new Error("useTempUnit must be used within TempUnitProvider");
  return ctx;
}
