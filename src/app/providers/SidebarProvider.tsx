import { useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarContext } from "@/shared/lib/useSidebar";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Auto-close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((p) => !p), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}
